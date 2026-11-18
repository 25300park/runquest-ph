import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getExplorerOutfitTier, type ExplorerOutfitTier } from './aiCharacterService';
import type { CartoonRunnerAppearance } from '../components/crew/AnimatedCartoonRunner';

export type CrewMotionType = 'idle' | 'walk' | 'stretch' | 'highfive' | 'ready';

export interface CrewPlazaMember {
  id: string;
  name: string;
  level: number;
  classTitle: string;
  outfitName: string;
  avatarUrl: string;
  tierNumber: 1 | 2 | 3 | 4;
  x: number; // 마을 길 가로 좌표 (%)
  y: number; // 마을 길 세로 좌표 (%)
  facing: 'left' | 'right';
  motion: CrewMotionType;
  isReady: boolean;
  isMe?: boolean;
  speechBubble?: string;
  distanceMetersToHub: number;
  appearance: CartoonRunnerAppearance;
}

export interface CrewPlazaEventPayload {
  type: 'move' | 'motion' | 'chat' | 'ready';
  memberId: string;
  x?: number;
  y?: number;
  motion?: CrewMotionType;
  isReady?: boolean;
  speechBubble?: string;
}

export const CREW_QUICK_CHATS = [
  '오늘 5km 페이스 5\'30" 가즈아! 🔥',
  '출발 전 팔다리 스트레칭부터 해요! 🧘',
  '마을 분수대 앞으로 다 모이세요! ⛲',
  '하이파이브 한 번 하고 출발해요 🙌',
] as const;

// 마을 광장 길(분수대 주변 ~ 앞마당 길) 캐릭터별 전담 산책 구역 좌표
export const VILLAGE_ROAD_WAYPOINTS: Array<{ x: number; y: number }> = [
  { x: 22, y: 54 },
  { x: 52, y: 46 },
  { x: 74, y: 66 },
  { x: 24, y: 78 },
  { x: 76, y: 82 },
  { x: 46, y: 62 },
];

export const INITIAL_CREW_MATES: CrewPlazaMember[] = [
  {
    id: 'crew-mia',
    name: 'Mia',
    level: 2,
    classTitle: 'Explorer • Novice',
    outfitName: '심플 스타터 러닝복',
    avatarUrl: '/images/explorer-tiers/tier-1-novice.jpg',
    tierNumber: 1,
    x: 20,
    y: 55,
    facing: 'right',
    motion: 'walk',
    isReady: true,
    speechBubble: '',
    distanceMetersToHub: 12,
    appearance: {
      hairColor: '#92400e',
      hairStyle: 'ponytail',
      skinColor: '#fde4cf',
      hasGlasses: false,
    },
  },
  {
    id: 'crew-marco',
    name: 'Marco',
    level: 4,
    classTitle: 'Challenger • Vanguard',
    outfitName: '탐험가 스카프 & 베스트',
    avatarUrl: '/images/explorer-tiers/tier-2-vanguard.jpg',
    tierNumber: 2,
    x: 74,
    y: 66,
    facing: 'left',
    motion: 'stretch',
    isReady: true,
    speechBubble: '팔다리 쭉쭉 몸푸는 중! 🧘',
    distanceMetersToHub: 8,
    appearance: {
      hairColor: '#0f172a',
      hairStyle: 'spiky',
      skinColor: '#f5cba7',
      hasGlasses: false,
    },
  },
  {
    id: 'crew-jina',
    name: 'Jina',
    level: 6,
    classTitle: 'Guardian • Elite',
    outfitName: '패스파인더 윈드브레이커',
    avatarUrl: '/images/explorer-tiers/tier-3-elite.jpg',
    tierNumber: 3,
    x: 52,
    y: 45,
    facing: 'right',
    motion: 'walk',
    isReady: true,
    speechBubble: '',
    distanceMetersToHub: 5,
    appearance: {
      hairColor: '#4c1d95',
      hairStyle: 'bob',
      skinColor: '#fde4cf',
      hasGlasses: true,
    },
  },
];

