/**
 * Supabase SDK 初始化 + Auth 封装
 *
 * 保持导出接口不变，LoginPage / App / AdminDashboard 无需改动 import 路径。
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ━━━ Supabase 初始化 ━━━
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase] ⚠️ VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未配置！');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ━━━ Auth 封装 ━━━

/** 用 email + password 注册，username 存入 user_metadata */
export async function signUp(username: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username, role: 'user' },
        },
    });
    if (error) throw new Error(error.message);
    return data.user;
}

/** email + password 登录 */
export async function logIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw new Error(error.message);
    return data.user;
}

/** 登出 */
export async function logOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[Supabase] Logout error:', error);
}

/** 获取当前登录用户 (null = 未登录) */
export function getCurrentUser(): any | null {
    // Supabase 把 session 缓存在 localStorage，这里同步读取
    const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        const user = parsed?.user ?? parsed?.currentSession?.user ?? null;
        if (!user) return null;
        // 统一返回格式，兼容旧代码中 user.username / user.objectId 的访问
        return {
            objectId: user.id,
            id: user.id,
            username: user.user_metadata?.username ?? user.email?.split('@')[0] ?? '',
            email: user.email,
            role: user.user_metadata?.role ?? 'user',
            createdAt: user.created_at,
            ...user.user_metadata,
        };
    } catch {
        return null;
    }
}

/** 异步获取当前用户（更可靠） */
export async function getCurrentUserAsync(): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
        objectId: user.id,
        id: user.id,
        username: user.user_metadata?.username ?? user.email?.split('@')[0] ?? '',
        email: user.email,
        role: user.user_metadata?.role ?? 'user',
        createdAt: user.created_at,
        ...user.user_metadata,
    };
}

/** 判断是否为管理员 */
export function isAdmin(user?: any): boolean {
    const u = user || getCurrentUser();
    if (!u) return false;
    return u.role === 'admin';
}

/** 更新最后登录时间 */
export async function updateLastLogin() {
    const user = getCurrentUser();
    if (!user?.id) return;

    try {
        await supabase
            .from('user_profiles')
            .upsert({
                id: user.id,
                username: user.username,
                email: user.email,
                last_login_at: new Date().toISOString(),
            }, { onConflict: 'id' });
    } catch (e) {
        console.error('[Supabase] Failed to update last login:', e);
    }
}

export { supabase as Bmob };
export default supabase;
