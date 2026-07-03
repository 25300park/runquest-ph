export type Character = {
  id: string;
  name: string;
  code: 'explorer' | 'challenger' | 'guardian';
  icon: string;
  shortStory: string;
  personalityStyle: string;
  rpgIdentity: string;
  journeyStyle: string;
  recommendedFor: string[];
  bonus: string;
};
