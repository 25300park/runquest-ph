import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCharacters } from '../data/mockCharacters';
import { getSelectedCharacterId, setSelectedCharacterId } from '../utils/gameProgress';

export default function CharacterSelectPage() {
  const [selectedCharacterIdState, setSelectedCharacterIdState] = useState(getSelectedCharacterId);
  const selectedCharacter = mockCharacters.find(
    (character) => character.id === selectedCharacterIdState
  );

  function selectCharacter(characterId: string) {
    setSelectedCharacterIdState(characterId);
    setSelectedCharacterId(characterId);
  }

  return (
    <section className="min-h-full bg-[#111816] px-4 py-6 text-stone-50">
      <div className="space-y-2">
        <p className="text-sm font-black uppercase text-amber-200">Choose your class</p>
        <h1 className="text-4xl font-black leading-tight">Pick your running companion.</h1>
        <p className="text-sm leading-6 text-stone-300">
          Every journey starts differently. Choose the identity that feels like you today.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {mockCharacters.map((character) => (
          <button
            key={character.id}
            type="button"
            onClick={() => selectCharacter(character.id)}
            className={`group relative overflow-hidden rounded-[1.35rem] border p-1 text-left transition ${
              selectedCharacterIdState === character.id
                ? 'border-amber-200 bg-amber-200 shadow-[0_0_30px_rgba(250,204,21,0.22)]'
                : 'border-stone-700 bg-stone-800'
            }`}
          >
            <div className="rounded-[1.1rem] border border-stone-700 bg-[linear-gradient(180deg,#292524_0%,#111816_100%)] p-4">
              <div className="flex gap-4">
                <div className="relative grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-amber-200/30 bg-[#19352d]">
                  <div className="absolute inset-x-4 bottom-0 h-16 rounded-t-full bg-quest-teal" />
                  <div className="absolute top-5 h-9 w-9 rounded-full border-2 border-amber-200 bg-stone-100" />
                  <span className="relative mt-14 text-xs font-black text-stone-950">
                    {character.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-quest-teal">
                        {character.rpgIdentity}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-stone-50">
                        {character.name.replace('The ', '')}
                      </h2>
                    </div>
                    {selectedCharacterIdState === character.id && (
                      <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-black text-stone-950">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-300">{character.shortStory}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-stone-700 pt-4">
                <div>
                  <p className="text-xs font-black uppercase text-amber-200">Personality</p>
                  <p className="mt-1 text-sm text-stone-300">{character.personalityStyle}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-amber-200">Journey style</p>
                  <p className="mt-1 text-sm text-stone-300">{character.journeyStyle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {character.recommendedFor.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-stone-600 px-3 py-1 text-xs font-bold text-stone-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-teal-200/20 bg-teal-950/40 p-4">
        <p className="text-xs font-black uppercase text-quest-teal">Current class</p>
        <p className="mt-1 text-lg font-black text-stone-50">
          {selectedCharacter?.name ?? 'Explorer'}
        </p>
        <p className="mt-1 text-sm text-stone-300">{selectedCharacter?.bonus}</p>
      </div>

      <Link
        to="/areas"
        className="mt-5 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)]"
      >
        Enter World Map
      </Link>
    </section>
  );
}
