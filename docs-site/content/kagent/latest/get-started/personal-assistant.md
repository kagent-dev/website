---
title: Build a personal AI assistant
description: Build an assistant in the kagent UI that knows how you like to work, can check the weather, and sends you a plan for the day every morning.
weight: 2
author: kagent.dev
---

{{< tutorial-banner >}}

Build an assistant of your own from start to finish in the kagent UI. You give it a personality, a weather tool so that it can do more than talk, and a morning routine that runs without you asking.

By the end, you have one agent, `personal-assistant`, that answers in your style, looks up the weather, and leaves a plan for your day in a conversation every morning.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Open the kagent UI with `kagent dashboard`.
3. Make sure that your cluster can reach the internet. The weather tool is a public server.

## Create the assistant

Start with who the assistant is. Its system prompt is where you describe how it should behave.

{{< reuse-image src="img/kagent-ui-build-agent.gif" alt="The kagent UI creating an agent named personal-assistant with an inline template, then opening its chat page" caption="Figure: Creating the personal assistant, sped up" >}}

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `personal-assistant`. Leave the **Namespace** as `kagent`, and leave **Shared harness** set to `kagent-default`.

3. In the **Template** section, select **Inline**, and fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | `kagent/default-model-config` |
   | **Description** | `My personal assistant` |
   | **System prompt** | `You are my personal assistant. Be friendly and concise. Help me plan my day, draft messages, and answer questions.` |

   Make the prompt your own. Tell the assistant what you do, how long its answers should be, and anything that it should always or never do.

4. Click **Create agent**, and then click **Refresh** until the status changes from **Preparing** to **Ready**.

5. Click the agent name to open its chat page, and say hello. Ask it to draft a message or to plan a task.

## Give it the weather

An assistant that can only talk cannot tell you whether to take an umbrella. Tools come from Model Context Protocol (MCP) servers, so register a weather server, and then hand its tool to the assistant.

{{< reuse-image src="img/kagent-ui-add-mcp-server.gif" alt="The kagent UI registering an MCP server named weather, expanding it to show the get_weather tool, then adding the server to the personal-assistant agent" caption="Figure: Registering the weather server and adding it to the assistant, sped up" >}}

1. In the sidebar, click **MCP Servers**, and then click **New Server**.

2. Fill in the form, and then click **Create server**.

   | Field | Value |
   | --- | --- |
   | **Name** | `weather` |
   | **Server URL** | `mcp-weather-1cyg.onrender.com/mcp` |
   | **TLS** | **HTTPS** |

3. Click **Refresh** until the `weather` server shows `1` in the **Tools** column. Expand the row to see the tool, `get_weather`.

4. In the sidebar, click **Agents**. In the row of the `personal-assistant` agent, click the edit icon.

5. Under **Tools from MCP servers**, click **Add an MCP server**, and choose `kagent/weather`.

6. Click **Save agent**, and wait until the agent returns to **Ready**.

7. Open a **New chat** with the assistant, and ask `What is the weather in Toronto right now?`

> [!NOTE]
> The weather server is a public demonstration server that the kagent project does not run. It can be slow to answer its first request, and it can change or go away.

## Give it a morning routine

The assistant now answers when you ask. A schedule makes it start the conversation: every morning, it writes a plan for your day.

{{< reuse-image src="img/kagent-ui-schedule.gif" alt="The kagent UI creating a daily schedule named morning-brief for the personal-assistant agent" caption="Figure: Creating the morning schedule, sped up" >}}

1. In the sidebar, click **Schedules**, and then click **New Schedule**.

2. From the **Agent** list, choose `kagent/personal-assistant`, and enter `morning-brief` in the **Name** field.

3. Set **Time zone** to your own, leave **Repeat** set to **Daily**, and set **At time** to when you start your day.

4. In the **Prompt** field, enter what you want every morning, such as the following.
   ```text
   Give me a short plan for today: three priorities and one reminder to take a break. Include the weather in Toronto.
   ```

5. Leave **Enable Schedule** on, and click **Create schedule**.

6. To see a brief now, click **Run** on the page of the schedule. Each run appears in the **Execution history** table, with a link to its conversation.

## Where to take it next

Your assistant is one agent with a prompt, a tool, and a schedule. Each of these makes it more capable.

| Idea | How |
| --- | --- |
| Let it search documentation | Register a second MCP server, such as `search.solo.io/mcp`, and add it to the assistant. |
| Make it ask before it acts | Turn on approval for a tool, as in [Human in the loop]({{< link path="get-started/human-in-the-loop" >}}). |
| Share its voice with other agents | Keep its tone and rules in a [prompt library]({{< link path="get-started/prompt-library" >}}). |
| Run it on another model | [Add a model]({{< link path="get-started/add-a-model" >}}), and choose it in the assistant's edit form. |

## YAML version

Everything that you did in the UI, apart from the schedule, is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML.

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
<summary>The personal-assistant agent, with the weather tool</summary>

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

A schedule is not a Kubernetes resource, so it has no YAML. To create one without the UI, use the API, as described in [Scheduled runs]({{< link path="agents/scheduled-runs#manage-schedules-with-the-api" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/k8s-sre" >}}` title="Build a K8s SRE" subtitle="Build an agent that investigates your cluster and asks before it acts." >}}
  {{< card link=`{{< link path="get-started/cve-agent" >}}` title="Build a CVE agent" subtitle="Build an agent that reports the newest exploited vulnerabilities." >}}
  {{< card link=`{{< link path="get-started" >}}` title="All tutorials" subtitle="See every project and single-task tutorial." >}}
{{< /cards >}}
