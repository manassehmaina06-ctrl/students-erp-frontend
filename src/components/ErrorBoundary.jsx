import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log for debugging; a real app would send this to Sentry or similar.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-3xl shadow-lg mb-4">
            ⚠️
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            The page encountered an unexpected error. You can try reloading, or go back to the home page.
          </p>

          {error && (
            <details className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 mb-6 text-left">
              <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                Technical details
              </summary>
              <pre className="text-[11px] text-rose-700 dark:text-rose-300 whitespace-pre-wrap mt-2 overflow-auto max-h-40">
                {String(error?.message || error)}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition"
            >
              ↻ Reload page
            </button>
            <button
              onClick={this.handleHome}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm font-medium text-white transition"
            >
              🏠 Go to home
            </button>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-6">
            If the problem persists, contact your administrator.
          </p>
        </div>
      </div>
    );
  }
}
