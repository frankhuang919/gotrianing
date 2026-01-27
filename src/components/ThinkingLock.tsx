import React, { useEffect, useState } from 'react';

interface ThinkingLockProps {
    isLocked: boolean;
    onUnlock: () => void;
    duration?: number; // seconds
}

const ThinkingLock: React.FC<ThinkingLockProps> = ({ isLocked, onUnlock, duration = 10 }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isFading, setIsFading] = useState(false);

    // Sound Effect
    const playDing = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Bell-like sound: Sine wave, high pitch, quick decay
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1); // Pitch drop for "ping"

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5); // Long tail

        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    };

    useEffect(() => {
        if (isLocked) {
            setIsFading(false); // Reset fade
            setTimeLeft(duration);

            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        playDing(); // Play sound
                        setIsFading(true); // Start fade out

                        // Wait for fade animation (500ms) before actual unlock
                        setTimeout(() => {
                            onUnlock();
                        }, 500);

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLocked, duration, onUnlock]);

    if (!isLocked && !isFading) return null;

    return (
        <div
            className={`absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
            <div className="text-center p-8 rounded-full border-4 border-red-500/50 bg-stone-900/80 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse">
                <div className="text-4xl font-bold text-red-500 mb-2 font-mono">
                    {timeLeft > 0 ? timeLeft : 0}
                </div>
                <div className="text-red-300 text-sm tracking-widest uppercase">
                    思考锁
                </div>
                <div className="text-stone-500 text-xs mt-2">
                    请计算后再落子
                </div>
            </div>
        </div>
    );
};

export default ThinkingLock;
