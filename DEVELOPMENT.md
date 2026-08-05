# Development Guide

This document provides guidelines and instructions for those who want to contribute to the kagent website and documentation.

## Architecture

The site is two stacks served from one origin (`kagent.dev`):

- **Marketing site** (home, blog, agents, tools, community, enterprise) — a
  Next.js app in `src/`, deployed as an [OpenNext](https://opennext.js.org/cloudflare)
  Cloudflare Worker.
- **Documentation** — a [Hugo](https://gohugo.io/) site in `docs-site/`, built
  with the [Hextra](https://imfing.github.io/hextra/) theme and the shared
  [docs-theme-extras](https://github.com/solo-io/docs-theme-extras) overlay
  (the same stack as the other Solo OSS docs sites, e.g. agentgateway). It is
  served entirely under the `/docs` subpath.

`make build` builds the Hugo docs, injects the static output into `public/docs/`
so the Worker serves it as static assets, then builds the Worker. One build, one
deploy, one origin. Cloudflare serves the static `/docs/*` assets before the
Worker runs, so the docs shadow any old Next.js `/docs` routes.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.2 or later) and [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [Hugo extended](https://gohugo.io/installation/) — use the version-pinned
  `hugo160` binary that the Solo docs repos standardize on. CI can fall back to a
  bare `hugo` on PATH with `make ... HUGO=hugo`.
- [Go](https://go.dev/) — required by Hugo to fetch the `docs-theme-extras`
  module.

## Setting up the development environment

1. **Clone the repository**

   ```bash
   git clone https://github.com/kagent-dev/website.git
   cd website
   ```

2. **Install dependencies** (web + docs npm packages and Hugo modules)

   ```bash
   make install
   ```

The `Makefile` at the repo root orchestrates both stacks. Run `make help` to list
every target.

## Working on the marketing site (Next.js)

```bash
make serve-web      # Next.js dev server at http://localhost:3000
```

Marketing pages live in `src/app/` and blog posts in `src/blogContent/`.

## Working on the documentation (Hugo)

Edit the markdown directly under `docs-site/content/`. The directory tree maps to
the URL, so `docs-site/content/kagent/introduction/installation.md` is served at
`/docs/kagent/introduction/installation/`. Hextra builds the sidebar
automatically from the tree plus each page's `weight`.

```bash
make serve-docs     # Hugo docs only, at http://localhost:1313/docs/
```

To preview the docs and marketing site together the way they deploy (so
cross-stack links and the shared top nav behave), build and serve the combined
site through wrangler:

```bash
make preview        # combined build, served at http://localhost:3000
```

### Authoring conventions

- **Frontmatter** is plain YAML: `title` (the page H1 / sidebar name),
  optional `linkTitle` (short sidebar name when the H1 is longer), `description`,
  `weight` (ordering), and `author`.
- **Shortcodes** from Hextra / docs-theme-extras are available, including
  `{{</* cards */>}}` / `{{</* card */>}}`, `{{</* tabs */>}}` / `{{</* tab */>}}`,
  and `{{</* reuse */>}}`.
- **Callouts** use GitHub-flavored alert blockquotes, which Hextra renders as
  callouts (and which also render on GitHub):

  ```markdown
  > [!TIP]
  > This is a tip.

  > [!WARNING]
  > This is a warning.
  ```

- **Versions** are single-sourced as reuse snippets, one file per version under
  `docs-site/assets/versions/` (e.g. `agent-substrate.md` contains just `0.0.6`),
  matching the convention on the other Solo docs sites. Reference a version with
  the `reuse` shortcode. This replaces the old `{VERSIONS.key}` placeholders that
  were sourced from `src/app/docs/_constants.ts`. Because the `reuse` shortcode
  trims trailing whitespace, the bare value drops cleanly into prose and code
  fences:

  ```markdown
  Install Agent Substrate v{{</* reuse "versions/agent-substrate.md" */>}}.

  ```bash
  helm install substrate ... --version {{</* reuse "versions/agent-substrate.md" */>}}
  ```
  ```

  To bump a dependency version across the docs, edit the one snippet file under
  `docs-site/assets/versions/`. A snippet may reference another snippet, so a
  composed value can nest a base version rather than duplicating it.

### Auto-generated reference docs

The kagent/kmcp CRD API references and the kagent Helm chart reference are
generated nightly from the upstream source repos by the
[Update Reference Documentation workflow](.github/workflows/update-ref-docs.yaml),
which opens a PR against `main`. **Do not hand-edit** these files, because the
next run overwrites them:

- `docs-site/content/kagent/resources/api-ref.md`
- `docs-site/content/kmcp/reference/api-ref.md`
- `docs-site/content/kagent/resources/helm.md`

### The MDX converter (migration tool)

`scripts/mdx-to-hugo.mjs` converted the original Next.js `src/app/docs/**/page.mdx`
docs into the Hugo `docs-site/content/` tree during the migration. It is kept for
reference and re-runs (`make gen-docs`), but `docs-site/content/` is now the
source of truth — a blind `make gen-docs` overwrites hand edits, so only use it to
regenerate into a scratch dir and diff.

## Building for production

```bash
make build          # docs + inject into /docs + build the Worker
```

## Deployment

`make deploy` builds everything and deploys the Worker to Cloudflare. The site is
also deployed automatically when changes land on `main`.

## Keeping the lock files in sync

Cloudflare runs `npm ci`, which requires each `package-lock.json` to match its
`package.json` exactly. If you change dependencies, run `npm install` in the
affected directory (repo root for the web app, `docs-site/` for the docs) and
commit the updated lock file. If a build fails with "lock file's X does not
satisfy X" or "Missing: X from lock file", regenerate and commit the lock file.

## Code style and linting

The Next.js app uses ESLint and Prettier:

```bash
npm run lint
npm run format
```

## Getting help

- Create an issue on GitHub
- Reach out to project maintainers
- [Join our community discussion](https://bit.ly/kagentdiscord) on Discord

Thank you for contributing to the kagent project!
