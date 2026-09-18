---
title: Networking and egress control
description: Learn how Agent Substrate authorizes the outbound connections that your agents open, and how kagent builds the allowlist it enforces.
weight: 40
author: kagent.dev
---

An agent reaches the network only through Agent Substrate's egress gateway, and the gateway authorizes every connection against a policy attached to that {{< gloss "Actor" >}}Actor{{< /gloss >}}. The policy is default-deny: an Actor with no policy makes no outbound request at all. kagent builds the policy for you from the AgentTemplate, which is why a documented agent works without any egress configuration of its own.

> [!IMPORTANT]
> How much a hostname rule constrains depends on what the gateway can read. A request the gateway reads in the clear is matched against the policy's hostnames. An encrypted connection is not: the gateway sees only the address the Actor dialed, so a policy made only of hostname rules does not restrict which HTTPS destination an Actor reaches. Treat the allowlist as a control over cleartext traffic, and as a record of intent for the rest, until you deploy the TLS-terminating gateway. For the detail, see [What the gateway can read](#what-the-gateway-can-read).

For the inbound half of the picture, and for the NetworkPolicy that protects Workers, see [Sandboxing]({{< link path="substrate-runtime/sandboxing#default-network-posture" >}}).

## How the gateway decides

Outbound traffic leaves a Worker through the egress gateway rather than going straight out, which gives Agent Substrate one place to identify the caller and apply rules. The gateway does both on every connection.

It identifies the Actor from the client certificate that the connection presents, reading the Actor's SPIFFE ID out of a verified certificate rather than from anything in the request. Nothing running inside the tunnel can set or change that identity, and a request that arrives without one is refused. Two Actors that dial the same address never share a connection pool, so neither inherits the other's identity.

It then authorizes the request against the Actor's `EgressPolicy`. An Actor has at most one, named `default`. The policy holds an ordered list of rules, and the gateway takes the **first** rule that matches: only that rule applies, and evaluation stops even when a later rule would also match. **A request that matches no rule is denied, and an Actor with no policy at all gets no outbound connection.** Which rules can match a given request depends on what the gateway can read of it, as the next section describes.

> [!NOTE]
> Rule order is significant, and a policy holds at most 256 rules. Because the first match wins, a broad rule placed early makes every narrower rule after it unreachable.

### What the gateway can read

The gateway decides a request on its `Host` and on the address the Actor dialed, and only the first of those survives encryption. That splits egress into two cases worth keeping apart.

- **Cleartext HTTP.** The gateway reads the `Host` header, so hostname rules apply and a request that matches no rule is refused. This is the case where the allowlist does the work you would expect.
- **TLS.** The default gateway does not terminate TLS, so it cannot read the request inside the tunnel. The connection is decided at its outer hop, by address. A policy that holds hostname rules but no address rule lets that connection open, because a request inside it might have been allowed by name, and nothing then checks the name. **The practical result is that hostname rules do not restrict HTTPS destinations on a default installation.**

Agent Substrate ships a second, TLS-terminating gateway that re-originates the connection and evaluates the inner request the same way as cleartext. Deploy it if you need hostname rules enforced against HTTPS. To restrict encrypted traffic without it, express the destination as a `cidrs` rule, which the outer hop can evaluate.

## What a rule can match

Each rule matches on exactly one kind of destination. Which kind it is also decides how the gateway dials the connection, so the two are worth reading together.

| Rule | Matches | How the gateway dials a match |
| ---- | ------- | ----------------------------- |
| `hostnames` | The request's hostname, against a list of DNS name patterns. | Resolves the name and dials it by name. |
| `cidrs` | The original destination IP, against a list of IPv4 or IPv6 prefixes. | Dials the original address. |
| `all` | Every destination. | Dials the original address. |

A hostname pattern is a DNS name, optionally with a `*` wildcard replacing the complete leftmost label. The wildcard matches exactly one non-empty label, so `*.example.com` matches `api.example.com` but matches neither `example.com` nor `nested.api.example.com`. No other wildcard syntax is accepted, and a pattern without one matches only the complete name. Patterns must be lowercase, must not carry a trailing dot, and must use the punycode form for an internationalized name. A URL, a bare IP address, and a name with a port are all rejected rather than coerced.

A CIDR prefix must be canonical, with every bit after the prefix length set to zero, such as `192.0.2.0/24` or `2001:db8::/32`.

## What kagent puts in the policy

kagent derives the allowlist from the AgentTemplate rather than taking it as configuration, so the policy always describes what the agent was actually compiled to need. Each {{< gloss "Revision" >}}revision{{< /gloss >}} records the hosts its agent depends on:

- The model provider endpoint, from the ModelConfig.
- Every RemoteMCPServer, HTTP tool, and SSE tool the AgentTemplate binds.
- Every skill artifact source, such as a git or OCI registry host.
- The OpenTelemetry collector, for each telemetry signal that is enabled.

kagent compiles that set into the Actor's policy as it creates the Actor, as one `hostnames` rule and, for any destination given as a literal IP address, one `cidrs` rule.

> [!IMPORTANT]
> No field adds an arbitrary host to the allowlist. A destination becomes reachable by being named in the AgentTemplate as a model endpoint, an MCP server, an HTTP tool, or a skill source. Because kagent writes these as hostname rules, they are enforced against cleartext requests rather than against encrypted ones, so read this allowlist as the set of destinations the agent is *meant* to reach rather than as the limit of what it *can* reach over HTTPS.

Agents on the `kagent`, `codex`, and `claude` runtimes get their collector host added automatically. An agent on the `byo` runtime does not, so a BYO image that exports its own telemetry has no route to a collector. For more information, see [Tracing]({{< link path="observability/tracing" >}}).

## When a policy changes

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

Read `reason=Authorization` as the policy refusing the request, and the `error` text as which check failed. An allowed request is logged the same way, with its status and, for an encrypted connection, the `tls.sni` it was opened for, which makes the log the quickest way to see what an agent actually reaches.

The compiled policy is not readable through `kubectl` or `kagent`, so treat the AgentTemplate as the source of truth for what an agent is meant to reach. If a destination is missing, it is missing from the AgentTemplate.

## Credential injection

An egress rule can declare that the gateway attach a credential to a matching request, so that an agent reaches a protected service without ever holding the secret itself. A `hostnames` rule carries the effect, which names the header to set, an optional prefix such as `Bearer `, and a `substrate-secret://` reference that a registered credential provider resolves.

> [!WARNING]
> Credential injection is declared in the API but is not yet implemented. A request that matches a rule declaring one is **denied with a 501 response** rather than forwarded without the credential, so do not add the effect to a policy expecting it to be ignored. kagent does not generate rules that use it.
