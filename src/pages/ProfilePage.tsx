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
    <section className="min-h-full space-y-5 bg-[#111816] px-4 py-6 text-stone-50">
      <div className="rounded-[1.35rem] border border-amber-200/30 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">Adventurer profile</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-amber-200/40 bg-[#19352d] text-lg font-black text-amber-200">
            {selectedCharacter.icon}
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-50">Demo Explorer</h1>
            <p className="mt-1 text-sm text-stone-400">{selectedCharacter.name}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-stone-950 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black uppercase text-stone-500">User level</span>
            <span className="text-2xl font-black text-amber-200">Lv {currentLevel}</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-amber-300 transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {progress.totalXp} XP total · Next level at {nextLevelXp} XP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">XP</p>
          <p className="font-black text-amber-200">{progress.totalXp}</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">Distance</p>
          <p className="font-black">{progress.totalDistanceKm.toFixed(2)} km</p>
        </div>
        <div className="rounded-2xl bg-stone-900 p-3">
          <p className="text-xs text-stone-500">Quests</p>
          <p className="font-black">{progress.completedActivities}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-200/20 bg-teal-950/30 p-4">
        <p className="text-xs font-black uppercase text-quest-teal">Character growth</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">{selectedCharacter.name}</h2>
            <p className="mt-1 text-sm text-stone-400">{selectedCharacter.rpgIdentity}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-amber-200">Lv {characterProgress.level}</p>
            <p className="text-xs text-stone-500">{characterProgress.totalXp} XP</p>
          </div>
        </div>
      </div>

      <Link
        to="/rewards"
        className="block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950"
      >
        Open Reward Wallet
      </Link>

      {isAdmin && (
        <Link
          to="/admin/dashboard"
          className="block rounded-2xl border border-teal-200 bg-teal-400 px-4 py-4 text-center font-black text-stone-950"
        >
          Admin Panel
        </Link>
      )}

      <div>
        <h2 className="font-black text-stone-50">Area exploration</h2>
        <div className="mt-3 grid gap-3">
          {mockAreas.map((area) => {
            const areaProgress = progress.areaProgress[area.id] ?? area.explorationProgress;

            return (
            <article key={area.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">
                    {area.worldZone}
                  </p>
                  <h3 className="mt-1 font-black">{area.name}</h3>
                </div>
                <span className="text-sm font-black text-amber-200">
                  {areaProgress}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-950">
                <div
                  className="h-full rounded-full bg-quest-teal transition-all duration-700"
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
