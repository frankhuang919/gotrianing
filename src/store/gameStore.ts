
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { josekiLibrary, type JosekiPattern } from '../data/joseki_library';
import { parseSGF, type SGFNode } from '../utils/sgfParser';

interface GameState {
    chips: number;
    status: 'WELCOME' | 'STUDY' | 'IDLE' | 'PLAYING' | 'LOCKED' | 'REFUTATION' | 'WIN';
    feedback: string;
    josekiMeta?: JosekiPattern;
    sgfNode: SGFNode | null;
    boardState: { x: number; y: number; c: number }[];
    initialStones: { x: number; y: number; c: number }[];
    wrongMoveFlash: { x: number; y: number } | null;

    // Actions
    loadRandomJoseki: () => void;
    loadSGF: (sgfContent: string, title: string) => void;
    playMove: (x: number, y: number) => void;
    startChallenge: () => void;
    reset: () => void;
    setFeedback: (msg: string) => void;
    deductChips: (amount: number) => void;
    enterWelcome: () => void;

    // Internal
    _triggerRefutation: (variationNode: SGFNode) => void;
    _runDemo: () => void;
}

// Helper: Decode SGF Coordinate (e.g. "pd" -> 15,3 or [15,3] -> 15,3)
const decodeCoord = (val: any): { x: number, y: number } | null => {
    if (!val) return null;

    // Custom Parser returns array of strings for properties
    // If it's Array [x, y] (Legacy WGo parser often does this, keep for safety?)
    // But our parser returns string "pd" usually.

    if (typeof val === 'string' && val.length >= 2) {
        const x = val.charCodeAt(0) - 97; // 'a' code is 97
        const y = val.charCodeAt(1) - 97;
        return { x, y };
    }

    return null;
};

const getMoveFromNode = (node: SGFNode) => {
    let coord = null;
    let c = 0;

    // Check props.B (Black)
    if (node.props.B && node.props.B.length > 0) {
        coord = decodeCoord(node.props.B[0]);
        c = 1;
    }
    // Check props.W (White)
    else if (node.props.W && node.props.W.length > 0) {
        coord = decodeCoord(node.props.W[0]);
        c = -1;
    }

    if (coord) {
        return { x: coord.x, y: coord.y, c };
    }
    return null;
};

// Helper: Extract Initial Setup Stones (AW/AB)
const getSetupStones = (node: SGFNode): { x: number, y: number, c: number }[] => {
    const stones: { x: number, y: number, c: number }[] = [];
    if (!node) return stones;

    // Helper to process property values
    const processProps = (props: string[] | undefined, color: number) => {
        if (!props) return;
        props.forEach((val) => {
            const coord = decodeCoord(val);
            if (coord) {
                stones.push({ x: coord.x, y: coord.y, c: color });
            }
        });
    };

    // Check AW (White) - Color -1
    processProps(node.props.AW, -1);
    // Check AB (Black) - Color 1
    processProps(node.props.AB, 1);

    return stones;
};


