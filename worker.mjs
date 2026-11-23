/**
 * Cloudflare Worker entry point: the OpenNext Worker, plus HTTP content
 * negotiation for the Hugo docs under /docs.
 *
 * Why
 * ---
 * AI agents and developer tools (Claude Code, Cursor, OpenCode) send
 * "Accept: text/markdown" when they fetch documentation, so they get clean
 * markdown instead of a full HTML page with navigation and scripts. The Hugo
 * docs already publish a markdown twin of every page:
 *   /docs/kagent/main/getting-started/quickstart/index.html   (HTML page)
 *   /docs/kagent/main/getting-started/quickstart.md           (markdown twin)
 *   /docs/kagent/main/getting-started/index.md                (section page)
 * but nothing served it for an Accept header, so the afdocs agent-readiness
 * check `content-negotiation` failed for kagent.dev.
 *
 * How it works
 * ------------
 * wrangler.toml sets `run_worker_first = ["/docs/*"]`, so requests under /docs
 * reach this Worker instead of going straight to the static assets. For those:
 *
 *   1. Accept includes text/markdown and the URL has no file extension: serve
 *      <path>.md, else <path>/index.md, as text/markdown with `Vary: Accept`.
 *   2. Anything else under /docs: serve the static asset. wrangler.toml sets
 *      `html_handling = "none"` (OpenNext requires it with run_worker_first),
 *      so this file does the directory handling the asset layer used to do,
 *      with the same responses as before:
 *        /docs/foo/            -> /docs/foo/index.html (200)
 *        /docs/foo             -> 307 to /docs/foo/   (when foo/index.html exists)
 *        /docs/foo/index.html  -> 307 to /docs/foo/
 *      If there is no asset, fall through to the Next.js Worker, which is what
 *      happened before this file existed (an asset miss reached the Worker).
 *
 * Every other path goes to the OpenNext Worker unchanged.
 *
 * The same negotiation runs on agentgateway.dev, kgateway.dev, aregistry.ai,
 * and ambientmesh.io as a Cloudflare Pages `_worker.js`. This copy differs only
 * in wrapping OpenNext instead of the Pages asset server.
 *
 * Cost: with run_worker_first, every /docs request (CSS, JS, and images too)
 * now counts as a Worker invocation. The extension check below returns those
 * straight from ASSETS, so the extra work per request is small.
 *
 * Testing: `npm run preview:worker`, then
 *   curl -H "Accept: text/markdown" http://localhost:8787/docs/kagent/main/
 * or, after a deploy, re-run the afdocs scorecard against kagent.dev.
 */
import openNext from "./.open-next/worker.js";

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  Vary: "Accept",
};

async function assetAt(url, pathname, env) {
  const u = new URL(url);
  u.pathname = pathname;
  const resp = await env.ASSETS.fetch(new Request(u.href));
  return resp.ok ? resp : null;
}

function redirectTo(url, pathname) {
  const u = new URL(url);
  u.pathname = pathname;
  return Response.redirect(u.href, 307);
}

/**
 * Static files under /docs, with the directory handling that Cloudflare's
 * `html_handling = "auto-trailing-slash"` used to provide. Returns null when
 * there is no matching file, so the caller can fall through to Next.js.
 */
async function docsAsset(request, url, env) {
  const path = url.pathname;
  if (path.endsWith('/index.html')) {
    if (await assetAt(url, path, env)) return redirectTo(url, path.slice(0, -'index.html'.length));
    return null;
  }
  if (path.endsWith('/')) {
    return assetAt(url, path + 'index.html', env);
  }
  const exact = await env.ASSETS.fetch(request);
  // 304 is not `ok`, but it is a hit: the browser sent If-None-Match for a
  // file it already has cached. Treating it as a miss fell through to Next.js,
  // which answered every cached CSS/JS file with its 404 page, so pages loaded
  // unstyled after the first visit until a hard refresh.
  if (exact.ok || exact.status === 304) return exact;
  if (!/\.[a-zA-Z0-9]{1,5}$/.test(path) && (await assetAt(url, path + '/index.html', env))) {
    return redirectTo(url, path + '/');
  }
  return null;
}

async function markdownTwin(url, env) {
  const base = url.pathname.replace(/\/$/, "");
  const candidates = [];
  if (base) candidates.push(base + ".md");
  candidates.push((base || "") + "/index.md");
  for (const pathname of candidates) {
    const mdUrl = new URL(url);
    mdUrl.pathname = pathname;
    const resp = await env.ASSETS.fetch(new Request(mdUrl.href));
    if (resp.ok) return new Response(resp.body, { status: 200, headers: MARKDOWN_HEADERS });
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/docs" || path.startsWith("/docs/")) {
      const hasExtension = /\.[a-zA-Z0-9]{1,5}$/.test(path);
      const accept = request.headers.get("Accept") || "";
      if (!hasExtension && accept.includes("text/markdown")) {
        const md = await markdownTwin(url, env);
        if (md) return md;
      }
      const asset = await docsAsset(request, url, env);
      if (asset) return asset;
    }

    return openNext.fetch(request, env, ctx);
  },
};
