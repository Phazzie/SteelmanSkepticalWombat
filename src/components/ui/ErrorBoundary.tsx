import React, { Component, ErrorInfo, ReactNode } from 'react';
import WombatAvatar from './WombatAvatar';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component - Catches React errors and displays a fallback UI
 * 
 * This prevents the entire app from crashing when a component error occurs.
 * Instead, it shows a user-friendly error message with The Wombat's personality.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, you would log to an error monitoring service here
    // e.g., Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
    
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Optionally reload the page
    // window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-8 rounded-xl shadow-2xl border-2 border-red-500 max-w-2xl text-center">
            <WombatAvatar className="w-32 h-32 mb-6 mx-auto opacity-50" />
            
            <h1 className="text-3xl font-bold text-red-400 mb-4 font-serif">
              Well, This is Awkward.
            </h1>
            
            <p className="text-gray-300 text-lg mb-6">
              The Wombat encountered something it couldn't handle. 
              How embarrassing for a supposedly "intelligent" system.
            </p>
            
            {this.state.error && (
              <details className="mb-6 text-left bg-gray-800 p-4 rounded-lg">
                <summary className="cursor-pointer text-gray-400 font-semibold mb-2">
                  Technical Details (for the nerds)
                </summary>
                <div className="font-mono text-sm text-red-300 overflow-auto max-h-60">
                  <p className="mb-2">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition w-full sm:w-auto"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition w-full sm:w-auto ml-0 sm:ml-3"
              >
                Reload Page
              </button>
            </div>
            
            <p className="text-gray-500 text-sm mt-6">
              If this keeps happening, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
