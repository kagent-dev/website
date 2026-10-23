---
title: Mistral
description: Configure kagent to use Mistral models by creating a ModelConfig for the Mistral provider.
weight: 20
author: kagent.dev
---

The `Mistral` provider calls the Mistral API directly. Mistral speaks the OpenAI-compatible wire protocol, but kagent exposes it as its own `provider: Mistral` value rather than routing it through the `OpenAI` provider.

> [!NOTE]
> This provider works on the `kagent` and `byo` runtimes, but not on `codex` or `claude`. For more information, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

## Create the ModelConfig

1. Save your [Mistral API key](https://console.mistral.ai/api-keys) as an environment variable.
   ```bash
   export MISTRAL_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-mistral -n kagent --from-literal MISTRAL_API_KEY=$MISTRAL_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret. Every field in the `mistral` block is optional, and an empty block is valid.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: mistral-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-mistral
     apiKeySecretKey: MISTRAL_API_KEY
     model: mistral-large-latest
     provider: Mistral
     mistral: {}
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model to use. For the available models, see the [Mistral model docs](https://docs.mistral.ai/models). |
   | `provider` | The provider to use, `Mistral`. |
   | `mistral` | Settings that only the Mistral provider takes. An empty block is valid. |

A CEL rule rejects a `mistral` block on any other provider: `provider.mistral must be nil if the provider is not Mistral`.

## Mistral provider settings

The `mistral` block takes the following optional settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#mistralconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `baseUrl` | An alternative Mistral API endpoint. Defaults to `https://api.mistral.ai/v1`. |
| `temperature` | How much randomness the model applies when it picks the next token, written as a string. |
| `topP` | The nucleus sampling cutoff, written as a string. |
| `maxTokens` | A cap on the tokens generated in one response. Minimum 1. |
| `timeout` | How long to wait on a request to the provider, in seconds. Minimum 1. |

Mistral embeddings (`mistral-embed`) are out of scope for this page.

## How the credential reaches Mistral

The credential never enters the agent. kagent binds the `apiKeySecret` Secret to one destination and one header, `authorization: Bearer *** scoped to `baseUrl` or `https://api.mistral.ai`, and the Agent Substrate egress gateway injects it into each request. For the full credential model, see [About model providers]({{< link path="setup/model-providers/about-model-providers" >}}).

A `MISTRAL_API_KEY` environment variable on the runtime is a fallback for an image that reads its own key; it is not the ModelConfig path.

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: mistral-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/byo-openai" >}}` title="BYO OpenAI-compatible endpoint" subtitle="Point the OpenAI provider at a different service." >}}
{{< /cards >}}
