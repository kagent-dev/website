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

**Credential files**

kagent passes model credentials to an agent as environment variables. A ModelConfig that instead requires a credential **file** mounted into the agent does not compile. The AgentTemplate reports the `Compatible` condition as `False`, with the reason `UnsupportedConfiguration` and the message `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`. kagent compiles no revision from that AgentTemplate, so no agent runs from it, and any AgentInstance that already exists keeps running the last revision that compiled. Three configurations encounter this today.
- **The Vertex AI providers, on the `kagent` and `byo` runtimes.** `GeminiVertexAI` and `AnthropicVertexAI` mount the Google credentials file that `apiKeySecret` names. Leaving `apiKeySecret` unset compiles, but a Substrate Actor does not inherit cloud workload identity, so the agent still has no credentials to send. The `claude` runtime is the exception: it passes the same credentials as an environment variable, so `AnthropicVertexAI` works there. For more information, see [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}).
- **A private certificate authority (CA), on any provider.** Setting `tls.caCertSecretRef` mounts the CA bundle as a file. Every provider accepts the `tls` block, so this affects all of them, not only the Vertex AI providers. You cannot reach a provider endpoint that presents a certificate from a private CA, unless you set `tls.disableVerify: true`, which skips certificate verification entirely and belongs only in a test environment.
- **OpenAI token exchange.** The `openAI.tokenExchange` block acquires a bearer token by reading a mounted service account file, so a ModelConfig that sets it never compiles. An OpenAI-compatible endpoint must accept a static API key instead. For more information, see [OpenAI]({{< link path="setup/model-providers/openai" >}}).

## The Harness runtime decides which providers are available

A ModelConfig is only half of the decision. The runtime that a {{< gloss "Harness" >}}Harness{{< /gloss >}} selects also constrains which providers an agent can use, because each runtime integrates a different set.

- The **`kagent`** runtime supports every provider, and the **`byo`** runtime supports the same set, because both compile through the same path.
- The **`codex`** runtime supports only `OpenAI` and `Bedrock`.
- The **`claude`** runtime supports only `Anthropic`, `Bedrock`, and `AnthropicVertexAI`.

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
