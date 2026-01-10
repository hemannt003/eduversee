# EDUverse Microservices

This directory contains all microservices for the EDUverse platform.

## Service Structure

```
services/
├── api-gateway/          # API Gateway (Kong/Traefik config)
├── auth-service/         # Authentication & Authorization
├── player-service/       # Player management
├── progression-engine/   # XP, levels, prestige
├── quest-engine/         # Quest system
├── skill-engine/         # Skills & knowledge graph
├── arena-engine/         # PvP & tournaments
├── guild-engine/         # Guilds & social groups
├── economy-engine/       # Currency & marketplace
├── ai-mentor-engine/     # AI personalization
├── creator-engine/       # Content creation tools
├── realtime-engine/      # WebSocket & WebRTC
└── analytics-engine/     # Analytics & insights
```

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Kafka (via Docker)

### Quick Start

```bash
# Start all services
docker-compose up -d

# Start specific service
cd services/auth-service
npm run dev

# Run migrations
npm run migrate
```

## Service Communication

Services communicate via:
1. **REST APIs** (synchronous)
2. **Kafka Events** (asynchronous)
3. **gRPC** (internal, high-performance)

## Event Bus

All services publish/subscribe to Kafka topics:

- `player.events`
- `quest.events`
- `economy.events`
- `social.events`
- `arena.events`
- `world.events`

## Shared Libraries

Common code in `packages/`:
- `@eduverse/types` - TypeScript types
- `@eduverse/events` - Event schemas
- `@eduverse/utils` - Shared utilities
- `@eduverse/db` - Database client
