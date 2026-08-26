import { useState, useMemo } from 'react';
import {
  currentMonthRunners,
  pastMonthRunners
} from '../data/mockLeaderboard';
import { getGameProgress } from '../utils/gameProgress';

type SortMetric = 'score' | 'distance' | 'xp';

export default function LeaderboardPage() {
  const [selectedSeason, setSelectedSeason] = useState<'current' | 'past'>('current');
  const [sortBy, setSortBy] = useState<SortMetric>('score');
  const progress = getGameProgress();

  // 현재 날짜 및 월말까지 남은 일수(D-Day) 계산
  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, lastDayOfMonth - now.getDate());

  // 데이터 소스 선택 및 내 점수 동기화
  const baseData = useMemo(() => {
    const list = selectedSeason === 'current' ? [...currentMonthRunners] : [...pastMonthRunners];
    // 현재 로그인 유저의 실시간 XP/거리 반영
    if (selectedSeason === 'current') {
      const myIndex = list.findIndex((r) => r.isCurrentUser);
      if (myIndex !== -1) {
        list[myIndex] = {
          ...list[myIndex],
          monthlyDistanceKm: Math.max(list[myIndex].monthlyDistanceKm, progress.totalDistanceKm),
          monthlyXp: Math.max(list[myIndex].monthlyXp, progress.totalXp),
          monthlyScore: Math.round(
            Math.max(list[myIndex].monthlyDistanceKm, progress.totalDistanceKm) * 80 +
              Math.max(list[myIndex].monthlyXp, progress.totalXp) * 0.5
          )
        };
      }
    }
    return list;
  }, [selectedSeason, progress]);

  // 정렬 기준에 따라 랭킹 재계산
  const sortedRunners = useMemo(() => {
    const list = [...baseData];
    list.sort((a, b) => {
      if (sortBy === 'distance') return b.monthlyDistanceKm - a.monthlyDistanceKm;
      if (sortBy === 'xp') return b.monthlyXp - a.monthlyXp;
      return b.monthlyScore - a.monthlyScore;
    });

    return list.map((runner, index) => ({
      ...runner,
      rank: index + 1
    }));
  }, [baseData, sortBy]);

  const top1 = sortedRunners[0];
  const top2 = sortedRunners[1];
  const top3 = sortedRunners[2];
  const restRunners = sortedRunners.slice(3);

  const currentUser = sortedRunners.find((r) => r.isCurrentUser);

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-24 select-none">
      {/* 1. 상단 월간 시즌 브랜딩 헤더 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
              Monthly Ranking Arena
            </p>
            <h1 className="mt-0.5 text-2xl font-black text-slate-900">
              {selectedSeason === 'current' ? `${currentMonthName} League` : 'Past Champions Hall'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {selectedSeason === 'current'
                ? 'Compete with runners across the Philippines for monthly rewards and glory.'
                : 'Hall of Fame: Top-ranked runners from the previous season.'}
            </p>
          </div>
          {selectedSeason === 'current' && (
            <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 border border-violet-200/60 shadow-sm animate-pulse">
              ⏳ D-{daysLeftInMonth} left
            </span>
          )}
        </div>
      </div>

      {/* 2. 시즌 탭 (이번 달 / 지난 달) */}
      <div className="flex gap-2 p-1 bg-slate-200/70 rounded-2xl">
        <button
          type="button"
          onClick={() => setSelectedSeason('current')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
            selectedSeason === 'current'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🔥 This Month ({now.toLocaleString('en-US', { month: 'short' })})
        </button>
        <button
          type="button"
          onClick={() => setSelectedSeason('past')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
            selectedSeason === 'past'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🏆 Last Month
        </button>
      </div>

      {/* 3. 정렬 기준 칩 (점수 / 거리 / EXP) */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSortBy('score')}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${
            sortBy === 'score'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🎯 Monthly Score
        </button>
        <button
          type="button"
          onClick={() => setSortBy('distance')}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${
            sortBy === 'distance'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          🏃 Distance (km)
        </button>
        <button
          type="button"
          onClick={() => setSortBy('xp')}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all ${
            sortBy === 'xp'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ⚡ Total EXP
        </button>
      </div>

      {/* 4. 🥇🥈🥉 Top 3 챔피언 포디움 (Podium) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase text-violet-600 text-center mb-4">
          👑 Monthly Top 3 Champions
        </p>

        <div className="flex items-end justify-center gap-2 pt-2 pb-1">
          {/* 2위 (Silver) */}
          {top2 && (
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-slate-300 flex items-center justify-center text-2xl shadow-md">
                  {top2.avatar}
                </div>
                <span className="absolute -bottom-2 -right-1 bg-slate-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white">
                  🥈 #2
                </span>
              </div>
              <p className="mt-3 text-xs font-black text-slate-900 truncate max-w-[90px]">
                {top2.runnerName}
              </p>
              <p className="text-[11px] font-black text-slate-600 mt-0.5">
                {sortBy === 'distance'
                  ? `${top2.monthlyDistanceKm.toFixed(1)} km`
                  : sortBy === 'xp'
                  ? `${top2.monthlyXp} XP`
                  : `${top2.monthlyScore.toLocaleString()} pts`}
              </p>
            </div>
          )}

          {/* 1위 (Gold 👑) */}
          {top1 && (
            <div className="flex-1 flex flex-col items-center text-center -translate-y-2">
              <span className="text-xl animate-bounce mb-1">👑</span>
              <div className="relative">
                <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-100 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-xl shadow-amber-400/30">
                  {top1.avatar}
                </div>
                <span className="absolute -bottom-2 -right-1 bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md">
                  🥇 #1
                </span>
              </div>
              <p className="mt-3 text-xs font-black text-amber-900 truncate max-w-[100px]">
                {top1.runnerName}
              </p>
              <p className="text-xs font-black text-amber-600 mt-0.5">
                {sortBy === 'distance'
                  ? `${top1.monthlyDistanceKm.toFixed(1)} km`
                  : sortBy === 'xp'
                  ? `${top1.monthlyXp} XP`
                  : `${top1.monthlyScore.toLocaleString()} pts`}
              </p>
            </div>
          )}

          {/* 3위 (Bronze) */}
          {top3 && (
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-50 border-2 border-amber-300/80 flex items-center justify-center text-2xl shadow-md">
                  {top3.avatar}
                </div>
                <span className="absolute -bottom-2 -right-1 bg-amber-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white">
                  🥉 #3
                </span>
              </div>
              <p className="mt-3 text-xs font-black text-slate-900 truncate max-w-[90px]">
                {top3.runnerName}
              </p>
              <p className="text-[11px] font-black text-amber-800 mt-0.5">
                {sortBy === 'distance'
                  ? `${top3.monthlyDistanceKm.toFixed(1)} km`
                  : sortBy === 'xp'
                  ? `${top3.monthlyXp} XP`
                  : `${top3.monthlyScore.toLocaleString()} pts`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. 내 현재 월간 랭킹 요약 카드 (My Standing) */}
      {currentUser && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 p-4 text-white shadow-lg shadow-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black border border-white/30">
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-violet-200">Your Standing</p>
                <h3 className="text-sm font-black text-white">{currentUser.runnerName}</h3>
                <p className="text-[11px] text-white/80">
                  {currentUser.monthlyDistanceKm.toFixed(1)} km · {currentUser.completedQuests} quests
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-300">#{currentUser.rank}</span>
              <p className="text-[10px] font-bold text-white/90">
                {sortBy === 'distance'
                  ? `${currentUser.monthlyDistanceKm.toFixed(1)} km`
                  : sortBy === 'xp'
                  ? `${currentUser.monthlyXp} XP`
                  : `${currentUser.monthlyScore.toLocaleString()} pts`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. 월간 랭킹 리스트 (#4 ~ #10) */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">All Runners</h2>
        <div className="grid gap-2">
          {restRunners.map((runner) => (
            <article
              key={runner.id}
              className={`rounded-2xl border p-3.5 shadow-sm flex items-center justify-between gap-3 transition-all ${
                runner.isCurrentUser
                  ? 'border-violet-300 bg-violet-50/70 ring-2 ring-violet-500/20'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 text-center font-black text-xs text-slate-400">
                  #{runner.rank}
                </span>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                  {runner.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-xs text-slate-900 truncate">
                    {runner.runnerName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold truncate">
                    {runner.characterTitle}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-sm text-violet-700">
                  {sortBy === 'distance'
                    ? `${runner.monthlyDistanceKm.toFixed(1)} km`
                    : sortBy === 'xp'
                    ? `${runner.monthlyXp} XP`
                    : `${runner.monthlyScore.toLocaleString()} pts`}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {runner.completedQuests} quests done
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
