import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isExternalDomMutationError = (error: Error | null) =>
  /insertBefore|removeChild|not a child of this node/i.test(error?.message || '');

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    // React cannot safely reuse a DOM tree modified by a translation/browser
    // extension. A clean reload is the only reliable recovery in that case.
    if (isExternalDomMutationError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const domMutation = isExternalDomMutationError(this.state.error);
    return (
      <main className="notranslate flex min-h-[60vh] items-center justify-center p-4" translate="no">
        <div className="steampunk-card w-full max-w-lg p-6 text-center sm:p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-700/50 bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-brass-200">Something went wrong</h2>
          <p className="mb-6 text-sm text-brass-400">
            {domMutation
              ? 'A browser translation tool or extension changed the upload page while it was updating. Reload the page, keep translation disabled for this site, and resume the upload.'
              : this.state.error?.message || 'An unexpected error occurred. Reload the page and try again.'}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={this.handleRetry} className="steampunk-button flex items-center justify-center gap-2 px-6">
              <RefreshCw className="h-4 w-4" />
              {domMutation ? 'Reload and resume' : 'Try again'}
            </button>
            <button onClick={this.handleGoHome} className="steampunk-button-secondary flex items-center justify-center gap-2 px-6">
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </main>
    );
  }
}
