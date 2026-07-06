import { useEffect, useState } from 'react';
import {
  assignEquipment,
  banCharacter,
  listCharacterEquipment,
  listAdminCharacters,
  listEconomyItems,
  removeCharacterEquipment,
  resetCharacterAvatar,
  updateCharacterStatus,
  updateCharacterProgress,
  type AdminCharacter,
  type AdminItem
} from './adminService';
import type { Database } from '../types/database';

type CharacterEquipment = Database['public']['Tables']['character_equipment']['Row'];

export default function AdminCharacters() {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [equipmentByCharacter, setEquipmentByCharacter] = useState<Record<string, CharacterEquipment[]>>({});
  const [status, setStatus] = useState('Loading characters...');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [nextCharacters, nextItems] = await Promise.all([
        listAdminCharacters(),
        listEconomyItems()
      ]);
      const safeCharacters = nextCharacters ?? [];
      setCharacters(safeCharacters);
      setItems(nextItems ?? []);
      const equipmentPairs = await Promise.all(
        safeCharacters.map(async (character) => [
          character.id,
          (await listCharacterEquipment(character.id)) ?? []
        ] as const)
      );
      setEquipmentByCharacter(Object.fromEntries(equipmentPairs));
      setStatus(safeCharacters.length === 0 ? 'No characters found.' : 'Character controls ready.');
    } catch (error) {
      setCharacters([]);
      setItems([]);
      setEquipmentByCharacter({});
      setStatus(error instanceof Error ? error.message : 'Could not load characters.');
    } finally {
      setLoading(false);
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
        {loading && (
          <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
            Loading characters...
          </div>
        )}
        {!loading && characters.length === 0 && (
          <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
            No characters found.
          </div>
        )}
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
                    xp: character.xp ?? 0
                  })
                    .then(loadData)
                    .catch((error) =>
                      setStatus(error instanceof Error ? error.message : 'Could not update character.')
                    )
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
                    level: character.level ?? 1,
                    xp: Number(event.target.value)
                  })
                    .then(loadData)
                    .catch((error) =>
                      setStatus(error instanceof Error ? error.message : 'Could not update character.')
                    )
                }
              />
              <select
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) {
                    void assignEquipment(character.id, event.target.value)
                      .then(loadData)
                      .catch((error) =>
                        setStatus(error instanceof Error ? error.message : 'Could not assign equipment.')
                      );
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
                onClick={() =>
                  void resetCharacterAvatar(character.id)
                    .then(loadData)
                    .catch((error) =>
                      setStatus(error instanceof Error ? error.message : 'Could not reset avatar.')
                    )
                }
                className="rounded-md border border-stone-700 px-3 py-2 text-sm font-bold"
              >
                Reset Avatar
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                void banCharacter(character.id)
                  .then(loadData)
                  .catch((error) =>
                    setStatus(error instanceof Error ? error.message : 'Could not ban character.')
                  )
              }
              className="mt-3 rounded-md border border-red-400/40 px-3 py-2 text-sm font-bold text-red-200"
            >
              Ban Character
            </button>
            <button
              type="button"
              onClick={() =>
                void updateCharacterStatus(character.id, 'suspended')
                  .then(loadData)
                  .catch((error) =>
                    setStatus(error instanceof Error ? error.message : 'Could not suspend character.')
                  )
              }
              className="ml-2 mt-3 rounded-md border border-amber-300/40 px-3 py-2 text-sm font-bold text-amber-100"
            >
              Suspend Character
            </button>

            <div className="mt-4 rounded-md bg-stone-900 p-3">
              <p className="text-xs font-black uppercase text-stone-500">Equipped / assigned items</p>
              <div className="mt-2 grid gap-2">
                {(equipmentByCharacter[character.id] ?? []).length === 0 ? (
                  <p className="text-sm text-stone-500">No equipment assigned.</p>
                ) : (
                  (equipmentByCharacter[character.id] ?? []).map((equipment) => {
                    const item = items.find((candidate) => candidate.id === equipment.item_id);
                    return (
                      <div key={equipment.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-stone-300">
                          {item?.name ?? equipment.item_id} {equipment.equipped ? '(equipped)' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void removeCharacterEquipment(equipment.id)
                              .then(loadData)
                              .catch((error) =>
                                setStatus(
                                  error instanceof Error ? error.message : 'Could not remove equipment.'
                                )
                              )
                          }
                          className="rounded-md border border-stone-700 px-2 py-1 text-xs font-bold text-stone-300"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
