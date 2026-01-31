import { create } from 'zustand';
import { loadJosekiFile } from '../data/joseki_loader';
import type { JosekiNode, JosekiType } from '../data/joseki_loader';

export type TrainingPhase = 'DEMO' | 'PRACTICE_WHITE' | 'TRANSITION' | 'PRACTICE_BLACK' | 'COMPLETED';

export interface JosekiState {
    // Selection
    selectedType: JosekiType | null;
    isLoading: boolean;

    // Training State
    phase: TrainingPhase;
    rootNode: JosekiNode | null;
    currentNode: JosekiNode | null;
    currentPath: JosekiNode[]; // The current line being played

    // Board State
    boardStones: { x: number, y: number, c: 1 | -1 }[]; // 1=B, -1=W
    lastMove: { x: number, y: number } | null;

    // Feedback
    feedback: string;
    isCorrect: boolean | null; // null=neutral, true=green, false=red

    // Actions
    selectType: (type: JosekiType) => Promise<void>;
    startPractice: () => void;
    playMove: (x: number, y: number) => void;
    nextProblem: () => void; // Randomly pick another branch? For now, resets or picks new line if we implemented multi-line logic
    reset: () => void;
}

// Helper to find main line
const getBestSequence = (root: JosekiNode): JosekiNode[] => {
    const path: JosekiNode[] = [];
    let curr = root;
    // Skip Root Node itself if it's metadata (x=-1)
    if (curr.x === -1) {
        const bestChild = curr.children && curr.children.length > 0
            ? (curr.children.find(c => !c.isDont) || curr.children[0])
            : null;
        if (bestChild) curr = bestChild;
        else return [];
    }

    path.push(curr);

    while (curr.children && curr.children.length > 0) {
        // Filter out Bad moves and Tenuki (Pass)
        // Prefer !isDont.
        const valid = curr.children.filter(c => !c.isDont && c.x >= 0);
        if (valid.length === 0) {
            // Fallback to anything that isn't Tenuki?
            const anyMove = curr.children.find(c => c.x >= 0);
            if (anyMove) curr = anyMove;
            else break;
        } else {
            // Prefer children that have children? (Longest path)
            // For now, just take first valid
            curr = valid[0];
        }
        path.push(curr);
    }
    return path;
};

