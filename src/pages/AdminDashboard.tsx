import { useState, useEffect } from 'react';
import { fetchAllUsers, fetchAllUserStats, fetchRecentActivity } from '../services/analyticsService';
import { isAdmin, logOut, getCurrentUser } from '../services/leancloud';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface UserRow {
    id: string;
    username: string;
    email: string;
    role: string;
    lastLoginAt: Date | null;
    createdAt: Date;
}

interface UserStatRow {
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

interface ActivityDay {
    date: string;
    sessions: number;
    problems: number;
    activeUsers: number;
}

const MODE_LABELS: Record<string, string> = {
    tsumego: '死活',
    tesuji: '手筋',
    joseki: '定式',
    ai: 'AI 对弈',
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [stats, setStats] = useState<UserStatRow[]>([]);
    const [activity, setActivity] = useState<ActivityDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || !isAdmin(user)) {
            navigate('/');
            return;
        }

        async function load() {
            try {
                const [u, s, a] = await Promise.all([
                    fetchAllUsers(),
                    fetchAllUserStats(),
                    fetchRecentActivity(7),
                ]);
                setUsers(u);
                setStats(s);
                setActivity(a);
            } catch (e) {
                console.error('Admin load failed:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [navigate]);

    const totalUsers = users.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayActivity = activity.find(a => a.date === todayStr);
    const totalProblems = stats.reduce((acc, s) => acc + s.totalProblemsAttempted, 0);
    const avgAccuracy = stats.length > 0
        ? stats.reduce((acc, s) => acc + s.overallAccuracy, 0) / stats.length
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-stone-400">加载管理面板...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200">
            {/* Header */}
            <header className="h-16 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-6 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-inner">
                        <span className="text-white font-serif font-bold text-lg">Z</span>
                    </div>
                    <h1 className="text-lg font-bold text-stone-100">
                        管理后台 <span className="text-stone-500 font-normal text-sm ml-2">Admin Dashboard</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
                    >
                        ← 返回训练
                    </button>
                    <button
                        onClick={() => { logOut(); navigate('/login'); }}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        退出登录
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ━━━ KPI Cards ━━━ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard label="注册用户" value={totalUsers} icon="👥" color="amber" />
                    <KPICard label="今日活跃" value={todayActivity?.activeUsers || 0} icon="🟢" color="emerald" />
                    <KPICard label="总做题数" value={totalProblems} icon="📝" color="blue" />
                    <KPICard
                        label="平均正确率"
                        value={`${(avgAccuracy * 100).toFixed(1)}%`}
                        icon="🎯"
                        color={avgAccuracy >= 0.7 ? 'emerald' : avgAccuracy >= 0.5 ? 'amber' : 'red'}
                    />
                </div>

                {/* ━━━ 趋势图 ━━━ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">近 7 天做题量</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={activity}>
                                <defs>
                                    <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                                <Tooltip
                                    contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                                    labelStyle={{ color: '#a8a29e' }}
                                />
                                <Area type="monotone" dataKey="problems" stroke="#d97706" fill="url(#gradP)" strokeWidth={2} name="做题数" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">近 7 天活跃用户</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={activity}>
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fontSize: 12, fill: '#78716c' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: '12px' }}
                                    labelStyle={{ color: '#a8a29e' }}
                                />
                                <Bar dataKey="activeUsers" name="活跃用户" radius={[6, 6, 0, 0]}>
                                    {activity.map((_, index) => (
                                        <Cell key={index} fill={index === activity.length - 1 ? '#059669' : '#065f46'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ━━━ 用户列表 ━━━ */}
                <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-800">
                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">用户列表</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-stone-500 text-left">
                                    <th className="px-6 py-3 font-medium">用户名</th>
                                    <th className="px-6 py-3 font-medium">角色</th>
                                    <th className="px-6 py-3 font-medium">总练习次数</th>
                                    <th className="px-6 py-3 font-medium">总做题数</th>
                                    <th className="px-6 py-3 font-medium">正确率</th>
                                    <th className="px-6 py-3 font-medium">薄弱项</th>
                                    <th className="px-6 py-3 font-medium">最后活跃</th>
                                    <th className="px-6 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800">
                                {users.map(u => {
                                    const st = stats.find(s => s.userId === u.id);
                                    return (
                                        <tr key={u.id} className="hover:bg-stone-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-stone-100">{u.username}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-900/50 text-amber-400' : 'bg-stone-800 text-stone-400'}`}>
                                                    {u.role === 'admin' ? '管理员' : '用户'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-stone-300">{st?.totalSessions || 0}</td>
                                            <td className="px-6 py-4 text-stone-300">{st?.totalProblemsAttempted || 0}</td>
                                            <td className="px-6 py-4">
                                                <AccuracyBadge value={st?.overallAccuracy || 0} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {st?.weakCategories?.map(c => (
                                                    <span key={c} className="inline-block mr-1 px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-800/50">
                                                        {MODE_LABELS[c] || c}
                                                    </span>
                                                ))}
                                                {(!st?.weakCategories || st.weakCategories.length === 0) && (
                                                    <span className="text-stone-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-stone-500 text-xs">
                                                {st?.lastActiveAt ? new Date(st.lastActiveAt).toLocaleString('zh-CN') : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/admin/user/${u.id}`)}
                                                    className="text-amber-500 hover:text-amber-400 text-xs font-bold transition-colors"
                                                >
                                                    详情 →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ━━━ Sub-components ━━━

function KPICard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
    const colorMap: Record<string, string> = {
        amber: 'from-amber-900/30 to-amber-900/10 border-amber-800/50',
        emerald: 'from-emerald-900/30 to-emerald-900/10 border-emerald-800/50',
        blue: 'from-blue-900/30 to-blue-900/10 border-blue-800/50',
        red: 'from-red-900/30 to-red-900/10 border-red-800/50',
    };

    return (
        <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.amber} border rounded-2xl p-5 transition-transform hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold text-stone-100 mt-1">{value}</p>
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </div>
    );
}

function AccuracyBadge({ value }: { value: number }) {
    const pct = (value * 100).toFixed(1);
    let cls = 'bg-red-900/30 text-red-400 border-red-800/50';
    if (value >= 0.8) cls = 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50';
    else if (value >= 0.5) cls = 'bg-amber-900/30 text-amber-400 border-amber-800/50';

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
            {pct}%
        </span>
    );
}
