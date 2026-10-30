---
title: About tools
description: Give an agent tools by binding Model Context Protocol servers or other agents to an AgentTemplate.
weight: 10
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}'s `spec.tools` list defines what an agent can do beyond its system prompt. Each entry is a **{{< gloss "Tool binding" >}}tool binding{{< /gloss >}}**, and each binding connects the agent to one source.

- `mcp`: Tools from a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server.
- `subAgent`: Another AgentTemplate that takes work from the agent that you are configuring.

You must set exactly one of these fields on a binding. An `mcp` binding can reference a RemoteMCPServer in another namespace when the server admits the AgentTemplate's namespace. A `subAgent` binding always resolves in the AgentTemplate's own namespace.

## MCP tools

An `mcp` binding references an MCP server. The optional `tools` list limits which of that server's tools the agent gets. On the kagent and Codex harnesses, a list narrows the binding to the tools that you name. To give the agent every tool that the server offers, omit the list or leave it empty.

```yaml
tools:
  - mcp:
      server:
        kind: RemoteMCPServer
        name: my-mcp-server
      tools:
        - search_docs
        - fetch_page
      requireApproval: true
```

| Field | Description |
| ----- | ----------- |
| `mcp.server.kind` | Required. The kind of server resource. `RemoteMCPServer` is the only accepted value. |
| `mcp.server.name` | Required. The server's name. |
| `mcp.server.namespace` | Optional. The server's namespace. Defaults to the AgentTemplate's namespace. For the conditions that a server in another namespace must meet, see [Share an MCP server across namespaces](#share-an-mcp-server-across-namespaces). |
| `mcp.tools` | Optional. The names of the tools to bind, up to 50. Duplicates are collapsed. Omit the list, or leave it empty, to expose every tool on the server. On the Claude {{< gloss "Harness" >}}Harness{{< /gloss >}}, a list does not narrow the server. See [Tool selection on the Claude harness](#tool-selection-on-the-claude-harness). |
| `mcp.requireApproval` | Optional. Pauses the agent for a person's approval before each call to a tool that this binding exposes. On the Claude harness, the pause covers every tool on the server, because Claude approves one server at a time rather than one tool at a time. Omit the field to run the bound tools without approval. For more information, see [Human in the loop]({{< link path="agents/human-in-the-loop#require-approval-for-a-tool" >}}). |

### Tool selection on the Claude harness

Claude's MCP configuration does not have a per-tool allowlist. On the Claude harness, the `tools` list does not narrow a server, and the agent reaches every tool that the server serves. kagent admits the {{< gloss "Revision" >}}revision{{< /gloss >}} either way. Unless the list exactly matches the tools that kagent currently discovers on the server, kagent also records a warning on the Agent.

```sh
kubectl get agent <name> -n <namespace> -o jsonpath='{.status.warnings}'
```

To keep an agent on the Claude harness away from a tool, limit what the server exposes rather than what the binding selects. Give the agent its own RemoteMCPServer that serves only the tools that you intend. Where you do not control what the server serves, put the MCP server behind agentgateway and apply [tool access](https://agentgateway.dev/docs/kubernetes/latest/documentation/mcp/tool-access/) rules to the route. Those rules filter a disallowed tool out of the `tools/list` response, so the agent never sees it. Then set the RemoteMCPServer's `url` field to that route. To put more than one MCP server behind one route, see [Virtual MCP](https://agentgateway.dev/docs/kubernetes/latest/documentation/mcp/virtual/).

For the bundled tool server, see the installation-level settings that drop providers and write tools in [Tools ecosystem]({{< link path="reference/tools-ecosystem#narrow-what-kagent-tool-server-serves" >}}).

### Caller token passthrough

An MCP server that authorizes each user individually needs the caller's token. For the authorizing server, set `tokenPassthrough: true` on its RemoteMCPServer resource. The agent sends the bearer token from the incoming Agent2Agent (A2A) request to the server as its `Authorization` header. When the incoming request does not present a bearer token, the MCP request fails.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: RemoteMCPServer
metadata:
  name: user-mcp-server
  namespace: kagent
  labels:
    kagent.dev/discovery: disabled
spec:
  description: An MCP server that authenticates each caller.
  url: https://mcp.example.com/mcp
  protocol: STREAMABLE_HTTP
  tokenPassthrough: true
```

| Field | Description |
| ----- | ----------- |
| `kagent.dev/discovery` label | The controller does not have a caller token, so controller-side tool discovery against this server fails. Set the label to `disabled` to turn discovery off. For more information, see [Turn tool discovery off for a server]({{< link path="reference/tools-ecosystem#turn-tool-discovery-off-for-a-server" >}}). |
| `tokenPassthrough` | Sends the caller's bearer token as `Authorization: Bearer <token>`. The RemoteMCPServer cannot also set an `Authorization` header in `headersFrom`. The `codex` and `claude` harnesses reject a RemoteMCPServer that sets this field. For more information, see [Tool and skill support]({{< link path="agents/agent-harness#tool-and-skill-support" >}}). |

Every model and MCP server that an agent reaches at the server's origin must also forward the caller's token. Otherwise, the Agent reports the `Compatible` condition as `False`. For more information, see [Forward the caller's token]({{< link path="setup/model-providers/about-model-providers#forward-the-callers-token" >}}).

### Actor token authentication

A Secret-backed header is the same for every agent that binds the server, so the MCP server cannot tell the agents apart. [Caller token passthrough](#caller-token-passthrough) identifies the user who started the Session, and an unattended run has no user. When an MCP server must authorize or audit each agent, send a token that identifies the calling {{< gloss "Actor" >}}Actor{{< /gloss >}} instead.

Set `actorJwt` on the RemoteMCPServer, and the egress gateway sends a newly issued Actor token as `Authorization: Bearer <token>` on each call. The gateway mints, injects, and refreshes the token, so the RemoteMCPServer needs no Secret, and you have no credential to rotate.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: RemoteMCPServer
metadata:
  name: agent-mcp-server
  namespace: kagent
spec:
  description: An MCP server that authenticates each Actor.
  url: https://mcp.example.com/mcp
  protocol: STREAMABLE_HTTP
  actorJwt:
    audiences: [agent-mcp]
    expirationSeconds: 900
```

The following fields set the token that the server receives. For the token's claims and how the server validates it, see [Actor tokens for other services]({{< link path="about/substrate-runtime/identity#actor-tokens-for-other-services" >}}).

| Field | Description |
| ----- | ----------- |
| `actorJwt.audiences` | The services that can accept the token, between 1 and 16 values. The server checks that its own audience is in the list. `kagent-runtime` is reserved and rejected. |
| `actorJwt.expirationSeconds` | Optional. The token lifetime, between 300 and 3600 seconds. Defaults to 900. |

A RemoteMCPServer sets at most one of `actorJwt` and `tokenPassthrough`, and `headersFrom` cannot set an `Authorization` header alongside `actorJwt`. Because the controller does not have an Actor token, kagent turns off controller-side tool discovery for this server automatically. The server does not need a `kagent.dev/discovery` label. The server's tools do not appear in the UI tool picker, and the agent discovers them at runtime. To bind specific tools, name them in the binding's `tools` list.

### Share an MCP server across namespaces

A platform team can run one RemoteMCPServer in a shared namespace and let agents in other namespaces bind it. Sharing works only when every one of the following conditions is met:

- The binding's `mcp.server.namespace` field names the server's namespace.
- The server's `allowedNamespaces` field admits the AgentTemplate's namespace.
- The controller watches both namespaces. A reference cannot extend the controller's watch scope.
- When the server sends a Secret-backed header through `headersFrom`, Agent Substrate lets the Agent's namespace read Secrets in the server's namespace. To add this grant, set `credentialProvider.namespacePolicies` on the Agent Substrate release, as described in [Share a ModelConfig across namespaces]({{< link path="setup/model-providers/about-model-providers#share-a-modelconfig-across-namespaces" >}}). A server without a Secret-backed header does not need this grant.

The following RemoteMCPServer admits every watched namespace and sends a header from a Secret in its own namespace.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: RemoteMCPServer
metadata:
  name: shared-tools
  namespace: shared-config
spec:
  description: Shared tools for every team
  url: https://tools.example.com/mcp
  protocol: STREAMABLE_HTTP
  headersFrom:
    - name: X-Api-Key
      valueFrom:
        type: Secret
        name: mcp-auth
        key: token
  allowedNamespaces:
    from: All
```

An AgentTemplate in another namespace binds the server by name and namespace.

```yaml
tools:
  - mcp:
      server:
        kind: RemoteMCPServer
        name: shared-tools
        namespace: shared-config
```

The following fields control which namespaces can bind the server.

| Field | Description |
| ----- | ----------- |
| `allowedNamespaces.from` | `Same` admits the server's own namespace and is the default. `All` admits every namespace that the controller watches. `Selector` admits the namespaces whose labels match `selector`. Admission lets a namespace bind the server. It does not let users in that namespace list, read, or edit the RemoteMCPServer. |
| `allowedNamespaces.selector` | A label selector over namespaces, with `matchLabels` and `matchExpressions`. Required when `from` is set to `Selector`. |

For the bundled `kagent-tool-server`, see [Reach kagent-tool-server from another namespace]({{< link path="reference/tools-ecosystem#reach-kagent-tool-server-from-another-namespace" >}}).

## Subagents as tools

A `subAgent` binding references another AgentTemplate in the same namespace so that one agent can route work to another agent. The model reads the `description` when it decides whether to route work here. A description that states plainly what the bound agent is for therefore matters more than the detail of its configuration.

```yaml
tools:
  - subAgent:
      name: log-searcher
      description: Search application logs for a time range and a query string.
      templateRef:
        name: log-search-agent
```

Every field is required. For the complete schema, see the [API reference]({{< link path="reference/api-ref#subagenttoolbinding" >}}).

| Field | Description |
| ----- | ----------- |
| `subAgent.name` | The name that the model sees for this binding. |
| `subAgent.description` | The text that tells the parent agent when to route work here. |
| `subAgent.templateRef.name` | The AgentTemplate to bind, in the same namespace. |

kagent compiles the bound template into the parent agent's own configuration and runs it inside the parent's {{< gloss "Actor" >}}Actor{{< /gloss >}}, so the two agents share one sandbox. A bound template is not an MCP server and does not have an endpoint of its own. A bound template also does not need an {{< gloss "Agent" >}}Agent{{< /gloss >}} resource because the parent's Agent runs it.

> [!NOTE]
> Dedicated subagents, which would give a bound agent its own Harness, Session, and Actor, are not part of the served API. The `subAgent.agentRef` field that would select one is unavailable, so `templateRef` is the only binding that you can write.

### Subagent tree rules

A bound agent runs inside its parent, so kagent constrains the shape of the resulting tree. kagent rejects a violation while it compiles the Agent, before any revision exists.

- **One level of nesting.** A bound agent cannot bind another agent.
- **No cycles.** An AgentTemplate cannot reach itself through a chain of bindings.
- **No reuse within one tree.** The same AgentTemplate cannot appear twice in the same tree.
- **Unique binding names.** Two bindings on one AgentTemplate cannot share a `name`.

When kagent rejects a tree, the Agent's `Compatible` condition becomes `False`. The condition reports the reason `UnsupportedConfiguration`, and its message identifies the rule that failed. A binding that names an AgentTemplate that does not exist fails before any rule is checked, so the Agent's `ResolvedRefs` condition reports `ReferenceResolutionFailed` instead. Read the conditions in the output of the following command.

```sh
kubectl get agent <name> -n <namespace> \
  -o jsonpath='{range .status.conditions[*]}{.type}{"="}{.status}{" "}{.reason}{": "}{.message}{"\n"}{end}'
```

The Claude and Codex harnesses add restrictions. A bound agent cannot have tools, skills, or plugins of its own, and must use the same model provider and authentication as its parent. A tree that compiles on the kagent harness can therefore fail after you move it to a Harness that runs Claude or Codex.
