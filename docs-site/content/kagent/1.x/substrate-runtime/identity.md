---
title: Identity
description: Understand how kagent authenticates callers, scopes an AgentInstance to its creator, and how Agent Substrate identifies its own components.
weight: 30
author: kagent.dev
---

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation authenticates three different kinds of caller, and each one is handled by a different system. This page describes what each layer establishes, and what it does not.

- An operator applying a {{< gloss "Harness" >}}Harness{{< /gloss >}} is authenticated by [Kubernetes](#the-kubernetes-plane).
- A caller creating or talking to an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} is authenticated by [kagent's own gRPC API](#the-kagent-plane).
- The components inside [Agent Substrate](#the-agent-substrate-plane) authenticate each other.

## The Kubernetes plane

Harness and AgentTemplate are Kubernetes custom resources, so Kubernetes role-based access control (RBAC) governs who can create, read, edit, or delete them with `kubectl`. A cluster's existing roles and bindings decide who authors an agent's runtime and its behavior on that path.

kagent's gRPC API reaches the same two resources by a second path. The AgentTemplate service creates, updates, and deletes AgentTemplates, and the Harness service creates and deletes Harnesses, both through the kagent controller. The `kagent apply -f` command calls the AgentTemplate service, and any client that reaches the gRPC endpoint can call either service. The controller writes these resources with its own service account rather than the caller's, so Kubernetes RBAC never evaluates the caller. The kagent plane authorizes this path instead.

> [!WARNING]
> The open source build neither authenticates nor authorizes this path: the authenticator it installs admits every request, and the authorizer it installs permits every check. Any caller that reaches the gRPC endpoint can author an agent's runtime and behavior, whatever their Kubernetes permissions are. Do not expose port `8083` outside the cluster. For the identity that the open source build gives an anonymous caller, see [The kagent plane](#the-kagent-plane).

A Harness's `allowedAgentTemplates` selector adds a second, narrower control on top of RBAC. Whoever holds edit access on a Harness decides which AgentTemplates that Harness admits. In this way, RBAC governs who can write the resources, and the selector governs which pairs can run. For more information on the one-way match, see the [Harness core concept]({{< link path="about/core-concepts/#harness" >}}).

## The kagent plane

An AgentInstance is not a Kubernetes resource. kagent's gRPC API creates the AgentInstance and kagent's database tracks it, so Kubernetes RBAC does not reach it. kagent authenticates these calls itself.

Every call on the AgentInstance API carries a principal. An authenticator resolves one before the request reaches the service, and a call that the authenticator declines is rejected as unauthenticated before any other check runs.

> [!WARNING]
> The authenticator that the open source build installs declines nothing. It reads the caller's identity from the `X-User-Id` header or the `user_id` query parameter, and verifies neither. When both are absent, it names the caller `admin@kagent.dev`. A caller therefore selects its own principal. The same authenticator guards the controller's `/mcp` endpoint. kagent's core library takes its authenticator from the program that embeds it. A distribution that verifies caller identity supplies one of its own.

### Creator ownership

kagent records a **creator** on every AgentInstance, taken from the authenticated principal that created it. That creator is then part of the database query for every read, so a caller who asks for an AgentInstance that another principal created receives a not-found response rather than a permission error.

Listing behaves the same way. A list returns the caller's own AgentInstances by default. A caller that sets the request's all-creators flag asks to widen that to every creator in the namespace, and kagent authorizes that request separately from an ordinary list.

> [!IMPORTANT]
> Creator ownership separates callers in the open source build without containing them. kagent calls an authorizer before every AgentInstance operation. The authorizer that this build installs permits every check, so any caller can widen a list. The same build also lets a caller name its own principal. A caller that presents another creator's identifier reads that creator's AgentInstances. Creator scoping keeps one user's conversations out of another user's list. It is not a security boundary.

### Shares

A share lets an AgentInstance's owner give another account access to that one conversation. Creating a share produces a token, and a caller presenting that token reaches the shared AgentInstance without becoming its creator.

A share carries one of two permissions.

- **`READ_ONLY`**: The holder can read the conversation. kagent refuses any call that is not a read before the request reaches the service.
- **`READ_WRITE`**: The holder can also send messages to the AgentInstance.

A share widens what the holder can reach to what the owner can see, and the underlying record is read as the owner rather than as the visitor. Revoking the share withdraws that access.

## The Agent Substrate plane

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} authenticates its own components rather than authenticating end users. Its API server accepts Kubernetes ServiceAccount tokens issued for its audience, and the components that carry traffic to an Actor authenticate each other with mutual Transport Layer Security (mTLS). The [kagent installation guide]({{< link path="setup/installation" >}}) covers creating the certificate authority pools and the JSON Web Token (JWT) authority pool that these identities are issued from, which is a required step that no Helm chart performs.

Each Actor also carries an identity of its own, addressed as its {{< gloss "Atespace" >}}atespace{{< /gloss >}} and name together. [Sandboxing]({{< link path="substrate-runtime/sandboxing" >}}) covers how the router uses that identity to reach the right Worker over mTLS.

> [!IMPORTANT]
> Agent Substrate authenticates callers but does not authorize them. Any provider that you configure as an authenticated caller can reach every remote procedure call, including destructive ones, so configure only providers whose users require full access to Agent Substrate.
