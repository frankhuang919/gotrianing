import React from 'react';

interface ConfirmControlsProps {
    onConfirm: () => void;
    onCancel: () => void;
    style?: React.CSSProperties;
    className?: string; // Allow custom styling/positioning
}

export const ConfirmControls: React.FC<ConfirmControlsProps> = ({ onConfirm, onCancel, style, className }) => {
    return (
        <div
            className={`flex items-center gap-2 z-50 animate-fade-in ${className || ''}`}
            style={style}
        >
            <button
                onClick={onConfirm}
                className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-emerald-400"
                title="确认落子"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </button>
            <button
                onClick={onCancel}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-red-400 opacity-80 hover:opacity-100"
                title="取消"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
