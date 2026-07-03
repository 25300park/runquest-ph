import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockAreas } from '../data/mockAreas';

export default function AreaSelectPage() {
  const [selectedAreaId, setSelectedAreaId] = useState(mockAreas[0].id);

  return (
    <section className="min-h-full bg-[#111816] px-4 py-6 text-stone-50">
      <div className="space-y-2">
        <p className="text-sm font-black uppercase text-amber-200">Select world zone</p>
        <h1 className="text-4xl font-black leading-tight">Where do you want to explore?</h1>
        <p className="text-sm leading-6 text-stone-300">
          Each city area is a zone with its own route mood, pace, and discovery path.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {mockAreas.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => setSelectedAreaId(area.id)}
            className={`overflow-hidden rounded-[1.35rem] border p-1 text-left transition ${
              selectedAreaId === area.id
                ? 'border-amber-200 bg-amber-200 shadow-[0_0_28px_rgba(250,204,21,0.18)]'
                : 'border-stone-700 bg-stone-800'
            }`}
          >
            <div className="rounded-[1.1rem] bg-[linear-gradient(135deg,#1c2f2a_0%,#171717_70%)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">
                    {area.worldZone}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-stone-50">{area.name}</h2>
                </div>
                <span className="rounded-full bg-stone-950/70 px-3 py-1 text-xs font-black text-amber-200">
                  {area.courseCount} routes
                </span>
              </div>

              <div className="mt-5 h-28 overflow-hidden rounded-xl border border-stone-700 bg-[#17231f]">
                <div className="h-full bg-[linear-gradient(160deg,#134e4a_0%,#1f2937_48%,#854d0e_100%)] opacity-80" />
              </div>

              <p className="mt-4 text-sm leading-6 text-stone-300">{area.description}</p>
              <p className="mt-3 text-sm leading-6 text-stone-400">{area.explorationVibe}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-black uppercase text-stone-300">
                  <span>{area.theme}</span>
                  <span>{area.explorationProgress}% scouted</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-950">
                  <div
                    className="h-full rounded-full bg-quest-teal"
                    style={{ width: `${area.explorationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Link
        to="/map"
        className="mt-5 block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)]"
      >
        Open Exploration Map
      </Link>
    </section>
  );
}
