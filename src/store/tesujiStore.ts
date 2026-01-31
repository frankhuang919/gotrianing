import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseSGF, type SGFNode } from '../utils/sgfParser';
import { loadTesujiVolumes, type TesujiVolume, type TesujiProblem } from '../data/tesuji_loader';
import { resolveBoardState } from '../utils/goLogic';

interface Point {
    x: number;
    y: number;
    c: number; // 1=Black, -1=White
}

interface TesujiState {
    // Library Data
    volumes: TesujiVolume[];
    flatProblems: TesujiProblem[];
    isLoadingLibrary: boolean;

    // Persistence
    mistakeBookIds: string[]; // List of problem IDs
    problemStats: Record<string, { attempts: number; solved: number }>;

    // Current Problem Data
    currentProblemId: string | null;
    sgfRoot: SGFNode | null;
    currentNode: SGFNode | null;

    // Board Status
    boardStones: Point[]; // Current stones on board
    setupStones: Point[]; // Setup stones (AB/AW)

    // Play Status
    status: 'playing' | 'correct' | 'wrong' | 'solution';
    feedback: string;
    isBlackTurn: boolean;

    // Behavioral Controls
    lockEndTime: number; // Timestamp when lock expires (0 if unlocked)
    sessionMistakes: number; // Wrong attempts in current session

    // Actions
    loadLibrary: () => Promise<void>;
    loadProblem: (sgfContent: string, problemId: string) => void;
    loadNextProblem: () => void;
    playMove: (x: number, y: number) => void;
    retry: () => void;
    checkLock: () => void; // Call periodically to clear lock if expired? Or just derive in UI.
    showSolution: () => void;
    restoreSession: () => void;
}

// Helper: Decode "aa" -> {x:0, y:0}
const decodeCoord = (val: string): { x: number, y: number } | null => {
    if (!val || val.length < 2) return null;
    const x = val.charCodeAt(0) - 97;
    const y = val.charCodeAt(1) - 97;
    if (x < 0 || x > 18 || y < 0 || y > 18) return null;
    return { x, y };
};

// Helper: Extract setup stones from node
const getSetupStones = (node: SGFNode): Point[] => {
    const stones: Point[] = [];
    if (node.props.AB) {
        node.props.AB.forEach(v => {
            const c = decodeCoord(v);
            if (c) stones.push({ ...c, c: 1 });
        });
    }
    if (node.props.AW) {
        node.props.AW.forEach(v => {
            const c = decodeCoord(v);
            if (c) stones.push({ ...c, c: -1 });
        });
    }
    return stones;
};

