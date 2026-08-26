import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCharacterProfile, subscribeToCharacterUpdates } from '../services/characterService';
import { subscribeToAvatarRealtime } from '../services/aiAvatarService';
import { subscribeToEquipmentEconomy } from '../services/equipmentEconomyService';
import type { CharacterProfile } from '../types/rpgCharacter';
import { getLevelProgress, xpPerLevel } from '../utils/characterRpg';
import { defaultExplorationStats } from '../utils/fogOfWar';

function getCurrentWeekdays(): Array<{ day: string; date: number; fullDate: string; isToday: boolean }> {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 이번 주 월요일 계산 (월요일 시작 기준)
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  return Array.from({ length: 7 }).map((_, index) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + index);

    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    return {
      day: dayNames[targetDate.getDay()],
      date: targetDate.getDate(),
      fullDate: targetDate.toISOString().split('T')[0],
      isToday
    };
  });
}

export default function CharacterDashboardPage() {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [status, setStatus] = useState('Loading hero...');
  const weekdays = useMemo(() => getCurrentWeekdays(), []);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    async function loadProfile() {
      try {
        const nextProfile = await getCharacterProfile();
        setProfile(nextProfile);
        setStatus(nextProfile ? '' : 'No character found.');

        if (nextProfile) {
          const refresh = async () => {
            const refreshedProfile = await getCharacterProfile(nextProfile.character.id);
            setProfile(refreshedProfile);
          };
          unsubscribers.push(subscribeToCharacterUpdates(nextProfile.character.id, refresh));
          unsubscribers.push(subscribeToAvatarRealtime(nextProfile.character.id, refresh));
          unsubscribers.push(subscribeToEquipmentEconomy(nextProfile.character.id, refresh));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load character.';
        setStatus(message);
      }
    }

    loadProfile();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const equippedItems = useMemo(
    () => profile?.equipment.filter((equipment) => equipment.equipped) ?? [],
    [profile]
  );
  const xpProgress = profile ? getLevelProgress(profile.character.xp) : 0;
  const currentLevel = profile?.character.level ?? 1;
  const savedName = typeof window !== 'undefined' ? window.localStorage.getItem('runquest-selected-name') : null;
  const runnerName = savedName || profile?.character.name || 'Adventurer';
  const savedAvatar = typeof window !== 'undefined' ? window.localStorage.getItem('runquest-selected-avatar') : null;
  const avatarUrl = savedAvatar || profile?.character.avatar_base_url || '/images/avatars/1.png';

  if (!profile) {
    return (
      <section className="grid min-h-screen place-items-center bg-slate-900 px-4 py-8 text-center text-white font-sans">
        <div className="rounded-3xl border border-slate-700 bg-slate-800/90 p-6 max-w-sm w-full shadow-2xl">
          <div className="w-16 h-16 bg-violet-600/20 text-violet-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            🧙
          </div>
          <p className="text-xs font-black uppercase text-amber-300">RunQuest Hero</p>
          <h1 className="mt-2 text-2xl font-black">Create your hero first</h1>
          <p className="mt-2 text-sm text-slate-400">{status}</p>
          <Link
            to="/character/create"
            className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-violet-600/30 active:scale-95 transition-all"
          >
            Create Character
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 font-sans pb-12 select-none">
      {/* 1. 상단 프로필 헤더 */}
      <header className="pt-4 px-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Welcome back
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl font-black text-slate-900">
              Hello, {runnerName} 👋
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-tight">
              Novice Runner
            </span>
          </div>
        </div>

        {/* 우측 랭킹 & 프로필 아바타 버튼 */}
        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-700 flex items-center justify-center text-lg shadow-sm active:scale-95 transition-all"
            title="월간 랭킹 (Leaderboard)"
          >
            🏆
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-violet-500/25 active:scale-95 transition-all border-2 border-white overflow-hidden p-0.5"
          >
            <img src={avatarUrl} alt="Hero Avatar" className="w-full h-full object-contain filter drop-shadow-sm" />
          </Link>
        </div>
      </header>

      {/* 2. 주간 캘린더 스트립 (Mon ~ Sun) */}
      <section className="px-5 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 flex items-center justify-between gap-1">
          {weekdays.map((item) => (
            <div
              key={item.day}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                item.isToday
                  ? 'bg-gradient-to-b from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 scale-105'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{item.day}</span>
              <span className={`text-xs font-black mt-0.5 ${item.isToday ? 'text-white' : 'text-slate-700'}`}>
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 메인 RPG 카드 (핵심: 9:16 캐릭터 숏폼 영상 + 3D 아바타 피규어 + HUD + Start CTA) */}
      <section className="px-5 py-2">
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 relative overflow-hidden flex flex-col gap-3">
          {/* 캐릭터 9:16 루프 영상 Placeholder 영역 */}
          <div className="relative w-full aspect-[9/16] max-h-[380px] rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center">
            {/* 실제 캐릭터 루프 영상 태그 */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              poster="/characters/starter-preview.png"
            >
              <source src="/characters/tiger-runner-loop.mp4" type="video/mp4" />
            </video>

            {/* 비디오 위 가독성 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />

            {/* 🔥 유저가 선택한 23종 캐릭터 아바타 3D 피규어 중앙 렌더링 */}
            <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center pointer-events-none -mt-4 animate-in zoom-in duration-300">
              <img
                src={avatarUrl}
                alt="Selected Hero Avatar"
                className="w-full h-full object-contain filter drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* 상단 오버레이: HP 및 상태 배지 */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] font-black text-rose-400 flex items-center gap-1 shadow-sm">
                <span>❤️</span> HP 100/100
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] font-black text-emerald-400 flex items-center gap-1 shadow-sm">
                <span>⚡</span> Stamina 92%
              </span>
            </div>

            {/* 하단 오버레이: 레벨 & EXP 프로그레스 바 */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-white z-20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-amber-300">Level {currentLevel}</span>
                <span className="text-[11px] text-slate-300 font-mono">
                  {xpProgress}/{xpPerLevel} XP
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
                  style={{ width: `${Math.min(100, (xpProgress / xpPerLevel) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 카드 최하단 메인 액션 버튼 */}
          <Link
            to="/map"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-violet-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/20"
          >
            <span className="text-lg">▶️</span>
            <span>Start Daily Quest</span>
          </Link>
        </div>
      </section>

      {/* 4. 스와이프 가능한 서브 퀘스트 섹션 (Step 3) */}
      <section className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-black text-slate-900">Available Quests</h2>
          <Link to="/map" className="text-xs font-bold text-violet-600 hover:underline">
            View All →
          </Link>
        </div>

        {/* 가로 스와이프 카드 컨테이너 */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
          {/* 퀘스트 1 */}
          <div className="min-w-[210px] bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 snap-start flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">🏃</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  +150 XP
                </span>
              </div>
              <h3 className="font-black text-xs text-slate-900 mt-2">Morning 3km Dash</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">3.0 km • Easy Pace</p>
            </div>
            <Link
              to="/course-builder"
              className="mt-3 block w-full py-2 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
            >
              Start Run
            </Link>
          </div>

          {/* 퀘스트 2 */}
          <div className="min-w-[210px] bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 snap-start flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">📍</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  +300 XP
                </span>
              </div>
              <h3 className="font-black text-xs text-slate-900 mt-2">BGC Route Pioneer</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Record new route</p>
            </div>
            <Link
              to="/course-builder"
              className="mt-3 block w-full py-2 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
            >
              Build Course
            </Link>
          </div>

          {/* 퀘스트 3 */}
          <div className="min-w-[210px] bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 snap-start flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xl">⚔️</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Crew Battle
                </span>
              </div>
              <h3 className="font-black text-xs text-slate-900 mt-2">Makati Sprint 5km</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ranked multiplayer</p>
            </div>
            <Link
              to="/community"
              className="mt-3 block w-full py-2 text-center rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
            >
              Join Crew
            </Link>
          </div>
        </div>
      </section>

      {/* 5. 🗺️ 전장의 안개 & 도시 탐험도 섹션 (Fog of War & City Exploration) */}
      <section className="px-5 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🗺️</span> City Exploration & Fog of War
          </h2>
          <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
            Live Scout
          </span>
        </div>

        <div className="grid gap-2.5">
          {defaultExplorationStats.map((stat) => (
            <div
              key={stat.areaId}
              className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-800">{stat.areaName}</span>
                <span className="text-violet-700 font-extrabold">{stat.revealedPercentage}% Revealed</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${stat.revealedPercentage}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>{stat.totalKmCovered} km explored</span>
                <span>{stat.unlockedSectors}/{stat.totalSectors} sectors cleared</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 장착 장비 퀵 슬롯 */}
      {equippedItems.length > 0 && (
        <section className="px-5 pt-3">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
            Equipped Gear ({equippedItems.length})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {equippedItems.map((gear) => (
              <div key={gear.id} className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm flex items-center gap-2">
                <span className="text-lg">👟</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{gear.item.name}</p>
                  <p className="text-[10px] font-extrabold text-violet-600 uppercase">{gear.item.rarity}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
