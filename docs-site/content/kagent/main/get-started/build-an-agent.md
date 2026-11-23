---
title: Build an Agent
description: Create a personal assistant agent in the kagent UI, then make its behavior reusable with a shared template.
weight: 10
author: kagent.dev
---

Build your first agent in the kagent UI: a personal assistant that you create from one form. Then turn its behavior into a shared template that other agents can reuse.

An agent has two halves. A **template** describes what the agent does: its model, its system prompt, and its tools. A **harness** describes where and how the agent runs. `kagent install` creates a `kagent-default` harness for you, so the first agent needs only the template half.

To build the same kind of agent from YAML and the CLI instead, see [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Open the kagent UI.
   ```bash
   kagent dashboard
   ```

## Create a personal assistant

{{< reuse-image src="img/kagent-ui-build-agent.gif" alt="The kagent UI creating an agent named personal-assistant with an inline template, then opening its chat page" caption="Figure: Creating the personal-assistant agent in the UI, sped up" >}}

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `personal-assistant`. Leave the **Namespace** as `kagent`.

3. In the **Harness** section, leave **Shared harness** set to `kagent-default`.

4. In the **Template** section, select **Inline**. An inline template belongs to this agent only, which is the shortest path to a working agent.

5. Fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | `kagent/default-model-config`, the model that the installation set up from your API key. |
   | **Description** | `My personal assistant` |
   | **System prompt** | `You are my personal assistant. Be friendly and concise. Help me plan my day, draft messages, and answer questions.` |

   Leave the other fields as they are. You add tools in [Add an MCP server]({{< link path="get-started/add-an-mcp-server" >}}).

6. Click **Create agent**. The UI returns to the **Agents** list, where the agent shows the **Preparing** status while kagent builds a snapshot of its runtime.

7. Click **Refresh** until the status changes to **Ready**. This step usually takes less than a minute.

8. Click the agent name, `personal-assistant`, to open its chat page. Enter a message, such as `What can you help me with?`, and click **Send**. Each chat that you start is a Session with the agent.

## Make the behavior reusable

The personal assistant keeps its behavior inline, so no other agent can use it. A shared **template** holds the same settings as an object of its own. Every agent that references the template gets its model, prompt, and tools, and a change to the template reaches all of them.

{{< reuse-image src="img/kagent-ui-agent-template.gif" alt="The kagent UI creating an agent template named assistant-template, then an agent named team-assistant that references it" caption="Figure: Creating a shared template and an agent that references it, sped up" >}}

1. On the **Agents** page, click **New Template**.

2. Fill in the template, and then click **Create template**.

   | Field | Value |
   | --- | --- |
   | **Name** | `assistant-template` |
   | **Model configuration** | `kagent/default-model-config` |
   | **Description** | `A friendly, concise assistant` |
   | **System prompt** | `You are a personal assistant. Be friendly and concise. Help plan the day, draft messages, and answer questions.` |

   The template is listed on the **Templates** tab of the **Agents** page.

3. Click **New Agent**, and enter `team-assistant` in the **Name** field.

4. In the **Template** section, leave **Reference** selected, and choose `assistant-template` from the **Shared template** list.

5. Click **Create agent**, and then click **Refresh** until the agent is **Ready**.

The **Agents** list now shows both agents. The **Template** column reads `Inline` for `personal-assistant` and `assistant-template` for `team-assistant`.

## Harnesses

Both agents run on the `kagent-default` harness. A harness sets the runtime that compiles and runs a template, the image, and the worker pool that the agent's sessions are scheduled on. `kagent install` also creates the `codex-default` and `claude-default` harnesses, which run a template on those runtimes.

To create a harness of your own, click **New Harness** on the **Agents** page. For the options, see [Agent harness]({{< link path="agents/agent-harness" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/add-an-mcp-server" >}}` title="Add an MCP server" subtitle="Give the personal assistant a weather tool from the UI." >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Build an agent from YAML and talk to it with the CLI." >}}
  {{< card link=`{{< link path="about/core-concepts" >}}` title="Core concepts" subtitle="Read how templates, harnesses, agents, and sessions fit together." >}}
{{< /cards >}}
