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
- [ModelConfig](#modelconfig)
- [ModelProviderConfig](#modelproviderconfig)
- [RemoteMCPServer](#remotemcpserver)

#### AllowedNamespaces

AllowedNamespaces defines which namespaces are allowed to reference this resource.
This mechanism provides a bidirectional handshake for cross-namespace references,
following the pattern used by Gateway API for cross-namespace route attachments.

By default (when not specified), only references from the same namespace are allowed.

_Appears in:_
- [RemoteMCPServerSpec](#remotemcpserverspec)

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
| `guardrail` _[BedrockGuardrailConfig](#bedrockguardrailconfig)_ |  |  |  |
| `readTimeout` _integer_ | ReadTimeout is the Bedrock HTTP client read timeout in seconds, applied by<br />both the Python and Go ADK runtimes. Raise this for agents that make long<br />Converse calls (large tool-augmented turns, extended reasoning). On the<br />Python ADK it overrides botocore's ~60s read timeout, which otherwise<br />aborts long completions with a ReadTimeoutError; on the Go ADK it bounds<br />the whole Converse request (default 30m). When unset, each runtime's<br />default is used. |  | Minimum: 1 <br /> |
| `connectTimeout` _integer_ | ConnectTimeout is the Bedrock HTTP client connection-establishment timeout<br />in seconds, applied by both the Python and Go ADK runtimes. It bounds<br />connection setup only, not the response read. When unset, each runtime's<br />default is used (Python ADK: botocore; Go ADK: net dialer). |  | Minimum: 1 <br /> |

#### BedrockGuardrailConfig

_Appears in:_
- [BedrockConfig](#bedrockconfig)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `identifier` _string_ | Identifier is the guardrail ID or full ARN. AWS accepts either a bare<br />guardrail ID or an arn:aws:bedrock:...:guardrail/... ARN, so the value is<br />only length-bounded here (AWS caps guardrailIdentifier at 2048 chars). |  | MaxLength: 2048 <br />MinLength: 1 <br /> |
| `version` _string_ | Version is the guardrail version: a numeric version (e.g. "1") or "DRAFT". |  | MaxLength: 8 <br />MinLength: 1 <br /> |
| `trace` _string_ |  | disabled | Enum: [disabled enabled enabled_full] <br /> |

#### FoundryAPIFormat

_Underlying type:_ _string_

FoundryAPIFormat selects the Foundry API format for a Foundry ModelConfig.

_Appears in:_
- [FoundryConfig](#foundryconfig)

| Field | Description |
| --- | --- |
| `OpenAI` |  |
| `Anthropic` |  |

#### FoundryConfig

FoundryConfig contains Azure AI Foundry-specific configuration options.

Authentication is implicit and mirrors the other cloud providers: if
spec.apiKeySecret is set the API key is used; if it is absent, the Foundry
runtime falls back to DefaultAzureCredential (which resolves to Azure
Workload Identity in-cluster, or the az CLI in local development). There is
no auth-type selector.

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `endpoint` _string_ | Endpoint is the Foundry or Azure AI Services account endpoint<br />(e.g., https://my-account.cognitiveservices.azure.com/).<br />Mutually exclusive with EndpointFrom. |  |  |
| `endpointFrom` _[ConfigMapKeySelector](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.31/#configmapkeyselector-v1-core)_ | EndpointFrom resolves the Foundry endpoint from a ConfigMap key, such as<br />one written by Azure Service Operator. Mutually exclusive with Endpoint.<br /><br />The selector's optional flag only controls how a missing key is handled: when<br />set to true, the missing key is ignored while reading the ConfigMap, but a<br />Foundry endpoint must always be supplied, so an unresolved endpointFrom still<br />leaves the model unusable and the agent fails to start. |  |  |
| `deployment` _string_ | Deployment is the Foundry model deployment name. |  |  |
| `apiVersion` _string_ | APIVersion is the Foundry OpenAI-compatible data-plane API version.<br />Ignored when APIFormat is Anthropic (the Messages surface is versioned via<br />the anthropic-version header instead). | 2024-10-21 |  |
| `apiFormat` _[FoundryAPIFormat](#foundryapiformat)_ | APIFormat selects the Foundry API format: "OpenAI" (default, chat<br />completions) or "Anthropic" (Claude models served over the Anthropic<br />Messages API). | OpenAI | Enum: [OpenAI Anthropic] <br /> |

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

GeminiConfig contains Gemini (AI Studio, API-key) specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `maxOutputTokens` _integer_ | Maximum output tokens to generate for a single response |  | Minimum: 1 <br /> |

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
| `maxOutputTokens` _integer_ | Maximum output tokens |  | Minimum: 1 <br /> |
| `candidateCount` _integer_ | Candidate count |  |  |
| `responseMimeType` _string_ | Response mime type |  |  |

#### MCPTool

_Appears in:_
- [RemoteMCPServerStatus](#remotemcpserverstatus)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ |  |  |  |
| `description` _string_ |  |  |  |

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
| `provider` _[ModelProvider](#modelprovider)_ | The provider of the model | OpenAI | Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore Foundry] <br /> |
| `openAI` _[OpenAIConfig](#openaiconfig)_ | OpenAI-specific configuration |  |  |
| `anthropic` _[AnthropicConfig](#anthropicconfig)_ | Anthropic-specific configuration |  |  |
| `azureOpenAI` _[AzureOpenAIConfig](#azureopenaiconfig)_ | Azure OpenAI-specific configuration |  |  |
| `ollama` _[OllamaConfig](#ollamaconfig)_ | Ollama-specific configuration |  |  |
| `gemini` _[GeminiConfig](#geminiconfig)_ | Gemini-specific configuration |  |  |
| `geminiVertexAI` _[GeminiVertexAIConfig](#geminivertexaiconfig)_ | Gemini Vertex AI-specific configuration |  |  |
| `anthropicVertexAI` _[AnthropicVertexAIConfig](#anthropicvertexaiconfig)_ | Anthropic-specific configuration |  |  |
| `bedrock` _[BedrockConfig](#bedrockconfig)_ | AWS Bedrock-specific configuration |  |  |
| `sapAICore` _[SAPAICoreConfig](#sapaicoreconfig)_ | SAP AI Core-specific configuration |  |  |
| `foundry` _[FoundryConfig](#foundryconfig)_ | Azure AI Foundry-specific configuration |  |  |
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
- Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore Foundry]

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
| `Foundry` |  |

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
| `type` _[ModelProvider](#modelprovider)_ | Type is the model provider type (OpenAI, Anthropic, etc.) |  | Enum: [Anthropic OpenAI AzureOpenAI Ollama Gemini GeminiVertexAI AnthropicVertexAI Bedrock SAPAICore Foundry] <br /> |
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

#### OllamaConfig

OllamaConfig contains Ollama-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `host` _string_ | Host for the Ollama API |  |  |
| `options` _object (keys:string, values:string)_ | Options for the Ollama API |  |  |

#### OpenAIAPIFormat

_Underlying type:_ _string_

OpenAIAPIFormat selects the OpenAI HTTP API shape used by the Go ADK runtime.

_Validation:_
- Enum: [chatCompletions responses]

_Appears in:_
- [OpenAIConfig](#openaiconfig)

| Field | Description |
| --- | --- |
| `chatCompletions` |  |
| `responses` |  |

#### OpenAIConfig

OpenAIConfig contains OpenAI-specific configuration options

_Appears in:_
- [ModelConfigSpec](#modelconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `baseUrl` _string_ | Base URL for the OpenAI API (overrides default) |  |  |
| `organization` _string_ | Organization ID for the OpenAI API |  |  |
| `temperature` _string_ | Temperature for sampling |  |  |
| `maxTokens` _integer_ | Maximum tokens to generate. Sent as the OpenAI `max_tokens` request<br />parameter, which is deprecated and rejected by reasoning models<br />(GPT-5 / o-series). For those models set maxCompletionTokens instead.<br />Mutually exclusive with maxCompletionTokens. |  | Minimum: 1 <br /> |
| `maxCompletionTokens` _integer_ | Maximum completion tokens to generate. Sent as the OpenAI<br />`max_completion_tokens` request parameter (an upper bound on visible<br />output plus reasoning tokens). This is the parameter reasoning models<br />(GPT-5 / o-series) require in place of the deprecated maxTokens.<br />Mutually exclusive with maxTokens. |  | Minimum: 1 <br /> |
| `topP` _string_ | Top-p sampling parameter |  |  |
| `frequencyPenalty` _string_ | Frequency penalty |  |  |
| `presencePenalty` _string_ | Presence penalty |  |  |
| `seed` _integer_ | Seed value |  |  |
| `n` _integer_ | N value |  |  |
| `timeout` _integer_ | Timeout |  |  |
| `reasoningEffort` _[OpenAIReasoningEffort](#openaireasoningeffort)_ | Reasoning effort |  | Enum: [none minimal low medium high xhigh max] <br /> |
| `apiFormat` _[OpenAIAPIFormat](#openaiapiformat)_ | APIFormat selects which OpenAI HTTP API the runtime uses for this model.<br />chatCompletions (default) posts to /v1/chat/completions.<br />responses posts to /v1/responses. Use responses for OpenAI-compatible<br />gateways or models that require the Responses API. | chatCompletions | Enum: [chatCompletions responses] <br /> |
| `tokenExchange` _[TokenExchangeConfig](#tokenexchangeconfig)_ | TokenExchange configures dynamic bearer token acquisition via credential exchange.<br />Requires apiKeySecret (used as the service account secret) and is mutually exclusive with apiKeyPassthrough. |  |  |

#### OpenAIReasoningEffort

_Underlying type:_ _string_

OpenAIReasoningEffort represents how many reasoning tokens the model generates before producing a response.
Supported values vary by model. Set to "none" to disable reasoning; some models (e.g. gpt-5.6-terra)
require this to use function tools via the Chat Completions API.

_Validation:_
- Enum: [none minimal low medium high xhigh max]

_Appears in:_
- [OpenAIConfig](#openaiconfig)

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

#### SecretReference

SecretReference references a Kubernetes Secret that must contain exactly one data key
holding the API key or credential.

_Appears in:_
- [ModelProviderConfigSpec](#modelproviderconfigspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ | Name is the name of the secret in the same namespace as the ModelProviderConfig. |  |  |

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

#### ValueRef

ValueRef represents a configuration value

_Appears in:_
- [RemoteMCPServerSpec](#remotemcpserverspec)

| Field | Description | Default | Validation |
| --- | --- | --- | --- |
| `name` _string_ |  |  |  |
| `value` _string_ |  |  |  |
| `valueFrom` _[ValueSource](#valuesource)_ |  |  |  |

#### ValueSource

ValueSource defines a source for configuration values from a Secret or ConfigMap

_Appears in:_
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
