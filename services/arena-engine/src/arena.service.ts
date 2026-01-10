/**
 * Arena Engine Service
 * Handles PvP matches, tournaments, and rankings
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@eduverse/db';
import { MatchType, MatchStatus, TournamentType, TournamentStatus } from '@prisma/client';

@Injectable()
export class ArenaService {
  private readonly logger = new Logger(ArenaService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a ranked match
   */
  async createRankedMatch(playerIds: string[]) {
    if (playerIds.length < 2) {
      throw new Error('At least 2 players required');
    }

    const match = await this.prisma.match.create({
      data: {
        type: MatchType.RANKED,
        status: MatchStatus.PENDING,
        players: playerIds,
        scores: {},
      },
    });

    // Emit match created event
    this.eventEmitter.emit('match.created', {
      matchId: match.id,
      players: playerIds,
      type: 'ranked',
    });

    return match;
  }

  /**
   * Start a match
   */
  async startMatch(matchId: string) {
    const match = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    this.eventEmitter.emit('match.started', {
      matchId,
      players: match.players,
      matchType: match.type,
    });

    return match;
  }

  /**
   * Complete a match
   */
  async completeMatch(
    matchId: string,
    scores: Record<string, number>,
    winnerId: string,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Validate scores BEFORE database update to prevent data corruption
    if (!scores || Object.keys(scores).length === 0) {
      throw new Error('Scores cannot be empty');
    }

    // Validate winnerId is in scores BEFORE database update
    if (!winnerId || !(winnerId in scores)) {
      throw new Error('Winner ID must be present in scores');
    }

    const duration = Math.floor(
      (new Date().getTime() - match.startedAt.getTime()) / 1000,
    );

    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.COMPLETED,
        scores,
        winnerId,
        duration,
        completedAt: new Date(),
      },
    });

    // Calculate XP rewards
    const xpRewards = this.calculateMatchRewards(scores, match.type, winnerId);

    // Update player stats and award XP
    for (const [playerId, score] of Object.entries(scores)) {
      const isWinner = playerId === winnerId;
      const xp = xpRewards[playerId] || 0;

      // Update player XP
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
      });

      if (player) {
        await this.prisma.player.update({
          where: { id: playerId },
          data: {
            xp: player.xp + BigInt(xp),
          },
        });
      }

      // Update player stats
      await this.updatePlayerMatchStats(playerId, isWinner, score);
    }

    // Emit completion event
    this.eventEmitter.emit('match.completed', {
      matchId,
      winnerId,
      players: match.players.map((playerId) => ({
        playerId,
        score: scores[playerId] || 0,
        xpGained: xpRewards[playerId] || 0,
      })),
      duration,
    });

    return updatedMatch;
  }

  /**
   * Create a tournament
   */
  async createTournament(
    name: string,
    type: TournamentType,
    maxParticipants: number,
    entryFee?: bigint,
    startDate: Date = new Date(),
  ) {
    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        type,
        status: TournamentStatus.REGISTRATION,
        maxParticipants,
        entryFee,
        prizePool: entryFee ? entryFee * BigInt(maxParticipants) : BigInt(0),
        startDate,
        participants: [],
      },
    });

    this.eventEmitter.emit('tournament.created', {
      tournamentId: tournament.id,
      name,
      type,
      maxParticipants,
      entryFee: entryFee ? Number(entryFee) : undefined,
      prizePool: Number(tournament.prizePool),
    });

    return tournament;
  }

  /**
   * Register player for tournament
   */
  async registerForTournament(tournamentId: string, playerId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.REGISTRATION) {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    if (tournament.participants.includes(playerId)) {
      throw new Error('Already registered');
    }

    // Deduct entry fee if applicable
    if (tournament.entryFee) {
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
      });

      if (!player || player.coins < tournament.entryFee) {
        throw new Error('Insufficient coins for entry fee');
      }

      await this.prisma.player.update({
        where: { id: playerId },
        data: {
          coins: player.coins - tournament.entryFee,
        },
      });
    }

    // Add player to tournament
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        participants: {
          push: playerId,
        },
        currentParticipants: {
          increment: 1,
        },
      },
    });

    return { success: true };
  }

  /**
   * Calculate match rewards
   */
  private calculateMatchRewards(
    scores: Record<string, number>,
    matchType: MatchType,
    winnerId: string,
  ): Record<string, number> {
    const rewards: Record<string, number> = {};
    const baseXP = matchType === MatchType.RANKED ? 100 : 50;

    // Validate inputs
    if (!scores || Object.keys(scores).length === 0) {
      throw new Error('Scores cannot be empty');
    }

    if (!winnerId || !(winnerId in scores)) {
      throw new Error('Winner ID must be present in scores');
    }

    for (const [playerId, score] of Object.entries(scores)) {
      const isWinner = playerId === winnerId;
      const scoreMultiplier = Math.max(score / 100, 0.1); // Normalize score, minimum 0.1
      rewards[playerId] = Math.floor(
        baseXP * scoreMultiplier * (isWinner ? 1.5 : 1.0),
      );
    }

    return rewards;
  }

  /**
   * Update player match statistics
   */
  private async updatePlayerMatchStats(
    playerId: string,
    isWinner: boolean,
    score: number,
  ) {
    const stats = await this.prisma.playerStats.findUnique({
      where: { playerId },
    });

    if (!stats) {
      await this.prisma.playerStats.create({
        data: {
          playerId,
          totalQuestsCompleted: 0,
          totalSkillsMastered: 0,
          totalMatches: 1,
          winRate: isWinner ? 1.0 : 0.0,
          averageScore: score,
          playTime: 0,
        },
      });
      return;
    }

    // Calculate new win rate using totalMatches
    const totalMatches = stats.totalMatches || 0;
    const currentWins = Math.floor(stats.winRate * totalMatches);
    const newWins = isWinner ? currentWins + 1 : currentWins;
    const newTotalMatches = totalMatches + 1;
    const newWinRate = newWins / newTotalMatches;

    // Calculate new average score
    const currentTotalScore = stats.averageScore * totalMatches;
    const newAverageScore = (currentTotalScore + score) / newTotalMatches;

    await this.prisma.playerStats.update({
      where: { playerId },
      data: {
        totalMatches: newTotalMatches,
        winRate: newWinRate,
        averageScore: newAverageScore,
      },
    });
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'power' | 'wins' | 'score', limit = 100) {
    if (type === 'power') {
      return this.prisma.player.findMany({
        orderBy: { powerScore: 'desc' },
        take: limit,
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
          powerScore: true,
          rank: true,
        },
      });
    }

    // For wins and score, we need to aggregate from stats
    const players = await this.prisma.player.findMany({
      include: { stats: true },
      take: limit * 2, // Get more to filter
    });

    const sorted = players
      .filter((p) => p.stats)
      .sort((a, b) => {
        if (type === 'wins') {
          return (b.stats!.winRate || 0) - (a.stats!.winRate || 0);
        }
        return (b.stats!.averageScore || 0) - (a.stats!.averageScore || 0);
      })
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        level: p.level,
        powerScore: p.powerScore,
        rank: p.rank,
        stat: type === 'wins' ? p.stats!.winRate : p.stats!.averageScore,
      }));

    return sorted;
  }
}
