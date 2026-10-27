---
title: BYO OpenAI-compatible endpoint
description: Configure kagent to use any provider that serves the OpenAI API, including a self-hosted gateway in front of your own models.
weight: 40
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/setup/byo-openai-intro.md" >}}

## Create the ModelConfig

The following example uses [Cohere](https://cohere.com/), which serves an OpenAI-compatible endpoint.

1. Save the API key from your provider as an environment variable.
   ```bash
   export PROVIDER_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create the Secret in the same namespace as the ModelConfig, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-my-provider -n kagent --from-literal PROVIDER_API_KEY=$PROVIDER_API_KEY
   ```

3. Create a `ModelConfig` that points at your provider's endpoint.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: my-provider-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-my-provider
     apiKeySecretKey: PROVIDER_API_KEY
     model: command-a-03-2025
     provider: OpenAI
     openAI:
       baseUrl: https://api.cohere.ai/compatibility/v1
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that stores the API key. |
   | `model` | The model identifier that your provider routes on. Consult your provider's documentation. |
   | `provider` | The provider to use, `OpenAI`. |
   | `openAI.baseUrl` | Your provider's OpenAI-compatible endpoint. Providers often serve this at a dedicated path, such as `/compatibility/v1`. |

For the rest of the settings that the `openAI` block accepts, see [OpenAI]({{< link path="setup/model-providers/openai#openai-provider-settings" >}}). Not every compatible provider honors every setting, so check your provider's documentation before setting one. For every `openAI` field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#openaiconfig" >}}).

## Self-hosted vLLM behind a gateway

{{< reuse "kagent-docs/snippets/setup/byo-openai-gateway.md" >}}

### Enable tool calling in vLLM

kagent sends a `tools` array with `tool_choice: "auto"` on every request. By default, kagent's runtime registers a built-in `ask_user` tool on every agent, so kagent sends that array even when you do not bind any tools yourself. To prevent every agent turn from failing, launch vLLM with automatic tool choice enabled.

```bash
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --enable-auto-tool-choice \
  --tool-call-parser hermes
```

The correct `--tool-call-parser` depends on your model family. Qwen2.5 uses `hermes`. Llama 3.1 uses `llama3_json`. Parser names change across vLLM releases, so check the [vLLM tool calling docs](https://docs.vllm.ai/en/latest/features/tool_calling.html) for the current name for your model.

### Use the gateway's model identifier

Set `model` to the identifier that your gateway routes on, which is often provider-prefixed and can differ from the bare model name that vLLM serves internally. Point `openAI.baseUrl` at the gateway. LiteLLM defaults to port `4000`. Bifrost defaults to port `8080`.

```yaml
spec:
  apiKeySecret: kagent-my-provider
  apiKeySecretKey: PROVIDER_API_KEY
  model: vllm/Qwen/Qwen2.5-7B-Instruct
  provider: OpenAI
  openAI:
    baseUrl: http://litellm.kagent.svc.cluster.local:4000/v1
```

### Troubleshooting a 400 from the provider

When every agent message fails with a generic `provider API error (status 400)`, the most common cause is a vLLM server started without `--enable-auto-tool-choice` and a matching `--tool-call-parser`. Restart vLLM with both flags and try again.

## TLS

A provider on your own network might present a certificate that the agent does not already trust. The `tls` block defines one field, `disableVerify`, which turns off certificate verification entirely when you set it to `true`. The field defaults to `false`.

> [!WARNING]
> **The `tls` block does not accept a certificate authority (CA) bundle.** An agent running on {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} cannot mount files, so the API server rejects `caCertSecretRef`, `caCertSecretKey`, and `disableSystemCAs` as unknown fields. Use a certificate that chains to a public authority, or terminate Transport Layer Security (TLS) at a gateway that the agent can trust.

The following ModelConfig turns off verification for a provider on an internal network.

```yaml
spec:
  apiKeySecret: kagent-my-provider
  apiKeySecretKey: PROVIDER_API_KEY
  model: command-a-03-2025
  provider: OpenAI
  openAI:
    baseUrl: https://llm.internal.example.com/v1
  tls:
    disableVerify: true
```

> [!WARNING]
> Disabling verification removes the guarantee that the agent connects to the intended server. Disable verification only for local testing, never in production.

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: my-provider-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/byo-agentgateway" >}}` title="agentgateway" subtitle="Route model traffic through an agentgateway deployment." >}}
{{< /cards >}}
