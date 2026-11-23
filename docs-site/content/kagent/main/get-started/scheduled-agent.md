---
title: Build a scheduled agent
description: Build an agent in the kagent UI that writes a cluster health report every day, without being asked.
weight: 4
author: kagent.dev
---

{{< tutorial-banner >}}

Build an agent that works on a timer. Every day, it reads the cluster, writes a short health report, and leaves the report in a conversation for you to read. Nobody has to ask.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Open the kagent UI with `kagent dashboard`.

## Create the agent

{{< reuse-image src="img/kagent-ui-scheduled-agent.gif" alt="The kagent UI creating an agent named cluster-reporter and a daily schedule that runs it" caption="Figure: Creating the cluster-reporter agent and its daily schedule, sped up" >}}

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `cluster-reporter`. Leave the **Namespace** as `kagent`, and leave **Shared harness** set to `kagent-default`.

3. In the **Template** section, select **Inline**, and fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | `kagent/default-model-config` |
   | **Description** | `Writes a short cluster health report` |

4. In the **System prompt** field, enter the following prompt.
   ```text
   You write a short health report for a Kubernetes cluster.
   List pods that are not Running or Ready, and recent Warning events.
   Keep the report under ten lines. If everything is healthy, say so in one line.
   ```

5. Under **Tools from MCP servers**, click **Add an MCP server**, and choose `kagent/kagent-tool-server`. From the tool list beside it, choose `k8s_get_resources` and `k8s_get_events`. An agent that runs unattended gets only tools that read.

6. Click **Create agent**, and then click **Refresh** until the agent is **Ready**.

## Schedule it

1. In the sidebar, click **Schedules**, and then click **New Schedule**.

2. From the **Agent** list, choose `kagent/cluster-reporter`.

3. In the **Name** field, enter `nightly-health-report`.

4. Leave **Repeat** set to **Daily**, and set **At time** and **Time zone** to when you want the report.

5. In the **Prompt** field, enter `Write the health report for all namespaces.`

6. Leave **Enable Schedule** on, and click **Create schedule**.

## Read the reports

The page of the schedule shows the next execution and an **Execution history** table. To get the first report without waiting, click **Run**. Each row of the table links to the conversation of that run, which holds the report.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML.

<details class="doc-details">
<summary>The cluster-reporter agent</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: cluster-reporter
  namespace: kagent
spec:
  harnessRef:
    name: kagent-default
  template:
    inline:
      description: Writes a short cluster health report
      modelConfig:
        name: default-model-config
      systemPrompt: |-
        You write a short health report for a Kubernetes cluster.
        List pods that are not Running or Ready, and recent Warning events.
        Keep the report under ten lines. If everything is healthy, say so in one line.
      tools:
        - mcp:
            server:
              kind: RemoteMCPServer
              name: kagent-tool-server
            tools:
              - k8s_get_resources
              - k8s_get_events
EOF
```

</details>

A schedule is not a Kubernetes resource, so it has no YAML. To create one without the UI, use the API, as described in [Scheduled runs]({{< link path="agents/scheduled-runs#manage-schedules-with-the-api" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/scheduled-runs" >}}` title="Scheduled runs" subtitle="Read how schedules work and how to manage one with the API." >}}
  {{< card link=`{{< link path="get-started/k8s-sre" >}}` title="Build a K8s SRE" subtitle="Build an agent that investigates the cluster with you." >}}
{{< /cards >}}
