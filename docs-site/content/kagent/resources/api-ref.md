---
title: API Reference
linkTitle: API docs
description: kagent API reference documentation
weight: 1
author: kagent.dev
---

## Packages
- [kagent.dev/v1alpha2](#kagentdevv1alpha2)

## kagent.dev/v1alpha2

Package v1alpha2 contains API Schema definitions for the kagent.dev v1alpha2 API group.

### Resource Types
- [Agent](#agent)
- [AgentHarness](#agentharness)
- [ModelConfig](#modelconfig)
- [ModelProviderConfig](#modelproviderconfig)
- [RemoteMCPServer](#remotemcpserver)
- [SandboxAgent](#sandboxagent)

#### A2AConfig

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `skills` _[AgentSkill](#agentskill) array_ |  |  | MinItems: 1 <br /> |

#### Agent

Agent is the Schema for the agents API.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `Agent` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[AgentSpec](#agentspec)_ |  |  |  |
| `status` _[AgentStatus](#agentstatus)_ |  |  |  |

#### AgentHarness

AgentHarness is a generic remote execution environment provisioned by a
backend (OpenClaw or Hermes) running on Agent Substrate.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `AgentHarness` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[AgentHarnessSpec](#agentharnessspec)_ |  |  |  |
| `status` _[AgentHarnessStatus](#agentharnessstatus)_ |  |  |  |

#### AgentHarnessBackendType

_Underlying type:_ _string_

AgentHarnessBackendType selects which sandbox control plane provisions the
environment. Additional backends may be added in the future.

_Validation:_
- Enum: [openclaw hermes]

_Appears in:_
- [AgentHarnessSpec](#agentharnessspec)
- [AgentHarnessStatusRef](#agentharnessstatusref)

| Field | Description |
| --- | --- |
| `openclaw` |  |
| `hermes` |  |

#### AgentHarnessChannel

AgentHarnessChannel declares one messenger binding inside a harness VM.

_Appears in:_
- [AgentHarnessSpec](#agentharnessspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name is a stable id for this binding (OpenClaw channels.*.accounts key). |  | MinLength: 1 <br /> |
| `type` _[AgentHarnessChannelType](#agentharnesschanneltype)_ |  |  | Enum: [telegram slack] <br /> |
| `telegram` _[AgentHarnessTelegramChannelSpec](#agentharnesstelegramchannelspec)_ |  |  |  |
| `slack` _[AgentHarnessSlackChannelSpec](#agentharnessslackchannelspec)_ | Slack configures Slack when type is Slack. |  |  |

#### AgentHarnessChannelAccess

_Underlying type:_ _string_

AgentHarnessChannelAccess controls whether the bot listens broadly or only on an allowlist.

_Validation:_
- Enum: [allowlist open disabled]

_Appears in:_
- [AgentHarnessOpenClawSlackOptions](#agentharnessopenclawslackoptions)

| Field | Description |
| --- | --- |
| `allowlist` |  |
| `open` |  |
| `disabled` |  |

#### AgentHarnessChannelCredential

AgentHarnessChannelCredential supplies a token from an inline value or a Secret/ConfigMap key.

_Appears in:_
- [AgentHarnessSlackChannelSpec](#agentharnessslackchannelspec)
- [AgentHarnessTelegramChannelSpec](#agentharnesstelegramchannelspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `value` _string_ |  |  | MaxLength: 8192 <br /> |
| `valueFrom` _[ValueSource](#valuesource)_ |  |  |  |

#### AgentHarnessChannelType

_Underlying type:_ _string_

AgentHarnessChannelType selects a messenger integration for OpenClaw harness VMs.

_Validation:_
- Enum: [telegram slack]

_Appears in:_
- [AgentHarnessChannel](#agentharnesschannel)

| Field | Description |
| --- | --- |
| `telegram` |  |
| `slack` |  |

#### AgentHarnessConnection

AgentHarnessConnection describes how clients reach the provisioned harness VM.

_Appears in:_
- [AgentHarnessStatus](#agentharnessstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `endpoint` _string_ | Endpoint is the backend-specific address (gRPC target, SSH host:port,<br />...) clients should use to reach the harness. |  |  |

#### AgentHarnessHermesSlackOptions

AgentHarnessHermesSlackOptions configures Hermes-specific Slack settings (env vars in the sandbox).

_Appears in:_
- [AgentHarnessSlackChannelSpec](#agentharnessslackchannelspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `allowedUserIDs` _string array_ | AllowedUserIDs restricts which Slack member IDs may interact with the bot (SLACK_ALLOWED_USERS). |  | MaxItems: 1024 <br /> |
| `allowedUserIDsFrom` _[ValueSource](#valuesource)_ |  |  |  |
| `homeChannel` _string_ | HomeChannel is the default Slack channel ID for cron/scheduled messages (SLACK_HOME_CHANNEL). |  |  |
| `homeChannelName` _string_ | HomeChannelName is a human-readable label for HomeChannel (SLACK_HOME_CHANNEL_NAME). |  |  |

#### AgentHarnessOpenClawSlackOptions

AgentHarnessOpenClawSlackOptions configures OpenClaw-specific Slack routing.

_Appears in:_
- [AgentHarnessSlackChannelSpec](#agentharnessslackchannelspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `channelAccess` _[AgentHarnessChannelAccess](#agentharnesschannelaccess)_ |  |  | Enum: [allowlist open disabled] <br /> |
| `allowlistChannels` _string array_ | AllowlistChannels is required when channelAccess is allowlist. |  | MaxItems: 1024 <br /> |
| `interactiveReplies` _boolean_ |  | true |  |

#### AgentHarnessSlackChannelSpec

AgentHarnessSlackChannelSpec configures Slack when AgentHarnessChannel.type is Slack.
Backend-specific settings live under the matching backend key; AgentHarnessSpec validation
requires the key to match spec.backend.

_Appears in:_
- [AgentHarnessChannel](#agentharnesschannel)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `botToken` _[AgentHarnessChannelCredential](#agentharnesschannelcredential)_ |  |  |  |
| `appToken` _[AgentHarnessChannelCredential](#agentharnesschannelcredential)_ |  |  |  |
| `openclaw` _[AgentHarnessOpenClawSlackOptions](#agentharnessopenclawslackoptions)_ | OpenClaw configures OpenClaw-specific Slack routing. |  |  |
| `hermes` _[AgentHarnessHermesSlackOptions](#agentharnesshermesslackoptions)_ | Hermes configures Hermes-specific Slack settings. |  |  |

#### AgentHarnessSpec

AgentHarnessSpec describes a generic remote execution environment that agents
(or human operators) can attach to via exec or SSH.

An AgentHarness is distinct from a SandboxAgent: it has no agent runtime baked
in. The backend is responsible for provisioning an environment that stays
ready to accept incoming commands.

_Appears in:_
- [AgentHarness](#agentharness)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `backend` _[AgentHarnessBackendType](#agentharnessbackendtype)_ | Backend selects the control plane to use. Required. |  | Enum: [openclaw hermes] <br /> |
| `substrate` _[AgentHarnessSubstrateSpec](#agentharnesssubstratespec)_ | Substrate configures the Agent Substrate provisioning stack. Required. |  |  |
| `description` _string_ | Description is a short human-readable summary shown in the UI (e.g. agents list). |  |  |
| `image` _string_ | Image is the container image to run in the harness VM, if the backend<br />supports per-resource images. Backend openclaw pins the image<br />to the OpenClaw sandbox base when this field is empty; backend hermes pins<br />to the Hermes sandbox base image when empty. |  |  |
| `env` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#envvar-v1-core) array_ | Env is a list of environment variables injected into the harness workload.<br />Values use the Kubernetes EnvVar shape; ValueFrom references are<br />resolved server-side where supported. |  |  |
| `modelConfigRef` _string_ | ModelConfigRef is the reference to the ModelConfig used to configure the harness.<br />The controller registers the gateway provider and, after the harness is Ready,<br />writes OpenClaw config inside the VM (~/.openclaw/openclaw.json) and starts the gateway. |  |  |
| `channels` _[AgentHarnessChannel](#agentharnesschannel) array_ | Channels configures Telegram and Slack integrations for OpenClaw inside the harness VM. |  | MaxItems: 1024 <br /> |

#### AgentHarnessStatus

AgentHarnessStatus is the observed state of an AgentHarness.

_Appears in:_
- [AgentHarness](#agentharness)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `observedGeneration` _integer_ |  |  |  |
| `conditions` _[Condition](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#condition-v1-meta) array_ |  |  |  |
| `backendRef` _[AgentHarnessStatusRef](#agentharnessstatusref)_ | BackendRef points at the harness instance on the backend control<br />plane, once Ensure has succeeded at least once. |  |  |
| `connection` _[AgentHarnessConnection](#agentharnessconnection)_ | Connection is populated by the controller when the harness is ready. |  |  |

#### AgentHarnessStatusRef

AgentHarnessStatusRef identifies a harness instance on an external control plane.

_Appears in:_
- [AgentHarnessStatus](#agentharnessstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `backend` _[AgentHarnessBackendType](#agentharnessbackendtype)_ |  |  | Enum: [openclaw hermes] <br /> |
| `id` _string_ |  |  |  |

#### AgentHarnessSubstrateSnapshotsConfig

AgentHarnessSubstrateSnapshotsConfig points at a GCS prefix for actor memory snapshots.
Substrate currently expects a gs:// location (see Agent Substrate SnapshotsConfig).

_Appears in:_
- [AgentHarnessSubstrateSpec](#agentharnesssubstratespec)
- [SandboxSubstrateSpec](#sandboxsubstratespec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `location` _string_ | Location is the GCS URI prefix for golden and incremental snapshots.<br />Example: gs://ate-snapshots/kagent/my-namespace/my-harness/ |  | Pattern: `^gs://` <br /> |

#### AgentHarnessSubstrateSpec

AgentHarnessSubstrateSpec configures Agent Substrate (WorkerPool + ActorTemplate + Actor).

kagent generates a per-harness ActorTemplate and creates an Actor from it. WorkerPool
capacity is referenced from workerPoolRef or the controller default; it is not
created or deleted by the AgentHarness controller.

_Appears in:_
- [AgentHarnessSpec](#agentharnessspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `workerPoolRef` _[TypedLocalReference](#typedlocalreference)_ | WorkerPoolRef references an existing ate.dev WorkerPool in the harness namespace.<br />When unset, the controller uses its configured default WorkerPool. |  |  |
| `snapshotsConfig` _[AgentHarnessSubstrateSnapshotsConfig](#agentharnesssubstratesnapshotsconfig)_ | SnapshotsConfig configures actor memory snapshots. Defaults to<br />gs://ate-snapshots/&lt;namespace&gt;/&lt;agentharnessname&gt; when unset. |  |  |
| `workloadImage` _string_ | WorkloadImage overrides the default openclaw sandbox image in the ActorTemplate. |  |  |

#### AgentHarnessTelegramChannelSpec

AgentHarnessTelegramChannelSpec configures Telegram when AgentHarnessChannel.type is Telegram.

_Appears in:_
- [AgentHarnessChannel](#agentharnesschannel)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `botToken` _[AgentHarnessChannelCredential](#agentharnesschannelcredential)_ |  |  |  |
| `allowedUserIDs` _string array_ |  |  | MaxItems: 1024 <br /> |
| `allowedUserIDsFrom` _[ValueSource](#valuesource)_ |  |  |  |

#### AgentProvider

AgentProvider identifies the organization responsible for an agent on its A2A AgentCard.

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `organization` _string_ | Organization is the name of the agent provider's organization. |  | MinLength: 1 <br /> |
| `url` _string_ | URL is a URL for the agent provider's website or relevant documentation. |  | Format: uri <br /> |

#### AgentSkill

AgentSkill describes a specific capability or function of the agent.

_Appears in:_
- [A2AConfig](#a2aconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `id` _string_ | ID is the unique identifier for the skill. |  |  |
| `name` _string_ | Name is the human-readable name of the skill. |  | MinLength: 1 <br /> |
| `description` _string_ | Description is an optional detailed description of the skill. |  |  |
| `tags` _string array_ | Tags are optional tags for categorization. |  | MaxItems: 20 <br /> |
| `examples` _string array_ | Examples are optional usage examples. |  | MaxItems: 20 <br /> |
| `inputModes` _string array_ | InputModes are the supported input MIME types for this skill, overriding the agent's defaults. |  |  |
| `outputModes` _string array_ | OutputModes are the supported output MIME types for this skill, overriding the agent's defaults. |  |  |

#### AgentSpec

AgentSpec defines the desired state of Agent.

_Appears in:_
- [Agent](#agent)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[AgentType](#agenttype)_ |  | Declarative | Enum: [Declarative BYO] <br /> |
| `byo` _[BYOAgentSpec](#byoagentspec)_ | BYO configures a "bring your own" agent backed by a user-provided<br />container image. Kagent deploys the image and expects it to serve the<br />agent over the A2A protocol on port 8080.<br />Required if type is BYO. |  |  |
| `declarative` _[DeclarativeAgentSpec](#declarativeagentspec)_ | Declarative configures an agent that is fully described by this resource<br />(model, instructions, tools) and runs on one of kagent's built-in runtimes.<br />Required if type is Declarative. |  |  |
| `description` _string_ |  |  |  |
| `iconUrl` _string_ | IconURL is a URL to an icon representing the agent. It is surfaced on the<br />agent's A2A AgentCard. |  | Format: uri <br /> |
| `documentationUrl` _string_ | DocumentationURL is a URL to human-readable documentation for the agent. It<br />is surfaced on the agent's A2A AgentCard. |  | Format: uri <br /> |
| `version` _string_ | Version is the agent's version string, surfaced on the A2A AgentCard. |  |  |
| `provider` _[AgentProvider](#agentprovider)_ | Provider identifies the organization responsible for the agent. It is<br />surfaced on the agent's A2A AgentCard. |  |  |
| `skills` _[SkillForAgent](#skillforagent)_ | Skills to load into the agent. They will be pulled from the specified container images.<br />and made available to the agent under the `/skills` folder. |  |  |
| `sandbox` _[SandboxConfig](#sandboxconfig)_ | Sandbox configures sandboxed execution behavior shared across runtimes.<br />This is intended for sandboxed declarative execution today, and can also<br />be consumed by BYO agents. |  |  |
| `allowedNamespaces` _[AllowedNamespaces](#allowednamespaces)_ | AllowedNamespaces defines which namespaces are allowed to reference this Agent as a tool.<br />This follows the Gateway API pattern for cross-namespace route attachments.<br />If not specified, only Agents in the same namespace can reference this Agent as a tool.<br />This field only applies when this Agent is used as a tool by another Agent.<br />See: https://gateway-api.sigs.k8s.io/guides/multiple-ns/#cross-namespace-route-attachment |  |  |

#### AgentStatus

AgentStatus defines the observed state of Agent.

_Appears in:_
- [Agent](#agent)
- [SandboxAgent](#sandboxagent)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `observedGeneration` _integer_ |  |  |  |
| `conditions` _[Condition](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#condition-v1-meta) array_ |  |  |  |

#### AgentType

_Underlying type:_ _string_

AgentType represents the agent type

_Validation:_
- Enum: [Declarative BYO]

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description |
| --- | --- |
| `Declarative` |  |
| `BYO` |  |

#### AllowedNamespaces

AllowedNamespaces defines which namespaces are allowed to reference this resource.
This mechanism provides a bidirectional handshake for cross-namespace references,
following the pattern used by Gateway API for cross-namespace route attachments.

By default (when not specified), only references from the same namespace are allowed.

_Appears in:_
- [AgentSpec](#agentspec)
- [RemoteMCPServerSpec](#remotemcpserverspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `from` _[FromNamespaces](#fromnamespaces)_ | From indicates where references to this resource can originate.<br />Possible values are:<br />* All: References from all namespaces are allowed.<br />* Same: Only references from the same namespace are allowed (default).<br />* Selector: References from namespaces matching the selector are allowed. | Same | Enum: [All Same Selector] <br /> |
| `selector` _[LabelSelector](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#labelselector-v1-meta)_ | Selector is a label selector for namespaces that are allowed to reference this resource.<br />Only used when From is set to "Selector". |  |  |

#### AnthropicConfig

AnthropicConfig contains Anthropic-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `baseUrl` _string_ | Base URL for the Anthropic API (overrides default) |  |  |
| `maxTokens` _integer_ | Maximum tokens to generate |  |  |
| `temperature` _string_ | Temperature for sampling |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `topK` _integer_ | Top-k sampling parameter |  |  |

#### AnthropicVertexAIConfig

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `projectID` _string_ | The project ID |  |  |
| `location` _string_ | The project location |  |  |
| `temperature` _string_ | Temperature |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `topK` _string_ | Top-k sampling parameter |  |  |
| `stopSequences` _string array_ | Stop sequences |  |  |
| `maxTokens` _integer_ | Maximum tokens to generate |  |  |

#### AzureOpenAIConfig

AzureOpenAIConfig contains Azure OpenAI-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `azureEndpoint` _string_ | Endpoint for the Azure OpenAI API |  |  |
| `apiVersion` _string_ | API version for the Azure OpenAI API |  |  |
| `azureDeployment` _string_ | Deployment name for the Azure OpenAI API |  |  |
| `azureAdToken` _string_ | Azure AD token for authentication |  |  |
| `temperature` _string_ | Temperature for sampling |  |  |
| `maxTokens` _integer_ | Maximum tokens to generate |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |

#### BYOAgentSpec

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `deployment` _[ByoDeploymentSpec](#byodeploymentspec)_ | Deployment configures the Kubernetes Deployment created for the BYO agent container. |  |  |

#### BaseVertexAIConfig

_Appears in:_
- [AnthropicVertexAIConfig](#anthropicvertexaiconfig)
- [GeminiVertexAIConfig](#geminivertexaiconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `projectID` _string_ | The project ID |  |  |
| `location` _string_ | The project location |  |  |
| `temperature` _string_ | Temperature |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `topK` _string_ | Top-k sampling parameter |  |  |
| `stopSequences` _string array_ | Stop sequences |  |  |

#### BedrockConfig

BedrockConfig contains AWS Bedrock-specific configuration options.

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `region` _string_ | AWS region where the Bedrock model is available (e.g., us-east-1, us-west-2) |  |  |
| `additionalModelRequestFields` _[JSON](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#json-v1-apiextensions-k8s-io)_ | AdditionalModelRequestFields passes model-specific parameters to Bedrock's<br />additionalModelRequestFields in the Converse API. Use this for provider-specific<br />options that are not part of the standard InferenceConfiguration block, such as<br />Claude extended thinking or top_k. Values are forwarded as-is to the API.<br />Example: \{"top_k": 5, "thinking": \{"type": "enabled", "budget_tokens": 16000\}\} |  |  |
| `promptCaching` _boolean_ | PromptCaching enables Bedrock prompt caching by appending a CachePoint<br />block at the end of the Converse request's `system` content array and<br />the end of the `toolConfig.tools` array. Bedrock will cache the prefix up to and<br />including those cache points across requests in the same region for<br />roughly 5 minutes after first use, billing the cached portion at a<br />reduced rate on cache hits.<br /><br />Recommended for tool-using agents that make many Converse calls per<br />task with a stable system prompt and tool set — the per-call input<br />token count can drop by 70-90% on hit. Has no effect on models that<br />don't support caching; the marker is ignored by Bedrock for those.<br /><br />See https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html<br />for the current list of supported models and minimum prefix sizes. | false |  |
| `cacheTTL` _string_ | CacheTTL controls how long Bedrock retains a cached prefix when<br />PromptCaching is enabled. Only meaningful when PromptCaching is true.<br /><br />  - "5m" (default): Bedrock's standard 5-minute sliding cache. Each cache<br />    hit refreshes the window. Supported by all prompt-caching models.<br />  - "1h": extended-TTL caching, useful for tasks whose Converse calls are<br />    spaced more than 5 minutes apart.<br /><br />NOTE: "1h" is NOT strictly better than "5m". Extended-TTL cache writes are<br />billed at a higher per-token rate than 5-minute writes, and 1h is supported<br />on a narrower set of models. Only choose "1h" when calls are spaced far<br />enough apart that a 5-minute cache would expire between them; otherwise the<br />higher write cost is wasted. See the AWS prompt-caching docs above. | 5m | Enum: [5m 1h] <br /> |

#### ByoDeploymentSpec

_Appears in:_
- [BYOAgentSpec](#byoagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `image` _string_ | Image is the container image of the BYO agent.<br />The image is expected to serve the agent over the A2A protocol on port 8080. |  | MinLength: 1 <br /> |
| `cmd` _string_ | Cmd overrides the container entrypoint (the container's command). |  |  |
| `args` _string array_ | Args are the arguments passed to the container entrypoint. |  |  |
| `workingDir` _string_ | workingDir sets the container working directory. Defaults to the image WORKDIR when omitted. |  |  |
| `replicas` _integer_ | Replicas is the number of desired agent pods. Defaults to 1. |  |  |
| `imagePullSecrets` _[LocalObjectReference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#localobjectreference-v1-core) array_ | ImagePullSecrets are references to secrets in the agent's namespace<br />used for pulling the agent container image. |  |  |
| `volumes` _[Volume](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volume-v1-core) array_ | Volumes are additional volumes added to the agent pod. |  |  |
| `volumeMounts` _[VolumeMount](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volumemount-v1-core) array_ | VolumeMounts are additional volume mounts added to the agent container. |  |  |
| `labels` _object (keys:string, values:string)_ | Labels are additional labels added to the agent pods. |  |  |
| `annotations` _object (keys:string, values:string)_ | Annotations are additional annotations added to the agent pods. |  |  |
| `env` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#envvar-v1-core) array_ | Env are additional environment variables set on the agent container. |  |  |
| `imagePullPolicy` _[PullPolicy](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#pullpolicy-v1-core)_ |  |  |  |
| `resources` _[ResourceRequirements](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#resourcerequirements-v1-core)_ |  |  |  |
| `tolerations` _[Toleration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#toleration-v1-core) array_ | Tolerations applied to the agent pods. |  |  |
| `affinity` _[Affinity](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#affinity-v1-core)_ |  |  |  |
| `nodeSelector` _object (keys:string, values:string)_ | NodeSelector restricts the nodes the agent pods can be scheduled on. |  |  |
| `securityContext` _[SecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#securitycontext-v1-core)_ |  |  |  |
| `podSecurityContext` _[PodSecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#podsecuritycontext-v1-core)_ |  |  |  |
| `serviceAccountName` _string_ | ServiceAccountName specifies the name of an existing ServiceAccount to use.<br />If this field is set, the Agent controller will not create a ServiceAccount for the agent.<br />This field is mutually exclusive with ServiceAccountConfig. |  |  |
| `serviceAccountConfig` _[ServiceAccountConfig](#serviceaccountconfig)_ | ServiceAccountConfig configures the ServiceAccount created by the Agent controller.<br />This field can only be used when ServiceAccountName is not set.<br />If ServiceAccountName is not set, a default ServiceAccount (named after the agent)<br />is created, and this config will be applied to it. |  |  |
| `extraContainers` _[Container](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#container-v1-core) array_ | ExtraContainers is a list of additional containers to run alongside the main agent container.<br />Useful for sidecars such as token proxies, log shippers, or security agents. |  |  |

#### ContextCompressionConfig

ContextCompressionConfig configures event history compaction/compression.

_Appears in:_
- [ContextConfig](#contextconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `compactionInterval` _integer_ | The number of *new* user-initiated invocations that, once fully represented in the session's events, will trigger a compaction. | 5 | Minimum: 1 <br /> |
| `overlapSize` _integer_ | The number of preceding invocations to include from the end of the last compacted range. This creates an overlap between consecutive compacted summaries, maintaining context. | 2 | Minimum: 0 <br /> |
| `summarizer` _[ContextSummarizerConfig](#contextsummarizerconfig)_ | Summarizer configures an LLM-based summarizer for event compaction.<br />If not specified, compacted events are dropped from the context without summarization. |  |  |
| `tokenThreshold` _integer_ | Post-invocation token threshold trigger. If set, ADK will attempt a post-invocation compaction when the most recently<br />observed prompt token count meets or exceeds this threshold. |  |  |
| `eventRetentionSize` _integer_ | EventRetentionSize is the number of most recent events to always retain. |  |  |

#### ContextConfig

ContextConfig configures context management for an agent.

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `compaction` _[ContextCompressionConfig](#contextcompressionconfig)_ | Compaction configures event history compaction.<br />When enabled, older events in the conversation are compacted (compressed/summarized)<br />to reduce context size while preserving key information. |  |  |

#### ContextSummarizerConfig

ContextSummarizerConfig configures the LLM-based event summarizer.

_Appears in:_
- [ContextCompressionConfig](#contextcompressionconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `modelConfig` _string_ | ModelConfig is the name of a ModelConfig resource to use for summarization.<br />Must be in the same namespace as the Agent.<br />If not specified, uses the agent's own model. |  |  |
| `promptTemplate` _string_ | PromptTemplate is a custom prompt template for the summarizer.<br />See the ADK LlmEventSummarizer for template details:<br />https://github.com/google/adk-python/blob/main/src/google/adk/apps/llm_event_summarizer.py |  |  |

#### DeclarativeAgentSpec

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `runtime` _[DeclarativeRuntime](#declarativeruntime)_ | Runtime specifies which ADK implementation to use for this agent.<br />- "go": Uses the Go ADK (default, faster startup, most features supported)<br />- "python": Uses the Python ADK (slower startup, full feature set)<br />The runtime determines both the container image and readiness probe configuration. | go | Enum: [python go] <br /> |
| `systemMessage` _string_ | SystemMessage is a string specifying the system message for the agent.<br />When PromptTemplate is set, this field is treated as a Go text/template<br />with access to an include("source/key") function and agent context variables<br />such as .AgentName, .AgentNamespace, .Description, .ToolNames, and .SkillNames. |  |  |
| `systemMessageFrom` _[ValueSource](#valuesource)_ | SystemMessageFrom is a reference to a ConfigMap or Secret containing the system message.<br />When PromptTemplate is set, the resolved value is treated as a Go text/template. |  |  |
| `promptTemplate` _[PromptTemplateSpec](#prompttemplatespec)_ | PromptTemplate enables Go text/template processing on the systemMessage field.<br />When set, systemMessage is treated as a Go template with access to the include function<br />and agent context variables. |  |  |
| `modelConfig` _string_ | The name of the model config to use.<br />If not specified, the default value is "default-model-config".<br />Must be in the same namespace as the Agent. |  |  |
| `stream` _boolean_ | Whether to stream the response from the model.<br />If not specified, the default value is false. |  |  |
| `tools` _[Tool](#tool) array_ |  |  | MaxItems: 20 <br /> |
| `a2aConfig` _[A2AConfig](#a2aconfig)_ | A2AConfig instantiates an A2A server for this agent,<br />served on the HTTP port of the kagent kubernetes<br />controller (default 8083).<br />The A2A server URL will be served at<br />&lt;kagent-controller-ip&gt;:8083/api/a2a/&lt;agent-namespace&gt;/&lt;agent-name&gt;<br />Read more about the A2A protocol here: https://github.com/a2aproject/A2A |  |  |
| `deployment` _[DeclarativeDeploymentSpec](#declarativedeploymentspec)_ |  |  |  |
| `executeCodeBlocks` _boolean_ | Allow code execution for python code blocks with this agent.<br />If true, the agent will automatically execute python code blocks in the LLM responses.<br />Code will be executed in a sandboxed environment.<br />due to a bug in adk (https://github.com/google/adk-python/issues/3921 ), this field is ignored for now. |  |  |
| `memory` _[MemorySpec](#memoryspec)_ | Memory configuration for the agent. |  |  |
| `shareTools` _boolean_ | ShareTools enables the built-in share link tools for this agent.<br />When true, the agent gains create_share_link, list_share_links, and delete_share_link tools<br />that allow it to manage share tokens for the current session. |  |  |
| `context` _[ContextConfig](#contextconfig)_ | Context configures context management for this agent.<br />This includes event compaction (compression) and context caching. |  |  |

#### DeclarativeDeploymentSpec

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `imageRegistry` _string_ |  |  |  |
| `replicas` _integer_ | Replicas is the number of desired agent pods. Defaults to 1. |  |  |
| `imagePullSecrets` _[LocalObjectReference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#localobjectreference-v1-core) array_ | ImagePullSecrets are references to secrets in the agent's namespace<br />used for pulling the agent container image. |  |  |
| `volumes` _[Volume](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volume-v1-core) array_ | Volumes are additional volumes added to the agent pod. |  |  |
| `volumeMounts` _[VolumeMount](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volumemount-v1-core) array_ | VolumeMounts are additional volume mounts added to the agent container. |  |  |
| `labels` _object (keys:string, values:string)_ | Labels are additional labels added to the agent pods. |  |  |
| `annotations` _object (keys:string, values:string)_ | Annotations are additional annotations added to the agent pods. |  |  |
| `env` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#envvar-v1-core) array_ | Env are additional environment variables set on the agent container. |  |  |
| `imagePullPolicy` _[PullPolicy](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#pullpolicy-v1-core)_ |  |  |  |
| `resources` _[ResourceRequirements](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#resourcerequirements-v1-core)_ |  |  |  |
| `tolerations` _[Toleration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#toleration-v1-core) array_ | Tolerations applied to the agent pods. |  |  |
| `affinity` _[Affinity](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#affinity-v1-core)_ |  |  |  |
| `nodeSelector` _object (keys:string, values:string)_ | NodeSelector restricts the nodes the agent pods can be scheduled on. |  |  |
| `securityContext` _[SecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#securitycontext-v1-core)_ |  |  |  |
| `podSecurityContext` _[PodSecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#podsecuritycontext-v1-core)_ |  |  |  |
| `serviceAccountName` _string_ | ServiceAccountName specifies the name of an existing ServiceAccount to use.<br />If this field is set, the Agent controller will not create a ServiceAccount for the agent.<br />This field is mutually exclusive with ServiceAccountConfig. |  |  |
| `serviceAccountConfig` _[ServiceAccountConfig](#serviceaccountconfig)_ | ServiceAccountConfig configures the ServiceAccount created by the Agent controller.<br />This field can only be used when ServiceAccountName is not set.<br />If ServiceAccountName is not set, a default ServiceAccount (named after the agent)<br />is created, and this config will be applied to it. |  |  |
| `extraContainers` _[Container](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#container-v1-core) array_ | ExtraContainers is a list of additional containers to run alongside the main agent container.<br />Useful for sidecars such as token proxies, log shippers, or security agents. |  |  |

#### DeclarativeRuntime

_Underlying type:_ _string_

DeclarativeRuntime represents the runtime implementation for declarative agents

_Validation:_
- Enum: [python go]

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description |
| --- | --- |
| `python` |  |
| `go` |  |

#### FromNamespaces

_Underlying type:_ _string_

FromNamespaces specifies namespace from which references to this resource are allowed.
This follows the same pattern as Gateway API's cross-namespace route attachment.
See: https://gateway-api.sigs.k8s.io/guides/multiple-ns/#cross-namespace-route-attachment

_Validation:_
- Enum: [All Same Selector]

_Appears in:_
- [AllowedNamespaces](#allowednamespaces)

| Field | Description |
| --- | --- |
| `All` | NamespacesFromAll allows references from all namespaces.<br /> |
| `Same` | NamespacesFromSame only allows references from the same namespace as the target resource (default).<br /> |
| `Selector` | NamespacesFromSelector allows references from namespaces matching the selector.<br /> |

#### GDCHServiceAccountConfig

GDCHServiceAccountConfig holds GDCH-specific token exchange parameters.

_Appears in:_
- [TokenExchangeConfig](#tokenexchangeconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `audience` _string_ | Audience is the token exchange audience URL (the GDC inference gateway base URL) |  |  |

#### GeminiConfig

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

#### GeminiVertexAIConfig

GeminiVertexAIConfig contains Gemini Vertex AI-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `projectID` _string_ | The project ID |  |  |
| `location` _string_ | The project location |  |  |
| `temperature` _string_ | Temperature |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `topK` _string_ | Top-k sampling parameter |  |  |
| `stopSequences` _string array_ | Stop sequences |  |  |
| `maxOutputTokens` _integer_ | Maximum output tokens |  |  |
| `candidateCount` _integer_ | Candidate count |  |  |
| `responseMimeType` _string_ | Response mime type |  |  |

#### GitRepo

GitRepo specifies a single Git repository to fetch skills from.

_Appears in:_
- [SkillForAgent](#skillforagent)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `url` _string_ | URL of the git repository (HTTPS or SSH). |  |  |
| `ref` _string_ | Git reference: branch name, tag, or commit SHA. | main |  |
| `path` _string_ | Subdirectory within the repo to use as the skill root. The API validates<br />this input path, but treats repository contents as trusted: symlinks under<br />this path are dereferenced when materializing the skill. |  |  |
| `name` _string_ | Name for the skill directory under /skills. If omitted, defaults to the last<br />segment of Path when Path is set; otherwise defaults to the repo name (last<br />URL path segment, without .git). |  |  |

#### MCPTool

_Appears in:_
- [RemoteMCPServerStatus](#remotemcpserverstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ |  |  |  |
| `description` _string_ |  |  |  |

#### McpServerTool

_Appears in:_
- [Tool](#tool)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `kind` _string_ |  |  |  |
| `apiGroup` _string_ |  |  |  |
| `name` _string_ |  |  |  |
| `namespace` _string_ |  |  |  |
| `toolNames` _string array_ | The names of the tools to be provided by the ToolServer<br />For a list of all the tools provided by the server,<br />the client can query the status of the ToolServer object after it has been created |  | MaxItems: 50 <br /> |
| `requireApproval` _string array_ | RequireApproval lists tool names that require human approval before<br />execution. Each name must also appear in ToolNames. When a tool in<br />this list is invoked by the agent, execution pauses and the user is<br />prompted to approve or reject the call. |  | MaxItems: 50 <br /> |
| `allowedHeaders` _string array_ | AllowedHeaders specifies which headers from the A2A request should be<br />propagated to MCP tool calls. Header names are case-insensitive.<br /><br />Authorization header behavior:<br />- Authorization headers CAN be propagated if explicitly listed in allowedHeaders<br />- When STS token propagation is enabled, STS-generated Authorization headers<br />  will take precedence and replace any Authorization header from the A2A request<br />- This is a security measure to prevent request headers from overwriting<br />  authentication tokens generated by the STS integration<br /><br />Example: ["x-user-email", "x-tenant-id"] |  |  |

#### MemorySpec

MemorySpec enables long-term memory for an agent.

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `modelConfig` _string_ | ModelConfig is the name of the ModelConfig object whose embedding<br />provider will be used to generate memory vectors. |  |  |
| `ttlDays` _integer_ | TTLDays controls how many days a stored memory entry remains valid before<br />it is eligible for pruning. Defaults to 15 days when unset or zero. |  | Minimum: 1 <br /> |

#### ModelConfig

ModelConfig is the Schema for the modelconfigs API.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `ModelConfig` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[ModelConfigSpec](#modelconfigspec)_ |  |  |  |
| `status` _[ModelConfigStatus](#modelconfigstatus)_ |  |  |  |

#### ModelConfigSpec

ModelConfigSpec defines the desired state of ModelConfig.

_Appears in:_
- [ModelConfig](#modelconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `model` _string_ |  |  |  |
| `apiKeySecret` _string_ | The name of the secret that contains the API key. Must be a reference to the name of a secret in the same namespace as the referencing ModelConfig.<br />For the SAPAICore provider, the secret must contain two keys: "client_id" and "client_secret"<br />(the OAuth2 client credentials for SAP AI Core). The apiKeySecretKey field is not used for SAPAICore. |  |  |
| `apiKeySecretKey` _string_ | The key in the secret that contains the API key.<br />Not used for the SAPAICore provider (which always reads "client_id" and "client_secret" from the secret). |  |  |
| `apiKeyPassthrough` _boolean_ | APIKeyPassthrough enables forwarding the Bearer token from incoming A2A requests<br />directly to the LLM provider as the API key. This is useful for organizations<br />with federated identity that want to avoid separate secret management.<br />Mutually exclusive with apiKeySecret. |  |  |
| `defaultHeaders` _object (keys:string, values:string)_ |  |  |  |
| `provider` _[ModelProvider](#modelprovider)_ | The provider of the model | OpenAI | Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore] <br /> |
| `openAI` _[OpenAIConfig](#openaiconfig)_ | OpenAI-specific configuration |  |  |
| `anthropic` _[AnthropicConfig](#anthropicconfig)_ | Anthropic-specific configuration |  |  |
| `azureOpenAI` _[AzureOpenAIConfig](#azureopenaiconfig)_ | Azure OpenAI-specific configuration |  |  |
| `ollama` _[OllamaConfig](#ollamaconfig)_ | Ollama-specific configuration |  |  |
| `gemini` _[GeminiConfig](#geminiconfig)_ | Gemini-specific configuration |  |  |
| `geminiVertexAI` _[GeminiVertexAIConfig](#geminivertexaiconfig)_ | Gemini Vertex AI-specific configuration |  |  |
| `anthropicVertexAI` _[AnthropicVertexAIConfig](#anthropicvertexaiconfig)_ | Anthropic-specific configuration |  |  |
| `bedrock` _[BedrockConfig](#bedrockconfig)_ | AWS Bedrock-specific configuration |  |  |
| `sapAICore` _[SAPAICoreConfig](#sapaicoreconfig)_ | SAP AI Core-specific configuration |  |  |
| `tls` _[TLSConfig](#tlsconfig)_ | TLS configuration for provider connections.<br />Enables agents to connect to internal LiteLLM gateways or other providers<br />that use self-signed certificates or custom certificate authorities. |  |  |

#### ModelConfigStatus

ModelConfigStatus defines the observed state of ModelConfig.

_Appears in:_
- [ModelConfig](#modelconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `conditions` _[Condition](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#condition-v1-meta) array_ |  |  |  |
| `observedGeneration` _integer_ |  |  |  |
| `secretHash` _string_ | The secret hash stores a hash of any secrets required by the model config (i.e. api key, tls cert) to ensure agents referencing this model config detect changes to these secrets and restart if necessary. |  |  |

#### ModelProvider

_Underlying type:_ _string_

ModelProvider represents the model provider type

_Validation:_
- Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore]

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)
- [ModelProviderConfigSpec](#modelproviderconfigspec)

| Field | Description |
| --- | --- |
| `Anthropic` |  |
| `AzureOpenAI` |  |
| `OpenAI` |  |
| `Ollama` |  |
| `Gemini` |  |
| `GeminiVertexAI` |  |
| `AnthropicVertexAI` |  |
| `Bedrock` |  |
| `SAPAICore` |  |

#### ModelProviderConfig

ModelProviderConfig is the Schema for the modelproviderconfigs API.
It represents a model provider configuration with automatic model discovery.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `ModelProviderConfig` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[ModelProviderConfigSpec](#modelproviderconfigspec)_ |  |  |  |
| `status` _[ModelProviderConfigStatus](#modelproviderconfigstatus)_ |  |  |  |

#### ModelProviderConfigSpec

ModelProviderConfigSpec defines the desired state of ModelProviderConfig.

_Appears in:_
- [ModelProviderConfig](#modelproviderconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[ModelProvider](#modelprovider)_ | Type is the model provider type (OpenAI, Anthropic, etc.) |  | Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore] <br /> |
| `endpoint` _string_ | Endpoint is the API endpoint URL for the provider.<br />If not specified, the default endpoint for the provider type will be used. |  | Pattern: `^https?://.*` <br /> |
| `secretRef` _[SecretReference](#secretreference)_ | SecretRef references the Kubernetes Secret containing the API key.<br />Optional for providers that don't require authentication (e.g., local Ollama). |  |  |

#### ModelProviderConfigStatus

ModelProviderConfigStatus defines the observed state of ModelProviderConfig.

_Appears in:_
- [ModelProviderConfig](#modelproviderconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `observedGeneration` _integer_ | ObservedGeneration reflects the generation of the most recently observed ModelProviderConfig spec |  |  |
| `conditions` _[Condition](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#condition-v1-meta) array_ | Conditions represent the latest available observations of the ModelProviderConfig's state |  |  |
| `discoveredModels` _string array_ | DiscoveredModels is the cached list of model IDs available from this model provider |  |  |
| `modelCount` _integer_ | ModelCount is the number of discovered models (for kubectl display) |  |  |
| `lastDiscoveryTime` _[Time](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#time-v1-meta)_ | LastDiscoveryTime is the timestamp of the last successful model discovery |  |  |
| `secretHash` _string_ | SecretHash is a hash of the referenced secret data, used to detect secret changes |  |  |

#### NetworkConfig

NetworkConfig configures outbound network access for sandboxed execution paths.

_Appears in:_
- [SandboxConfig](#sandboxconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `allowedDomains` _string array_ | AllowedDomains lists the domains that sandboxed execution may contact.<br />Wildcards such as *.example.com are supported by the sandbox runtime. |  |  |

#### OllamaConfig

OllamaConfig contains Ollama-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `host` _string_ | Host for the Ollama API |  |  |
| `options` _object (keys:string, values:string)_ | Options for the Ollama API |  |  |

#### OpenAIConfig

OpenAIConfig contains OpenAI-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `baseUrl` _string_ | Base URL for the OpenAI API (overrides default) |  |  |
| `organization` _string_ | Organization ID for the OpenAI API |  |  |
| `temperature` _string_ | Temperature for sampling |  |  |
| `maxTokens` _integer_ | Maximum tokens to generate |  |  |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `frequencyPenalty` _string_ | Frequency penalty |  |  |
| `presencePenalty` _string_ | Presence penalty |  |  |
| `seed` _integer_ | Seed value |  |  |
| `n` _integer_ | N value |  |  |
| `timeout` _integer_ | Timeout |  |  |
| `reasoningEffort` _[OpenAIReasoningEffort](#openaireasoningeffort)_ | Reasoning effort |  | Enum: [none minimal low medium high] <br /> |
| `tokenExchange` _[TokenExchangeConfig](#tokenexchangeconfig)_ | TokenExchange configures dynamic bearer token acquisition via credential exchange.<br />Requires apiKeySecret (used as the service account secret) and is mutually exclusive with apiKeyPassthrough. |  |  |

#### OpenAIReasoningEffort

_Underlying type:_ _string_

OpenAIReasoningEffort represents how many reasoning tokens the model generates before producing a response.
Set to "none" to disable reasoning; some models (e.g. gpt-5.6-terra) require this to use
function tools via the Chat Completions API.

_Validation:_
- Enum: [none minimal low medium high]

_Appears in:_
- [OpenAIConfig](#openaiconfig)

#### PromptSource

PromptSource references a ConfigMap whose keys are available as prompt fragments.
In systemMessage templates, use include("alias/key") (or include("name/key") if no alias is set)
to insert the value of a specific key from this source.

_Appears in:_
- [PromptTemplateSpec](#prompttemplatespec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `kind` _string_ |  |  |  |
| `apiGroup` _string_ |  |  |  |
| `name` _string_ |  |  |  |
| `alias` _string_ | Alias is an optional short identifier for use in include directives.<br />If set, use include("alias/key") instead of include("name/key"). |  |  |

#### PromptTemplateSpec

PromptTemplateSpec configures prompt template processing for an agent's system message.

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `dataSources` _[PromptSource](#promptsource) array_ | DataSources defines the ConfigMaps whose keys can be included in the systemMessage<br />using Go template syntax, e.g. include("alias/key") or include("name/key"). |  | MaxItems: 20 <br /> |

#### RemoteMCPServer

RemoteMCPServer is the Schema for the RemoteMCPServers API.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `RemoteMCPServer` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[RemoteMCPServerSpec](#remotemcpserverspec)_ |  |  |  |
| `status` _[RemoteMCPServerStatus](#remotemcpserverstatus)_ |  |  |  |

#### RemoteMCPServerProtocol

_Underlying type:_ _string_

_Validation:_
- Enum: [SSE STREAMABLE_HTTP]

_Appears in:_
- [RemoteMCPServerSpec](#remotemcpserverspec)

| Field | Description |
| --- | --- |
| `SSE` |  |
| `STREAMABLE_HTTP` |  |

#### RemoteMCPServerSpec

RemoteMCPServerSpec defines the desired state of RemoteMCPServer.

_Appears in:_
- [RemoteMCPServer](#remotemcpserver)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `description` _string_ |  |  |  |
| `protocol` _[RemoteMCPServerProtocol](#remotemcpserverprotocol)_ |  | STREAMABLE_HTTP | Enum: [SSE STREAMABLE_HTTP] <br /> |
| `url` _string_ |  |  | MinLength: 1 <br /> |
| `headersFrom` _[ValueRef](#valueref) array_ |  |  |  |
| `timeout` _[Duration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#duration-v1-meta)_ |  | 30s |  |
| `sseReadTimeout` _[Duration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#duration-v1-meta)_ |  |  |  |
| `terminateOnClose` _boolean_ |  | true |  |
| `allowedNamespaces` _[AllowedNamespaces](#allowednamespaces)_ | AllowedNamespaces defines which namespaces are allowed to reference this RemoteMCPServer.<br />This follows the Gateway API pattern for cross-namespace route attachments.<br />If not specified, only Agents in the same namespace can reference this RemoteMCPServer.<br />See: https://gateway-api.sigs.k8s.io/guides/multiple-ns/#cross-namespace-route-attachment<br /><br />A cross-namespace-permitting value (from: All or from: Selector) is<br />mutually exclusive with spec.tls.caCertSecretRef (enforced by a spec-level<br />XValidation rule): a pinned CA Secret is mounted onto the consuming agent's<br />pod by bare name and Kubernetes resolves it in the agent's namespace, not<br />this RemoteMCPServer's, so a CA-pinning RemoteMCPServer cannot be referenced<br />cross-namespace. from: Same (the default) is always allowed. |  |  |
| `tls` _[TLSConfig](#tlsconfig)_ | TLS configuration for the upstream MCP server connection.<br />Use this for HTTPS upstreams that present a certificate the agent's<br />system trust store does not include (corporate CA, self-signed cert<br />on a test fixture, internal MCP gateway). Reuses the same TLSConfig<br />type as ModelConfig.spec.tls — disableVerify turns off certificate<br />validation entirely, caCertSecretRef + caCertSecretKey point at a<br />PEM bundle Secret in the same namespace, and disableSystemCAs<br />trusts only the named bundle.<br /><br />Note one asymmetry with ModelConfig: a spec-level XValidation rule<br />on RemoteMCPServer rejects spec.tls when spec.url has the http://<br />scheme (a TLS opinion contradicts a plaintext URL). ModelConfig has<br />no equivalent rule, so a TLS block can sit alongside any baseUrl. |  |  |

#### RemoteMCPServerStatus

RemoteMCPServerStatus defines the observed state of RemoteMCPServer.

_Appears in:_
- [RemoteMCPServer](#remotemcpserver)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `observedGeneration` _integer_ | INSERT ADDITIONAL STATUS FIELD - define observed state of cluster<br />Important: Run "make" to regenerate code after modifying this file |  |  |
| `conditions` _[Condition](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#condition-v1-meta) array_ |  |  |  |
| `discoveredTools` _[MCPTool](#mcptool) array_ |  |  |  |
| `secretHash` _string_ | SecretHash stores a hash of the TLS Secret referenced by spec.tls so<br />agents that consume this RemoteMCPServer can detect cert rotation and<br />roll on the next reconcile. Empty when spec.tls.caCertSecretRef is unset. |  |  |

#### SAPAICoreConfig

SAPAICoreConfig contains SAP AI Core-specific configuration options.

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `baseUrl` _string_ | Base URL for the SAP AI Core API (e.g., https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com) |  |  |
| `resourceGroup` _string_ | Resource group in SAP AI Core | default |  |
| `authUrl` _string_ | OAuth2 token endpoint URL (e.g., https://tenant.authentication.eu10.hana.ondemand.com) |  |  |

#### SandboxAgent

SandboxAgent declares an agent that runs in an isolated sandbox on Agent Substrate.

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `apiVersion` _string_ | `kagent.dev/v1alpha2` | | |
| `kind` _string_ | `SandboxAgent` | | |
| `kind` _string_ | Kind is a string value representing the REST resource this object represents.<br />Servers may infer this from the endpoint the client submits requests to.<br />Cannot be updated.<br />In CamelCase.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds |  |  |
| `apiVersion` _string_ | APIVersion defines the versioned schema of this representation of an object.<br />Servers should convert recognized schemas to the latest internal value, and<br />may reject unrecognized values.<br />More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources |  |  |
| `metadata` _[ObjectMeta](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#objectmeta-v1-meta)_ | Refer to Kubernetes API documentation for fields of `metadata`. |  |  |
| `spec` _[SandboxAgentSpec](#sandboxagentspec)_ |  |  |  |
| `status` _[AgentStatus](#agentstatus)_ |  |  |  |

#### SandboxAgentSpec

_Appears in:_
- [SandboxAgent](#sandboxagent)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[AgentType](#agenttype)_ |  | Declarative | Enum: [Declarative BYO] <br /> |
| `byo` _[BYOAgentSpec](#byoagentspec)_ | BYO configures a "bring your own" agent backed by a user-provided<br />container image. Kagent deploys the image and expects it to serve the<br />agent over the A2A protocol on port 8080.<br />Required if type is BYO. |  |  |
| `declarative` _[DeclarativeAgentSpec](#declarativeagentspec)_ | Declarative configures an agent that is fully described by this resource<br />(model, instructions, tools) and runs on one of kagent's built-in runtimes.<br />Required if type is Declarative. |  |  |
| `description` _string_ |  |  |  |
| `iconUrl` _string_ | IconURL is a URL to an icon representing the agent. It is surfaced on the<br />agent's A2A AgentCard. |  | Format: uri <br /> |
| `documentationUrl` _string_ | DocumentationURL is a URL to human-readable documentation for the agent. It<br />is surfaced on the agent's A2A AgentCard. |  | Format: uri <br /> |
| `version` _string_ | Version is the agent's version string, surfaced on the A2A AgentCard. |  |  |
| `provider` _[AgentProvider](#agentprovider)_ | Provider identifies the organization responsible for the agent. It is<br />surfaced on the agent's A2A AgentCard. |  |  |
| `skills` _[SkillForAgent](#skillforagent)_ | Skills to load into the agent. They will be pulled from the specified container images.<br />and made available to the agent under the `/skills` folder. |  |  |
| `sandbox` _[SandboxConfig](#sandboxconfig)_ | Sandbox configures sandboxed execution behavior shared across runtimes.<br />This is intended for sandboxed declarative execution today, and can also<br />be consumed by BYO agents. |  |  |
| `allowedNamespaces` _[AllowedNamespaces](#allowednamespaces)_ | AllowedNamespaces defines which namespaces are allowed to reference this Agent as a tool.<br />This follows the Gateway API pattern for cross-namespace route attachments.<br />If not specified, only Agents in the same namespace can reference this Agent as a tool.<br />This field only applies when this Agent is used as a tool by another Agent.<br />See: https://gateway-api.sigs.k8s.io/guides/multiple-ns/#cross-namespace-route-attachment |  |  |
| `substrate` _[SandboxSubstrateSpec](#sandboxsubstratespec)_ | Substrate is optional Agent Substrate-specific settings. |  |  |

#### SandboxConfig

SandboxConfig configures sandboxed execution behavior.

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `network` _[NetworkConfig](#networkconfig)_ | Network configures outbound network access for sandboxed execution paths.<br />When unset or when allowedDomains is empty, outbound access is denied by default. |  |  |

#### SandboxSubstrateSpec

SandboxSubstrateSpec configures Agent Substrate for a SandboxAgent.
WorkerPool capacity is referenced from workerPoolRef or the controller default.

_Appears in:_
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `workerPoolRef` _[TypedLocalReference](#typedlocalreference)_ | WorkerPoolRef references an existing ate.dev WorkerPool. |  |  |
| `snapshotsConfig` _[AgentHarnessSubstrateSnapshotsConfig](#agentharnesssubstratesnapshotsconfig)_ | SnapshotsConfig configures actor memory snapshots.<br />Defaults to gs://ate-snapshots/&lt;namespace&gt;/&lt;agentname&gt; when unset. |  |  |

#### SecretReference

SecretReference references a Kubernetes Secret that must contain exactly one data key
holding the API key or credential.

_Appears in:_
- [ModelProviderConfigSpec](#modelproviderconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name is the name of the secret in the same namespace as the ModelProviderConfig. |  |  |

#### ServiceAccountConfig

_Appears in:_
- [ByoDeploymentSpec](#byodeploymentspec)
- [DeclarativeDeploymentSpec](#declarativedeploymentspec)
- [SharedDeploymentSpec](#shareddeploymentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `labels` _object (keys:string, values:string)_ | Labels are additional labels added to the created ServiceAccount. |  |  |
| `annotations` _object (keys:string, values:string)_ | Annotations are additional annotations added to the created ServiceAccount. |  |  |

#### SharedDeploymentSpec

_Appears in:_
- [ByoDeploymentSpec](#byodeploymentspec)
- [DeclarativeDeploymentSpec](#declarativedeploymentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `replicas` _integer_ | Replicas is the number of desired agent pods. Defaults to 1. |  |  |
| `imagePullSecrets` _[LocalObjectReference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#localobjectreference-v1-core) array_ | ImagePullSecrets are references to secrets in the agent's namespace<br />used for pulling the agent container image. |  |  |
| `volumes` _[Volume](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volume-v1-core) array_ | Volumes are additional volumes added to the agent pod. |  |  |
| `volumeMounts` _[VolumeMount](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#volumemount-v1-core) array_ | VolumeMounts are additional volume mounts added to the agent container. |  |  |
| `labels` _object (keys:string, values:string)_ | Labels are additional labels added to the agent pods. |  |  |
| `annotations` _object (keys:string, values:string)_ | Annotations are additional annotations added to the agent pods. |  |  |
| `env` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#envvar-v1-core) array_ | Env are additional environment variables set on the agent container. |  |  |
| `imagePullPolicy` _[PullPolicy](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#pullpolicy-v1-core)_ |  |  |  |
| `resources` _[ResourceRequirements](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#resourcerequirements-v1-core)_ |  |  |  |
| `tolerations` _[Toleration](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#toleration-v1-core) array_ | Tolerations applied to the agent pods. |  |  |
| `affinity` _[Affinity](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#affinity-v1-core)_ |  |  |  |
| `nodeSelector` _object (keys:string, values:string)_ | NodeSelector restricts the nodes the agent pods can be scheduled on. |  |  |
| `securityContext` _[SecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#securitycontext-v1-core)_ |  |  |  |
| `podSecurityContext` _[PodSecurityContext](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#podsecuritycontext-v1-core)_ |  |  |  |
| `serviceAccountName` _string_ | ServiceAccountName specifies the name of an existing ServiceAccount to use.<br />If this field is set, the Agent controller will not create a ServiceAccount for the agent.<br />This field is mutually exclusive with ServiceAccountConfig. |  |  |
| `serviceAccountConfig` _[ServiceAccountConfig](#serviceaccountconfig)_ | ServiceAccountConfig configures the ServiceAccount created by the Agent controller.<br />This field can only be used when ServiceAccountName is not set.<br />If ServiceAccountName is not set, a default ServiceAccount (named after the agent)<br />is created, and this config will be applied to it. |  |  |
| `extraContainers` _[Container](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#container-v1-core) array_ | ExtraContainers is a list of additional containers to run alongside the main agent container.<br />Useful for sidecars such as token proxies, log shippers, or security agents. |  |  |

#### SkillForAgent

_Appears in:_
- [AgentSpec](#agentspec)
- [SandboxAgentSpec](#sandboxagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `insecureSkipVerify` _boolean_ | Fetch images insecurely from registries (allowing HTTP and skipping TLS verification).<br />Meant for development and testing purposes only. |  |  |
| `refs` _string array_ | The list of skill images to fetch. |  | MaxItems: 20 <br />MinItems: 1 <br /> |
| `imagePullSecrets` _[LocalObjectReference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#localobjectreference-v1-core) array_ | ImagePullSecrets is a list of references to secrets in the same namespace to use for<br />pulling skill images from private registries. Each referenced secret must be of type<br />kubernetes.io/dockerconfigjson. The credentials from all secrets are merged and made<br />available to the skills-init container at /.kagent/.docker/config.json; krane will<br />use them automatically when pulling images. |  | MaxItems: 20 <br /> |
| `gitAuthSecretRef` _[LocalObjectReference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#localobjectreference-v1-core)_ | Reference to a Secret containing git credentials.<br />Applied to all gitRefs entries.<br />The secret should contain a `token` key for HTTPS auth,<br />or `ssh-privatekey` for SSH auth. |  |  |
| `gitRefs` _[GitRepo](#gitrepo) array_ | Git repositories to fetch skills from. |  | MaxItems: 20 <br />MinItems: 1 <br /> |
| `initContainer` _[SkillsInitContainer](#skillsinitcontainer)_ | Configuration for the skills-init init container. |  |  |

#### SkillsInitContainer

SkillsInitContainer configures the skills-init init container.

_Appears in:_
- [SkillForAgent](#skillforagent)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `resources` _[ResourceRequirements](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#resourcerequirements-v1-core)_ | Resource requirements for the skills-init init container. |  |  |
| `env` _[EnvVar](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#envvar-v1-core) array_ | Additional environment variables for the skills-init init container. |  |  |

#### TLSConfig

TLSConfig contains TLS/SSL configuration options for outbound HTTPS
connections from the agent (model provider, RemoteMCPServer). The
XValidation rules below apply at admission to every CRD field that
uses TLSConfig, so callers don't need to re-declare them per spec.

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)
- [RemoteMCPServerSpec](#remotemcpserverspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `disableVerify` _boolean_ | DisableVerify disables SSL certificate verification entirely.<br />When false (default), SSL certificates are verified.<br />When true, SSL certificate verification is disabled.<br />WARNING: This should ONLY be used in development/testing environments.<br />Production deployments MUST use proper certificates. | false |  |
| `caCertSecretRef` _string_ | CACertSecretRef is a reference to a Kubernetes Secret containing<br />CA certificate(s) in PEM format. The Secret must be in the same<br />namespace as the resource referencing it (ModelConfig,<br />RemoteMCPServer, or any future consumer of TLSConfig).<br />When set, the certificate will be used to verify the upstream's<br />SSL certificate. |  |  |
| `caCertSecretKey` _string_ | CACertSecretKey is the key within the Secret that contains the<br />CA certificate data (PEM-encoded). Required when CACertSecretRef<br />is set — admission rejects ref-without-key regardless of<br />DisableVerify (see the TLSConfig-level XValidation rules). |  |  |
| `disableSystemCAs` _boolean_ | DisableSystemCAs disables the use of system CA certificates.<br />When false (default), system CA certificates are used for verification (safe behavior).<br />When true, only the custom CA from CACertSecretRef is trusted.<br />This allows strict security policies where only corporate CAs should be trusted. | false |  |

#### TokenExchangeConfig

TokenExchangeConfig configures dynamic bearer token acquisition before model calls.

_Appears in:_
- [OpenAIConfig](#openaiconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[TokenExchangeType](#tokenexchangetype)_ |  |  | Enum: [GDCHServiceAccount] <br /> |
| `gdchServiceAccount` _[GDCHServiceAccountConfig](#gdchserviceaccountconfig)_ |  |  |  |

#### TokenExchangeType

_Underlying type:_ _string_

TokenExchangeType identifies the token exchange mechanism

_Validation:_
- Enum: [GDCHServiceAccount]

_Appears in:_
- [TokenExchangeConfig](#tokenexchangeconfig)

| Field | Description |
| --- | --- |
| `GDCHServiceAccount` |  |

#### Tool

_Appears in:_
- [DeclarativeAgentSpec](#declarativeagentspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[ToolProviderType](#toolprovidertype)_ |  |  | Enum: [McpServer Agent] <br /> |
| `mcpServer` _[McpServerTool](#mcpservertool)_ |  |  |  |
| `agent` _[TypedReference](#typedreference)_ |  |  |  |
| `headersFrom` _[ValueRef](#valueref) array_ | HeadersFrom specifies a list of configuration values to be added as<br />headers to requests sent to the Tool from this agent. The value of<br />each header is resolved from either a Secret or ConfigMap in the same<br />namespace as the Agent. Headers specified here will override any<br />headers of the same name/key specified on the tool. |  |  |

#### ToolProviderType

_Underlying type:_ _string_

ToolProviderType represents the tool provider type

_Validation:_
- Enum: [McpServer Agent]

_Appears in:_
- [Tool](#tool)

| Field | Description |
| --- | --- |
| `McpServer` |  |
| `Agent` |  |

#### TypedLocalReference

_Appears in:_
- [AgentHarnessSubstrateSpec](#agentharnesssubstratespec)
- [PromptSource](#promptsource)
- [SandboxSubstrateSpec](#sandboxsubstratespec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `kind` _string_ |  |  |  |
| `apiGroup` _string_ |  |  |  |
| `name` _string_ |  |  |  |

#### TypedReference

_Appears in:_
- [McpServerTool](#mcpservertool)
- [Tool](#tool)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `kind` _string_ |  |  |  |
| `apiGroup` _string_ |  |  |  |
| `name` _string_ |  |  |  |
| `namespace` _string_ |  |  |  |

#### ValueRef

ValueRef represents a configuration value

_Appears in:_
- [RemoteMCPServerSpec](#remotemcpserverspec)
- [Tool](#tool)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ |  |  |  |
| `value` _string_ |  |  |  |
| `valueFrom` _[ValueSource](#valuesource)_ |  |  |  |

#### ValueSource

ValueSource defines a source for configuration values from a Secret or ConfigMap

_Appears in:_
- [AgentHarnessChannelCredential](#agentharnesschannelcredential)
- [AgentHarnessHermesSlackOptions](#agentharnesshermesslackoptions)
- [AgentHarnessTelegramChannelSpec](#agentharnesstelegramchannelspec)
- [DeclarativeAgentSpec](#declarativeagentspec)
- [ValueRef](#valueref)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `type` _[ValueSourceType](#valuesourcetype)_ |  |  | Enum: [ConfigMap Secret] <br /> |
| `name` _string_ | The name of the ConfigMap or Secret. |  | MaxLength: 253 <br /> |
| `key` _string_ | The key of the ConfigMap or Secret. |  | MaxLength: 253 <br /> |

#### ValueSourceType

_Underlying type:_ _string_

_Appears in:_
- [ValueSource](#valuesource)

| Field | Description |
| --- | --- |
| `ConfigMap` |  |
| `Secret` |  |

