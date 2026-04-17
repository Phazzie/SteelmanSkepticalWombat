import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Optional label shown in the fallback UI to identify which section crashed. */
    section?: string;
}

interface State {
    hasError: boolean;
    errorMessage: string;
}

/**
 * Catches unhandled errors in any child component tree and displays a
 * Wombat-flavoured fallback instead of a blank screen.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            errorMessage: error.message || 'An unexpected error occurred with no details available.',
        };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, errorMessage: '' });
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;
            return (
                <div className="p-8 bg-gray-900 rounded-xl border-2 border-red-500/50 text-center space-y-4">
                    <p className="text-4xl">🦡</p>
                    <h2 className="text-xl font-serif font-bold text-red-400">
                        The Wombat Has Tripped Over Something
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {this.props.section
                            ? `The "${this.props.section}" section crashed.`
                            : 'Something went wrong in this section.'}
                    </p>
                    {isDev && (
                        <details className="text-left">
                            <summary className="text-xs text-gray-300 cursor-pointer">Error details (dev only)</summary>
                            <p className="text-xs text-gray-300 font-mono break-all mt-2">{this.state.errorMessage}</p>
                        </details>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
