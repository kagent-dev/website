---
title: Azure AI Foundry
description: Configure kagent to use models served through an Azure AI Foundry deployment.
weight: 20
author: kagent.dev
---

The `Foundry` provider calls a model deployment in an Azure AI Foundry resource. The chat model must be reachable through Foundry's OpenAI-compatible chat completions API.

## Create the ModelConfig

1. Save your Azure AI Foundry API key as an environment variable.
   ```bash
   export FOUNDRY_API_KEY=<your-foundry-api-key>
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic foundry-api-key -n kagent --from-literal api-key=$FOUNDRY_API_KEY
   ```

3. Create a `ModelConfig` for your Foundry deployment.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: foundry-model-config
     namespace: kagent
   spec:
     apiKeySecret: foundry-api-key
     apiKeySecretKey: api-key
     model: gpt-4.1-nano
     provider: Foundry
     foundry:
       endpoint: https://<account>.cognitiveservices.azure.com/
       deployment: gpt-4-1-nano
       apiVersion: "2024-10-21"
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the API key, in the same namespace as this ModelConfig. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model that the deployment serves. |
   | `provider` | The provider to use, `Foundry`. |
   | `foundry.endpoint` | The endpoint of your Foundry account. |
   | `foundry.deployment` | The name of the deployment within the account. This field is required. |
   | `foundry.apiVersion` | The Foundry API version to call. Defaults to `2024-10-21`. |

## Azure AI Foundry provider settings

The `foundry` block takes the following settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#foundryconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `deployment` | The deployment name within the Foundry account. Required. |
| `endpoint` | The endpoint of the Foundry account. |
| `endpointFrom` | Read the endpoint from a key in a ConfigMap instead of setting it inline. Use this field when the endpoint differs per environment and is published by a platform team. |
| `apiVersion` | The Foundry API version. Defaults to `2024-10-21`. |

### Read the endpoint from a ConfigMap

Set `endpointFrom` in place of `endpoint` to take the endpoint from a ConfigMap in the same namespace.

```yaml
spec:
  provider: Foundry
  model: gpt-4.1-nano
  apiKeySecret: foundry-api-key
  apiKeySecretKey: api-key
  foundry:
    endpointFrom:
      name: foundry-endpoint
      key: endpoint
    deployment: gpt-4-1-nano
```

When the named ConfigMap or key does not exist, the {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} reports `Accepted` as `False`. Inspect it to find which reference failed.

```bash
kubectl describe modelconfig foundry-model-config -n kagent
```

## Authentication

| Configuration | Credential |
| ------------- | ---------- |
| `apiKeySecret` is set | The API key from the referenced Secret. |
| `apiKeyPassthrough: true` | The bearer token from the caller's request, forwarded to Foundry as the API key. Mutually exclusive with `apiKeySecret`. |

> [!WARNING]
> **Azure Workload Identity is not currently supported.** In earlier versions of kagent, omitting the credential fields fell back to Azure Workload Identity, which depended on an annotated ServiceAccount on the agent's pod. An agent now runs as a Substrate Actor rather than as a pod that kagent controls, so there is no per-agent ServiceAccount to federate an Azure identity onto. Supply an API key instead.

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: foundry-model-config
```

## Memory embeddings

A Foundry deployment can also serve the embedding model behind [long-term memory]({{< link path="agents/agent-memory" >}}). Point a second ModelConfig at your embedding deployment, then name it from the Harness's `spec.kagent.memory.modelConfigRef`.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: foundry-embeddings
  namespace: kagent
spec:
  apiKeySecret: foundry-api-key
  apiKeySecretKey: api-key
  model: text-embedding-3-small
  provider: Foundry
  foundry:
    endpoint: https://<account>.cognitiveservices.azure.com/
    deployment: text-embedding-3-small
EOF
```

## Troubleshooting

| Symptom | Cause |
| ------- | ----- |
| The ModelConfig reports `Accepted` as `False` | A referenced Secret or `endpointFrom` ConfigMap does not exist, or does not hold the named key. Run `kubectl describe modelconfig` to see which one. |
| Foundry returns `401 Unauthorized` or `403 Forbidden` | The API key does not have access to the resource. |
| The AgentTemplate reports `Compatible` as `False` | The resolved configuration cannot run on the Harness. Read the condition message for the specific reason. |

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/azure-openai" >}}` title="Azure OpenAI" subtitle="Reach OpenAI models hosted directly on Azure OpenAI." >}}
{{< /cards >}}
