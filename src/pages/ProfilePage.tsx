import { useEffect, useState } from 'react';
import { mockAreas } from '../data/mockAreas';
import { mockCharacters } from '../data/mockCharacters';
import { getGameProgress } from '../utils/gameProgress';
import { calculateLevelFromXp, getCurrentLevelBaseXp, getNextLevelXp } from '../utils/xp';
import { Link } from 'react-router-dom';
import { getCurrentAdminProfile } from '../admin/adminService';

export default function ProfilePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const progress = getGameProgress();
  const selectedCharacter =
    mockCharacters.find((character) => character.id === progress.selectedCharacterId) ??
    mockCharacters[0];
  const characterProgress = progress.characterProgress[selectedCharacter.id] ?? {
    totalXp: 0,
    level: 1
  };
  const currentLevel = calculateLevelFromXp(progress.totalXp);
  const nextLevelXp = getNextLevelXp(progress.totalXp);
  const currentLevelBaseXp = getCurrentLevelBaseXp(progress.totalXp);
  const xpProgress =
    nextLevelXp <= progress.totalXp
      ? 100
      : Math.round(
          ((progress.totalXp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100
        );

  useEffect(() => {
    getCurrentAdminProfile()
      .then((profile) => setIsAdmin(Boolean(profile && profile.role === 'admin')))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-12 select-none">
      {/* 1. 프로필 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">Adventurer profile</p>
        <div className="mt-3 flex items-center gap-3.5">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-xl font-black shadow-md shadow-violet-500/25">
            {selectedCharacter.icon}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Demo Explorer</h1>
            <p className="text-xs text-slate-500 font-bold">{selectedCharacter.name}</p>
          </div>
        </div>

        {/* 레벨 & EXP 게이지 */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400">User Level</span>
            <span className="text-xl font-black text-violet-700">Lv {currentLevel}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 font-bold">
            {progress.totalXp} XP total · Next level at {nextLevelXp} XP
          </p>
        </div>
      </div>

      {/* 2. 3열 스탯 그리드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">XP</p>
          <p className="font-black text-amber-600 text-base mt-0.5">{progress.totalXp}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
          <p className="font-black text-slate-800 text-base mt-0.5">{progress.totalDistanceKm.toFixed(1)} km</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Quests</p>
          <p className="font-black text-violet-600 text-base mt-0.5">{progress.completedActivities}</p>
        </div>
      </div>

      {/* 3. 캐릭터 성장 상태 카드 */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase text-violet-600">Character Growth</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">{selectedCharacter.name}</h2>
            <p className="text-xs text-slate-500">{selectedCharacter.rpgIdentity}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-amber-600">Lv {characterProgress.level}</p>
            <p className="text-xs text-slate-400 font-bold">{characterProgress.totalXp} XP</p>
          </div>
        </div>
      </div>

      {/* 4. 보상 지갑 CTA */}
      <Link
        to="/rewards"
        className="block w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-center font-bold text-sm text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-all"
      >
        🎁 Open Reward Wallet
      </Link>

      {isAdmin && (
        <Link
          to="/admin/dashboard"
          className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center font-bold text-xs text-slate-700 shadow-sm active:scale-95 transition-all"
        >
          ⚙️ Admin Panel
        </Link>
      )}

      {/* 5. 지역 탐험 게이지 리스트 */}
      <div>
        <h2 className="font-black text-sm text-slate-900 mb-2.5">Area Exploration</h2>
        <div className="grid gap-2.5">
          {mockAreas.map((area) => {
            const areaProgress = progress.areaProgress[area.id] ?? area.explorationProgress;

            return (
              <article key={area.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-violet-600">
                      {area.worldZone}
                    </p>
                    <h3 className="mt-0.5 font-black text-xs text-slate-900">{area.name}</h3>
                  </div>
                  <span className="text-xs font-black text-amber-600">
                    {areaProgress}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-700"
                    style={{ width: `${areaProgress}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
