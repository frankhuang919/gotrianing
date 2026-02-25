import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserSessions, fetchAllUserStats } from '../services/analyticsService';
import { isAdmin, getCurrentUser } from '../services/leancloud';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MODE_LABELS: Record<string, string> = {
    tsumego: '死活',
    tesuji: '手筋',
    joseki: '定式',
    ai: 'AI 对弈',
};

const MODE_COLORS: Record<string, string> = {
    tsumego: '#059669',
    tesuji: '#2563eb',
    joseki: '#d97706',
    ai: '#7c3aed',
};

interface Session {
    id: string;
    mode: string;
    startedAt: Date;
    endedAt: Date | null;
    problemsAttempted: string[];
    problemsSolved: string[];
    firstTryCorrect: string[];
    mistakes: string[];
    accuracy: number;
}

interface UserStat {
    userId: string;
    username: string;
    totalSessions: number;
    totalProblemsAttempted: number;
    totalProblemsSolved: number;
    overallAccuracy: number;
    tsumegoStats: { attempted?: number; solved?: number; firstTry?: number; accuracy?: number };
    tesujiStats: { attempted?: number; solved?: number; firstTry?: number; accuracy?: number };
    weakCategories: string[];
    strongCategories: string[];
    lastActiveAt: Date | null;
}

