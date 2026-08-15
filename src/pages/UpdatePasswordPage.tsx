import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requireSupabaseClient } from '../lib/supabase';
import { getRunQuestSession, updateRunQuestPassword } from '../services/authService';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('Checking password reset link...');
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const client = requireSupabaseClient();
    let active = true;

    const markReady = () => {
      if (!active) return;
      setSessionReady(true);
      setStatus('Enter a new password for your RunQuest account.');
    };

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        markReady();
      }
    });

    void getRunQuestSession()
      .then((session) => {
        if (!active) return;
        if (session) {
          markReady();
        } else {
          setStatus('This password reset link is invalid or expired. Request a new reset email.');
        }
      })
      .catch(() => {
        if (active) {
          setStatus('Could not validate this password reset link. Request a new reset email.');
        }
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setStatus('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setStatus('Updating password...');

    try {
      await updateRunQuestPassword(password);
      setStatus('Password updated. Returning to RunQuest...');
      window.setTimeout(() => {
        navigate('/character-dashboard', { replace: true });
      }, 800);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      data-testid="update-password-page"
      className="min-h-full bg-[#111816] px-4 py-8 text-stone-50"
    >
      <div className="rounded-[1.5rem] border border-teal-200/20 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Account recovery</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">{status}</p>

        {sessionReady ? (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-black text-stone-200">New password</span>
              <input
                data-testid="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-stone-200">Confirm new password</span>
              <input
                data-testid="confirm-new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
                type="password"
                minLength={6}
                autoComplete="new-password"
                required
              />
            </label>

            <button
              data-testid="update-password-submit"
              type="submit"
              disabled={loading}
              className="block w-full rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-stone-400">
            <Link to="/forgot-password" className="font-black text-amber-200">
              Request a new reset link
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
