export interface ExplorerOutfitTier {
  tierNumber: 1 | 2 | 3 | 4;
  id: string;
  minLevel: number;
  maxLevel: number;
  rankName: string;
  titleKo: string;
  outfitName: string;
  outfitSummary: string;
  backgroundTheme: string;
  promptOutfitRule: string;
  promptBackgroundRule: string;
  fallbackImage: string;
  badgeColor: string;
  unlockItems: string[];
}

export interface FaceProfileMetadata {
  uploadedAt: string;
  hasCustomPhoto: boolean;
  sourceFileName: string;
  detectedTraitsSummary: string;
  generatedTierImages: Partial<Record<1 | 2 | 3 | 4, string>>;
  generationMode: 'gemini-ai' | 'anime-tier-preset';
}

const FACE_PROFILE_STORAGE_KEY = 'runquest-face-profile-v1';
const GEMINI_API_KEY_STORAGE_KEY = 'runquest-gemini-api-key';

/**
 * RunQuest PH 공식 캐릭터 생성 및 레벨업 의상 진화 규칙
 * - 모든 사용자 사진 입력은 '애니메이션 RPG 일러스트풍(Urban & Nature Explorer)' 단일 화풍으로 통일
 * - 첫 시작(Lv.1~2)은 심플한 러너 복장으로 시작하며, 레벨업에 따라 탐험가 의상·장비·오라가 단계별로 업그레이드됨
 */
export const CHARACTER_GENERATION_RULES = [
  {
    id: 'rule-style',
    icon: '🎨',
    title: '단일 화풍 통일 (Anime RPG Illustration)',
    description:
      '수동 캐릭터 선택 없이, 업로드된 모든 얼굴 사진을 밝고 청량한 셀셰이딩 애니메이션 RPG 일러스트 화풍으로 통일하여 변환합니다.',
  },
  {
    id: 'rule-identity',
    icon: '👤',
    title: '본인 얼굴 특징 보존 (Identity Preservation)',
    description:
      '사진 속 인물의 헤어스타일·머리색, 얼굴형, 눈매, 안경 착용 여부, 밝은 미소를 분석해 캐릭터의 외형 아이덴티티로 유지합니다.',
  },
  {
    id: 'rule-outfit',
    icon: '👕',
    title: '레벨업 의상 자동 진화 (Lv.1 심플 러너복 → Lv.8+ 마스터 예장)',
    description:
      '처음(Lv.1~2)에는 가벼운 반팔 러닝복으로 출발하며, 레벨이 오를수록 탐험가 스카프·하이드레이션 조끼·윈드브레이커·마스터 망토로 의상이 자동 업그레이드됩니다.',
  },
  {
    id: 'rule-world',
    icon: '🌿',
    title: '자연 & 도시 탐험가 컨셉 (Urban & Nature Explorer)',
    description:
      '푸른 하늘과 뭉게구름 아래 싱그러운 숲길 트레일과 도시 스카이라인(BGC Manila)이 어우러진 모험가 배경으로 연출됩니다.',
  },
] as const;

/**
 * RunQuest PH 5단계 원스톱 캐릭터 · 러닝 영상 · 레벨업 진화 파이프라인
 * (사용자 얼굴 촬영 → 저레벨 러닝복 캐릭터 생성 → 달리는 영상 제작 → 랜딩페이지 영상 반영 → 레벨 도달 시 아이템 장착 & 복장 업데이트)
 */
