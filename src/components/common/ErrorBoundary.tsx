import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-center font-sans">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center text-2xl mx-auto">
              🏃
            </div>
            <h2 className="text-lg font-black text-white">RunQuest 화면 복구 중</h2>
            <p className="text-xs text-slate-400">
              일시적인 네트워크 지연이 발생했습니다. 아래 버튼을 눌러 새로고침해 주세요.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/character-dashboard';
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black shadow-lg shadow-violet-600/30 active:scale-95 transition-all"
            >
              대시보드로 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
