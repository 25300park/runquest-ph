import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAdmin } from './adminService';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Checking admin credentials...');

    try {
      await signInAdmin(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Admin login failed.');
    }
  }

  return (
    <section className="grid min-h-screen place-items-center bg-[#101412] px-4 text-stone-100">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-lg border border-stone-800 bg-stone-950 p-5"
      >
        <p className="text-xs font-black uppercase text-amber-200">Restricted</p>
        <h1 className="mt-1 text-2xl font-black">Admin Login</h1>
        <p className="mt-2 text-sm text-stone-400">
          This console is hidden from normal users and requires an active admin role.
        </p>

        <label className="mt-5 block">
          <span className="text-xs font-black uppercase text-stone-500">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="mt-2 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-3 text-stone-100"
            required
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-black uppercase text-stone-500">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="mt-2 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-3 text-stone-100"
            required
          />
        </label>

        {status && (
          <div className="mt-4 rounded-md border border-stone-700 bg-stone-900 p-3 text-sm text-stone-300">
            {status}
          </div>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-amber-300 px-4 py-3 font-black text-stone-950"
        >
          Enter Admin Console
        </button>
      </form>
    </section>
  );
}
