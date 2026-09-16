---
title: xAI
description: Configure kagent to use xAI Grok models through xAI's OpenAI-compatible API.
weight: 20
author: kagent.dev
---

xAI's Grok models are served through an OpenAI-compatible API, so a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} for xAI sets `provider: OpenAI` and points `openAI.baseUrl` at xAI. There is no separate xAI provider value.

## Create the ModelConfig

1. Save your [xAI API key](https://console.x.ai/) as an environment variable.
   ```bash
   export XAI_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-xai -n kagent --from-literal XAI_API_KEY=$XAI_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret and sets the xAI base URL.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: grok-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-xai
     apiKeySecretKey: XAI_API_KEY
     model: grok-3
     provider: OpenAI
     openAI:
       baseUrl: https://api.x.ai/v1
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The Grok model to use. For the available models, see the [xAI model docs](https://docs.x.ai/docs/models). |
   | `provider` | The provider to use, `OpenAI`. xAI is reached through the OpenAI provider. |
   | `openAI.baseUrl` | The xAI API endpoint, `https://api.x.ai/v1`. |

For the rest of the settings that the `openAI` block accepts, see [OpenAI]({{< link path="setup/model-providers/openai#openai-provider-settings" >}}). For every `openAI` field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#openaiconfig" >}}).

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: grok-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/byo-openai" >}}` title="BYO OpenAI-compatible endpoint" subtitle="Point the OpenAI provider at any other compatible service." >}}
{{< /cards >}}
