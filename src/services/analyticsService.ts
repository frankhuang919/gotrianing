/**
 * Analytics Service — Supabase 版
 *
 * 练习会话记录 & 用户统计。
 * 表: practice_sessions, user_stats, user_profiles
 */
import { supabase, getCurrentUser } from './leancloud';

// ━━━ 内存中的会话状态 ━━━
let currentSessionId: string | null = null;
let sessionData = {
    problemsAttempted: [] as string[],
    problemsSolved: [] as string[],
    mistakes: 0,
};

/** 开始一个练习会话 */
export async function startSession(mode: string) {
    const user = getCurrentUser();
    if (!user) return;

    sessionData = { problemsAttempted: [], problemsSolved: [], mistakes: 0 };

    try {
        const { data, error } = await supabase
            .from('practice_sessions')
            .insert({
                user_id: user.id,
                username: user.username || '',
                mode,
                started_at: new Date().toISOString(),
                problems_attempted: [],
                problems_solved: [],
                mistakes: 0,
                accuracy: 0,
            })
            .select('id')
            .single();

        if (error) throw error;
        currentSessionId = data?.id || null;
    } catch (e) {
        console.error('[Analytics] startSession error:', e);
    }
}

/** 记录单题结果 */
export async function recordProblemResult(problemId: string, solved: boolean, _isFirstTry?: boolean) {
    sessionData.problemsAttempted.push(problemId);
    if (solved) {
        sessionData.problemsSolved.push(problemId);
    } else {
        sessionData.mistakes++;
    }

    if (!currentSessionId) return;

    try {
        await supabase
            .from('practice_sessions')
            .update({
                problems_attempted: sessionData.problemsAttempted,
                problems_solved: sessionData.problemsSolved,
                mistakes: sessionData.mistakes,
            })
            .eq('id', currentSessionId);
    } catch (e) {
        console.error('[Analytics] recordProblemResult error:', e);
    }
}

/** 结束会话 */
export async function endSession() {
    if (!currentSessionId) return;

    const total = sessionData.problemsAttempted.length;
    const correct = sessionData.problemsSolved.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    try {
        await supabase
            .from('practice_sessions')
            .update({
                ended_at: new Date().toISOString(),
                accuracy,
            })
            .eq('id', currentSessionId);

        await updateUserStats();
    } catch (e) {
        console.error('[Analytics] endSession error:', e);
    }

    currentSessionId = null;
    sessionData = { problemsAttempted: [], problemsSolved: [], mistakes: 0 };
}

/** 聚合用户统计 */
async function updateUserStats() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const { data: sessions } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', user.id);

        if (!sessions || sessions.length === 0) return;

        let totalAttempted = 0;
        let totalSolved = 0;
        let totalMistakes = 0;
        const modeStats: Record<string, { attempted: number; solved: number; sessions: number }> = {};

        for (const s of sessions) {
            const attempted = s.problems_attempted?.length || 0;
            const solved = s.problems_solved?.length || 0;
            totalAttempted += attempted;
            totalSolved += solved;
            totalMistakes += s.mistakes || 0;

            const mode = s.mode || 'unknown';
            if (!modeStats[mode]) modeStats[mode] = { attempted: 0, solved: 0, sessions: 0 };
            modeStats[mode].attempted += attempted;
            modeStats[mode].solved += solved;
            modeStats[mode].sessions++;
        }

        const overallAccuracy = totalAttempted > 0
            ? Math.round((totalSolved / totalAttempted) * 100)
            : 0;

        await supabase
            .from('user_stats')
            .upsert({
                user_id: user.id,
                username: user.username || '',
                total_sessions: sessions.length,
                total_attempted: totalAttempted,
                total_solved: totalSolved,
                total_mistakes: totalMistakes,
                overall_accuracy: overallAccuracy,
                mode_stats: modeStats,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
    } catch (e) {
        console.error('[Analytics] updateUserStats error:', e);
    }
}

