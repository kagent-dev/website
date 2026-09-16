---
title: Your first agent
description: Create and communicate with your first agent by using the kagent project.
weight: 10
author: kagent.dev
---

This guide walks you through creating an agent, from applying a Harness and an AgentTemplate to holding a conversation with the AgentInstance that they produce. You apply the Harness and the AgentTemplate as Kubernetes resources, and you create and talk to the AgentInstance with the kagent CLI. For definitions of each of these components, review the [core concepts]({{< link path="about/core-concepts" >}}). For an overview of how each component fits together in kagent, review the [architecture]({{< link path="about/architecture" >}}). For the complete schema of every field that this guide sets, see the [API reference]({{< link path="reference/api-ref" >}}).

## Before you begin

1. [Install kagent with a WorkerPool provisioned]({{< link path="setup/installation" >}}).
2. Download the kagent CLI.
   ```bash
   curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash
   ```

3. Install [`jq`](https://jqlang.org/download/), to read the AgentInstance ID out of the CLI's JSON output.

> [!NOTE]
> The CLI reaches the kagent controller at `localhost:8083`. When nothing serves that port, the CLI runs `kubectl port-forward` against the `kagent-controller` service for you, and closes the forward when the command exits. Keep `kubectl` on your path, and keep your kubeconfig pointed at the cluster that runs kagent.

## Create a Harness and an AgentTemplate

1. Apply a `Harness` that uses kagent's native runtime. Its `substrate` section names the [WorkerPool]({{< link path="about/agent-substrate#workers-and-workerpools" >}}) that this Harness's Actors run on, and the object storage location for their [snapshots]({{< link path="about/agent-substrate#suspend-snapshot-and-resume" >}}).
   ```yaml
   apiVersion: kagent.dev/v1alpha3
   kind: Harness
   metadata:
     name: my-first-harness
     namespace: kagent
   spec:
     kagent: {}
     workload:
       # Your kagent release's runtime image
       image: <runtime-image>@sha256:<digest>
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         # The object storage location your cluster's Substrate installation uses for Actor snapshots
         location: gs://<your-bucket>/kagent/
     allowedAgentTemplates:
       selector:
         matchLabels:
           # Selector to match the AgentTemplate label
           kagent.dev/harness: my-first-harness
   ```
   > [!NOTE]
   > An `AgentTemplate` has no field naming this Harness. The `kagent.dev/harness: my-first-harness` selector is a convention that this guide uses to match the `kagent.dev/harness` label in the next step. However, you can choose any label key and value, as long as the Harness selector and the AgentTemplate's labels match.

2. Apply an `AgentTemplate` that is labeled to match the Harness's `allowedAgentTemplates` selector. The `modelConfig` field references the `default-model-config` {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} that was automatically created for the model provider API key that you provided during kagent installation.
   ```yaml
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: my-first-agent
     namespace: kagent
     labels:
       # Label matching the Harness selector
       kagent.dev/harness: my-first-harness
   spec:
     description: My first kagent agent
     modelConfig:
       # Default config created by the kagent install guide
       name: default-model-config
     systemPrompt: You are a concise, helpful assistant.
   ```

3. Confirm that the pair is ready. The `HARNESS` column lists each Harness that admitted this AgentTemplate, and `READY` reports whether kagent compiled a runtime {{< gloss "Revision" >}}revision{{< /gloss >}} for that pairing.
   ```bash
   kagent get agent-template my-first-agent
   ```

   Example output:
   ```console
   +----------------+------------------+-------+----------------------+
   | NAME           | HARNESS          | READY | CREATED              |
   +----------------+------------------+-------+----------------------+
   | my-first-agent | my-first-harness | TRUE  | 2026-08-31T15:01:44Z |
   +----------------+------------------+-------+----------------------+
   ```

   An empty `HARNESS` column with a `READY` value of `UNKNOWN` means that the kagent controller has not yet reconciled the pair. Wait a few seconds, then check again. If `READY` stays `FALSE`, inspect the individual conditions to find which stage failed.
   ```bash
   kagent get agent-template my-first-agent -o json
   ```

   Each entry in `status.harnesses` reports four conditions, ending in `Ready`. The `Accepted` condition covers the label selector match, `ResolvedRefs` covers the ModelConfig and tool references, `Compatible` covers whether the resolved configuration suits the Harness runtime, and `Ready` covers the compiled revision itself.

## Create the AgentInstance

An AgentInstance is one running conversation. Creating it starts an Actor on the WorkerPool from the revision that kagent compiled for the Harness and AgentTemplate pair.

1. Create an AgentInstance from the Harness and AgentTemplate pair.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

   The command returns output only after the AgentInstance reaches the `READY` state. Example output:
   ```console
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | ID                                   | AGENT TEMPLATE | HARNESS          | STATE | CREATED              |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | my-first-harness | READY | 2026-08-31T15:02:10Z |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   ```

   An error reporting that the AgentTemplate and Harness have no ready prepared revision means that the pair is not `READY` yet. Return to step 3 of the previous section to check the conditions.

2. Save the AgentInstance's ID to an environment variable.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   echo $INSTANCE_ID
   ```

## Talk to your agent

1. Send a message to the AgentInstance. The CLI holds the conversation over the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) protocol.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "What is 2+2?"
   ```

   The agent's reply prints as text.
   ```console
   4
   ```

2. Send a follow-up message to the same AgentInstance. An AgentInstance holds the {{< gloss "Transcript" >}}transcript{{< /gloss >}} of its conversation, so the agent answers with the earlier turns in context.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "What did I just ask you?"
   ```

   ```console
   You asked what 2+2 is.
   ```

> [!NOTE]
> An AgentInstance gives its Worker back at the end of every turn. The AgentInstance itself stays `READY`, because suspension applies to the Actor running underneath it rather than to the conversation, and the next `kagent invoke` resumes that Actor automatically. To understand what happens to the Actor in between, see [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume" >}}).

The `invoke` command takes a few more options that are useful beyond a first conversation.

| Option | Description |
| ------ | ----------- |
| `--file` | Read the task from a file, or from standard input with `-`, instead of passing it inline with `--task`. |
| `--stream` | Print the reply as the agent produces it, rather than waiting for the complete answer. |

> [!TIP]
> Run `kagent` with no arguments to open an interactive workspace in your terminal, where you can browse your AgentInstances and chat with them without passing an ID to each command.

## Clean up

> [!IMPORTANT]
> Other guides build on the Harness, AgentTemplate, and AgentInstance that you created here, including [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}) and [Agent Substrate]({{< link path="examples/agent-substrate" >}}). Unless you are finished with the kagent guides, leave the resources in place.

To remove the resources, follow these steps.

1. Delete every AgentInstance that was created from the AgentTemplate. Later guides create their own instances from the same pair, so delete them all rather than only the one that you saved. Deleting the Harness and the AgentTemplate does not delete the AgentInstances that you created from them, so delete the instances first.
   ```bash
   kagent get agent-instance -o json \
     | jq -r '.agentInstances[] | select(.agentTemplate.name == "my-first-agent") | .id' \
     | xargs -n1 kagent delete agent-instance
   ```

2. Delete the AgentTemplate and the Harness.
   ```bash
   kubectl delete agenttemplate my-first-agent -n kagent
   kubectl delete harness my-first-harness -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Bind a Model Context Protocol tool so that your agent can act on live cluster data." >}}
  {{< card link=`{{< link path="about/agent-substrate" >}}` title="Agent Substrate architecture" subtitle="Understand what happens to your AgentInstance's Actor when it sits idle." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Choose from the full set of Harness runtime options." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Give your agent capabilities beyond its system prompt." >}}
{{< /cards >}}
