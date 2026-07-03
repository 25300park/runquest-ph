export type SubscriptionPlan = {
  id: 'free' | 'premium';
  name: string;
  priceLabel: string;
  description: string;
  benefits: string[];
  highlighted?: boolean;
};

export type PartnerReward = {
  id: string;
  partnerName: string;
  partnerType: 'Cafe' | 'Gym' | 'Clinic';
  rewardTitle: string;
  requiredXp: number;
  description: string;
};

export type RunQuestEvent = {
  id: string;
  title: string;
  area: string;
  eventType: 'Weekly Run Event' | 'Monthly Challenge' | 'City Race';
  reward: string;
  description: string;
};

export type RedemptionHistoryItem = {
  id: string;
  partnerName: string;
  rewardTitle: string;
  redeemedAt: string;
  requiredXp: number;
};
