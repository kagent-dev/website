---
title: Egress policies
description: Grant an Agent or a standalone sandbox access to HTTP and HTTPS destinations beyond its model and tools, and inject a credential into requests to those destinations.
weight: 55
author: kagent.dev
---

An {{< gloss "Agent" >}}Agent{{< /gloss >}} reaches only the destinations that its AgentTemplate needs, such as its model provider, its Model Context Protocol (MCP) servers, and its skill sources. {{< reuse "kagent-docs/snippets/name-product.md" >}} infers these destinations and compiles them into the agent's [egress policy]({{< link path="about/substrate-runtime/networking-and-egress#policy-generation" >}}). The egress gateway denies every other destination.

To grant an Agent or SandboxTemplate access to destinations beyond the inferred set, create an EgressPolicy resource. The Agent or SandboxTemplate selects one or more policies by name in its `spec.egressPolicyRefs` field. An EgressPolicy only adds access, and cannot remove a destination that kagent inferred from the model or the tools.

A policy can also have the gateway add a credential to each request, either a value from a Kubernetes Secret or a token that identifies the calling agent. The credential never enters the agent's sandbox. Typical uses include a package registry that a skill installs from, or an internal API that a tool script calls.

## Before you begin

Create the resource that you want to grant access to. The examples on this page use the `kagent` namespace.
* **Agent**: [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have the `my-first-agent` Agent. Use commands in the "Agent" tabs in the following steps.
* **Standalone sandbox**: Create the `scratch` SandboxTemplate, as described in [Create a SandboxTemplate]({{< link path="about/substrate-runtime/standalone-sandboxes#create-a-sandboxtemplate" >}}). Use commands in the "Standalone sandbox" tabs in the following steps.

## Grant access to a destination

Create an EgressPolicy that lists the destinations that you want to grant access to, and then select the policy on the Agent or SandboxTemplate.

1. Create the EgressPolicy in the namespace of the Agent or SandboxTemplate. A resource can select only the policies in its own namespace. This example grants access to the npm registry and the Node.js download site.
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

   {{< reuse "kagent-docs/snippets/review-table.md" >}} Each destination grants one origin, and the grant covers every path on that origin. For the complete schema, see the [API reference]({{< link path="reference/api-ref#egresspolicy" >}}).

   | Field | Description |
   | ----- | ----------- |
   | `destinations` | The destinations to grant, from 1 to 64 entries. |
   | `destinations[].origin` | A scheme, a DNS hostname, and an optional port, such as `https://registry.npmjs.org` or `https://search.example.com:8443`. For the accepted forms, see [Origin format](#origin-format). |
   | `destinations[].authentication` | Optional. A credential for the gateway to add to each request. For more information, see [Inject a credential](#inject-a-credential). |

2. Select the policy in the `spec.egressPolicyRefs` field.
   {{< tabs >}}
   {{% tab name="Agent" %}}
   The AgentTemplate and the Harness cannot select a policy, so two Agents that share an AgentTemplate can have different access. The grant applies to the whole {{< gloss "Actor" >}}Actor{{< /gloss >}}, including the subagents that run in it.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```
   {{% /tab %}}
   {{% tab name="Standalone sandbox" %}}
   Every Sandbox that is created from the template receives the grant.
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```
   {{% /tab %}}
   {{< /tabs >}}

3. Check that kagent admitted the grant. When kagent admits every selected policy, the `EgressPoliciesApplied` condition reports `True` with the reason `Applied`.
   {{< tabs >}}
   {{% tab name="Agent" %}}
   ```bash
   kubectl get agent my-first-agent -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```
   {{% /tab %}}
   {{% tab name="Standalone sandbox" %}}
   ```bash
   kubectl get sandboxtemplate scratch -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```
   {{% /tab %}}
   {{< /tabs >}}

   Example output:
   ```console
   True Applied All requested egress grants are admitted
   ```

The grant reaches existing workloads as well as new ones. kagent updates the policy of every running and suspended Actor without restarting it. For an Agent, this update covers every {{< gloss "Session" >}}Session{{< /gloss >}}. For a SandboxTemplate, the update covers every Sandbox that was created from the template. The update is asynchronous, so a request that is sent immediately after the change might still use the previous policy.

## Origin format

An origin names exactly one scheme, host, and port. The scheme must be `http` or `https`. When the port is omitted, kagent uses `443` for `https` and `80` for `http`. The API server rejects an origin that contains a path, a query, a fragment, user information, or an IP address.

A wildcard can replace the leftmost label of the hostname. For example, `https://*.example.com` matches `api.example.com`, but it matches neither `example.com` nor `a.b.example.com`. The API server rejects `*` and `https://*.com`.

A redirect to another origin needs its own grant. For example, a package registry often serves downloads from a separate host. An install fails at that host until the policy grants it as well.

The API server rejects an `egressPolicyRefs` list that selects more than 16 policies and a policy that lists more than 64 destinations. The compiled policy limit also counts the destinations that kagent inferred, so an Agent with many tools reaches it sooner.

| Limit | Value |
| ----- | ----- |
| Policies that one Agent or SandboxTemplate selects | 16 |
| Destinations in one policy | 64 |
| Rules in the compiled policy of one Actor | 256 |
| Credential headers for one origin | 16 |

## Inject a credential

The gateway can add a credential to each request for an origin. The agent sends the header with a placeholder value, and the gateway replaces this value as the request passes through. The credential is not stored in the agent's revision and never reaches the sandbox. The following steps inject a value from a Kubernetes Secret. To inject a token that identifies the calling agent, see [Inject the Actor's token](#inject-the-actors-token).

1. Create the Secret in the namespace of the EgressPolicy. To rotate the credential later, update the Secret. The gateway reads the value from the Secret, so the agent's revision does not change.
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

   {{< reuse "kagent-docs/snippets/review-table.md" >}} The gateway sets the header to the prefix followed by the Secret value.

   | Field | Description |
   | ----- | ----------- |
   | `origin` | The destination. An origin with a credential must be exact, so the API server rejects a wildcard origin. On a cleartext `http` origin, the credential is readable on the path between the gateway and the destination. Use an `http` origin with a credential only for an in-cluster service whose traffic a service mesh encrypts. |
   | `authentication.header` | The request header that carries the credential, such as `Authorization` or `X-API-Key`. The API server rejects the headers that control routing and framing, such as `Host` and `Content-Length`, and the `Proxy-Authorization`, `Proxy-Authenticate`, and `Cookie` headers. |
   | `authentication.prefix` | Optional. Text that the gateway puts before the Secret value. The prefix is literal. Include the trailing space, as in `"Bearer "`. When the prefix is omitted or empty, the header contains only the Secret value. |
   | `authentication.secretKeyRef` | The Secret and key that store the credential. Both `name` and `key` are required, and the reference cannot be optional. A destination sets exactly one of `secretKeyRef` and `actorJwt`. For the token alternative, see [Inject the Actor's token](#inject-the-actors-token). |

3. Select the policy. A merge patch replaces the whole `egressPolicyRefs` list, so the command also keeps `node-dependencies`. Include every policy that the resource needs.
   {{< tabs >}}
   {{% tab name="Agent" %}}
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```
   {{% /tab %}}
   {{% tab name="Standalone sandbox" %}}
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```
   {{% /tab %}}
   {{< /tabs >}}

4. In the script or SDK that sends the request, send the header with a placeholder value. The gateway replaces a header that the request already sends, and it does not add a header that is missing. Selecting a policy does not configure a tool or set an environment variable. The client must also trust the egress gateway's certificate authority. kagent provides this certificate authority to every Actor. For the variables that carry the trust bundle, see [Environment variables on an Actor]({{< link path="agents/agent-harness#environment-variables-on-an-actor" >}}).
   ```bash
   curl -H 'Authorization: Bearer kagent-credential-injected' \
     https://tickets.example.com/tickets
   ```

### Inject the Actor's token

A Secret-backed credential is the same for every agent that selects the policy, so the destination cannot tell the agents apart. When an internal API must authorize or audit each agent, inject a token that identifies the calling {{< gloss "Actor" >}}Actor{{< /gloss >}} instead. This method covers the requests that an agent's own code sends, such as a `curl` command or a script that a skill runs. For model and MCP server calls, set `actorJwt` on the ModelConfig or the RemoteMCPServer, as described in [Actor tokens for other services]({{< link path="about/substrate-runtime/identity#actor-tokens-for-other-services" >}}).

The gateway mints, injects, and refreshes the token, so the policy needs no Secret, and you have no credential to rotate.

1. Create an EgressPolicy whose `authentication` block sets `actorJwt`. The gateway replaces the header with the prefix followed by a newly issued Actor token.
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
           actorJwt:
             audiences: [ticket-api]
             expirationSeconds: 900
   EOF
   ```

   {{< reuse "kagent-docs/snippets/review-table.md" >}} For the token's claims and how the destination validates it, see [Actor tokens for other services]({{< link path="about/substrate-runtime/identity#actor-tokens-for-other-services" >}}).

   | Field | Description |
   | ----- | ----------- |
   | `authentication.actorJwt.audiences` | The services that can accept the token, between 1 and 16 values. The destination checks that its own audience is in the list. `kagent-runtime` is reserved and rejected. |
   | `authentication.actorJwt.expirationSeconds` | Optional. The token lifetime, between 300 and 3600 seconds. Defaults to 900. |

2. Select the policy. A merge patch replaces the whole `egressPolicyRefs` list, so include every policy that the resource needs.
   {{< tabs >}}
   {{% tab name="Agent" %}}
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```
   {{% /tab %}}
   {{% tab name="Standalone sandbox" %}}
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```
   {{% /tab %}}
   {{< /tabs >}}

3. In the client that sends the request, send the header with a placeholder value.
   ```bash
   curl -H 'Authorization: Bearer kagent-credential-injected' \
     https://tickets.example.com/tickets
   ```

## Troubleshoot a grant

The `EgressPoliciesApplied` condition on the Agent or SandboxTemplate reports whether kagent admitted the grants. This condition is independent of `Ready`. An Agent with a missing or invalid policy still reports `Ready`, and it still serves Sessions with its inferred destinations.

The condition message names the affected policies, and the reason identifies the problem.

| Status | Reason | Meaning |
| ------ | ------ | ------- |
| `True` | `Applied` | kagent admitted every selected policy. |
| `False` | `EgressPolicyNotFound` | A selected policy does not exist, or is being deleted. |
| `False` | `InvalidEgressPolicy` | A policy, a Secret reference, or the `egressPolicyRefs` list is invalid. For example, the Secret or its key does not exist. |
| `False` | `EgressGrantConflict` | A new grant conflicts with an existing one. kagent holds the new grants, and keeps the previously admitted grants that are still selected and compatible. |

A problem with one policy does not block the others. A policy that is missing or invalid does not grant any access, and the remaining policies still apply. An `egressPolicyRefs` list that is itself invalid revokes every grant for that resource. For example, one name that is not a valid Kubernetes resource name, such as `Node-Deps`, revokes the grants of every other policy in the list.

A grant conflict happens in the following cases:

- Two policies set a different Secret or prefix for the same origin and header.
- A grant sets a credential for an origin that already has a credential from the model or a tool. The credential from the model or the tool always takes precedence.
- A grant sets a credential for an origin that uses token passthrough. Token passthrough and a Secret credential cannot share an origin.
- The compiled policy would exceed 256 rules.

In a standalone Sandbox, a destination that no grant allows does not resolve. A client therefore reports a name-resolution error, not an HTTP error. For example, `curl` fails with `Could not resolve host` and exit code `6`. For how to find a denied request in the gateway's log, see [Diagnose a denied request]({{< link path="about/substrate-runtime/networking-and-egress#diagnose-a-denied-request" >}}).

## Access control

An EgressPolicy is namespace-scoped, and kagent does not check who may select it. A user who can create or edit an Agent or a SandboxTemplate in a namespace can select every EgressPolicy in that namespace and use its credentials. Treat the namespace as the boundary for sharing policies and the Secrets that they reference. For more information about how Kubernetes role-based access control (RBAC) governs who can write these resources, see [The Kubernetes plane]({{< link path="about/substrate-runtime/identity#the-kubernetes-plane" >}}).

To control who can grant access, give the permission to create and edit EgressPolicy resources only to administrators. The kagent controller needs only read access to EgressPolicy resources.

The gateway keeps a credential out of the sandbox, but it cannot stop an allowed destination from returning the credential in a response. Grant a credential only to a destination that you trust with it.

## Clean up

1. Remove the policies from the resource.
   {{< tabs >}}
   {{% tab name="Agent" %}}
   ```bash
   kubectl patch agent my-first-agent -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   ```
   {{% /tab %}}
   {{% tab name="Standalone sandbox" %}}
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   ```
   {{% /tab %}}
   {{< /tabs >}}

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
