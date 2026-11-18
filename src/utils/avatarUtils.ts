import { getExplorerOutfitTier } from '../services/aiCharacterService';

export function normalizeAvatarUrl(url?: string | null, level?: number): string {
  const defaultTierImage = getExplorerOutfitTier(level ?? 1).fallbackImage;

  if (!url || typeof url !== 'string') {
    return defaultTierImage;
  }

  // 0. AI 생성 Base64 이미지, Blob URL, 외부 URL, 또는 레벨별 애니메이션 RPG 탐험가 티어 이미지인 경우 그대로 유지
  if (
    url.startsWith('data:image/') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/images/explorer-tiers/')
  ) {
    return url;
  }

  // 8번 아바타의 경우: webm 투명 비디오 지원
  if (url.includes('8.webm') || url.includes('8.mp4') || url === '/images/avatars/8.png') {
    return '/images/avatars/8.webm';
  }

  // 1. 이미 정상적인 /images/avatars/X.png 형식인 경우
  const directMatch = url.match(/\/images\/avatars\/(\d+)\.(png|mp4|webm)$/);
  if (directMatch) {
    const num = parseInt(directMatch[1], 10);
    if (num >= 1 && num <= 23) {
      if (num === 8) {
        return '/images/avatars/8.webm';
      }
      return `/images/avatars/${num}.png`;
    }
  }

  // 2. avatar-01.png 같은 예전 형식인 경우
  const legacyMatch = url.match(/avatar-(\d+)\.png$/);
  if (legacyMatch) {
    const num = parseInt(legacyMatch[1], 10);
    const validNum = ((num - 1) % 23) + 1;
    if (validNum === 8) {
      return '/images/avatars/8.webm';
    }
    return `/images/avatars/${validNum}.png`;
  }

  // 기본 안전 경로: 레벨별 애니메이션 RPG 탐험가 일러스트
  return defaultTierImage;
}

export function isVideoAvatar(url?: string | null): boolean {
  if (!url) return false;
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/images/explorer-tiers/')
  ) {
    return false;
  }
  return (
    url.includes('8.webm') ||
    url.includes('8.mp4') ||
    url === '/images/avatars/8.png' ||
    url === '/images/avatars/8.webm' ||
    url === '/images/avatars/8.mp4' ||
    url === 'avatar-8'
  );
}

export function getAvatarThumbnail(url?: string | null, level?: number): string {
  if (!url || typeof url !== 'string') {
    return getExplorerOutfitTier(level ?? 1).fallbackImage;
  }
  if (isVideoAvatar(url)) {
    return '/images/avatars/8.png';
  }
  const normalized = normalizeAvatarUrl(url, level);
  if (normalized.endsWith('.webm') || normalized.endsWith('.mp4')) {
    return '/images/avatars/8.png';
  }
  return normalized;
}

export function getAvatarVideoUrl(url?: string | null): string {
  if (isVideoAvatar(url)) {
    return '/images/avatars/8.webm';
  }
  return '';
}