export default function UserDetail() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [userStat, setUserStat] = useState<UserStat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || !isAdmin(user)) {
            navigate('/');
            return;
        }

        if (!userId) return;

        async function load() {
            try {
                const [sess, allStats] = await Promise.all([
                    fetchUserSessions(userId!),
                    fetchAllUserStats(),
                ]);
                setSessions(sess);
                const st = allStats.find(s => s.userId === userId);
                setUserStat(st || null);
            } catch (e) {
                console.error('Failed to load user detail:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // 按模式统计 session 数据
    const modeBreakdown = Object.entries(
        sessions.reduce((acc, s) => {
            if (!acc[s.mode]) acc[s.mode] = { sessions: 0, attempted: 0, solved: 0 };
            acc[s.mode].sessions++;
            acc[s.mode].attempted += s.problemsAttempted.length;
            acc[s.mode].solved += s.problemsSolved.length;
            return acc;
        }, {} as Record<string, { sessions: number; attempted: number; solved: number }>)
    ).map(([mode, data]) => ({
        mode,
        label: MODE_LABELS[mode] || mode,
        ...data,
        accuracy: data.attempted > 0 ? data.solved / data.attempted : 0,
    }));

    // 错题分析
    const mistakeCount: Record<string, number> = {};
    sessions.forEach(s => {
        s.mistakes.forEach(pid => {
            mistakeCount[pid] = (mistakeCount[pid] || 0) + 1;
        });
    });
    const stubborn = Object.entries(mistakeCount)
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200">
            {/* Header */}
            <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 shadow-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin')}
                        className="text-stone-400 hover:text-stone-200 transition-colors"
                    >
                        ← 返回
                    </button>
                    <h1 className="text-lg font-bold text-stone-100">
                        用户详情：<span className="text-amber-400">{userStat?.username || userId}</span>
                    </h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                {/* ━━━ Overview Cards ━━━ */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard label="总练习次数" value={userStat?.totalSessions || 0} />
                    <StatsCard label="总做题数" value={userStat?.totalProblemsAttempted || 0} />
                    <StatsCard label="总做对数" value={userStat?.totalProblemsSolved || 0} />
                    <StatsCard label="整体正确率" value={`${((userStat?.overallAccuracy || 0) * 100).toFixed(1)}%`} />
                    <StatsCard
                        label="最后活跃"
                        value={userStat?.lastActiveAt ? new Date(userStat.lastActiveAt).toLocaleDateString('zh-CN') : '—'}
                    />
                </div>

                {/* ━━━ 优劣势分析 ━━━ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">优势领域 💪</h3>
                        <div className="flex flex-wrap gap-2">
                            {userStat?.strongCategories?.length ? (
                                userStat.strongCategories.map(c => (
                                    <span key={c} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                                        {MODE_LABELS[c] || c}
                                    </span>
                                ))
                            ) : (
                                <span className="text-stone-600 text-sm">数据不足</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">薄弱环节 ⚠️</h3>
                        <div className="flex flex-wrap gap-2">
                            {userStat?.weakCategories?.length ? (
                                userStat.weakCategories.map(c => (
                                    <span key={c} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-900/30 text-red-400 border border-red-800/50">
                                        {MODE_LABELS[c] || c}
                                    </span>
                                ))
                            ) : (
                                <span className="text-stone-600 text-sm">暂无薄弱项 🎉</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ━━━ 按模式分类统计 ━━━ */}
                {modeBreakdown.length > 0 && (
                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">模式分类统计</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={modeBreakdown} layout="vertical">
                                    <XAxis type="number" tick={{ fontSize: 12, fill: '#78716c' }} />
                                    <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#a8a29e' }} width={60} />
                                    <Tooltip
                                        contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="attempted" name="做题数" radius={[0, 6, 6, 0]}>
                                        {modeBreakdown.map((entry) => (
                                            <Cell key={entry.mode} fill={MODE_COLORS[entry.mode] || '#6b7280'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            <div className="space-y-3">
                                {modeBreakdown.map(m => (
                                    <div key={m.mode} className="flex items-center justify-between p-3 rounded-xl bg-stone-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MODE_COLORS[m.mode] || '#6b7280' }} />
                                            <span className="font-bold text-stone-200">{m.label}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-stone-400">{m.sessions} 次训练</span>
                                            <span className="text-stone-400">{m.solved}/{m.attempted} 题</span>
                                            <span className={`font-bold ${m.accuracy >= 0.8 ? 'text-emerald-400' : m.accuracy >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {(m.accuracy * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ━━━ 顽固错题 ━━━ */}
                {stubborn.length > 0 && (
                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                            顽固错题 (做错 ≥3 次)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {stubborn.map(([pid, count]) => (
                                <div key={pid} className="flex items-center justify-between p-3 rounded-xl bg-red-900/10 border border-red-900/30">
                                    <span className="text-stone-300 font-mono text-sm truncate">{pid}</span>
                                    <span className="text-red-400 font-bold text-sm">×{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ━━━ Session 历史 ━━━ */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-800">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">练习记录</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-stone-500 text-left">
                                    <th className="px-6 py-3 font-medium">时间</th>
                                    <th className="px-6 py-3 font-medium">模式</th>
                                    <th className="px-6 py-3 font-medium">做题数</th>
                                    <th className="px-6 py-3 font-medium">做对数</th>
                                    <th className="px-6 py-3 font-medium">一次通过</th>
                                    <th className="px-6 py-3 font-medium">正确率</th>
                                    <th className="px-6 py-3 font-medium">时长</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800">
                                {sessions.map(s => {
                                    const duration = s.endedAt && s.startedAt
                                        ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000)
                                        : null;

                                    return (
                                        <tr key={s.id} className="hover:bg-stone-800/50 transition-colors">
                                            <td className="px-6 py-3 text-stone-400 text-xs">
                                                {new Date(s.startedAt).toLocaleString('zh-CN')}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-0.5 rounded text-xs font-bold"
                                                    style={{
                                                        backgroundColor: `${MODE_COLORS[s.mode] || '#6b7280'}20`,
                                                        color: MODE_COLORS[s.mode] || '#6b7280',
                                                    }}>
                                                    {MODE_LABELS[s.mode] || s.mode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-stone-300">{s.problemsAttempted.length}</td>
                                            <td className="px-6 py-3 text-stone-300">{s.problemsSolved.length}</td>
                                            <td className="px-6 py-3 text-stone-300">{s.firstTryCorrect.length}</td>
                                            <td className="px-6 py-3">
                                                <span className={`font-bold ${s.accuracy >= 0.8 ? 'text-emerald-400' : s.accuracy >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {(s.accuracy * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-stone-500 text-xs">
                                                {duration !== null ? `${duration} 分钟` : '进行中'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-stone-600">
                                            暂无练习记录
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatsCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-4">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-stone-100 mt-1">{value}</p>
        </div>
    );
}
