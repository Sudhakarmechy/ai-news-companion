# Architecture Decisions

## ADR-001: Monorepo with web + api + shared contracts
Chosen to accelerate early-stage iteration while preserving service boundaries for future microservice extraction.

## ADR-002: REST + WebSocket hybrid
REST handles deterministic reads/writes (preferences, feed, monetization policy). WebSockets power low-latency live audio/narration events and conversational interruption.

## ADR-003: Cost-optimized AI orchestration
Model-agnostic service boundaries allow switching providers and using lower-cost models for baseline narration while reserving premium models for deep analysis/premium tier.

## ADR-004: Global readiness defaults
Region and locale are first-class fields in user preferences and feed ranking, with timezone-aware playback state designed for future localization.

## ADR-005: Monetization from day 0
Free vs premium policies are embedded in API contracts (ads, limits, provider support for Stripe + Razorpay).
