# AI News Companion - Global Product Foundation

Production-ready monorepo baseline for a global AI News Companion product with podcast-like continuous AI narration, conversational interactions, personalization, subscriptions, and ads.

## Architecture

- `apps/web`: Next.js 14 + Tailwind + Zustand + WebSocket client + PWA scaffolding.
- `apps/api`: Node.js + TypeScript API with modular clean architecture, REST + WebSocket streaming, Redis cache hooks, event bus, and recommendation flow stubs.
- `packages/shared`: Shared types/contracts for personalization, feed, billing, ads, and streaming events.
- `infra/docker`: Docker Compose stack for PostgreSQL, Redis, API, and Web.
- `.github/workflows`: CI for lint, test, and build.

## Product Modules Included

- Auth-ready user context middleware and preference service.
- Global personalization (voice, category, region, brief/detailed).
- Continuous AI podcast stream orchestration and interruption events.
- Trending insertion and dedupe hooks.
- Resume memory and recommendation API contracts.
- Subscription + ads policy abstraction (free vs premium).
- Reels/short news feed endpoint.

## Quick Start

```bash
npm install
npm run build
npm run test
npm run dev
```

Run full stack with Docker:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## Why this baseline is startup-ready

- Modular, microservice-ready boundaries (controllers/services/repositories/events/ws).
- Shared contracts for future multi-client and microservice expansion.
- Infrastructure cost optimization hooks (cache-first + queue-ready event pipeline).
- CI/CD scaffolding and environment-based configuration.
- Mobile-first premium UI with dark/light support and podcast/reels UX entry points.
