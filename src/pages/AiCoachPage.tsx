import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCharacterProfile } from '../services/characterService';
import { generateTrainingPlan, getRealtimeCoaching, type CoachMessage } from '../services/aiCoachService';
import type { CharacterProfile } from '../types/rpgCharacter';

export default function AiCoachPage() {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [coachMessage, setCoachMessage] = useState<CoachMessage | null>(null);
  const [status, setStatus] = useState('Loading coach profile...');

  useEffect(() => {
    let active = true;

    async function loadCoach() {
      try {
        const nextProfile = await getCharacterProfile();
        if (!active) return;

        setProfile(nextProfile);
        const totalDistance = nextProfile?.stats?.total_distance ?? 0;
        const totalRuns = nextProfile?.stats?.total_runs ?? 0;
        const averageDistance = totalRuns > 0 ? totalDistance / totalRuns : 2;
        const message = await getRealtimeCoaching({
          distanceKm: averageDistance,
          paceSecondsPerKm: 540,
          elapsedSeconds: Math.round(averageDistance * 540),
          fatigueLevel: (nextProfile?.stats?.streak_days ?? 0) >= 4 ? 0.8 : 0.35
        });

        if (!active) return;
        setCoachMessage(message);
        setStatus(nextProfile ? 'AI coach synced to your running profile.' : 'Create a character to personalize coaching.');
      } catch (error) {
        if (!active) return;
        setStatus(error instanceof Error ? error.message : 'Coach is using safe fallback advice.');
        setCoachMessage({
          message: 'Start with an easy route today. Keep the pace conversational and finish feeling steady.',
          messageType: 'motivation',
          paceTarget: null,
          fatigueLevel: 0.3
        });
      }
    }

    void loadCoach();
    return () => {
      active = false;
    };
  }, []);

  const stats = profile?.stats;
  const plan = useMemo(
    () =>
      generateTrainingPlan({
        totalRuns: stats?.total_runs ?? 0,
        totalDistanceKm: stats?.total_distance ?? 0,
        averagePaceSecondsPerKm: 540,
        streakDays: stats?.streak_days ?? 0
      }),
    [stats]
  );

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-teal-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-quest-teal">AI Coach live mode</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Your route guide is awake</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">{status}</p>
      </div>

      <article className="rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#292524_0%,#111816_72%)] p-5">
        <p className="text-xs font-black uppercase text-amber-200">Coach Card</p>
        <h2 className="mt-2 text-2xl font-black">
          {coachMessage?.messageType === 'fatigue' ? 'Recovery focus' : 'Today rhythm'}
        </h2>
        <p className="mt-4 text-sm leading-6 text-stone-300">
          {coachMessage?.message ?? 'Preparing your coach message...'}
        </p>
      </article>

      <article className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">Weekly improvement plan</p>
        <h2 className="mt-2 text-2xl font-black">{plan.weeklyGoalKm} km weekly goal</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-stone-950 p-3">
            <p className="text-xs text-stone-500">Easy run</p>
            <p className="font-black">{plan.easyRunKm} km</p>
          </div>
          <div className="rounded-xl bg-stone-950 p-3">
            <p className="text-xs text-stone-500">Challenge run</p>
            <p className="font-black">{plan.challengeRunKm} km</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-400">{plan.recoveryAdvice}</p>
      </article>

      <article className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-quest-teal">Performance Insight Card</p>
        <h2 className="mt-2 text-2xl font-black">Live habit profile</h2>
        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-stone-950 p-4">
              <p className="text-xs text-stone-500">Runs</p>
              <p className="mt-1 text-xl font-black">{stats?.total_runs ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-stone-950 p-4">
              <p className="text-xs text-stone-500">Distance</p>
              <p className="mt-1 text-xl font-black">{(stats?.total_distance ?? 0).toFixed(1)}</p>
            </div>
            <div className="rounded-2xl bg-stone-950 p-4">
              <p className="text-xs text-stone-500">Streak</p>
              <p className="mt-1 text-xl font-black">{stats?.streak_days ?? 0}</p>
            </div>
          </div>
          <p className="rounded-2xl bg-stone-950 p-4 text-sm leading-6 text-stone-300">{plan.focus}</p>
        </div>
      </article>

      <Link
        to="/map"
        className="block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950"
      >
        Find a Route
      </Link>
    </section>
  );
}
