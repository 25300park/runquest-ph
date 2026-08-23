import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRunQuestSession, signInRunQuest } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // 이미 세션이 있는 경우 대시보드로 이동
  useEffect(() => {
    let active = true;

    void getRunQuestSession()
      .then((session) => {
        if (active && session) {
          navigate('/character-dashboard', { replace: true });
        }
      })
      .catch(() => {
        // 세션 확인 실패 시 로그인 유지
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  // 소셜 로그인 핸들러 (Google, Facebook, Apple)
  async function handleOAuthLogin(provider: 'google' | 'facebook' | 'apple') {
    if (!isSupabaseConfigured) {
      setStatus('Supabase 환경설정이 필요합니다.');
      return;
    }

    setSocialLoading(provider);
    setStatus(`${provider.toUpperCase()} 로그인 페이지로 연결 중...`);

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/character-dashboard`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: provider === 'google' ? {
            access_type: 'offline',
            prompt: 'consent',
          } : undefined,
        },
      });

      if (error) throw error;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${provider} 로그인에 실패했습니다.`);
      setSocialLoading(null);
    }
  }

  // 이메일 로그인 제출 핸들러
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('RunQuest 프로필을 불러오는 중...');

    try {
      await signInRunQuest(email, password);
      navigate('/character-dashboard', { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section data-testid="login-page" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 font-sans flex items-center justify-center select-none">
      <div className="max-w-md w-full rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xl">
        {/* 1. 상단 브랜딩 헤더 */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md shadow-violet-500/25 mb-3">
            RQ
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
            Welcome to RunQuest PH
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Log In to Your Quest
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your email and password to continue your journey.
          </p>
        </div>

        {/* 2. 상태 및 에러 메시지 알림 */}
        {status && (
          <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/80 p-3 text-center text-xs font-bold text-violet-700">
            {status}
          </div>
        )}

        {/* 3. 이메일 & 비밀번호 로그인 폼 (기본 직접 노출) */}
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase text-slate-500 block mb-1">
              Email Address
            </label>
            <input
              data-testid="login-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 text-sm font-medium outline-none focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
              type="email"
              placeholder="runner@runquest.ph"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase text-slate-500">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-violet-600 hover:text-violet-700">
                Forgot password?
              </Link>
            </div>
            <input
              data-testid="login-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 text-sm font-medium outline-none focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white text-sm shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* 4. OR 구분선 */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-slate-100" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">OR CONTINUE WITH</span>
          <div className="h-[1px] flex-1 bg-slate-100" />
        </div>

        {/* 5. 소셜 간편 로그인 버튼 그리드 */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Google */}
          <button
            type="button"
            onClick={() => void handleOAuthLogin('google')}
            disabled={Boolean(socialLoading)}
            className="h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm active:scale-95 transition-all"
            title="Continue with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => void handleOAuthLogin('apple')}
            disabled={Boolean(socialLoading)}
            className="h-12 rounded-2xl border border-slate-200 bg-black hover:bg-zinc-800 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            title="Continue with Apple"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.67-2.85 1.48-.59.7-.1.14 1.86-1.02 3.03 1.08.08 2.22-.59 2.88-1.41z" />
            </svg>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => void handleOAuthLogin('facebook')}
            disabled={Boolean(socialLoading)}
            className="h-12 rounded-2xl border border-[#1877F2] bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            title="Continue with Facebook"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </div>

        {/* 6. 하단 회원가입 안내 */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-extrabold text-violet-600 hover:text-violet-700 underline underline-offset-2 ml-1">
            Sign up for free
          </Link>
        </div>
      </div>
    </section>
  );
}
