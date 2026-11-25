---
title: Add an MCP server
description: Register a Model Context Protocol server in the kagent UI and give its tools to your agent.
weight: 11
author: kagent.dev
---

{{< tutorial-banner >}}

A system prompt tells an agent how to behave. Tools tell it what it can do. In this tutorial, you register a weather {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server in the kagent UI, and give its tool to the personal assistant from [Build an Agent]({{< link path="get-started/build-an-agent" >}}).

To bind a tool from YAML instead, see [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}).

## Before you begin

1. Complete [Build an Agent]({{< link path="get-started/build-an-agent" >}}), so that the `personal-assistant` agent exists.
2. Make sure that your cluster can reach the internet. The servers in this tutorial are public endpoints.

> [!NOTE]
> The weather server in this tutorial is a public demonstration server that the kagent project does not run. It can be slow to answer its first request, and it can change or go away. Any MCP server that speaks streamable HTTP or SSE works the same way.

## Register the MCP server

{{< reuse-image src="img/kagent-ui-add-mcp-server.gif" alt="The kagent UI registering an MCP server named weather, expanding it to show the get_weather tool, then adding the server to the personal-assistant agent" caption="Figure: Registering the weather server and adding it to the agent, sped up" >}}

1. In the sidebar, click **MCP Servers**, and then click **New Server**.

2. Fill in the form.

   | Field | Value |
   | --- | --- |
   | **Name** | `weather` |
   | **Namespace** | `kagent` |
   | **Server URL** | `mcp-weather-1cyg.onrender.com/mcp` |
   | **TLS** | **HTTPS**. The scheme in front of the URL changes to `https://`. |
   | **Use streamable HTTP instead of SSE** | Selected, which is the default. |

3. Click **Create server**. kagent connects to the server and reads its list of tools.

4. On the **MCP servers** page, click **Refresh** until the `weather` server shows `1` in the **Tools** column. Expand the row to see the tool, `get_weather`, which returns the current weather for a pair of GPS coordinates.

## Give the tool to your agent

1. In the sidebar, click **Agents**. In the row of the `personal-assistant` agent, click the edit icon.

2. Under **Tools from MCP servers**, click **Add an MCP server**, and choose `kagent/weather` from the **MCP server** list.

   Leave the tool list on **All tools** to expose every tool from the server. To expose only some tools, choose them from that list. To make the agent pause for your approval before it runs a tool, select **Require approval**.

3. Click **Save agent**. The agent shows the **Updating** status while kagent prepares a new revision, and then returns to **Ready**.

4. Click the agent name to open its chat page, and ask about the weather, such as `What is the weather in Toronto right now?`.

An agent does not need an egress policy to reach a model or a registered MCP server.

## Try another server

Register a second server the same way. The Solo.io documentation search server is a public server that needs no API key.

| Field | Value |
| --- | --- |
| **Name** | `solo-docs` |
| **Server URL** | `search.solo.io/mcp` |
| **TLS** | **HTTPS** |

The server offers three tools: `search`, `get_chunks`, and `get_full_page`. Add it to the personal assistant to let the agent answer questions from the Solo.io product documentation.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML.

<details class="doc-details">
<summary>The weather MCP server</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: RemoteMCPServer
metadata:
  name: weather
  namespace: kagent
spec:
  protocol: STREAMABLE_HTTP
  url: https://mcp-weather-1cyg.onrender.com/mcp
  timeout: 5s
  terminateOnClose: true
EOF
```

</details>

<details class="doc-details">
<summary>The personal-assistant agent, with the weather tools</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: personal-assistant
  namespace: kagent
spec:
  harnessRef:
    name: kagent-default
  template:
    inline:
      description: My personal assistant
      modelConfig:
        name: default-model-config
      systemPrompt: |-
        You are my personal assistant. Be friendly and concise. Help me plan my day, draft messages, and answer questions.
      tools:
        - mcp:
            server:
              kind: RemoteMCPServer
              name: weather
EOF
```

</details>

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Bind a tool to an AgentTemplate from YAML." >}}
  {{< card link=`{{< link path="get-started/prompt-library" >}}` title="Create a prompt library" subtitle="Keep reusable prompt text in one place." >}}
  {{< card link=`{{< link path="skills-and-mcp" >}}` title="Skills and MCP" subtitle="Read about the ways to give an agent tools and know-how." >}}
{{< /cards >}}
