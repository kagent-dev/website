---
title: Egress policies
description: Grant an Agent or a standalone sandbox access to HTTP and HTTPS destinations beyond its model and tools, and inject a credential into requests to those destinations.
weight: 55
author: kagent.dev
---

An {{< gloss "Agent" >}}Agent{{< /gloss >}} reaches only the destinations that its AgentTemplate needs, such as its model provider, its Model Context Protocol (MCP) servers, and its skill sources. {{< reuse "kagent-docs/snippets/name-product.md" >}} infers these destinations and compiles them into the agent's [egress policy]({{< link path="about/substrate-runtime/networking-and-egress#policy-generation" >}}). The egress gateway denies every other destination.

An EgressPolicy resource grants access to more destinations. An Agent or a SandboxTemplate selects one or more policies by name in its `spec.egressPolicyRefs` field. A policy can also reference a credential in a Kubernetes Secret. The gateway adds the credential to each request, so the value never enters the agent's sandbox. Typical uses include a package registry that a skill installs from, or an internal API that a tool script calls.

A grant only adds access. A policy cannot remove a destination that kagent inferred from the model or the tools.

## Before you begin

1. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have the `my-first-agent` Agent in the `kagent` namespace.

2. Optional: To grant access to a standalone sandbox, create the `scratch` SandboxTemplate, as described in [Create a SandboxTemplate]({{< link path="about/substrate-runtime/standalone-sandboxes#create-a-sandboxtemplate" >}}).