export const UNIFIED_CHARACTER_VIDEO_PIPELINE = [
  {
    step: 1,
    id: 'face-capture',
    icon: '📸',
    title: '사용자 얼굴 촬영',
    shortLabel: '얼굴 촬영',
    description: '모바일 카메라 셀카 촬영 또는 앨범 사진으로 본인의 얼굴 특징(헤어·인상·안경 등)을 추출합니다.',
  },
  {
    step: 2,
    id: 'starter-character',
    icon: '👕',
    title: '이미지 캐릭터 생성 (Lv.1 저레벨 러닝복)',
    shortLabel: 'Lv.1 러닝복 생성',
    description: '첫 캐릭터는 항상 가벼운 심플 스타터 러닝복(Tier 1) 차림의 애니메이션 RPG 일러스트로 생성됩니다.',
  },
  {
    step: 3,
    id: 'running-video',
    icon: '🏃‍♂️',
    title: '달리는 모션 영상 제작',
    shortLabel: '달리는 영상 제작',
    description: '생성된 캐릭터 이미지를 바탕으로 내 캐릭터가 생동감 있게 달리는 모션 비디오(MP4/WebM)를 제작·등록합니다.',
  },
  {
    step: 4,
    id: 'landing-showcase',
    icon: '🎬',
    title: '랜딩페이지 & 대시보드 영상 반영',
    shortLabel: '랜딩 영상 반영',
    description: '제작된 달리는 영상이 랜딩페이지(/) 풀스크린 시네마틱 배경과 대시보드·프로필 쇼룸에 즉시 반영됩니다.',
  },
  {
    step: 5,
    id: 'levelup-outfit-evolution',
    icon: '✨',
    title: '레벨 도달 시 아이템 장착 & 복장 업데이트',
    shortLabel: '레벨업 복장 진화',
    description: '러닝으로 레벨(Lv.2~Lv.10)이 오르고 장비를 장착하면 상위 복장(스카프·조끼·윈드브레이커·망토)이 반영된 캐릭터와 영상으로 진화합니다.',
  },
] as const;

export const EXPLORER_OUTFIT_TIERS: ExplorerOutfitTier[] = [
  {
    tierNumber: 1,
    id: 'tier-1-novice',
    minLevel: 1,
    maxLevel: 2,
    rankName: 'Novice',
    titleKo: '초보 러너 (Novice Runner)',
    outfitName: '심플 스타터 러닝복',
    outfitSummary: '화이트&민트 반팔 러닝 티셔츠 + 기본 러닝 쇼츠 + 손목 밴드 + 입문용 러닝화',
    backgroundTheme: '아침 햇살이 비치는 도심 공원 숲길 트레일',
    promptOutfitRule:
      'wearing a simple, clean white-and-mint short-sleeve running t-shirt, basic athletic running shorts, a simple sweatband on the wrist, and starter running shoes. No cape, no scarf, no heavy armor — fresh beginner runner look.',
    promptBackgroundRule:
      'fresh morning park trail with lush green trees and distant city buildings under a bright sunlit blue sky with fluffy white clouds',
    fallbackImage: '/images/explorer-tiers/tier-1-novice.jpg',
    badgeColor: 'from-emerald-500 to-teal-500',
    unlockItems: ['화이트&민트 스타터 러닝 티셔츠', '기본 애슬레틱 쇼츠 & 리스트밴드'],
  },
  {
    tierNumber: 2,
    id: 'tier-2-vanguard',
    minLevel: 3,
    maxLevel: 4,
    rankName: 'Vanguard',
    titleKo: '선봉 탐험가 (Vanguard Explorer)',
    outfitName: '탐험가 스카프 & 하이드레이션 베스트',
    outfitSummary: '바람에 날리는 에메랄드 탐험가 스카프 + 경량 트레일 베스트 + 이마의 탐험 고글 + GPS 워치',
    backgroundTheme: '숲길 능선과 마닐라 BGC 스카이라인이 만나는 개척 루트',
    promptOutfitRule:
      'wearing a sporty emerald-and-white trail running hydration vest, a wind-swept emerald explorer scarf around the neck, adventure goggles resting on the forehead, and a GPS compass watch.',
    promptBackgroundRule:
      'scenic ridge where lush green forest trails overlook a sunlit modern city skyline under grand fluffy clouds and gentle wind breeze lines',
    fallbackImage: '/images/explorer-tiers/tier-2-vanguard.jpg',
    badgeColor: 'from-teal-500 to-cyan-600',
    unlockItems: ['에메랄드 윈드 스카프', '트레일 하이드레이션 베스트', '탐험가 헤드 고글'],
  },
  {
    tierNumber: 3,
    id: 'tier-3-elite',
    minLevel: 5,
    maxLevel: 7,
    rankName: 'Elite',
    titleKo: '엘리트 패스파인더 (Elite Pathfinder)',
    outfitName: '패스파인더 윈드브레이커 & 질주 오라',
    outfitSummary: '청록·골드 어드벤처 윈드브레이커 재킷 + 아크 스마트워치 + 필드 백팩 + 청록빛 질주 오라',
    backgroundTheme: '대자연 협곡 트레일과 도시 전망대를 가로지르는 고지대 루트',
    promptOutfitRule:
      'wearing a sleek teal-and-gold adventure windbreaker jacket over technical running gear, glowing arc-reactor smartwatch, compact explorer field pack, and glowing cyan-emerald sprint aura swirling around the legs.',
    promptBackgroundRule:
      'dramatic high-altitude viewpoint bridging lush nature cliffs and a vibrant modern city skyline with dynamic wind and glowing sprint particles',
    fallbackImage: '/images/explorer-tiers/tier-3-elite.jpg',
    badgeColor: 'from-violet-600 to-indigo-600',
    unlockItems: ['패스파인더 테크 윈드브레이커', '아크 원자로 스마트워치', '청록빛 질주 오라(Sprint Aura)'],
  },
  {
    tierNumber: 4,
    id: 'tier-4-master',
    minLevel: 8,
    maxLevel: 99,
    rankName: 'Master',
    titleKo: '마스터 익스플로러 (Master Explorer)',
    outfitName: '전설의 탐험가 예장 & 황금 윈드 클록',
    outfitSummary: '황금빛 문양 에메랄드 윈드 클록(망토) + 홀로그램 바이저 + 마스터 러닝 부츠 + 폭풍 빛 오라',
    backgroundTheme: '구름 위 황금빛 태양 아래 대자연과 메가시티를 내려다보는 정상',
    promptOutfitRule:
      'wearing ornate white-emerald-and-gold Master Explorer running regalia with a flowing golden-trimmed emerald wind cloak, holographic pathfinder visor, and radiant golden-teal wind and light aura swirling around the body.',
    promptBackgroundRule:
      'heroic summit above sunlit clouds overlooking both emerald mountain trails and a gleaming futuristic city skyline with golden light rays',
    fallbackImage: '/images/explorer-tiers/tier-4-master.jpg',
    badgeColor: 'from-amber-500 to-orange-500',
    unlockItems: ['황금 에메랄드 윈드 클록(망토)', '홀로그램 패스파인더 바이저', '마스터 황금 질주 오라'],
  },
];

