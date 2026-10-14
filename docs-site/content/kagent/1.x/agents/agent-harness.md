---
title: Agent harness
description: Configure a Harness, the resource that defines which runtime executes an agent and what infrastructure it runs on.
weight: 10
author: kagent.dev
---

A Harness defines how an agent is allowed to run. It selects the runtime that executes the agent, the container image that runtime starts from, and the Agent Substrate capacity and snapshot storage that the agent runs on. A Harness runs nothing by itself. To run an agent, create an Agent that references a Harness and an AgentTemplate, which supplies the system prompt, the model, and the tools.

This page covers the Harness schema, the four runtimes it can select, and what each runtime supports. For the concept and how it relates to the other resources, see the [core concepts]({{< link path="about/core-concepts#harness" >}}).

## Configure a Harness

The following configuration shows a complete Harness. Only `workload`, `substrate`, and one runtime block are required.

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
    - name: OTEL_BSP_SCHEDULE_DELAY
      value: "2000"
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
| `workload.command` | For `byo` | Overrides the image entrypoint, up to 32 entries. Required for the `byo` runtime, optional otherwise. Every runtime honors an explicit value, the `kagent` runtime included, regardless of the language its image is written in. |
| `workload.args` | No | Overrides the image arguments, up to 64 entries. An override that you omit stays unset rather than taking a default. |
| `env` | No | Environment variables for the runtime, up to 100 entries. Each entry sets a literal `value`, which is required and can be an empty string. The schema defines no secret-backed source, so the API server rejects a `credentialRef` entry as an unknown field. Put credentials on a ModelConfig or a RemoteMCPServer instead. For more information, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}). Some names are reserved. For more information, see [Reserved environment variables](#reserved-environment-variables). |
| `substrate.workerPoolRef.name` | Yes | The {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} that this Harness's Actors are scheduled onto. An operator must provision one before any agent can run. |
| `substrate.snapshotPolicy.location` | Yes | The object storage location for Actor {{< gloss "Snapshot" >}}snapshots{{< /gloss >}}. |

> [!NOTE]
> Although the schema accepts up to 100 `env` entries, Agent Substrate accepts at most 32 environment variables on an Actor. The controller adds its own variables to every revision, such as the agent configuration and the certificate trust settings, and those count toward the limit. A revision that exceeds 32 reports `runtime revision has <n> environment variables; Substrate supports at most 32`.

A Harness and an AgentTemplate do not reference each other. An {{< gloss "Agent" >}}Agent{{< /gloss >}} references both, through `spec.harnessRef` and `spec.template.ref`, so whoever writes the Agent decides which template runs on which Harness. Both fields take a reference only, so the Harness must exist before an Agent can name it. For more information about the pairing, see [Core concepts]({{< link path="about/core-concepts#agent" >}}).

The image, command, arguments, environment, and resolved AgentTemplate together form a {{< gloss "Revision" >}}revision{{< /gloss >}}, which kagent identifies by a digest of that content. Editing any of them produces a new revision at the next reconcile. A {{< gloss "Session" >}}Session{{< /gloss >}} runs the revision that it was created from until that Session ends, so only Sessions that start after the edit use the new revision.

## Choose a runtime

A Harness names exactly one of the following four runtimes, and that choice decides what executes an agent and how much of kagent's feature set the agent can use.

| Runtime | What it runs | When to use it |
| ------- | ------------ | ----------- |
| `kagent` | kagent's built-in Go engine | You want to define the agentic loop through configuration, with a system prompt, skills, plugins, and MCP servers. This runtime also supports the widest set of features. |
| `codex` | Codex | You want Codex to do the work, and your model is OpenAI or an OpenAI-compatible Bedrock deployment. |
| `claude` | Claude | You want Claude to do the work, with Anthropic or Bedrock as the model. |
| `byo` | A container image of your own that implements kagent's A2A contract | You already have an agent that is built with an agent framework, and you want to run that agent in kagent. For more information, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |

The runtimes differ in two ways that decide what an agent on them can do. They accept different model providers, which [Model provider support](#model-provider-support) lists, and they accept different AgentTemplate features, which [Tool and skill support](#tool-and-skill-support) lists.

The agent chat in the kagent UI offers file attachments only on the `kagent` runtime. An agent on a `byo`, `codex`, or `claude` Harness has no option to attach files in the chat. For the file types and size limits that the UI enforces, see [Attach files to a message]({{< link path="observability/launch-ui#attach-files-to-a-message" >}}).

### kagent runtime

The `kagent` runtime runs kagent's built-in Go engine, which reads the compiled agent configuration and runs the agentic loop from it. Choose this runtime to build an agent from a system prompt, tools, skills, and plugins. Three features are available on this runtime alone: [structured output]({{< link path="agents/structured-output" >}}), [long-term memory]({{< link path="agents/agent-memory" >}}), and file attachments in the UI chat.

`spec.kagent` is the only runtime block that takes settings of its own. The other three runtimes take their configuration from the AgentTemplate and the ModelConfig, so their blocks are empty.

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

The settings fall into two groups. Memory persists facts across conversations, and compaction keeps a single conversation's prompt bounded as the conversation grows.

| Field | Description |
| ----- | ----------- |
| `memory.modelConfigRef.name` | The ModelConfig supplying the embedding model, in the Harness's namespace. Required when `memory` is set. Setting `memory` gives every agent on this Harness memory that persists across conversations. For how agents store and retrieve it, see [Agent memory]({{< link path="agents/agent-memory" >}}). |
| `memory.ttlDays` | How many days a stored memory entry stays valid. Minimum 1. When omitted, the server applies a default of 15 days. |
| `compaction.tokenThreshold` | The prompt token count at which kagent summarizes the history before the next model call. Set it with `compaction.eventRetentionSize`. |
| `compaction.eventRetentionSize` | The number of most recent events that stay uncompacted. Set it with `compaction.tokenThreshold`. |
| `compaction.compactionInterval` | The number of new user-initiated invocations that triggers a sliding-window compaction of those invocations. An alternative to the two tail-retention settings, and `compaction` requires one strategy or the other. |
| `compaction.overlapSize` | The number of already-compacted invocations pulled back into the next window, so that consecutive summaries overlap. Requires `compaction.compactionInterval`. |
| `compaction.summarizer` | The ModelConfig and prompt template that write the summaries. When omitted, kagent summarizes with the agent's own model and the runtime's default prompt. |

For the two compaction strategies and the rules that the API server enforces on them, see [Context management]({{< link path="agents/context-management" >}}).

The following example applies a complete `kagent` agent, from the ModelConfig to the Agent that runs it. The ModelConfig reads its API key from the `kagent-openai` Secret that the [OpenAI]({{< link path="setup/model-providers/openai#create-the-modelconfig" >}}) guide creates.

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

### Codex runtime

The `codex` runtime runs Codex against an OpenAI or Bedrock model. The runtime block takes no settings. Codex accepts a narrower set of AgentTemplate features than the built-in runtime, and the restrictions are in [Tool and skill support](#tool-and-skill-support).

The ModelConfig must set `openAI.apiFormat: responses`, and the API key must be entitled to the model that you name. A key without access to that model fails the turn with `Codex execution failed`. The ModelConfig in the following example reads its API key from the `kagent-openai` Secret that the [OpenAI]({{< link path="setup/model-providers/openai#create-the-modelconfig" >}}) guide creates.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: codex-model-config
  namespace: kagent
spec:
  apiKeySecret: kagent-openai
  apiKeySecretKey: OPENAI_API_KEY
  model: gpt-5.2-codex
  provider: OpenAI
  openAI:
    apiFormat: responses
---
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: codex-harness
  namespace: kagent
spec:
  codex: {}
  workload:
    image: {{< reuse "kagent-docs/versions/runtime-image-codex.md" >}}
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
---
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: codex-template
  namespace: kagent
spec:
  modelConfig:
    name: codex-model-config
  systemPrompt: You are a concise, helpful coding assistant.
---
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: codex-agent
  namespace: kagent
spec:
  template:
    ref:
      name: codex-template
  harnessRef:
    name: codex-harness
EOF
```

### Claude runtime

The `claude` runtime runs Claude against an Anthropic or Bedrock model. The runtime block takes no settings. Claude accepts a narrower set of AgentTemplate features than the built-in runtime, and the restrictions are in [Tool and skill support](#tool-and-skill-support).

The ModelConfig in the following example reads its API key from the `kagent-anthropic` Secret that the [Anthropic]({{< link path="setup/model-providers/anthropic#create-the-modelconfig" >}}) guide creates.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: claude-model-config
  namespace: kagent
spec:
  apiKeySecret: kagent-anthropic
  apiKeySecretKey: ANTHROPIC_API_KEY
  model: claude-sonnet-5
  provider: Anthropic
  anthropic: {}
---
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: claude-harness
  namespace: kagent
spec:
  claude: {}
  workload:
    image: {{< reuse "kagent-docs/versions/runtime-image-claude.md" >}}
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
---
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: claude-template
  namespace: kagent
spec:
  modelConfig:
    name: claude-model-config
  systemPrompt: You are a concise, helpful coding assistant.
---
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: claude-agent
  namespace: kagent
spec:
  template:
    ref:
      name: claude-template
  harnessRef:
    name: claude-harness
EOF
```

### BYO runtime

The `byo` runtime runs an agent that you built with an agent framework of your own, packaged as a container image. The runtime block takes no settings, and `workload.command` is required, because kagent cannot infer the entrypoint of an image that it does not build.

kagent builds a `byo` revision the same way as a `kagent` one, so an image that reads the agent configuration accepts the same model providers and the same AgentTemplate features as the built-in runtime. Structured output is the one exception, and the `kagent` runtime alone supports it. An image that ignores the configuration decides everything itself, and its AgentTemplate needs only a name. For the contract that the image must implement, how to read the configuration, and the known limitations, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}).

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: byo-harness
  namespace: kagent
spec:
  byo: {}
  workload:
    image: <your-registry>/my-agent@sha256:<digest>
    command: ["/my-agent"]
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
---
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: byo-template
  namespace: kagent
spec:
  description: An agent that runs from my own image.
---
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: byo-agent
  namespace: kagent
spec:
  template:
    ref:
      name: byo-template
  harnessRef:
    name: byo-harness
EOF
```

## Model provider support

The runtime that a Harness selects decides which ModelConfig an Agent that runs on it can use. The following table covers every value that the ModelConfig `provider` field accepts, including the three that no runtime accepts with a credential Secret.

| Provider | `kagent` | `byo` | `codex` | `claude` |
| -------- | :------: | :---: | :-----: | :------: |
| `OpenAI` | ✅ | ✅ | ✅ | ❌ |
| `Anthropic` | ✅ | ✅ | ❌ | ✅ |
| `Bedrock` | ✅ | ✅ | ✅ | ✅ |
| `AzureOpenAI` | ✅ | ✅ | ❌ | ❌ |
| `Gemini` | ✅ | ✅ | ❌ | ❌ |
| `Mistral` | ✅ | ✅ | ❌ | ❌ |
| `Ollama` | ✅ | ✅ | ❌ | ❌ |
| `Foundry` | ✅ | ✅ | ❌ | ❌ |
| `AnthropicVertexAI` | ❌ | ❌ | ❌ | ❌ |
| `GeminiVertexAI` | ❌ | ❌ | ❌ | ❌ |
| `SAPAICore` | ❌ | ❌ | ❌ | ❌ |

kagent reaches a model provider through the egress gateway, which holds the credential and adds it to each request as an HTTP header. The three rejected providers authenticate in a way that this design cannot serve, and they fail in two different ways.

* `AnthropicVertexAI` and `GeminiVertexAI` authenticate with a Google service account key, which kagent would have to mount as a file. An Actor takes no volumes, so a ModelConfig that names a credential Secret is rejected with `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`.
* `SAPAICore` authenticates with an OAuth client ID and secret, which the runtime exchanges for a token itself. A ModelConfig that names a credential Secret is rejected with `environment credential "<name>" cannot use gateway header injection`.

Some supported combinations still carry restrictions.

| Combination | Restriction |
| ----------- | ----------- |
| `codex` with `OpenAI` | Requires `openAI.apiFormat: responses`, and accepts no other `openAI` setting beyond `baseUrl`. |
| `codex` with `Bedrock` | Accepts only OpenAI `gpt-*` model IDs, and no `bedrock` settings beyond `region`. |
| `claude` with `Anthropic` | Accepts no `anthropic` settings beyond `baseUrl`. |
| `claude` with `Bedrock` | Accepts no `bedrock` settings beyond `region`. |
| `Bedrock` on any runtime | The Secret must hold an `AWS_BEARER_TOKEN_BEDROCK` key. A Secret of IAM access keys is rejected with `cannot use gateway header injection`, because IAM signs each request locally. |
| `codex` and `claude` with any provider | Neither runtime accepts a ModelConfig that sets `defaultHeaders`, `tls`, or `apiKeyPassthrough`. |

## Tool and skill support

The `kagent` runtime accepts every AgentTemplate feature. Codex and Claude run agentic loops of their own, so each constrains what an AgentTemplate can ask for. The `byo` runtime takes the same set as the built-in runtime, apart from structured output.

| Constraint | Applies to |
| ---------- | ---------- |
| A subagent binding cannot itself carry tools, skills, plugins, or nested agents, and must use the same provider and credentials as the agent that binds it. | `codex`, `claude` |
| An {{< gloss "MCP" >}}MCP{{< /gloss >}} server is bound whole. Claude does not support partial tool selection, so the agent sees every tool that the server offers. The Agent still reconciles, and reports the decision in `status.warnings` as `Claude RemoteMCPServer "<name>" does not support partial tool selection`. | `claude` |
| A RemoteMCPServer must use the `STREAMABLE_HTTP` protocol. `SSE` is rejected. | `codex` |
| Structured output is rejected, with `Harness runtime "<name>" does not support structured output`. | `codex`, `claude`, `byo` |

For more information about what an AgentTemplate can bind, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

## Telemetry content settings

Enabling content capture puts the prompts and replies that an agent exchanges with a model into your telemetry backend, where anyone with access to that backend can read them. Both settings that do this default to `false`, and both take effect only where tracing or log export is already enabled. Set them in the kagent Helm chart.

```yaml
config:
  runtimeDefaults:
    telemetry:
      captureContent: false
      captureRawApiBodies: false
      maxCaptureBytes: 16384
```

The two capture settings differ in how much they return and which runtimes read them. The third setting bounds the size of what either one captures.

| Setting | What it includes | Applies to |
| ------- | ---------------- | ---------- |
| `config.runtimeDefaults.telemetry.captureContent` | Prompts and assistant replies. On the `kagent` runtime, the content appears in the span for each model call. That runtime records a tool call's arguments and reply on the span for the tool call instead, whatever this setting is. On the `claude` runtime, tool results need tracing, and assistant replies need log export through `config.runtimeDefaults.telemetry.logs`. | `kagent`, `codex`, `claude` |
| `config.runtimeDefaults.telemetry.captureRawApiBodies` | The complete provider API request and response bodies. This setting returns more than `captureContent` does, and it takes effect only when you set the logs endpoint. | `claude` |
| `config.runtimeDefaults.telemetry.maxCaptureBytes` | The budget for each captured prompt or reply, in bytes. Defaults to `16384`, with a maximum of `65536`. | `codex`, `claude` |

These settings are the installation's default. To change the capture decision for one Harness, set `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` in that Harness's `spec.env` field. The `kagent`, `codex`, and `claude` runtimes all read the variable and apply it in place of the installation default. Set `SPAN_ONLY` to put prompts and replies on spans, or `NO_CONTENT` to turn capture off.

A `byo` image receives the same variable whenever any signal is enabled, but whether the image acts on it depends on its own instrumentation. An image that exports to its own backend keeps doing so. For more information, see [Tracing]({{< link path="observability/tracing#about-trace-coverage" >}}).

## Reserved environment variables

An installation's telemetry settings reach a runtime as defaults. Where a Harness `spec.env` entry names the same variable, the Harness value wins. One Harness can therefore tune exporter behavior for the agents that run on it, without changing the installation. Two sets of names are reserved instead, and a Harness that names one of them is rejected.

Every runtime reserves the certificate trust variables, because the egress gateway intercepts HTTPS and each runtime must trust the gateway's certificate authority to reach a model at all.

* `SSL_CERT_FILE` and `SSL_CERT_DIR`
* `REQUESTS_CA_BUNDLE`, `AWS_CA_BUNDLE`, and `CURL_CA_BUNDLE`
* `NODE_EXTRA_CA_CERTS`
* `GIT_SSL_CAINFO`

A Harness that names one of these variables reports `runtime environment "<name>" conflicts with gateway trust`.

The `codex` and `claude` runtimes each reserve a second set, which covers the credentials and runtime state that their adapters write. The `kagent` and `byo` runtimes reserve nothing beyond the trust variables.

| Runtime | Also reserved | Result |
| ------- | ------------- | ------ |
| `claude` | The Anthropic, AWS, and Vertex AI credential variables, `CLAUDE_CONFIG_DIR`, `DISABLE_UPDATES`, `IS_SANDBOX`, `CLAUDE_CODE_ENABLE_TELEMETRY`, `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`, `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, Claude's `OTEL_LOG_*` capture flags, `TRACEPARENT`, `TRACESTATE`, and the Prometheus exporter host and port | Every Agent on the Harness reports `Compatible` as `False`, and the controller reports `Harness env "<name>" conflicts with Claude-owned runtime configuration`. |
| `codex` | `CODEX_HOME`, `OPENAI_API_KEY`, `AWS_REGION`, `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` | Every Agent on the Harness reports `Compatible` as `False`, and the controller reports `Harness env "<name>" conflicts with Codex's compiled configuration`. |

Two variables take a value from a Harness without replacing the controller's.

* `OTEL_RESOURCE_ATTRIBUTES` is merged. The value in `spec.env` is kept, and the agent identity attributes that the controller adds win where the two name the same attribute.
* `OTEL_EXPORTER_OTLP_HEADERS` has no controller value to replace. No Helm setting produces it and the controller never adds it, but a value in `spec.env` reaches every runtime unchanged. To attach headers without holding them in an Actor environment, export to an in-cluster collector that adds them.

### Baggage propagation

Baggage is a W3C header that travels with a request alongside its trace context. Each entry in that header is a member, which pairs a name with a string value. Every service that the request reaches can read the members that it carries.

By default, a kagent runtime sets `OTEL_PROPAGATORS` to `tracecontext`. That value propagates trace context and drops baggage. A caller's baggage therefore does not reach the tools that an agent calls or the agent's model provider. To carry baggage as well, set `OTEL_PROPAGATORS` to `tracecontext,baggage` in the Harness `spec.env` field. The kagent controller reads its own value from the `controller.env` Helm value, so enabling baggage on a runtime does not enable it on the controller.

`OTEL_PROPAGATORS` is a list of wire formats that apply to both incoming and outgoing requests. If an incoming request has a format that is not in the list, the format is not read. Similarly, the runtime does not write an omitted format to an outgoing request. When the list omits `baggage`, the runtime's own members are dropped too.

When `baggage` is listed, the `kagent` runtime adds the request's identity to the baggage of each model call and each MCP tool call.

| Member | Model calls | MCP tool calls |
| ------ | ----------- | -------------- |
| `gen_ai.agent.name` | Yes | Yes |
| `gen_ai.conversation.id` | Yes | Yes |
| `a2a.task.id` | Yes | Yes |
| `gen_ai.tool.call.id` | No | Yes |

These members serve as identifiers only, and the runtime can replace a caller's member of the same name.

> [!WARNING]
> **Enabling baggage sends the caller's own members to your model provider.** A caller baggage member that kagent does not replace is forwarded unchanged in the `baggage` header of each model API request and each MCP request. This means that a caller controls what reaches those external services in the header. Enable baggage only where you trust what your callers attach.

Review and plan for the following considerations.
* The `claude` and `codex` runtimes receive `OTEL_PROPAGATORS`, but kagent does not add identity to their model and tool calls. The four members reach the `kagent` runtime alone.
* kagent never copies a baggage member onto a span. To make these values searchable, add a baggage-to-attributes span processor to the service that receives the request or to its OpenTelemetry Collector.

When an agent requires an MCP server, the first tool listing or tool call opens a session with the MCP server, and every later request to that server shares it. The session makes three requests: the event stream, the replies to server requests, and the close. These requests do not carry trace context or baggage, because these name a request that has already ended.

## Check that an agent can run

A Harness reports no status of its own. The `READY` column in `kubectl get harness` output is always empty, and `kubectl describe harness` shows no conditions, because nothing writes them.

The Agent reports for all three resources instead, because an AgentTemplate reports no status of its own either.

```bash
kubectl get agent -n kagent
```

An Agent that is not `Ready` states the reason in its conditions.

```bash
kubectl describe agent <agent-name> -n kagent
```

The following conditions report the three stages that an Agent passes through.

| Condition | Report |
| --------- | ------ |
| `ResolvedRefs` | Whether the resources that the Agent depends on exist. The controller resolves the Harness, the AgentTemplate, and the ModelConfig, and also the WorkerPool that the Harness references. A missing WorkerPool is the most common failure, and the Agent then reports the reason as `WorkerPoolNotFound`. |
| `Compatible` | Whether the Harness's runtime accepts the resolved configuration. A rejected model provider, a reserved environment variable, and an unsupported AgentTemplate feature all fail here. |
| `Ready` | Whether Agent Substrate finished preparing the agent's capacity. |

An Agent can also reconcile and still report a non-blocking decision in `status.warnings`, such as Claude binding an MCP server whole. For the conditions in full, see [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then start a conversation with it." >}}
  {{< card link=`{{< link path="agents/agent-memory" >}}` title="Agent memory" subtitle="Give agents on this Harness memory that outlasts a single conversation." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
