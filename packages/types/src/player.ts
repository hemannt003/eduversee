/**
 * Player Metaverse Model
 * Core player entity representing a learner in EDUverse
 */

export enum PlayerClass {
  CODER = 'coder',
  DESIGNER = 'designer',
  ENGINEER = 'engineer',
  ANALYST = 'analyst',
}

export enum PlayerRank {
  NOVICE = 'novice',
  APPRENTICE = 'apprentice',
  JOURNEYMAN = 'journeyman',
  EXPERT = 'expert',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
  LEGEND = 'legend',
}

export interface Player {
  id: string;
  username: string;
  email: string;
  avatar: string;
  class: PlayerClass;
  
  // Progression
  level: number;
  xp: number;
  powerScore: number;
  
  // Attributes
  energy: number;
  stamina: number;
  focus: number;
  
  // Status
  rank: PlayerRank;
  titles: string[];
  achievements: string[];
  badges: string[];
  
  // Skills
  skills: PlayerSkill[];
  
  // Inventory
  inventory: InventoryItem[];
  pets: Pet[];
  
  // Social
  guildId?: string;
  reputation: number;
  trustScore: number;
  
  // Economy
  coins: number;
  crystals: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  prestigeLevel: number;
  ascensionRank: number;
}

export interface PlayerSkill {
  skillId: string;
  skillName: string;
  xp: number;
  level: number;
  mastery: number; // 0-100
  unlockedAt: Date;
  lastPracticedAt: Date;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: ItemRarity;
  obtainedAt: Date;
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

export interface Pet {
  id: string;
  petId: string;
  name: string;
  level: number;
  xp: number;
  rarity: ItemRarity;
  obtainedAt: Date;
  equipped: boolean;
}

export interface PlayerStats {
  playerId: string;
  totalXp: number;
  totalQuestsCompleted: number;
  totalSkillsMastered: number;
  winRate: number;
  averageScore: number;
  playTime: number; // in minutes
  streak: number;
  longestStreak: number;
}
