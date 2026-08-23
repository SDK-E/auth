# AGENTS.md

Guidance for AI agents working in this repo.

## Stack
Next.js 16 (App Router, src dir) · React 19 · Tailwind CSS v4 · TypeScript strict · Drizzle ORM + Postgres (Neon) · Turborepo · pnpm 11 · Node >= 26

## Commands
- Install: `pnpm install`
- Dev (all): `pnpm dev`; platform only: `pnpm --filter @sdk-e/platform dev`
- Build/lint/typecheck: `pnpm build` / `pnpm lint` / `pnpm typecheck`
- DB migrations: edit `packages/db/src/schema/**` then `pnpm db:generate` (offline SQL gen), apply with `pnpm db:migrate`
- Mail sink (dev email capture, SMTP :1025 / HTTP :1080): `pnpm mail` to run, `pnpm mail:list|mail:read|mail:wait|mail:clear|mail:health` to inspect; MCP server via `pnpm mail:mcp`. Sends go through `@sdk-e/emails` `sendMail` using `MAIL_SMTP_URL`/`MAIL_FROM`.
- Port conflicts: `pnpm ports:list|ports:find|ports:check|ports:kill` (portkiller)
- Ported tooling origin: `github.com/SDK-E/app` scripts/mail + scripts/portkiller. Deferred from there until needed: i18n translation pipeline (scripts/i18n — adopt at milestone 11), background remover (scripts/images).

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

## Vercel products in use
- **Analytics**: `<Analytics />` mounted in root layout (`@vercel/analytics`).
- **Workflows**: Workflow SDK (`workflow`) via `withWorkflow(nextConfig)`; durable functions live in `apps/platform/src/workflows/**` with `"use workflow"` / `"use step"`. Fluid compute required on the project.
- **Sandbox**: `@vercel/sandbox` isolated behind `@sdk-e/actions-runtime`; consumed by milestone-7 Actions runtime, not by app code directly.
- **Resend**: intentionally deferred until production launch (decision 2026-08).
