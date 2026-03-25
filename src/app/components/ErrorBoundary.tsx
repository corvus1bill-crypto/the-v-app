import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
    console.error('❌ Error Boundary caught error:', error, errorInfo);
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
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-foreground rounded-full flex items-center justify-center border-4 border-foreground shadow-[8px_8px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)]">
                <AlertCircle className="w-10 h-10 text-background" />
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center mb-4">
              <h1 className="text-4xl font-black text-foreground uppercase mb-2 tracking-tight">
                Oops!
              </h1>
              <p className="text-lg font-bold text-foreground/80">
                Something went wrong
              </p>
            </div>

            {/* Error Message */}
            <div className="bg-foreground/5 border-4 border-foreground p-4 mb-6">
              <p className="font-mono text-sm text-foreground/60 break-words">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-4 bg-foreground text-background border-4 border-foreground font-black uppercase text-lg shadow-[8px_8px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-4 bg-background text-foreground border-4 border-foreground font-black uppercase shadow-[8px_8px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)] transition-all"
              >
                Reload App
              </button>
            </div>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 p-4 bg-foreground/5 border-2 border-foreground/20">
                <summary className="font-mono text-xs text-foreground/40 cursor-pointer hover:text-foreground/60 uppercase font-bold">
                  Stack Trace (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-foreground/40 overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}