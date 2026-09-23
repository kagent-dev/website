---
title: SAP AI Core
description: Understand why SAP AI Core models do not run on kagent 1.0, and what to use instead.
weight: 20
author: kagent.dev
---

The `SAPAICore` provider does not run on kagent 1.0. SAP AI Core authenticates with OAuth2 client credentials, which a client exchanges at a token endpoint for a short-lived access token before it calls the API. An agent reaches its model provider through the {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} egress gateway, which injects a static credential into an HTTP header and performs no token exchange, so kagent rejects a SAP AI Core {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} rather than passing the client secret to the runtime.

The rejection happens at compile time on every runtime. The AgentTemplate reports the `Compatible` condition as `False` with the reason `UnsupportedConfiguration`, and kagent compiles no revision from it.

```
environment credential "SAP_AI_CORE_CLIENT_ID" cannot use gateway header injection; local signing and arbitrary secret environment variables are unsupported
```

## Reach the same models another way

The SAP AI Core Orchestration Service serves models from several families, and kagent supports most of those families directly through a provider that authenticates with an API key. Choose the provider for the model that you want to run, rather than for the gateway that serves it.

| To run | Use | Guide |
| ------ | --- | ----- |
| Claude models | `Anthropic` or `Bedrock` | [Anthropic]({{< link path="setup/model-providers/anthropic" >}}), [Amazon Bedrock]({{< link path="setup/model-providers/amazon-bedrock" >}}) |
| GPT models | `OpenAI`, or `AzureOpenAI` for an Azure deployment | [OpenAI]({{< link path="setup/model-providers/openai" >}}), [Azure OpenAI]({{< link path="setup/model-providers/azure-openai" >}}) |
| Gemini models | `Gemini` | [Gemini]({{< link path="setup/model-providers/gemini" >}}) |

For every credential that the gateway cannot inject, and the alternative for each, see [About model providers]({{< link path="setup/model-providers/about-model-providers#credentials-that-do-not-compile" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand which credentials a Harness can run." >}}
  {{< card link=`{{< link path="setup/model-providers/openai" >}}` title="OpenAI" subtitle="Reach GPT models with an API key." >}}
{{< /cards >}}
