export interface BountyQuest {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  area: 'BGC' | 'Makati' | 'MOA';
  distanceKm: number;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Challenge';
  royaltyGold: number;
  totalClears: number;
  rating: number;
  description: string;
  tags: string[];
  createdAt: string;
}

const BOUNTY_STORAGE_KEY = 'rq_bounty_quests_v1';

export const initialBounties: BountyQuest[] = [
  {
    id: 'bounty-1',
    title: 'BGC High Street Night Glow Loop',
    creatorName: 'Shadow_Tiger_PH',
    creatorAvatar: '/images/avatars/1.png',
    area: 'BGC',
    distanceKm: 3.5,
    difficulty: 'Normal',
    royaltyGold: 100,
    totalClears: 142,
    rating: 4.9,
    description: 'BGC 중심가를 가로지르는 화려한 야간 시티 런 코스입니다. 평지 위주라 쾌적합니다.',
    tags: ['NightRun', 'Flat', 'Scenic'],
    createdAt: '2026.08.28'
  },
  {
    id: 'bounty-2',
    title: 'Ayala Triangle Tree Canopy Sprint',
    creatorName: 'Makati_Pacer_Fox',
    creatorAvatar: '/images/avatars/7.png',
    area: 'Makati',
    distanceKm: 5.0,
    difficulty: 'Hard',
    royaltyGold: 150,
    totalClears: 89,
    rating: 4.8,
    description: '아얄라 트라이앵글 공원의 숲길과 도심 빌딩 숲을 교차하는 고강도 인터벌 스프린트!',
    tags: ['Interval', 'Shaded', 'UrbanPark'],
    createdAt: '2026.08.29'
  },
  {
    id: 'bounty-3',
    title: 'Manila Bay Ocean Sunset Cruise',
    creatorName: 'Bay_Wave_Rider',
    creatorAvatar: '/images/avatars/4.png',
    area: 'MOA',
    distanceKm: 6.2,
    difficulty: 'Challenge',
    royaltyGold: 200,
    totalClears: 67,
    rating: 5.0,
    description: '석양이 물드는 마닐라 베이 해안 도로를 따라 달리는 환상적인 바닷바람 힐링 코스.',
    tags: ['Sunset', 'Coastal', 'LongDistance'],
    createdAt: '2026.08.30'
  }
];

export function getSavedBounties(): BountyQuest[] {
  if (typeof window === 'undefined') return initialBounties;
  try {
    const saved = localStorage.getItem(BOUNTY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialBounties;
  } catch {
    return initialBounties;
  }
}

export function saveBounties(bounties: BountyQuest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOUNTY_STORAGE_KEY, JSON.stringify(bounties));
  } catch {
    // ignore
  }
}

export function createBountyQuest(input: Omit<BountyQuest, 'id' | 'totalClears' | 'rating' | 'createdAt'>): BountyQuest {
  const newQuest: BountyQuest = {
    ...input,
    id: `bounty-${Date.now()}`,
    totalClears: 0,
    rating: 5.0,
    createdAt: new Date().toISOString().split('T')[0].replace(/-/g, '.')
  };
  const list = getSavedBounties();
  const updated = [newQuest, ...list];
  saveBounties(updated);
  return newQuest;
}

export function claimQuestRoyalty(bountyId: string): { success: boolean; royaltyPaid: number } {
  const list = getSavedBounties();
  const target = list.find((b) => b.id === bountyId);
  if (!target) return { success: false, royaltyPaid: 0 };

  const updated = list.map((b) => (b.id === bountyId ? { ...b, totalClears: b.totalClears + 1 } : b));
  saveBounties(updated);
  return { success: true, royaltyPaid: target.royaltyGold };
}
