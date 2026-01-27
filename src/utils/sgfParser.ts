
export interface SGFNode {
    id: number;
    props: { [key: string]: string[] };
    children: SGFNode[];
    parent?: SGFNode;
}

export const parseSGF = (content: string): SGFNode | null => {
    let index = 0;
    let nodeId = 0;

    const skipWhitespace = () => {
        while (index < content.length && /\s/.test(content[index])) index++;
    };

    const parseProperty = (node: SGFNode) => {
        let key = "";
        while (index < content.length && /[A-Z]/.test(content[index])) {
            key += content[index++];
        }

        if (!key) return false;

        const values: string[] = [];
        skipWhitespace();

        while (index < content.length && content[index] === '[') {
            index++; // skip [
            let val = "";
            let escaped = false;
            while (index < content.length) {
                const char = content[index];
                if (escaped) {
                    val += char;
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === ']') {
                    break;
                } else {
                    val += char;
                }
                index++;
            }
            if (index < content.length) index++; // skip ]
            values.push(val);
            skipWhitespace();
        }

        if (values.length > 0) {
            node.props[key] = values;
        }
        return true;
    };

    const parseNode = (parent?: SGFNode): SGFNode => {
        const node: SGFNode = { id: nodeId++, props: {}, children: [], parent };
        while (index < content.length) {
            skipWhitespace();
            if (content[index] === ';' || content[index] === '(' || content[index] === ')') {
                break;
            }
            if (!parseProperty(node)) {
                // Skip unknown garbage to be robust
                if (index < content.length && !/[A-Z]/.test(content[index])) index++;
            }
        }
        return node;
    };

    // Parses a sequence of nodes (e.g., ;A;B...) and handles variations ((...)(...))
    // Returns the first node of this sequence
    const parseTree = (parent?: SGFNode): SGFNode | null => {
        let firstNode: SGFNode | null = null;
        let currentParent = parent;

        while (index < content.length) {
            skipWhitespace();
            const char = content[index];

            if (char === ';') {
                index++; // Consume ;
                const node = parseNode(currentParent);
                if (currentParent) {
                    currentParent.children.push(node);
                }
                if (!firstNode) firstNode = node;
                currentParent = node; // Moves in linear sequence become parent for next
            } else if (char === '(') {
                index++; // Consume (
                // Recursively parse variation, attached to currentParent
                parseTree(currentParent);
            } else if (char === ')') {
                index++; // Consume )
                return firstNode;
            } else {
                index++;
            }
        }
        return firstNode;
    };

    // Entry point: find first '('
    skipWhitespace();
    if (index < content.length && content[index] === '(') {
        index++;
        return parseTree(undefined);
    }

    return null;
};
