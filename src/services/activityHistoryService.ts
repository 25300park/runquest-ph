import type { LatLngTuple } from '../types/area';

export interface ActivityHistoryRecord {
  id: string;
  createdAt: string; // ISO 8601 string
  activityType: 'free_run' | 'quest_run';
  title: string;
  areaName: string;
  distanceKm: number;
  durationSeconds: number;
  paceFormatted: string;
  calories: number;
  xpEarned: number;
  routePoints: LatLngTuple[];
}

const STORAGE_KEY = 'runquest_activity_history_v1';

export function getLocalActivityHistory(): ActivityHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (err) {
    console.warn('Failed to load activity history from localStorage:', err);
    return [];
  }
}

export function saveActivityRecord(record: ActivityHistoryRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalActivityHistory();
    // 중복 저장 방지
    const filtered = current.filter((item) => item.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to save activity record to localStorage:', err);
  }
}

export function deleteActivityRecord(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalActivityHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete activity record from localStorage:', err);
  }
}

export function clearActivityHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear activity history:', err);
  }
}
