import type { RedemptionHistoryItem } from '../types/monetization';

const redemptionStorageKey = 'runquest-ph-redemption-history';

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function calculateRewardPoints(totalXp: number) {
  return Math.floor(totalXp / 1000);
}

export function getRedemptionHistory(): RedemptionHistoryItem[] {
  if (!hasStorage()) {
    return [];
  }

  const storedHistory = window.localStorage.getItem(redemptionStorageKey);

  if (!storedHistory) {
    return [];
  }

  return JSON.parse(storedHistory) as RedemptionHistoryItem[];
}

export function saveRedemption(item: RedemptionHistoryItem) {
  if (!hasStorage()) {
    return [];
  }

  const nextHistory = [item, ...getRedemptionHistory()];
  window.localStorage.setItem(redemptionStorageKey, JSON.stringify(nextHistory));

  return nextHistory;
}
