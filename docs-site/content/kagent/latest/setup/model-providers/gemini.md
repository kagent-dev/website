---
title: Gemini
description: Configure kagent to use Google Gemini models through the Google AI Studio API.
weight: 20
author: kagent.dev
---

The `Gemini` provider reaches Google's Gemini models through the Google AI Studio API or a custom endpoint that serves the same API. kagent 1.0 rejects the `GeminiVertexAI` provider, so a ModelConfig cannot reach Gemini models through Google Cloud Vertex AI. For the reason, see [Google Vertex AI]({{< link path="setup/model-providers/google-vertexai" >}}).

## Before you begin

Make sure that your Google Cloud account has a project with the Gemini API enabled.

## Create the ModelConfig

1. Save your [Google AI Studio](https://ai.google.dev/) API key as an environment variable.
   ```bash
   export GOOGLE_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create the Secret in the same namespace as the ModelConfig, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-gemini -n kagent --from-literal GOOGLE_API_KEY=$GOOGLE_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: gemini-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-gemini
     apiKeySecretKey: GOOGLE_API_KEY
     model: gemini-3.5-flash
     provider: Gemini
     gemini: {}
   EOF
   ```

   The following fields connect the ModelConfig to the `kagent-gemini` Secret and select the model.

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model to use. For the available models, see the [Gemini API docs](https://aistudio.google.com/docs/models). |
   | `provider` | The provider to use, `Gemini`. |
   | `gemini` | Settings that only the Gemini provider takes. An empty block is valid. |

## Gemini provider settings

The `gemini` block takes the following optional settings. For their types, defaults, and validation rules, see the [API reference]({{< link path="reference/api-ref#geminiconfig" >}}).

```yaml
spec:
  gemini:
    baseUrl: https://gateway.example.com/team/v1beta
    maxOutputTokens: <max-tokens>
```

| Field | Description |
| ----- | ----------- |
| `baseUrl` | The complete API prefix of a custom Gemini endpoint. For the format, see [Use a custom Gemini endpoint](#use-a-custom-gemini-endpoint). |
| `maxOutputTokens` | A cap on the tokens generated in one response. |

## Use a custom Gemini endpoint

To route Gemini calls through a gateway or proxy that serves the Gemini API, set `gemini.baseUrl` to the endpoint's complete API prefix, including any version segment such as `/v1beta`. kagent appends only `/models/<model>:generateContent` or its streaming equivalent to that prefix.

The endpoint and the credential are independent settings. Choose the credential that the endpoint accepts.

- kagent sends the API key from `apiKeySecret` in the `x-goog-api-key` header.
- The egress gateway sends the Actor token from `actorJwt` in the `Authorization: Bearer` header. For the `actorJwt` fields, see [Authenticate as the Actor]({{< link path="setup/model-providers/about-model-providers#authenticate-as-the-actor" >}}).
- If the endpoint does not require a credential, omit both fields.

The following example uses the API key from the `kagent-gemini` Secret.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: gemini-gateway-model-config
  namespace: kagent
spec:
  apiKeySecret: kagent-gemini
  apiKeySecretKey: GOOGLE_API_KEY
  model: gemini-3.5-flash
  provider: Gemini
  gemini:
    baseUrl: https://gateway.example.com/team/v1beta
EOF
```

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace. To use the ModelConfig from another namespace, see [Share a ModelConfig across namespaces]({{< link path="setup/model-providers/about-model-providers#share-a-modelconfig-across-namespaces" >}}).

```yaml
spec:
  modelConfig:
    name: gemini-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create a Harness, an AgentTemplate, and an Agent, and start a Session with the Agent." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