3. Check your kagent CLI version. The steps on this page need the {{< reuse "kagent-docs/versions/kagent.md" >}} CLI.
   ```bash
   kagent version
   ```

   If `kagent_version` in the output is not {{< reuse "kagent-docs/versions/kagent.md" >}}, install that version.
   ```bash
   curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
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

   {{< reuse "kagent-docs/snippets/review-table.md" >}} Each destination grants one origin, and the grant covers every path on that origin. For the complete schema, see the [API reference]({{< link path="reference/api-ref#egresspolicy" >}}).

   | Field | Description |
   | ----- | ----------- |
   | `destinations` | The destinations to grant, from 1 to 64 entries. |
   | `destinations[].origin` | A scheme, a Domain Name System (DNS) hostname, and an optional port, such as `https://registry.npmjs.org` or `https://search.example.com:8443`. For the accepted forms, see [Origin format](#origin-format). |
   | `destinations[].authentication` | Optional. A credential for the gateway to add to each request. For more information, see [Inject a credential](#inject-a-credential). |

2. Select the policy on the Agent. Only an Agent or a SandboxTemplate can select a policy. The AgentTemplate and the Harness cannot, so two Agents that share an AgentTemplate can have different access. The grant applies to the whole {{< gloss "Actor" >}}Actor{{< /gloss >}}, including the subagents that run in it.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```

3. Check that kagent admitted the grant. When kagent admits every selected policy, the `EgressPoliciesApplied` condition reports `True` with the reason `Applied`.
   ```bash
   kubectl get agent my-first-agent -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Applied All requested egress grants are admitted
   ```

The grant reaches existing {{< gloss "Session" >}}Sessions{{< /gloss >}} as well as new ones. kagent updates the policy of every running and suspended Actor that the Agent owns, without restarting the Actor. The update is asynchronous. A request that the agent sends immediately after the change might still use the previous policy.

## Origin format

An origin names exactly one scheme, host, and port. The scheme must be `http` or `https`. When the port is omitted, kagent uses `443` for `https` and `80` for `http`. The API server rejects an origin that contains a path, a query, a fragment, user information, or an IP address.

A wildcard can replace the leftmost label of the hostname. For example, `https://*.example.com` matches `api.example.com`, but it matches neither `example.com` nor `a.b.example.com`. The API server rejects `*` and `https://*.com`.

A redirect to another origin needs its own grant. For example, a package registry often serves downloads from a separate host. An install fails at that host until the policy grants it as well.

The API server rejects a policy or an `egressPolicyRefs` list that exceeds the first two of the following limits. The compiled policy limit also counts the destinations that kagent inferred, so an Agent with many tools reaches it sooner.

| Limit | Value |
| ----- | ----- |
| Policies that one Agent or SandboxTemplate selects | 16 |
| Destinations in one policy | 64 |
| Rules in the compiled policy of one Actor | 256 |
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

   {{< reuse "kagent-docs/snippets/review-table.md" >}} The gateway sets the header to the prefix followed by the Secret value.

   | Field | Description |
   | ----- | ----------- |
   | `origin` | The destination. An origin with a credential must be exact, so the API server rejects a wildcard origin. On a cleartext `http` origin, the credential is readable on the path between the gateway and the destination. Use an `http` origin with a credential only for an in-cluster service whose traffic a service mesh encrypts. |
   | `authentication.header` | The request header that carries the credential, such as `Authorization` or `X-API-Key`. The API server rejects the headers that control routing and framing, such as `Host` and `Content-Length`, and the `Proxy-Authorization`, `Proxy-Authenticate`, and `Cookie` headers. |
   | `authentication.prefix` | Optional. Text that the gateway puts before the Secret value. The prefix is literal. Include the trailing space, as in `"Bearer "`. When the prefix is omitted or empty, the header contains only the Secret value. |
   | `authentication.secretKeyRef` | The Secret and key that store the credential. Both `name` and `key` are required, and the reference cannot be optional. |

3. Select the policy on the Agent. A merge patch replaces the whole `egressPolicyRefs` list. Include every policy that the Agent needs.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"},{"name":"ticket-api"}]}}'
   ```

4. In the script or software development kit (SDK) that the agent uses, send the header with a placeholder value. The gateway replaces a header that the request already sends, and it does not add a header that is missing. Selecting a policy does not configure a tool or set an environment variable. The client must also trust the egress gateway's certificate authority, which kagent provides to every Actor. For the variables that carry the trust bundle, see [Environment variables on an Actor]({{< link path="agents/agent-harness#environment-variables-on-an-actor" >}}).
   ```bash
   curl -H 'Authorization: Bearer kagent-credential-injected' \
     https://tickets.example.com/tickets
   ```

To rotate the credential, update the Secret. The gateway reads the value from the Secret, so the agent's revision does not change.

## Grant access to a standalone sandbox

A standalone Sandbox has no outbound access by default. To grant access, select the policy on the SandboxTemplate that the Sandbox is created from. Existing Sandboxes from this template receive the change without a restart.

1. Add the policy to the SandboxTemplate's `spec.egressPolicyRefs` field.
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type merge \
     -p '{"spec":{"egressPolicyRefs":[{"name":"node-dependencies"}]}}'
   ```

2. Check that kagent admitted the grant.
   ```bash
   kubectl get sandboxtemplate scratch -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="EgressPoliciesApplied")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Applied All requested egress grants are admitted
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

An EgressPolicy is namespace-scoped, and kagent does not check who may select it. A user who can create or edit an Agent or a SandboxTemplate in a namespace can select every EgressPolicy in this namespace and use its credentials. Treat the namespace as the boundary for sharing policies and the Secrets that they reference.

To control who can grant access, give the permission to create and edit EgressPolicy resources only to administrators. The kagent controller needs only read access to EgressPolicy resources.

The gateway keeps a credential out of the sandbox, but it cannot stop an allowed destination from returning the credential in a response. Grant a credential only to a destination that you trust with it.

## Clean up

1. Remove the policies from the Agent.
   ```bash
   kubectl patch agent my-first-agent -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   ```

2. If you granted access to the `scratch` SandboxTemplate, remove the policy from the template.
   ```bash
   kubectl patch sandboxtemplate scratch -n kagent --type json \
     -p '[{"op":"remove","path":"/spec/egressPolicyRefs"}]'
   ```

3. Delete the EgressPolicy resources and the Secret.
   ```bash
   kubectl delete egresspolicy node-dependencies ticket-api -n kagent
   kubectl delete secret ticket-auth -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/networking-and-egress" >}}` title="Egress control" subtitle="Learn how the egress gateway authorizes each connection." >}}
  {{< card link=`{{< link path="about/substrate-runtime/standalone-sandboxes" >}}` title="Standalone sandboxes" subtitle="Create sandboxes that agents and scripts can run commands in." >}}
{{< /cards >}}
