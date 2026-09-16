---
title: Agent harness
description: Configure a Harness, the resource that defines which runtime executes an agent and what infrastructure it runs on.
weight: 10
author: kagent.dev
---

Review configuration guidelines and reference for the `Harness` resource: every field it takes, the four runtimes it can select, and what each runtime supports. To understand a Harness and why it is separate from an AgentTemplate, see the [core concepts]({{< link path="about/core-concepts#harness" >}}).

## Configure a Harness

The following configuration is for a complete Harness resource. Only `workload`, `substrate`, and one runtime block are required.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: Harness
metadata:
  name: my-harness
  namespace: kagent
spec:
  # Exactly one runtime block: kagent, codex, claude, or byo.
  kagent: {}
  workload:
    image: <runtime-image>@sha256:<digest>
  env:
    - name: LOG_LEVEL
      value: info
    - name: MY_API_KEY
      credentialRef:
        name: my-secret
        key: api-key
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: gs://<your-bucket>/kagent/
  allowedAgentTemplates:
    selector:
      matchLabels:
        kagent.dev/harness: my-harness
EOF
```

{{< reuse "kagent-docs/snippets/review-table.md" >}} For more information, see the [API reference]({{< link path="reference/api-ref#harness" >}}).

| Field | Required | Description |
| ----- | -------- | ----------- |
| One of `kagent`, `codex`, `claude`, `byo` | Yes | The runtime that executes the agent. Naming none, or more than one, is rejected. For the available runtimes, see [Choose a runtime](#choose-a-runtime). |
| `workload.image` | Yes | The runtime image, pinned by `sha256` digest. A tag alone is rejected, because a revision must be reproducible. |
| `workload.command` | For `byo` | Overrides the image entrypoint, up to 32 entries. Required for the `byo` runtime, optional otherwise. |
| `workload.args` | No | Overrides the image arguments, up to 64 entries. |
| `env` | No | Environment variables for the runtime, up to 100. Each entry sets either a literal `value` or a `credentialRef` naming a key in a same-namespace Secret, never both. |
| `substrate.workerPoolRef.name` | Yes | The {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} that this Harness's Actors are scheduled onto. An operator must provision one before any agent can run. |
| `substrate.snapshotPolicy.location` | Yes | The object storage location for Actor {{< gloss "Snapshot" >}}snapshots{{< /gloss >}}. |
| `allowedAgentTemplates.selector` | No | A label selector naming which AgentTemplates this Harness admits. Omitting it admits none, which makes the Harness unusable. Admission is a one-way match. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} has no field naming a Harness, so whoever controls a Harness's selector decides what it accepts. |

## Choose a runtime

A Harness names exactly one of the following four runtimes, and that choice decides what executes an agent and how much of kagent's feature set the agent can use.

| Runtime | What it runs | When to use it |
| ------- | ------------ | ----------- |
| `kagent` | kagent's own Go and Python engines | You want the full feature set: every model provider, agent-as-tool composition, skills, plugins, and long-term memory. |
| `codex` | The Codex coding agent | You want Codex to do the work, and your model is OpenAI or an OpenAI-compatible Bedrock deployment. |
| `claude` | The Claude coding agent | You want Claude to do the work, with Anthropic, Bedrock, or Anthropic on Vertex AI as the model. |
| `byo` | Any container image of your own that implements kagent's A2A contract | You have an agent framework kagent does not adapt, and you would rather bring the image than the integration. For more information, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |

The `kagent` and `byo` runtimes compile through the same path, so they accept the same model providers and the same AgentTemplate features. The `codex` and `claude` runtimes are purpose-built adapters, and each accepts a narrower slice.

### Runtime-specific settings

`spec.kagent` is the only runtime block that takes settings of its own. The rest are empty.

```yaml
spec:
  kagent:
    memory:
      modelConfigRef:
        name: embedding-model-config
      ttlDays: 30
