import React, { Component, ReactNode, ErrorInfo } from 'react';
import WombatAvatar from './ui/WombatAvatar';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-800 font-sans text-gray-200 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-gray-900 rounded-xl shadow-2xl border-2 border-red-500/50 p-8">
                        <div className="text-center mb-6">
                            <WombatAvatar className="w-24 h-24 mx-auto mb-4 opacity-50" />
                            <h1 className="text-3xl font-bold text-red-400 font-serif mb-2">
                                The Wombat Has Encountered an Error
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Something went wrong. The Wombat is not pleased.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
                            <h2 className="text-sm font-bold text-red-400 mb-2">Error Details:</h2>
                            <p className="text-gray-300 text-sm font-mono break-words">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <details className="mt-4">
                                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                                        Stack Trace
                                    </summary>
                                    <pre className="text-xs text-gray-400 mt-2 overflow-x-auto">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
                            >
                                Reload Application
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
                            >
                                Go Back
                            </button>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>If this error persists, please check the browser console for more details.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
