---
title: Networking and egress control
description: Learn how Agent Substrate authorizes the outbound connections that your agents open, and how kagent builds the allowlist it enforces.
weight: 40
author: kagent.dev
---

An agent reaches the network only through Agent Substrate's egress gateway, and the gateway authorizes every connection against a policy attached to that {{< gloss "Actor" >}}Actor{{< /gloss >}}. The policy is default-deny: an Actor with no policy makes no outbound request at all. kagent builds the policy for you from the AgentTemplate. A documented agent therefore works without any egress configuration of its own.

> [!IMPORTANT]
> The gateway terminates TLS, so hostname rules constrain encrypted traffic as well as cleartext. An HTTPS request is decrypted at the gateway, matched against the policy's hostnames, and re-originated to the destination. An opaque TCP tunnel is the exception, because it carries no request for the gateway to read. For details, see [Traffic types](#traffic-types).

For the inbound half of the picture, and for the NetworkPolicy that protects Workers, see [Sandboxing]({{< link path="substrate-runtime/sandboxing#default-network-posture" >}}).

## How the gateway authorizes a connection

Outbound traffic leaves a Worker through the egress gateway rather than directly out. That single chokepoint gives Agent Substrate one place to identify the caller and apply rules, and the gateway does both on every connection.

The gateway identifies the Actor from the client certificate that the connection presents, reading the Actor's SPIFFE ID out of a verified certificate rather than from anything in the request. Nothing running inside the tunnel can set or change that identity, and a request that arrives without one is refused. Two Actors that dial the same address never share a connection pool, so neither inherits the other's identity.

The gateway then authorizes the request against the Actor's `EgressPolicy`. An Actor has at most one, named `default`. The policy holds an ordered list of rules, and the gateway takes the **first** rule that matches: only that rule applies, and evaluation stops even when a later rule would also match. **A request that matches no rule is denied, and an Actor with no policy at all gets no outbound connection.** A rule can match only what the gateway can read of the request.

> [!NOTE]
> Rule order is significant, and a policy holds at most 256 rules. Because the first match wins, a broad rule placed early makes every narrower rule after it unreachable.

### Traffic types

The gateway allows or denies a request on one of two things: the `Host` header of the request, or the address the Actor dialed. Which of the two it uses depends on whether the traffic carries a request that the gateway can read. That difference splits egress into three cases worth keeping apart.

- **Cleartext HTTP**: The gateway reads the `Host` header, so hostname rules apply and a request that matches no rule is refused.
- **TLS**: The gateway terminates the connection with a certificate minted for the destination name, reads the request inside, and matches it against hostname rules exactly as it does cleartext. It then re-originates its own TLS connection to the destination. An allowed request appears in the gateway log with the `http.host` and `http.path` it was matched on.
- **Opaque TCP**: A tunnel that carries no HTTP request gives the gateway nothing to read, so the gateway allows or denies it by address, at its outer hop. Express those destinations as a `cidrs` rule, because a hostname rule has nothing to match against.

Enforcing hostname rules against encrypted traffic has a cost: because the gateway terminates TLS, it holds the cleartext of every agent request for as long as it takes to authorize it. Holding the cleartext also lets the gateway attach credentials on the agent's behalf. For more information, see [Credential injection](#credential-injection).

## Rule matching

Each rule matches on exactly one kind of destination, and that kind also determines how the gateway dials a connection that the rule allows.

| Rule | Matches | How the gateway dials a match |
| ---- | ------- | ----------------------------- |
| `hostnames` | The request's hostname, against a list of DNS name patterns. | Resolves the name and dials it by name. |
| `cidrs` | The original destination IP, against a list of IPv4 or IPv6 prefixes. | Dials the original address. |
| `all` | Every destination. | Dials the original address. |

A hostname pattern is a DNS name, optionally with a `*` wildcard replacing the complete leftmost label. The wildcard matches exactly one non-empty label, so `*.example.com` matches `api.example.com` but matches neither `example.com` nor `nested.api.example.com`. No other wildcard syntax is accepted, and a pattern without one matches only the complete name. Patterns must be lowercase, must not carry a trailing dot, and must use the punycode form for an internationalized name. A URL, a bare IP address, and a name with a port are all rejected rather than coerced.

