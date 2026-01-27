
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-stone-900 flex items-center justify-center p-8">
                    <div className="bg-red-900/20 border border-red-500 rounded p-6 max-w-2xl text-red-200">
                        <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                        <p className="mb-4">请截图此页面反馈给开发者。</p>
                        <div className="bg-black/50 p-4 rounded overflow-auto font-mono text-xs">
                            <p className="text-red-400 font-bold">{this.state.error?.toString()}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
