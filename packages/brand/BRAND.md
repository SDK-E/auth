# Auth — Brand Guideline

Canonical brand guideline for **Auth**, the multi-tenant authentication
platform by SDK Enterprises. Auth is a sub-brand of **SDK.** and inherits the
parent system defined in `sdk-e/app/docs/design/brand.md` (logo spec) and
`sdk-e/app/docs/design/design-system.md` (design system), plus
`docs/content/voice-and-standards.md` for writing.

**Every agent working on this repository MUST follow this document.** Where
this document extends the parent system, it says so explicitly; everything
else carries over verbatim.

---

## 1. Brand architecture

```
SDK Enterprises          "SDK."   — org brand, uppercase grotesque wordmark
└── Auth                 "auth."  — product sub-brand, lowercase geometric wordmark
    └── (future products inherit the same period device)
```

- The org is named **SDK Enterprises** in legal/prose contexts.
- The product is named **Auth**: capitalized in prose ("Auth handles OIDC"),
  lowercase only as the drawn wordmark (`auth.`) and in code/package contexts
  (`@sdk-e/platform`, `auth.sdk.enterprises`).
- Never write "SDK-E" in customer-facing copy. `SDK-E` is an internal GitHub
  slug, not a brand name.
- The family device is the **circular green period** (`#2cdb16`). Every mark
  in the family ends with exactly one green period: `SDK.` → `auth.` → `a.`

## 2. Logo

The official Auth logo is the wordmark:

**auth.**

Four lowercase geometric letterforms followed by one circular green period.
It feels technical, minimal, precise, and terminal-inspired — a direct sibling
of the parent mark, at product scale.

### 2.1 Construction

Drawn from pure geometry (no font). The grid:

| Parameter        | Value | Notes                                    |
| ---------------- | ----- | ---------------------------------------- |
| Stroke weight    | 9 u   | uniform, low contrast, butt terminals     |
| x-height         | 42 u  | tops of a / u / arch of h                 |
| Ascender         | 60 u  | h stem                                    |
| t stem height    | 52 u  | flat top                                  |
| Period diameter  | 18 u  | sits on the baseline                      |

Letterforms:

- **a** — single-story geometric: circle ring + tangent right stem
- **u** — two stems + lower semicircular bowl (rounds overshoot by ~1 u,
  standard optical compensation)
- **t** — straight stem + crossbar just below x-height (terminal-style t)
- **h** — full ascender stem + semicircular shoulder springing to x-height
- **period** — perfect circle, baseline-seated, clearly separated from h

Canonical assets (`packages/brand/svg/`):

| Asset                    | Use                                      |
| ------------------------ | ---------------------------------------- |
| `auth-wordmark-dark.svg` | sage letters on dark surfaces            |
| `auth-wordmark-light.svg`| ink letters on light surfaces            |
| `auth-mark-dark.svg`     | compact `a.` with dark canvas            |
| `auth-mark-light.svg`    | compact `a.` with light canvas           |
| `watermark-on-dark.svg`  | watermark for screenshots/demos on dark  |
| `watermark-on-light.svg` | watermark for screenshots/demos on light |
| `pattern-on-dark.svg`    | seamless tile for dark backgrounds       |
| `pattern-on-light.svg`   | seamless tile for light backgrounds      |

Assets are transparent-background vectors except the compact marks, which
carry their approved canvas color. Do not re-export from other formats or
re-draw the letterforms.

### 2.2 Approved color pairings

Identical discipline to the parent logo — exactly two combinations:

| Surface    | Letters    | Period     |
| ---------- | ---------- | ---------- |
| `#082003`  | `#d7e8d3`  | `#2cdb16`  |
| `#d7e8d3`  | `#082003`  | `#2cdb16`  |

The period stays `#2cdb16` in both. On paper (`#f8fbf7`) use the light variant;
the ink/sage pairing is what keeps it legible.

### 2.3 Clear space and minimum size

- Define **X = the diameter of the green period** (18 u).
- Maintain ≥ **1X** clear space around the complete wordmark; prefer
  1.5X–2X in hero/brand placements.