export const ADDITIONAL_CREW_POOL: CrewPlazaMember[] = [
  {
    id: 'crew-leo',
    name: 'Leo (Captain)',
    level: 9,
    classTitle: 'Explorer • Master',
    outfitName: '전설의 탐험가 예장 & 망토',
    avatarUrl: '/images/explorer-tiers/tier-4-master.jpg',
    tierNumber: 4,
    x: 76,
    y: 84,
    facing: 'left',
    motion: 'ready',
    isReady: true,
    speechBubble: '마스터 망토 합류! 👑',
    distanceMetersToHub: 3,
    appearance: {
      hairColor: '#b45309',
      hairStyle: 'spiky',
      skinColor: '#fde4cf',
      hasGlasses: false,
    },
  },
  {
    id: 'crew-enzo',
    name: 'Enzo',
    level: 5,
    classTitle: 'Challenger • Elite',
    outfitName: '익스플로러 백팩 & 워치',
    avatarUrl: '/images/explorer-tiers/tier-3-elite.jpg',
    tierNumber: 3,
    x: 22,
    y: 82,
    facing: 'right',
    motion: 'walk',
    isReady: true,
    speechBubble: '',
    distanceMetersToHub: 15,
    appearance: {
      hairColor: '#1e293b',
      hairStyle: 'wavy',
      skinColor: '#f5cba7',
      hasGlasses: true,
    },
  },
];

export function createMyPlazaMember(params: {
  name: string;
  level: number;
  classTitle: string;
  avatarUrl: string;
  tier?: ExplorerOutfitTier;
}): CrewPlazaMember {
  const resolvedTier = params.tier ?? getExplorerOutfitTier(params.level);
  return {
    id: 'crew-me',
    name: params.name,
    level: params.level,
    classTitle: params.classTitle,
    outfitName: resolvedTier.outfitName,
    avatarUrl: params.avatarUrl || resolvedTier.fallbackImage,
    tierNumber: resolvedTier.tierNumber,
    x: 44,
    y: 70,
    facing: 'right',
    motion: 'idle',
    isReady: false,
    isMe: true,
    speechBubble: '마을 광장에 도착했어요! 👋',
    distanceMetersToHub: 0,
    appearance: {
      hairColor: '#1e293b',
      hairStyle: 'wavy',
      skinColor: '#fde4cf',
      hasGlasses: true,
    },
  };
}

export function calculateCrewSynergyBonus(memberCount: number, readyCount: number): {
  xpBonusPercent: number;
  staminaSavePercent: number;
  partyGrade: string;
} {
  const xpBonusPercent = Math.min(50, memberCount * 8 + readyCount * 3);
  const staminaSavePercent = Math.min(25, memberCount * 4);
  const partyGrade =
    memberCount >= 5
      ? '🔥 풀파티 레전드 시너지'
      : memberCount >= 4
        ? '⚡ 정예 스쿼드 시너지'
        : '🌿 크루 기본 시너지';
  return { xpBonusPercent, staminaSavePercent, partyGrade };
}

/**
 * 실시간 크루 광장 채널 구독 (BroadcastChannel + 선택적 Supabase Realtime)
 */
export function subscribeToCrewPlazaChannel(
  crewRoomId: string,
  onEvent: (payload: CrewPlazaEventPayload) => void
): {
  broadcast: (payload: CrewPlazaEventPayload) => void;
  unsubscribe: () => void;
} {
  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(`runquest-crew-plaza-${crewRoomId}`);
      bc.onmessage = (ev) => {
        if (ev.data) {
          onEvent(ev.data as CrewPlazaEventPayload);
        }
      };
    } catch {
      bc = null;
    }
  }

  let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;

  try {
    if (isSupabaseConfigured && supabase) {
      supabaseChannel = supabase.channel(`crew-plaza:${crewRoomId}`);
      (
        supabaseChannel as unknown as {
          on: (
            type: string,
            filter: { event: string },
            callback: (msg: { payload?: CrewPlazaEventPayload }) => void
          ) => { subscribe: () => void };
        }
      )
        .on('broadcast', { event: 'plaza-action' }, (msg) => {
          if (msg.payload) {
            onEvent(msg.payload);
          }
        })
        .subscribe();
    }
  } catch {
    // 오프라인/로컬 환경에서는 BroadcastChannel 및 로컬 시뮬레이션으로 동작
  }

  return {
    broadcast(payload: CrewPlazaEventPayload) {
      try {
        bc?.postMessage(payload);
      } catch {
        // ignore
      }
      try {
        if (supabaseChannel) {
          void supabaseChannel.send({
            type: 'broadcast',
            event: 'plaza-action',
            payload,
          });
        }
      } catch {
        // ignore
      }
    },
    unsubscribe() {
      try {
        bc?.close();
      } catch {
        // ignore
      }
      try {
        if (supabaseChannel) {
          void supabaseChannel.unsubscribe();
        }
      } catch {
        // ignore
      }
    },
  };
}
