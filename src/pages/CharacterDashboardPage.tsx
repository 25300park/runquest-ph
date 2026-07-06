import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCharacterProfile, subscribeToCharacterUpdates } from '../services/characterService';
import { subscribeToAvatarRealtime } from '../services/aiAvatarService';
import { subscribeToEquipmentEconomy } from '../services/equipmentEconomyService';
import type { CharacterProfile } from '../types/rpgCharacter';
import { buildAvatarPrompt, describeOutfitLayer } from '../utils/avatarEngine';
import { getLevelProgress, xpPerLevel } from '../utils/characterRpg';

const equipmentSlots = ['shoes', 'backpack', 'hat', 'accessory'] as const;

export default function CharacterDashboardPage() {
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [status, setStatus] = useState('Loading character...');

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
  const avatarPrompt = profile ? buildAvatarPrompt(profile) : '';
  const xpProgress = profile ? getLevelProgress(profile.character.xp) : 0;

  if (!profile) {
    return (
      <section className="grid min-h-full place-items-center bg-[#111816] px-4 py-8 text-center text-stone-50">
        <div className="rounded-2xl border border-stone-700 bg-stone-900 p-5">
          <p className="text-xs font-black uppercase text-amber-200">Character dashboard</p>
          <h1 className="mt-2 text-3xl font-black">Create your hero first</h1>
          <p className="mt-3 text-sm text-stone-400">{status}</p>
          <Link
            to="/character/create"
            className="mt-5 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
          >
            Create Character
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-full bg-[#111816] px-4 py-5 text-stone-50">
      <div className="grid grid-cols-[1fr_1.15fr_1fr] gap-3">
        <aside className="rounded-2xl border border-stone-700 bg-stone-900 p-3">
          <p className="text-xs font-black uppercase text-amber-200">Stats</p>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="text-stone-500">Level</p>
              <p className="text-xl font-black">{profile.character.level}</p>
            </div>
            <div>
              <p className="text-stone-500">XP</p>
              <p className="text-xl font-black">{profile.character.xp}</p>
            </div>
            <div>
              <p className="text-stone-500">Distance</p>
              <p className="text-xl font-black">
                {(profile.stats?.total_distance ?? 0).toFixed(1)} km
              </p>
            </div>
          </div>
        </aside>

        <main className="rounded-2xl border border-amber-200/30 bg-stone-900 p-3 text-center">
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full border-4 border-amber-200 bg-quest-teal text-4xl font-black shadow-[0_0_42px_rgba(250,204,21,0.22)]">
            {profile.character.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="mt-3 text-2xl font-black">{profile.character.name}</h1>
          <p className="mt-1 text-xs font-black uppercase text-quest-teal">Persistent RPG runner</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-950">
            <div
              className="h-full rounded-full bg-amber-300 transition-all"
              style={{ width: `${(xpProgress / xpPerLevel) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-stone-400">
            {xpProgress}/{xpPerLevel} XP to next level
          </p>
        </main>

        <aside className="rounded-2xl border border-stone-700 bg-stone-900 p-3">
          <p className="text-xs font-black uppercase text-amber-200">Equipment</p>
          <div className="mt-3 space-y-2">
            {equipmentSlots.map((slot) => {
              const equipped = equippedItems.find((equipment) => equipment.item.type === slot);
              return (
                <div key={slot} className="rounded-xl bg-stone-950 p-2">
                  <p className="text-[10px] font-black uppercase text-stone-500">{slot}</p>
                  <p className="mt-1 text-xs font-black">
                    {equipped?.item.name ?? 'Empty slot'}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-700 bg-stone-900 p-4">
        <p className="text-xs font-black uppercase text-amber-200">AI avatar engine</p>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          Identity is fixed. Equipment changes are outfit layers only.
        </p>
        <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-950 p-3 text-xs text-stone-300">
          {avatarPrompt}
        </pre>
      </div>

      <div className="mt-4 grid gap-3">
        {equippedItems.map((equipment) => (
          <article key={equipment.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
            <p className="text-xs font-black uppercase text-quest-teal">
              {equipment.item.rarity} {equipment.item.type}
            </p>
            <h2 className="mt-1 font-black">{equipment.item.name}</h2>
            <p className="mt-2 text-sm text-stone-400">{describeOutfitLayer(equipment.item)}</p>
          </article>
        ))}
      </div>

      <Link
        to="/map"
        className="mt-5 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950"
      >
        Start Run
      </Link>
    </section>
  );
}
