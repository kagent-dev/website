---
title: Serve the UI under a sub-path
description: Serve the kagent UI behind a reverse proxy using ui.basePath, including both proxy shapes, validation, and oauth2-proxy configuration.
weight: 15
author: kagent.dev
---

The kagent UI is served by an nginx sidecar that answers on port `8080` inside the pod. By default it serves at the root (`/`). When a reverse proxy fronts the UI and you want it reachable under a prefix such as `/ui`, set `ui.basePath` in the Helm values.

## The `ui.basePath` value

| Setting | Default | Effect |
|---------|---------|--------|
| `ui.basePath` | `""` (empty) | UI served at `/`. All existing behaviour unchanged. |
| `ui.basePath` | e.g. `/ui` | UI served under the prefix. One value moves every root-relative URL the UI emits. |

The value is purely additive: leaving it unset leaves the installation exactly as it is today.

When set, a single value controls the `<base href>` tag, the client-side router basename, and the root-relative API, SSO, userinfo, and share-link URLs that the browser uses. A reader who expects to adjust `publicBackendUrl` by hand should know that the base path already covers it: root-relative URLs such as `publicBackendUrl` inherit the prefix automatically.

## Proxy shapes

Both of the following proxy configurations work. Choose the one that matches your infrastructure.

### Proxy strips the prefix

The proxy removes the `/ui` prefix before forwarding to the UI service on port `8080`. The UI then sees requests at `/` and serves them normally.

Example nginx configuration:

```nginx
location /ui/ {
    proxy_pass http://kagent-ui.kagent:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The trailing slash on `proxy_pass` is what makes nginx drop the `/ui` prefix.

### Proxy forwards the prefix unchanged

The proxy passes `/ui/...` through to the UI service without modification. In this case nginx inside the pod strips the prefix itself using the rewrite rules rendered from `ui.basePath`.

Example nginx configuration:

```nginx
location /ui/ {
    proxy_pass http://kagent-ui.kagent:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

No trailing slash on `proxy_pass` — the full path including `/ui` reaches the UI pod, and its nginx rewrites it to `/` before serving.

## Helm render validation

Two validations run at Helm render time and fail the install rather than producing a broken UI. Both are defined in `helm/kagent/templates/ui-configmap.yaml`.

| Condition | Helm error message |
|-----------|-------------------|
| Not a path like `/ui`, or containing a `.` or `..` segment | `ui.basePath must be a path like /ui` |
| Starting with a path nginx serves | `ui.basePath cannot start with a path nginx serves, such as /api or /assets` |

The reserved set that triggers the second rejection is larger than the message names. The full set of paths that must not appear as the first segment of `ui.basePath`:

- `api`
- `a2a`
- `assets`
- `health`
- `env-config.js`
- `index.html`
- `mockServiceWorker.js`

Choosing any of these as the base path collides with a path nginx already owns inside the UI pod.

## oauth2-proxy

If you use oauth2-proxy for SSO, a base-path change requires a second, manual step.

1. Set `OIDC_REDIRECT_URL` to point under the base path (for example `https://example.com/ui/oauth2/start` rather than `https://example.com/oauth2/start`).
2. Restart the oauth2-proxy pod after changing the value.

The restart is required because the chart's sign-in HTML redirects to `{basePath}/login`, and the oauth2-proxy checksum deliberately renders without the `ui` prefix, so a base-path change alone does not roll the oauth2-proxy pod. Without the restart, the proxy keeps using the old redirect URL and sign-in fails.

## Verifying the installation

After installing with `--set ui.basePath=/ui`:

1. Open `/ui/` in a browser. The UI should load.
2. Navigate to an agent list or detail page. The URL should stay under `/ui/...` (for example `/ui/agents`).
3. Open the browser network tab. API calls should go to `/ui/api/...`, not `/api/...`.
4. Reload the page. The SPA router should keep the prefix.
5. If oauth2-proxy is enabled, sign in. The redirect should land under `/ui/oauth2/...`.
