import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestRunQuestPasswordReset } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('Sending password reset email...');

    try {
      await requestRunQuestPasswordReset(email);
      setSent(true);
      setStatus(
        'If this email is registered, a password reset link has been sent. Open the email on this device and follow the link.'
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send password reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      data-testid="forgot-password-page"
      className="min-h-full bg-[#111816] px-4 py-8 text-stone-50"
    >
      <div className="rounded-[1.5rem] border border-amber-200/20 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Account recovery</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Enter the email address used for your RunQuest account.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-stone-200">Email</span>
            <input
              data-testid="reset-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          {status && (
            <div
              data-testid="reset-request-status"
              className="rounded-2xl border border-stone-700 bg-stone-950 p-3 text-sm text-stone-300"
            >
              {status}
            </div>
          )}

          <button
            data-testid="reset-request-submit"
            type="submit"
            disabled={loading || sent}
            className="block w-full rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending...' : sent ? 'Reset email sent' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          <Link to="/login" className="font-black text-quest-teal">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}
