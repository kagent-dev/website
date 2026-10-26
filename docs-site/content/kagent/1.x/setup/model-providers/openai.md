---
title: OpenAI
description: Configure kagent to use OpenAI models by creating a ModelConfig for the OpenAI provider.
weight: 10
author: kagent.dev
---

The `OpenAI` provider calls the OpenAI API directly.

> [!NOTE]
> This provider works on the `kagent`, `byo`, and `codex` runtimes, but not on `claude`. A `codex` Harness additionally requires `openAI.apiFormat: responses` and does not accept any other `openAI` setting beyond `baseUrl`. For more information, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}). It also backs every OpenAI-compatible endpoint, so several other providers in this section set `provider: OpenAI` and point `openAI.baseUrl` somewhere else.

## Create the ModelConfig

1. Save your [OpenAI API key](https://platform.openai.com/api-keys) as an environment variable.
   ```bash
   export OPENAI_API_KEY=<your_api_key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-openai -n kagent --from-literal OPENAI_API_KEY=$OPENAI_API_KEY
   ```

3. Create a `ModelConfig` that references the Secret.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: openai-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-openai
     apiKeySecretKey: OPENAI_API_KEY
     model: gpt-4o-mini
     provider: OpenAI
     openAI: {}
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model to use. For the available models, see the [OpenAI model docs](https://developers.openai.com/api/docs/models). |
   | `provider` | The provider to use, `OpenAI`. |
   | `openAI` | Settings that only the OpenAI provider takes. An empty block is valid, and is the common case for OpenAI itself. |

## OpenAI provider settings

The `openAI` block takes the following optional settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#openaiconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `baseUrl` | An alternative API endpoint. Set this to point the OpenAI provider at an OpenAI-compatible service rather than at OpenAI. |
| `organization` | The OpenAI organization to bill requests to. |
| `apiFormat` | Which OpenAI HTTP API to call, either `chatCompletions` or `responses`. Defaults to `chatCompletions`. Use `responses` for gateways and models that require the Responses API. |
| `maxTokens` | A cap on the tokens generated in one response, sent as the deprecated `max_tokens` parameter. Reasoning models reject it. Mutually exclusive with `maxCompletionTokens`. |
| `maxCompletionTokens` | A cap on visible output plus reasoning tokens, sent as `max_completion_tokens`. Reasoning models require this field in place of `maxTokens`. Mutually exclusive with `maxTokens`. |
| `reasoningEffort` | How many reasoning tokens the model generates before it answers. Accepted values are `none`, `minimal`, `low`, `medium`, `high`, and `xhigh`. Support varies by model, and some models require `none` to use tools through the Chat Completions API. |
| `temperature` | How much randomness the model applies when it picks the next token. |
| `topP` | The nucleus sampling cutoff. |
| `frequencyPenalty` | How strongly to discourage repeating tokens that already appeared. |
| `presencePenalty` | How strongly to discourage reusing topics that already appeared. |
| `seed` | A fixed seed, for more repeatable output. |
| `n` | How many completions to request. |
| `timeout` | How long to wait on a request to the provider. |

> [!WARNING]
> The `openAI` block also accepts `tokenExchange`, which acquires a bearer token from a mounted service account file. That configuration mounts a credential file into the agent, which a Harness does not accept. For the full list of configurations that this affects, see [About model providers]({{< link path="setup/model-providers/about-model-providers" >}}).

## Send a file to the model {#send-a-file-to-the-model}

When `apiFormat` is `responses`, supported files go through the Responses API instead of first being extracted as text. The provider fetches a link only in the turn that sends it. In later turns, the runtime replaces the link with the bare URL as text.

| What the message includes | What the runtime sends |
| ------------------------- | ---------------------- |
| An `http://` or `https://` link with an `image/` media type | An `input_image` part with the link. |
| An `http://` or `https://` link with any other media type, such as a PDF | An `input_file` part with the link. |
| Inline image bytes | An `input_image` part with the bytes as a `data:` URL. |
| Inline bytes of a PDF, `.docx`, `.xlsx`, or `.pptx` file | An `input_file` part with the bytes as a `data:` URL. The bytes must match the media type. A file that does not, such as a text file labeled `application/pdf`, reaches the model as a note that it could not be read. When the files in the conversation total more than 50 MB, the runtime sends the newest files and replaces each older file with a note. |
| Inline bytes of any other type | The file's text, or a note when the file cannot be read as text. |

The runtime refuses a link that uses any other scheme. When the newest user message includes an unsupported link, the turn fails with `cannot send link "<uri>" with media type "<type>": this provider integration can only pass http and https links`. A link in an older message does not fail the turn, because the runtime sends links from older messages as bare URLs. A model with a fetch tool can still retrieve the file.

For an attachment with a display name, the runtime adds an extra text part that reads `File: <name>` immediately before the file part. For file links, the name reaches the model as ordinary text.

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: openai-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/byo-openai" >}}` title="BYO OpenAI-compatible endpoint" subtitle="Point the OpenAI provider at a different service." >}}
{{< /cards >}}
