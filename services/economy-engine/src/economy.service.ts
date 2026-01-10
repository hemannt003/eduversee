/**
 * Economy Engine Service
 * Handles currency, transactions, marketplace, and anti-farming
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@eduverse/db';
import { TransactionType, Currency, ListingStatus } from '@prisma/client';

@Injectable()
export class EconomyService {
  private readonly logger = new Logger(EconomyService.name);
  private readonly ANTI_FARM_THRESHOLD = 1000; // Max coins per hour
  private readonly ANTI_FARM_WINDOW = 3600; // 1 hour in seconds

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Add currency to player
   */
  async addCurrency(
    playerId: string,
    amount: number,
    currency: Currency,
    type: TransactionType,
    metadata?: Record<string, any>,
  ) {
    // Anti-farming check
    if (currency === Currency.COINS && type === TransactionType.REWARD) {
      await this.checkAntiFarming(playerId, amount);
    }

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    // Update player currency
    const updateData =
      currency === Currency.COINS
        ? { coins: player.coins + BigInt(amount) }
        : { crystals: player.crystals + amount };

    await this.prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    // Record transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        playerId,
        type,
        currency,
        amount: BigInt(amount),
        metadata,
      },
    });

    // Emit event
    this.eventEmitter.emit('transaction.completed', {
      transactionId: transaction.id,
      playerId,
      type,
      currency,
      amount,
    });

    return transaction;
  }

  /**
   * Deduct currency from player
   */
  async deductCurrency(
    playerId: string,
    amount: number,
    currency: Currency,
    type: TransactionType,
    metadata?: Record<string, any>,
  ) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    const currentBalance =
      currency === Currency.COINS
        ? Number(player.coins)
        : player.crystals;

    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Update player currency
    const updateData =
      currency === Currency.COINS
        ? { coins: player.coins - BigInt(amount) }
        : { crystals: player.crystals - amount };

    await this.prisma.player.update({
      where: { id: playerId },
      data: updateData,
    });

    // Record transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        playerId,
        type,
        currency,
        amount: BigInt(-amount),
        metadata,
      },
    });

    return transaction;
  }

  /**
   * Create marketplace listing
   */
  async createListing(
    sellerId: string,
    itemId: string,
    itemName: string,
    quantity: number,
    price: number,
    currency: Currency,
  ) {
    // Verify seller has the item
    const inventory = await this.prisma.inventoryItem.findFirst({
      where: {
        playerId: sellerId,
        itemId,
        quantity: { gte: quantity },
      },
    });

    if (!inventory) {
      throw new Error('Item not in inventory or insufficient quantity');
    }

    // Create listing
    const listing = await this.prisma.marketplaceListing.create({
      data: {
        sellerId,
        itemId,
        itemName,
        quantity,
        price: BigInt(price),
        currency,
        status: ListingStatus.ACTIVE,
      },
    });

    return listing;
  }

  /**
   * Purchase item from marketplace
   */
  async purchaseListing(listingId: string, buyerId: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new Error('Listing not available');
    }

    if (listing.sellerId === buyerId) {
      throw new Error('Cannot purchase your own listing');
    }

    // Deduct currency from buyer
    await this.deductCurrency(
      buyerId,
      Number(listing.price),
      listing.currency,
      TransactionType.PURCHASE,
      { listingId, itemId: listing.itemId },
    );

    // Add currency to seller
    await this.addCurrency(
      listing.sellerId,
      Number(listing.price),
      listing.currency,
      TransactionType.SALE,
      { listingId, itemId: listing.itemId },
    );

    // Transfer item
    await this.transferItem(listing.sellerId, buyerId, listing.itemId, listing.quantity);

    // Update listing
    await this.prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.SOLD,
        soldAt: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit('item.purchased', {
      transactionId: listingId,
      buyerId,
      sellerId: listing.sellerId,
      itemId: listing.itemId,
      itemName: listing.itemName,
      price: Number(listing.price),
      currency: listing.currency,
    });

    return { success: true };
  }

  /**
   * Transfer item between players
   */
  private async transferItem(
    fromPlayerId: string,
    toPlayerId: string,
    itemId: string,
    quantity: number,
  ) {
    // Remove from seller
    const sellerItem = await this.prisma.inventoryItem.findFirst({
      where: {
        playerId: fromPlayerId,
        itemId,
      },
    });

    if (!sellerItem || sellerItem.quantity < quantity) {
      throw new Error('Insufficient item quantity');
    }

    if (sellerItem.quantity === quantity) {
      await this.prisma.inventoryItem.delete({
        where: { id: sellerItem.id },
      });
    } else {
      await this.prisma.inventoryItem.update({
        where: { id: sellerItem.id },
        data: {
          quantity: sellerItem.quantity - quantity,
        },
      });
    }

    // Add to buyer
    const buyerItem = await this.prisma.inventoryItem.findFirst({
      where: {
        playerId: toPlayerId,
        itemId,
      },
    });

    if (buyerItem) {
      await this.prisma.inventoryItem.update({
        where: { id: buyerItem.id },
        data: {
          quantity: buyerItem.quantity + quantity,
        },
      });
    } else {
      await this.prisma.inventoryItem.create({
        data: {
          playerId: toPlayerId,
          itemId,
          itemName: sellerItem.itemName,
          quantity,
          rarity: sellerItem.rarity,
        },
      });
    }
  }

  /**
   * Anti-farming check
   */
  private async checkAntiFarming(playerId: string, amount: number) {
    const oneHourAgo = new Date(Date.now() - this.ANTI_FARM_WINDOW * 1000);

    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        playerId,
        type: TransactionType.REWARD,
        currency: Currency.COINS,
        createdAt: { gte: oneHourAgo },
      },
    });

    const totalEarned = recentTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );

    if (totalEarned + amount > this.ANTI_FARM_THRESHOLD) {
      this.logger.warn(
        `Anti-farming triggered for player ${playerId}: ${totalEarned + amount} coins in last hour`,
      );
      throw new Error(
        'Currency earning limit exceeded. Please try again later.',
      );
    }
  }

  /**
   * Get player balance
   */
  async getBalance(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      select: {
        coins: true,
        crystals: true,
      },
    });

    if (!player) {
      throw new Error('Player not found');
    }

    return {
      coins: Number(player.coins),
      crystals: player.crystals,
    };
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(filters?: {
    itemId?: string;
    sellerId?: string;
    currency?: Currency;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const where: any = {
      status: ListingStatus.ACTIVE,
    };

    if (filters?.itemId) {
      where.itemId = filters.itemId;
    }
    if (filters?.sellerId) {
      where.sellerId = filters.sellerId;
    }
    if (filters?.currency) {
      where.currency = filters.currency;
    }
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = BigInt(filters.minPrice);
      }
      if (filters.maxPrice) {
        where.price.lte = BigInt(filters.maxPrice);
      }
    }

    return this.prisma.marketplaceListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
