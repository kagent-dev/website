---
title: Anthropic
description: Configure kagent to use Anthropic Claude models by creating a ModelConfig for the Anthropic provider.
weight: 20
author: kagent.dev
---

The `Anthropic` provider calls the Anthropic API directly.

> [!NOTE]
> This provider works on the `kagent`, `byo`, and `claude` runtimes, but not on `codex`. A `claude` Harness accepts no `anthropic` settings beyond `baseUrl`. For more information, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}). To reach Claude models through Google Cloud instead, see [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}).

## Create the ModelConfig

1. Save your [Anthropic API key](https://console.anthropic.com/settings/keys) as an environment variable.
   ```bash
   export ANTHROPIC_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-anthropic -n kagent --from-literal ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: anthropic-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-anthropic
     apiKeySecretKey: ANTHROPIC_API_KEY
     model: claude-sonnet-4-20250514
     provider: Anthropic
     anthropic: {}
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model to use. For the available models, see the [Anthropic model docs](https://docs.anthropic.com/en/docs/about-claude/models). |
   | `provider` | The provider to use, `Anthropic`. |
   | `anthropic` | Settings that only the Anthropic provider takes. An empty block is valid. |

## Anthropic provider settings

The `anthropic` block takes the following optional settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#anthropicconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `baseUrl` | An alternative API endpoint, for a proxy or a compatible service. |
| `maxTokens` | A cap on the tokens generated in one response. |
| `temperature` | How much randomness the model applies when it picks the next token. |
| `topP` | The nucleus sampling cutoff. |
| `topK` | How many candidate tokens to sample from. |

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: anthropic-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
