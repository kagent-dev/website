---
title: About tools
description: Give an agent tools by binding Model Context Protocol servers or other agents to an AgentTemplate.
weight: 10
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}'s `spec.tools` list defines what an agent can do beyond its system prompt. Each entry is a **{{< gloss "Tool binding" >}}tool binding{{< /gloss >}}**, and each binding connects the agent to one source.

- `mcp`: Tools from a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server.
- `subAgent`: Another agent that takes work from the agent that you are configuring.

You must set exactly one of these fields on a binding. If you set both or neither fields, the API server rejects the AgentTemplate with the error `exactly one of the fields in [mcp subAgent] must be set`.

Both kinds resolve within the AgentTemplate's own namespace, so a binding cannot reach a server or a template in another namespace.

## MCP tools

An `mcp` binding references an MCP server in the AgentTemplate's namespace. The optional `tools` list limits which of that server's tools the agent gets. On the kagent and Codex harnesses, a list narrows the binding to the tools that you name. To give the agent every tool that the server offers, omit the list or leave it empty.

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
| `mcp.server.kind` | The kind of server resource. `RemoteMCPServer` is the only accepted value. |
| `mcp.server.name` | The server's name, in the AgentTemplate's namespace. |
| `mcp.tools` | Optional. The names of the tools to bind, up to 50. Duplicates are collapsed. Omit the list, or leave it empty, to expose every tool on the server. On the Claude {{< gloss "Harness" >}}Harness{{< /gloss >}}, a list does not narrow the server. See [Tool selection on the Claude harness](#tool-selection-on-the-claude-harness). |
| `mcp.requireApproval` | Optional. Pauses the agent for a person's approval before each call to a tool that this binding exposes. On the Claude harness, the pause covers every tool on the server, because Claude approves one server at a time rather than one tool at a time. Omit to run the bound tools without approval. For more information, see [Human in the loop]({{< link path="agents/human-in-the-loop#require-approval-for-a-tool" >}}). |

### Tool selection on the Claude harness

Claude's MCP configuration has no per-tool allowlist. On the Claude harness, the `tools` list does not narrow a server, and the agent reaches every tool that the server serves. kagent admits the {{< gloss "Revision" >}}revision{{< /gloss >}} either way. If the list that you wrote does not already cover every tool that the server offers, kagent also records a warning on the Agent.

```sh
kubectl get agent <name> -n <namespace> -o jsonpath='{.status.warnings}'
```

To keep an agent on the Claude harness away from a tool, limit what the server exposes rather than what the binding selects. For example, put the MCP server behind agentgateway and apply [tool access](https://agentgateway.dev/docs/kubernetes/latest/documentation/mcp/tool-access/) rules to the route. Those rules filter a disallowed tool out of the `tools/list` response, so the agent never sees it. Then point the RemoteMCPServer at that route. To put more than one MCP server behind one route, see [Virtual MCP](https://agentgateway.dev/docs/kubernetes/latest/documentation/mcp/virtual/).

For the bundled tool server, see the installation-level settings that drop providers and write tools in [Tools ecosystem]({{< link path="reference/tools-ecosystem#narrow-what-kagent-tool-server-serves" >}}).

## Subagents as tools

A `subAgent` binding points at another AgentTemplate in the same namespace so that one agent can route work to another agent. The model reads the `description` when it decides whether to route work here. A description that states plainly what the bound agent is for therefore matters more than the detail of its configuration.

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

kagent compiles the bound template into the parent agent's own configuration, and both agents then run in the same place. A bound template is not an MCP server and has no endpoint of its own. A bound template also does not need an {{< gloss "Agent" >}}Agent{{< /gloss >}} resource because the parent's Agent runs it.

> [!NOTE]
> Dedicated subagents, which would give a bound agent its own Harness, Session, and {{< gloss "Actor" >}}Actor{{< /gloss >}}, are not part of the served API. The `subAgent.agentRef` field that would select one is unavailable, so `templateRef` is the only binding that you can write today.

### Subagent tree rules

A bound agent runs inside its parent, so kagent constrains the shape of the resulting tree. kagent rejects a violation while it compiles the Agent, before any revision exists.

- **One level of nesting.** A bound agent cannot bind another agent.
- **No cycles.** An AgentTemplate cannot reach itself through a chain of bindings.
- **No reuse within one tree.** The same AgentTemplate cannot appear twice in the same tree.
- **Unique binding names.** Two bindings on one AgentTemplate cannot share a `name`.

When kagent rejects a tree, the Agent's `Compatible` condition becomes `False`. The condition reports the reason `UnsupportedConfiguration`, and its message identifies the rule that failed. Read both in the output of the following command.

```sh
kubectl get agent <name> -n <namespace> \
  -o jsonpath='{range .status.conditions[?(@.type=="Compatible")]}{.reason}{": "}{.message}{"\n"}{end}'
```

The Claude and Codex harnesses apply further restrictions by not allowing a bound agent to have tools, skills, or plugins of its own. The bound agent must also use the same model provider and authentication as its parent. A tree that compiles on the kagent harness can therefore fail after you move it to a Harness that runs Claude or Codex.
