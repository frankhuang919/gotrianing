"""Parse SGF and output JS stone positions"""
import re, sys

sgf = open(r'E:\weiqi\春兰杯\15th-chunlancup-pth2lwq.sgf', encoding='utf-8').read()
moves = re.findall(r';([BW])\[([a-s]{2})\]', sgf)

# Simulate board with captures
board = [[None]*19 for _ in range(19)]

def neighbors(x, y):
    for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
        nx, ny = x+dx, y+dy
        if 0 <= nx < 19 and 0 <= ny < 19:
            yield nx, ny

def group_liberties(board, x, y):
    color = board[y][x]
    if not color: return set(), 0
    visited = set()
    liberties = set()
    stack = [(x, y)]
    while stack:
        cx, cy = stack.pop()
        if (cx, cy) in visited: continue
        visited.add((cx, cy))
        for nx, ny in neighbors(cx, cy):
            if board[ny][nx] is None:
                liberties.add((nx, ny))
            elif board[ny][nx] == color and (nx, ny) not in visited:
                stack.append((nx, ny))
    return visited, len(liberties)

def remove_captured(board, color):
    captured = []
    for y in range(19):
        for x in range(19):
            if board[y][x] == color:
                group, libs = group_liberties(board, x, y)
                if libs == 0:
                    captured.extend(group)
    for x, y in captured:
        board[y][x] = None

# Play moves
for i, (color, pos) in enumerate(moves[:80]):
    col = ord(pos[0]) - ord('a')
    row = ord(pos[1]) - ord('a')
    board[row][col] = color
    opp = 'W' if color == 'B' else 'B'
    remove_captured(board, opp)

# Output
stones = []
for y in range(19):
    for x in range(19):
        if board[y][x]:
            t = 'b' if board[y][x] == 'B' else 'w'
            stones.append(f"  {{ t: '{t}', x: {x}, y: {y} }},")

print("// Park Junghwan (B) vs Li Weiqing (W)")
print("// 15th Chunlan Cup, Round of 16, Move 80")
print(f"// {len(stones)} stones on board")
print("const GAME_STONES: Array<{t: 'b'|'w', x: number, y: number}> = [")
for s in stones:
    print(s)
print("];")
