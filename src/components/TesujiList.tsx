
import React, { useEffect, useState } from 'react';
import { loadTesujiVolumes, TesujiVolume, TesujiProblem } from '../data/tesuji_loader';

interface TesujiListProps {
    onSelectProblem: (problem: TesujiProblem) => void;
}

export const TesujiList: React.FC<TesujiListProps> = ({ onSelectProblem }) => {
    const [volumes, setVolumes] = useState<TesujiVolume[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedVol, setExpandedVol] = useState<string | null>(null);
    const [expandedChap, setExpandedChap] = useState<string | null>(null);

    useEffect(() => {
        loadTesujiVolumes().then(data => {
            setVolumes(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-gray-400 p-4">Loading Library...</div>;

    return (
        <div className="h-full overflow-y-auto bg-gray-900 border-r border-gray-700 p-2 text-sm text-gray-300">
            <h2 className="font-bold text-lg mb-4 text-white border-b border-gray-700 pb-2">手筋 (Tesuji)</h2>
            {volumes.map(vol => (
                <div key={vol.title} className="mb-2">
                    <div
                        className="font-bold cursor-pointer hover:text-green-400 py-1"
                        onClick={() => setExpandedVol(expandedVol === vol.title ? null : vol.title)}
                    >
                        {expandedVol === vol.title ? '▼' : '▶'} {vol.title}
                    </div>

                    {expandedVol === vol.title && (
                        <div className="pl-2 border-l border-gray-700 ml-1">
                            {vol.chapters.map(chap => (
                                <div key={chap.title} className="mb-1">
                                    <div
                                        className="cursor-pointer hover:text-green-300 py-1"
                                        onClick={() => setExpandedChap(expandedChap === chap.title ? null : chap.title)}
                                    >
                                        {expandedChap === chap.title ? '📂' : '📁'} {chap.title}
                                    </div>

                                    {expandedChap === chap.title && (
                                        <div className="pl-4 grid grid-cols-1 gap-1">
                                            {chap.problems.map(prob => (
                                                <button
                                                    key={prob.id}
                                                    onClick={() => onSelectProblem(prob)}
                                                    className="text-left text-xs text-gray-400 hover:text-white hover:bg-gray-800 p-1 rounded"
                                                >
                                                    📄 {prob.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
