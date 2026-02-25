
export interface TsumegoProblem {
    id: string; // e.g. sh1.sgf
    title: string;
    sgf: string;
    label?: string; // Sequential label e.g., "第 1 题"
    category?: string; // Injected by Python script
    sourceType?: 'TESUJI' | 'TSUMEGO';
    group?: string; // Injected by Store (Volume Name)
}

export interface TsumegoChapter {
    title: string;
    problems: TsumegoProblem[];
}

export interface TsumegoVolume {
    title: string;
    chapters: TsumegoChapter[];
}

export const loadTsumegoVolumes = async (): Promise<TsumegoVolume[]> => {
    try {
        const response = await fetch(`${import.meta.env.BASE_URL}tsumego_data.json?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error('Failed to load tsumego data');
        }
        const data = await response.json();
        // Inject Type
        data.forEach((v: any) => v.chapters.forEach((c: any) => c.problems.forEach((p: any) => p.sourceType = 'TSUMEGO')));
        return data as TsumegoVolume[];
    } catch (e) {
        console.error("Error loading tsumego volumes:", e);
        return [];
    }
};
