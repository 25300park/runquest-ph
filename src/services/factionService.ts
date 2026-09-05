export type FactionId = 'faction-bgc' | 'faction-makati';

export interface FactionState {
  id: FactionId;
  name: string;
  tagline: string;
  color: string;
  gradient: string;
  badge: string;
  auraEffect: string;
  totalDistanceKm: number;
  totalMembers: number;
  weeklyVictoryBonus: string;
}

const FACTION_STORAGE_KEY = 'rq_user_selected_faction_v1';
const FACTION_SCORES_KEY = 'rq_faction_scores_v1';

export const defaultFactions: Record<FactionId, FactionState> = {
  'faction-bgc': {
    id: 'faction-bgc',
    name: 'BGC Neon Striders',
    tagline: 'High Street의 미래형 사이버 러너 진영',
    color: '#8b5cf6',
    gradient: 'from-violet-600 via-indigo-600 to-purple-700',
    badge: '🟪 BGC',
    auraEffect: 'Neon Purple Cyber Aura',
    totalDistanceKm: 1428.5,
    totalMembers: 480,
    weeklyVictoryBonus: '+15% Night Run XP'
  },
  'faction-makati': {
    id: 'faction-makati',
    name: 'Makati Cyber Foxes',
    tagline: '아얄라 빌딩 숲을 질주하는 도심 정복자 진영',
    color: '#0ea5e9',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    badge: '🟦 Makati',
    auraEffect: 'Cyan Lightning Aura',
    totalDistanceKm: 1284.2,
    totalMembers: 425,
    weeklyVictoryBonus: '+15% Interval Speed XP'
  }
};

export function getUserFaction(): FactionId {
  if (typeof window === 'undefined') return 'faction-bgc';
  try {
    const saved = localStorage.getItem(FACTION_STORAGE_KEY);
    return (saved as FactionId) || 'faction-bgc';
  } catch {
    return 'faction-bgc';
  }
}

export function setUserFaction(factionId: FactionId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FACTION_STORAGE_KEY, factionId);
  } catch {
    // ignore
  }
}

export function getFactionScores(): Record<FactionId, FactionState> {
  if (typeof window === 'undefined') return defaultFactions;
  try {
    const saved = localStorage.getItem(FACTION_SCORES_KEY);
    return saved ? JSON.parse(saved) : defaultFactions;
  } catch {
    return defaultFactions;
  }
}

export function contributeDistanceToFaction(factionId: FactionId, distanceKm: number): Record<FactionId, FactionState> {
  const current = getFactionScores();
  if (!current[factionId]) return current;

  current[factionId].totalDistanceKm = Number((current[factionId].totalDistanceKm + distanceKm).toFixed(2));
  try {
    localStorage.setItem(FACTION_SCORES_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
  return current;
}
