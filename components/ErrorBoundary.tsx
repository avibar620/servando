"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[300px] items-center justify-center p-8" dir="rtl">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">משהו השתבש</h2>
            <p className="text-sm text-slate-500 mb-4">
              {this.state.error?.message || "שגיאה לא צפויה"}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              נסה שנית
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
