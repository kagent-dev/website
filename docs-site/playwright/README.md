# kagent UI screenshots

Playwright automation that captures the screenshots of the **kagent product UI** that the 1.x
docs embed. Every capture serves two purposes at once:

1. **Docs assets** — regenerate the `docs-site/assets/img/*.png` files the guides display.
2. **Visual regression** — CI re-captures the UI and, if anything changed, opens a PR with the
   refreshed images, so a UI that has drifted away from a guide gets caught rather than
   silently outliving it.

Modeled on the `solo-io/docs` management-UI harness (attach) rather than the
`agentgateway/website` one (provision), because a kagent installation is a cluster, Agent
Substrate, the kagent chart and a model provider key — far heavier than one container.

---

## How it works

```
you bring the UI up (a port-forwarded cluster install, or a mock dev server)
    → UI_BASE_URL=… npm run update:<spec>
        → spec navigates, waits for rendered content, toHaveScreenshot('name.png')
            → run once per theme project: light, dark
                → npm run sync-docs copies baselines to assets/img/ per docs-image-map.json
```

There is deliberately **no `webServer`**. The harness attaches to whatever is serving
`UI_BASE_URL`; standing the UI up is a sibling prerequisite, not a step inside the capture.
That is also what makes the two capture sources below possible from one harness.

## The two capture sources

This is the design decision most worth understanding before adding a spec, because picking
the wrong one produces either a fake screenshot or a permanently red test.

| | **Live cluster** | **Mock dev server** |
| --- | --- | --- |
| Spec | `tests/launch-ui.spec.ts` | `tests/chat.spec.ts` |
| What serves the UI | `kubectl port-forward svc/kagent-ui` | `VITE_API_MODE=mock vite` from a kagent checkout |
| Shows | real resources from a real install | the UI's own fixtures |
| Use for | anything a reader reaches by following the install guide | anything a real backend makes nondeterministic |

**Default to the live cluster.** A reader who has just installed kagent should recognise the
screenshot, and only a real install gives that.

**Use the mock for captures a live backend cannot make reproducible.** The clear case is a
conversation: a real agent composes different text every run, which is most of the page
changing — far past the 1% diff tolerance, so it can never be a regression baseline. The
kagent UI ships an in-browser mock backend whose seeded conversation has a fixed transcript,
a checkpoint and a share (`ui/src/mocks/state.ts`), which is exactly the 1.0 chat surface the
docs need.

Two constraints on the mock path:

- **It needs a kagent source checkout**, not the released image. `VITE_API_MODE` is a
  build-time pin and the release image deliberately ships no mock service worker
  (`ui/src/api/config.ts`), so a built image cannot honour it however it is set.
- **A mock-backed spec must be unable to run against a cluster by accident.** `chat.spec.ts`
  gets this for free: it navigates to an instance id that exists only in the fixtures, so a
  live backend 404s and the test fails loudly instead of quietly capturing the wrong thing.
  Give any new mock-backed spec the same property.

## Prerequisites

- **Node 20+** for the harness itself.
- **Node ≥24.13.0** additionally for the mock path — that is the kagent UI's own engine floor
  (`ui/package.json`), and its build tooling fails on Node 18 with a `styleText` import error
  from `node:util` that does not name the cause.
- For live-cluster captures: `kind`, `helm`, `kubectl`, `kubectl-ate`, `jq`, `openssl`, and a
  model provider API key. The provisioner checks for all of these before it touches the cluster
  and names whichever is missing, so you find out up front rather than half way through an
  install.
- **`kubectl-ate` is not on most machines and must match the Agent Substrate version** the
  capture installs, because it writes that version's identity material. It is published per
  release rather than through a package manager:
  ```sh
  curl -sSL -o kubectl-ate \
    "https://github.com/kagent-dev/substrate/releases/download/v<SUBSTRATE_VERSION>/kubectl-ate-$(uname -s | tr '[:upper:]' '[:lower:]')-amd64"
  chmod +x kubectl-ate && mv kubectl-ate /usr/local/bin/   # or anywhere on PATH
  ```
  Read `<SUBSTRATE_VERSION>` from `assets/kagent-docs/versions/agent-substrate.md`, which is the
  same conref the provisioner reads.
- One-time setup:
  ```sh
  cd docs-site/playwright
  npm install
  npx playwright install --with-deps chromium
  ```

> **The easiest way to (re)generate the committed images is to let CI do it.** Font
> anti-aliasing differs between macOS and Linux and CI runs on Linux, so the canonical images
> come from the workflow. Capture locally to iterate and preview; let the workflow produce the
> set that gets merged.

---

## Task: capture against a live cluster

