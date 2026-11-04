<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Homepage design system

The homepage (`src/app/page.tsx` + the `.hp-*` block at the end of
`src/app/globals.css`) is a **technical blueprint**: paper, dashed guide rails,
hairline cells, monospace annotations, and line-art schematics that draw the
actual mechanism. It is deliberately not the rest of the site's style. Match it
when editing the homepage; don't spread it to other routes.

Reference the look was built against: `cloudflare.com/products/workers/`.

## Scoping rule: `.hp-btn` is global

`src/components/navbar.tsx` reuses `.hp-btn hp-btn-primary` for "Get started".
The base `.hp-btn` rules are therefore **site-wide** and must stay as they are
(10px radius, `0 16px`, 14px, `transform` transition). Homepage button styling
goes under `.hp .hp-btn`. Restyling `.hp-btn` unscoped silently changes the
header on every page.

## Tokens

Defined on `.hp`, redefined under `.dark .hp`.

| Token | Job |
|---|---|
| `--hp-paper` / `--hp-fill` | page and panel backgrounds |
| `--hp-line` | hairline cell borders |
| `--hp-rail` | dashed vertical guide rails |
| `--hp-dot` | background dot texture |
| `--hp-tick` | corner marks at cell intersections |
| `--hp-draw` | **strong** schematic ink (structural) |
| `--hp-draw-soft` | **soft** schematic ink (flows, off-stage boxes) |
| `--hp-purple` | accent, reserved for live state |
| `--hp-code` | code-window background (lifted in dark so it reads as an object) |
| `--hp-plate` | filled plate inside a schematic |

## Line hierarchy — the load-bearing rule

Everything dashed at one weight reads as noise. Four tiers, weakest to
strongest, and a new element must pick one rather than inventing a fifth:

1. **background dots** — texture only, 20px pitch
2. **`.s-flow` / `.s-edge`** — `--hp-draw-soft`, 4/4 dash: what moves, what is off-stage
3. **`.s-frame-dash`** — `--hp-draw`, 3/3 dash: a boundary
4. **`.s-frame`** — `--hp-draw`, solid: the object itself

Colour sits above all four.

## Structural vs semantic colour

Structural linework is **neutral ink** (black on paper, white on dark). Colour
means something:

| Purple | Red | Neutral |
|---|---|---|
| agent cells (`.s-fill`), soft fills (`.s-soft`), travelling pulses, executing state (`.s-chip-on`), allowed egress (`.s-acc`), the 47ms dimension, packed pools, manifest keys, accent text (`.t-acc`) | denied egress + ✕ (`.s-deny`) | frames, boundaries, connectors, dividers, filesystem ticks |

`.s-acc` used to style both the node outline *and* allowed-egress arrows.
That is why `.s-frame` exists — don't collapse them back together, or
recolouring structure destroys the allowed/denied distinction.

## Schematic stroke classes

All live on `.hp-schematic` and carry `vector-effect: non-scaling-stroke`, so
strokes render at their literal pixel width regardless of viewBox upscale.

`.s-frame` `.s-frame-dash` `.s-edge` `.s-flow` `.s-line` `.s-acc`
`.s-acc-dash` `.s-deny` `.s-plate` `.s-soft` `.s-fill` `.s-handle` `.s-tip`

Text classes: `.t-ink`, `.t-acc`, `.t-big`, `.t-deny`.

## The banner

`.hp-hero-art` is the full-bleed diagram band, flush under the 65px nav (no top
padding). `.hp-hero-svg` is set `width: 108%; min-width: 1180px` and centred
with `left: 50%; transform: translateX(-50%)` inside an `overflow: hidden`
parent, so the periphery boxes crop at the viewport edges at any width.

- Periphery **labels are anchored inward** (`textAnchor` start/end at fixed x),
  not centred, so the box bleeds off-edge while its label stays whole.
- Banner annotations are sized in viewBox units to land near 11–12px on screen;
  changing `width: 108%` changes the effective type size, so retune
  `.hp-hero-svg text { font-size }` with it.
- Hidden below 760px (`.hp-hero-art { display: none }`); the hero still has
  chip, h1, lead, CTAs and the install line.

### Restraint — the banner is deliberately minimal