// ━━━ Admin Dashboard 查询 ━━━

/** 获取所有用户 */
export async function fetchAllUsers() {
    try {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*')
            .order('last_login_at', { ascending: false });

        return (profiles || []).map(u => ({
            id: u.id || '',
            username: u.username || '',
            email: u.email || '',
            role: u.role || 'user',
            createdAt: u.created_at || '',
            lastLoginAt: u.last_login_at || '',
        }));
    } catch (e) {
        console.error('[Analytics] fetchAllUsers error:', e);
        return [];
    }
}

/** 获取所有用户统计 */
export async function fetchAllUserStats() {
    try {
        const { data: stats } = await supabase
            .from('user_stats')
            .select('*');

        return (stats || []).map(s => ({
            userId: s.user_id || '',
            username: s.username || '',
            totalSessions: s.total_sessions || 0,
            totalAttempted: s.total_attempted || 0,
            totalSolved: s.total_solved || 0,
            totalMistakes: s.total_mistakes || 0,
            overallAccuracy: s.overall_accuracy || 0,
            modeStats: s.mode_stats || {},
            updatedAt: s.updated_at || '',
            // Fields expected by AdminDashboard / UserDetail interfaces
            totalProblemsAttempted: s.total_attempted || 0,
            totalProblemsSolved: s.total_solved || 0,
            tsumegoStats: s.mode_stats?.tsumego || {},
            tesujiStats: s.mode_stats?.tesuji || {},
            weakCategories: [] as string[],
            strongCategories: [] as string[],
            lastActiveAt: s.updated_at ? new Date(s.updated_at) : null,
        }));
    } catch (e) {
        console.error('[Analytics] fetchAllUserStats error:', e);
        return [];
    }
}

/** 获取特定用户的所有会话 */
export async function fetchUserSessions(userId: string) {
    try {
        const { data: sessions } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false });

        return (sessions || []).map(s => ({
            id: s.id || '',
            mode: s.mode || '',
            startedAt: s.started_at ? new Date(s.started_at) : new Date(),
            endedAt: s.ended_at ? new Date(s.ended_at) : null,
            problemsAttempted: s.problems_attempted || [],
            problemsSolved: s.problems_solved || [],
            firstTryCorrect: [] as string[],
            mistakes: [] as string[],
            accuracy: s.accuracy || 0,
        }));
    } catch (e) {
        console.error('[Analytics] fetchUserSessions error:', e);
        return [];
    }
}

/** 获取最近 N 天的活动数据 (按天分组) */
export async function fetchRecentActivity(days: number = 7) {
    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: sessions } = await supabase
            .from('practice_sessions')
            .select('*')
            .gte('started_at', since.toISOString())
            .order('started_at', { ascending: true });

        // 按天分组
        const dailyMap: Record<string, { sessions: number; problems: number; solved: number }> = {};
        for (const s of sessions || []) {
            const day = (s.started_at || '').slice(0, 10);
            if (!dailyMap[day]) dailyMap[day] = { sessions: 0, problems: 0, solved: 0 };
            dailyMap[day].sessions++;
            dailyMap[day].problems += s.problems_attempted?.length || 0;
            dailyMap[day].solved += s.problems_solved?.length || 0;
        }

        // Count unique active users per day
        const dailyUsers: Record<string, Set<string>> = {};
        for (const s of sessions || []) {
            const day = (s.started_at || '').slice(0, 10);
            if (!dailyUsers[day]) dailyUsers[day] = new Set();
            if (s.user_id) dailyUsers[day].add(s.user_id);
        }

        return Object.entries(dailyMap).map(([date, data]) => ({
            date,
            ...data,
            activeUsers: dailyUsers[date]?.size || 0,
        }));
    } catch (e) {
        console.error('[Analytics] fetchRecentActivity error:', e);
        return [];
    }
}
