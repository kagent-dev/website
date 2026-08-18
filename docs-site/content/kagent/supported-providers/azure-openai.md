---
title: Azure OpenAI
description: Learn how to configure Azure OpenAI models in kagent.
weight: 3.5
author: kagent.dev
---

## Configuring Azure OpenAI

The following steps use API key authentication.

1. Create a Kubernetes Secret that contains your Azure OpenAI API key.

```bash
export AZURE_OPENAI_API_KEY="<your-azure-openai-api-key>"

kubectl create secret generic azure-openai-api-key \
  --namespace kagent \
  --from-literal=api-key="${AZURE_OPENAI_API_KEY}"
```

2. Create a `ModelConfig` for your Azure OpenAI deployment.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: azure-openai
  namespace: kagent
spec:
  apiKeySecret: azure-openai-api-key
  apiKeySecretKey: api-key
  model: gpt-4o-mini
  provider: AzureOpenAI
  azureOpenAI:
    azureEndpoint: "https://<account>.openai.azure.com/"
    apiVersion: "2025-03-01-preview"
    azureDeployment: gpt-4o-mini
```

For Azure OpenAI's standard models, kagent automatically configures the appropriate model capabilities.

3. Save the manifest as `azure-openai.yaml`, then apply it to your cluster.

```bash
kubectl apply -f azure-openai.yaml
```

After you apply the `ModelConfig`, you can select it from the **Model** dropdown when you create or update an agent in the kagent UI.

## Authentication

| Configuration | Credential |
| --- | --- |
| `apiKeySecret` is set | API key from the referenced Secret. |
| `apiKeyPassthrough: true` | Azure OpenAI API key supplied as the bearer token in the caller's A2A request. This is not Microsoft Entra ID authentication. |
| Neither field is set | Azure Workload Identity. |

### Workload Identity

> **Note:** Azure Workload Identity requires the Go agent runtime (`runtime: go`).

Omit `apiKeySecret` and `apiKeyPassthrough` to use Azure Workload Identity. For local development, the runtime tries to authenticate using your Azure CLI login.

> **Note:** The runtime validates Azure credentials at startup. If credentials cannot be resolved, the agent does not become ready.

Follow the [AKS Workload Identity deployment guide](https://learn.microsoft.com/azure/aks/workload-identity-deploy-cluster) and grant the managed identity the `Cognitive Services User` role.

The kagent pod and ServiceAccount settings are provider-independent. Follow [Configure the agent for Azure Workload Identity](/docs/kagent/supported-providers/azure-ai-foundry#configure-the-agent-for-azure-workload-identity) and set the agent's `modelConfig` to `azure-openai`.
