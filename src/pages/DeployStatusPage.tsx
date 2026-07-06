import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEnvironmentHealth } from '../utils/environment';

type StatusItemProps = {
  label: string;
  value: string;
  ok: boolean;
};

function StatusItem({ label, value, ok }: StatusItemProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-100">{value}</p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
          }`}
        >
          {ok ? 'OK' : 'CHECK'}
        </span>
      </div>
    </div>
  );
}

export default function DeployStatusPage() {
  const environment = useMemo(() => getEnvironmentHealth(), []);
  const deployTime = import.meta.env.VITE_DEPLOY_TIME || 'Tracked by Vercel deployment history';
  const messages =
    environment.messages.length > 0
      ? environment.messages
      : ['No client-side deployment warnings detected.'];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">RunQuest PH</p>
            <h1 className="mt-2 text-2xl font-bold">Deployment Status</h1>
          </div>
          <Link
            to="/admin"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200"
          >
            Admin
          </Link>
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          <StatusItem label="Build Status" value="Client bundle loaded" ok />
          <StatusItem label="Last Deploy" value={deployTime} ok />
          <StatusItem
            label="Supabase"
            value={environment.supabaseConfigured ? 'Client env configured' : 'Missing client env'}
            ok={environment.supabaseConfigured}
          />
          <StatusItem label="Admin Availability" value="/admin protected route active" ok />
          <StatusItem label="Health API" value="/api/health requires ADMIN_SECRET" ok />
          <StatusItem label="Runtime Mode" value={environment.mode} ok={environment.ready} />
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Error Logs
          </h2>
          <div className="mt-3 space-y-2">
            {messages.map((message) => (
              <p key={message} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-300">
                {message}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
