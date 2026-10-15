---
title: Declarative agents
description: Build an agent from a system prompt, tools, skills, and plugins, and let the kagent harness run the agentic loop.
weight: 15
author: kagent.dev
---

A declarative agent is an agent that you describe rather than build. In an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} resource, you write a system prompt, name a model, and bind the tools, skills, and plugins that the agent can use. The `kagent` {{< gloss "Harness" >}}Harness{{< /gloss >}} then runs kagent's built-in Go engine, which reads the AgentTemplate configuration and runs the agentic loop from it. To change what the agent does, you edit the AgentTemplate.

## Declarative agents and BYO agents

kagent runs an agent in one of two ways depending on who owns the agentic loop. A declarative agent hands the loop to kagent. A [BYO agent]({{< link path="agents/bring-your-own-agent" >}}) keeps the loop inside a container image that you build and maintain, and kagent runs the image instead.

| | Declarative agent | BYO agent |
| --- | --- | --- |
| Harness | `kagent` | `byo` |
| What executes the agent | kagent's built-in Go engine | The container image that you build |
| Where the behavior is defined | The AgentTemplate | The image, which might read the AgentTemplate |
| Changing the behavior | Edit the AgentTemplate | Rebuild the image, unless the image reads the configuration that kagent delivers |
| [Structured output]({{< link path="agents/structured-output" >}}), [long-term memory]({{< link path="agents/agent-memory" >}}), and UI file attachments | Supported | Unsupported |

Both routes receive the same resolved agent configuration, run in the same sandbox, follow the same snapshot policy, and route through the same gateway. For how a BYO image reads that configuration, and what its agent card leaves out, see [Compare BYO and declarative agents]({{< link path="agents/bring-your-own-agent#compare-byo-and-declarative-agents" >}}).

The `codex` and `claude` harnesses provide a third route, in which a coding agent owns the loop and takes its configuration from the AgentTemplate. To compare all options side by side, see [Choose a harness]({{< link path="agents/agent-harness#choose-a-harness" >}}).

## Configure the kagent harness

Define settings that belong to the engine rather than to the agent in the `spec.kagent` section of the Harness resource. The section takes memory settings, which persist facts across conversations, and compaction settings, which keep a single conversation's prompt within a limit as the conversation grows.

```yaml
spec:
  kagent:
    memory:
      modelConfigRef:
        name: embedding-model-config
      ttlDays: 30
    compaction:
      tokenThreshold: 120000
      eventRetentionSize: 20
```

Compaction offers two strategies. Tail retention summarizes the older history once the prompt passes a token count, while a sliding window summarizes each group of completed invocations as the conversation goes. Setting `compaction` requires at least one of these two strategies, and setting both is valid. For the rules that the API server enforces, see [Context management]({{< link path="agents/context-management" >}}).

| Field | Description |
| ----- | ----------- |
| `memory.modelConfigRef.name` | The {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} that supplies the embedding model, in the Harness's namespace. Required when `memory` is set. Setting `memory` gives every agent on this Harness memory that persists across conversations. For how agents store and retrieve it, see [Agent memory]({{< link path="agents/agent-memory" >}}). |
| `memory.ttlDays` | How many days a stored memory entry stays valid. Minimum 1. When omitted, the server applies a default of 15 days. |
| `compaction.tokenThreshold` | Tail retention. The prompt token count that triggers a summary. Once the prompt passes this count, kagent summarizes the older history before the next model call. Requires `compaction.eventRetentionSize`. |
| `compaction.eventRetentionSize` | Tail retention. The number of most recent events that kagent leaves out of that summary, so the latest exchanges reach the model in full. Requires `compaction.tokenThreshold`. |
| `compaction.compactionInterval` | Sliding window. The number of new user-initiated invocations that triggers a summary of those invocations. Set `5` to summarize each group of five. |
| `compaction.overlapSize` | Sliding window. The number of already-summarized invocations that kagent includes in the next summary, so that consecutive summaries overlap and carry context forward. Requires `compaction.compactionInterval`. |
| `compaction.summarizer` | Both strategies. The ModelConfig and prompt template that write the summaries. When omitted, kagent summarizes with the agent's own model and the engine's default prompt. |

For the fields that every Harness shares, such as the workload image and the Agent Substrate placement, see [Configure a Harness]({{< link path="agents/agent-harness#configure-a-harness" >}}).

## Apply a complete declarative agent

The following example applies a declarative agent end to end, from the ModelConfig to the Agent that runs it. The ModelConfig reads its API key from the `kagent-openai` Secret that the [OpenAI]({{< link path="setup/model-providers/openai#create-the-modelconfig" >}}) guide creates. `spec.kagent` is an empty object because memory and compaction are both optional.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: kagent-model-config
  namespace: kagent
spec:
  apiKeySecret: kagent-openai
  apiKeySecretKey: OPENAI_API_KEY
  model: gpt-4o-mini
  provider: OpenAI
  openAI: {}
---
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: kagent-harness
  namespace: kagent
spec:
  kagent: {}
  workload:
    image: {{< reuse "kagent-docs/versions/runtime-image.md" >}}
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
---
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: kagent-template
  namespace: kagent
spec:
  modelConfig:
    name: kagent-model-config
  systemPrompt: You are a concise, helpful assistant.
---
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: my-agent
  namespace: kagent
spec:
  template:
    ref:
      name: kagent-template
  harnessRef:
    name: kagent-harness
EOF
```

To confirm that the Agent is ready, run the following command. In the output, `READY` reports whether kagent built and prepared a {{< gloss "Revision" >}}revision{{< /gloss >}} for the pair.

```bash
kagent agent get my-agent
```

A `READY` value of `False` immediately after you apply the Agent is expected, because kagent builds a snapshot of the agent before it reports the Agent ready. If `READY` stays `False`, read the conditions on the Agent to find the stage that failed, asdescribed in [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-an-agenttemplate-and-an-agent" >}}). To start a conversation with the agent, see [Create a Session]({{< link path="get-started/your-first-agent#create-a-session" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/system-prompts" >}}` title="System prompts" subtitle="Write the instruction that shapes what a declarative agent does." >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Bind the tools that the agent can call." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Compare the kagent harness against the other three." >}}
  {{< card link=`{{< link path="agents/bring-your-own-agent" >}}` title="Bring your own agent" subtitle="Run an agent that you built yourself, on your own container image." >}}
{{< /cards >}}
