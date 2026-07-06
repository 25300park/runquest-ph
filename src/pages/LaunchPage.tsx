import { useEffect, useState } from 'react';
import { ensureUserProfile } from '../services/authService';
import { listReferralsForUser } from '../services/referralService';
import { savePushSubscription, showLocalReminder } from '../services/notificationService';
import { ensureActiveSeason, listActiveEvents } from '../services/seasonService';
import { applyEconomyBalance, type EconomyBalanceResult } from '../services/economyBalancerService';
import type { LiveUserProfile } from '../services/authService';
import type { EventRow, SeasonRow } from '../services/seasonService';

export default function LaunchPage() {
  const [profile, setProfile] = useState<LiveUserProfile | null>(null);
  const [season, setSeason] = useState<SeasonRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [balance, setBalance] = useState<EconomyBalanceResult | null>(null);
  const [status, setStatus] = useState('Loading launch systems...');

  async function loadLaunchState() {
    try {
      const nextProfile = await ensureUserProfile();
      const [nextSeason, nextEvents, referrals] = await Promise.all([
        ensureActiveSeason(),
        listActiveEvents(),
        listReferralsForUser(nextProfile.id)
      ]);

      setProfile(nextProfile);
      setSeason(nextSeason);
      setEvents(nextEvents);
      setReferralCount(referrals.length);
      setStatus('Launch systems online.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Launch systems are unavailable.');
    }
  }

  useEffect(() => {
    void loadLaunchState();
  }, []);

  async function handlePushOptIn() {
    if (!profile) return;
    const result = await savePushSubscription(profile.id);
    setStatus(result.subscribed ? 'Push notifications enabled.' : `Push permission: ${result.permission}`);
  }

  async function handleEconomyBalance() {
    try {
      setStatus('Balancing economy...');
      const result = await applyEconomyBalance();
      setBalance(result);
      setStatus('Economy balance updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Economy balance failed.');
    }
  }

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-sm font-black uppercase text-amber-200">Global launch</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">RunQuest launch systems</h1>
        <p className="mt-3 rounded-2xl bg-stone-950 p-3 text-sm text-stone-300">{status}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-quest-teal">Referral engine</p>
          <h2 className="mt-2 text-xl font-black">{profile?.referral_code ?? 'Login required'}</h2>
          <p className="mt-2 text-sm text-stone-400">{referralCount} accepted invites</p>
        </article>

        <article className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-quest-teal">Season engine</p>
          <h2 className="mt-2 text-xl font-black">{season?.name ?? 'No active season'}</h2>
          <p className="mt-2 text-sm text-stone-400">{events.length} active events</p>
        </article>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void handlePushOptIn()}
          className="rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
        >
          Enable Push Reminders
        </button>
        <button
          type="button"
          onClick={() => {
            const shown = showLocalReminder('RunQuest PH', 'Your next route is waiting.');
            setStatus(shown ? 'Local reminder sent.' : 'Enable notifications first.');
          }}
          className="rounded-2xl border border-stone-700 bg-stone-900 px-4 py-4 font-black text-stone-100"
        >
          Test Local Reminder
        </button>
        <button
          type="button"
          onClick={() => void handleEconomyBalance()}
          className="rounded-2xl border border-teal-200 bg-quest-teal px-4 py-4 font-black text-white"
        >
          Run AI Economy Balance
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 gap-3 text-center">
          {Object.entries(balance).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-stone-900 p-3">
              <p className="text-xs text-stone-500">{key}</p>
              <p className="font-black text-amber-200">{value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
