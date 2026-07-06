import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInRunQuest } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('Opening your RunQuest profile...');

    try {
      await signInRunQuest(email, password);
      navigate('/character-dashboard', { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-full bg-[#111816] px-4 py-8 text-stone-50">
      <div className="rounded-[1.5rem] border border-teal-200/20 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Adventurer login</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Return to your map</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Log in with Supabase Auth. Your profile and starter character are synced automatically.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-stone-200">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              type="email"
              placeholder="runner@runquest.ph"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-black text-stone-200">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              type="password"
              required
            />
          </label>
          {status && (
            <div className="rounded-2xl border border-stone-700 bg-stone-950 p-3 text-sm text-stone-300">
              {status}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)]"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          New adventurer?{' '}
          <Link to="/register" className="font-black text-quest-teal">
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
