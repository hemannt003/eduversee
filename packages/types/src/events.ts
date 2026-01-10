/**
 * Event Schemas for Kafka
 * All events follow a consistent structure
 */

export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  source: string;
  playerId?: string;
  metadata?: Record<string, any>;
}

// Player Events
export interface PlayerCreatedEvent extends BaseEvent {
  eventType: 'player.created';
  data: {
    playerId: string;
    username: string;
    email: string;
    class: string;
  };
}

export interface PlayerLeveledUpEvent extends BaseEvent {
  eventType: 'player.leveled_up';
  data: {
    playerId: string;
    oldLevel: number;
    newLevel: number;
    xpGained: number;
    totalXp: number;
  };
}

export interface PlayerSkillUnlockedEvent extends BaseEvent {
  eventType: 'player.skill_unlocked';
  data: {
    playerId: string;
    skillId: string;
    skillName: string;
    skillLevel: number;
  };
}

// Quest Events
export interface QuestStartedEvent extends BaseEvent {
  eventType: 'quest.started';
  data: {
    questId: string;
    playerId: string;
    questType: string;
    worldId?: string;
  };
}

export interface QuestCompletedEvent extends BaseEvent {
  eventType: 'quest.completed';
  data: {
    questId: string;
    playerId: string;
    xpGained: number;
    rewards: any[];
    completionTime: number; // seconds
  };
}

export interface QuestFailedEvent extends BaseEvent {
  eventType: 'quest.failed';
  data: {
    questId: string;
    playerId: string;
    reason: string;
  };
}

// Economy Events
export interface TransactionCompletedEvent extends BaseEvent {
  eventType: 'transaction.completed';
  data: {
    transactionId: string;
    playerId: string;
    type: 'purchase' | 'sale' | 'reward' | 'craft';
    currency: 'coins' | 'crystals';
    amount: number;
    itemId?: string;
  };
}

export interface ItemPurchasedEvent extends BaseEvent {
  eventType: 'item.purchased';
  data: {
    transactionId: string;
    playerId: string;
    itemId: string;
    itemName: string;
    price: number;
    currency: 'coins' | 'crystals';
  };
}

// Social Events
export interface GuildJoinedEvent extends BaseEvent {
  eventType: 'guild.joined';
  data: {
    playerId: string;
    guildId: string;
    guildName: string;
  };
}

export interface FriendAddedEvent extends BaseEvent {
  eventType: 'friend.added';
  data: {
    playerId: string;
    friendId: string;
    friendUsername: string;
  };
}

export interface RivalryCreatedEvent extends BaseEvent {
  eventType: 'rivalry.created';
  data: {
    playerId: string;
    rivalId: string;
    rivalUsername: string;
  };
}

// Arena Events
export interface MatchStartedEvent extends BaseEvent {
  eventType: 'match.started';
  data: {
    matchId: string;
    players: string[];
    matchType: 'ranked' | 'casual' | 'tournament';
    arenaId: string;
  };
}

export interface MatchCompletedEvent extends BaseEvent {
  eventType: 'match.completed';
  data: {
    matchId: string;
    winnerId: string;
    players: Array<{
      playerId: string;
      score: number;
      xpGained: number;
    }>;
    duration: number; // seconds
  };
}

export interface TournamentCreatedEvent extends BaseEvent {
  eventType: 'tournament.created';
  data: {
    tournamentId: string;
    name: string;
    type: 'solo' | 'team';
    maxParticipants: number;
    entryFee?: number;
    prizePool: number;
  };
}

// World Events
export interface WorldUnlockedEvent extends BaseEvent {
  eventType: 'world.unlocked';
  data: {
    playerId: string;
    worldId: string;
    worldName: string;
  };
}

export interface DungeonEnteredEvent extends BaseEvent {
  eventType: 'dungeon.entered';
  data: {
    dungeonId: string;
    playerIds: string[];
    worldId: string;
  };
}

export interface RaidStartedEvent extends BaseEvent {
  eventType: 'raid.started';
  data: {
    raidId: string;
    raidBossId: string;
    playerIds: string[];
    worldId: string;
  };
}

export interface RaidCompletedEvent extends BaseEvent {
  eventType: 'raid.completed';
  data: {
    raidId: string;
    raidBossId: string;
    playerIds: string[];
    completionTime: number; // seconds
    rewards: any[];
  };
}

// Type union for all events
export type Event =
  | PlayerCreatedEvent
  | PlayerLeveledUpEvent
  | PlayerSkillUnlockedEvent
  | QuestStartedEvent
  | QuestCompletedEvent
  | QuestFailedEvent
  | TransactionCompletedEvent
  | ItemPurchasedEvent
  | GuildJoinedEvent
  | FriendAddedEvent
  | RivalryCreatedEvent
  | MatchStartedEvent
  | MatchCompletedEvent
  | TournamentCreatedEvent
  | WorldUnlockedEvent
  | DungeonEnteredEvent
  | RaidStartedEvent
  | RaidCompletedEvent;