- Recommended minimum wordmark width: **100 px**. Absolute floor: **72 px**.
- Below that, use the compact mark **a.** — never squeeze the wordmark into
  icon sizes.
- Scaling is proportional only. The composition is locked.

### 2.4 Incorrect usage

Everything forbidden for the parent logo applies here, plus:

- Never remove, recolor, resize, or move the green period independently
- Never add a second dot anywhere in any mark (`a..`, `auth..`)
- Never recreate the wordmark by typing "auth." in JetBrains Mono or any font
- Never place the wordmark inside badges, boxes, gradients, shadows, outlines
- Never rotate, skew, stretch, or re-space the letterforms
- Never mix variants (ink letters on dark surface, etc.)

## 3. Watermark

For screenshots, demo environments, documentation graphics, and tenant-facing
login-page backgrounds where a full logo would compete with content:

| Surface        | Letters              | Period               |
| -------------- | -------------------- | -------------------- |
| Light surfaces | ink @ **10%** opacity| `#2cdb16` @ **35%**  |
| Dark surfaces  | sage @ **12%** opacity| `#2cdb16` @ **45%** |

Rules:

- Watermark uses the compact mark `a.` only, never the full wordmark
- One watermark per view, anchored to a corner or centered behind content
- Never use the watermark where the real logo appears
- Never exceed the specified opacities; if it reads as a logo, it is too loud

## 4. Pattern

Seamless 240×240 tiles derived from the `a` geometry (one large ring +
corner dots that complete when tiled). Approved opacities are baked into the
assets (rings ≤ 7%, dots ≤ 40%).

Use for: universal-login side panels, empty states, hero bands, OG imagery.

Rules:

- Pattern is atmosphere, never structure — never place text directly over the
  dot row; keep content on solid areas
- One patterned region per screen
- Never recolor the dots; never scale the tile non-uniformly

## 5. Color

Inherited from the parent design system without modification:

| Token  | Hex        | Usage                                                     |
| ------ | ---------- | --------------------------------------------------------- |
| dark   | `#082003`  | primary text on light; dark section surfaces               |
| brand  | `#2cdb16`  | actions and meaningful highlights only                     |
| light  | `#d7e8d3`  | page background; primary text on dark                      |
| paper  | `#f8fbf7`  | card/panel surface on light pages                          |
| muted  | `#536b4f`  | secondary text on light (AA ≥ 4.5:1)                       |
| fog    | `#abc4a6`  | secondary text on dark                                     |
| line   | `#9db497`  | 1px borders/separators on light                            |
| —      | `#2d4b28`  | 1px borders on dark                                        |

Auth extensions (documented here because an auth product needs full semantic
status states; contrast verified AA against both page surfaces):

| Token       | Hex       | Usage                                            |
| ----------- | --------- | ------------------------------------------------ |
| success     | `#166534` | positive status text/icons on light              |
| warning     | `#92400e` | cautionary status text/icons on light            |
| destructive | `#9a3412` | error text on light; solid fills carry paper text|
| card-dark   | `#0c2b07` | elevated surface on dark sections                |

Dark surfaces use lightened tints of the same hues so status text stays AA:
success `#62c37c`, warning `#ecb256`, destructive `#e89263`. These live in
`globals.css` under `.dark` and are never used on light surfaces.

Color rules (carried over, non-negotiable):

- Green is for **actions and meaningful highlights only**. Never decorative.
- Green background always carries `dark` text (`bg-brand text-dark`).
- Green as text is legible **only on dark surfaces**. Never green text on
  light surfaces (this resolves the nav-highlight ambiguity noted in parent
  docs: active nav on light uses dark text plus a brand underline/marker).
- Borders are always 1px. No heavy shadows, no glassmorphism, no gradients.
- Surfaces come in three tones: light (`light` bg), dark (`dark` bg),
  brand (`brand` bg, dark text). At most one brand-tone band per screen.

## 6. Typography

Typeface: **JetBrains Mono**, weights 400–800, for everything — headings,
body, labels, code. Loaded via `next/font/google` as `--font-jetbrains`;
both `--font-sans` and `--font-mono` resolve to it. There is no secondary
sans-serif.

