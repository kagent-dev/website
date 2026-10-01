---
title: Your first agent
description: Create and communicate with your first agent by using the kagent project.
weight: 10
author: kagent.dev
---

This guide walks you through creating an agent, from applying a Harness and an AgentTemplate to holding a conversation with the Agent that pairs them. You apply the Harness, the AgentTemplate, and the Agent as Kubernetes resources. You create and talk to a Session with the kagent CLI. For definitions of each of these components, review the [core concepts]({{< link path="about/core-concepts" >}}). For an overview of how each component fits together in {{< reuse "kagent-docs/snippets/name-product.md" >}}, review the [architecture]({{< link path="about/architecture/kagent" >}}). For the complete schema of every field that this guide sets, see the [API reference]({{< link path="reference/api-ref" >}}).

## Before you begin

1. [Install kagent with a WorkerPool provisioned]({{< link path="setup/installation" >}}).
2. Download the kagent CLI. The `--version` flag matches the CLI to the release that these docs cover.
   ```bash
   curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
   ```

3. Install [`jq`](https://jqlang.org/download/), to read the Session ID out of the CLI's JSON output.

> [!NOTE]
> The CLI reaches the kagent controller at `localhost:8083`. When nothing serves that port, the CLI runs `kubectl port-forward` against the `kagent-controller` service for you, and closes the forward when the command exits. Keep `kubectl` on your path, and keep your kubeconfig pointed at the cluster that runs kagent.

## Create a Harness, an AgentTemplate, and an Agent

Three resources define a runnable agent: a Harness holds the runtime, an AgentTemplate holds the behavior, and an Agent pairs one of each.

1. Apply a `Harness` that uses kagent's native runtime. Its `substrate` section names the [WorkerPool]({{< link path="about/architecture/agent-substrate#workers-and-workerpools" >}}) that this Harness's Actors run on, and the object storage location for their [snapshots]({{< link path="about/architecture/agent-substrate#suspend-snapshot-and-resume" >}}).
   ```yaml
   apiVersion: api.kagent.dev/v1alpha3
   kind: Harness
   metadata:
     name: my-first-harness
     namespace: kagent
   spec:
     kagent: {}
     workload:
       # kagent's native runtime image, pinned by digest
       image: {{< reuse "kagent-docs/versions/runtime-image.md" >}}
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         # The bucket that the Agent Substrate chart creates in its bundled object store.
         # If your Substrate installation uses your own object storage, use that location instead.
         location: s3://ate-snapshots/kagent/
   ```

2. Apply an `AgentTemplate`. The `modelConfig` field references the `default-model-config` {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} that was automatically created for the model provider API key that you provided during kagent installation.
   ```yaml
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: my-first-template
     namespace: kagent
   spec:
     description: My first kagent agent
     modelConfig:
       # Default config created by the kagent install guide
       name: default-model-config
     systemPrompt: You are a concise, helpful assistant.
   ```

3. Apply an `Agent` that names both. Nothing pairs a Harness and an AgentTemplate implicitly, so this resource is what makes the two runnable together.
   ```yaml
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: my-first-agent
     namespace: kagent
   spec:
     templateRef:
       name: my-first-template
     harnessRef:
       name: my-first-harness
   ```
   > [!NOTE]
   > Each side of the pairing takes either a reference, as shown here, or a complete spec written inline under `spec.template` or `spec.harness`. The two choices are independent, so an Agent can reference one side and inline the other. An inline spec is a complete value rather than an override, and kagent creates no Kubernetes object to back it.

4. Confirm that the Agent is ready. `READY` reports whether kagent compiled and prepared a runtime {{< gloss "Revision" >}}revision{{< /gloss >}} for the pair.
   ```bash
   kagent agent get my-first-agent
   ```

   Example output:
   ```console
   +----------------+-------+----------------------+
   | NAME           | READY | CREATED              |
   +----------------+-------+----------------------+
   | my-first-agent | True  | 2026-08-31T15:01:44Z |
   +----------------+-------+----------------------+
   ```

   A `READY` value of `UNKNOWN` means that the kagent controller has not yet reconciled the Agent. Wait a few seconds, then check again. A `READY` value of `False` right after you apply the Agent is also expected, because kagent builds a snapshot of the agent's runtime before it reports the Agent ready. This step can take a minute. If `READY` stays `False`, inspect the individual conditions to find which stage failed.
   ```bash
   kubectl get agent my-first-agent -n kagent -o jsonpath='{.status.conditions}' | jq
   ```

   An Agent reports four conditions, ending in `Ready`. The `Accepted` condition covers the shape of the spec, and `ResolvedRefs` covers the AgentTemplate, Harness, ModelConfig, and tool references. `Compatible` covers whether the resolved configuration suits the Harness runtime, and `Ready` covers the compiled revision itself. `status.warnings` lists non-blocking compatibility decisions that the compiler made.

## Create a Session

A Session is one running conversation with an Agent. Creating it starts an Actor on the WorkerPool from the Agent's latest successful revision.

1. Create a Session against the Agent, and save its ID to an environment variable.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent my-first-agent -o json | jq -r '.session.id')
   echo $SESSION_ID
   ```

   The command returns only after the Session reaches the `READY` state. Run it without `-o json` to see the table instead:
   ```console
   +--------------------------------------+----------------+-------+----------------------+
   | ID                                   | AGENT          | STATE | CREATED              |
   +--------------------------------------+----------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | READY | 2026-08-31T15:02:10Z |
   +--------------------------------------+----------------+-------+----------------------+
   ```

   An error reporting that the Agent has no ready prepared revision means that the Agent is not `Ready` yet. Return to step 4 of the previous section to check the conditions.

## Talk to your agent

1. Send a message to the Session. The CLI holds the conversation over the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) protocol.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "What is 2+2?"
   ```

   The agent's reply prints as text.
   ```console
   4
   ```