export function getExplorerOutfitTier(level: number): ExplorerOutfitTier {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  if (safeLevel <= 2) return EXPLORER_OUTFIT_TIERS[0];
  if (safeLevel <= 4) return EXPLORER_OUTFIT_TIERS[1];
  if (safeLevel <= 7) return EXPLORER_OUTFIT_TIERS[2];
  return EXPLORER_OUTFIT_TIERS[3];
}

export function getExplorerOutfitTierByNumber(tierNumber: 1 | 2 | 3 | 4): ExplorerOutfitTier {
  return (
    EXPLORER_OUTFIT_TIERS.find((t) => t.tierNumber === tierNumber) ?? EXPLORER_OUTFIT_TIERS[0]
  );
}

export function getSavedFaceProfile(): FaceProfileMetadata | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FACE_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FaceProfileMetadata;
  } catch {
    return null;
  }
}

export function saveFaceProfile(profile: FaceProfileMetadata): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FACE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage 용량 초과 시 이전 캐시 정리 후 재시도
  }
}

export function getConfiguredGeminiApiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)?.trim();
    if (saved) return saved;
  }
  return '';
}

export function setConfiguredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  }
}

/**
 * 현재 레벨에 해당하는 캐릭터 아바타 이미지를 반환합니다.
 * - 사용자가 생성한 해당 티어 AI 이미지가 있으면 우선 반환
 * - 없으면 현재 레벨 티어의 기본 애니메이션 RPG 탐험가 일러스트 반환
 */
export function getAvatarForLevelTier(level: number): string {
  const tier = getExplorerOutfitTier(level);
  const faceProfile = getSavedFaceProfile();
  const customTierImg = faceProfile?.generatedTierImages?.[tier.tierNumber];
  if (customTierImg) {
    return customTierImg;
  }
  return tier.fallbackImage;
}

/**
 * Gemini Nano Banana 2.1 (gemini-nano-banana-2.1) 프롬프트 생성기
 * - 모든 사진을 애니메이션 RPG 일러스트풍으로 통일
 * - 레벨별 탐험가 의상 규칙 강제 적용
 */