Ramp (tokenized as Tailwind v4 theme keys `--text-*`; use tokens, never ad-hoc
sizes):

| Token     | Size | Line-height | Tracking  | Use                                  |
| --------- | ---- | ----------- | --------- | ------------------------------------ |
| display   | 76px | 0.95        | −0.065em  | landing hero headline                |
| title     | 52px | 1           | −0.05em   | section headings                     |
| h1        | 42px | 1.04        | −0.045em  | dashboard page headings              |
| h3        | 23px | 1.12        | normal    | card/block titles                    |
| lead      | 18px | 1.7         | normal    | hero lead paragraph                  |
| body      | 14px | 1.7         | normal    | base body copy                       |
| label     | 11px | 1           | +0.14em   | eyebrows, nav, buttons, table heads  |
| micro     | 10px | 1           | +0.11em   | meta, captions, tags                 |

Rules:

- Body copy is never below 14px. Small sizes are for labels/meta/tags only.
- Headlines take tight tracking; body copy never does.
- Uppercase + letter-spacing reserved for eyebrows, nav, buttons, field labels.
- Body measure capped at ~65ch.
- Headings communicate an idea, not a label (see §9).

## 7. Layout, radius, motion

- Container: max-width **1220px**, 24px gutters.
- Section padding: **84px** desktop / 56 tablet / 48 mobile; sections stack
  with a 1px top border unless a tone change already divides them.
- Radii: card **10px** (Tailwind `rounded-lg` via `--radius`),
  controls/buttons/inputs **8px** (`rounded-md`), pills `rounded-full`.
  Never invent larger radii.
- Motion: restrained. 150ms transitions on color/background/opacity only.
  No entrance animations, parallax, marquees, floating elements. Respect
  `prefers-reduced-motion`: disable all movement.
- Whitespace is the primary separator; prefer more space over more rules.

## 8. Application notes

- **Favicon / app icons**: compact mark on `#082003`. Implemented at
  `apps/platform/src/app/icon.svg` + `apple-icon.tsx`.
- **Open Graph**: branded card built from the same geometry at
  `apps/platform/src/app/opengraph-image.tsx`.
- **Universal login pages** (`/u/**`): light or dark tone per tenant branding;
  watermark/pattern allowed per §3–§4; the Auth wordmark appears once, in an
  approved pairing.
- **Emails** (`@sdk-e/emails`): header uses the compact mark; defer full email
  theming to a later milestone.
- Tokens live in `packages/brand/tokens/brand.json` (machine-readable source)
  and are wired into `apps/platform/src/app/globals.css`. Change both together.

## 9. Voice & messaging

The parent voice applies unchanged (human, direct, concise, specific,
technically credible). Banned-phrase list and paste-test from
`docs/content/voice-and-standards.md` are enforced on all Auth copy.

Product-specific standards:

- Spell standards correctly and precisely: OAuth 2.1, OIDC, PKCE, JWT,
  WebAuthn, SAML. Standards names are evidence, not headlines.
- Sentence case everywhere: "Universal login", "Management API", "Session
  management". Product features are not proper nouns.
- Security claims state mechanisms, never absolutes: say "sessions are signed
  and revocable", never "bank-level security".
- Error messages name the problem and the next step:
  - Bad: "Authentication failed"
  - Good: "That code has expired. Request a new one to continue."
- Boilerplate (approved):
  - One-liner: "Multi-tenant authentication infrastructure by SDK
    Enterprises."
  - Paragraph: "Auth gives your product OIDC and OAuth 2.1 out of the box —
    hosted login pages, session management, and a management API — so your
    team ships features instead of identity plumbing."
- Heading examples (idea-driven, sentence case):
  - "One login flow for every tenant you host."
  - "Rotate secrets without a deploy."
  - "Standards in, sessions out."

## 10. Governance

- This file is the canonical Auth brand reference. Asset changes require
  updating: SVG assets, `tokens/brand.json`, `globals.css`, and this document
  in the same change.
- Concept explorations live in `svg/concepts/` and are **not** approved marks;
  do not ship them in product UI.
- Open `preview.html` in a browser for the visual reference sheet of every
  asset, palette value, type step, and misuse example.