```sh
# 1. Stand up the cluster and install at the versions the docs pin.
export OPENAI_API_KEY=…
./provisioners/kagent-kind.sh --dry-run     # print every command, run nothing
./provisioners/kagent-kind.sh

# 2. Hold the port-forward yourself — the provisioner does not create one.
kubectl port-forward -n kagent svc/kagent-ui 8082:8080 &

# 3. Capture, then publish.
UI_BASE_URL=http://localhost:8082 npm run update:launch-ui
npm run sync-docs

# 4. Tear down.
./provisioners/kagent-kind.sh --delete
```

`8082` is the port `kagent dashboard` forwards to, so the harness default matches what the
docs tell a reader to open.

**The model provider key need not be real for these captures.** The chart's `check-api-key`
only tests that the variable is non-empty, and the Launch the UI captures are of a freshly
installed cluster — dashboard, agents list, substrate page — none of which invokes a model.
Use a real key only for a capture that shows an agent doing something.

## Task: capture against the mock backend

```sh
cd <kagent checkout>/ui
yarn install
VITE_API_MODE=mock ./node_modules/.bin/vite --port 8101 &

cd <website>/docs-site/playwright
UI_BASE_URL=http://localhost:8101 npm run update:chat
npm run sync-docs
```

Invoking `vite` directly sidesteps the repo's Corepack/Yarn 4 pinning, which is otherwise one
more thing to get working before a screenshot exists.

## Task: add a screenshot to a guide

1. **Pick the capture source** using the table above. That decides which spec the capture
   joins, and it is the decision to get right first.
2. **Write the capture** in the relevant `tests/*.spec.ts`. Use the helpers in
   `fixtures/test.ts` rather than re-implementing them: `gotoUI` (navigate and wait for the
   shell), `settle` (let layout finish), `pinClock` (mock captures only), `mask` (sparingly).
   Wait on a test id that proves the *content* arrived, not merely the page frame — the kagent
   UI ships ~360 stable `data-testid` attributes, so there is always one to wait on, and
   waiting on the frame alone produces a convincing empty-state image.
3. **Add the map entry** in `docs-image-map.json`, with a `$note` naming the guide it serves.
4. **Reference it in the guide** as a theme-aware pair:
   ```md
   {{< reuse-image-light src="img/kagent-ui-foo.png" alt="…" >}}
   {{< reuse-image-dark srcDark="img/kagent-ui-foo-dark.png" alt="…" >}}
   ```
   Both shortcodes render **nothing at all** when the path does not resolve — no warning, no
   build failure. So check the built HTML for the `<img>`, do not assume it worked.
5. **Capture locally to confirm the spec grabbed the right thing**, then let CI produce the
   merged set.
6. **Commit** the spec, the map entry, the baselines, the published images and the guide change
   together.

## Task: refresh for a new kagent version

1. **Nothing here pins a version.** The provisioner reads both chart versions from the same
   conrefs the install guide renders (`assets/kagent-docs/versions/{kagent,agent-substrate}.md`,
   the `1.x` entry), so bumping the docs is what moves the capture. Do not hardcode a version
   to "get the new UI" — that decouples the screenshot from what a reader installs.
2. **Re-capture and review the diffs visually.** A diff means the live UI no longer matches the
   committed screenshots, which may mean the *prose* is now wrong too, not just the image. That
   judgment is the point of the review and cannot be automated.

### If a version line ever diverges

Today every capture publishes to the bare `assets/img/<file>.png`, shared by whatever
references it. That is safe right now because **only 1.x uses these images**: the 0.x tree is
frozen and references images as raw markdown against `static/images/`, never through the
`reuse-image` shortcodes.

When a second version line does need different images, the theme already has the mechanism —
`utils/resolve-versioned-image.html` prefers `assets/img/<version-slug>/<file>` over the bare
path. This site sets `params.folder`, which puts `page-context` in `siteParams` mode, so the
slug for a `/docs/kagent/1.x/…` page is literally `1.x`. Point the diverging image's `dest` at
`assets/img/1.x/<file>.png` and leave every other entry bare; no page edit is needed, because
authors always write the bare `src`.

---

## Determinism

Screenshots are pixel-compared, so captures must be stable across runs.

- **Seed the theme before the app boots.** `fixtures/test.ts` does this with `addInitScript`,
  and it has to: the app reads `localStorage["kagent.themeMode"]` once on first render and
  otherwise falls back to `prefers-color-scheme`. A value written after `goto` is read by
  nobody, and every "dark" capture comes back light.
- **Never wait for `networkidle` on a chat route.** It holds an open stream, so the network
  never goes idle and the wait times out at 30s having captured nothing. `gotoUI` waits on
  rendered content instead, which is both faster and correct everywhere.
