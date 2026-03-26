import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      const lang = (localStorage.getItem('language') || 'he') as Language;
      const t = translations[lang] || translations.he;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="steampunk-card p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 border-2 border-red-700/50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-brass-200 mb-3">
              {t.errorBoundary.title}
            </h2>
            <p className="text-brass-400 mb-6 text-sm">
              {this.state.error?.message || t.errorBoundary.message}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="steampunk-button flex items-center gap-2 px-6"
              >
                <RefreshCw className="w-4 h-4" />
                {t.errorBoundary.retry}
              </button>
              <button
                onClick={this.handleGoHome}
                className="steampunk-button-secondary flex items-center gap-2 px-6"
              >
                <Home className="w-4 h-4" />
                {t.errorBoundary.home}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
