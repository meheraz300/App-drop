import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';
import { GlassBackdrop, GlassSurface, GlassButton } from './GlassComponents';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.removeItem('appdrop_apps_cache');
      localStorage.removeItem('appdrop_versions_cache');
      localStorage.removeItem('appdrop_stats_cache');
      localStorage.removeItem('appdrop_logs_cache');
      localStorage.removeItem('appdrop_config_cache');
      sessionStorage.clear();
      window.location.hash = '#/';
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#/';
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 text-[var(--lg-ink)] font-sans">
          <GlassBackdrop />
          <GlassSurface variant="card" className="w-full max-w-lg p-8 sm:p-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--lg-error-bg)] text-[var(--lg-error)] border border-white/40 shrink-0">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[var(--lg-ink)]">Something went wrong</h1>
                <p className="text-xs text-[var(--lg-ink-muted)]">
                  The application encountered an unexpected runtime state.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-[18px] bg-white/30 dark:bg-black/30 border border-white/30 text-xs font-mono text-[var(--lg-ink)] overflow-x-auto max-h-36">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <GlassButton
                variant="primary"
                onClick={this.handleReload}
                className="flex-1 text-xs h-12"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Platform</span>
              </GlassButton>

              <GlassButton
                variant="secondary"
                onClick={this.handleGoHome}
                className="text-xs h-12 px-5"
              >
                <Home className="h-4 w-4" />
                <span>Return Home</span>
              </GlassButton>

              <GlassButton
                variant="secondary"
                onClick={this.handleResetCache}
                title="Clear local application cache and restore defaults"
                className="text-xs h-12 px-5 text-[var(--lg-error)]"
              >
                <Trash2 className="h-4 w-4" />
                <span>Reset Cache</span>
              </GlassButton>
            </div>
          </GlassSurface>
        </div>
      );
    }

    return this.props.children;
  }
}
