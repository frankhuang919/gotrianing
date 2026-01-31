
export interface Point {
    x: number;
    y: number;
    c: number; // 1=Black, -1=White
}

/**
 * Calculates the new board state after a move, handling captures.
 * @param currentStones Existing stones on board (excluding the new one usually, or including? handled below)
 * @param newMove The move just being played
 * @returns Updated array of stones with captures removed (and newMove added if not already present)
 */
export function resolveBoardState(currentStones: Point[], newMove: Point): Point[] {
    // 1. Add the new move to the board (temporarily if not already there)
    // Create a map for fast lookup
    const boardMap = new Map<string, number>();
    const stones = [...currentStones];

    // Check if newMove already in stones (shouldn't be for valid move, but safety)
    const exists = stones.findIndex(s => s.x === newMove.x && s.y === newMove.y);
    if (exists !== -1) {
        stones[exists] = newMove; // Overwrite? Should verify empty, but logic here assumes valid move
    } else {
        stones.push(newMove);
    }

    stones.forEach(s => boardMap.set(`${s.x},${s.y}`, s.c));

    const size = 19;
    const opponentColor = -newMove.c;
    const capturedStones: Point[] = [];

    // Helper: Get neighbors
    const getNeighbors = (x: number, y: number) => {
        const n: { x: number, y: number }[] = [];
        if (x > 0) n.push({ x: x - 1, y });
        if (x < size - 1) n.push({ x: x + 1, y });
        if (y > 0) n.push({ x, y: y - 1 });
        if (y < size - 1) n.push({ x, y: y + 1 });
        return n;
    };

    // Helper: Check group liberties
    // Returns true if group has > 0 liberties, false if captured
    const checkGroup = (startX: number, startY: number, color: number): boolean => {
        const stack = [{ x: startX, y: startY }];
        const visited = new Set<string>();
        visited.add(`${startX},${startY}`);
        let hasLiberty = false;

        // Collect group members to potentially remove
        const group: { x: number, y: number }[] = [];

        while (stack.length > 0) {
            const { x, y } = stack.pop()!;
            group.push({ x, y });

            const neighbors = getNeighbors(x, y);
            for (const nb of neighbors) {
                const key = `${nb.x},${nb.y}`;
                if (boardMap.has(key)) {
                    const c = boardMap.get(key);
                    if (c === color && !visited.has(key)) {
                        visited.add(key);
                        stack.push(nb);
                    }
                } else {
                    // Empty point = Liberty!
                    hasLiberty = true;
                    // We can stop checking this group for aliveness logic, 
                    // BUT we must find ALL group members if we wanted to process them later?
                    // Actually, for "Checking if dead", as soon as we find 1 liberty, it's ALIVE.
                    // But if it is DEAD, we need ALL members to remove them.
                    // So if we find a liberty, we can stop traversing? 
                    // YES, because we won't remove it.
                    // However, we are iterating over neighbors of the NEW stone.
                    // If we find a liberty, this neighbor group is safe. 
                }
            }
        }

        if (!hasLiberty) {
            // Dead group

            return false; // No liberties
        }
        return true; // Has liberties
    };

    // Helper: Find full group (duplicated logic but need it to extract stones)
    const getGroupStones = (startX: number, startY: number, color: number): Point[] => {
        const stack = [{ x: startX, y: startY }];
        const visited = new Set<string>();
        visited.add(`${startX},${startY}`);
        const group: Point[] = [];

        while (stack.length > 0) {
            const cur = stack.pop()!;
            group.push({ x: cur.x, y: cur.y, c: color });

            const neighbors = getNeighbors(cur.x, cur.y);
            for (const nb of neighbors) {
                const key = `${nb.x},${nb.y}`;
                if (boardMap.has(key)) {
                    if (boardMap.get(key) === color && !visited.has(key)) {
                        visited.add(key);
                        stack.push(nb);
                    }
                }
            }
        }
        return group;
    };


    // 2. Check for captured opponent stones adjacent to new move
    const neighbors = getNeighbors(newMove.x, newMove.y);
    const checkedOpponentGroups = new Set<string>(); // Keep track of visited opponent stones to avoid re-checking same group

    neighbors.forEach(nb => {
        const key = `${nb.x},${nb.y}`;
        if (boardMap.get(key) === opponentColor && !checkedOpponentGroups.has(key)) {
            // Check this opponent group
            const isAlive = checkGroup(nb.x, nb.y, opponentColor);
            const group = getGroupStones(nb.x, nb.y, opponentColor);

            // Mark as checked
            group.forEach(g => checkedOpponentGroups.add(`${g.x},${g.y}`));

            if (!isAlive) {
                capturedStones.push(...group);
            }
        }
    });

    // 3. Remove captured stones
    let finalStones = stones.filter(s =>
        !capturedStones.some(c => c.x === s.x && c.y === s.y)
    );

    // 4. (Optional) Check suicide?
    // If no opponent stones captured, check if new move is dead.
    // Standard rule: Suicide allowed ONLY if it kills opponent? No, usually forbidden.
    // But in Tesuji problems, if SGF says move exists, we assume it's valid.
    // However, if it IS suicide (0 liberties and no captures), we might need to remove it?
    // SGF usually doesn't have suicide moves unless it's a capture.
    // If it captures, we already removed opponent, so it has liberties.
    // If it doesn't capture and has no liberties... it's suicide.
    // Let's implement suicide check: remove the new stone if it has no liberties.

    // Re-build map for suicide check
    const newMap = new Map<string, number>();
    finalStones.forEach(s => newMap.set(`${s.x},${s.y}`, s.c));

    const selfMapCheckGroup = (sx: number, sy: number, color: number) => {
        const stack = [{ x: sx, y: sy }];
        const visited = new Set<string>();
        visited.add(`${sx},${sy}`);
        let hasLib = false;
        while (stack.length > 0) {
            const { x, y } = stack.pop()!;
            const nbs = getNeighbors(x, y);
            for (const nb of nbs) {
                const k = `${nb.x},${nb.y}`;
                if (!newMap.has(k)) { hasLib = true; break; } // Empty
                if (newMap.get(k) === color && !visited.has(k)) {
                    visited.add(k);
                    stack.push(nb);
                }
            }
            if (hasLib) break;
        }
        return hasLib;
    };

    if (!selfMapCheckGroup(newMove.x, newMove.y, newMove.c)) {
        // Suicide!
        // console.log("Suicide move detected?", newMove);
        // Do we remove it? Or is it a valid capture? 
        // If we captured something, we wouldn't be here (libs > 0).
        // So this is pure suicide.
        // In many rulesets, suicide is forbidden. 
        // But if SGF has it... maybe it's Ponnuki or something?
        // Let's assume valid for now, or maybe just leave it (it will look dead).
        // Standard Chinese/Japanese: Suicide forbidden.
        // But let's leave it to the SGF author.
    }

    return finalStones;
}