- **Pin the clock for mock captures, never for live ones.** The UI renders relative times
  through date-fns `formatDistanceToNow`. Mock fixtures carry fixed timestamps, so a fixed
  clock makes those strings exact. Live data carries whenever-the-provisioner-ran timestamps,
  so a fixed clock would render a real resource as created in the future.
- **Live-cluster captures keep their real relative times.** They are not masked: a mask paints
  a solid rectangle into the *published* image, which is right for a UUID nobody reads and
  wrong for a timestamp a reader expects to see. A few words of "2 minutes ago" is a tiny
  share of a 1440×900 page, well inside the tolerance.
- **Do not loosen `maxDiffPixelRatio` to stabilise a capture.** It hides real content changes
  too, and `--update-snapshots` will then *decline* to rewrite a stale baseline because the old
  one still "passes". If a capture genuinely needs slack, delete the baseline instead.
- **Viewport is pinned inside each project, after the `devices` spread.** `devices['Desktop
  Chrome']` carries its own 1280×720 viewport that silently wins over a top-level
  `use.viewport` — the trap that left the agentgateway harness's committed baselines at 1280×720
  while its config said 1440×900.

## Baselines and platforms

- Baseline filenames are **platform-neutral** (`<name>-<project>.png`, no `-darwin`/`-linux`
  suffix, set via `snapshotPathTemplate`), so one committed set serves both CI and local runs.
- **CI (Linux) owns the canonical set.** Run captures locally on any OS for iteration; let the
  workflow produce the version that gets merged so the pixels match CI.
- Baselines live in `__screenshots__/<spec>.spec.ts-snapshots/<name>-<project>.png`. Diff
  tolerance is `maxDiffPixelRatio: 0.01`.
- **Never hand-edit `__screenshots__/` or the published `assets/img/` copies.** Change the spec,
  or refresh through the harness.

## What the committed baselines were captured against

**Re-check this before trusting them.**

| Capture | Source | Date |
| --- | --- | --- |
| `kagent-ui-chat` | kagent UI mock backend, `vite` at kagent tag `v1.0.0-alpha2` (`373b56be`) | 2026-09-15, re-verified 2026-09-23 |
| `kagent-ui-dashboard` / `-agents` | **published charts** kagent `1.0.0-alpha2` + Agent Substrate `0.2.0-beta5`, kind 1.37.0 | 2026-09-15, re-verified 2026-09-23 |
| `kagent-ui-substrate` | **published charts** kagent `1.0.0-alpha2` + Agent Substrate `0.2.0-beta5`, kind 1.37.0 | 2026-09-23 |

**The cluster captures now come from the published chart**, which closes the caveat these
notes carried since 2026-09-15. A fresh `kagent-shots` cluster installed exactly what
`versions/kagent.md` and `versions/agent-substrate.md` pin, and the capture ran against that.

**`-dashboard` and `-agents` were re-verified, not rewritten.** They still match byte-for-byte
against the published chart, so those two surfaces did not move between the 2026-09-15 source
build and `1.0.0-alpha2`, and the old images were honest after all. Only `-substrate` changed
(see below), so only that pair carries the new date.

**What moved on the Substrate page at `1.0.0-alpha2`** — the page grew 1247px to 1308px, and
these are the changes a reader sees:

- the single **Scope** selector became two filters, **Kubernetes namespace** and **ATE atespace**;
- the **Actor templates** table dropped its **Harness** column;
- the **Workers** table replaced its **Actor** column (which read `idle`) with **IP**;
- the Actors and Workers panels lost their per-panel search boxes, gained `N on this page`
  counts and a `read just now` line, and the empty state changed from
  `ate-api reported no actors in this scope` to `No actors on this page.`;
- the page description dropped the internal name `ate-api` in favour of `Substrate`.

Three of those falsified prose in `observability/launch-ui.md`, which was corrected in the
same change. **`read just now` is a new volatile string** — it has held across re-captures so
far, but it is the thing to suspect first if this capture ever starts flapping.

The chat capture needs no such caveat going forward: it will always come from source,
because the released image ships no mock service worker.

## Design decisions worth not reversing by accident

- **Projects are keyed by theme, not by docs version.** The kagent UI exposes a theme control
  Playwright can drive, so light and dark are two real captures and the guides carry a
  theme-aware pair. Version is not a baseline axis because only 1.x uses these images (see
  "If a version line ever diverges"). Adding the version to a project name renames every
  committed baseline, so leave it until a second version is genuinely being captured.
