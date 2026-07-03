import { Link } from 'react-router-dom';
import { mockHabitInsight, scaleModules } from '../data/mockAiCoach';
import { mockAreas } from '../data/mockAreas';
import { getGameProgress } from '../utils/gameProgress';
import {
  createDailyCoachMessage,
  createRecoveryAdvice,
  getAreaName,
  getRecommendationReason,
  recommendRoute
} from '../utils/aiCoach';
import { calculateLevelFromXp } from '../utils/xp';

export default function AiCoachPage() {
  const progress = getGameProgress();
  const userLevel = calculateLevelFromXp(progress.totalXp);
  const preferredAreaId =
    mockAreas
      .map((area) => ({
        id: area.id,
        progress: progress.areaProgress[area.id] ?? area.explorationProgress
      }))
      .sort((firstArea, secondArea) => secondArea.progress - firstArea.progress)[0]?.id ??
    mockAreas[0].id;
  const coachMessage = createDailyCoachMessage(progress);
  const recoveryAdvice = createRecoveryAdvice(progress);
  const recommendedRoute = recommendRoute(
    progress,
    preferredAreaId,
    mockHabitInsight.preferredDistanceKm
  );
  const recommendationReason = getRecommendationReason(
    recommendedRoute,
    mockHabitInsight.preferredDistanceKm
  );

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-teal-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-quest-teal">AI Coach prototype</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Your route guide is awake</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Mock intelligence only. Today’s advice is generated from local XP, level, area progress,
          and static habit data.
        </p>
      </div>

      <article className="rounded-2xl border border-amber-200/30 bg-[linear-gradient(135deg,#292524_0%,#111816_72%)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-amber-200">Coach Card</p>
            <h2 className="mt-1 text-2xl font-black">{coachMessage.title}</h2>
          </div>
          <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black capitalize text-quest-teal">
            {coachMessage.tone}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-300">{coachMessage.message}</p>
        <div className="mt-4 rounded-2xl bg-stone-950 p-4">
          <p className="text-xs font-black uppercase text-stone-500">Recovery advice</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">{recoveryAdvice}</p>
        </div>
      </article>

      <article className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">Today’s Recommendation Card</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{recommendedRoute.name}</h2>
            <p className="mt-1 text-sm text-quest-teal">{getAreaName(recommendedRoute.areaId)}</p>
          </div>
          <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
            Lv {userLevel}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-400">{recommendationReason}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-stone-950 p-3">
            <p className="text-xs text-stone-500">Distance</p>
            <p className="font-black">{recommendedRoute.distanceKm} km</p>
          </div>
          <div className="rounded-xl bg-stone-950 p-3">
            <p className="text-xs text-stone-500">Difficulty</p>
            <p className="font-black">{recommendedRoute.difficulty}</p>
          </div>
          <div className="rounded-xl bg-stone-950 p-3">
            <p className="text-xs text-stone-500">XP</p>
            <p className="font-black text-amber-200">{recommendedRoute.xpReward}</p>
          </div>
        </div>
        <Link
          to={`/courses/${recommendedRoute.id}`}
          className="mt-4 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-3 text-center font-black text-stone-950"
        >
          View Recommended Run Today
        </Link>
      </article>

      <article className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-quest-teal">Performance Insight Card</p>
        <h2 className="mt-2 text-2xl font-black">Habit intelligence profile</h2>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-stone-950 p-4">
            <p className="text-xs font-black uppercase text-stone-500">Most active days</p>
            <p className="mt-1 font-black text-amber-200">
              {mockHabitInsight.mostActiveDays.join(', ')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-stone-950 p-4">
              <p className="text-xs font-black uppercase text-stone-500">Preferred distance</p>
              <p className="mt-1 text-xl font-black">{mockHabitInsight.preferredDistanceKm} km</p>
            </div>
            <div className="rounded-2xl bg-stone-950 p-4">
              <p className="text-xs font-black uppercase text-stone-500">Consistency</p>
              <p className="mt-1 text-xl font-black">{mockHabitInsight.consistencyLabel}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-stone-950 p-4">
            <p className="text-xs font-black uppercase text-stone-500">Coach note</p>
            <p className="mt-1 text-sm leading-6 text-stone-300">
              {mockHabitInsight.recoveryFocus}
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">Scale architecture</p>
        <h2 className="mt-2 text-2xl font-black">Ready beyond MVP</h2>
        <div className="mt-4 grid gap-3">
          {scaleModules.map((module) => (
            <div key={module.id} className="rounded-2xl bg-stone-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-black">{module.name}</h3>
                <span className="rounded-full bg-teal-950 px-3 py-1 text-xs font-black text-quest-teal">
                  {module.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-400">{module.description}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