export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            chips: 100,
            status: 'WELCOME',
            feedback: '等待开始...',
            josekiMeta: undefined,
            sgfNode: null, // SGFNode | null
            boardState: [],
            initialStones: [],
            wrongMoveFlash: null,

            loadRandomJoseki: () => {
                const { josekiMeta } = get();
                // Filter out current joseki to ensure variety
                const candidates = josekiLibrary.filter(p => !josekiMeta || p.id !== josekiMeta.id);
                // Fallback if no candidates (shouldn't happen with library > 1)
                const pool = candidates.length > 0 ? candidates : josekiLibrary;

                const randomIndex = Math.floor(Math.random() * pool.length);
                const pattern = pool[randomIndex];
                console.log('Loading Joseki:', pattern.title);

                try {
                    const root = parseSGF(pattern.sgf);
                    console.log('Parsed SGF Root:', root);

                    if (!root) {
                        console.error('SGF Root is null! Parser failed.');
                        set({ feedback: 'Parse Error: Failed to parse SGF' });
                        return;
                    }

                    // Extract initial stones
                    const initialStones = getSetupStones(root);
                    console.log('Initial Stones extracted:', initialStones);

                    set({
                        sgfNode: root,
                        boardState: initialStones,
                        initialStones: initialStones,
                        status: 'STUDY',
                        josekiMeta: pattern,
                        feedback: `正在演示：${pattern.title}。请仔细记忆！`,
                        wrongMoveFlash: null
                    });

                    get()._runDemo();
                } catch (e) {
                    console.error('SGF Load Failed', e);
                    set({ feedback: 'Parse Error: ' + String(e) });
                }
            },

            loadSGF: (sgfContent, title) => {
                try {
                    const root = parseSGF(sgfContent);
                    if (!root) throw new Error("Failed to parse SGF");

                    // Extract initial stones
                    const initialStones = getSetupStones(root);

                    set({
                        sgfNode: root,
                        boardState: initialStones,
                        initialStones: initialStones,
                        status: 'STUDY',
                        josekiMeta: {
                            id: 'custom',
                            title,
                            difficulty: 3,
                            sgf: sgfContent,
                            description: 'Custom SGF',
                            usage: 'Custom Pattern'
                        },
                        feedback: `正在演示：${title}。请仔细记忆！`,
                        wrongMoveFlash: null
                    });

                    get()._runDemo();
                } catch (e) {
                    console.error('SGF Load Failed', e);
                }
            },

            startChallenge: () => {
                const { initialStones } = get();
                set({
                    status: 'PLAYING', // Skip LOCKED, go straight to playing
                    boardState: [...initialStones], // Restore initial setup
                    feedback: '请在棋盘上落子 (点击棋盘)'
                });
            },

            playMove: (x, y) => {
                const { status, sgfNode, deductChips, _triggerRefutation } = get();
                if (status !== 'PLAYING') return;
                if (!sgfNode || !sgfNode.children) return;

                const children = sgfNode.children;
                let match = null;
                let isMain = false;

                // Debug info
                console.log('Player Move:', x, y);
                // console.log('Current Node Children:', children);

                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    const move = getMoveFromNode(child);
                    console.log('Checking child', i, 'Expected:', move);

                    if (move && move.x === x && move.y === y && move.c === 1) {
                        match = child;
                        if (i === 0) isMain = true; // Heuristic: first variation is main
                        break;
                    }
                }

                if (match) {
                    set((state) => ({
                        boardState: [...state.boardState, { x, y, c: 1 }],
                        sgfNode: match,
                        wrongMoveFlash: null
                    }));

                    if (isMain) {
                        set({ feedback: '太棒了！请继续思考下一手...' });

                        if (match.children && match.children.length > 0) {
                            const nextNode = match.children[0];
                            const aiMove = getMoveFromNode(nextNode);

                            if (aiMove && aiMove.c === -1) {
                                setTimeout(() => {
                                    set((state) => ({
                                        boardState: [...state.boardState, { x: aiMove.x, y: aiMove.y, c: -1 }],
                                        sgfNode: nextNode,
                                        feedback: (nextNode.props.C && nextNode.props.C[0]) || 'AI 应答'
                                    }));
                                    if (!nextNode.children || nextNode.children.length === 0) {
                                        set({ status: 'WIN', feedback: '定式完成！奖励 10 筹码' });
                                        set(state => ({ chips: state.chips + 10 }));
                                    }
                                }, 500);
                            } else {
                                set({ status: 'WIN', feedback: '定式完成！奖励 10 筹码' });
                                set(state => ({ chips: state.chips + 10 }));
                            }
                        } else {
                            set({ status: 'WIN', feedback: '定式完成！奖励 10 筹码' });
                            set(state => ({ chips: state.chips + 10 }));
                        }

                    } else {
                        set({ wrongMoveFlash: { x, y } });
                        deductChips(20);
                        _triggerRefutation(match);
                    }

                } else {
                    set({ wrongMoveFlash: { x, y } });
                    deductChips(20);
                    set({ feedback: '错误！看看 AI 是如何惩罚这手棋的。' });
                    setTimeout(() => set({ wrongMoveFlash: null }), 1000);
                }
            },

            _triggerRefutation: (variationNode) => {
                set({ status: 'REFUTATION', feedback: (variationNode.props.C && variationNode.props.C[0]) || '演示反击变化图...' });

                const sequence: SGFNode[] = [];
                let current = variationNode;
                while (current.children && current.children.length > 0) {
                    current = current.children[0];
                    sequence.push(current);
                }

                if (sequence.length === 0) {
                    setTimeout(() => {
                        set({ feedback: '请重新尝试。', status: 'PLAYING' });
                    }, 1000);
                    return;
                }

                let step = 0;
                const currentBoardState = get().boardState;
                const stateBeforeWrongMove = currentBoardState.slice(0, -1);

                const interval = setInterval(() => {
                    if (step >= Math.min(sequence.length, 5)) {
                        clearInterval(interval);
                        setTimeout(() => {
                            set({
                                boardState: stateBeforeWrongMove,
                                status: 'PLAYING',
                                feedback: '请重新尝试正确的一手。',
                            });
                        }, 1500);
                        return;
                    }

                    const node = sequence[step];
                    const move = getMoveFromNode(node);
                    if (move) {
                        set(state => ({
                            boardState: [...state.boardState, move],
                            wrongMoveFlash: null
                        }));
                    }
                    step++;
                }, 800);
            },

            _runDemo: () => {
                const { sgfNode } = get();
                // console.log('Run Demo started. Root:', sgfNode);
                if (!sgfNode) return;

                const sequence: SGFNode[] = [];
                let current = sgfNode;

                // Traverse main line
                // Safety: Avoid infinite loops
                let limit = 100;
                while (current.children && current.children.length > 0 && limit > 0) {
                    current = current.children[0];
                    sequence.push(current);
                    limit--;
                }
                // console.log('Demo Sequence extracted:', sequence.length, 'moves');

                let step = 0;
                // Clear any existing interval if we re-run? 
                // Ideally store interval ID in state to clear it, but for now relying on closure capture might be racy if called multiple times.
                // Assuming single instance behavior for prototype.

                const interval = setInterval(() => {
                    if (get().status !== 'STUDY') {
                        clearInterval(interval);
                        return;
                    }
                    if (step >= sequence.length) {
                        clearInterval(interval);
                        set({ feedback: '演示完毕。点击“开始挑战”进行测试。' });
                        // console.log('Demo finished');
                        return;
                    }
                    const node = sequence[step];
                    const move = getMoveFromNode(node);
                    // console.log('Demo Step', step, 'Move:', move);

                    if (move) {
                        set(state => {
                            // Avoid duplicates?
                            const exists = state.boardState.some(s => s.x === move.x && s.y === move.y);
                            if (exists) return {};

                            const newState = [...state.boardState, move];
                            return { boardState: newState };
                        });
                    }
                    step++;
                }, 1000); // Slightly faster demo
            },

            deductChips: (amount) => set((state) => ({ chips: Math.max(0, state.chips - amount) })),
            enterWelcome: () => set({ status: 'WELCOME', boardState: [], sgfNode: null, initialStones: [] }),
            setFeedback: (msg) => set({ feedback: msg }),
            reset: () => set({ status: 'WELCOME' }),
        }),
        {
            name: 'zengo-storage',
            partialize: (state) => ({ chips: state.chips }),
        }
    )
);
