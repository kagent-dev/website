---
title: Identity
description: Understand how kagent identifies each caller, scopes a Session to its creator, and identifies an agent to the services that it calls.
weight: 30
author: kagent.dev
aliases:
  - /kagent/1.x/substrate-runtime/identity/
---

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation identifies each kind of caller with a different system.

- An operator applying a {{< gloss "Harness" >}}Harness{{< /gloss >}} is authenticated by [Kubernetes](#the-kubernetes-plane).
- A caller that reaches [kagent's gRPC API](#the-kagent-control-plane) is assigned a principal by kagent, both for a {{< gloss "Session" >}}Session{{< /gloss >}} and for the resources that the API writes.
- A workload with no person signed in can call the API as its [Kubernetes ServiceAccount](#service-account-callers).
- An agent's runtime calls the same API with a [token that Agent Substrate issues](#agent-runtime-calls).
- A service that an agent calls can receive an [Actor token](#actor-tokens-for-other-services) that identifies the agent.
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
| `insecure` | Every request is admitted. The caller's identity is read from the `X-User-Id` header, or from a `user_id` query parameter that takes precedence over it. A caller that supplies neither is named `admin@kagent.dev`. **The caller selects its own principal.** The authenticator verifies neither the header nor the query parameter, and the same authenticator guards the controller's `/mcp` endpoint. Treat the principal on a call as a label that the caller chose, and restrict network access to both endpoints. |
| `trusted-proxy` | The request must carry a bearer token in the `Authorization` header. The identity comes from the claim that `config.server.auth.userIdClaim` names, defaulting to `sub`. A missing custom claim falls back to `sub`, and a request with no identity is rejected. **The authenticator decodes the token without verifying it.** It checks neither the signature nor the expiry, because it assumes that an upstream boundary already validated the credential. A caller that reaches the controller directly can present a token that it wrote itself. Use this mode only where ingress validates every token before forwarding it, and network policy stops anything else from reaching port `8083`. |

Any other value stops the controller from starting.

Authorization is separate from both modes. For user calls, kagent installs an authorizer that permits every check regardless of the authentication mode, so neither mode constrains what an authenticated user can do. For agent runtime calls, kagent applies a fixed policy that limits each Actor to its own resources. For more information, see [Agent runtime calls](#agent-runtime-calls).

### Service account callers

Automation that runs with no person signed in, such as a CI pipeline, a scheduled job, or another service in the cluster, needs its own identity to create and use Sessions. Neither user authentication mode gives it a verified one. In `insecure` mode, the workload names itself. In `trusted-proxy` mode, the controller trusts a token that an upstream proxy validated, and does not verify the token itself. Service account authentication lets the workload call the controller as its Kubernetes ServiceAccount, and the controller verifies that identity with Kubernetes.

Service account authentication is off by default and works alongside either user authentication mode. To turn it on, set `config.server.auth.serviceAccount.authority` in your Helm values. The authority is a name that you choose for the cluster that issues the tokens. The chart then grants the controller permission to create TokenReviews.

```yaml
config:
  server:
    auth:
      serviceAccount:
        authority: prod-cluster
```

The workload sends a ServiceAccount token whose audience is `kagent-invocation` as a bearer token in the `Authorization` header. A workload usually mounts the token as a projected volume. To test from a terminal, create a token with `kubectl`, port-forward the controller's port `8083`, and call the API. The `grpcurl` command relies on gRPC reflection, so your installation must set `config.server.grpcReflection=true`.

```bash
kubectl port-forward -n kagent deployment/kagent-controller 8083:8083 &
TOKEN=$(kubectl create token scheduler -n ci-bots --audience kagent-invocation)
grpcurl -plaintext -H "Authorization: Bearer $TOKEN" -d '{}' \
  localhost:8083 kagent.api.v1.SystemService/GetCurrentUser
```

Example output:

```console
{
  "claims": {
    "groups": [
      "system:serviceaccounts",
      "system:serviceaccounts:ci-bots",
      "system:authenticated"
    ],
    "username": "system:serviceaccount:ci-bots:scheduler"
  }
}
```

The controller verifies the token through the Kubernetes TokenReview API of its own cluster. A token that has a `kubernetes.io` claim, or a subject that starts with `system:serviceaccount:`, always goes to this verifier. When verification fails, the controller rejects the call as unauthenticated and does not fall back to the user authentication mode. A ServiceAccount token whose audience is not `kagent-invocation` therefore fails, including a token for the default API server audience. Each controller caches a successful review for up to 30 seconds, so a deleted ServiceAccount or a revoked token keeps working for that interval.

kagent builds the caller's principal from the authority and the ServiceAccount's UID, and records that principal as an opaque creator ID, such as `a3ViZXJuZXRlczpwcm9kLWNsdXN0ZXI.MTZkYjk1N2Qt...`. The [creator ownership](#creator-ownership) rules then scope the workload's Sessions in the same way as a user's, and the workload gets the same authorization as a user. Rotating the ServiceAccount's token keeps the principal so that the workload keeps its Sessions. Deleting and recreating the ServiceAccount gives it a new UID and a new principal, and the workload loses access to the Sessions that it created.

When an agent forwards the caller's token to a model or MCP server that sets `tokenPassthrough`, that destination receives the ServiceAccount token. The token keeps its kagent authority until it expires. Set `tokenPassthrough` only on destinations that you trust with that authority.

### Resources that the API writes

kagent's gRPC API also writes Harness and AgentTemplate resources. The AgentTemplate service creates, updates, and deletes AgentTemplates, and the Harness service creates and deletes Harnesses, both through the kagent controller. The `kagent apply -f` command calls the AgentTemplate service, and any client that reaches the gRPC endpoint can call either service. The controller writes these resources with its own service account rather than the caller's, so Kubernetes RBAC never evaluates the caller. The controller's authenticator resolves the caller instead, as described in [Controller authentication modes](#controller-authentication-modes).

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

A client that creates a share can set `CreateSessionShareRequest.ttl` to a positive lifetime. The lifetime starts when the share is created. Once that lifetime ends, the token does not grant access, and a token lookup returns not found. The owner still sees the expired share in `ListSessionShares` and can revoke it.

The returned `SessionShare.expiresAt` field records when the token stops granting access. When `ttl` is omitted, `expiresAt` stays unset, and the share stays valid until it is revoked or the Session is deleted. An operator caps share lifetimes with `config.sessions.shareMaxTtl`. For more information, see [Expire idle Sessions]({{< link path="operations/operational-considerations#expire-idle-sessions" >}}).

A share widens what the holder can reach to what the owner can see, and the underlying record is read as the owner rather than as the visitor. Revoking the share withdraws that access.

### Agent runtime calls

An agent's runtime calls the controller to store task state and memories, and to read its own Agent and Session. These calls arrive on the same port as user calls, `8083`. However, the controller authenticates agent runtime calls separately from the user authentication mode. The task state and memory calls that only an agent makes always need a valid token, even in `insecure` mode. The controller treats a call that sends no `Authorization` header as a user call, and applies the user authentication mode to it.

The runtime, the Agent Substrate egress gateway, and the controller each take one step to authenticate a call.

1. The runtime sends a placeholder bearer token in the `Authorization` header.
2. The Agent Substrate egress gateway replaces the placeholder with a JSON Web Token (JWT) that identifies the {{< gloss "Actor" >}}Actor{{< /gloss >}}. The token is valid for five minutes, and its audience is `kagent-runtime`. The gateway adds the token only to calls to the controller. Actor snapshots do not store the token.
3. The controller verifies the token's signature, issuer, audience, and lifetime, and allows 30 seconds of clock skew. The controller then binds the token to the Actor's current Session. The controller rejects a token that fails verification, and does not fall back to user authentication.

An authenticated Actor can read its own Agent and use its own task state and memories. The Actor can also read, update, and send messages to its own Session. The Actor cannot create or delete a Session, use a share, reach any other Session, or act with its owner's permissions. That restriction includes other Sessions of the same agent and the same owner.

The controller trusts the issuer in the `config.substrate.actorJwtIssuer` Helm value. This value must match the `ateApi.actorJWTIssuer` value of the Agent Substrate chart. Both values default to `https://idp.ate-system.svc`, so change them only together. The controller fetches the issuer's signing keys at startup, and a controller that cannot reach the issuer does not start.

Upgrade the controller and the runtime images together. An Actor snapshot from an earlier runtime image still sends an identity header that the controller no longer accepts, so you must recreate that snapshot after an upgrade.

### Actor tokens for other services

An internal service that an agent calls, such as a large language model (LLM) gateway, an MCP server, or an API, might need to know which agent is calling so that it can authorize or audit the call. The other credentials do not identify the agent. A Secret-backed API key is the same for every agent that uses it, and `tokenPassthrough` forwards the identity of the user who started the Session. An unattended run has no such user.

An Actor token identifies the calling {{< gloss "Actor" >}}Actor{{< /gloss >}} instead. The token is a short-lived JWT from the same Agent Substrate issuer that signs the tokens in [Agent runtime calls](#agent-runtime-calls), minted for an audience that you name. The egress gateway mints, injects, and refreshes the token, and the token never enters the runtime, so no Secret needs to be stored or rotated.

Turn the token on for one destination in one of the following places:

- A ModelConfig, in its `actorJwt` field. For more information, see [Authenticate as the Actor]({{< link path="setup/model-providers/about-model-providers#authenticate-as-the-actor" >}}).
- A RemoteMCPServer, in its `actorJwt` field. For more information, see [Actor token authentication]({{< link path="skills-and-mcp/about-tools#actor-token-authentication" >}}).
- An EgressPolicy destination, in its `authentication.actorJwt` field. For more information, see [Inject the Actor's token]({{< link path="agents/egress-policies#inject-the-actors-token" >}}).

All three fields accept the same two settings, and only `audiences` is required.

| Field | Description |
| ----- | ----------- |
| `audiences` | Required. The services that can accept the token, between 1 and 16 unique values. The API server rejects `kagent-runtime`, because that audience is reserved for calls to the controller. |
| `expirationSeconds` | Optional. The token lifetime, between 300 and 3600 seconds. Defaults to 900. |

The receiving service gets a token that is signed with ES256 and contains the following claims:

```json
{
  "iss": "https://idp.ate-system.svc",
  "sub": "actor/kagent/session-01a18e6c-4454-7597-ba2b-e962d0f53967",
  "aud": ["ticket-api"],
  "actor.ate.dev": {
    "atespace": "kagent",
    "actorName": "session-01a18e6c-4454-7597-ba2b-e962d0f53967",
    "actorUID": "3d0d0f07-40fb-4493-a7cd-3cb7f2d79c3b"
  }
}
```

The `actor.ate.dev` claim names the Actor's {{< gloss "Atespace" >}}atespace{{< /gloss >}}, name, and UID. The atespace is the namespace of the Agent or SandboxTemplate. The token also contains the standard `exp`, `nbf`, `iat`, and `jti` claims. Each Session runs as its own Actor, so the Actor's name and UID change with every Session. To authorize a team or an environment from the token alone, base the decision on the atespace. To authorize by Agent, use the [Agent lookup](#agent-lookup).

The receiving service must check the issuer, the signature, its own audience, and the time claims. The issuer is the `ateApi.actorJWTIssuer` value of the Agent Substrate chart. The issuer publishes its OpenID Connect discovery document at `/.well-known/openid-configuration` and its signing keys at `/openid/v1/jwks`. When `ateApi.actorJWTIssuer` is set to its default, the service reaches both over TLS inside the cluster, so it must also trust the certificate that the issuer serves.

#### Agent lookup

The token names the Actor and its atespace, but not the Agent. A receiving service that authorizes or audits by Agent can send the token to the controller's `kagent.api.v1.AgentIdentityService/ResolveAgentIdentity` method on port `8083`. The controller accepts only a token whose audiences include `kagent-agent-info`. Add that audience next to the service's own audience in the `actorJwt` field of the ModelConfig, RemoteMCPServer, or EgressPolicy that injects the token.

```yaml
actorJwt:
  audiences: [ticket-api, kagent-agent-info]
```

The service sends the token that it received as a bearer token, with an empty request. In the following command, `$ACTOR_TOKEN` holds that token. The `grpcurl` command relies on gRPC reflection, so your installation must set `config.server.grpcReflection=true`. The `-rpc-header` flag keeps the token off the reflection requests.

```bash
grpcurl -plaintext -rpc-header "Authorization: Bearer $ACTOR_TOKEN" -d '{}' \
  kagent-controller.kagent.svc.cluster.local:8083 \
  kagent.api.v1.AgentIdentityService/ResolveAgentIdentity
```

Example output:

```console
{
  "agent": {
    "namespace": "kagent",
    "name": "ticket-assistant",
    "uid": "606e209e-e4a5-4520-929e-5a7f6f3d1926",
    "labels": {
      "team": "support"
    },
    "annotations": {
      "description": "Ticket triage"
    }
  },
  "sessionId": "01a18efc-83f3-7b12-a30a-73906fe617b0",
  "runtimeRevision": "577c2a575fac1bf237a1fcac7674bc843feb1158b438f1c26d71bf73b735dc54"
}
```

The response contains the Agent's namespace, name, UID, labels, and annotations, and the ID of the Session and the revision that the Actor runs. The labels and annotations are the Agent's current values, returned unchanged. They include `kubectl.kubernetes.io/last-applied-configuration` when you applied the Agent with `kubectl apply`, so the service can read the Agent's full manifest. Do not put values in an Agent's labels or annotations that the receiving service must not see. The Session ID does not give the service access to the Session.

A token without the `kagent-agent-info` audience fails with `Invalid Agent identity credential`. A token from a deleted Session, or from an Agent that was deleted and recreated, also does not resolve.

## The Agent Substrate plane

{{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} authenticates its own components rather than authenticating end users. Its API server accepts Kubernetes ServiceAccount tokens issued for its audience, and the components that carry traffic to an Actor authenticate each other with mutual Transport Layer Security (mTLS). `kagent install` creates the certificate authority pools and the JWT authority pool that these identities are issued from. No Helm chart creates these pools. For an installation that you manage with Helm, see [Export the installation to Helm]({{< link path="operations/export-to-helm" >}}).

Each Actor also carries an identity of its own, addressed as its {{< gloss "Atespace" >}}atespace{{< /gloss >}} and name together. [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}) covers how the router uses that identity to reach the right Worker over mTLS.

> [!IMPORTANT]
> Agent Substrate authenticates callers but does not authorize them. Any provider that you configure as an authenticated caller can reach every remote procedure call, including destructive ones, so configure only providers whose users require full access to Agent Substrate.
