---
title: Egress control
description: Learn how Agent Substrate authorizes the outbound connections that your agents open, and how kagent builds the allowlist it enforces.
weight: 40
author: kagent.dev
aliases:
  - /kagent/1.x/substrate-runtime/networking-and-egress/
---

An agent reaches the network only through Agent Substrate's egress gateway, and the gateway authorizes every connection against a policy attached to that {{< gloss "Actor" >}}Actor{{< /gloss >}}. The policy is default-deny. An Actor can attempt any request, and the gateway denies the ones that no rule allows. kagent derives the policy from the AgentTemplate, so a documented agent works without any egress configuration of its own.

> [!NOTE]
> The gateway terminates TLS, so hostname rules constrain encrypted traffic as well as cleartext. An HTTPS request is decrypted at the gateway, matched against the policy's hostnames, and re-originated to the destination. A TLS passthrough rule is the exception, because the gateway forwards this connection without decrypting it. For details, see [Traffic types](#traffic-types).

For the inbound half of the picture, and for the NetworkPolicy that protects Workers, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing#default-network-posture" >}}).

## How the gateway authorizes a connection

All outbound traffic leaves a Worker through the egress gateway, which gives Agent Substrate one place to decide what each agent can reach. The gateway takes three steps on every connection, and each step depends on the one before it, because the Actor's identity selects the policy, and the policy supplies the rules.

1. The gateway identifies the Actor. It reads the Actor's SPIFFE ID from the client certificate on the connection from the Actor, and it verifies this certificate rather than trusting anything in the request.

2. The gateway fetches the `EgressPolicy` for this Actor. Each Actor has at most one `EgressPolicy` named `default`, and Agent Substrate addresses the policy by the Actor rather than by this name. The gateway denies every request from an Actor that has no policy, because only a policy allows access to a destination.

3. The gateway picks which rule applies to the request. Rules are an unordered set rather than a list, and exactly one rule applies to a given destination name and port regardless of its protocol. When more than one rule matches, the gateway applies two criteria in order, moving to the second only when the first ties.

   1. A matching hostname without a wildcard wins over a matching hostname with one.
   2. A matching port number wins over a rule that covers all ports.

   A request that no rule matches is denied, and only the rule that applies contributes a credential.

Policy enforcement depends on this verified identity. The Actor's identity is established only by the certificate, so the gateway authorizes every request against the Actor that actually sent it regardless of the headers or hostnames that the request carries. The gateway refuses a connection that does not present a certificate rather than falling back to a default identity. Each Actor also gets its own connection pool, even when two of them dial the same address, so that every connection carries requests from the one Actor that opened it.

> [!NOTE]
> Two rules that tie on the same name and port are rejected when the policy is admitted, so a policy never reaches the gateway with an ambiguous match. A policy holds at most 256 rules.

### Traffic types

Each rule defines the type of connection that is allowed to a destination and how the gateway determines the destination's hostname. The following connection types are allowed:

- **`http`**: Cleartext HTTP, meaning HTTP/1.1 and the h2c that gRPC uses. The gateway reads the hostname from the `Host` header and matches it against the rule's hostnames. TLS to those same names is not allowed by this rule.
- **`https`**: HTTPS, which the gateway intercepts. It terminates the connection with a certificate minted for the destination name, reads the request inside, matches it against the rule's hostnames, and re-originates its own TLS connection onward. HTTP/1.1 and HTTP/2 work inside this connection, and HTTP/3 is not supported.
- **`tls_passthrough`**: TLS forwarded to the named servers without decryption. The gateway cannot read the request, so it decides at the TLS ClientHello instead.

All three rule types cover TCP connections. Agent Substrate blocks UDP, and it does not support a protocol in which the server sends the first bytes once the connection opens, such as SMTP or SSH. The gateway reads the destination hostname from the bytes that the client sends first, so those protocols leave the gateway with nothing to match against.

Intercepting HTTPS has a cost. The gateway decrypts every agent request in order to authorize it, so the cleartext exists at the gateway for the length of that check. Decrypting also lets the gateway attach credentials on the agent's behalf. For more information, see [Credential injection](#credential-injection).

## Rule matching

Every rule names the hosts and ports that it covers, regardless of its protocol.

