---
title: Gemini
description: Configure kagent to use Google Gemini models through the Google AI Studio API.
weight: 20
author: kagent.dev
---

The `Gemini` provider reaches Google's Gemini models through the Google AI Studio API, authenticating with a single API key. To reach Gemini through Google Cloud instead, see [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}).

## Before you begin

Make sure that your Google Cloud account has a project with the Gemini API enabled.

## Create the ModelConfig

1. Get an API key from [Google AI Studio](https://ai.google.dev/), and save it as an environment variable.
   ```bash
   export GOOGLE_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-gemini -n kagent --from-literal GOOGLE_API_KEY=$GOOGLE_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: gemini-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-gemini
     apiKeySecretKey: GOOGLE_API_KEY
     model: gemini-2.5-flash
     provider: Gemini
     gemini: {}
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model to use. For the available models, see the [Gemini API docs](https://ai.google.dev/gemini-api/docs/models). |
   | `provider` | The provider to use, `Gemini`. |
   | `gemini` | Settings that only the Gemini provider takes. An empty block is valid. |

## Gemini provider settings

The `gemini` block takes one optional setting. For its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#geminiconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `maxOutputTokens` | A cap on the tokens generated in one response. |

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: gemini-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