A CIDR prefix must be canonical, with every bit after the prefix length set to zero, such as `192.0.2.0/24` or `2001:db8::/32`.

## Policy generation

kagent derives the allowlist from the AgentTemplate rather than taking it as configuration, so the policy always describes what the agent was actually compiled to need. Each {{< gloss "Revision" >}}revision{{< /gloss >}} records the hosts its agent depends on:

- The model provider endpoint, from the ModelConfig.
- Every RemoteMCPServer, HTTP tool, and SSE tool that the AgentTemplate binds.
- Every skill artifact source, such as a git or OCI registry host.
- The OpenTelemetry collector, for each telemetry signal that is enabled.

kagent compiles that set into the Actor's policy as it creates the Actor. Each destination that carries a credential takes its own `hostnames` rule, placed first so that the rule holding the credential is the one that matches. The remaining destinations follow as a single `hostnames` rule, and any destination given as a literal IP address becomes one `cidrs` rule at the end.

> [!IMPORTANT]
> No field adds an arbitrary host to the allowlist. A destination becomes reachable by being named in the AgentTemplate as a model endpoint, an MCP server, an HTTP tool, or a skill source. kagent writes these as hostname rules, which the gateway enforces against encrypted and cleartext requests alike, so the allowlist is the limit of what an agent can reach over HTTP and HTTPS rather than only a record of intent.

The collector host for agents on the `kagent`, `codex`, and `claude` runtimes is added automatically. The host for an agent on the `byo` runtime is not, so a BYO image that exports its own telemetry has no route to a collector. For more information, see [Tracing]({{< link path="observability/tracing" >}}).

## Policy changes

The gateway caches each Actor's policy rather than fetching it per request, so a change takes effect on a delay rather than instantly. The cache holds an entry for 10 seconds by default, and that interval is the upper bound on the lag: a policy that is created, updated, or deleted reaches new requests within one interval. Deleting a policy becomes a denial rather than an absence of one.

Because an AgentInstance pins the revision it was created from, changing an AgentTemplate does not move an existing conversation onto a new allowlist. Create a new AgentInstance to pick up a changed set of destinations.

## Diagnose a denied request

A denied request fails without explaining itself: the agent sees a rejected call, and the agent's own error text names neither the destination nor the rule. The gateway records the reason instead.

```bash
kubectl logs -n ate-system deploy/atenet-egress -c agentgateway --tail=100
```

A denial appears as a `403` carrying the Actor that made the request, the host it asked for, and why the request failed.

```console
error request ... http.host=kagent-tools.kagent http.status=403
  ate.actor.name=ai-01a0abbb-ad73-7dfb-a86e-f2a643dc4dc9 ate.atespace=kagent
  error="actor egress policy denied: ... \"EgressPolicy not found\"" reason=Authorization
```

Read `reason=Authorization` as the policy refusing the request, and the `error` text as which check failed. An allowed request is logged the same way, with its status, the `http.host` and `http.path` it was matched on, and the `substrate.connect.authority` address the Actor originally dialed. The log is therefore the quickest way to see what an agent actually reaches.

The compiled policy is not readable through `kubectl` or `kagent`, so treat the AgentTemplate as the source of truth for what an agent is meant to reach. If a destination is missing, it is missing from the AgentTemplate.

## Credential injection

An egress rule can declare that the gateway attach a credential to a matching request, so that an agent reaches a protected service without ever holding the secret itself. A `hostnames` rule carries the effect, which names the header to set, an optional prefix such as `Bearer `, and an `ate-secret://` reference that a registered credential provider resolves.

kagent writes these effects for you. Every ModelConfig that holds an `apiKeySecret` becomes a credential binding on the rule for that model's host, as does every RemoteMCPServer whose `headersFrom` reads a Secret. The gateway resolves the reference as the request passes through, so the agent's own environment never holds the key.

> [!NOTE]
> The gateway injects a credential only on a connection that it terminates, and only when a credential provider is configured for the reference's authority. Where either is missing, the request reaches the destination **without** the credential rather than being denied. Once injection is attempted and fails, the request fails closed: `403` when the provider does not hold the credential or refuses to release it, and `503` when the provider is unreachable.
