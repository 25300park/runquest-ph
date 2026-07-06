import { useEffect, useState } from 'react';
import {
  assignEquipment,
  banCharacter,
  listAdminCharacters,
  listEconomyItems,
  resetCharacterAvatar,
  updateCharacterProgress,
  type AdminCharacter,
  type AdminItem
} from './adminService';

export default function AdminCharacters() {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [status, setStatus] = useState('Loading characters...');

  async function loadData() {
    try {
      const [nextCharacters, nextItems] = await Promise.all([
        listAdminCharacters(),
        listEconomyItems()
      ]);
      setCharacters(nextCharacters);
      setItems(nextItems);
      setStatus('Character controls ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load characters.');
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">RPG control</p>
        <h2 className="mt-1 text-2xl font-black">Characters</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {characters.map((character) => (
          <article key={character.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{character.name}</p>
                <p className="mt-1 text-xs text-stone-500">{character.id}</p>
              </div>
              <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-black uppercase text-amber-200">
                {character.status}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <input
                type="number"
                min={1}
                defaultValue={character.level}
                aria-label="Character level"
                className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
                onBlur={(event) =>
                  void updateCharacterProgress(character.id, {
                    level: Number(event.target.value),
                    xp: character.xp
                  }).then(loadData)
                }
              />
              <input
                type="number"
                min={0}
                defaultValue={character.xp}
                aria-label="Character XP"
                className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
                onBlur={(event) =>
                  void updateCharacterProgress(character.id, {
                    level: character.level,
                    xp: Number(event.target.value)
                  }).then(loadData)
                }
              />
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    void assignEquipment(character.id, event.target.value).then(loadData);
                  }
                }}
                className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
              >
                <option value="">Assign item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void resetCharacterAvatar(character.id).then(loadData)}
                className="rounded-md border border-stone-700 px-3 py-2 text-sm font-bold"
              >
                Reset Avatar
              </button>
            </div>

            <button
              type="button"
              onClick={() => void banCharacter(character.id).then(loadData)}
              className="mt-3 rounded-md border border-red-400/40 px-3 py-2 text-sm font-bold text-red-200"
            >
              Ban Character
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
