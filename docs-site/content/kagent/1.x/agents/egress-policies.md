---
title: Egress policies
description: Grant an Agent or a standalone sandbox access to HTTP and HTTPS destinations beyond its model and tools, and inject a credential into requests to those destinations.
weight: 55
author: kagent.dev
---

An {{< gloss "Agent" >}}Agent{{< /gloss >}} reaches only the destinations that its AgentTemplate needs, such as its model provider, its MCP servers, and its skill sources. {{< reuse "kagent-docs/snippets/name-product.md" >}} infers these destinations and compiles them into the agent's [egress policy]({{< link path="about/substrate-runtime/networking-and-egress#policy-generation" >}}). The egress gateway denies every other destination.

An `EgressPolicy` resource grants access to more destinations. An Agent or a SandboxTemplate selects one or more policies by name in its `spec.egressPolicyRefs` field. A policy can also hold a credential, which the gateway adds to each request so that the value never enters the agent's sandbox. Typical uses include a package registry that a skill installs from, or an internal API that a tool script calls.

A grant only adds access. A policy cannot remove a destination that kagent inferred from the model or the tools. An Agent that selects no policies has no access beyond the inferred destinations, and a standalone sandbox that selects no policies has no outbound access at all.

## Before you begin

1. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have the `my-first-agent` Agent in the `kagent` namespace.

2. Check your kagent CLI version. The steps on this page need the {{< reuse "kagent-docs/versions/kagent.md" >}} CLI.
   ```bash
   kagent version
   ```

## Grant access to a destination

Create an EgressPolicy that lists the destinations, and then select the policy on the Agent. This example grants access to the npm registry and the Node.js download site.

