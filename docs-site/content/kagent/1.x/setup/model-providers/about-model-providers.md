---
title: About model providers
description: Understand how a ModelConfig connects kagent to a LLM provider, and which configurations a Harness can run.
weight: 10
author: kagent.dev
---

A ModelConfig is a Kubernetes custom resource that names one model at one provider, along with the credentials to reach it. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} references a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} by name in its `spec.modelConfig.name` field, and every agent that runs from that template calls the model that the ModelConfig names.

The kagent installation creates a `default-model-config` ModelConfig from the provider API key that you supply at install time, so a first agent does not need extra setup. To use a different provider, a different model, or a different set of credentials, create additional ModelConfigs.

## Configure a ModelConfig {#how-a-modelconfig-reaches-an-agent}

Every ModelConfig shares the same three parts, regardless of the provider that it names.

| Field | Description |
| ----- | ----------- |
| `provider` | The provider to use.<ul><li>Accepted values are `OpenAI`, `Anthropic`, `AzureOpenAI`, `Ollama`, `Gemini`, `GeminiVertexAI`, `AnthropicVertexAI`, `Bedrock`, `SAPAICore`, `Foundry`, and `Mistral`.</li><li>Defaults to `OpenAI`.</li><li>`AnthropicVertexAI`, `GeminiVertexAI`, and `SAPAICore` are rejected on every harness.</li></ul>For more information, see [Credentials that kagent rejects](#credentials-that-kagent-rejects). |
| `model` | The model name, as the provider spells it. |
| `stream` | Whether the agent streams its model calls. Defaults to `true`. Set `false` for an endpoint that rejects streaming, which otherwise fails every turn. |
| Provider block | A block named after the provider, such as `openAI` or `bedrock`, holding the settings that only that provider takes. An empty block is valid when the provider does not take extra settings. |

Credentials come from a Kubernetes Secret in the same namespace as the ModelConfig. The `apiKeySecret` field names the Secret, and `apiKeySecretKey` names the key within that Secret. For every ModelConfig field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#modelconfigspec" >}}).

### Forward the caller's token

Set `tokenPassthrough: true` to send the bearer token from the incoming agent-to-agent (A2A) request to the provider as the API key, rather than reading a key from a Secret. A ModelConfig cannot set both `tokenPassthrough` and `apiKeySecret`. The setting is not available for the `Gemini`, `GeminiVertexAI`, or `AnthropicVertexAI` providers, or on a `codex` or `claude` Harness.

The egress gateway injects no credential for the provider's host, so the caller's token reaches the provider unchanged. kagent also refuses to attach a static credential to that host.

Every model and MCP server that an agent reaches at the provider's origin must also forward the caller's token. Otherwise, the Agent reports the `Compatible` condition as `False`, with a message such as `destination "https://api.openai.com:443" mixes tokenPassthrough with clients that do not use it`. The condition is also `False` when a model or MCP server at that origin sets its own value for the header that the token replaces.

### Turn off model streaming

The `kagent` harness streams its calls to the model by default, including OpenAI Chat Completions and Responses. An endpoint that rejects a streaming request fails every turn, so set `stream: false` on the ModelConfig to call it without streaming.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: non-streaming
  namespace: kagent
spec:
  provider: OpenAI
  model: example-model
  stream: false
  openAI:
    baseUrl: https://models.example.com/v1
```

The setting belongs to the root agent's ModelConfig, and the root runner applies it to its subagents as well. Turning streaming off does not stop a caller from streaming the conversation: A2A task events remain streamable either way. The `codex` and `claude` harnesses do not read this setting.

Changing `stream` produces a new {{< gloss "Revision" >}}revision{{< /gloss >}}, so create a new {{< gloss "Session" >}}Session{{< /gloss >}} to use the change.

## How a credential reaches the provider

A credential never enters the agent. kagent records the Secret that a ModelConfig names as a destination-scoped binding, and the {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} egress gateway fetches the Secret and writes the value into an outgoing HTTP header. Where an SDK requires an API key, the runtime receives the inert placeholder `kagent-credential-injected`. A {{< gloss "Revision" >}}revision{{< /gloss >}} therefore records the Secret name, key, destination, and header, and never the credential itself.

To rotate a credential, update the Secret. The revision records the Secret name and key rather than the value, so a rotation does not require a recompile. The gateway caches what it fetches, so allow a short delay before the new value is in use.

When a request is made to a provider, the gateway puts the credential in the header that the provider expects. The destination is the endpoint that the ModelConfig resolves to.

| Credential | Header |
| ---------- | ------ |
| `OpenAI` API key | `authorization: Bearer <key>` |
| `Anthropic` API key | `x-api-key: <key>` |
| `AzureOpenAI` API key, and `Foundry` in OpenAI format | `api-key: <key>` |
| `Foundry` API key in Anthropic format | `x-api-key: <key>` |
| `Gemini` API key | `x-goog-api-key: <key>` |
| `Bedrock` bearer token | `authorization: Bearer <token>` |
| `Ollama` API key, for an Ollama Cloud model | `authorization: Bearer *** |
| `Mistral` API key | `authorization: Bearer *** |
| A Secret-backed `RemoteMCPServer` header | The header that the server names |

Substrate matches a destination on the exact DNS hostname, without path, port, or scheme. Two credentials that target the same hostname and header are rejected, including a conflict between an agent's model, a memory embedding model, and an MCP server. Give such origins distinct DNS names. A destination given as an IP address cannot carry an injected credential at all.

### Credentials that kagent rejects {#credentials-that-kagent-rejects}

Header injection accepts one shape of credential, a static string. A credential that requires a local signature, a token exchange, or a file mounted into the agent cannot be injected, so kagent rejects the configuration instead of passing the credential to the runtime. The Agent reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`, and `Ready` as `False`. kagent does not build a new revision, and the Agent keeps its last successful revision, so a Session that is already running is unaffected.

| Configuration | Why it cannot be injected | What to use instead |
| ------------- | ------------------------- | ------------------- |
| `Bedrock` with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` | IAM keys sign each request locally. | A Bedrock bearer token in `AWS_BEARER_TOKEN_BEDROCK`. See [Amazon Bedrock]({{< link path="setup/model-providers/amazon-bedrock" >}}). |
| `AnthropicVertexAI` and `GeminiVertexAI` | A Google service account key is signed locally to obtain a token, and the `kagent` and `byo` harnesses also mount it as a file. | `Anthropic` or `Bedrock` for Claude models, and `Gemini` for Gemini models. See [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}). |
| `SAPAICore` | OAuth2 client credentials are exchanged for a token before any request. | A provider that authenticates with an API key. See [SAP AI Core]({{< link path="setup/model-providers/sap-ai-core" >}}). |
| A `credentialRef` in a Harness `spec.env` entry | An arbitrary variable does not name a destination or a header to bind it to. | A ModelConfig or a RemoteMCPServer, each of which carries a destination. See [Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}). |
| A custom certificate authority bundle | The bundle is mounted as a file, and `tls` defines no field for one. The API server rejects `caCertSecretRef` and `caCertSecretKey` as unknown fields. | An endpoint whose certificate chains to a public CA. Setting `tls.disableVerify: true` skips certificate verification entirely and belongs only in a test environment. |

A rejected credential reports one of two messages. A credential that cannot be injected reports `cannot use gateway header injection`, and one that needs a mounted file reports `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`.

The `Ollama` provider is unaffected when it points at a local daemon, which authenticates with no credential. An Ollama Cloud model reaches `api.ollama.com` with an API key, and that key is injected as a header like any other. For when a model routes to the cloud, see [Ollama]({{< link path="setup/model-providers/ollama" >}}).

## Provider support by harness

The harness that a {{< gloss "Harness" >}}Harness{{< /gloss >}} resource selects constrains which providers an agent can use, because each harness integrates a different set.

- The **`kagent`** harness integrates every provider, and the **`byo`** harness integrates the same set, because kagent builds a revision for both harnesses in the same way.
- The **`codex`** harness integrates only `OpenAI` and `Bedrock`.
- The **`claude`** harness integrates only `Anthropic` and `Bedrock`.

A provider is available only when the harness integrates it and the egress gateway can inject its credential as a header. The `kagent` and `byo` harnesses integrate `AnthropicVertexAI`, `GeminiVertexAI`, and `SAPAICore`, but the gateway cannot inject a Google service account key or a set of OAuth2 client credentials, so kagent rejects a ModelConfig that names any of the three on every harness. For the alternatives, see [Credentials that kagent rejects](#credentials-that-kagent-rejects).

Neither `codex` nor `claude` accepts a ModelConfig that sets `defaultHeaders`, `tls`, or `tokenPassthrough`, and each narrows the provider settings that it takes. When a ModelConfig names a provider that its harness does not integrate, the Agent reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`.

For the full matrix, including the per-combination restrictions, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

## Use a ModelConfig

Reference the ModelConfig by name in an AgentTemplate. The ModelConfig must be in the same namespace as the AgentTemplate.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: my-agent
  namespace: kagent
spec:
  modelConfig:
    name: default-model-config
  systemPrompt: You are a concise, helpful assistant.
```

Editing a ModelConfig produces a new {{< gloss "Revision" >}}revision{{< /gloss >}} for every {{< gloss "Agent" >}}Agent{{< /gloss >}} whose template references it. A {{< gloss "Session" >}}Session{{< /gloss >}} keeps running the revision that it was created from, so create a new Session to pick up a changed model.
