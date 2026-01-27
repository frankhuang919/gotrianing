
import { create } from 'zustand';
import { parseSGF, SGFNode } from '../utils/sgfParser';

interface Point {
    x: number;
    y: number;
    c: number; // 1=Black, -1=White
}

interface TesujiState {
    // Data
    currentProblemId: string | null;
    sgfRoot: SGFNode | null;
    currentNode: SGFNode | null;

    // Board Status
    boardStones: Point[]; // Current stones on board
    initialStones: Point[]; // Setup stones (AB/AW)

    // Play Status
    status: 'playing' | 'correct' | 'wrong';
    feedback: string;
    isBlackTurn: boolean;

    // Actions
    loadProblem: (sgfContent: string, problemId: string) => void;
    playMove: (x: number, y: number) => void;
    retry: () => void;
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
    // AB: Add Black
    if (node.props.AB) {
        node.props.AB.forEach(v => {
            const c = decodeCoord(v);
            if (c) stones.push({ ...c, c: 1 });
        });
    }
    // AW: Add White
    if (node.props.AW) {
        node.props.AW.forEach(v => {
            const c = decodeCoord(v);
            if (c) stones.push({ ...c, c: -1 });
        });
    }
    return stones;
};

export const useTesujiStore = create<TesujiState>((set, get) => ({
    currentProblemId: null,
    sgfRoot: null,
    currentNode: null,
    boardStones: [],
    initialStones: [],
    status: 'playing',
    feedback: '黑先 (Black to Play)',
    isBlackTurn: true, // Default to Black first for most Tesuji

    loadProblem: (sgfContent, problemId) => {
        const root = parseSGF(sgfContent);
        if (!root) {
            set({ feedback: 'Error parsing SGF' });
            return;
        }

        const setup = getSetupStones(root);
        // Determine first turn: Usually Black, but check PL property if exists
        let blackTurn = true;
        if (root.props.PL) {
            blackTurn = root.props.PL[0] === 'B';
        }

        const title = root.props.GN ? root.props.GN[0] : (root.props.C ? root.props.C[0] : problemId);

        set({
            currentProblemId: problemId,
            sgfRoot: root,
            currentNode: root,
            initialStones: setup,
            boardStones: [...setup],
            status: 'playing',
            feedback: `题目: ${title}`,
            isBlackTurn: blackTurn
        });
    },

    playMove: (x, y) => {
        const { currentNode, boardStones, isBlackTurn, status } = get();
        if (status !== 'playing' || !currentNode) return;

        // Convert x,y to "aa"
        const coord = String.fromCharCode(x + 97) + String.fromCharCode(y + 97);

        // Find if this move exists in children
        // Current Turn Prop: 'B' or 'W'
        const expectedProp = isBlackTurn ? 'B' : 'W';

        const nextNode = currentNode.children.find(child =>
            child.props[expectedProp] && child.props[expectedProp][0] === coord
        );

        if (nextNode) {
            // Correct-ish move (it exists in the SGF book)
            // Update Board
            const newStone = { x, y, c: isBlackTurn ? 1 : -1 };

            // Check for Comments/Explanation
            const comment = nextNode.props.C ? nextNode.props.C[0] : '';

            // Determine Correct/Wrong based on SGF tags or comment content
            // Simple heuristic: If comment says "Wrong" or "Failure" -> Wrong
            // If leaf node and no "Wrong" text -> Correct?
            // BETTER: Just show the comment and let user decide, but we can set status if it's explicitly end of branch
            let newStatus: any = 'playing';

            // Auto-Response Logic for Opponent? 
            // If user just played, check if nextNode has only ONE child which is opponent move.
            // But first, update state.

            set({
                currentNode: nextNode,
                boardStones: [...boardStones, newStone],
                isBlackTurn: !isBlackTurn,
                feedback: comment || '...'
            });

            // If it's a leaf node, round over
            if (nextNode.children.length === 0) {
                // Try to guess status
                if ((comment && comment.includes('失败')) || (comment && comment.includes('Wrong'))) {
                    set({ status: 'wrong', feedback: comment || '失败 (Wrong)' });
                } else {
                    set({ status: 'correct', feedback: comment || '正解 (Correct)' });
                }
            } else {
                // If it was User's turn, trigger auto-opponent move after delay?
                // For simplicity: Immediately execute opponent move if only 1 variation exists for opponent
                // AND if the current node doesn't explicitly mark a 'result' yet.
                // NOTE: For 'Wrong' moves, SGF often has opponent refutation.
                // We should probably just let the user Play the move, then auto-play the refutation.
            }

        } else {
            // Move NOT in SGF
            // Set as 'Wrong' immediately? Or allowed but 'Check' fails?
            // For rigorous Tesuji, usually "Not in SGF" = "Wrong".
            set({
                feedback: '此手不在正解或已知变化图中 (Not in book)',
                status: 'wrong'
            });
        }
    },

    retry: () => {
        const { initialStones, sgfRoot } = get();
        set({
            currentNode: sgfRoot,
            boardStones: [...initialStones],
            status: 'playing',
            feedback: '重试 (Returning to start)',
            isBlackTurn: true // Reset to Black (simplify)
        });
    }

}));
