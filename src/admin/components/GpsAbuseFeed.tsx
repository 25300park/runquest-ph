import { useState } from 'react';
import type { GmAbuseLog } from '../adminService';

interface GpsAbuseFeedProps {
  logs: GmAbuseLog[];
  onToggleBan: (userId: string, isBanned: boolean, reason?: string) => Promise<void>;
}

export default function GpsAbuseFeed({ logs, onToggleBan }: GpsAbuseFeedProps) {
  const [banningId, setBanningId] = useState<string | null>(null);

  async function handleBanClick(log: GmAbuseLog) {
    setBanningId(log.user_id);
    try {
      await onToggleBan(log.user_id, !log.is_banned, log.abuse_reason);
      log.is_banned = !log.is_banned;
    } finally {
      setBanningId(null);
    }
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950 p-5 shadow-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base text-rose-500">🚨</span>
            <h3 className="text-base font-black uppercase tracking-wide text-white">
              GPS SPOOFING & ABUSE TELEMETRY
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Realtime Inter-Session Teleportation & Velocity Outlier Engine
          </p>
        </div>
        <div className="rounded-full bg-rose-500/10 px-3 py-1 border border-rose-500/30 text-[10px] font-black text-rose-400">
          ● SPHERICAL ST_DISTANCE FILTER ACTIVE
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-500">
          No flagged GPS spoofing or teleportation sessions detected.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-950/40 bg-rose-950/10 p-4 transition-all hover:border-rose-900/60"
            >
              <div className="space-y-1.5 flex-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{log.nickname}</span>
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-400 border border-rose-500/30">
                    FLAGGED
                  </span>
                  {log.is_banned && (
                    <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                      BANNED
                    </span>
                  )}
                  <span className="text-[10px] text-stone-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs font-mono font-medium text-rose-200">
                  {log.abuse_reason}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400">
                  <span>Distance: <b className="text-stone-200">{log.distance_km} km</b></span>
                  <span>Duration: <b className="text-stone-200">{Math.round(log.duration_seconds / 60)} min</b></span>
                  <span>Avg Speed: <b className="text-rose-300">{log.avg_speed_kmh} km/h</b></span>
                  <span>Max Speed: <b className="text-rose-400 font-bold">{log.max_speed_kmh} km/h</b></span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={banningId === log.user_id}
                  onClick={() => handleBanClick(log)}
                  className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${
                    log.is_banned
                      ? 'border border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
                      : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500'
                  }`}
                >
                  {banningId === log.user_id
                    ? 'Updating...'
                    : log.is_banned
                    ? 'Unban User'
                    : '🚨 Ban Account'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
