import { useEffect, useState } from 'react';
import { mockAreas } from '../data/mockAreas';
import { mockCharacters } from '../data/mockCharacters';
import { mockTrophies, type TrophyItem } from '../data/mockTrophies';
import { getGameProgress } from '../utils/gameProgress';
import { calculateLevelFromXp, getCurrentLevelBaseXp, getNextLevelXp } from '../utils/xp';
import { Link } from 'react-router-dom';
import { getCurrentAdminProfile } from '../admin/adminService';
import { usePwaInstall } from '../hooks/usePwaInstall';

export default function ProfilePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyItem | null>(null);
  const { isStandalone, showIosGuide, setShowIosGuide, promptInstall } = usePwaInstall();
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
    <section className="min-h-full space-y-4 bg-slate-50 px-4 py-5 text-slate-900 font-sans pb-24 select-none">
      {/* 1. 상단 9:16 캐릭터 쇼케이스 카드 */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
              Hero Showcase
            </p>
            <h1 className="text-xl font-black text-slate-900">{selectedCharacter.name}</h1>
          </div>
          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-black">
            Lv {currentLevel}
          </span>
        </div>

        {/* 9:16 비디오 뷰어 */}
        <div className="relative w-full aspect-[9/14] max-h-[340px] rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-90"
            poster="/characters/starter-preview.png"
          >
            <source src="/characters/tiger-runner-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30 pointer-events-none" />

          {/* 비디오 위 오버레이 스탯 */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center justify-between text-xs font-black">
              <span>EXP Progress</span>
              <span className="text-amber-300">{xpProgress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-300">
              {progress.totalXp} XP total · Next level at {nextLevelXp} XP
            </p>
          </div>
        </div>
      </div>

      {/* 2. 3열 핵심 스탯 그리드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total XP</p>
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

      {/* 3. 🏆 Phase 5: 트로피 룸 & 특별 스킨 진열장 (Trophy Room) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>🏆</span> Trophy Room & Skin Vault
            </h2>
            <p className="text-xs text-slate-400">Unlock gear by achieving running milestones.</p>
          </div>
          <span className="text-[10px] font-black text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
            {mockTrophies.filter((t) => t.unlocked).length}/{mockTrophies.length} Unlocked
          </span>
        </div>

        {/* 트로피 2열 그리드 */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {mockTrophies.map((trophy) => (
            <button
              key={trophy.id}
              type="button"
              onClick={() => setSelectedTrophy(trophy)}
              className={`rounded-2xl border p-3 text-left transition-all relative flex flex-col justify-between ${
                trophy.unlocked
                  ? 'border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:border-violet-300'
                  : 'border-slate-200 bg-slate-100/60 opacity-60 grayscale'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{trophy.icon}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    trophy.rarity === 'Legendary'
                      ? 'bg-amber-100 text-amber-800'
                      : trophy.rarity === 'Epic'
                      ? 'bg-purple-100 text-purple-800'
                      : trophy.rarity === 'Rare'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {trophy.rarity}
                  </span>
                </div>
                <h3 className="font-black text-xs text-slate-900 mt-2 truncate">{trophy.name}</h3>
                <p className="text-[10px] text-violet-600 font-bold mt-0.5 truncate">{trophy.buffDescription}</p>
              </div>

              {!trophy.unlocked && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-black">
                  <span>🔒</span>
                  <span>Locked</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 트로피 해금 정보 툴팁 모달 */}
      {selectedTrophy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-3 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{selectedTrophy.icon}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedTrophy.name}</h3>
                  <span className="text-[10px] font-black uppercase text-violet-600">{selectedTrophy.rarity} Tier</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrophy(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Equip Buff</p>
                <p className="font-black text-violet-700 mt-0.5">{selectedTrophy.buffDescription}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[10px] font-black uppercase text-slate-400">Unlock Condition</p>
                <p className="font-bold text-slate-700 mt-0.5">{selectedTrophy.unlockCondition}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTrophy(null)}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-xs shadow-md"
            >
              {selectedTrophy.unlocked ? '장착 중 (Equipped)' : '확인'}
            </button>
          </div>
        </div>
      )}

      {/* 4. RunQuest 앱 다운로드 / 설치 상태 카드 */}
      {isStandalone ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
              ✓
            </div>
            <div>
              <h3 className="font-black text-xs text-emerald-900">RunQuest 앱 설치 완료</h3>
              <p className="text-[10px] text-emerald-700 mt-0.5">PWA 독립 실행 모드로 실행 중입니다</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Installed
          </span>
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50/50 p-4 shadow-sm flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <span>📱</span> RunQuest 앱 다운로드
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">스마트폰 홈 화면에 추가하여 앱으로 이용하세요</p>
          </div>
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-violet-500/25 active:scale-95 transition-all shrink-0"
          >
            📲 앱 설치
          </button>
        </div>
      )}

      {/* 5. 보상 지갑 CTA */}
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

      {/* iOS 가이드 모달 */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md mb-2">
                RQ
              </div>
              <h3 className="text-lg font-black text-slate-900">iPhone / iPad 홈 화면에 추가</h3>
              <p className="text-xs text-slate-500 mt-1">
                Safari 브라우저에서 아래 2단계를 진행하면 앱으로 설치됩니다.
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">1</span>
                <span>Safari 하단의 <strong>[공유 버튼 (사각형+화살표)]</strong>을 누릅니다.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">2</span>
                <span>메뉴에서 <strong>[홈 화면에 추가 (Add to Home Screen)]</strong>를 누릅니다.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-violet-600 font-bold text-white text-xs shadow-md"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
