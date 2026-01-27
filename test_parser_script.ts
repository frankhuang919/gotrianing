
import { parseSGF, SGFNode } from './src/utils/sgfParser';
import { josekiLibrary } from './src/data/joseki_library';

const testSgf = () => {
    console.log("Testing SGF Parser...");

    // Pick the first pattern: Star Point (8) - star-33
    const pattern = josekiLibrary[0];
    console.log(`Pattern: ${pattern.title}`);
    console.log(`SGF: ${pattern.sgf.substring(0, 50)}...`);

    const root = parseSGF(pattern.sgf);

    if (!root) {
        console.error("FAILED to parse SGF root.");
        return;
    }

    console.log("Root parsed. Children count:", root.children.length);
    if (root.children.length > 0) {
        console.log("First child Props:", JSON.stringify(root.children[0].props));
    } else {
        console.error("Root has NO children! This explains why no moves are shown.");
    }

    // Simulate _runDemo traversal
    const sequence: SGFNode[] = [];
    let current = root;
    let limit = 20;
    while (current.children && current.children.length > 0 && limit > 0) {
        current = current.children[0];
        sequence.push(current);
        limit--;
    }

    console.log(`Extracted Sequence Length: ${sequence.length}`);
    sequence.forEach((node, i) => {
        const moveB = node.props['B'];
        const moveW = node.props['W'];
        const move = moveB ? `B[${moveB}]` : (moveW ? `W[${moveW}]` : 'NoMove');
        console.log(`Step ${i + 1}: ${move}`);
    });
};

testSgf();
