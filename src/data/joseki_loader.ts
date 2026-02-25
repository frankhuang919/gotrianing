import { parseSGF } from '../utils/sgfParser';

export interface JosekiNode {
    id: string; // unique ID
    x: number;
    y: number;
    color: 'B' | 'W';
    children: JosekiNode[];
    comment?: string;
    isTenuki?: boolean; // Pachi uses <tenuki> in comments
    isDont?: boolean;   // Pachi uses <don't>
}

export type JosekiType = '3-3' | '3-4' | '4-4' | '5-4';

const FILE_MAP: Record<JosekiType, string> = {
    '3-3': 'sgf/joseki/joseki_33.sgf',
    '3-4': 'sgf/joseki/joseki_34.sgf',
    '4-4': 'sgf/joseki/joseki_44.sgf',
    '5-4': 'sgf/joseki/joseki_54.sgf',
};

// Helper: Convert SGF Node structure to simpler JosekiNode tree
// Our current parser returns a hierarchical structure. We need to adapt it.
// Assuming parseSgf returns a RootNode with children.

let cache: Record<string, JosekiNode> = {};

export const loadJosekiFile = async (type: JosekiType): Promise<JosekiNode | null> => {
    if (cache[type]) return cache[type];

    try {
        const response = await fetch(`${import.meta.env.BASE_URL}${FILE_MAP[type]}`);
        const text = await response.text();
        const rootSgf = parseSGF(text); // Assume this returns the first game root

        // Convert
        const rootNode = convertSGFToJosekiTree(rootSgf);
        cache[type] = rootNode;
        return rootNode;
    } catch (e) {
        console.error("Failed to load joseki file:", type, e);
        return null;
    }
};

let nodeIdCounter = 0;

const convertSGFToJosekiTree = (sgfNode: any): JosekiNode => {
    const props = sgfNode.props || {};

    // Parse Move
    let x = -1, y = -1;
    let color: 'B' | 'W' = 'B';

    if (props.B) {
        color = 'B';
        const coords = parseSGFCoords(props.B[0]);
        x = coords.x;
        y = coords.y;
    } else if (props.W) {
        color = 'W';
        const coords = parseSGFCoords(props.W[0]);
        x = coords.x;
        y = coords.y;
    }

    // Parse Comments
    const comment = props.C ? props.C[0] : undefined;
    const isTenuki = comment?.includes('<tenuki>');
    const isDont = comment?.includes('<don\'t>') || comment?.includes('<bad>') || comment?.includes('<avoid>');

    const node: JosekiNode = {
        id: `node-${nodeIdCounter++}`,
        x,
        y,
        color,
        children: [],
        comment,
        isTenuki,
        isDont
    };

    // Recursively add children
    if (sgfNode.children) {
        node.children = sgfNode.children.map((child: any) => convertSGFToJosekiTree(child));
    }

    return node;
};

const parseSGFCoords = (str: string): { x: number, y: number } => {
    if (!str || str.length < 2) return { x: -1, y: -1 };
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    return {
        x: alphabet.indexOf(str[0].toLowerCase()),
        y: alphabet.indexOf(str[1].toLowerCase())
    };
};