2. Send a follow-up message to the same Session. A Session holds the {{< gloss "Transcript" >}}transcript{{< /gloss >}} of its conversation, so the agent answers with the earlier turns in context.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "What did I just ask you?"
   ```

   ```console
   You asked what 2+2 is.
   ```

> [!NOTE]
> A Session gives its Worker back at the end of every turn. The Session itself stays `READY`, because suspension applies to the Actor running underneath it rather than to the conversation, and the next `kagent agent invoke` resumes that Actor automatically. To understand what happens to the Actor in between, see [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume" >}}).

The `invoke` command takes a few more options that are useful beyond a first conversation.

| Option | Description |
| ------ | ----------- |
| `--file` | Read the task from a file, or from standard input with `-`, instead of passing it inline with `--task`. |
| `--stream` | Print the reply as the agent produces it, rather than waiting for the complete answer. |

> [!TIP]
> Run `kagent` with no arguments to open an interactive workspace in your terminal, where you can browse your Sessions and chat with them without passing an ID to each command.

## Clean up

> [!IMPORTANT]
> Other guides build on the Harness, AgentTemplate, and Agent that you created here, including [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}) and [Agent Substrate]({{< link path="examples/agent-substrate" >}}). Unless you are finished with the kagent guides, leave the resources in place.

To remove the resources, follow these steps.

1. Delete every Session that was created against the Agent. Later guides create their own sessions against the same Agent, so delete them all rather than only the one that you saved. Deleting the Agent does not delete the Sessions that were created against it, so delete the sessions first.
   ```bash
   kagent agent session list -o json \
     | jq -r '.sessions[] | select(.agent.name == "my-first-agent") | .id' \
     | xargs -n1 kagent agent session delete
   ```

2. Delete the Agent, the AgentTemplate, and the Harness.
   ```bash
   kubectl delete agent my-first-agent -n kagent
   kubectl delete agenttemplate my-first-template -n kagent
   kubectl delete harness my-first-harness -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Bind a Model Context Protocol tool so that your agent can act on live cluster data." >}}
  {{< card link=`{{< link path="about/architecture/agent-substrate" >}}` title="Agent Substrate architecture" subtitle="Understand what happens to your Session's Actor when it sits idle." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Choose from the full set of Harness runtime options." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Give your agent capabilities beyond its system prompt." >}}
{{< /cards >}}