export function buildAnimeExplorerPrompt(
  tier: ExplorerOutfitTier,
  traitNotes?: string,
  currentLevel = tier.minLevel
): string {
  const extraTrait = traitNotes?.trim()
    ? `Additional facial/feature notes to preserve: ${traitNotes.trim()}.`
    : '';
  const equippedGears = getEquippedLevelGears(currentLevel);
  const modularGearPrompt =
    equippedGears.length > 0
      ? `MODULAR EQUIPPED GEAR PIECES TO RENDER ON CHARACTER: ${equippedGears
          .map((g) => `[Lv.${g.level} ${g.slot}: ${g.promptVisualTag}]`)
          .join(', ')}.`
      : '';

  return [
    'Transform the person in this reference photo into a vibrant modern cel-shaded Anime RPG character illustration (Makoto Shinkai / Genshin Impact / Webtoon adventurer art style).',
    'STRICT IDENTITY RULE: Faithfully preserve the person’s key facial identity from the photo — including hairstyle, hair color, glasses (if worn in the photo), eye shape, face contour, and a bright, confident adventurer expression.',
    `STRICT LEVEL OUTFIT RULE (Tier ${tier.tierNumber} - ${tier.rankName}): Depict the character ${tier.promptOutfitRule}`,
    modularGearPrompt,
    `STRICT WORLD & BACKGROUND RULE (Urban & Nature Explorer Concept): Set the scene in a ${tier.promptBackgroundRule}. Crisp anime line art, luminous cel shading, high-detail RPG character portrait, 1:1 square aspect ratio.`,
    extraTrait,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 업로드된 이미지 파일을 768x768 이내의 base64 JPEG로 리사이즈 및 분석합니다.
 */
export async function normalizeUploadedFacePhoto(file: File): Promise<{
  base64Data: string;
  mimeType: 'image/jpeg';
  previewDataUrl: string;
  detectedTraitsSummary: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진 파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 포맷을 불러올 수 없습니다.'));
      img.onload = () => {
        const maxDim = 768;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 컨텍스트를 초기화할 수 없습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.86);
        const base64Data = previewDataUrl.replace(/^data:image\/\w+;base64,/, '');

        resolve({
          base64Data,
          mimeType: 'image/jpeg',
          previewDataUrl,
          detectedTraitsSummary: '이목구비·헤어스타일·표정 특징 추출 완료',
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 얼굴 사진을 입력받아 현재 레벨 티어에 맞는 '애니메이션 RPG 탐험가' 캐릭터를 생성합니다.
 * - Gemini API 키가 설정된 경우: `gemini-nano-banana-2.1` Interactions API 호출
 * - API 키가 없거나 오프라인인 경우: 레벨 티어별 공식 애니메이션 RPG 탐험가 일러스트로 즉시 매칭
 */
export async function generateAnimeExplorerCharacter(params: {
  base64Data: string;
  mimeType: string;
  fileName: string;
  level: number;
  traitNotes?: string;
}): Promise<{
  avatarUrl: string;
  tier: ExplorerOutfitTier;
  mode: 'gemini-ai' | 'anime-tier-preset';
  promptUsed: string;
}> {
  const tier = getExplorerOutfitTier(params.level);
  const promptUsed = buildAnimeExplorerPrompt(tier, params.traitNotes);
  const apiKey = getConfiguredGeminiApiKey();

  const existingProfile = getSavedFaceProfile() ?? {
    uploadedAt: new Date().toISOString(),
    hasCustomPhoto: true,
    sourceFileName: params.fileName,
    detectedTraitsSummary: params.traitNotes?.trim() || '헤어스타일 · 얼굴형 · 탐험가 인상 반영',
    generatedTierImages: {},
    generationMode: 'anime-tier-preset' as const,
  };

  if (apiKey) {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
            'Api-Revision': '2026-05-20',
          },
          body: JSON.stringify({
            model: 'gemini-nano-banana-2.1',
            input: [
              {
                type: 'text',
                text: promptUsed,
              },
              {
                type: 'image',
                mime_type: params.mimeType,
                data: params.base64Data,
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const outputImage =
          result?.output_image ??
          result?.steps
            ?.flatMap((s: { content?: Array<{ type?: string; data?: string; mime_type?: string }> }) => s.content ?? [])
            .find((c: { type?: string; data?: string }) => c.type === 'image' && c.data);

        if (outputImage?.data) {
          const outMime = outputImage.mime_type || 'image/png';
          const generatedDataUrl = `data:${outMime};base64,${outputImage.data}`;

          const updatedProfile: FaceProfileMetadata = {
            ...existingProfile,
            uploadedAt: new Date().toISOString(),
            hasCustomPhoto: true,
            sourceFileName: params.fileName,
            detectedTraitsSummary:
              params.traitNotes?.trim() || 'Gemini AI 얼굴 특징 + 레벨 의상 합성 완료',
            generatedTierImages: {
              ...existingProfile.generatedTierImages,
              [tier.tierNumber]: generatedDataUrl,
            },
            generationMode: 'gemini-ai',
          };
          saveFaceProfile(updatedProfile);

          return {
            avatarUrl: generatedDataUrl,
            tier,
            mode: 'gemini-ai',
            promptUsed,
          };
        }
      }
    } catch {
      // API 호출 실패 시 아래 레벨 티어 애니메이션 RPG 일러스트 폴백으로 안전하게 이어짐
    }
  }

  // API 키 미설정 또는 호출 실패 시: 레벨별 공식 애니메이션 RPG 탐험가 일러스트 적용
  const fallbackAvatarUrl = tier.fallbackImage;
  const updatedProfile: FaceProfileMetadata = {
    ...existingProfile,
    uploadedAt: new Date().toISOString(),
    hasCustomPhoto: true,
    sourceFileName: params.fileName,
    detectedTraitsSummary:
      params.traitNotes?.trim() || '얼굴 특징 매칭 · 애니메이션 RPG 탐험가 화풍 적용',
    generatedTierImages: {
      ...existingProfile.generatedTierImages,
      [tier.tierNumber]: fallbackAvatarUrl,
    },
    generationMode: 'anime-tier-preset',
  };
  saveFaceProfile(updatedProfile);

  return {
    avatarUrl: fallbackAvatarUrl,
    tier,
    mode: 'anime-tier-preset',
    promptUsed,
  };
}

export interface LevelEquipmentStep {
  id: string;
  level: number;
  requiredXp: number;
  approxDistanceKm: number;
  slot: string;
  slotIcon: string;
  itemName: string;
  priceGold: number;
  questName: string;
  acquisitionMethod: string;
  visualChangeSummary: string;
  statBonusText: string;
  promptVisualTag: string;
  tierNumber: 1 | 2 | 3 | 4;
}

export interface ModularGearState {
  goldBalance: number;
  ownedLevels: number[];
  equippedLevels: number[];
}

const MODULAR_GEAR_STORAGE_KEY = 'runquest-modular-gear-v1';

/**
 * Lv.1 ~ Lv.10 (1레벨 단위) 장비 해금 · 획득 조건(퀘스트/상점) · 캐릭터 외형 장착 테이블
 */
export const LEVEL_EQUIPMENT_PROGRESSION: LevelEquipmentStep[] = [
  {
    id: 'gear-lv1-starter',
    level: 1,
    requiredXp: 0,
    approxDistanceKm: 0,
    slot: 'Torso + Shoes',
    slotIcon: '👕',
    itemName: '화이트&민트 스타터 러닝복 & 기본 러닝화',
    priceGold: 0,
    questName: '첫 캐릭터 생성 완료',
    acquisitionMethod: '캐릭터 최초 생성 기본 지급',
    visualChangeSummary: '깔끔한 반팔 러닝 티셔츠와 기본 쇼츠·운동화로 출발하는 입문 러너 복장',
    statBonusText: '기본 HP +100 · 기본 활동 트래킹',
    promptVisualTag: 'simple white-and-mint short-sleeve running tee, basic running shorts, starter sneakers',
    tierNumber: 1,
  },
  {
    id: 'gear-lv2-shoes',
    level: 2,
    requiredXp: 300,
    approxDistanceKm: 3,
    slot: 'Shoes + Wrist',
    slotIcon: '👟',
    itemName: '네온 스트라이드 러닝화 & 스포츠 손목 밴드',
    priceGold: 150,
    questName: '첫 3km 러닝 완주 퀘스트',
    acquisitionMethod: '첫 3km 완주 퀘스트 보상 (또는 상점 150G)',
    visualChangeSummary: '신발이 에메랄드 네온 쿠션 러닝화로 교체되고 손목에 민트색 스포츠 밴드 추가',
    statBonusText: 'Stamina 소모 -3% · 페이스 안정화',
    promptVisualTag: 'neon-emerald cushioned running shoes, mint athletic sweatband on wrist',
    tierNumber: 1,
  },
  {
    id: 'gear-lv3-scarf',
    level: 3,
    requiredXp: 700,
    approxDistanceKm: 7,
    slot: 'Neck',
    slotIcon: '🧣',
    itemName: '에메랄드 윈드 스카프',
    priceGold: 300,
    questName: '신규 코스 2곳 탐험 퀘스트',
    acquisitionMethod: '신규 코스 2곳 탐험 퀘스트 달성 (또는 상점 300G)',
    visualChangeSummary: '목에 에메랄드빛 탐험가 스카프가 둘러져 달릴 때 바람에 휘날리는 모험가 실루엣 연출',
    statBonusText: '탐험 XP +5% · 바람 저항 감소',
    promptVisualTag: 'wind-swept emerald explorer scarf fluttering around neck',
    tierNumber: 2,
  },
  {
    id: 'gear-lv4-vest',
    level: 4,
    requiredXp: 1200,
    approxDistanceKm: 12,
    slot: 'Torso + Head',
    slotIcon: '🦺',
    itemName: '트레일 하이드레이션 베스트 & 이마 탐험 고글',
    priceGold: 500,
    questName: '누적 10km 돌파 퀘스트',
    acquisitionMethod: '누적 10km 돌파 퀘스트 + 상점 500G 제작',
    visualChangeSummary: '상의 위에 경량 트레일 러닝 조끼를 착용하고 이마 위에 브론즈·그린 탐험 고글 장착',
    statBonusText: '최대 HP +20 · 수분 보급 Stamina +5%',
    promptVisualTag: 'sporty trail running hydration vest over shirt, adventure goggles resting on forehead',
    tierNumber: 2,
  },
  {
    id: 'gear-lv5-pack',
    level: 5,
    requiredXp: 2000,
    approxDistanceKm: 20,
    slot: 'Wrist + Back',
    slotIcon: '🎒',
    itemName: 'GPS 컴퍼스 워치 & 소형 익스플로러 백팩',
    priceGold: 800,
    questName: '주간 목표 100% 달성 퀘스트',
    acquisitionMethod: '주간 목표 100% 달성 퀘스트 (또는 상점 800G)',
    visualChangeSummary: '손목에 빛나는 GPS 나침반 워치와 등 뒤 컴팩트한 탐험가 크로스 백팩 장착',
    statBonusText: '히든 체크포인트 발견율 +10%',
    promptVisualTag: 'glowing GPS compass watch on wrist, compact explorer trail backpack with carabiner',
    tierNumber: 3,
  },
  {
    id: 'gear-lv6-windbreaker',
    level: 6,
    requiredXp: 3200,
    approxDistanceKm: 32,
    slot: 'Torso',
    slotIcon: '🧥',
    itemName: '패스파인더 테크 윈드브레이커 재킷',
    priceGold: 1200,
    questName: '하프마라톤(21km) 누적 거리 달성',
    acquisitionMethod: '하프마라톤(21km) 누적 업적 & 상점 1,200G 구입',
    visualChangeSummary: '상의가 청록·골드 라인이 빛나는 방풍 어드벤처 윈드브레이커 재킷으로 업그레이드',
    statBonusText: '장비 내구도 소모 -10% · 전천후 방풍',
    promptVisualTag: 'sleek teal-and-gold adventure tech windbreaker jacket with reflective trims',
    tierNumber: 3,
  },
  {
    id: 'gear-lv7-aura',
    level: 7,
    requiredXp: 4800,
    approxDistanceKm: 48,
    slot: 'Wrist + Aura',
    slotIcon: '⚡',
    itemName: '아크 원자로 스마트워치 & 청록 질주 오라',
    priceGold: 1800,
    questName: '크루 레이드 체크인 & 풀마라톤(42km) 누적',
    acquisitionMethod: '크루 레이드 체크인 퀘스트 + 풀마라톤(42km) 누적 업적',
    visualChangeSummary: '워치에서 미니 홀로그램 맵이 투사되고 다리 주변에 청록빛 바람 질주 오라 생성',
    statBonusText: '크루 레이드 보너스 XP +10%',
    promptVisualTag: 'holographic arc smartwatch projecting mini trail map, cyan-emerald wind sprint aura swirling around legs',
    tierNumber: 3,
  },
  {
    id: 'gear-lv8-cloak',
    level: 8,
    requiredXp: 6800,
    approxDistanceKm: 68,
    slot: 'Back (Cloak)',
    slotIcon: '🦸',
    itemName: '황금 문양 에메랄드 윈드 클록(망토)',
    priceGold: 2500,
    questName: '마스터 탐험가 승급 시험 완주',
    acquisitionMethod: '마스터 승급 시험 퀘스트 완주 (또는 상점 2,500G)',
    visualChangeSummary: '어깨 뒤로 금빛 나침반 문양이 새겨진 에메랄드 탐험가 망토가 휘날리는 영웅 실루엣',
    statBonusText: '모든 코스 완주 XP +12% · 마스터 위용',
    promptVisualTag: 'flowing emerald explorer wind cloak with golden compass embroidery',
    tierNumber: 4,
  },
  {
    id: 'gear-lv9-visor',
    level: 9,
    requiredXp: 9200,
    approxDistanceKm: 92,
    slot: 'Head (Visor)',
    slotIcon: '🥽',
    itemName: '홀로그램 패스파인더 AR 바이저',
    priceGold: 3500,
    questName: '마닐라 5대 구역 안개(Fog of War) 정복',
    acquisitionMethod: '마닐라 5대 구역 안개 해금(Fog of War) 정복 퀘스트',
    visualChangeSummary: '눈가에 반투명 에메랄드·골드 빛의 홀로그램 패스파인더 바이저 오버레이 장착',
    statBonusText: '미탐험 구역 탐색 범위 +20%',
    promptVisualTag: 'translucent golden-emerald holographic pathfinder AR visor across eyes',
    tierNumber: 4,
  },
  {
    id: 'gear-lv10-regalia',
    level: 10,
    requiredXp: 12000,
    approxDistanceKm: 120,
    slot: 'Torso + Shoes + Aura',
    slotIcon: '👑',
    itemName: '그랜드 마스터 탐험가 예장 & 골든 스톰 오라',
    priceGold: 5000,
    questName: '누적 120km 그랜드 익스플로러 전설 달성',
    acquisitionMethod: '누적 120km 전설 업적 & 최종 상점 각성 (5,000G)',
    visualChangeSummary: '화이트·에메랄드·골드 마스터 예장과 윙 러닝 부츠, 전신을 감싸는 황금빛 폭풍 오라 완성',
    statBonusText: '전 스탯 마스터 보너스 +25% · 전설 칭호',
    promptVisualTag: 'ornate white-emerald-and-gold Grand Master Explorer regalia, winged golden running boots, radiant golden-teal storm aura',
    tierNumber: 4,
  },
];

export function getModularGearState(currentLevel = 1): ModularGearState {
  const defaultLevels = LEVEL_EQUIPMENT_PROGRESSION.filter((g) => g.level <= currentLevel).map(
    (g) => g.level
  );
  const fallbackState: ModularGearState = {
    goldBalance: 2500,
    ownedLevels: defaultLevels.length > 0 ? defaultLevels : [1],
    equippedLevels: defaultLevels.length > 0 ? defaultLevels : [1],
  };

  if (typeof window === 'undefined') return fallbackState;

  try {
    const raw = window.localStorage.getItem(MODULAR_GEAR_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(MODULAR_GEAR_STORAGE_KEY, JSON.stringify(fallbackState));
      return fallbackState;
    }
    const parsed = JSON.parse(raw) as ModularGearState;
    const mergedOwned = Array.from(
      new Set([1, ...defaultLevels, ...(parsed.ownedLevels ?? [])])
    ).sort((a, b) => a - b);
    const mergedEquipped =
      parsed.equippedLevels && parsed.equippedLevels.length > 0
        ? Array.from(new Set([1, ...parsed.equippedLevels])).sort((a, b) => a - b)
        : mergedOwned;

    return {
      goldBalance: typeof parsed.goldBalance === 'number' ? parsed.goldBalance : 2500,
      ownedLevels: mergedOwned,
      equippedLevels: mergedEquipped,
    };
  } catch {
    return fallbackState;
  }
}

export function saveModularGearState(state: ModularGearState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MODULAR_GEAR_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('runquest-gear-updated', { detail: state }));
  } catch {
    // ignore storage errors
  }
}

export function getEquippedLevelGears(currentLevel = 1): LevelEquipmentStep[] {
  const state = getModularGearState(currentLevel);
  return LEVEL_EQUIPMENT_PROGRESSION.filter((item) =>
    state.equippedLevels.includes(item.level)
  );
}

/**
 * 퀘스트 달성 또는 골드(G) 상점 구입을 통해 특정 레벨 장비를 획득하고 즉시 캐릭터에 장착합니다.
 */
export function acquireAndEquipLevelGear(
  targetLevel: number,
  method: 'quest' | 'gold',
  currentLevel = 1
): {
  success: boolean;
  message: string;
  state: ModularGearState;
  appliedTier: ExplorerOutfitTier;
} {
  const step = LEVEL_EQUIPMENT_PROGRESSION.find((s) => s.level === targetLevel);
  const state = getModularGearState(currentLevel);

  if (!step) {
    return {
      success: false,
      message: '존재하지 않는 장비 단계입니다.',
      state,
      appliedTier: getExplorerOutfitTier(currentLevel),
    };
  }

  let nextGold = state.goldBalance;
  if (!state.ownedLevels.includes(targetLevel)) {
    if (method === 'gold') {
      if (state.goldBalance < step.priceGold) {
        return {
          success: false,
          message: `보유 골드가 부족합니다. (필요: ${step.priceGold}G / 보유: ${state.goldBalance}G)`,
          state,
          appliedTier: getExplorerOutfitTier(currentLevel),
        };
      }
      nextGold -= step.priceGold;
    } else {
      // 퀘스트 달성 시 축하 골드 보너스 +100G 지급
      nextGold += 100;
    }
  }

  const nextOwned = Array.from(new Set([...state.ownedLevels, targetLevel])).sort(
    (a, b) => a - b
  );
  const nextEquipped = Array.from(new Set([...state.equippedLevels, targetLevel])).sort(
    (a, b) => a - b
  );

  const nextState: ModularGearState = {
    goldBalance: nextGold,
    ownedLevels: nextOwned,
    equippedLevels: nextEquipped,
  };
  saveModularGearState(nextState);

  const highestEquippedLevel = Math.max(...nextEquipped, 1);
  const appliedTier = getExplorerOutfitTier(highestEquippedLevel);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'runquest-selected-outfit-tier',
      String(appliedTier.tierNumber)
    );
    window.localStorage.setItem('runquest-selected-avatar', appliedTier.fallbackImage);
    window.dispatchEvent(
      new CustomEvent('runquest-avatar-updated', {
        detail: {
          avatarUrl: appliedTier.fallbackImage,
          outfitTier: appliedTier.tierNumber,
        },
      })
    );
  }

  return {
    success: true,
    message:
      method === 'quest'
        ? `🎯 [${step.questName}] 달성! '${step.itemName}' 장비가 생성·착용되었습니다 (+100G 보상)`
        : `🛒 '${step.itemName}' 장비를 ${step.priceGold}G에 구매하여 캐릭터에 착용했습니다!`,
    state: nextState,
    appliedTier,
  };
}

/**
 * 보유 중인 레벨 장비를 착용/해제하고 캐릭터 외형 티어를 즉시 갱신합니다.
 */
export function toggleEquipLevelGear(
  targetLevel: number,
  currentLevel = 1
): {
  state: ModularGearState;
  appliedTier: ExplorerOutfitTier;
  isEquipped: boolean;
} {
  const state = getModularGearState(currentLevel);
  if (targetLevel === 1) {
    // Lv.1 기본 러닝복은 최소 베이스 복장으로 유지
    const appliedTier = getExplorerOutfitTier(Math.max(...state.equippedLevels, 1));
    return { state, appliedTier, isEquipped: true };
  }

  const currentlyEquipped = state.equippedLevels.includes(targetLevel);
  const nextEquipped = currentlyEquipped
    ? state.equippedLevels.filter((lv) => lv !== targetLevel)
    : Array.from(new Set([...state.equippedLevels, targetLevel])).sort((a, b) => a - b);

  const nextState: ModularGearState = {
    ...state,
    equippedLevels: nextEquipped.length > 0 ? nextEquipped : [1],
  };
  saveModularGearState(nextState);

  const highestEquippedLevel = Math.max(...nextState.equippedLevels, 1);
  const appliedTier = getExplorerOutfitTier(highestEquippedLevel);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'runquest-selected-outfit-tier',
      String(appliedTier.tierNumber)
    );
    window.localStorage.setItem('runquest-selected-avatar', appliedTier.fallbackImage);
    window.dispatchEvent(
      new CustomEvent('runquest-avatar-updated', {
        detail: {
          avatarUrl: appliedTier.fallbackImage,
          outfitTier: appliedTier.tierNumber,
        },
      })
    );
  }

  return {
    state: nextState,
    appliedTier,
    isEquipped: !currentlyEquipped,
  };
}