Its budget is **3 agents, 2 periphery boxes, 4 curves, 3 text labels**, and a
band around **120px** tall. It sets the scene; it does not enumerate the
architecture. The detailed schematics further down the page carry the full
story (lifecycle, density, egress), so detail added here is duplicated there.

This has drifted upward twice and been cut back twice. An earlier version had
4 nested agents (each with plate, dot matrix and a filesystem tick), 4
periphery boxes, 5 curves and an annotation line — at 192px it read as busy
and oversized. Before adding an element, delete one.

## Hero motion

One 3.6s loop: a pulse travels each flow curve, agents brighten as they
execute, and one slot cycles as agents are scheduled and suspended.

**`pathLength={100}` + `non-scaling-stroke` are mutually exclusive.** The
travelling pulse relies on `pathLength={100}` to normalise every curve so
exactly one dash traverses each one; that maths is in user units.
`non-scaling-stroke` moves dash computation to device space and shatters the
pulse into dozens of repeating ticks. **`.s-pulse` is deliberately excluded
from the vector-effect rules — keep it that way.**

**The cycling slot dims its agent; it never removes it.** `hp-cycle` animates
`.s-agent` (the inner group), not the whole `.hp-chip`, so the sandbox frame
persists. Animating the outer group leaves a hole in the pool that reads as a
rendering bug.

Reduced motion is honoured: pulses are hidden and the diagram holds its
executing state.

## Cells, rails and ticks

- **Rails**: two 1px verticals at the frame edges,
  `linear-gradient(var(--hp-rail) 50%, transparent 50%)` at
  `background-size: 1px 32px`. Hidden below 680px.
- **Cells**: 1px solid `--hp-line`, **square corners**. No border-radius on
  content cells, no drop shadows except under the dark code windows.
- **Corner ticks**: `.hp-tick` puts a 5px mark at each cell's top-left; add
  `.hp-tick-4` or `.hp-tick-5` to close the right edge at that column count.
  A following section's top row supplies the marks along the bottom of the one
  above it, so no bottom-edge rule is needed mid-page.
- `.hp-field` is the dot texture. It must be `position: absolute` — a
  `.hp-hero > *` rule setting `position: relative` will collapse it, so those
  rules are written `> *:not(.hp-field)`. The hero field spans banner **and**
  headline and fades out above the CTAs.

## Content rules

- **Numbers in headings must match numbers drawn in the schematics.** The
  previous version had "250 agents on 8 pods" over a panel animating to 222,
  and "Sub-100ms resume" over a panel showing 52ms. `POD_PACKING` sums to
  exactly 250; the dimension line reads 47ms.
- Use real commands and real API shapes. The install line is the actual
  `helm install kagent oci://ghcr.io/kagent-dev/kagent/helm/kagent`.
- Mono chips are **lowercase** — they carry real values (`kind: Agent`,
  `kagent.dev/v1alpha2`), not decorative labels.

## Avoid these (they read as templated/AI-generated)

Decided deliberately for this page; don't reintroduce them:

- ALL-CAPS tracked-out eyebrow labels above headings → lowercase mono chips
- Warm cream backgrounds near `#F4F1EA` → neutral white paper
- `→` appended to link and button text → a purple hairline leader on lists,
  plain text on links
- Meta strings joined with middle dots (`A · B · C`) → a real, useful element
  (the copyable install line)
- Identical rounded cards with the same soft shadow → hairline cells
- `01 / 02 / 03` numbering unless the content genuinely is a sequence. "What
  happens after you apply" is one (apply → reconcile → run → observe), so it
  is numbered; the capability grid is not, so it isn't.

## Build

**Do not run `npm run build` while `next dev` is running.** The build
overwrites `.next/`, which the running dev server is serving from; every CSS
and JS chunk starts 404ing and the page renders as a bare unstyled document
(easily mistaken for a broken mobile layout). Recovery: stop the dev server,
`rm -rf .next`, restart.

For CSS and component work use `npx tsc --noEmit -p tsconfig.json`, which
touches nothing. `npm run build` also runs `check-links` and regenerates
`public/sitemap.xml`; use `npx next dev -p <port>` to start a server without
that side effect.
