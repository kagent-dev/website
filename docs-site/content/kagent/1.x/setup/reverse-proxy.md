---
title: Serve the UI under a sub-path
description: Serve the kagent UI behind a reverse proxy using ui.basePath, including both proxy shapes, validation, and oauth2-proxy configuration.
weight: 15
author: kagent.dev
---

The kagent UI is a static bundle served by nginx, which answers on port `8080` inside the pod. By default it serves at the root (`/`). When a reverse proxy fronts the UI and you want it reachable under a prefix such as `/ui`, set `ui.basePath` in the Helm values.

## The `ui.basePath` value

One Helm value controls the whole sub-path, and it is purely additive: leaving it unset leaves an existing installation serving at the root exactly as before. Set it, and the prefix reaches every URL the UI emits, not only the pages a reader navigates to.

| Setting | Default | Effect |
|---------|---------|--------|
| `ui.basePath` | `""` (empty) | UI served at `/`. All existing behaviour unchanged. |
| `ui.basePath` | e.g. `/ui` | UI served under the prefix. One value moves every root-relative URL the UI emits. |

When set, a single value controls the `<base href>` tag, the client-side router basename, and the root-relative API, SSO, userinfo, and share-link URLs that the browser uses. `publicBackendUrl` and the other root-relative URLs inherit the prefix, so do not adjust them by hand.

## Setting the value

Put `ui.basePath` in the Helm values at install time, rather than in a follow-up `helm upgrade`. The install steps live on the [Install kagent]({{< link path="setup/installation" >}}) page; the value is the only non-default setting this page needs.

```bash
helm upgrade --install kagent \
  {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
  --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
  --namespace kagent --create-namespace --timeout 10m \
  --set ui.basePath=/ui
```

## Proxy shapes

Both of the following proxy configurations work. Choose the one that matches your infrastructure. If you enable oauth2-proxy for SSO, the proxy must strip the prefix: with the prefix forwarded, oauth2-proxy cannot match its own sign-in and skip-authentication paths, and sign-in fails.

### Proxy strips the prefix

The proxy removes the `/ui` prefix before forwarding to the UI service on port `8080`. The UI then sees requests at `/` and serves them normally.

Example nginx configuration:

```nginx
location /ui/ {
    proxy_pass http://{{< reuse "kagent-docs/snippets/name-ui.md" >}}.kagent:8080/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

A trailing slash on `proxy_pass` makes nginx drop the `/ui` prefix.

### Proxy forwards the prefix unchanged

The proxy passes `/ui/...` through to the UI service without modification. In this case nginx inside the pod strips the prefix itself using the rewrite rules rendered from `ui.basePath`.

Example nginx configuration:

```nginx
location /ui/ {
    proxy_pass http://{{< reuse "kagent-docs/snippets/name-ui.md" >}}.kagent:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Do not put a trailing slash on `proxy_pass`. The full path including `/ui` reaches the UI pod, and its nginx rewrites it to `/` before serving.

## Helm render validation

Two validations run at Helm render time and fail the install rather than producing a broken UI.

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

1. Set `OIDC_REDIRECT_URL` under `oauth2-proxy.extraEnv` in your Helm values so that it points under the base path, for example `https://example.com/ui/oauth2/callback` rather than `https://example.com/oauth2/callback`. This becomes oauth2-proxy's `--redirect-url`, which is the OAuth callback, not the path that starts sign-in; the chart leaves its `--proxy-prefix` at `/oauth2`, so the callback is `/oauth2/callback`.
2. Register that same URL as a redirect URI with your identity provider.
3. Restart the oauth2-proxy pod after changing the value.

The restart is required because the chart's sign-in HTML redirects to `{basePath}/login`, but the checksum that would roll the oauth2-proxy pod is computed where the `ui` values key is not in scope. The base path is absent from the hash, so the hash does not change and the pod keeps the old sign-in template and redirect URL until you restart it.

## Verifying the installation

After installing with `--set ui.basePath=/ui`, run each check and look for the named result.

1. Open `/ui/` in a browser. Expected: the kagent UI loads, and the `<base href>` in the page source is `/ui/`.
2. Navigate to an agent list or detail page. Expected: the URL stays under `/ui/...`, for example `/ui/agents`.
3. Open the browser network tab while the page loads. Expected: API calls go to `/ui/api/...`, not `/api/...`.
4. Reload the page. Expected: the SPA router keeps the `/ui` prefix in the URL.
5. If oauth2-proxy is enabled, sign in. Expected: the OAuth redirect lands under `/ui/oauth2/...`, then returns you to the UI under `/ui/`. This holds when the proxy strips the prefix; when the proxy forwards the prefix unchanged, the OAuth paths behave as described under [Proxy shapes](#proxy-shapes).

To confirm the Helm-side validation, install with a rejected value and expect the render to fail:

```bash
helm upgrade --install kagent \
  {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
  --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
  --namespace kagent --create-namespace \
  --set ui.basePath=/api
```

Expected:

```
Error: execution error at (kagent/templates/ui-deployment.yaml:21:31): ui.basePath cannot start with a path nginx serves, such as /api or /assets
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/installation" >}}` title="Install kagent" subtitle="The full install steps this page's `ui.basePath` value plugs into." >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Identity" subtitle="How kagent resolves a caller's identity and scopes a Session to its creator." >}}
{{< /cards >}}
