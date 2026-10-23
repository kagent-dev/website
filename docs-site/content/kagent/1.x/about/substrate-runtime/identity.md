---
title: Identity
description: Understand how kagent resolves a caller's identity, scopes a Session to its creator, and how Agent Substrate identifies its own components.
weight: 30
author: kagent.dev
aliases:
  - /kagent/1.x/substrate-runtime/identity/
---

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation identifies each kind of caller with a different system.

- An operator applying a {{< gloss "Harness" >}}Harness{{< /gloss >}} is authenticated by [Kubernetes](#the-kubernetes-plane).
- A caller that reaches [kagent's gRPC API](#the-kagent-control-plane) is assigned a principal by kagent, both for a {{< gloss "Session" >}}Session{{< /gloss >}} and for the resources that the API writes.
- An agent's runtime calls the same API with a [token that Agent Substrate issues](#agent-runtime-calls).
- The components inside [Agent Substrate](#the-agent-substrate-plane) authenticate each other.

## The Kubernetes plane

Kubernetes role-based access control (RBAC) governs who can create, read, edit, or delete Kubernetes resources with `kubectl`, including Harness, AgentTemplate, and {{< gloss "Agent" >}}Agent{{< /gloss >}} resources. A cluster's existing roles and bindings decide who authors an agent's Harness and AgentTemplate, and the pairing of the two on that path.

Because neither a Harness nor an AgentTemplate names the other, the Agent resource carries the pairing, and RBAC on Agents governs it. Whoever can write Agents in a namespace controls which template runs on which Harness, even without edit access to the Harnesses and AgentTemplates that those Agents name. For more information about the pairing, see the [Agent core concept]({{< link path="about/core-concepts#agent" >}}).

kagent's gRPC API reaches these same resources by a second path that Kubernetes RBAC does not evaluate. For more information, see [Resources that the API writes](#resources-that-the-api-writes).

## The kagent control plane

A Session is not a Kubernetes resource. kagent's gRPC API creates the Session, and kagent's database tracks it. Kubernetes RBAC therefore does not reach it. kagent resolves a principal for these calls itself.

Every call on the Session API carries a principal. An authenticator resolves one before the request reaches the service, and a call that the authenticator declines is rejected as unauthenticated before any other check runs.

### Controller authentication modes

The `config.server.auth.mode` Helm value selects which authenticator the controller installs. The chart defaults to `insecure`, and enabling the bundled oauth2-proxy does not change it, because browser sign-in and controller authentication are separate boundaries. To authenticate both, enable oauth2-proxy and set `config.server.auth.mode` to `trusted-proxy`.

| Mode | How a principal is resolved |
| ---- | --------------------------- |
| `insecure` | Every request is admitted. The caller's identity is read from the `X-User-Id` header, or from a `user_id` query parameter that takes precedence over it. A caller that supplies neither is named `admin@kagent.dev`. |
| `trusted-proxy` | The request must carry a bearer token in the `Authorization` header. The identity comes from the claim that `config.server.auth.userIdClaim` names, defaulting to `sub`. A missing custom claim falls back to `sub`, and a request with no identity is rejected. |

Any other value fails controller startup rather than falling back to a default.

> [!WARNING]
> **`trusted-proxy` decodes the token without verifying it.** The authenticator reads the bearer token's payload and checks neither its signature nor its expiry, because it assumes that an upstream boundary already validated the credential. A caller that reaches the controller directly can therefore present a token that it wrote itself. This mode is safe only where ingress validates every token before forwarding it, and network policy stops anything else from reaching port `8083`.

> [!WARNING]
> **`insecure` lets a caller select its own principal.** It verifies neither the header nor the query parameter, and the same authenticator guards the controller's `/mcp` endpoint. Treat the principal on a call as a label that the caller chose, and restrict network access to both endpoints rather than relying on it.

Authorization is separate from both modes. For user calls, kagent installs an authorizer that permits every check regardless of the authentication mode, so neither mode constrains what an authenticated user can do. For agent runtime calls, kagent applies a fixed policy that limits each Actor to its own resources. For more information, see [Agent runtime calls](#agent-runtime-calls).

### Resources that the API writes

kagent's gRPC API reaches the same resources by a second path. The AgentTemplate service creates, updates, and deletes AgentTemplates, and the Harness service creates and deletes Harnesses, both through the kagent controller. The `kagent apply -f` command calls the AgentTemplate service, and any client that reaches the gRPC endpoint can call either service. The controller writes these resources with its own service account rather than the caller's, so Kubernetes RBAC never evaluates the caller. The authenticator above resolves the caller instead.

> [!WARNING]
> By default, kagent neither authenticates nor authorizes this path. The `insecure` authenticator admits every request, and the authorizer it installs permits every check. Any caller that reaches the gRPC endpoint can author an agent's Harness and AgentTemplate, regardless of their Kubernetes permissions. Do not expose port `8083` outside the cluster. For the identity that this mode gives an anonymous caller, and for the mode that changes it, see [Controller authentication modes](#controller-authentication-modes).

### Creator ownership

kagent records a **creator** on every Session, taken from the principal on the call that created it. That creator is then part of the database query for every read, so a caller who asks for a Session that another principal created receives a not-found response rather than a permission error. Sandboxes, Checkpoints, and ScheduledRuns each carry a creator of their own, and a read on one of those is scoped the same way.

Listing behaves the same way. A list returns the caller's own Sessions by default. A caller that sets the request's all-creators flag asks to widen that to every creator in the namespace, and kagent authorizes that request separately from an ordinary list.

> [!IMPORTANT]
> Creator ownership separates callers without containing them. kagent calls an authorizer before every Session operation, and the authorizer it installs permits every check, so any caller can widen a list. In `insecure` mode a caller also names its own principal, so a caller that presents another creator's identifier reads that creator's Sessions. Creator scoping keeps one user's conversations out of another user's list. It is not a security boundary.

### Shares

A share lets a Session's owner give another account access to that one conversation. Creating a share produces a token, and a caller presenting that token reaches the shared Session without becoming its creator.

Every share is read-only. The holder can read the conversation, but cannot send a message, answer an approval, cancel a task, or retry a turn. kagent enforces the restriction in its services and transports. A shared conversation in the UI does not show controls for those actions.

A client that creates a share can set `CreateSessionShareRequest.ttl` to a positive lifetime, which starts when the share is created. Once that lifetime ends, the token does not grant access, and a token lookup returns not found. The owner still sees the expired share in `ListSessionShares` and can revoke it.

The returned `SessionShare.expiresAt` field records when the token stops granting access. Omit `ttl` and `expiresAt` stays unset. The share then stays valid until it is revoked or the Session is deleted. An operator caps share lifetimes with `config.sessions.shareMaxTtl`. For more information, see [Expire idle Sessions]({{< link path="operations/operational-considerations#expire-idle-sessions" >}}).

A share widens what the holder can reach to what the owner can see, and the underlying record is read as the owner rather than as the visitor. Revoking the share withdraws that access.

### Agent runtime calls

An agent's runtime calls the controller to store task state and memories, and to read its own Agent and Session. These calls arrive on the same port as user calls, `8083`. However, the controller authenticates agent runtime calls separately from the user authentication mode. The task state and memory calls that only an agent makes always need a valid token, even in `insecure` mode. The controller treats a call that sends no `Authorization` header as a user call, and applies the user authentication mode to it.

The runtime, the Agent Substrate egress gateway, and the controller each take one step to authenticate a call.

1. The runtime sends a placeholder bearer token in the `Authorization` header.
2. The Agent Substrate egress gateway replaces the placeholder with a JSON Web Token (JWT) that identifies the {{< gloss "Actor" >}}Actor{{< /gloss >}}. The token is valid for five minutes, and its audience is `kagent-runtime`. The gateway adds the token only to calls to the controller. Actor snapshots do not store the token.
3. The controller verifies the token's signature, issuer, audience, and lifetime, and allows 30 seconds of clock skew. The controller then binds the token to the Actor's current Session. The controller rejects a token that fails verification, and does not fall back to user authentication.

An authenticated Actor can read its own Agent and use its own task state and memories. The Actor can also read, update, and send messages to its own Session. The Actor cannot create or delete a Session, use a share, reach any other Session, or act with its owner's permissions. That restriction includes other Sessions of the same agent and the same owner.

The controller trusts the issuer in the `config.substrate.actorJwtIssuer` Helm value, which must match the `ateApi.actorJWTIssuer` value of the Agent Substrate chart. Both values default to `https://idp.ate-system.svc`, so change them only together. The controller fetches the issuer's signing keys at startup, and a controller that cannot reach the issuer does not start.

Upgrade the controller and the runtime images together. An Actor snapshot from an earlier runtime image still sends an identity header that the controller no longer accepts, so you must recreate that snapshot after an upgrade.

## The Agent Substrate plane

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} authenticates its own components rather than authenticating end users. Its API server accepts Kubernetes ServiceAccount tokens issued for its audience, and the components that carry traffic to an Actor authenticate each other with mutual Transport Layer Security (mTLS). The [kagent installation guide]({{< link path="setup/installation" >}}) covers creating the certificate authority pools and the JSON Web Token (JWT) authority pool that these identities are issued from, which is a required step that no Helm chart performs.

Each Actor also carries an identity of its own, addressed as its {{< gloss "Atespace" >}}atespace{{< /gloss >}} and name together. [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}) covers how the router uses that identity to reach the right Worker over mTLS.

> [!IMPORTANT]
> Agent Substrate authenticates callers but does not authorize them. Any provider that you configure as an authenticated caller can reach every remote procedure call, including destructive ones, so configure only providers whose users require full access to Agent Substrate.
