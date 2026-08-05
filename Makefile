# kagent.dev — combined build (Next.js marketing worker + Hugo docs)
#
# Architecture: the marketing site (home, blog, agents, tools, community,
# enterprise) is a Next.js app deployed as an opennextjs Cloudflare Worker. The
# documentation is a Hugo site in docs-site/, served entirely under the /docs
# subpath (its baseURL carries the /docs prefix). `make build` builds the Hugo
# docs, injects the static output into public/docs/ so the Worker serves it as
# static assets, then builds the Worker. One build, one deploy, one origin.
#
# Hugo binary: defaults to the version-pinned `hugo160` used across the Solo docs
# repos. CI can override with `make ... HUGO=hugo` if a bare hugo is on PATH.

HUGO ?= hugo160
DOCS_DIR := docs-site
DOCS_OUT := $(DOCS_DIR)/public
# Where the docs static assets are injected in the Next app. Served at /docs.
WEB_DOCS := public/docs
# Optional Hugo baseURL override. Empty = use hugo.yaml's prod baseURL
# (https://kagent.dev/docs/). `make preview` sets this to the local wrangler host
# so internal absolute links (section cards, assets) stay on localhost instead of
# jumping to production. The port matches `dev:worker` (wrangler --port 3000).
DOCS_BASEURL ?=

.DEFAULT_GOAL := help

.PHONY: help
help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Setup ──────────────────────────────────────────────────────────────────
.PHONY: install
install: ## Install web + docs dependencies (npm) and Hugo modules
	npm install
	cd $(DOCS_DIR) && npm install
	cd $(DOCS_DIR) && $(HUGO) mod get ./...

# ── Docs (Hugo) ────────────────────────────────────────────────────────────
.PHONY: gen-docs
gen-docs: ## Regenerate Hugo docs content from src/app/docs (the MDX source)
	node scripts/mdx-to-hugo.mjs --out $(DOCS_DIR)/content

.PHONY: build-docs
build-docs: ## Build the Hugo docs site -> docs-site/public
	cd $(DOCS_DIR) && $(HUGO) --config hugo.yaml $(if $(DOCS_BASEURL),--baseURL "$(DOCS_BASEURL)") --gc --minify

.PHONY: inject-docs
inject-docs: ## Copy built docs into public/docs (preserves tracked assets, e.g. versions/)
	@mkdir -p $(WEB_DOCS)
	rsync -a --delete --filter='protect versions/**' --filter='protect versions/' \
	  $(DOCS_OUT)/ $(WEB_DOCS)/

.PHONY: serve-docs
serve-docs: ## Preview the docs alone at http://localhost:1313/docs/
	cd $(DOCS_DIR) && $(HUGO) server --config hugo.yaml -D --disableFastRender

# ── Web (Next.js) ──────────────────────────────────────────────────────────
.PHONY: serve-web
serve-web: ## Run the Next.js marketing dev server (http://localhost:3000)
	npm run dev

.PHONY: build-web
build-web: ## Build the opennextjs Cloudflare Worker (bundles public/ as assets)
	npm run build:worker

# ── Combined ───────────────────────────────────────────────────────────────
.PHONY: build
build: build-docs inject-docs build-web ## Build docs + inject into /docs + build the Worker

.PHONY: preview
# Target-specific var (inherited by the `build` prerequisite -> build-docs) so the
# docs are built with the local host; keeps card/asset links on localhost.
preview: DOCS_BASEURL := http://localhost:3000/docs/
preview: build ## Build everything and serve the combined site via wrangler dev
	npm run dev:worker

.PHONY: deploy
deploy: build ## Build everything and deploy the Worker to Cloudflare
	npx wrangler deploy --minify

# ── Housekeeping ───────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Remove build artifacts (keeps tracked assets under public/docs)
	rm -rf $(DOCS_OUT) $(DOCS_DIR)/resources $(DOCS_DIR)/hugo_stats.json
	rm -rf .open-next .wrangler
	@# Drop injected docs but keep tracked files (versions/ etc.)
	find $(WEB_DOCS) -mindepth 1 -maxdepth 1 ! -name versions -exec rm -rf {} + 2>/dev/null || true
