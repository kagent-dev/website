---
title: BYO OpenAI-compatible endpoint
description: Configure kagent to use any provider that serves the OpenAI API, including a self-hosted gateway in front of your own models.
weight: 40
author: kagent.dev
---

Many providers serve the [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) rather than an API of their own. To use one, set `provider: OpenAI` and point `openAI.baseUrl` at the provider's endpoint. This is the same mechanism behind the [xAI]({{< link path="setup/model-providers/xai" >}}) and [Amazon Bedrock]({{< link path="setup/model-providers/amazon-bedrock" >}}) OpenAI-compatible paths.

## Create the ModelConfig

The following example uses [Cohere](https://cohere.com/), which serves an OpenAI-compatible endpoint.

1. Save the API key from your provider as an environment variable.
   ```bash
   export PROVIDER_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-my-provider -n kagent --from-literal PROVIDER_API_KEY=$PROVIDER_API_KEY
   ```

3. Create a `ModelConfig` that points at your provider's endpoint.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
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
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model identifier that your provider routes on. Consult your provider's documentation. |
   | `provider` | The provider to use, `OpenAI`. |
   | `openAI.baseUrl` | Your provider's OpenAI-compatible endpoint. Providers often serve this at a dedicated path, such as `/compatibility/v1`. |

For the rest of the settings that the `openAI` block accepts, see [OpenAI]({{< link path="setup/model-providers/openai#openai-provider-settings" >}}). Not every compatible provider honors every setting, so check your provider's documentation before setting one. For every `openAI` field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#openaiconfig" >}}).

## Self-hosted vLLM behind a gateway

A common self-hosted pattern puts an OpenAI-compatible gateway such as [Bifrost](https://github.com/maximhq/bifrost) or [LiteLLM](https://docs.litellm.ai/) in front of a [vLLM](https://docs.vllm.ai/) server, so that requests travel from kagent to the gateway to vLLM. Configure the gateway as an OpenAI-compatible provider in the same way, with two extra things to get right.

### Enable tool calling in vLLM

kagent sends a `tools` array with `tool_choice: "auto"` on every request. kagent's runtime registers a built-in `ask_user` tool on every agent, so that array is sent even when you bind no tools yourself. Launch vLLM with automatic tool choice enabled, or every agent turn fails.

```bash
vllm serve Qwen/Qwen2.5-7B-Instruct \
  --enable-auto-tool-choice \
  --tool-call-parser hermes
```

The correct `--tool-call-parser` depends on your model family. Qwen2.5 uses `hermes` and Llama 3.1 uses `llama3_json`. Parser names change across vLLM releases, so check the [vLLM tool calling docs](https://docs.vllm.ai/en/latest/features/tool_calling.html) for the current name for your model.

### Use the gateway's model identifier

Set `model` to the identifier that your gateway routes on, which is often provider-prefixed and can differ from the bare model name that vLLM serves internally. Point `openAI.baseUrl` at the gateway. LiteLLM defaults to port `4000`, and Bifrost to `8080`.

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

When every agent message fails with a generic `provider API error (status 400)`, the most common cause is a vLLM server started without `--enable-auto-tool-choice` and a matching `--tool-call-parser`. Because kagent always sends `tool_choice: "auto"`, vLLM rejects the request until automatic tool choice is enabled. Restart vLLM with both flags and try again.

## TLS

A provider on your own network may present a certificate that the agent does not already trust. The `tls` block adjusts how the agent verifies it.

| Field | Description |
| ----- | ----------- |
| `disableVerify` | Turns off certificate verification entirely. Defaults to `false`. |
| `disableSystemCAs` | Trusts only the named CA bundle rather than the system trust store. Defaults to `false`. |
| `caCertSecretRef` | The name of a Secret holding a PEM certificate authority bundle. |
| `caCertSecretKey` | The key within that Secret that holds the bundle. |

> [!WARNING]
> **Pinning a certificate authority is not currently supported.** Setting `tls.caCertSecretRef` and `tls.caCertSecretKey` makes kagent mount the bundle as a file, and an agent running on {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} cannot mount files. The AgentTemplate reports the `Compatible` condition as `False` with the message `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`. Use a certificate that chains to a public authority, or terminate TLS at a gateway that the agent can trust.

Turning verification off does not mount anything, so it does compile.

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
> Disabling verification removes the guarantee that the agent is talking to the server that it thinks it is. Use it for local testing, never in production.

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
