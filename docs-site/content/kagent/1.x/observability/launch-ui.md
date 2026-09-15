---
title: Launch the UI
description: Open the kagent dashboard, then read the agents, conversations, and Agent Substrate capacity that it reports.
weight: 10
author: kagent.dev
---

The kagent UI is a read-and-write console for everything the controller knows about: the agents you defined, the conversations the agents hold, and the Agent Substrate capacity that those conversations run on. The kagent chart installs the UI alongside the controller, so a cluster that follows [Install kagent]({{< link path="setup/installation" >}}) already runs a UI instance.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}) in your cluster.

2. Confirm that the UI service exists.

   ```bash
   kubectl get svc -n kagent kagent-ui
   ```

   Example output:

   ```console
   NAME        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
   kagent-ui   ClusterIP   10.96.174.203   <none>        8080/TCP   3m
   ```

## Open the dashboard

The UI service is a `ClusterIP` by default, so it is reachable only from inside the cluster. Forward it to your machine with the kagent CLI or with `kubectl`. Both routes end at the same address, `http://localhost:8082`.

{{< tabs >}}
{{% tab name="kagent CLI" %}}
1. Run the dashboard command to forward the service and open the dashboard in your default browser.

   ```bash
   kagent dashboard
   ```

   Example output:

   ```console
   kagent dashboard is available at http://localhost:8082
   Press the Enter Key to stop the port-forward...
   ```

2. When you are done, press `Enter` in the terminal to stop the port-forward.

> [!NOTE]
> `kagent dashboard` opens a browser only on macOS. On Linux and Windows the command prints the `kubectl` port-forward command and exits, so follow the port-forward steps instead.
{{% /tab %}}
{{% tab name="Port-forward for local testing" %}}
1. Forward the `kagent-ui` service to your machine, and leave the command running.

   ```bash
   kubectl port-forward -n kagent service/kagent-ui 8082:8080
   ```

2. Open [http://localhost:8082](http://localhost:8082) in your browser.

3. When you are done, press `Ctrl+C` in the terminal that holds the port-forward.
{{% /tab %}}
{{< /tabs >}}

The dashboard opens on a summary of what the controller has loaded. A fresh installation reports no agents and no conversations, and already counts the model configuration and the {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) servers that the chart installed.

{{< reuse-image-light src="img/kagent-ui-dashboard.png" alt="The kagent dashboard after a fresh installation" caption="Figure: The kagent dashboard after a fresh installation" >}}
{{< reuse-image-dark srcDark="img/kagent-ui-dashboard-dark.png" alt="The kagent dashboard after a fresh installation" caption="Figure: The kagent dashboard after a fresh installation" >}}

## Explore the UI

The left menu groups the console by the resource each page reads, so the page you want follows from the resource you are asking about.

| Page | Shows |
| ---- | ----- |
| **Dashboard** | Counts of agents, model configurations, MCP servers, and discovered tools, plus recent conversations. |
| **Agents** | Every {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} and {{< gloss "Harness" >}}Harness{{< /gloss >}} pairing, and the conversations held with each. |
| **Schedules** | Agents that run automatically, each execution starting a new conversation. |
| **Models** | The {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} resources that agents name, and the providers behind them. |
| **MCP Servers** | Connected {{< gloss "RemoteMCPServer" >}}RemoteMCPServer{{< /gloss >}} resources and the tools discovered from each. |
| **Prompts** | Prompt libraries, which hold reusable fragments that an AgentTemplate includes in its instructions. |
| **Substrate** | WorkerPools, Actors, and Workers, read from both Kubernetes and the Agent Substrate API. |

Start at the **Agents** page to review the agents and their backing pairs of AgentTempate and Harness resources. The page lists the derived pairs across its **Agents**, **Templates**, and **Harnesses** tabs.

{{< reuse-image-light src="img/kagent-ui-agents.png" alt="The Agents page, listing agents, templates, and harnesses" caption="Figure: The Agents page" >}}
{{< reuse-image-dark srcDark="img/kagent-ui-agents-dark.png" alt="The Agents page, listing agents, templates, and harnesses" caption="Figure: The Agents page" >}}

> [!NOTE]
> The agents list is derived, not authored. kagent builds it from the AgentTemplate and Harness resources that already exist, so an agent appears when a Harness accepts a template rather than when you create an `Agent` resource. kagent 1.0 has no `Agent` custom resource. To create the pair, see [Create your first agent]({{< link path="get-started/your-first-agent" >}}).

## Read a conversation

Opening an agent and sending a message creates an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}}, which is one conversation scheduled onto a Substrate {{< gloss "Actor" >}}Actor{{< /gloss >}}. The conversation view shows the transcript, the tool calls the agent made along the way, and the controls that branch the conversation.

{{< reuse-image-light src="img/kagent-ui-chat.png" alt="A conversation with an agent, showing a tool call and a checkpoint" caption="Figure: A conversation with an agent" >}}
{{< reuse-image-dark srcDark="img/kagent-ui-chat-dark.png" alt="A conversation with an agent, showing a tool call and a checkpoint" caption="Figure: A conversation with an agent" >}}