| Field | What it matches |
| ----- | --------------- |
| `hostnames` | A list of DNS name patterns. The rule matches when any pattern matches the destination. |
| `ports` | Either every port, or a list of up to 16 port numbers. |
| `effects` | Not a match condition. See [Credential injection](#credential-injection). |

A hostname pattern is a DNS name, optionally with a `*` wildcard replacing the complete leftmost label. The wildcard matches exactly one non-empty label, so `*.example.com` matches `api.example.com` but matches neither `example.com` nor `nested.api.example.com`. A `*` wildcard on its own matches every name. No other wildcard syntax is accepted, and a pattern without one matches only the complete name. Patterns must be lowercase, must not end with a dot, and must use the punycode form for an internationalized name.

## Policy generation

kagent derives the allowlist from the AgentTemplate rather than taking it as configuration, so the policy describes what the agent was compiled to need. Each {{< gloss "Revision" >}}revision{{< /gloss >}} records the hosts that its agent depends on:

- The model provider endpoint, from the ModelConfig.
- Every RemoteMCPServer, HTTP tool, and SSE tool that the AgentTemplate binds.
- Every skill artifact source, such as a git or OCI registry host.
- The OpenTelemetry collector, for each telemetry signal that is enabled.

kagent compiles this host set into the Actor's policy when it creates the Actor. Each destination becomes one rule that covers one hostname on one port, and the scheme decides the rule type. For example, an `https` destination becomes an `https` rule, and a cleartext destination becomes an `http` rule. Keeping exactly one rule per host and port is deliberate. An overlapping rule could otherwise decide a request and skip the credential that the narrower rule attaches. A destination that uses both HTTP and HTTPS on the same host and port is rejected rather than compiled.

The host set is fixed when kagent compiles the policy, so an agent reaches only the hosts that its AgentTemplate declares. The gateway denies every other destination, including a web page that a model decides to fetch partway through a Session.

<!-- REVIEW (egress API owner): confirm current and planned support for allowing a destination that the AgentTemplate does not name. The reviewer expects an explicit allowlist, because a generated set cannot predict every action an agent takes. Mark any future API as planned until it ships, and revisit the source-of-truth guidance under "Diagnose a denied request" when it does. -->

An agent also needs a route to the OpenTelemetry collector, or its traces never leave the sandbox and the kagent UI shows nothing for this Session. kagent adds the collector host for agents on every runtime, `byo` included. A `byo` image that exports to a telemetry backend of its own, through a Harness `spec.env` entry, has no route to that backend, because the AgentTemplate never named it. For more information, see [Runtime coverage]({{< link path="observability/tracing#runtime-coverage" >}}).

## Policy changes

The gateway caches each Actor's policy rather than fetching it per request, so policy changes are eventually consistent. The cache holds an entry for 10 seconds by default, so a policy that is created, updated, or deleted reaches new requests within that window. Deleting a policy produces denials rather than an absence of enforcement, because the gateway caches the absence too.

> [!IMPORTANT]
> A Session pins the revision it was created from, so editing an AgentTemplate does not move an existing Session onto a new allowlist. A Session keeps the destinations that it started with for however long it runs. To pick up a changed set of destinations, create a new Session.

## Diagnose a denied request

Agent Substrate does not explain why it denied a request. The agent sees a rejected call, and its own error text names neither the destination nor the rule that refused it. The gateway records the reason in its log.

```bash
kubectl logs -n ate-system deploy/atenet-egress -c agentgateway --tail=100
```

A denial appears as an HTTP `403` alongside the Actor that made the request and the host it asked for.

```console
error request ... http.host=kagent-tools.kagent http.status=403
  ate.actor.name=ai-01a0abbb-ad73-7dfb-a86e-f2a643dc4dc9 ate.atespace=kagent
  error="actor egress policy denied: ... \"EgressPolicy not found\"" reason=Authorization
```

Read this entry in three parts. `reason=Authorization` means that the policy refused the request rather than the request failing for another reason. The `error` text names which check failed, such as a policy that does not exist. The `http.host` names the destination that the agent asked for. Compare this host against the AgentTemplate.

A `503` means that the gateway could not reach the control plane or a credential provider, which is an installation problem rather than a denied request.

An allowed request is logged the same way, with its status, the `http.host` and `http.path` it matched on, and the `substrate.connect.authority` address the Actor originally dialed. The log is therefore the quickest way to see what an agent actually reaches.

The compiled policy is not readable through `kubectl` or `kagent`, so treat the AgentTemplate as the source of truth for what an agent is meant to reach. A destination that is missing from the log is missing from the AgentTemplate.

## Credential injection

A model provider or an MCP server usually requires an API key or token. The agent sends a placeholder header in place of the real value, and the gateway replaces this header with the credential as the request passes through. The key never enters the agent's environment or its filesystem.

kagent sets this up from two resources. Every ModelConfig that holds an `apiKeySecret` becomes a credential on the rule for that model's host, and every RemoteMCPServer whose `headersFrom` reads a Secret becomes a credential on the rule for its host. kagent attaches the credential to the destination's own rule rather than adding a rule for it, and it refuses to compile a credential whose host is not already an allowed destination.

A credential is declared on a rule as a `replace_headers` entry. The entry names the header to replace, an optional prefix such as `Bearer `, and either a reference that a registered credential provider resolves or a JWT that Agent Substrate issues to assert the Actor's identity. The gateway replaces the header only when the request already sends it. A request that omits the placeholder header is forwarded unchanged, without the credential, rather than being denied.

> [!NOTE]
> Replacement happens only on a connection that the gateway terminates, and only when a credential provider is configured for the reference. If either is missing, the request reaches the destination without the credential. The request fails closed when replacement is attempted and fails. `403` is returned when the provider does not hold the credential or refuses to release it, and `503` is returned when the provider is unreachable.

Replacement also works on a cleartext `http` rule, where the gateway does not originate TLS to the destination. The credential is then readable by anything on the path between the gateway and the destination unless something outside the gateway encrypts that segment. Prefer an `https` destination for any host that takes a credential.
