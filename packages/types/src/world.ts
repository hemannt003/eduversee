/**
 * World Engine Models
 * Represents explorable learning worlds
 */

export enum Biome {
  TUTORIAL = 'tutorial',
  FOREST = 'forest',
  DESERT = 'desert',
  OCEAN = 'ocean',
  MOUNTAIN = 'mountain',
  SPACE = 'space',
  CYBER = 'cyber',
  FANTASY = 'fantasy',
}

export enum WorldDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master',
}

export interface World {
  id: string;
  name: string;
  description: string;
  biome: Biome;
  difficulty: WorldDifficulty;
  
  // Unlocking
  unlockConditions: UnlockCondition[];
  requiredLevel: number;
  requiredSkills: string[];
  
  // Content
  questChains: QuestChain[];
  dungeons: Dungeon[];
  raidBoss?: RaidBoss;
  
  // Metadata
  isEvent: boolean;
  eventStartDate?: Date;
  eventEndDate?: Date;
  isTimeLimited: boolean;
  maxPlayers?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UnlockCondition {
  type: 'level' | 'skill' | 'quest' | 'achievement' | 'guild';
  value: string | number;
  operator: 'eq' | 'gte' | 'lte' | 'in';
}

export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: string[]; // Quest IDs in order
  rewards: Reward[];
  unlockCondition?: UnlockCondition;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  difficulty: WorldDifficulty;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // minutes
  puzzles: Puzzle[];
  rewards: Reward[];
  unlockCondition?: UnlockCondition;
}

export interface Puzzle {
  id: string;
  type: 'code' | 'design' | 'logic' | 'math' | 'creative';
  question: string;
  solution: string;
  hints: string[];
  timeLimit?: number; // seconds
  xpReward: number;
}

export interface RaidBoss {
  id: string;
  name: string;
  description: string;
  difficulty: WorldDifficulty;
  minPlayers: number;
  maxPlayers: number;
  phases: BossPhase[];
  rewards: Reward[];
  health: number;
  currentHealth?: number;
}

export interface BossPhase {
  phaseNumber: number;
  healthThreshold: number; // 0-100
  mechanics: string[];
  puzzles: Puzzle[];
}

export interface Reward {
  type: 'xp' | 'coins' | 'crystals' | 'item' | 'skill' | 'title';
  amount?: number;
  itemId?: string;
  skillId?: string;
  title?: string;
}

export interface HiddenZone {
  id: string;
  worldId: string;
  name: string;
  description: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  unlockCondition: UnlockCondition;
  rewards: Reward[];
  knowledge: string; // Hidden knowledge content
}
