---
title: Agent harness
description: Configure a Harness, the resource that defines which runtime executes an agent and what infrastructure it runs on.
weight: 10
author: kagent.dev
---

Review configuration guidelines and reference for the `Harness` resource: every field it takes, the four runtimes it can select, and what each runtime supports. To understand a Harness and why an Agent, rather than the Harness itself, names the AgentTemplate that runs on it, see the [core concepts]({{< link path="about/core-concepts#harness" >}}).

## Configure a Harness

The following configuration is for a complete Harness resource. Only `workload`, `substrate`, and one runtime block are required.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: my-harness
  namespace: kagent
spec:
  # Exactly one runtime block: kagent, codex, claude, or byo.
  kagent: {}
  workload:
    image: {{< reuse "kagent-docs/versions/runtime-image.md" >}}
  env:
    - name: KAGENT_LOG_LEVEL
      value: info
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
EOF
```

{{< reuse "kagent-docs/snippets/review-table.md" >}} For more information, see the [API reference]({{< link path="reference/api-ref#harness" >}}).

| Field | Required | Description |
| ----- | -------- | ----------- |
| One of `kagent`, `codex`, `claude`, `byo` | Yes | The runtime that executes the agent. Naming none, or more than one, is rejected. For the available runtimes, see [Choose a runtime](#choose-a-runtime). |
| `workload.image` | Yes | The runtime image, pinned by `sha256` digest. A tag alone is rejected, because a revision must be reproducible. |
| `workload.command` | For `byo` | Overrides the image entrypoint, up to 32 entries. Required for the `byo` runtime, optional otherwise. Every runtime honors an explicit value, the `kagent` runtime included, whatever language its image is written in. |
| `workload.args` | No | Overrides the image arguments, up to 64 entries. An override that you omit stays unset rather than taking a default. |
| `env` | No | Environment variables for the runtime, up to 100. Each entry sets a literal `value`, which is required and can be an empty string. The schema defines no secret-backed source, so the API server rejects a `credentialRef` entry as an unknown field. Put credentials on a ModelConfig or a RemoteMCPServer instead. For more information, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}). |
| `substrate.workerPoolRef.name` | Yes | The {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} that this Harness's Actors are scheduled onto. An operator must provision one before any agent can run. |
| `substrate.snapshotPolicy.location` | Yes | The object storage location for Actor {{< gloss "Snapshot" >}}snapshots{{< /gloss >}}. |

A Harness names no AgentTemplate. An {{< gloss "Agent" >}}Agent{{< /gloss >}} pairs the two through either `spec.harnessRef` or an inline `spec.harness`, so whoever writes the Agent decides which template runs on which Harness. For more information about the pairing, see [Core concepts]({{< link path="about/core-concepts#agent" >}}).

A command or argument override belongs to the revision that kagent prepares. Changing one prepares a new revision rather than altering a running agent. A {{< gloss "Session" >}}Session{{< /gloss >}} pinned to an earlier revision keeps the command it was prepared with until it moves to the new one.

## Choose a runtime

A Harness names exactly one of the following four runtimes, and that choice decides what executes an agent and how much of kagent's feature set the agent can use.

| Runtime | What it runs | When to use it |
| ------- | ------------ | ----------- |
| `kagent` | kagent's own Go and Python engines | You want the full feature set: every model provider, agent-as-tool composition, skills, plugins, and long-term memory. |
| `codex` | The Codex coding agent | You want Codex to do the work, and your model is OpenAI or an OpenAI-compatible Bedrock deployment. |
| `claude` | The Claude coding agent | You want Claude to do the work, with Anthropic, Bedrock, or Anthropic on Vertex AI as the model. |
| `byo` | Any container image of your own that implements kagent's A2A contract | You have an agent framework kagent does not adapt, and you would rather bring the image than the integration. For more information, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |

The `kagent` and `byo` runtimes compile through the same path, so they accept the same model providers and the same AgentTemplate features, except [structured output]({{< link path="agents/structured-output" >}}), which only the `kagent` runtime supports. The `codex` and `claude` runtimes are purpose-built adapters, and each accepts a narrower slice.

Note that the agent chat in the kagent UI allows file attachments only on the `kagent` runtime, so an agent on a `byo`, `codex`, or `claude` Harness has no attachment option in the chat. For the file types and size limits that the UI enforces, see [Attach files to a message]({{< link path="observability/launch-ui#attach-files-to-a-message" >}}).

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

Setting `compaction` summarizes older session events so an agent's prompt stays bounded as a conversation grows. For the two strategies and the rules the API server enforces, see [Context management]({{< link path="agents/context-management" >}}).

## Model provider support

The runtime that a Harness selects decides which ModelConfig an Agent that runs on it can use. This table covers every value that the ModelConfig `provider` field accepts, including the four that kagent 1.0 rejects on every runtime.

| Provider | `kagent` | `byo` | `codex` | `claude` |
| -------- | :------: | :---: | :-----: | :------: |
| `OpenAI` | ✅ | ✅ | ✅ | ❌ |
| `Anthropic` | ✅ | ✅ | ❌ | ✅ |
| `Bedrock` | ✅ | ✅ | ✅ | ✅ |
| `AnthropicVertexAI` | ❌ | ❌ | ❌ | ❌ |
| `GeminiVertexAI` | ❌ | ❌ | ❌ | ❌ |
| `AzureOpenAI` | ✅ | ✅ | ❌ | ❌ |
| `Gemini` | ✅ | ✅ | ❌ | ❌ |
| `Ollama` | ✅ | ✅ | ❌ | ❌ |
| `SAPAICore` | ❌ | ❌ | ❌ | ❌ |
| `Foundry` | ✅ | ✅ | ❌ | ❌ |
| `Mistral` | ❌ | ❌ | ❌ | ❌ |

kagent rejects `AnthropicVertexAI`, `GeminiVertexAI`, and `SAPAICore` on every runtime, because each authenticates with a credential that the egress gateway cannot place in an HTTP header. The ModelConfig never compiles, so no agent can use these providers. For the alternatives, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}).

kagent rejects `Mistral` for a different reason. The controller does not resolve the provider at all, so a Mistral ModelConfig reports `unsupported model provider: Mistral` and compiles no revision.

Some supported combinations still carry restrictions.

| Combination | Restriction |
| ----------- | ----------- |
| `codex` with `OpenAI` | Requires `openAI.apiFormat: responses`, and accepts no other `openAI` settings beyond `baseUrl`. |
| `codex` with `Bedrock` | Accepts only OpenAI `gpt-*` model IDs, and no `bedrock` settings beyond `region`. |
| `claude` with `Anthropic` | Accepts no `anthropic` settings beyond `baseUrl`. |
| `claude` with `Bedrock` | Accepts no `bedrock` settings beyond `region`. |
| `Bedrock` on any runtime | The Secret must hold an `AWS_BEARER_TOKEN_BEDROCK` key. A Secret of IAM access keys is rejected, because IAM signs each request locally. |

> [!IMPORTANT]
> Neither `codex` nor `claude` accepts a ModelConfig that sets `defaultHeaders`, `tls`, or `apiKeyPassthrough`. Separately, every runtime rejects a credential that the egress gateway cannot place in an HTTP header, such as an IAM key pair or a Google service account key. For more information about that limitation, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}).

## Tool and skill support

The coding-agent runtimes also constrain what an AgentTemplate can ask for.

| Constraint | Applies to |
| ---------- | ---------- |
| A subagent binding cannot itself carry tools, skills, plugins, or nested agents, and must use the same provider and credentials as the agent that binds it. | `codex`, `claude` |
| An {{< gloss "MCP" >}}MCP{{< /gloss >}} server is bound whole. Claude does not support partial tool selection, so the agent sees every tool the server offers rather than only the ones a binding names. The compiler warns rather than failing. | `claude` |
| A `RemoteMCPServer` must use the `STREAMABLE_HTTP` protocol. `SSE` is rejected. | `codex` |

The `kagent` and `byo` runtimes take the full set. For more information about what an AgentTemplate can bind, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

## Telemetry content settings

Tracing carries the prompts and replies that an agent exchanges with a model, and so does log export on the `claude` runtime. Two settings in the kagent Helm chart decide whether that content leaves the runtime, and each one reaches a different set of runtimes. Both default to `false`, and both take effect only where tracing or log export is already enabled.

```yaml
otel:
  capture:
    messageContent: false
    rawApiBodies: false
