# AGENTS.md

Guidance for AI agents working in this repo.

## Stack
Next.js 16 (App Router, src dir) · React 19 · Tailwind CSS v4 · TypeScript strict · Drizzle ORM + Postgres (Neon) · Turborepo · pnpm 11 · Node >= 26

## Commands
- Install: `pnpm install`
- Dev (all): `pnpm dev`; platform only: `pnpm --filter @sdk-e/platform dev`
- Build/lint/typecheck: `pnpm build` / `pnpm lint` / `pnpm typecheck`
- DB migrations: edit `packages/db/src/schema/**` then `pnpm db:generate` (offline SQL gen), apply with `pnpm db:migrate`

## Layout rules
- Apps live in `apps/*`, libraries in `packages/*`. Package scope is `@sdk-e/*`.
- Shared runtime types/schemas go in `packages/shared`; DB schema only in `packages/db`.
- Platform routes:
  - Dashboard: `apps/platform/src/app/(dashboard)`
  - Universal login: `apps/platform/src/app/u/**` (tenant host required)
  - OIDC endpoints: `apps/platform/src/app/authorize`, `/oauth`, `/.well-known` (tenant host)
  - Management API: `apps/platform/src/app/api/v2/**`
  - Host→tenant resolution happens once in `proxy.ts` (Next 16 proxy convention) using `@sdk-e/shared` host utils; downstream code reads request headers (`x-sdk-e-*`), it must not re-parse hosts.

## Conventions
- No comments in code. Explain design in this file or README.
- Prefixed IDs everywhere (`tenant_xxx`) via `createId("prefix")` from `@sdk-e/shared`.
- Validate all external input with Zod schemas defined in `@sdk-e/shared` or route-local schema files.
- Never log secrets; tenant secrets are encrypted with envelope encryption before touching the DB.
- Commits: conventional commits (`feat:`, `fix:`, `chore:`…).

## Deployment
- Vercel team: `SDK Enterprises` (slug `sdk-enterprises`). Single Next.js project for `apps/platform`: **`auth`** (Neon integration connected; `DATABASE_URL` injected).
- Production domain `auth.sdk.enterprises`; preview URLs for branches.
- `DATABASE_URL`, `AUTH_BASE_DOMAIN`, etc. configured per environment in Vercel project settings.
