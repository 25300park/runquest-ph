import type { CourseDraft, CourseDraftStatus } from '../types/course';

const courseDraftStorageKey = 'runquest-ph-course-drafts';

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getCourseDrafts(): CourseDraft[] {
  if (!hasStorage()) {
    return [];
  }

  const storedDrafts = window.localStorage.getItem(courseDraftStorageKey);

  if (!storedDrafts) {
    return [];
  }

  return JSON.parse(storedDrafts) as CourseDraft[];
}

export function saveCourseDraft(courseDraft: CourseDraft) {
  if (!hasStorage()) {
    return;
  }

  const existingDrafts = getCourseDrafts();
  const nextDrafts = [courseDraft, ...existingDrafts.filter((draft) => draft.id !== courseDraft.id)];
  window.localStorage.setItem(courseDraftStorageKey, JSON.stringify(nextDrafts));
}

export function updateCourseDraftStatus(courseDraftId: string, status: CourseDraftStatus) {
  if (!hasStorage()) {
    return [];
  }

  const nextDrafts = getCourseDrafts().map((draft) =>
    draft.id === courseDraftId ? { ...draft, status } : draft
  );
  window.localStorage.setItem(courseDraftStorageKey, JSON.stringify(nextDrafts));

  return nextDrafts;
}