```

| Setting | What it includes | Applies to |
| ------- | ---------------- | ---------- |
| `otel.capture.messageContent` | Prompts and assistant replies in the runtime's telemetry. On the `kagent` runtime, the content appears in the span for each model call. That runtime records a tool call's arguments and reply on the span for the tool call instead, whatever this setting holds. On the `claude` runtime, tool results require tracing, and assistant replies require log export through `otel.logs`. | `kagent`, `codex`, `claude` |
| `otel.capture.rawApiBodies` | The complete provider API request and response bodies. This setting returns more than `otel.capture.messageContent` does, and it takes effect only when `otel.logs.enabled` is `true`. | `claude` |

The controller sets `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` in every compiled runtime from `otel.capture.messageContent`, so a Harness cannot change the capture decision for itself. Naming that variable in the Harness `spec.env` field fails the `claude` and `codex` runtimes outright, and is discarded on the `kagent` runtime. For the rest of the variables that behave this way, see [Controller-owned telemetry variables](#controller-owned-telemetry-variables).

The controller compiles the telemetry environment into the `byo` runtime as well whenever any signal is enabled, so `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` reaches a `byo` image. The `byo` runtime is the exception to the ownership rule. The controller applies the Harness `spec.env` field after the telemetry environment, so a `spec.env` entry wins where the two name the same variable, and an image that exports to its own backend keeps doing so. Whether the image acts on either setting depends on its own instrumentation. For more information, see [Tracing]({{< link path="observability/tracing#about-trace-coverage" >}}).

## Controller-owned telemetry variables

The controller compiles an installation's telemetry decisions into every runtime revision, so a Harness cannot override them through its `spec.env` field. The controller owns the following variables.

* `OTEL_SDK_DISABLED` and `OTEL_SERVICE_NAME`
* `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, and `OTEL_EXPORTER_OTLP_TIMEOUT`
* `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, and `OTEL_LOGS_EXPORTER`
* `OTEL_EXPORTER_OTLP_<SIGNAL>_ENDPOINT` and `OTEL_EXPORTER_OTLP_<SIGNAL>_PROTOCOL`, where `<SIGNAL>` is `TRACES`, `METRICS`, or `LOGS`
* `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`

A runtime that meets one of these names in `spec.env` either refuses the Harness or discards the entry, as described in the following table.

| Runtime | Result of naming a controller-owned variable in `spec.env` |
| ------- | ---------------------------------------------------------- |
| `claude` | The Harness fails to compile, and the controller reports `Harness env "<name>" conflicts with Claude-owned runtime configuration`. |
| `codex` | The Harness fails to compile, and the controller reports `Harness env "<name>" conflicts with Codex's compiled configuration`. |
| `kagent` | The entry is dropped and the controller's own value is compiled in its place. No error is reported. |

