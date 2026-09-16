---
title: Google Vertex AI
description: Configure kagent to use Claude models through Google Cloud Vertex AI on a Claude harness.
weight: 20
author: kagent.dev
---

Google Cloud Vertex AI serves both Gemini and Claude models, and the {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} schema has a provider for each: `GeminiVertexAI` and `AnthropicVertexAI`. Which of them works depends on the runtime that your {{< gloss "Harness" >}}Harness{{< /gloss >}} selects.

| Provider | Harness runtime | Supported |
| -------- | --------------- | --------- |
| `AnthropicVertexAI` | `claude` | Yes |
| `AnthropicVertexAI` | `kagent` or `byo` | No |
| `GeminiVertexAI` | any | No |

For the full provider matrix across all four runtimes, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

The difference is how each runtime receives the Google credentials. Vertex AI authenticates with a service account key, which is a JSON document rather than a single string. The `claude` runtime takes that document as an environment variable. The `kagent` runtime instead writes it to a file and mounts it, and an agent running on {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} cannot mount files.

## Claude models on a Claude harness

1. Create a [Google service account key](https://cloud.google.com/iam/docs/keys-create-delete) with access to Vertex AI, and store the JSON in a Kubernetes Secret. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-vertex -n kagent \
     --from-file=credentials.json=<path-to-your-service-account-key>.json
   ```

2. Create a `ModelConfig` that uses the `AnthropicVertexAI` provider.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: vertex-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-vertex
     apiKeySecretKey: credentials.json
     model: claude-sonnet-4@20250514
     provider: AnthropicVertexAI
     anthropicVertexAI:
       projectID: my-gcp-project
       location: us-east5
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that holds the service account key. |
   | `apiKeySecretKey` | The key within that Secret that holds the JSON document. |
   | `model` | The Vertex AI model ID, such as `claude-sonnet-4@20250514`. |
   | `provider` | The provider to use, `AnthropicVertexAI`. |
   | `anthropicVertexAI.projectID` | Your Google Cloud project ID. This field is required, and must match the `project_id` inside the service account key. |
   | `anthropicVertexAI.location` | The Vertex AI region, such as `us-east5`. This field is required. |

   The `claude` runtime accepts no other settings in the `anthropicVertexAI` block yet, and rejects a ModelConfig that sets `defaultHeaders`, `tls`, or `apiKeyPassthrough`. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#anthropicvertexaiconfig" >}}).

3. Pair the ModelConfig with a Harness that selects the `claude` runtime.
   ```yaml
   spec:
     claude: {}
     workload:
       image: <claude-runtime-image>@sha256:<digest>
   ```

### What kagent checks before it compiles

kagent validates the service account key at compile time rather than failing at run time, so a malformed credential surfaces on the AgentTemplate's `Compatible` condition.

- The Secret key must hold valid JSON.
- The document must be a `service_account` key. Other credential types are not accepted yet.
- Its `project_id` must match `anthropicVertexAI.projectID`.
- Its `token_uri` must be `https://oauth2.googleapis.com`.

## Gemini models on Vertex AI

The `GeminiVertexAI` provider does not compile on any runtime. On a `kagent` Harness it fails with `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`, and the `claude` runtime does not accept the provider at all.

To reach Gemini models, use the [Gemini]({{< link path="setup/model-providers/gemini" >}}) provider, which serves the same model family through the Google AI Studio API and authenticates with an ordinary API key.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers/gemini" >}}` title="Gemini" subtitle="Reach Gemini models with an API key instead." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand which provider configurations a Harness can run." >}}
{{< /cards >}}
