---
title: Identity
description: Understand how kagent resolves a caller's identity, scopes a Session to its creator, and how Agent Substrate identifies its own components.
weight: 30
author: kagent.dev
---

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation identifies three different kinds of caller, and each one is handled by a different system. This page describes what each layer establishes, and what it does not.

- An operator applying a {{< gloss "Harness" >}}Harness{{< /gloss >}} is authenticated by [Kubernetes](#the-kubernetes-plane).
- A caller creating or talking to a {{< gloss "Session" >}}Session{{< /gloss >}} is assigned a principal by [kagent's own gRPC API](#the-kagent-plane).
- The components inside [Agent Substrate](#the-agent-substrate-plane) authenticate each other.

## The Kubernetes plane

Harness, AgentTemplate, and {{< gloss "Agent" >}}Agent{{< /gloss >}} are Kubernetes custom resources. Kubernetes role-based access control (RBAC) therefore governs who can create, read, edit, or delete them with `kubectl`. A cluster's existing roles and bindings decide who authors an agent's runtime, its behavior, and the pairing of the two on that path.

kagent's gRPC API reaches the same resources by a second path. The AgentTemplate service creates, updates, and deletes AgentTemplates, and the Harness service creates and deletes Harnesses, both through the kagent controller. The `kagent apply -f` command calls the AgentTemplate service, and any client that reaches the gRPC endpoint can call either service. The controller writes these resources with its own service account rather than the caller's, so Kubernetes RBAC never evaluates the caller. The kagent plane authorizes this path instead.

> [!WARNING]
> By default, kagent neither authenticates nor authorizes this path: the `insecure` authenticator admits every request, and the authorizer it installs permits every check. Any caller that reaches the gRPC endpoint can author an agent's runtime and behavior, whatever their Kubernetes permissions are. Do not expose port `8083` outside the cluster. For the identity that this mode gives an anonymous caller, and for the mode that changes it, see [The kagent plane](#the-kagent-plane).

An Agent is where RBAC decides which template runs on which Harness, because neither reusable resource names the other. Whoever can write Agents in a namespace decides every pairing in it, whatever their access to the Harnesses and AgentTemplates that those Agents name. For the pairing itself, see the [Agent core concept]({{< link path="about/core-concepts#agent" >}}).

## The kagent plane

A Session is not a Kubernetes resource. kagent's gRPC API creates the Session, and kagent's database tracks it. Kubernetes RBAC therefore does not reach it. kagent resolves a principal for these calls itself.

Every call on the Session API carries a principal. An authenticator resolves one before the request reaches the service, and a call that the authenticator declines is rejected as unauthenticated before any other check runs.

### Controller authentication modes

The `controller.auth.mode` Helm value selects which authenticator the controller installs. The chart defaults to `insecure`, and enabling the bundled oauth2-proxy does not change it. Browser sign-in and controller authentication are separate boundaries. A deployment that wants both sets this value as well.

| Mode | How a principal is resolved |
| ---- | --------------------------- |
| `insecure` | Every request is admitted. The caller's identity is read from the `X-User-Id` header, or from a `user_id` query parameter that takes precedence over it. A caller that supplies neither is named `admin@kagent.dev`. |
| `trusted-proxy` | The request must carry a bearer token in the `Authorization` header. The identity comes from the claim that `controller.auth.userIdClaim` names, defaulting to `sub`. A missing custom claim falls back to `sub`, and a request with no identity is rejected. |

Any other value fails controller startup rather than falling back to a default.

> [!WARNING]
> **`trusted-proxy` decodes the token without verifying it.** The authenticator reads the bearer token's payload and checks neither its signature nor its expiry, because it assumes that an upstream boundary already validated the credential. A caller that reaches the controller directly can therefore present a token that it wrote itself. This mode is safe only where ingress validates every token before forwarding it, and network policy stops anything else from reaching port `8083`.

> [!WARNING]
> **`insecure` lets a caller select its own principal.** It verifies neither the header nor the query parameter, and the same authenticator guards the controller's `/mcp` endpoint. Treat the principal on a call as a label that the caller chose, and restrict network access to both endpoints rather than relying on it.

Authorization is separate from both modes. kagent installs an authorizer that permits every check regardless of the authentication mode, so neither mode constrains what an authenticated caller may do.

### Creator ownership

kagent records a **creator** on every Session, taken from the principal on the call that created it. That creator is then part of the database query for every read, so a caller who asks for a Session that another principal created receives a not-found response rather than a permission error.

Listing behaves the same way. A list returns the caller's own Sessions by default. A caller that sets the request's all-creators flag asks to widen that to every creator in the namespace, and kagent authorizes that request separately from an ordinary list.

> [!IMPORTANT]
> Creator ownership separates callers without containing them. kagent calls an authorizer before every Session operation, and the authorizer it installs permits every check, so any caller can widen a list. In `insecure` mode a caller also names its own principal, so a caller that presents another creator's identifier reads that creator's Sessions. Creator scoping keeps one user's conversations out of another user's list. It is not a security boundary.

### Shares

A share lets a Session's owner give another account access to that one conversation. Creating a share produces a token, and a caller presenting that token reaches the shared Session without becoming its creator.

A share carries one of two permissions.

- **`READ_ONLY`**: The holder can read the conversation. kagent refuses any call that is not a read before the request reaches the service.
- **`READ_WRITE`**: The holder can also send messages to the Session.

A share widens what the holder can reach to what the owner can see, and the underlying record is read as the owner rather than as the visitor. Revoking the share withdraws that access.

## The Agent Substrate plane

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} authenticates its own components rather than authenticating end users. Its API server accepts Kubernetes ServiceAccount tokens issued for its audience, and the components that carry traffic to an Actor authenticate each other with mutual Transport Layer Security (mTLS). The [kagent installation guide]({{< link path="setup/installation" >}}) covers creating the certificate authority pools and the JSON Web Token (JWT) authority pool that these identities are issued from, which is a required step that no Helm chart performs.

Each Actor also carries an identity of its own, addressed as its {{< gloss "Atespace" >}}atespace{{< /gloss >}} and name together. [Sandboxing]({{< link path="substrate-runtime/sandboxing" >}}) covers how the router uses that identity to reach the right Worker over mTLS.

> [!IMPORTANT]
> Agent Substrate authenticates callers but does not authorize them. Any provider that you configure as an authenticated caller can reach every remote procedure call, including destructive ones, so configure only providers whose users require full access to Agent Substrate.
