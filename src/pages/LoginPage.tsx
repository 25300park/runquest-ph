import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRunQuestSession, signInRunQuest } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isEmailMode, setIsEmailMode] = useState(false);
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
    <section data-testid="login-page" className="min-h-full bg-[#111816] px-4 py-8 text-stone-50 font-sans">
      <div className="max-w-md mx-auto rounded-[1.75rem] border border-teal-200/20 bg-stone-900/95 backdrop-blur-md p-6 sm:p-7 shadow-2xl">
        {/* 상단 브랜딩 헤더 */}
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">
            Welcome to RunQuest PH
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">
            {isEmailMode ? 'Log In with Email' : 'Join the Adventure'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {isEmailMode 
              ? 'Enter your account details to continue your quest.' 
              : 'Sign in to track your routes, earn XP, and level up.'}
          </p>
        </div>

        {/* 상태 및 에러 메시지 알림 */}
        {status && (
          <div className="mt-5 rounded-2xl border border-stone-700 bg-stone-950/80 p-3.5 text-center text-xs font-bold text-amber-200">
            {status}
          </div>
        )}

        {/* ========================================================= */}
        {/* 모드 1: 소셜 간편 로그인 버튼 목록 (기본 노출)              */}
        {/* ========================================================= */}
        {!isEmailMode ? (
          <div className="mt-7 flex flex-col gap-3.5">
            {/* 1. Google 로그인 */}
            <button
              type="button"
              onClick={() => void handleOAuthLogin('google')}
              disabled={Boolean(socialLoading)}
              className="h-14 w-full rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-base border border-slate-200 shadow-md flex items-center justify-center gap-3.5 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* 2. Facebook 로그인 */}
            <button
              type="button"
              onClick={() => void handleOAuthLogin('facebook')}
              disabled={Boolean(socialLoading)}
              className="h-14 w-full rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-base shadow-md flex items-center justify-center gap-3.5 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {socialLoading === 'facebook' ? (
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>Continue with Facebook</span>
            </button>

            {/* 3. Apple 로그인 */}
            <button
              type="button"
              onClick={() => void handleOAuthLogin('apple')}
              disabled={Boolean(socialLoading)}
              className="h-14 w-full rounded-2xl bg-black hover:bg-zinc-900 text-white font-bold text-base border border-zinc-800 shadow-md flex items-center justify-center gap-3.5 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {socialLoading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.67-2.85 1.48-.59.7-.1.14 1.86-1.02 3.03 1.08.08 2.22-.59 2.88-1.41z" />
                </svg>
              )}
              <span>Continue with Apple</span>
            </button>

            {/* 구분선 */}
            <div className="my-1 flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-stone-800" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">OR</span>
              <div className="h-[1px] flex-1 bg-stone-800" />
            </div>

            {/* 4. Email 로그인으로 전환 버튼 */}
            <button
              type="button"
              onClick={() => {
                setIsEmailMode(true);
                setStatus('');
              }}
              className="h-14 w-full rounded-2xl bg-stone-950/80 hover:bg-stone-800/90 text-stone-100 font-bold text-base border border-stone-700 hover:border-amber-300/60 shadow-md flex items-center justify-center gap-3.5 active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>Continue with Email</span>
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* 모드 2: 이메일 / 비밀번호 입력 폼                          */
          /* ========================================================= */
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setIsEmailMode(false);
                setStatus('');
              }}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 mb-2"
            >
              ← Back to Social Login
            </button>

            <div>
              <span className="text-xs font-black uppercase text-stone-300">Email Address</span>
              <input
                data-testid="login-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3.5 text-stone-50 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                type="email"
                placeholder="runner@runquest.ph"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-stone-300">Password</span>
                <Link to="/forgot-password" className="text-xs font-bold text-amber-300/80 hover:text-amber-300">
                  Forgot?
                </Link>
              </div>
              <input
                data-testid="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-3.5 text-stone-50 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-14 rounded-2xl border border-amber-200 bg-amber-300 font-black text-stone-950 text-base shadow-[0_6px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_2px_0_rgba(120,53,15,0.55)] disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 하단 회원가입 안내 (New here? Sign up)                      */}
        {/* ========================================================= */}
        <div className="mt-7 pt-5 border-t border-stone-800 text-center text-sm text-stone-400">
          New here?{' '}
          <Link to="/register" className="font-extrabold text-amber-300 hover:text-amber-200 underline decoration-amber-400/40 hover:decoration-amber-300 ml-1">
            Sign up
          </Link>
        </div>
      </div>
    </section>
  );
}
