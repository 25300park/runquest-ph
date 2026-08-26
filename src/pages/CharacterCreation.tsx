import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCharacter } from '../services/characterService';

// 1번부터 23번까지의 실제 아바타 이미지 파일(/images/avatars/1.png ~ 23.png) 목록
const avatarList = Array.from({ length: 23 }, (_, i) => {
  const num = i + 1;
  const paddedIndex = String(num).padStart(2, '0');
  return {
    id: `avatar-${num}`,
    src: `/images/avatars/${num}.png`,
    name: `Runner #${paddedIndex}`
  };
});

export default function CharacterCreation() {
  const navigate = useNavigate();
  const [name, setName] = useState('Runner');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(avatarList[0].src);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeAvatarObj = avatarList.find((a) => a.src === selectedAvatar) ?? avatarList[0];

  async function handleStartAdventure() {
    if (!selectedAvatar || !name.trim()) return;

    setIsSaving(true);
    setStatus('Creating your hero...');

    try {
      await createCharacter({
        name: name.trim(),
        avatarBaseUrl: selectedAvatar
      });
      navigate('/character-dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create character.';
      setStatus(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 font-sans pb-32 select-none flex justify-center">
      <div className="max-w-md w-full space-y-4">
        {/* Step 2: 상단 타이틀 헤더 */}
        <header className="text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md shadow-violet-500/25 mb-2.5">
            RQ
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
            Character Creation
          </p>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-black text-slate-900">
            Choose Your Runner
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Select your starting avatar to begin your RPG adventure across Metro Manila.
          </p>
        </header>

        {/* 메인 캐릭터 대형 프리뷰 및 닉네임 입력 카드 */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl text-center relative overflow-hidden">
          {/* 캐릭터 아바타 대형 프리뷰 */}
          <div className="mx-auto w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50/50 p-2.5 shadow-md border-2 border-violet-100 flex items-center justify-center relative">
            {selectedAvatar ? (
              <img
                src={selectedAvatar}
                alt="Selected Runner"
                className="w-full h-full object-contain filter drop-shadow-md animate-in zoom-in-95 duration-200"
              />
            ) : (
              <span className="text-3xl font-black text-slate-300">?</span>
            )}
          </div>

          <h2 className="mt-3.5 text-lg font-black text-slate-900">
            {name.trim() || 'Your Runner'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-tight">
              {activeAvatarObj.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
              Novice Runner • Lv.1
            </span>
          </div>

          {/* 닉네임 입력 인풋 */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-left">
              <span className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                Runner Nickname
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
                placeholder="Enter nickname"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 text-xs font-bold outline-none focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </label>
          </div>
        </div>

        {/* Step 2 & 3: 24개 아바타 3열 그리드 (Light Theme & Micro-interaction) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-black uppercase text-slate-500">
              Avatar Gallery ({avatarList.length})
            </p>
            <span className="text-[10px] font-bold text-violet-600">
              Tap to select
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
            {avatarList.map((avatar) => {
              const isSelected = selectedAvatar === avatar.src;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.src)}
                  className={`rounded-2xl p-2.5 text-center transition-all flex flex-col items-center justify-center relative cursor-pointer border ${
                    isSelected
                      ? 'ring-4 ring-violet-600 bg-violet-50 border-violet-300 scale-105 shadow-md z-10'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 opacity-75'
                  }`}
                >
                  <div className="w-full aspect-square flex items-center justify-center p-1">
                    <img
                      src={avatar.src}
                      alt={avatar.name}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-black truncate max-w-[80px] ${
                      isSelected ? 'text-violet-700' : 'text-slate-700'
                    }`}
                  >
                    {avatar.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 상태 메시지 */}
        {status && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center text-xs font-bold text-violet-700">
            {status}
          </div>
        )}
      </div>

      {/* Step 4: 하단 고정(Sticky/Fixed) CTA 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80 z-30 flex justify-center">
        <div className="max-w-md w-full">
          <button
            type="button"
            onClick={handleStartAdventure}
            disabled={!selectedAvatar || !name.trim() || isSaving}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 ${
              selectedAvatar && name.trim() && !isSaving
                ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 text-white shadow-violet-600/30 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none'
            }`}
          >
            <span>{isSaving ? 'Creating Hero...' : '✨ Start Adventure (선택 완료)'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
