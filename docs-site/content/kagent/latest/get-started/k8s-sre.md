---
title: Build a K8s SRE
description: Build a Kubernetes SRE agent in the kagent UI that investigates the cluster on its own and asks for approval before it changes anything.
weight: 3
author: kagent.dev
---

{{< tutorial-banner >}}

Build an agent that works like a careful site reliability engineer. It reads the cluster on its own to find out what is wrong, and it stops to ask you before it changes anything.

kagent installs an MCP server, `kagent-tool-server`, with tools for Kubernetes. You give the agent two sets of those tools: read-only tools that it can call freely, and tools that change the cluster, which need your approval on every call.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Open the kagent UI with `kagent dashboard`.

## Create the agent

{{< reuse-image src="img/kagent-ui-k8s-sre.gif" alt="The kagent UI creating an agent named k8s-sre with read-only Kubernetes tools and a second set of tools that require approval" caption="Figure: Creating the k8s-sre agent with two sets of tools, sped up" >}}

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `k8s-sre`. Leave the **Namespace** as `kagent`, and leave **Shared harness** set to `kagent-default`.

3. In the **Template** section, select **Inline**, and fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | `kagent/default-model-config` |
   | **Description** | `Kubernetes SRE that investigates before it acts` |

4. In the **System prompt** field, enter the following prompt.
   ```text
   You are a Kubernetes site reliability engineer.
   Investigate with your read-only tools before you suggest a change.
   Explain what you found, then propose the smallest fix.
   Never guess. When the tools cannot answer, say so.
   ```

## Give it read-only tools

1. Under **Tools from MCP servers**, click **Add an MCP server**, and choose `kagent/kagent-tool-server` from the **MCP server** list.

2. From the tool list beside it, choose the tools that only read. Type part of a name to find a tool.

   | Tool | What it does |
   | --- | --- |
   | `k8s_get_resources` | Lists resources, such as pods and deployments. |
   | `k8s_describe_resource` | Describes one resource. |
   | `k8s_get_events` | Reads events. |
   | `k8s_get_pod_logs` | Reads the logs of a pod. |

   Leave **Require approval** cleared for this set.

## Give it tools that need approval

1. Click **Add an MCP server** again, and choose `kagent/kagent-tool-server` a second time.

2. From the tool list, choose `k8s_scale` and `k8s_rollout`.

3. Select **Require approval**. The agent now pauses before each of these tools runs, and waits for you to approve or reject the call.

4. Click **Create agent**, and then click **Refresh** until the agent is **Ready**.

## Ask it about the cluster

1. Click the agent name, `k8s-sre`, to open its chat page.

2. Ask a question that the read-only tools can answer, such as `Are any pods in the kagent namespace unhealthy?`

3. Ask for a change, such as `Scale the kagent-ui deployment to 2 replicas.` The agent asks for your approval before it calls `k8s_scale`.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML.

<details class="doc-details">
<summary>The k8s-sre agent, with both sets of tools</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: k8s-sre
  namespace: kagent
spec:
  harnessRef:
    name: kagent-default
  template:
    inline:
      description: Kubernetes SRE that investigates before it acts
      modelConfig:
        name: default-model-config
      systemPrompt: |-
        You are a Kubernetes site reliability engineer.
        Investigate with your read-only tools before you suggest a change.
        Explain what you found, then propose the smallest fix.
        Never guess. When the tools cannot answer, say so.
      tools:
        - mcp:
            server:
              kind: RemoteMCPServer
              name: kagent-tool-server
            tools:
              - k8s_get_resources
              - k8s_describe_resource
              - k8s_get_events
              - k8s_get_pod_logs
        - mcp:
            requireApproval: true
            server:
              kind: RemoteMCPServer
              name: kagent-tool-server
            tools:
              - k8s_scale
              - k8s_rollout
EOF
```

</details>

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Read how tool approval works." >}}
  {{< card link=`{{< link path="reference/tools-ecosystem" >}}` title="Tools ecosystem" subtitle="See every tool that the built-in server offers." >}}
  {{< card link=`{{< link path="get-started/scheduled-agent" >}}` title="Build a scheduled agent" subtitle="Have an agent report on the cluster every night." >}}
{{< /cards >}}