export const useTesujiStore = create<TesujiState>()(
    persist(
        (set, get) => ({
            volumes: [],
            flatProblems: [],
            isLoadingLibrary: false,
            mistakeBookIds: [],
            problemStats: {},

            currentProblemId: null,
            sgfRoot: null,
            currentNode: null,
            boardStones: [],
            setupStones: [],
            status: 'playing',
            feedback: '黑先 (Black to Play)',
            isBlackTurn: true,

            lockEndTime: 0,
            sessionMistakes: 0,

            loadLibrary: async () => {
                set({ isLoadingLibrary: true });
                try {
                    const volumes = await loadTesujiVolumes();
                    const flatProblems: TesujiProblem[] = [];
                    let globalIndex = 1;

                    volumes.forEach(v => {
                        v.chapters.forEach(c => {
                            c.problems.forEach(p => {
                                p.label = `第 ${globalIndex++} 题`;
                                flatProblems.push(p);
                            });
                        });
                    });

                    console.log("Library loaded:", flatProblems.length, "problems");
                    set({ volumes, flatProblems, isLoadingLibrary: false });
                } catch (e) {
                    console.error("Failed to load library", e);
                    set({ isLoadingLibrary: false, feedback: "加载题库失败" });
                }
            },

            restoreSession: () => {
                const { flatProblems, currentProblemId, loadProblem, sgfRoot } = get();
                if (currentProblemId && !sgfRoot && flatProblems.length > 0) {
                    const p = flatProblems.find(x => x.id === currentProblemId);
                    if (p) {
                        console.log("Restoring Session:", currentProblemId);
                        loadProblem(p.sgf, p.id);
                    }
                }
            },

            loadProblem: (sgfContent, problemId) => {
                const root = parseSGF(sgfContent);
                if (!root) {
                    set({ feedback: 'Error parsing SGF' });
                    return;
                }

                const { flatProblems } = get();
                const meta = flatProblems.find(p => p.id === problemId);
                const displayTitle = meta?.label || `题目: ${problemId}`;

                const setup = getSetupStones(root);
                let blackTurn = true;
                if (root.props.PL) {
                    blackTurn = root.props.PL[0] === 'B';
                }

                // Standardized Format: Title \n Turn (Always consistent)
                const turnStr = blackTurn ? '黑先' : '白先';
                const feedbackText = `${displayTitle}\n${turnStr}`;

                // THINKING LOCK: 15s
                const lockTime = Date.now() + 15000;

                // Track Stats
                const { problemStats } = get();
                const newStats = { ...problemStats };
                const pStats = newStats[problemId] || { attempts: 0, solved: 0 };
                newStats[problemId] = { ...pStats, attempts: pStats.attempts + 1 };

                set({
                    currentProblemId: problemId,
                    sgfRoot: root,
                    currentNode: root,
                    setupStones: setup,
                    boardStones: [...setup],
                    status: 'playing',
                    feedback: `🔒 思考时间 (Thinking)... ${feedbackText}`,
                    isBlackTurn: blackTurn,
                    lockEndTime: lockTime,
                    sessionMistakes: 0, // Reset mistakes for new problem
                    problemStats: newStats
                });
            },

            loadNextProblem: () => {
                const { flatProblems, currentProblemId, loadProblem } = get();
                if (!currentProblemId || flatProblems.length === 0) return;

                const idx = flatProblems.findIndex(p => p.id === currentProblemId);
                if (idx !== -1 && idx < flatProblems.length - 1) {
                    const next = flatProblems[idx + 1];
                    loadProblem(next.sgf, next.id);
                } else {
                    set({ feedback: '已是最后一题！' });
                }
            },

            checkLock: () => {
                // UI component will check Date.now() vs lockEndTime
            },

            playMove: (x, y) => {
                const { currentNode, boardStones, isBlackTurn, status, lockEndTime, sessionMistakes, mistakeBookIds, currentProblemId } = get();

                // CHECK LOCK
                if (Date.now() < lockEndTime) {
                    return; // Ignore clicks while locked
                }

                if (status !== 'playing' || !currentNode) return;

                const coord = String.fromCharCode(x + 97) + String.fromCharCode(y + 97);
                const expectedProp = isBlackTurn ? 'B' : 'W';

                const nextNode = currentNode.children.find(child =>
                    child.props[expectedProp] && child.props[expectedProp][0] === coord
                );

                if (nextNode) {
                    // Valid SGF Move
                    const newStone = { x, y, c: isBlackTurn ? 1 : -1 };
                    const comment = nextNode.props.C ? nextNode.props.C[0] : '';
                    const isLeaf = nextNode.children.length === 0;

                    // Update state immediately
                    set({
                        currentNode: nextNode,
                        boardStones: resolveBoardState(boardStones, newStone),
                        isBlackTurn: !isBlackTurn, // Toggle for now, but if leaf or opponent turn might change
                        feedback: comment || (isLeaf ? '演示结束' : '对手思考中...')
                    });

                    // Check Pass/Fail based on Leaf or Comment
                    let isFail = (comment && (comment.includes('失败') || comment.includes('Wrong')));

                    if (isLeaf) {
                        // End of branch
                        if (isFail) {
                            // WRONG (Leaf)
                            handleWrong();
                        } else {
                            // CORRECT
                            // Mark Solved if < 3 mistakes
                            const { problemStats, currentProblemId, sessionMistakes } = get();
                            if (currentProblemId && sessionMistakes < 3) {
                                const stats = problemStats[currentProblemId] || { attempts: 0, solved: 0 };
                                set({ problemStats: { ...problemStats, [currentProblemId]: { ...stats, solved: stats.solved + 1 } } });
                            }

                            set({ status: 'correct', feedback: comment || '正解!' });
                            setTimeout(() => { get().loadNextProblem(); }, 1500);
                        }
                    } else {
                        // Opponent Turn (if not leaf)
                        setTimeout(() => {
                            const { currentNode: updatedNode, isBlackTurn: currentTurn } = get();
                            if (!updatedNode) return;

                            // Opponent Logic (Main Variation 0)
                            const opponentNode = updatedNode.children[0];
                            if (!opponentNode) return;

                            // Opponent plays
                            const oppProp = currentTurn ? 'B' : 'W';
                            const oppColor = currentTurn ? 1 : -1;

                            if (opponentNode.props[oppProp]) {
                                const raw = opponentNode.props[oppProp][0];
                                const c = decodeCoord(raw);
                                if (c) {
                                    const oppStone = { ...c, c: oppColor };
                                    const oppMsg = opponentNode.props.C ? opponentNode.props.C[0] : '';

                                    set(s => ({
                                        currentNode: opponentNode,
                                        boardStones: resolveBoardState(s.boardStones, oppStone),
                                        isBlackTurn: !s.isBlackTurn, // Back to User
                                        feedback: oppMsg || '请继续...'
                                    }));

                                    // Check if opponent ended it
                                    if (opponentNode.children.length === 0) {
                                        const isFailure = oppMsg && (oppMsg.includes('失败') || oppMsg.includes('Wrong') || oppMsg.includes('Failure'));

                                        if (isFailure) {
                                            // Explicit Failure
                                            set({ feedback: oppMsg || '被破解了 (Refuted)' });
                                            handleWrong();
                                        } else {
                                            // Implicit Correct (Main line ended)
                                            const { problemStats, currentProblemId, sessionMistakes } = get();
                                            if (currentProblemId && sessionMistakes < 3) {
                                                const stats = problemStats[currentProblemId] || { attempts: 0, solved: 0 };
                                                set({ problemStats: { ...problemStats, [currentProblemId]: { ...stats, solved: stats.solved + 1 } } });
                                            }

                                            set({ status: 'correct', feedback: oppMsg || '正解!' });
                                            setTimeout(() => { get().loadNextProblem(); }, 1500);
                                        }
                                    }
                                }
                            }
                        }, 500);
                    }

                    function handleWrong() {
                        const newMistakes = sessionMistakes + 1;
                        let penaltyTime = 0;
                        let penaltyMsg = '';

                        if (newMistakes === 1) {
                            penaltyTime = 30000; // 30s
                            penaltyMsg = '❌ 答错 1 次 (锁定 30s) - 请反思';
                        } else if (newMistakes === 2) {
                            penaltyTime = 60000; // 60s
                            penaltyMsg = '❌ 答错 2 次 (锁定 60s) - 加入错题本';

                            // Add to Mistake Book
                            if (currentProblemId && !mistakeBookIds.includes(currentProblemId)) {
                                set({ mistakeBookIds: [...mistakeBookIds, currentProblemId] });
                            }
                        } else {
                            // 3rd time
                            set({
                                status: 'wrong',
                                sessionMistakes: newMistakes,
                                feedback: '❌ 失败 3 次 - 演示正解...'
                            });
                            setTimeout(() => {
                                get().showSolution();
                            }, 3000);
                            return;
                        }

                        set({
                            status: 'wrong',
                            sessionMistakes: newMistakes,
                            lockEndTime: Date.now() + penaltyTime,
                            feedback: penaltyMsg
                        });
                    }

                } else {
                    // Not in SGF
                    set({ feedback: '❌ 此处无变化 (Not in SGF)' });

                    // Same logic
                    handleWrongOutside();

                    function handleWrongOutside() {
                        const newMistakes = sessionMistakes + 1;
                        let penaltyTime = 0;
                        let penaltyMsg = '';

                        if (newMistakes === 1) {
                            penaltyTime = 30000;
                            penaltyMsg = '❌ 错误 (锁定 30s)';
                        } else if (newMistakes === 2) {
                            penaltyTime = 60000;
                            penaltyMsg = '❌ 错误 (锁定 60s) -> 错题本';
                            if (currentProblemId && !mistakeBookIds.includes(currentProblemId)) {
                                set({ mistakeBookIds: [...mistakeBookIds, currentProblemId] });
                            }
                        } else {
                            // 3rd
                            set({
                                status: 'wrong',
                                sessionMistakes: newMistakes,
                                feedback: '❌ 错误 3 次 - 演示正解...'
                            });
                            setTimeout(() => {
                                get().showSolution();
                            }, 3000);
                            return;
                        }

                        set({
                            status: 'wrong',
                            sessionMistakes: newMistakes,
                            lockEndTime: Date.now() + penaltyTime,
                            feedback: penaltyMsg
                        });
                    }
                }
            },

            retry: () => {
                const { setupStones, sgfRoot } = get();
                set({
                    currentNode: sgfRoot,
                    boardStones: [...setupStones],
                    status: 'playing',
                    feedback: '重试 (Returning to start)',
                    isBlackTurn: true,
                    lockEndTime: 0
                });
            },

            showSolution: () => {
                const { setupStones, sgfRoot } = get();
                // Reset first
                set({
                    currentNode: sgfRoot,
                    boardStones: [...setupStones],
                    status: 'solution',
                    feedback: '💡 3秒后演示正解 (Solution in 3s)...',
                    isBlackTurn: true,
                });

                let lastExplanation = '';

                const step = () => {
                    const { currentNode, isBlackTurn, boardStones, status } = get();
                    if (status !== 'solution') return; // Cancelled?

                    if (!currentNode || currentNode.children.length === 0) {
                        // Demonstration Finished
                        const finalMsg = lastExplanation
                            ? `✅ 演示完毕\n${lastExplanation}`
                            : '✅ 演示完毕. (请点击下一题 👉)';
                        set({ feedback: finalMsg, status: 'correct', lockEndTime: 0 });
                        return;
                    }

                    // Heuristic: Find branch with 'Correct' or 'Tesuji' comment, OR default to index 0
                    let nextNode = currentNode.children.find(c => c.props.C && (c.props.C[0].includes('Correct') || c.props.C[0].includes('正解')));
                    if (!nextNode) nextNode = currentNode.children[0];

                    if (!nextNode) return;

                    // Decode move
                    const expectedProp = isBlackTurn ? 'B' : 'W';
                    if (!nextNode.props[expectedProp]) {
                        // Skip node (e.g. comment node)
                        set({ currentNode: nextNode });
                        setTimeout(step, 800);
                        return;
                    }

                    const raw = nextNode.props[expectedProp][0];
                    const coord = decodeCoord(raw);

                    if (coord) {
                        const color = isBlackTurn ? 1 : -1;
                        const stone = { ...coord, c: color };

                        const comment = nextNode.props.C ? nextNode.props.C[0] : '';
                        if (comment) lastExplanation = comment;

                        set({
                            currentNode: nextNode,
                            boardStones: [...boardStones, stone],
                            isBlackTurn: !isBlackTurn,
                            feedback: comment ? `💡 ${comment}` : '💡 演示中...'
                        });
                    }

                    setTimeout(step, 1000);
                };

                // Start demo after 3 seconds
                setTimeout(step, 3000);
            }
        }),
        {
            name: 'tesuji-storage',
            partialize: (state) => ({
                mistakeBookIds: state.mistakeBookIds,
                problemStats: state.problemStats,
                currentProblemId: state.currentProblemId,
            }),
        }
    )
);
