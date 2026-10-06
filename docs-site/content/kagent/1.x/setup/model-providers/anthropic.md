---
title: Anthropic
description: Configure kagent to use Anthropic Claude models by creating a ModelConfig for the Anthropic provider.
weight: 20
author: kagent.dev
---

The `Anthropic` provider calls the Anthropic API directly.

> [!NOTE]
> This provider works on the `kagent`, `byo`, and `claude` runtimes, but not on `codex`. A `claude` Harness accepts no `anthropic` settings beyond `baseUrl`. For more information, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}). Claude models served through Google Cloud Vertex AI do not run on kagent 1.0. For the reason and the alternatives, see [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}).

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
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: anthropic-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-anthropic
     apiKeySecretKey: ANTHROPIC_API_KEY
     model: claude-sonnet-5
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
| `promptCaching` | Whether to bill the reusable prefix of each request as a cache read instead of fresh input. Defaults to `false`. For more information, see [Prompt caching](#prompt-caching). |
| `cacheTTL` | How long Anthropic retains a cached prefix. Applies only when `promptCaching` is `true`. Supported values are `5m` (default) or `1h`. |

## Prompt caching

An agent that calls a model many times for one task resends the same prefix every time: the tool definitions, the system prompt, and the turns already taken. When `promptCaching` is `true`, kagent marks that prefix with `cache_control` breakpoints, and Anthropic bills a later request that reuses it at a fraction of the normal input price. Because the conversation breakpoint moves with every turn, each call in an agent loop reads the whole previous history from the cache and writes only the new turn.

Enable the field wherever a tool-using agent makes many model calls per task against a stable system prompt and tool set. Without it, the full history is billed as fresh input on every call.

```yaml
spec:
  anthropic:
    promptCaching: true
    cacheTTL: "5m"
```

Two properties of Anthropic's pricing decide whether caching reduces cost. Neither one produces an error or a warning when caching ends up costing more.

- **A cache write costs more than ordinary input.** A prefix must be read at least once before the saving on reads exceeds the premium charged on the write, so caching a prompt that is used once costs more than not caching it.
- **Each model sets a minimum cacheable prefix**, between 1024 and 4096 tokens depending on the model. Under that minimum Anthropic ignores the breakpoints silently, so the request succeeds, the response is normal, and nothing is cached.

> [!IMPORTANT]
> `1h` is not an improvement on `5m`. Anthropic bills 1-hour cache writes at a higher per-token rate than 5-minute writes, and every cache hit refreshes the window, so an agent loop whose calls are less than 5 minutes apart keeps its prefix cached for the whole task on `5m`. Choose `1h` only when a task's model calls are spaced far enough apart that a 5-minute cache would expire between them. Otherwise, the higher write rate adds cost without reducing it anywhere else.

For the models that support caching, the current minimum prefix sizes, and the pricing, see the [Anthropic prompt caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

> [!WARNING]
> **The `claude` harness rejects `promptCaching: true`.** That harness accepts no `anthropic` settings beyond `baseUrl`, so a ModelConfig that enables caching fails to compile for it, and the AgentTemplate reports `Claude does not support Anthropic provider options beyond baseUrl yet` rather than becoming ready. Claude Code caches its own prefix on a 5-minute window regardless, so the setting gains nothing there. Where a `claude` agent and a `kagent` agent must share one installation, give the `claude` agent a ModelConfig that leaves `promptCaching` unset rather than enabling the field chart-wide. For the settings that each harness takes, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

### Prompt caching at install time

Setting `providers.anthropic.config` in the Helm chart writes these fields into the ModelConfig that the chart generates, which saves editing that resource after every install.

```yaml
providers:
  anthropic:
    config:
      promptCaching: true
      cacheTTL: "5m"
```

The setting reaches only the generated ModelConfig. A ModelConfig that you create yourself, including the one in [Create the ModelConfig](#create-the-modelconfig), takes the fields in its own `spec.anthropic` block.

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
