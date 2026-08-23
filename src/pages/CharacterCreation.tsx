import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCharacter } from '../services/characterService';
import { avatarBaseOptions } from '../utils/avatarEngine';

export default function CharacterCreation() {
  const navigate = useNavigate();
  const [name, setName] = useState('Runner');
  const [selectedAvatarId, setSelectedAvatarId] = useState(avatarBaseOptions[0].id);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selectedAvatar =
    avatarBaseOptions.find((avatar) => avatar.id === selectedAvatarId) ?? avatarBaseOptions[0];

  async function saveCharacter() {
    setIsSaving(true);
    setStatus('Creating your hero...');

    try {
      await createCharacter({
        name: name.trim() || 'Runner',
        avatarBaseUrl: selectedAvatar.avatarUrl
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
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 font-sans pb-16 select-none flex justify-center">
      <div className="max-w-md w-full space-y-4">
        {/* 1. 상단 타이틀 헤더 */}
        <header className="text-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-sm mx-auto flex items-center justify-center shadow-md shadow-violet-500/25 mb-2.5">
            RQ
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
            Character Creation
          </p>
          <h1 className="mt-0.5 text-2xl sm:text-3xl font-black text-slate-900">
            Create Your Hero
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Choose your base identity. Future gear will upgrade your outfit layers.
          </p>
        </header>

        {/* 2. 메인 캐릭터 프리뷰 카드 (Home 대시보드 메인 카드 스타일) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl text-center relative overflow-hidden">
          {/* 캐릭터 아바타 원형 프리뷰 */}
          <div
            className={`mx-auto grid h-36 w-36 place-items-center rounded-3xl bg-gradient-to-br ${selectedAvatar.color} text-4xl font-black text-white shadow-xl shadow-violet-500/20 border-4 border-white transition-all`}
          >
            {name.trim().slice(0, 2).toUpperCase() || 'RQ'}
          </div>

          <h2 className="mt-3.5 text-xl font-black text-slate-900">
            {name.trim() || 'Your Hero'}
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-tight">
              {selectedAvatar.name}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-tight">
              Novice Runner • Lv.1
            </span>
          </div>

          {/* 시작 스탯 3열 */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">HP</p>
              <p className="font-black text-rose-500 text-xs mt-0.5">100 / 100</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">Stamina</p>
              <p className="font-black text-emerald-500 text-xs mt-0.5">100%</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">Gold</p>
              <p className="font-black text-amber-500 text-xs mt-0.5">0 🪙</p>
            </div>
          </div>
        </div>

        {/* 3. 닉네임 입력 카드 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="text-xs font-black uppercase text-slate-500 block mb-1">
              Character Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={15}
              placeholder="Enter hero name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 text-sm font-bold outline-none focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </label>
        </div>

        {/* 4. 베이스 아바타 선택 그리드 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500 mb-2.5">
            Choose Base Avatar
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {avatarBaseOptions.map((avatar) => {
              const isSelected = selectedAvatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`rounded-2xl p-3.5 text-left border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'border-2 border-violet-600 bg-violet-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${avatar.color} shadow-sm`}
                  />
                  <div className="min-w-0">
                    <p className={`font-black text-xs truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>
                      {avatar.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Base Style</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. 상태 메시지 */}
        {status && (
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-center text-xs font-bold text-violet-700">
            {status}
          </div>
        )}

        {/* 6. 메인 캐릭터 생성 버튼 */}
        <button
          type="button"
          onClick={saveCharacter}
          disabled={isSaving || !name.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 font-bold text-white text-sm tracking-wide uppercase shadow-xl shadow-violet-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSaving ? 'Creating Hero...' : '✨ Create Hero & Start Quest'}
        </button>
      </div>
    </section>
  );
}
