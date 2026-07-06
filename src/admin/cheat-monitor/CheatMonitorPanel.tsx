import { useEffect, useState } from 'react';
import {
  listCheatReports,
  listFlaggedSessions,
  subscribeToAdminRealtime,
  updateUserStatus,
  type AdminCheatReport
} from '../adminService';
import type { Database } from '../../types/database';

type FlaggedSession = Database['public']['Tables']['flagged_sessions']['Row'];

export default function CheatMonitorPanel() {
  const [reports, setReports] = useState<AdminCheatReport[]>([]);
  const [flags, setFlags] = useState<FlaggedSession[]>([]);
  const [status, setStatus] = useState('Loading cheat monitor...');

  async function loadCheatData() {
    try {
      const [nextReports, nextFlags] = await Promise.all([
        listCheatReports(),
        listFlaggedSessions()
      ]);
      setReports(nextReports);
      setFlags(nextFlags);
      setStatus('Realtime cheat monitor active.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load cheat monitor.');
    }
  }

  useEffect(() => {
    void loadCheatData();
    return subscribeToAdminRealtime(() => void loadCheatData());
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Integrity</p>
        <h2 className="mt-1 text-2xl font-black">Cheat Monitor</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase text-stone-500">Flagged users</h3>
          {reports.map((report) => (
            <article key={report.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">User {report.user_id ?? 'unknown'}</p>
                  <p className="mt-1 text-xs text-stone-500">Session {report.session_id ?? 'none'}</p>
                </div>
                <span className="rounded-md bg-red-950 px-2 py-1 text-xs font-black text-red-200">
                  score {report.cheat_score}
                </span>
              </div>
              <div className="mt-3 grid gap-2 rounded-md bg-stone-900 p-3 text-xs text-stone-300">
                <p>flagged_reason: {report.reason ?? 'No reason stored'}</p>
                <p>session_history: {report.session_id ?? 'No session linked'}</p>
                <p>xp_multiplier: {report.xp_multiplier}</p>
              </div>
              {report.user_id && (
                <button
                  type="button"
                  onClick={() => void updateUserStatus(report.user_id!, 'banned').then(loadCheatData)}
                  className="mt-3 rounded-md border border-red-400/40 px-3 py-2 text-sm font-bold text-red-200"
                >
                  Auto-ban User
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase text-stone-500">GPS anomaly logs</h3>
          {flags.map((flag) => (
            <article key={flag.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{flag.flag_type}</p>
                  <p className="mt-1 text-xs text-stone-500">user_id: {flag.user_id ?? 'unknown'}</p>
                </div>
                <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-black text-amber-200">
                  severity {flag.severity}
                </span>
              </div>
              <p className="mt-2 text-xs text-stone-500">session_history: {flag.session_id ?? 'No session'}</p>
              <pre className="mt-3 overflow-auto rounded-md bg-stone-900 p-3 text-xs text-stone-300">
                {JSON.stringify(flag.details, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
