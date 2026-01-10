/**
 * Quest Engine Service
 * Handles quest generation, tracking, and completion
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@eduverse/db';
import { QuestType, Difficulty } from '@prisma/client';

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate procedural quest
   */
  async generateProceduralQuest(
    playerId: string,
    type: QuestType,
    difficulty: Difficulty,
  ) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { skills: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Generate quest based on player skills and level
    const quest = await this.prisma.quest.create({
      data: {
        name: `Generated ${type} Quest`,
        description: 'A procedurally generated quest',
        type,
        difficulty,
        requiredLevel: player.level,
        xpReward: BigInt(this.calculateXPReward(difficulty, player.level)),
        coinReward: BigInt(this.calculateCoinReward(difficulty)),
        isRepeatable: type === QuestType.DAILY || type === QuestType.WEEKLY,
      },
    });

    return quest;
  }

  /**
   * Start a quest
   */
  async startQuest(questId: string, playerId: string) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new Error('Quest not found');
    }

    // Check requirements
    await this.validateQuestRequirements(questId, playerId);

    // Emit quest started event
    this.eventEmitter.emit('quest.started', {
      questId,
      playerId,
      questType: quest.type,
    });

    return quest;
  }

  /**
   * Complete a quest
   */
  async completeQuest(
    questId: string,
    playerId: string,
    completionTime?: number,
    score?: number,
  ) {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new Error('Quest not found');
    }

    // Record completion
    await this.prisma.questCompletion.create({
      data: {
        questId,
        playerId,
        completionTime,
        score,
      },
    });

    // Award rewards
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (player) {
      await this.prisma.player.update({
        where: { id: playerId },
        data: {
          xp: player.xp + quest.xpReward,
          coins: player.coins + quest.coinReward,
        },
      });
    }

    // Emit completion event
    this.eventEmitter.emit('quest.completed', {
      questId,
      playerId,
      xpGained: Number(quest.xpReward),
      rewards: {
        xp: Number(quest.xpReward),
        coins: Number(quest.coinReward),
      },
      completionTime,
    });

    return {
      quest,
      rewards: {
        xp: Number(quest.xpReward),
        coins: Number(quest.coinReward),
      },
    };
  }

  /**
   * Validate quest requirements
   */
  private async validateQuestRequirements(
    questId: string,
    playerId: string,
  ): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
    });

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { skills: true },
    });

    if (!quest || !player) {
      throw new Error('Quest or player not found');
    }

    // Check level requirement
    if (quest.requiredLevel && player.level < quest.requiredLevel) {
      throw new Error('Level requirement not met');
    }

    // Check skill requirements
    if (quest.requiredSkills && quest.requiredSkills.length > 0) {
      const playerSkillIds = player.skills.map((s) => s.skillId);
      const missingSkills = quest.requiredSkills.filter(
        (skillId) => !playerSkillIds.includes(skillId),
      );

      if (missingSkills.length > 0) {
        throw new Error(`Missing required skills: ${missingSkills.join(', ')}`);
      }
    }
  }

  /**
   * Calculate XP reward based on difficulty and level
   */
  private calculateXPReward(difficulty: Difficulty, level: number): number {
    const baseXP = level * 10;
    const multipliers = {
      [Difficulty.BEGINNER]: 1.0,
      [Difficulty.INTERMEDIATE]: 1.5,
      [Difficulty.ADVANCED]: 2.0,
      [Difficulty.EXPERT]: 3.0,
      [Difficulty.MASTER]: 5.0,
    };

    return Math.floor(baseXP * multipliers[difficulty]);
  }

  /**
   * Calculate coin reward based on difficulty
   */
  private calculateCoinReward(difficulty: Difficulty): number {
    const rewards = {
      [Difficulty.BEGINNER]: 10,
      [Difficulty.INTERMEDIATE]: 25,
      [Difficulty.ADVANCED]: 50,
      [Difficulty.EXPERT]: 100,
      [Difficulty.MASTER]: 250,
    };

    return rewards[difficulty];
  }

  /**
   * Get available quests for player
   */
  async getAvailableQuests(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: { skills: true },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const quests = await this.prisma.quest.findMany({
      where: {
        OR: [
          { requiredLevel: null },
          { requiredLevel: { lte: player.level } },
        ],
        isHidden: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Filter by skill requirements
    const playerSkillIds = player.skills.map((s) => s.skillId);
    const availableQuests = quests.filter((quest) => {
      if (!quest.requiredSkills || quest.requiredSkills.length === 0) {
        return true;
      }
      return quest.requiredSkills.every((skillId) =>
        playerSkillIds.includes(skillId),
      );
    });

    return availableQuests;
  }
}
