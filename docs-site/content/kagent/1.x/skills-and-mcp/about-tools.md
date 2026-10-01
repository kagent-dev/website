---
title: About tools
description: Give an agent tools by binding Model Context Protocol servers or other agents to an AgentTemplate.
weight: 10
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}'s `spec.tools` list defines what an agent can do beyond its system prompt. Each entry is a **{{< gloss "Tool binding" >}}tool binding{{< /gloss >}}**, and every binding selects exactly one source: a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server, or another AgentTemplate used as a tool. A binding that names both, or neither, is rejected.

- `mcp`: Binds tools from an MCP server.
- `agent`: Binds another AgentTemplate, so that the agent can hand work to it.

Both kinds resolve within the AgentTemplate's own namespace, so a binding cannot reach a server or a template in another namespace.

## MCP tools

An `mcp` binding names a server, and optionally the tools to take from it. On the kagent and Codex harnesses, listing tools narrows the binding to those tools. Omitting the list, or leaving it empty, exposes every tool that the server offers.

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
| `mcp.tools` | Optional. The names of the tools to bind, up to 50. Duplicates are collapsed. An omitted or empty list exposes every tool on the server, and so does any list on the Claude harness. |
| `mcp.requireApproval` | Optional. Pauses the agent for a person's approval before each call to a tool that this binding exposes. Omit to run the bound tools without approval. For more information, see [Human in the loop]({{< link path="agents/human-in-the-loop#require-approval-for-a-tool" >}}). |

> [!WARNING]
> **The Claude {{< gloss "Harness" >}}Harness{{< /gloss >}} ignores `mcp.tools` and exposes the whole server.** Claude's MCP configuration has no per-tool allowlist, so kagent cannot narrow a server there. The compiler records the tools that you selected in a warning on the AgentTemplate's `status.harnesses[].warnings` and then admits the {{< gloss "Revision" >}}revision{{< /gloss >}} anyway, so the agent becomes ready with every tool that the server serves. Read the warning after you bind a server:
>
> ```sh
> kubectl get agenttemplate <name> -n <namespace> \
>   -o jsonpath='{range .status.harnesses[*]}{.harness}{": "}{.warnings}{"\n"}{end}'
> ```
>
> Where an agent on the Claude harness must not reach a tool, narrow the server rather than the binding. Set `requireApproval: true`, which does apply on this harness and pauses every call to the server, or give the agent its own RemoteMCPServer that serves only the tools you intend. For the bundled tool server, see the installation-level settings that drop providers and write tools in [Tools ecosystem]({{< link path="reference/tools-ecosystem#narrow-what-kagent-tool-server-serves" >}}).

## Subagents as tools

A `subAgent` binding points at another AgentTemplate, which lets one agent route work to another. The model reads the `description` when it decides whether to route work here, so a description that states plainly what the bound agent is for matters more than the detail of its configuration.

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

A bound template compiles under the parent {{< gloss "Agent" >}}Agent{{< /gloss >}}'s Harness and runs inside the parent's {{< gloss "Actor" >}}Actor{{< /gloss >}}, so nesting costs no extra compute and the two agents share one sandbox. A subagent needs no Agent of its own.

> [!NOTE]
> Dedicated subagents, which would give a bound agent its own Harness, Session, and Actor and reach it over A2A, are not part of the served API. The `subAgent.agentRef` field that would select one is deferred until a dedicated subagent can create and invoke its own Session, so the only binding a reader can write today is `templateRef`.

### What a subagent tree allows

A subagent binding nests one agent inside another's runtime, so kagent constrains the shape of the resulting tree. The compiler enforces each of the following rules, and a violation surfaces as a failed {{< gloss "Revision" >}}revision{{< /gloss >}} rather than a failure at run time.

- **One level of nesting.** A bound agent cannot itself bind another agent. A second consecutive binding is rejected as exceeding the kagent runtime boundary.
- **No cycles.** An AgentTemplate cannot reach itself through a chain of bindings.
- **No reuse within one tree.** The same AgentTemplate cannot appear twice in the same tree.
- **Unique binding names.** Two bindings on one AgentTemplate cannot share a `name`.