```

| Field | Description |
| ----- | ----------- |
| `memory.modelConfigRef.name` | The ModelConfig supplying the embedding model, in the Harness's namespace. Required when `memory` is set. |
| `memory.ttlDays` | How many days a stored memory entry stays valid. Minimum 1. When omitted, the server applies a default of 15 days. |

Setting `memory` gives every agent on this Harness memory that persists across conversations. For how agents store and retrieve it, see [Agent memory]({{< link path="agents/agent-memory" >}}).

## Model provider support

The runtime that a Harness selects decides which ModelConfig its AgentTemplates can use.

| Provider | `kagent` | `byo` | `codex` | `claude` |
| -------- | :------: | :---: | :-----: | :------: |
| `OpenAI` | ✅ | ✅ | ✅ | ❌ |
| `Anthropic` | ✅ | ✅ | ❌ | ✅ |
| `Bedrock` | ✅ | ✅ | ✅ | ✅ |
| `AnthropicVertexAI` | ❌ | ❌ | ❌ | ✅ |
| `GeminiVertexAI` | ❌ | ❌ | ❌ | ❌ |
| `AzureOpenAI` | ✅ | ✅ | ❌ | ❌ |
| `Gemini` | ✅ | ✅ | ❌ | ❌ |
| `Ollama` | ✅ | ✅ | ❌ | ❌ |
| `SAPAICore` | ✅ | ✅ | ❌ | ❌ |
| `Foundry` | ✅ | ✅ | ❌ | ❌ |

Some supported combinations still carry restrictions.

| Combination | Restriction |
| ----------- | ----------- |
| `codex` with `OpenAI` | Requires `openAI.apiFormat: responses`, and accepts no other `openAI` settings beyond `baseUrl`. |
| `codex` with `Bedrock` | Accepts only OpenAI `gpt-*` model IDs, and no `bedrock` settings beyond `region`. |
| `claude` with `Anthropic` | Accepts no `anthropic` settings beyond `baseUrl`. |
| `claude` with `Bedrock` | Accepts no `bedrock` settings beyond `region`. |
| `claude` with `AnthropicVertexAI` | Accepts only `projectID` and `location`. The Secret must hold a `service_account` key whose `project_id` matches and whose `token_uri` is `https://oauth2.googleapis.com`. |

> [!IMPORTANT]
> Neither `codex` nor `claude` accepts a ModelConfig that sets `defaultHeaders`, `tls`, or `apiKeyPassthrough`. Separately, the `kagent` and `byo` runtimes cannot use a ModelConfig whose credential is a file rather than a string. This restriction rules out both Vertex AI providers there. For more information about that limitation, see [About model providers]({{< link path="setup/model-providers/about-model-providers" >}}).

## Tool and skill support

The coding-agent runtimes also constrain what an AgentTemplate can ask for.

| Constraint | Applies to |
| ---------- | ---------- |
| A `Shared` agent-tool binding cannot itself carry tools, skills, plugins, or nested agents, and must use the same provider and credentials as the agent that binds it. | `codex`, `claude` |
| An {{< gloss "MCP" >}}MCP{{< /gloss >}} server is bound whole. Claude does not support partial tool selection, so the agent sees every tool the server offers rather than only the ones a binding names. The compiler warns rather than failing. | `claude` |
| A `RemoteMCPServer` must use the `STREAMABLE_HTTP` protocol. `SSE` is rejected. | `codex` |

The `kagent` and `byo` runtimes take the full set. For more information about what an AgentTemplate can bind, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

## Check that a Harness is ready

The `READY` column reports whether a Harness's dependencies resolved.
```bash
kubectl get harness -n kagent
```

A Harness that is not `Ready` most often names a WorkerPool that does not exist yet. For the specific reason, read its conditions with `kubectl describe harness <harness-name> -n kagent`.

`Ready` covers the Harness's own dependencies, not whether a given agent runs on it. Whether an AgentTemplate compiles against this Harness is reported on the AgentTemplate, under `status.harnesses`. For that check and the conditions it reports, see [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness and an AgentTemplate, then talk to the AgentInstance they produce." >}}
  {{< card link=`{{< link path="agents/agent-memory" >}}` title="Agent memory" subtitle="Give agents on this Harness memory that outlasts a single conversation." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
