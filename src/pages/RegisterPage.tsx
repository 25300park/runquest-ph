import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerRunQuest } from '../services/authService';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('Creating your RunQuest account...');

    try {
      await registerRunQuest({ email, password, name, referralCode: referralCode.trim() || undefined });
      navigate('/character-dashboard', { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-full bg-[#111816] px-4 py-8 text-stone-50">
      <div className="rounded-[1.5rem] border border-amber-200/20 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">New quest file</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Create your adventurer</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Create a real Supabase account. RunQuest will set up your profile and starter character.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-stone-200">Display name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              placeholder="City Explorer"
              required
            />
          </label>
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
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-black text-stone-200">Referral code</span>
            <input
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              placeholder="Optional invite code"
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
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  );
}
