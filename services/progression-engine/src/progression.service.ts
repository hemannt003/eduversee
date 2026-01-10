/**
 * Progression Engine Service
 * Handles multi-layer XP, levels, prestige, and ascension
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@eduverse/db';

export interface XPCalculation {
  baseXP: number;
  multipliers: {
    streak?: number;
    guild?: number;
    event?: number;
    boost?: number;
  };
  totalXP: number;
}

@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Calculate XP with all multipliers
   */
  calculateXP(baseXP: number, playerId: string): Promise<XPCalculation> {
    // Get player multipliers
    // Apply streak bonus
    // Apply guild bonus
    // Apply event bonus
    // Apply active boosts
    
    return Promise.resolve({
      baseXP,
      multipliers: {},
      totalXP: baseXP,
    });
  }

  /**
   * Add XP to player and check for level up
   */
  async addXP(
    playerId: string,
    xp: number,
    xpType: 'level' | 'skill' | 'guild' | 'seasonal' = 'level',
  ): Promise<{
    leveledUp: boolean;
    newLevel: number;
    totalXP: bigint;
  }> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Calculate XP with multipliers
    const xpCalculation = await this.calculateXP(xp, playerId);
    const xpToAdd = BigInt(Math.floor(xpCalculation.totalXP));

    // Update player XP
    const oldLevel = player.level;
    const newXP = player.xp + xpToAdd;
    const newLevel = this.calculateLevel(Number(newXP));

    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // Check for level up
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      // Emit level up event
      this.eventEmitter.emit('player.leveled_up', {
        playerId,
        oldLevel,
        newLevel,
        xpGained: Number(xpToAdd),
        totalXp: Number(newXP),
      });

      // Check for prestige eligibility
      if (newLevel >= 100 && player.prestigeLevel === 0) {
        await this.checkPrestigeEligibility(playerId);
      }
    }

    return {
      leveledUp,
      newLevel,
      totalXP: newXP,
    };
  }

  /**
   * Calculate level from XP
   * Formula: level = floor(sqrt(xp / 100)) + 1
   */
  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Calculate XP required for next level
   */
  calculateXPForLevel(level: number): number {
    return Math.pow(level, 2) * 100;
  }

  /**
   * Check if player is eligible for prestige
   */
  async checkPrestigeEligibility(playerId: string): Promise<void> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || player.level < 100) {
      return;
    }

    // Emit prestige eligibility event
    this.eventEmitter.emit('player.prestige_eligible', {
      playerId,
      currentLevel: player.level,
    });
  }

  /**
   * Prestige: Reset level for power boost
   */
  async prestige(playerId: string): Promise<{
    newPrestigeLevel: number;
    powerBoost: number;
  }> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || player.level < 100) {
      throw new Error('Player not eligible for prestige');
    }

    const newPrestigeLevel = player.prestigeLevel + 1;
    const powerBoost = newPrestigeLevel * 10; // 10% per prestige

    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        prestigeLevel: newPrestigeLevel,
        level: 1,
        xp: BigInt(0),
        powerScore: player.powerScore + powerBoost,
      },
    });

    this.eventEmitter.emit('player.prestiged', {
      playerId,
      prestigeLevel: newPrestigeLevel,
      powerBoost,
    });

    return {
      newPrestigeLevel,
      powerBoost,
    };
  }

  /**
   * Calculate power score
   */
  async calculatePowerScore(playerId: string): Promise<number> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        skills: true,
        achievements: true,
        stats: true,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    let powerScore = 0;

    // Base from level
    powerScore += player.level * 10;

    // From skills
    const skillPower = player.skills.reduce((sum, skill) => {
      return sum + skill.level * 5 + skill.mastery;
    }, 0);
    powerScore += skillPower;

    // From achievements
    powerScore += player.achievements.length * 20;

    // From prestige
    powerScore += player.prestigeLevel * 100;

    // From stats
    if (player.stats) {
      powerScore += Math.floor(player.stats.totalQuestsCompleted / 10);
      powerScore += Math.floor(player.stats.totalSkillsMastered * 15);
    }

    // Update player power score
    await this.prisma.player.update({
      where: { id: playerId },
      data: { powerScore },
    });

    return powerScore;
  }

  /**
   * Get progression summary
   */
  async getProgressionSummary(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        skills: true,
        stats: true,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const currentLevelXP = this.calculateXPForLevel(player.level - 1);
    const nextLevelXP = this.calculateXPForLevel(player.level);
    const progressXP = Number(player.xp) - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;

    return {
      level: player.level,
      xp: Number(player.xp),
      progressXP,
      neededXP,
      progressPercent: Math.round((progressXP / neededXP) * 100),
      prestigeLevel: player.prestigeLevel,
      ascensionRank: player.ascensionRank,
      powerScore: player.powerScore,
      skillsCount: player.skills.length,
      skillsMastered: player.skills.filter((s) => s.mastery >= 100).length,
    };
  }
}
