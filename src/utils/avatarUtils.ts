export function normalizeAvatarUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '/images/avatars/1.png';
  }

  // 0. mp4 확장자 처리
  if (url.includes('8.mp4')) {
    return '/images/avatars/8.mp4';
  }

  // 1. 이미 정상적인 /images/avatars/X.png 형식인 경우
  const directMatch = url.match(/\/images\/avatars\/(\d+)\.(png|mp4)$/);
  if (directMatch) {
    const num = parseInt(directMatch[1], 10);
    if (num >= 1 && num <= 23) {
      if (num === 8 && directMatch[2] === 'mp4') {
        return '/images/avatars/8.mp4';
      }
      return `/images/avatars/${num}.png`;
    }
  }

  // 2. avatar-01.png 같은 예전 형식인 경우
  const legacyMatch = url.match(/avatar-(\d+)\.png$/);
  if (legacyMatch) {
    const num = parseInt(legacyMatch[1], 10);
    const validNum = ((num - 1) % 23) + 1;
    return `/images/avatars/${validNum}.png`;
  }

  // 3. 숫자만 추출 가능한 경우
  const digits = url.match(/\d+/);
  if (digits) {
    const num = parseInt(digits[0], 10);
    const validNum = num >= 1 && num <= 23 ? num : ((num - 1) % 23) + 1;
    return `/images/avatars/${validNum}.png`;
  }

  // 기본 안전 경로
  return '/images/avatars/1.png';
}

export function isVideoAvatar(url?: string | null): boolean {
  if (!url) return false;
  return url.endsWith('.mp4') || url.includes('/8.') || url === '/images/avatars/8.png';
}

export function getAvatarThumbnail(url?: string | null): string {
  const normalized = normalizeAvatarUrl(url);
  if (normalized.endsWith('.mp4')) {
    return '/images/avatars/8.png';
  }
  return normalized;
}
