import { Link } from 'react-router-dom';
import { mockAreas } from '../data/mockAreas';

export default function LandingPage() {
  return (
    <section className="min-h-full bg-[#121713] text-stone-50">
      <div className="relative isolate overflow-hidden px-4 pb-8 pt-5">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#1f3a2d_0%,#13231d_42%,#0f1412_100%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,#facc1533,transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(180deg,transparent,#0f1412)]" />

        <div className="rounded-[1.75rem] border border-amber-200/20 bg-stone-950/35 p-4 shadow-2xl backdrop-blur">
          <div className="relative h-72 overflow-hidden rounded-[1.35rem] border border-teal-200/20 bg-[#1b2b26]">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[#15251f]" />
            <div className="absolute bottom-20 left-5 h-24 w-12 rounded-t-md bg-[#2d4b43]" />
            <div className="absolute bottom-20 left-20 h-36 w-16 rounded-t-md bg-[#355a4e]" />
            <div className="absolute bottom-20 right-7 h-32 w-14 rounded-t-md bg-[#2c463f]" />
            <div className="absolute bottom-8 left-1/2 h-40 w-24 -translate-x-1/2 rounded-t-full border-x-4 border-amber-200/50 bg-[#19352d]" />
            <div className="absolute bottom-0 left-1/2 h-52 w-28 -translate-x-1/2 rounded-t-full border-x border-teal-200/30 bg-[#223b33]" />
            <div className="absolute bottom-7 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full border-4 border-amber-200 bg-quest-teal shadow-[0_0_28px_rgba(250,204,21,0.55)]" />
            <div className="absolute bottom-24 left-8 right-8 h-1 rounded-full bg-amber-200/60" />
            <div className="absolute left-5 top-5 rounded-full border border-amber-200/40 bg-stone-950/40 px-3 py-1 text-xs font-black uppercase text-amber-100">
              Metro Manila Quest Map
            </div>
          </div>

          <div className="pt-6">
            <p className="text-sm font-black uppercase text-amber-200">
              Walk. Jog. Run. Level up your journey.
            </p>
            <h1 className="mt-3 text-5xl font-black leading-none text-white">
              RunQuest PH
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-200">
              Choose a character, enter local world zones, clear real routes, and
              turn every walk into progress.
            </p>
            <Link
              to="/login"
              className="mt-6 block rounded-2xl border border-amber-200 bg-amber-300 px-5 py-4 text-center text-base font-black text-stone-950 shadow-[0_10px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_6px_0_rgba(120,53,15,0.55)]"
            >
              Start Adventure
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8">
        <h2 className="text-lg font-black text-amber-100">First world zones</h2>
        <div className="grid gap-3">
          {mockAreas.map((area) => (
            <article
              key={area.id}
              className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">
                    {area.worldZone}
                  </p>
                  <h3 className="mt-1 font-black text-stone-50">{area.name}</h3>
                </div>
                <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-stone-950">
                  {area.courseCount} routes
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">{area.explorationVibe}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
