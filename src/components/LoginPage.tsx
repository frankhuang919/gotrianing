import { useState } from 'react';
import { signUp, logIn } from '../services/leancloud';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                if (!username || !email || !password) {
                    throw new Error('请填写所有字段');
                }
                await signUp(username, email, password);
            } else {
                if (!email || !password) {
                    throw new Error('请填写邮箱和密码');
                }
                await logIn(email, password);
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || '操作失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-stone-800/20 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-900/30 mb-4">
                        <span className="text-white font-serif font-bold text-3xl">Z</span>
                    </div>
                    <h1 className="text-2xl font-bold text-stone-100 tracking-wide">
                        ZenGo <span className="text-stone-500 font-normal text-lg">训练场</span>
                    </h1>
                </div>

                {/* Card */}
                <div className="bg-stone-900/80 backdrop-blur-xl border border-stone-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-stone-100 mb-6 text-center">
                        {isRegister ? '创建账号' : '欢迎回来'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-1.5">昵称</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600 transition-all"
                                    placeholder="请输入昵称"
                                    autoComplete="username"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1.5">邮箱</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600 transition-all"
                                placeholder="请输入邮箱"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1.5">密码</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-800/50 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600 transition-all"
                                placeholder="请输入密码"
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    处理中...
                                </span>
                            ) : (
                                isRegister ? '注册' : '登录'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            className="text-sm text-stone-400 hover:text-amber-500 transition-colors"
                        >
                            {isRegister ? '已有账号？去登录' : '没有账号？创建一个'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-stone-600 text-xs mt-6">
                    棋力提升，从这里开始
                </p>
            </div>
        </div>
    );
}
