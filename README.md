# SDK-E Auth Platform

Multi-tenant authentication infrastructure — an Auth0-class product by SDK Enterprises.

- **Domain**: `auth.sdk.enterprises` (single domain serves the dashboard **and** the auth plane; tenants get `{slug}.auth.sdk.enterprises` plus custom domains)
- **Repo**: [github.com/SDK-E/auth](https://github.com/SDK-E/auth) · npm scope `@sdk-e/*`
- **Deploy**: Vercel team `SDK Enterprises` → project `auth` (root dir `apps/platform`, Neon connected), auto-deploys on push

## Architecture — one app, four planes (host + path routed)

| Plane | Where |
|---|---|
| Control (dashboard) | `auth.sdk.enterprises` → `/dashboard`, `/staff` |
| Data (Management API) | `/api/v2/*` |
| Auth (OIDC/OAuth 2.1) | `/authorize`, `/oauth/token`, `/.well-known/*` on tenant hosts |
| Experience (Universal Login) | `/u/login`, `/u/signup`, `/u/mfa` on tenant hosts |

Host resolution (`middleware.ts`): base domain → dashboard/platform context; `{slug}` subdomain or verified custom domain → tenant environment context via the `domains` table.

## Workspace map

```
apps/
  platform/        Next.js 16 monolith (all planes)
packages/
  shared/          Zod env validation, prefixed IDs, host parsing, constants
  db/              Drizzle schema v1 + client + migrations
  emails/          Transactional mail transport (dev sink now, Resend at launch)
  engine/          OIDC provider, tokens/sessions          (milestone 2+)
  connections/     Social/SAML/OIDC/LDAP/SCIM adapters     (milestone 6)
  actions-runtime/ Vercel Sandbox facade + warm pool            (runner: milestone 7)
  sdk-js|sdk-nextjs|sdk-react|sdk-node|sdk-python|sdk-go   (milestone 11)
scripts/
  mail/            Dev mail sink (SMTP :1025) + CLI + MCP server
  portkiller/      Listening-port inspector/killer for dev
```

## Commands

```bash
pnpm install            # bootstrap
pnpm dev                # all apps dev servers (turbo)
pnpm build              # production build
pnpm lint               # eslint across workspace
pnpm typecheck          # tsc --noEmit
pnpm db:generate        # drizzle-kit generate migrations from schema
pnpm db:migrate         # apply migrations to DATABASE_URL
```

Copy `.env.example` → `.env` and set `DATABASE_URL` (Neon connection string).

## Conventions

- IDs: prefixed nanoid (`tenant_`, `env_`, `usr_`, …) generated in app layer — see `@sdk-e/shared`.
- No code comments unless asked; document decisions here and in AGENTS.md.
- Schema changes: edit `packages/db/src/schema/*`, run `pnpm db:generate`, commit migration files.
- Secrets at rest are AES-256-GCM envelope-encrypted (KEK from KMS); never store plaintext secrets in config columns.
