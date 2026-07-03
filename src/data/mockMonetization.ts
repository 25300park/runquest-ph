import type { PartnerReward, RunQuestEvent, SubscriptionPlan } from '../types/monetization';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Adventurer',
    priceLabel: 'PHP 0',
    description: 'Core routes, XP, levels, and basic exploration progress.',
    benefits: ['Official routes', 'Basic GPS tracking', 'XP and levels', 'Area exploration']
  },
  {
    id: 'premium',
    name: 'Premium Pathfinder',
    priceLabel: 'Mock upgrade',
    description: 'Deeper RPG progress, richer rewards, and future premium route perks.',
    benefits: [
      'Premium route previews',
      'Advanced progress insights',
      'Partner reward boosts',
      'Special event badges'
    ],
    highlighted: true
  }
];

export const partnerRewards: PartnerReward[] = [
  {
    id: 'reward-cafe-bgc',
    partnerName: 'High Street Brew',
    partnerType: 'Cafe',
    rewardTitle: 'Free iced coffee upgrade',
    requiredXp: 1200,
    description: 'A small recovery treat after a BGC route.'
  },
  {
    id: 'reward-gym-makati',
    partnerName: 'Ayala Strength Studio',
    partnerType: 'Gym',
    rewardTitle: 'One-day gym pass',
    requiredXp: 2500,
    description: 'Try a strength session to support your running habit.'
  },
  {
    id: 'reward-clinic-moa',
    partnerName: 'Bay Wellness Clinic',
    partnerType: 'Clinic',
    rewardTitle: 'Runner recovery check discount',
    requiredXp: 4000,
    description: 'Mock partner benefit for active city explorers.'
  }
];

export const runQuestEvents: RunQuestEvent[] = [
  {
    id: 'event-weekly-run',
    title: 'Weekly Run Event',
    area: 'BGC',
    eventType: 'Weekly Run Event',
    reward: '+250 XP',
    description: 'Complete one short route this week and keep your adventure moving.'
  },
  {
    id: 'event-monthly-challenge',
    title: 'Monthly Challenge',
    area: 'Makati',
    eventType: 'Monthly Challenge',
    reward: 'Explorer badge',
    description: 'Clear three city routes in a month to unlock a mock badge.'
  },
  {
    id: 'event-city-race',
    title: 'City Race',
    area: 'BGC / Makati',
    eventType: 'City Race',
    reward: '+800 XP',
    description: 'A mock weekend race quest across the city zones.'
  }
];
