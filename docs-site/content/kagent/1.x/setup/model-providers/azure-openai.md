---
title: Azure OpenAI
description: Configure kagent to use OpenAI models hosted on Azure by creating a ModelConfig for the AzureOpenAI provider.
weight: 20
author: kagent.dev
---

The `AzureOpenAI` provider calls an Azure OpenAI deployment. It differs from the [OpenAI]({{< link path="setup/model-providers/openai" >}}) provider in that it addresses a named deployment in your own Azure resource rather than a model on OpenAI's API.

## Create the ModelConfig

1. Save your Azure OpenAI API key as an environment variable.
   ```bash
   export AZURE_OPENAI_API_KEY=<your-azure-openai-api-key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic azure-openai-api-key -n kagent --from-literal api-key=$AZURE_OPENAI_API_KEY
   ```

3. Create a `ModelConfig` for your Azure OpenAI deployment.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: azure-openai-model-config
     namespace: kagent
   spec:
     apiKeySecret: azure-openai-api-key
     apiKeySecretKey: api-key
     model: gpt-4o-mini
     provider: AzureOpenAI
     azureOpenAI:
       azureEndpoint: https://<account>.openai.azure.com/
       apiVersion: "2025-03-01-preview"
       azureDeployment: gpt-4o-mini
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model that the deployment serves. |
   | `provider` | The provider to use, `AzureOpenAI`. |
   | `azureOpenAI.azureEndpoint` | The endpoint of your Azure OpenAI resource. This field is required. |
   | `azureOpenAI.apiVersion` | The Azure OpenAI API version to call. This field is required unless `apiFormat` is `responses`. |
   | `azureOpenAI.azureDeployment` | The name of the deployment within the resource. |

## Azure OpenAI provider settings

The `azureOpenAI` block takes the following settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#azureopenaiconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `azureEndpoint` | The endpoint of the Azure OpenAI resource. Required. |
| `apiFormat` | Which Azure OpenAI HTTP API to call, either `chatCompletions` or `responses`. Defaults to `chatCompletions`. |
| `apiVersion` | The Azure OpenAI API version. Required unless `apiFormat` is `responses`. |
| `azureDeployment` | The deployment name within the resource. |
| `azureAdToken` | A Microsoft Entra ID token to send instead of an API key. |
| `temperature` | How much randomness the model applies when it picks the next token. |
| `topP` | The nucleus sampling cutoff. |
| `maxTokens` | A cap on the tokens generated in one response. |

## Choose an API format

`apiFormat` selects which Azure OpenAI HTTP API the runtime calls. Keep the default unless a model that you deployed serves the Responses API only, because the two formats differ in how they address a deployment and in whether they take a dated API version.

| Value | What the runtime calls | `azureOpenAI.apiVersion` |
| ----- | ---------------------- | ------------------------ |
| `chatCompletions` | The dated deployments path, which addresses `azureDeployment` under a pinned API version. This value is the default. | Required. The API server rejects a ModelConfig that omits it. |
| `responses` | The Azure Responses API at `<azureEndpoint>/openai/v1/`. This surface does not take a dated version. | Omit this field. |

The following ModelConfig calls the Responses API.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: azure-openai-responses
  namespace: kagent
spec:
  apiKeySecret: azure-openai-api-key
  apiKeySecretKey: api-key
  model: gpt-4o-mini
  provider: AzureOpenAI
  azureOpenAI:
    azureEndpoint: https://<account>.openai.azure.com/
    apiFormat: responses
    azureDeployment: gpt-4o-mini
```

## Send a file to the model

The `responses` format attaches a file to a prompt as a link, or as inline bytes when the file is an image. Azure fetches a link both on the turn that sends it and on every turn that replays the conversation, so a file link must be reachable from Azure for as long as the conversation lives.

A link reaches Azure regardless of its media type. Inline bytes reach Azure only for an image.

| What the message includes | What the runtime sends |
| ------------------------ | ---------------------- |
| An `http://` or `https://` link with an `image/` media type | An `input_image` part with the link. |
| An `http://` or `https://` link with any other media type, such as a PDF | An `input_file` part with the link. |
| Inline image bytes | An `input_image` part with the bytes as a `data:` URL. |
| Inline bytes of any other type, such as a PDF or an Office document | Nothing. Azure OpenAI does not take inline bytes outside an image. |

The runtime refuses a link on any other scheme. When the newest user message includes such a link, the turn fails with `cannot send link "<uri>" with media type "<type>": this provider integration can only pass http and https links`. When an older message in the replayed conversation includes one, the runtime replaces the link with a text note that keeps the URL, so a model with a fetch tool can still retrieve the file.

A link attachment with a display name gets an extra text part that reads `File: <name>` that is placed immediately before the file part. Azure rejects a filename beside a file URL, so the name reaches the model as ordinary text.

## Authentication

| Configuration | Credential |
| ------------- | ---------- |
| `apiKeySecret` is set | The API key from the referenced Secret. |
| `azureOpenAI.azureAdToken` is set | The Microsoft Entra ID token given in the field. |
| `tokenPassthrough: true` | The bearer token from the caller's request, forwarded to Azure OpenAI as the API key. This is not Microsoft Entra ID authentication, and it is mutually exclusive with `apiKeySecret`. |

> [!WARNING]
> **Azure Workload Identity is not currently supported.** In earlier versions of kagent, omitting the credential fields fell back to Azure Workload Identity, which depended on an annotated ServiceAccount on the agent's pod. An agent now runs as a Substrate Actor rather than as a pod that kagent controls, so there is no per-agent ServiceAccount to federate an Azure identity onto. Supply a credential with one of the configurations in the preceding table.

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: azure-openai-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/azure-ai-foundry" >}}` title="Azure AI Foundry" subtitle="Reach models served through an Azure AI Foundry deployment." >}}
{{< /cards >}}