export const useJosekiStore = create<JosekiState>((set, get) => ({
    selectedType: null,
    isLoading: false,

    phase: 'DEMO',
    rootNode: null,
    currentNode: null,
    currentPath: [],

    boardStones: [],
    lastMove: null,
    feedback: 'Select a Joseki to start',
    isCorrect: null,

    selectType: async (type) => {
        set({ isLoading: true, selectedType: type });
        const root = await loadJosekiFile(type);
        set({
            isLoading: false,
            rootNode: root,
            currentNode: root,
            boardStones: [],
            lastMove: null,
            phase: 'DEMO',
            feedback: 'Observing Demo...'
        });

        // Start Demo Animation
        get().reset(); // Use internal reset logic to start demo
    },

    startPractice: () => {
        // Switch to Practice White
        const root = get().rootNode;
        if (!root) return;

        set({
            phase: 'PRACTICE_WHITE',
            currentNode: root,
            boardStones: [],
            lastMove: null,
            feedback: 'Your Turn: Play White (Wait for Black first move)',
            isCorrect: null
        });

        // App plays Black (First move of sequence)
        // Use helper to find best line (skipping root if needed)
        const sequence = getBestSequence(root);

        if (sequence.length > 0) {
            const move = sequence[0];

            // Execute Black Move
            setTimeout(() => {
                set((state: JosekiState) => ({
                    boardStones: [...state.boardStones, { x: move.x, y: move.y, c: 1 }],
                    lastMove: { x: move.x, y: move.y },
                    currentNode: move,
                    feedback: 'Your Turn: Play White'
                }));
            }, 500);
        }
    },

    playMove: (x, y) => {
        const { phase, currentNode, boardStones } = get();
        if (phase !== 'PRACTICE_WHITE' && phase !== 'PRACTICE_BLACK') return;

        // Check Validity
        const children = currentNode?.children || [];
        const matchedChild = children.find(c => c.x === x && c.y === y);

        if (matchedChild) {
            // Check if "Don't" (Bad Move)
            if (matchedChild.isDont) {
                set({
                    feedback: 'Mistake: This is a known bad move.',
                    isCorrect: false
                });
                return;
            }

            // CORRECT MOVE
            const color = phase === 'PRACTICE_WHITE' ? -1 : 1;

            set({
                boardStones: [...boardStones, { x, y, c: color as 1 | -1 }],
                lastMove: { x, y },
                currentNode: matchedChild,
                feedback: 'Correct!',
                isCorrect: true
            });

            // Check Termination (Leaf or Tenuki)
            const nextChildren = matchedChild.children;
            const isTenukiNext = nextChildren.some(c => c.x === -1 && c.y === -1);

            if (nextChildren.length === 0 || isTenukiNext) {
                // SUCCESS -> Next Phase
                setTimeout(() => {
                    handlePhaseSuccess(set, get);
                }, 1000);
            } else {
                // OPPONENT RESPONSE
                // Filter out Bad moves AND Tenuki markers (we already handled tenuki check above?)
                // Wait, if Tenuki is an option, should opponent Play it?
                // If opponent plays Tenuki, it means opponent stops playing. So Success.
                // So filter valid physical moves.
                const validResponses = nextChildren.filter(c => !c.isDont && c.x !== -1);

                const response = validResponses.length > 0
                    ? validResponses[Math.floor(Math.random() * validResponses.length)]
                    : (nextChildren.length > 0 ? nextChildren[0] : null); // Fallback to whatever

                if (response) {
                    setTimeout(() => {
                        const oppColor = color === 1 ? -1 : 1;
                        set((state: JosekiState) => ({
                            boardStones: [...state.boardStones, { x: response.x, y: response.y, c: oppColor as 1 | -1 }],
                            lastMove: { x: response.x, y: response.y },
                            currentNode: response,
                            feedback: 'Your Turn',
                            isCorrect: null
                        }));

                        // Check Termination again
                        const oppNext = response.children;
                        const oppTenuki = oppNext.some(c => c.x === -1 && c.y === -1);
                        if (oppNext.length === 0 || oppTenuki) {
                            setTimeout(() => {
                                handlePhaseSuccess(set, get);
                            }, 1000);
                        }
                    }, 500);
                } else {
                    // No responses -> End
                    setTimeout(() => {
                        handlePhaseSuccess(set, get);
                    }, 1000);
                }
            }

        } else {
            // WRONG MOVE
            set({
                feedback: 'Not a Joseki move. Try again.',
                isCorrect: false
            });
        }
    },

    nextProblem: () => {
        // Cycle or Random? For now just reset.
        // Actually, "Next Problem" implies finding a different variation?
        // Pachi files are single trees. So it means "Start Over".
        get().startPractice();
    },

    reset: () => {
        // Reset Logic
        set({
            phase: 'DEMO',
            boardStones: [],
            lastMove: null,
            feedback: 'Demo Mode'
        });
        runDemo(set, get);
    }
}));

const handlePhaseSuccess = (set: any, get: any) => {
    const { phase } = get();
    if (phase === 'PRACTICE_WHITE') {
        set({ phase: 'TRANSITION', feedback: 'Good! Switching to Black...', isCorrect: true });
        setTimeout(() => {
            startBlackPhase(set, get);
        }, 2000);
    } else if (phase === 'PRACTICE_BLACK') {
        set({ phase: 'COMPLETED', feedback: 'Joseki Completed!', isCorrect: true });
    }
};

const startBlackPhase = (set: any, get: any) => {
    const { rootNode } = get();
    // Setup first 2 moves (B then W)
    // Assuming Main Line
    if (!rootNode || rootNode.children.length === 0) return;

    const m1 = rootNode.children[0];
    let board = [{ x: m1.x, y: m1.y, c: 1 }];
    let curr = m1;

    if (m1.children.length > 0) {
        const m2 = m1.children[0];
        board.push({ x: m2.x, y: m2.y, c: -1 });
        curr = m2;
    }

    set({
        phase: 'PRACTICE_BLACK',
        boardStones: board as any[],
        lastMove: board.length > 0 ? { x: board[board.length - 1].x, y: board[board.length - 1].y } : null,
        currentNode: curr,
        feedback: 'Your Turn: Play Black (Move 3)',
        isCorrect: null
    });
};

const runDemo = (set: any, get: any) => {
    // Traverse main line for demo
    const { rootNode } = get();
    if (!rootNode) return;

    const path = getBestSequence(rootNode); // Use helper

    // Animate
    let i = 0;
    const interval = setInterval(() => {
        const { phase } = get();
        if (phase !== 'DEMO') {
            clearInterval(interval);
            return;
        }

        if (i < path.length) {
            const node = path[i];
            set((state: JosekiState) => ({
                boardStones: [...state.boardStones, {
                    x: node.x,
                    y: node.y,
                    c: node.color === 'B' ? 1 : -1
                }],
                lastMove: { x: node.x, y: node.y }
            }));
            i++;
        } else {
            clearInterval(interval);
            set({ feedback: 'Demo Finished. Ready?' });
        }
    }, 1000);
};
