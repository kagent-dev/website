---
title: Human in the loop
description: Make an agent stop and ask for your approval before it runs a tool, in the kagent UI.
weight: 19
author: kagent.dev
---

{{< tutorial-banner >}}

Some agents only answer questions. Others call tools that change something, cost money, or read sensitive data. For those, you can put a person in the loop: the agent stops before it runs the tool, shows you what it wants to do, and continues only after you approve.

In this tutorial, you turn on approval for the weather tool of the personal assistant, and then approve a call in the chat. The weather tool is harmless, which makes it a safe one to practice on.

## Before you begin

1. Complete [Build an Agent]({{< link path="get-started/build-an-agent" >}}) and [Add an MCP server]({{< link path="get-started/add-an-mcp-server" >}}), so that the `personal-assistant` agent has the weather tool.
2. Open the kagent UI with `kagent dashboard`.

## Require approval for a tool

{{< reuse-image src="img/kagent-ui-require-approval.gif" alt="The kagent UI editing the personal-assistant agent and selecting Require approval on its weather tools" caption="Figure: Turning on approval for the agent's weather tools, sped up" >}}

1. In the sidebar, click **Agents**. In the row of the `personal-assistant` agent, click the edit icon.

2. Under **Tools from MCP servers**, find the row of the `kagent/weather` server, and select **Require approval**.

   Approval belongs to the row, not to one tool. It covers every tool that the row lists, or every tool on the server when the list is left on **All tools**.

3. Click **Save agent**, and wait until the agent returns to **Ready**.

## Approve a tool call

1. Click the agent name to open its chat page, and start a **New chat**.

2. Ask something that needs the tool, such as `What is the weather in Toronto right now?`

3. The agent stops, and the chat shows that the agent is asking permission to run a tool, with the name of the tool. Click **Approve** to let the call run. The agent then finishes its answer.

   To refuse instead, click **Reject**. You can type a reason, and then click **Send rejection**. The agent receives the reason and carries on without the tool.

## Mix free tools and approved tools

One server can supply both kinds. Add the server twice: once with the tools that the agent can use freely, and once with the tools that need approval, with **Require approval** selected on the second row. [Build a K8s SRE]({{< link path="get-started/k8s-sre" >}}) does this with the Kubernetes tools.

Agents on the `codex` and `claude` harnesses accept each server only once, so approval there covers the whole server.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML. Approval is the `requireApproval` field of a tool binding.

<details class="doc-details">
<summary>The personal-assistant agent, with approval on its weather tools</summary>

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
            requireApproval: true
            server:
              kind: RemoteMCPServer
              name: weather
EOF
```

</details>

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Read how pauses work, which harnesses support them, and how to build a client that answers them." >}}
  {{< card link=`{{< link path="get-started/k8s-sre" >}}` title="Build a K8s SRE" subtitle="Build an agent that asks before it changes the cluster." >}}
{{< /cards >}}
