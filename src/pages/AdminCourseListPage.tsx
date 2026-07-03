import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CourseDraftStatus } from '../types/course';
import { getCourseDrafts, updateCourseDraftStatus } from '../utils/courseDrafts';

const statuses: CourseDraftStatus[] = ['draft', 'published'];

export default function AdminCourseListPage() {
  const [selectedStatus, setSelectedStatus] = useState<CourseDraftStatus>('draft');
  const [drafts, setDrafts] = useState(getCourseDrafts);
  const visibleDrafts = drafts.filter((draft) => draft.status === selectedStatus);

  function publishDraft(courseDraftId: string) {
    setDrafts(updateCourseDraftStatus(courseDraftId, 'published'));
  }

  return (
    <section className="min-h-full space-y-4 bg-[#111816] px-4 py-4 text-stone-50">
      <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Admin course list</p>
        <h1 className="mt-1 text-3xl font-black">Creator routes</h1>
        <p className="mt-2 text-sm text-stone-400">
          Local mock drafts only. Publishing changes the local status, not a server.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setSelectedStatus(status)}
            className={`rounded-2xl px-4 py-3 text-sm font-black capitalize ${
              selectedStatus === status
                ? 'bg-amber-300 text-stone-950'
                : 'bg-stone-900 text-stone-400'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <Link
        to="/admin/course-builder"
        className="block rounded-2xl bg-quest-teal px-4 py-4 text-center font-black text-white"
      >
        Create New Course
      </Link>

      <div className="grid gap-3">
        {visibleDrafts.length === 0 ? (
          <div className="rounded-2xl border border-stone-700 bg-stone-900 p-5 text-center text-stone-400">
            No {selectedStatus} courses yet.
          </div>
        ) : (
          visibleDrafts.map((draft) => (
            <article key={draft.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-quest-teal">{draft.areaName}</p>
                  <h2 className="mt-1 text-xl font-black">{draft.name}</h2>
                  <p className="mt-2 text-sm text-stone-400">
                    {draft.routeCoordinates.length} points · {draft.checkpoints.length} checkpoints ·{' '}
                    {draft.pois.length} POIs
                  </p>
                </div>
                <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black capitalize text-amber-200">
                  {draft.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-stone-950 p-3">
                  <p className="text-stone-500">Difficulty</p>
                  <p className="font-black">{draft.difficulty}</p>
                </div>
                <div className="rounded-xl bg-stone-950 p-3">
                  <p className="text-stone-500">XP reward</p>
                  <p className="font-black text-amber-200">{draft.xpReward}</p>
                </div>
              </div>

              {draft.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => publishDraft(draft.id)}
                  className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-300 px-4 py-3 font-black text-stone-950"
                >
                  Publish Mock Course
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
