---
title: About model providers
description: Understand how a ModelConfig connects kagent to a LLM provider, and which configurations a Harness can run.
weight: 10
author: kagent.dev
---

A `ModelConfig` is a Kubernetes custom resource that names one model at one provider, along with the credentials to reach it. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} references a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} by name in its `spec.modelConfig.name` field, and every agent compiled from that template calls the model that the ModelConfig names.

The kagent installation creates a `default-model-config` ModelConfig from the provider API key that you supply at install time, so a first agent needs no extra setup. To use a different provider, a different model, or a different set of credentials, create additional ModelConfigs.

## How a ModelConfig reaches an agent

Every ModelConfig shares the same three parts, regardless of the provider that it names.

| Field | Description |
| ----- | ----------- |
| `provider` | The provider to use. Accepted values are `OpenAI`, `Anthropic`, `AzureOpenAI`, `Ollama`, `Gemini`, `GeminiVertexAI`, `AnthropicVertexAI`, `Bedrock`, `SAPAICore`, and `Foundry`. Defaults to `OpenAI`. |
| `model` | The model name, as the provider spells it. |
| Provider block | A block named after the provider, such as `openAI` or `bedrock`, holding the settings that only that provider takes. An empty block is valid when the provider needs no extra settings. |

Credentials come from a Kubernetes Secret in the same namespace as the ModelConfig. The `apiKeySecret` field names the Secret, and `apiKeySecretKey` names the key within that Secret. To forward the bearer token from the incoming request to the provider instead, set `apiKeyPassthrough: true`. A ModelConfig cannot set both `apiKeyPassthrough` and `apiKeySecret`. For every ModelConfig field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#modelconfigspec" >}}).

## How a credential reaches the provider

A credential never enters the agent. kagent compiles the Secret that a ModelConfig names into a destination-scoped binding, and the {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} egress gateway fetches the Secret and writes the value into an outgoing HTTP header. Where an SDK requires an API key, the runtime receives the inert placeholder `kagent-credential-injected`. A compiled {{< gloss "Revision" >}}revision{{< /gloss >}} therefore records the Secret name, key, destination, and header, and never the credential itself.

To rotate a credential, update the Secret. The gateway refreshes its cache within five minutes, so neither a recompile nor a restart is needed.

Each provider carries its credential in the one header that the provider expects, and the destination is the endpoint that the ModelConfig resolves to.

| Credential | Header |
| ---------- | ------ |
| `OpenAI` API key | `authorization: Bearer <key>` |
| `Anthropic` API key | `x-api-key: <key>` |
| `AzureOpenAI` API key, and `Foundry` in OpenAI format | `api-key: <key>` |
| `Foundry` API key in Anthropic format | `x-api-key: <key>` |
| `Gemini` API key | `x-goog-api-key: <key>` |
| `Bedrock` bearer token | `authorization: Bearer <token>` |
| A Secret-backed `RemoteMCPServer` header | The header that the server names |

Substrate matches a destination on the exact DNS hostname, without path, port, or scheme. Two credentials that target the same hostname and header are rejected, including a conflict between an agent's model, a memory embedding model, and an MCP server. Give such origins distinct DNS names. A destination given as an IP address cannot carry an injected credential at all.

### Credentials that do not compile

Header injection accepts one shape of credential: a static string. A credential that requires a local signature, a token exchange, or a file mounted into the agent cannot be injected, so kagent rejects the configuration instead of passing the credential to the runtime. The AgentTemplate reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`, and kagent compiles no revision from that template. Any AgentInstance that already exists keeps running the last revision that compiled.

| Configuration | Why it cannot be injected | What to use instead |
| ------------- | ------------------------- | ------------------- |
| `Bedrock` with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` | IAM keys sign each request locally. | A Bedrock bearer token in `AWS_BEARER_TOKEN_BEDROCK`. See [Amazon Bedrock]({{< link path="setup/model-providers/amazon-bedrock" >}}). |
| `AnthropicVertexAI` and `GeminiVertexAI` | A Google service account key is signed locally to obtain a token, and the `kagent` and `byo` runtimes also mount it as a file. | `Anthropic` or `Bedrock` for Claude models, and `Gemini` for Gemini models. See [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}). |
| `SAPAICore` | OAuth2 client credentials are exchanged for a token before any request. | A provider that authenticates with an API key. See [SAP AI Core]({{< link path="setup/model-providers/sap-ai-core" >}}). |
| A `credentialRef` in a Harness `spec.env` entry | An arbitrary variable names no destination and no header to bind it to. | A ModelConfig or a RemoteMCPServer, each of which carries a destination. See [Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}). |
| `openAI.tokenExchange` | The block reads a mounted service account file to acquire a token. | An endpoint that accepts a static API key. See [OpenAI]({{< link path="setup/model-providers/openai" >}}). |
| `tls.caCertSecretRef`, on any provider | The CA bundle is mounted as a file. | An endpoint whose certificate chains to a public CA. Setting `tls.disableVerify: true` skips certificate verification entirely and belongs only in a test environment. |

A rejected credential reports one of two messages. A credential that cannot be injected reports `cannot use gateway header injection`, and one that needs a mounted file reports `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`.

The `Ollama` provider is unaffected, because it authenticates with no credential.

## The Harness runtime decides which providers are available

A ModelConfig is only half of the decision. The runtime that a {{< gloss "Harness" >}}Harness{{< /gloss >}} selects also constrains which providers an agent can use, because each runtime integrates a different set.

- The **`kagent`** runtime integrates every provider, and the **`byo`** runtime integrates the same set, because both compile through the same path.
- The **`codex`** runtime integrates only `OpenAI` and `Bedrock`.
- The **`claude`** runtime integrates only `Anthropic` and `Bedrock`.

Integration alone is not enough. A provider whose credential cannot be injected as a header is rejected on every runtime that integrates it, so `AnthropicVertexAI`, `GeminiVertexAI`, and `SAPAICore` run nowhere today. For the alternatives, see [Credentials that do not compile](#credentials-that-do-not-compile).

Neither `codex` nor `claude` accepts a ModelConfig that sets `defaultHeaders`, `tls`, or `apiKeyPassthrough`, and each narrows the provider settings it takes. A pair that asks for a provider its runtime does not integrate fails to compile, and the AgentTemplate reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`.

For the full matrix, including the per-combination restrictions, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

## Use a ModelConfig

Reference the ModelConfig by name in an AgentTemplate. The ModelConfig must be in the same namespace as the AgentTemplate.

```yaml
apiVersion: kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: my-agent
  namespace: kagent
spec:
  modelConfig:
    name: default-model-config
  systemPrompt: You are a concise, helpful assistant.
```

Editing a ModelConfig produces a new compiled {{< gloss "Revision" >}}revision{{< /gloss >}} for every AgentTemplate that references it. An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} keeps running the revision that it was created from, so create a new AgentInstance to pick up a changed model.
