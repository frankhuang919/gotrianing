
export interface TesujiProblem {
    id: string;
    title: string;
    sgf: string;
    label?: string; // Sequential label e.g., "第 1 题"
}

export interface TesujiChapter {
    title: string;
    problems: TesujiProblem[];
}

export interface TesujiVolume {
    title: string;
    chapters: TesujiChapter[];
}

export const loadTesujiVolumes = async (): Promise<TesujiVolume[]> => {
    try {
        const response = await fetch(`/tesuji_data.json?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error('Failed to load tesuji data');
        }
        const data = await response.json();
        // Inject Type & Smart Category Mapping
        data.forEach((v: any) => v.chapters.forEach((c: any) => {
            let mappedCat: string | undefined;
            const t = c.title || '';
            // Map keywords to the 4 main categories
            if (t.includes('联络') || t.includes('Connection')) mappedCat = '联络 (Connection)';
            else if (t.includes('切断') || t.includes('Cutting')) mappedCat = '切断 (Cutting)';
            else if (t.includes('攻击') || t.includes('杀气') || t.includes('Attack') || t.includes('Capturing')) mappedCat = '攻击与杀气 (Attack & Semai)';
            else if (t.includes('官子') || t.includes('Endgame')) mappedCat = '官子 (Endgame)';

            c.problems.forEach((p: any) => {
                p.sourceType = 'TESUJI';
                if (mappedCat) {
                    p.category = mappedCat;
                }
            });
        }));
        return data as TesujiVolume[];
    } catch (e) {
        console.error("Error loading tesuji volumes:", e);
        return [];
    }
};
