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
    setStatus('Creating character...');

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
    <section className="min-h-full bg-[#111816] px-4 py-5 text-stone-50">
      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-5">
        <p className="text-xs font-black uppercase text-amber-200">Character creation</p>
        <h1 className="mt-2 text-3xl font-black">Create your running hero</h1>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Pick a fixed base identity. Future equipment changes update the outfit, not the person.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-700 bg-stone-900 p-5">
        <div
          className={`mx-auto grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br ${selectedAvatar.color} text-5xl font-black shadow-[0_0_48px_rgba(20,184,166,0.24)]`}
        >
          {name.trim().slice(0, 2).toUpperCase() || 'RQ'}
        </div>
        <p className="mt-4 text-center text-sm font-black uppercase text-quest-teal">
          {selectedAvatar.name}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="block rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <span className="text-xs font-black uppercase text-stone-400">Character name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-50 outline-none focus:ring-4 focus:ring-teal-500/20"
          />
        </label>

        <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-stone-400">Base avatar</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {avatarBaseOptions.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatarId(avatar.id)}
                className={`rounded-2xl border p-4 text-left ${
                  selectedAvatarId === avatar.id
                    ? 'border-amber-200 bg-amber-300 text-stone-950'
                    : 'border-stone-700 bg-stone-950 text-stone-200'
                }`}
              >
                <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${avatar.color}`} />
                <p className="mt-3 font-black">{avatar.name}</p>
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div className="rounded-2xl border border-teal-200/30 bg-teal-950/30 p-4 text-sm font-bold text-teal-100">
            {status}
          </div>
        )}

        <button
          type="button"
          onClick={saveCharacter}
          disabled={isSaving}
          className="rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950 disabled:bg-stone-800 disabled:text-stone-500"
        >
          {isSaving ? 'Saving...' : 'Save Character'}
        </button>
      </div>
    </section>
  );
}
