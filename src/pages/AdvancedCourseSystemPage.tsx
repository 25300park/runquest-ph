import { Link } from 'react-router-dom';
import { createCourseRecommendations } from '../utils/courseRecommendations';
import { getGameProgress } from '../utils/gameProgress';
import { calculateLevelFromXp } from '../utils/xp';

const preferredDistanceKm = 2.5;

export default function AdvancedCourseSystemPage() {
  const progress = getGameProgress();
  const level = calculateLevelFromXp(progress.totalXp);
  const recommendations = createCourseRecommendations(progress, preferredDistanceKm);
  const recommendationCards = [
    {
      title: 'Recommended run today',
      label: 'Balanced',
      course: recommendations.recommendedRun,
      reason: 'Best match for your current level and preferred distance.'
    },
    {
      title: 'Recovery run suggestion',
      label: 'Recovery',
      course: recommendations.recoveryRun,
      reason: 'Shorter and easier so you can keep rhythm without forcing intensity.'
    },
    {
      title: 'Challenge run suggestion',
      label: 'Challenge',
      course: recommendations.challengeRun,
      reason: 'A stretch route when you want a stronger XP push.'
    }
  ];

  return (
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-sm font-black uppercase text-amber-200">Advanced course system</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Smart route console</h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          Mock AI chooses routes from your level, past activity count, and preferred distance.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">Level</p>
          <p className="font-black text-amber-200">{level}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">Runs</p>
          <p className="font-black">{progress.completedActivities}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">Preference</p>
          <p className="font-black">{preferredDistanceKm} km</p>
        </div>
      </div>

      <div className="grid gap-3">
        {recommendationCards.map((item) => (
          <article key={item.title} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-quest-teal">{item.title}</p>
                <h2 className="mt-1 text-2xl font-black">{item.course.name}</h2>
                <p className="mt-1 text-sm text-stone-400">{item.course.areaName}</p>
              </div>
              <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
                {item.label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-400">{item.reason}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-stone-950 p-3">
                <p className="text-xs text-stone-500">Km</p>
                <p className="font-black">{item.course.distanceKm}</p>
              </div>
              <div className="rounded-xl bg-stone-950 p-3">
                <p className="text-xs text-stone-500">Difficulty</p>
                <p className="font-black">{item.course.difficulty}</p>
              </div>
              <div className="rounded-xl bg-stone-950 p-3">
                <p className="text-xs text-stone-500">XP</p>
                <p className="font-black text-amber-200">{item.course.xpReward}</p>
              </div>
            </div>
            <Link
              to={`/courses/${item.course.id}`}
              className="mt-4 block rounded-2xl bg-quest-teal px-4 py-3 text-center font-black text-white"
            >
              Open Route
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