Two further variables fall outside that table:

* `OTEL_RESOURCE_ATTRIBUTES` is merged rather than refused. The value in `spec.env` is kept, and the agent identity attributes that the controller adds win where the two name the same attribute.
* `OTEL_EXPORTER_OTLP_HEADERS` is neither owned nor rendered. No Helm setting produces it, so the controller never adds it to a runtime, but a value in the Harness `spec.env` field reaches every runtime unchanged. To attach headers without holding them in an Actor environment, export to an in-cluster collector that adds them.

Every other `OTEL_*` variable, such as the `OTEL_BSP_*` batch span processor settings, stays available for per-Harness tuning.

### Baggage propagation

kagent runtimes set `OTEL_PROPAGATORS` to `tracecontext` when the environment leaves it unset, so a caller's baggage reaches neither the tools an agent calls nor its model provider. Trace context still propagates. To carry baggage as well, set `OTEL_PROPAGATORS` to `tracecontext,baggage` in the Harness `spec.env` field.

## Check that a Harness is ready

The `READY` column reports whether a Harness's dependencies resolved.
```bash
kubectl get harness -n kagent
```

A Harness that is not `Ready` most often names a WorkerPool that does not exist yet. For the specific reason, read its conditions with `kubectl describe harness <harness-name> -n kagent`.

`Ready` covers the Harness's own dependencies, not whether a given agent runs on it. Whether a template compiles against this Harness is reported on the Agent that pairs the two, because an AgentTemplate carries no status of its own. For that check and the conditions it reports, see [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then start a conversation with it." >}}
  {{< card link=`{{< link path="agents/agent-memory" >}}` title="Agent memory" subtitle="Give agents on this Harness memory that outlasts a single conversation." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
