import type { Character } from '../types/character';

export const mockCharacters: Character[] = [
  {
    id: 'char-explorer',
    code: 'explorer',
    name: 'The Explorer',
    icon: 'EX',
    shortStory:
      'The Explorer believes every street has a story and every route can become an adventure.',
    personalityStyle: 'Curious, relaxed, and guided by discovery.',
    rpgIdentity: 'Pathfinder of hidden city routes',
    journeyStyle: 'Route discovery and local travel',
    recommendedFor: ['Beginners', 'Walkers', 'Local travel lovers'],
    bonus: 'First-time course completion XP +3%'
  },
  {
    id: 'char-challenger',
    code: 'challenger',
    name: 'The Challenger',
    icon: 'CH',
    shortStory:
      'The Challenger sees every route as a goal and every finish line as progress.',
    personalityStyle: 'Focused, energetic, and driven by personal records.',
    rpgIdentity: 'Route duelist chasing stronger quests',
    journeyStyle: 'Goals, badges, and steady improvement',
    recommendedFor: ['Casual runners', 'Fun run starters', 'Badge collectors'],
    bonus: 'Good pace XP +3%'
  },
  {
    id: 'char-guardian',
    code: 'guardian',
    name: 'The Guardian',
    icon: 'GD',
    shortStory:
      'The Guardian grows through small steps, safe routes, and long-term consistency.',
    personalityStyle: 'Patient, steady, and protective of the journey.',
    rpgIdentity: 'Ward keeper of safe paths and lasting habits',
    journeyStyle: 'Gentle habits and safe progress',
    recommendedFor: ['New walkers', 'Comeback users', 'Office workers'],
    bonus: 'Walking course XP +3%'
  }
];
