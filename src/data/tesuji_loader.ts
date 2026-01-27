
export interface TesujiProblem {
    id: string;
    title: string;
    sgf: string;
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
        const response = await fetch('/tesuji_data.json');
        if (!response.ok) {
            throw new Error('Failed to load tesuji data');
        }
        const data = await response.json();
        return data as TesujiVolume[];
    } catch (e) {
        console.error("Error loading tesuji volumes:", e);
        return [];
    }
};
