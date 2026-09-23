---
title: Google Vertex AI
description: Understand why Vertex AI models do not run on kagent 1.0, and which providers serve the same models instead.
weight: 20
author: kagent.dev
---

Neither Vertex AI provider runs on kagent 1.0. `AnthropicVertexAI` and `GeminiVertexAI` both authenticate with a Google service account key, and such a key is signed locally to obtain an access token. An agent reaches its model provider through the {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} egress gateway, which injects a static credential into an HTTP header and performs no signing, so kagent rejects a Vertex AI {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} rather than passing the key to the runtime.

The rejection happens at compile time. The AgentTemplate reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`, and kagent compiles no revision from it. On a `claude` {{< gloss "Harness" >}}Harness{{< /gloss >}} the message names the credential.

```
environment credential "KAGENT_CLAUDE_GOOGLE_CREDENTIALS_JSON" cannot use gateway header injection; local signing and arbitrary secret environment variables are unsupported
```

On the `kagent` and `byo` runtimes the same ModelConfig fails for a second reason as well, because those runtimes mount the key as a file: `ModelConfig requires volume mounts unsupported by Substrate ActorTemplate`.

## Reach the same models another way

Vertex AI serves two model families, and a provider that authenticates with an API key is available for each.

| To run | Use | Guide |
| ------ | --- | ----- |
| Claude models | `Anthropic`, or `Bedrock` on a `claude` Harness | [Anthropic]({{< link path="setup/model-providers/anthropic" >}}), [Amazon Bedrock]({{< link path="setup/model-providers/amazon-bedrock" >}}) |
| Gemini models | `Gemini`, which serves the same family through the Google AI Studio API | [Gemini]({{< link path="setup/model-providers/gemini" >}}) |

For every credential that the gateway cannot inject, and the alternative for each, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers/gemini" >}}` title="Gemini" subtitle="Reach Gemini models with an API key instead." >}}
  {{< card link=`{{< link path="setup/model-providers/anthropic" >}}` title="Anthropic" subtitle="Reach Claude models with an Anthropic API key." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand which credentials a Harness can run." >}}
{{< /cards >}}