1. Create the EgressPolicy in the namespace of the Agent. An Agent can select only policies in its own namespace.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: EgressPolicy
   metadata:
     name: node-dependencies
     namespace: kagent
   spec:
     destinations:
       - origin: https://registry.npmjs.org
       - origin: https://nodejs.org
   EOF
   ```

   {{< reuse "kagent-docs/snippets/review-table.md" >}} For the complete schema, see the [API reference]({{< link path="reference/api-ref#egresspolicy" >}}).

   | Field | Description |
   | ----- | ----------- |
   | `destinations` | The destinations to grant, from 1 to 64 entries. |
   | `destinations[].origin` | A scheme, a DNS hostname, and an optional port, such as `https://registry.npmjs.org` or `https://search.example.com:8443`. The grant covers every path on this origin. |
   | `destinations[].authentication` | Optional. A credential for the gateway to add to each request. For more information, see [Inject a credential](#inject-a-credential). |

2. Select the policy on the Agent.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```

3. Check that kagent admitted the grant. The `EgressPoliciesApplied` condition reports `True` with the reason `Applied` when every selected policy is admitted.
   ```bash
   kubectl get agent my-first-agent -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Applied All requested egress grants are admitted
   ```

The grant reaches existing {{< gloss "Session" >}}Sessions{{< /gloss >}} as well as new ones. kagent updates the policy of every running and suspended Actor that the Agent owns, without restarting the Actor. The update is asynchronous, so a request that the agent sends immediately after the change can still use the previous policy.

A grant applies to the whole Actor. Subagents that share the Agent's Actor get the same access, because they run in one sandbox and kagent cannot isolate their network access from each other. The AgentTemplate and the Harness cannot select a policy, so two Agents that share an AgentTemplate can have different access.

## Origin format

An origin names exactly one scheme, host, and port. When the port is omitted, kagent uses `443` for `https` and `80` for `http`. The API server rejects an origin that contains a path, a query, a fragment, user information, or an IP address. Origins on protocols other than HTTP and HTTPS are not supported.

A wildcard can replace the leftmost label of the hostname. For example, `https://*.example.com` matches `api.example.com`, but it matches neither `example.com` nor `a.b.example.com`. The origins `*` and `https://*.com` are rejected.

A redirect to another origin needs its own grant. For example, a package registry often serves downloads from a separate host, and an install fails at that host until the policy names it as well.

The following limits apply to each Agent or SandboxTemplate.

| Limit | Value |
| ----- | ----- |
| Selected policies | 16 |
| Destinations in one policy | 64 |
| Rules in the compiled policy, including the inferred destinations | 256 |
| Credential headers for one origin | 16 |

## Inject a credential

The gateway can add a credential from a Kubernetes Secret to each request for an origin. The agent sends the header with a placeholder value, and the gateway replaces this value as the request passes through. The Secret value is not stored in the agent's revision and never reaches the sandbox.

1. Create the Secret in the namespace of the EgressPolicy.
   ```bash
   kubectl create secret generic ticket-auth -n kagent \
     --from-literal=token=<your-api-token>
   ```

2. Create an EgressPolicy with an `authentication` block for the destination.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: EgressPolicy
   metadata:
     name: ticket-api
     namespace: kagent
   spec:
     destinations:
       - origin: https://tickets.example.com
         authentication:
           header: Authorization
           prefix: "Bearer "
           secretKeyRef:
             name: ticket-auth
             key: token
   EOF
   ```

   {{< reuse "kagent-docs/snippets/review-table.md" >}}

   | Field | Description |
   | ----- | ----------- |
   | `origin` | The destination. An origin with a credential must be exact, so a wildcard origin is rejected. |
   | `authentication.header` | The request header that carries the credential, such as `Authorization` or `X-API-Key`. Routing, framing, hop-by-hop, proxy-authentication, and `Cookie` headers are rejected. |
   | `authentication.prefix` | Optional. Text that the gateway puts before the Secret value. The prefix is literal, so include the trailing space, as in `"Bearer "`. When the prefix is omitted or empty, the header carries the Secret value alone. |
   | `authentication.secretKeyRef` | The Secret and key that hold the credential. Both `name` and `key` are required, and the reference cannot be optional. |

3. Select the policy on the Agent. The `egressPolicyRefs` list replaces the existing list, so include every policy that the Agent needs.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```

The gateway replaces a header that the request already sends, and it does not add a header that is missing. A script or an SDK in the agent must therefore send the header with a placeholder value.

```bash
curl -H 'Authorization: Bearer kagent-credential-injected' \
  https://tickets.example.com/tickets
```

Selecting a policy does not configure a tool or set an environment variable for you. The client must also trust the egress gateway's certificate authority, which kagent provides to every Actor. For the variables that carry the trust bundle, see [Environment variables on an Actor]({{< link path="agents/agent-harness#environment-variables-on-an-actor" >}}).

To rotate the credential, update the Secret. The gateway reads the value from the Secret, so the agent's revision does not change.

A credential on a cleartext `http` origin is readable on the path between the gateway and the destination. Use an `http` origin with a credential only for an in-cluster service whose traffic a service mesh encrypts.

## Grant access to a standalone sandbox

A standalone Sandbox has no outbound access by default. To grant access, select the policy on the SandboxTemplate that the Sandbox is created from.

1. Add the policy to the SandboxTemplate's `spec.egressPolicyRefs` field. This example uses the `scratch` template from [Standalone sandboxes]({{< link path="about/substrate-runtime/standalone-sandboxes#create-a-sandboxtemplate" >}}).
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```

2. Check that kagent admitted the grant.
   ```bash
   kubectl get sandboxtemplate scratch -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```

Existing Sandboxes from this template receive the change without a restart.

## Troubleshoot a grant

The `EgressPoliciesApplied` condition on the Agent or SandboxTemplate reports whether kagent admitted the grants. This condition is independent of `Ready`, so an Agent with a missing or invalid policy still reports `Ready` and still serves Sessions with its inferred destinations.

The following reasons can appear on the condition. The condition message names the affected policies.

| Status | Reason | Meaning |
| ------ | ------ | ------- |
| `True` | `Applied` | Every selected policy is admitted. |
| `False` | `EgressPolicyNotFound` | A selected policy does not exist, or is being deleted. |
| `False` | `InvalidEgressPolicy` | A policy, a Secret reference, or the `egressPolicyRefs` list is invalid. For example, the Secret or its key does not exist. |
| `False` | `EgressGrantConflict` | A new grant conflicts with an existing one. kagent holds the new grants and keeps the earlier grants that are still selected and compatible. |

A problem with one policy does not block the others. A policy that is missing or invalid contributes no access, and the remaining policies still apply. An `egressPolicyRefs` list that is itself invalid revokes every grant for that resource. For example, one name that is not a valid Kubernetes resource name, such as `Node-Deps`, revokes the grants of every other policy in the list.

A grant conflict happens in the following cases:

- Two policies set a different Secret or prefix for the same origin and header.
- A grant sets a credential for an origin that the model or a tool already holds a credential for. The inferred credential always takes precedence.
- A grant sets a credential for an origin that uses token passthrough. Token passthrough and a Secret credential cannot share an origin.
- The compiled policy would exceed 256 rules.

A destination that no grant allows does not resolve inside the sandbox. A client therefore reports a name-resolution error rather than an HTTP error. For example, `curl` fails with `Could not resolve host` and exit code `6`. A request that the gateway denies appears in the gateway's log. For how to read the log, see [Diagnose a denied request]({{< link path="about/substrate-runtime/networking-and-egress#diagnose-a-denied-request" >}}).

## Access control

An EgressPolicy is namespace-scoped, and kagent does not check who may select it. Any user who can create or edit an Agent or a SandboxTemplate in a namespace can select every EgressPolicy in this namespace, and use its credentials. Treat the namespace as the boundary for sharing policies and the Secrets they name.

To control who can grant access, give the permission to create and edit EgressPolicy resources only to administrators. The kagent controller needs only read access to EgressPolicy resources.

The gateway keeps a credential out of the sandbox, but it cannot stop an allowed destination from returning the credential in a response. Grant a credential only to a destination that you trust with it.

## Clean up

1. Remove the policies from the Agent and the SandboxTemplate.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   kubectl patch sandboxtemplate scratch -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   ```

2. Delete the EgressPolicy resources and the Secret.
   ```bash
   kubectl delete egresspolicy node-dependencies ticket-api -n kagent
   kubectl delete secret ticket-auth -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/networking-and-egress" >}}` title="Egress control" subtitle="Learn how the egress gateway authorizes each connection." >}}
  {{< card link=`{{< link path="about/substrate-runtime/standalone-sandboxes" >}}` title="Standalone sandboxes" subtitle="Create sandboxes that agents and scripts can run commands in." >}}
{{< /cards >}}