Two controls under the transcript branch the conversation rather than continue it.

- **Checkpoint** pins the snapshot that the AgentInstance most recently suspended to, and records how far the transcript advanced. Agent Substrate does not collect a pinned snapshot, so the point stays available to return to. To understand how pinning works, and why a turn must be complete first, see [Checkpoints]({{< link path="substrate-runtime/suspend-and-resume#checkpoints" >}}).
- **Fork** creates a second AgentInstance from a checkpoint, continuing from the point that the checkpoint pinned. A {{< gloss "Fork" >}}fork{{< /gloss >}} inherits the checkpoint's {{< gloss "Revision" >}}Revision{{< /gloss >}}, so later edits to the AgentTemplate do not change what it runs, and new turns append only to the fork. For the same operation over the gRPC API, see [Fork the conversation into a second agent]({{< link path="examples/agent-substrate#fork-the-conversation-into-a-second-agent" >}}).

> [!NOTE]
> A checkpoint is always taken at the latest turn boundary, so the UI offers **Fork** on your own most recent message and not on earlier ones.

## Check Agent Substrate capacity

The **Substrate** page shows whether there is capacity for an agent to run. It reads WorkerPools and ActorTemplates from Kubernetes, and live Actors and Worker assignments from the Agent Substrate API.

{{< reuse-image-light src="img/kagent-ui-substrate.png" alt="The Substrate page, showing one worker pool and an idle worker" caption="Figure: The Substrate page" >}}
{{< reuse-image-dark srcDark="img/kagent-ui-substrate-dark.png" alt="The Substrate page, showing one worker pool and an idle worker" caption="Figure: The Substrate page" >}}

Read the page from the top tiles down.

| Tile | Means |
| ---- | ----- |
| **Worker pools** | {{< gloss "WorkerPool" >}}WorkerPools{{< /gloss >}} that an operator has provisioned. No Harness can run an agent until at least one exists. |
| **Templates ready** | {{< gloss "ActorTemplate" >}}ActorTemplates{{< /gloss >}} that have compiled and are ready to be instantiated. |
| **Actors running** | Live Actors, each one an AgentInstance holding a conversation. |
| **Workers busy** | {{< gloss "Worker" >}}Workers{{< /gloss >}} currently assigned to an Actor, against the total provisioned. |

A fresh installation reports one worker pool, no actor templates, and no actors, because nothing has created an agent yet. The Workers table still lists the pool's worker as `idle`. That idle worker confirms that capacity is provisioned and waiting for the first agent.

> [!NOTE]
> An empty Actors table on a cluster that does have agents indicates an issue at the level of the Agent Substrate API rather than at kagent. The page reports `ate-api reported no actors in this scope` when it reaches the API and gets an empty answer, so check the scope selector before investigating further.

## Expose the UI outside the cluster

Port-forwarding suits local access and stops when you close the terminal. For a deployment that a team reaches, change how the chart publishes the service. Add any of the following values to the `helm upgrade --install kagent` command from [Install kagent]({{< link path="setup/installation#install-kagent" >}}).

### LoadBalancer service

To provision a cloud load balancer for the UI, set the service type.

```yaml
ui:
  service:
    type: LoadBalancer
```

Then read the external address from the service.

```bash
kubectl get svc -n kagent kagent-ui
```

### OpenShift route

On OpenShift clusters kagent creates an edge-terminated `Route` for the UI whenever the `route.openshift.io/v1` API is present. The route is enabled by default through `ui.route.enabled`.

The default HAProxy timeout is raised to 120 minutes, because agent conversations hold long-lived streaming connections that a shorter timeout terminates mid-reply. To change it, set the annotation.

```yaml
ui:
  openshiftRoute:
    annotations:
      haproxy.router.openshift.io/timeout: 60m
```

To front the UI with your own ingress instead, set `ui.route.enabled: false` to stop kagent creating the route.

### Gateway API HTTPRoute

On a cluster that runs a Kubernetes Gateway API implementation such as kgateway, Istio, or Envoy Gateway, publish the UI through an `HTTPRoute`.

```yaml
ui:
  httpRoute:
    enabled: true
    parentRefs:
      - name: my-gateway
        namespace: gateway-system
    hostnames:
      - kagent.example.com
```

The `parentRefs` field is required when `enabled` is `true`, and it must reference a `Gateway` that already exists. The `HTTPRoute` resource also requires the Gateway API custom resource definitions (`gateway.networking.k8s.io/v1`) in the cluster.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Create your first agent" subtitle="Pair an AgentTemplate with a Harness, then hold a conversation with the result." >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Follow one agent request from the controller through to the Actor that ran it." >}}
  {{< card link=`{{< link path="observability/audit-prompts" >}}` title="Audit prompts" subtitle="Export every prompt and reply as a log event for security and compliance review." >}}
{{< /cards >}}
