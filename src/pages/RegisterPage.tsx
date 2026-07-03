import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <section className="min-h-full bg-[#111816] px-4 py-8 text-stone-50">
      <div className="rounded-[1.5rem] border border-amber-200/20 bg-stone-900 p-5 shadow-2xl">
        <p className="text-sm font-black uppercase text-amber-200">New quest file</p>
        <h1 className="mt-3 text-4xl font-black leading-tight">Create your adventurer</h1>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          Mock registration only. No account is created in this UI phase.
        </p>

        <form className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-black text-stone-200">Display name</span>
            <input
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              placeholder="City Explorer"
            />
          </label>
          <label className="block">
            <span className="text-sm font-black text-stone-200">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-stone-700 bg-stone-950 px-4 py-4 text-stone-50 outline-none ring-quest-teal/40 focus:ring-4"
              type="email"
              placeholder="runner@runquest.ph"
            />
          </label>
          <Link
            to="/character"
            className="block rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 text-center font-black text-stone-950 shadow-[0_8px_0_rgba(120,53,15,0.55)] transition active:translate-y-1 active:shadow-[0_4px_0_rgba(120,53,15,0.55)]"
          >
            Choose Character
          </Link>
        </form>
      </div>
    </section>
  );
}