- **`@playwright/test` is pinned exactly (no caret).** CI triggers on input changes rather
  than on a cron, and that reasoning only holds if nothing can change without a git event. A
  caret would let `npm ci` pull a new minor with a different Chromium, shifting pixels
  silently. The agentgateway harness gets away with `^1.49.0` only because it re-captures
  nightly, which turns a browser bump into a reviewable PR. The pin works as designed:
  Dependabot moved it 1.49.0 -> 1.63.0 on 2026-09-23 as a reviewable commit, and `package.json`
  is on the workflow's path filter so the bump triggers a re-capture. That bump shifted no
  pixels beyond tolerance — all eight baselines passed under the new Chromium before anything
  was rewritten — so a browser bump is not automatically a re-baseline.
- **`workers: 1`.** The specs drive a real cluster and captures can create resources, so
  concurrent runs would race each other.
- **There is no `update:all`.** The two specs need different backends, so a single command that
  ran both would always half-fail. `sync-docs` reflects the same reality: a missing baseline is
  a warning and a nonzero exit, not a hard stop, because syncing after either source
  legitimately leaves the other's images unrefreshed.

## CI

`.github/workflows/playwright-screenshots.yaml` — `workflow_dispatch` plus a push to `main`
touching any input that determines the screenshots (the version conrefs, the specs, the
fixtures, the config, the provisioner). **Both jobs run on a matching push** as of 2026-09-23.

**Deliberately no cron.** The chart versions are pinned to exact docs releases and released
charts are immutable, so a fixed version plus a fixed fixture renders identically every run.
Nothing changes until an input file changes, and that is a git event — so the workflow triggers
on the event rather than polling. A cron here would produce a nightly no-op, or a stream of
empty PRs.

**One path filter serves both jobs, on purpose.** Over-triggering costs a ~15m no-op; under-
triggering is invisible, and it already bit once — see below. Refreshed images land under
`__screenshots__/` and `assets/img/`, neither of which is on the filter, so a merged refresh
PR cannot re-trigger the workflow.

Needs no secrets. A model provider key is read from `secrets.OPENAI_API_KEY` if one is set, but
the job falls back to a placeholder, which is correct rather than a workaround: the chart's
`check-api-key` only tests for non-emptiness and these captures invoke no model.

### Two failures worth not re-introducing

- **The cluster job was `workflow_dispatch`-only while `provisioners/**` and the version conrefs
  sat on the `push` filter.** Only that job reads them, so a version bump started a run,
  executed the *mock* job — which reads no versions at all — and finished green while the three
  cluster screenshots stayed eight days stale. Nothing failed; the trigger fired a job that
  could not act on it. **A path filter is only as good as the job it can reach.**
- **Neither job declared `permissions:`,** so `create-pull-request` got a read-only
  `GITHUB_TOKEN` and every run died at the branch push with `Permission to
  kagent-dev/website.git denied to github-actions[bot]`. The capture itself succeeded every
  time and the result was discarded, which is why it read as a screenshot problem. Both jobs now
  declare `contents: write` + `pull-requests: write`, the same pair `update-ref-docs.yaml` has
  always used — that workflow opens PRs from this bot routinely, so the org-level "allow Actions
  to create pull requests" setting was never the cause.

## Files

| File | Purpose |
| --- | --- |
| `playwright.config.ts` | Base URL, light/dark projects, viewport, diff tolerance. No `webServer` — see above |
| `fixtures/test.ts` | Theme seeding; `gotoUI` / `settle` / `pinClock` / `mask` helpers |
| `tests/launch-ui.spec.ts` | Live-cluster captures: dashboard, agents, substrate |
| `tests/chat.spec.ts` | Mock-backed capture: the seeded conversation |
| `docs-image-map.json` | Baseline name → `{ light, dark }` destinations under `assets/img`, with a `$note` per image |
| `scripts/sync-docs-images.mjs` | Copies baselines into `assets/img` |
| `provisioners/kagent-kind.sh` | kind cluster + Agent Substrate + kagent at docs-pinned versions |
| `__screenshots__/` | Committed baselines (light + dark per capture) |

## npm scripts

| Script | Does |
| --- | --- |
| `test:launch-ui` / `update:launch-ui` | Verify / regenerate the live-cluster baselines |
| `test:chat` / `update:chat` | Verify / regenerate the mock-backed conversation baseline |
| `sync-docs` | Copy baselines into `assets/img` (`-- --dry-run` to preview) |
| `report` | Open the last Playwright HTML report |

## Environment variables

| Var | Default | Purpose |
| --- | --- | --- |
| `UI_BASE_URL` | `http://localhost:8082` | The running UI to attach to |
| `OPENAI_API_KEY` | — | Required by the provisioner (the kagent chart needs a model provider key) |
| `CLUSTER_NAME` | `kagent-shots` | kind cluster name |
| `KAGENT_VERSION` | docs conref | Override the kagent chart version for a one-off run |
| `SUBSTRATE_VERSION` | docs conref | Override the Agent Substrate chart version for a one-off run |
