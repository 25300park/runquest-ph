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
      title: 'Recommended Run Today',
      label: 'Balanced',
      course: recommendations.recommendedRun,
      reason: 'Best match for your current level and preferred distance.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      title: 'Recovery Run Suggestion',
      label: 'Recovery',
      course: recommendations.recoveryRun,
      reason: 'Shorter and easier so you can keep rhythm without forcing intensity.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      title: 'Challenge Run Suggestion',
      label: 'Challenge',
      course: recommendations.challengeRun,
      reason: 'A stretch route when you want a stronger XP push.',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-24 select-none">
      {/* 1. 상단 스마트 루트 콘솔 타이틀 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
          Advanced Course System
        </p>
        <h1 className="mt-0.5 text-2xl font-black text-slate-900">Smart Route Console</h1>
        <p className="mt-1 text-xs text-slate-500">
          Smart AI recommends tailored routes based on your level, past quests, and preferred distance.
        </p>
      </div>

      {/* 2. 3열 핵심 러너 프로필 스탯 카드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Level</p>
          <p className="font-black text-violet-700 text-base mt-0.5">Lv {level}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Runs</p>
          <p className="font-black text-slate-800 text-base mt-0.5">{progress.completedActivities}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Preferred</p>
          <p className="font-black text-amber-600 text-base mt-0.5">{preferredDistanceKm} km</p>
        </div>
      </div>

      {/* 3. 스마트 추천 코스 카드 리스트 */}
      <div className="space-y-3.5 pt-1">
        {recommendationCards.map((item) => (
          <article
            key={item.title}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-violet-600">{item.title}</p>
                <h2 className="mt-0.5 text-lg font-black text-slate-900">{item.course.name}</h2>
                <p className="text-[11px] text-slate-400 font-bold">{item.course.areaName}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${item.badgeColor}`}>
                {item.label}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{item.reason}</p>

            {/* 코스 스탯 3열 */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
                <p className="font-black text-sm text-slate-900 mt-0.5">{item.course.distanceKm} <span className="text-[10px] text-slate-500">km</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Difficulty</p>
                <p className="font-black text-sm text-violet-700 mt-0.5">{item.course.difficulty}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Reward</p>
                <p className="font-black text-sm text-amber-600 mt-0.5">+{item.course.xpReward} XP</p>
              </div>
            </div>

            <Link
              to={`/courses/${item.course.id}`}
              className="block w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-center font-bold text-xs text-white shadow-md shadow-violet-500/20 active:scale-98 transition-all"
            >
              Open Route Details →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
