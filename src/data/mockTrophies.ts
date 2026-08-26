export interface TrophyItem {
  id: string;
  name: string;
  category: 'shoes' | 'charm' | 'cap' | 'title' | 'skin';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlocked: boolean;
  unlockCondition: string;
  buffDescription: string;
}

export const mockTrophies: TrophyItem[] = [
  {
    id: 'trophy-starter-striders',
    name: 'Starter Striders',
    category: 'shoes',
    icon: '👟',
    rarity: 'Common',
    unlocked: true,
    unlockCondition: 'Default equipment for all runners',
    buffDescription: '+5% Basic Sprint Speed'
  },
  {
    id: 'trophy-glow-charm',
    name: 'Neon Tiger Glow Charm',
    category: 'charm',
    icon: '✨',
    rarity: 'Rare',
    unlocked: true,
    unlockCondition: 'Complete first 3km Night Run in BGC',
    buffDescription: '+10% EXP Gain at Night'
  },
  {
    id: 'trophy-bgc-pioneer',
    name: 'BGC Pioneer Cap',
    category: 'cap',
    icon: '🧢',
    rarity: 'Rare',
    unlocked: true,
    unlockCondition: 'Explore 30% of BGC Greenway',
    buffDescription: '+15% Energy Regen'
  },
  {
    id: 'trophy-ayala-sprinter',
    name: 'Ayala Speed Wings',
    category: 'shoes',
    icon: '🪽',
    rarity: 'Epic',
    unlocked: false,
    unlockCondition: 'Reach Monthly 50km mileage in Makati',
    buffDescription: '+20% Speed Boost in CBD Zones'
  },
  {
    id: 'trophy-crown-champion',
    name: 'Crown of High Street',
    category: 'skin',
    icon: '👑',
    rarity: 'Legendary',
    unlocked: false,
    unlockCondition: 'Become Weekly #1 Ruler of High Street',
    buffDescription: '+30% Guild Victory XP'
  },
  {
    id: 'trophy-ocean-dashers',
    name: 'MOA Seaside Walkers',
    category: 'shoes',
    icon: '🌊',
    rarity: 'Epic',
    unlocked: false,
    unlockCondition: 'Complete 10 Seaside Quests in MOA',
    buffDescription: '+25% Endurance Stat'
  }
];
