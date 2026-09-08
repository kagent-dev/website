---
title: Azure AI Foundry
description: Learn how to configure Azure AI Foundry models in kagent.
weight: 3
author: kagent.dev
---

## Configuring Azure AI Foundry

> [!NOTE]
> Foundry chat models and memory embeddings require the Go agent runtime (`runtime: go`).

Azure AI Foundry supports two API formats in kagent:

- OpenAI-compatible models use the OpenAI chat completions API.
- Claude models use the Anthropic Messages API.

The following steps use API key authentication. To authenticate without an API key, see [Workload Identity](#workload-identity).

1. Create a Kubernetes Secret that contains your Foundry API key.

```bash
export FOUNDRY_API_KEY="<your-foundry-api-key>"

kubectl create secret generic foundry-api-key \
  --namespace kagent \
  --from-literal=api-key="${FOUNDRY_API_KEY}"
```

2. Create a `ModelConfig` for your Foundry deployment by using one of the following API formats.

### OpenAI-compatible models

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-chat
  namespace: kagent
spec:
  provider: Foundry
  model: gpt-4.1-nano
  apiKeySecret: foundry-api-key
  apiKeySecretKey: api-key
  foundry:
    endpoint: https://my-foundry-account.cognitiveservices.azure.com/
    deployment: gpt-4-1-nano
    apiVersion: "2024-10-21"
```

> [!NOTE]
> The Azure AI Foundry UI might display the full chat completions URL, such as `https://<account>.cognitiveservices.azure.com/openai/deployments/<deployment>/chat/completions?api-version=<api-version>`. Set `foundry.endpoint` to only the account endpoint. Configure the deployment and API version separately with `foundry.deployment` and `foundry.apiVersion`. kagent constructs the full request URL.

### Anthropic models

Claude models on Azure AI Foundry use the Anthropic Messages API instead of the OpenAI-compatible chat completions API. Set `foundry.apiFormat` to `Anthropic` and use the name of your Claude deployment in `foundry.deployment`.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-claude
  namespace: kagent
spec:
  provider: Foundry
  model: claude-sonnet-4-6
  apiKeySecret: foundry-api-key
  apiKeySecretKey: api-key
  foundry:
    endpoint: https://my-foundry-account.services.ai.azure.com/
    deployment: claude-sonnet-4-6
    apiFormat: Anthropic
```

> [!NOTE]
> The Azure AI Foundry UI displays the full Claude Messages endpoint, such as `https://<account>.services.ai.azure.com/anthropic/v1/messages`. Set `foundry.endpoint` to only the account endpoint, `https://<account>.services.ai.azure.com/`. kagent and the Anthropic SDK add `/anthropic/v1/messages` when they send a request.

The `apiVersion` field is not used with the Anthropic API format.

3. Reference the selected `ModelConfig` from an agent that uses the Go runtime. The following example uses `foundry-chat`. To use the Claude configuration, set `modelConfig` to `foundry-claude`.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: Agent
metadata:
  name: foundry-agent
  namespace: kagent
spec:
  type: Declarative
  declarative:
    runtime: go
    modelConfig: foundry-chat
    systemMessage: "You are a helpful assistant."
```

4. Save the manifests from steps 2 and 3 as `foundry-model.yaml` and `foundry-agent.yaml`, then apply them to your cluster.

```bash
kubectl apply -f foundry-model.yaml
kubectl apply -f foundry-agent.yaml
```

Alternatively, apply only `foundry-model.yaml`, then select the `ModelConfig` from the **Model** dropdown when you create or update an agent in the kagent UI.

## ModelConfig reference

| Field | Required | Description |
| --- | --- | --- |
| `spec.provider` | Always | Must be `Foundry`. |
| `spec.model` | Always | Model name reported to the runtime, such as `gpt-4.1-nano`. This can differ from the Azure deployment name. |
| `spec.foundry.endpoint` | Exactly one endpoint field | Azure account endpoint without an API path or query string. Remove `/openai/...` or `/anthropic/...` from the full endpoint displayed in Azure AI Foundry. Examples include `https://<account>.cognitiveservices.azure.com/` and `https://<account>.services.ai.azure.com/`. |
| `spec.foundry.endpointFrom` | Exactly one endpoint field | Resolve the endpoint from a ConfigMap key. See [Endpoint from a ConfigMap](#endpoint-from-a-configmap). |
| `spec.foundry.deployment` | Always | Foundry model deployment name. |
| `spec.foundry.apiFormat` | Optional | Foundry API format. Set to `Anthropic` for Claude models. Defaults to `OpenAI`. |
| `spec.foundry.apiVersion` | Optional | Azure AI Foundry OpenAI-compatible data-plane API version. Defaults to `2024-10-21`. Ignored when `apiFormat` is `Anthropic`. |
| `spec.apiKeySecret` | Optional | Secret that contains the API key. Omit both this field and `apiKeyPassthrough` to use Workload Identity. Mutually exclusive with `apiKeyPassthrough`. |
| `spec.apiKeySecretKey` | With `apiKeySecret` | Key within `apiKeySecret` that contains the API key. |
| `spec.apiKeyPassthrough` | Optional | Let each caller supply its own Foundry API key instead of using a shared Secret. Mutually exclusive with `apiKeySecret`. See [Token passthrough](#token-passthrough). |

## Authentication

The runtime chooses a credential based on the fields in the `ModelConfig`.

| Configuration | Credential |
| --- | --- |
| `apiKeySecret` is set | API key from the referenced Secret. |
| `apiKeyPassthrough: true` | Foundry API key supplied by the caller's A2A request. |
| Neither field is set | Azure Workload Identity. |

### Workload Identity

Omit `apiKeySecret` and `apiKeyPassthrough` to use Azure Workload Identity. For local development, the runtime tries to authenticate using your Azure CLI login.

> **Note:** The runtime validates Azure credentials at startup. If credentials cannot be resolved, the agent does not become ready.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-chat
  namespace: kagent
spec:
  provider: Foundry
  model: gpt-4.1-nano
  foundry:
    endpoint: https://my-foundry-account.cognitiveservices.azure.com/
    deployment: gpt-4-1-nano
    apiVersion: "2024-10-21"
```

See [Configure the agent for Azure Workload Identity](#configure-the-agent-for-azure-workload-identity) for the required agent settings.

### Token passthrough

Set `apiKeyPassthrough: true`, then send the Foundry API key as the bearer token in each Agent2Agent (A2A) request. The runtime forwards that value to Foundry as the API key. Use [Workload Identity](#workload-identity), not token passthrough, for Microsoft Entra ID authentication.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-passthrough
  namespace: kagent
spec:
  provider: Foundry
  model: gpt-4.1-nano
  apiKeyPassthrough: true
  foundry:
    endpoint: https://my-foundry-account.cognitiveservices.azure.com/
    deployment: gpt-4-1-nano
```

## Endpoint from a ConfigMap

To use an endpoint from a ConfigMap, set `foundry.endpointFrom` to the ConfigMap name and key. For example, [Azure Service Operator](https://azure.github.io/azure-service-operator/) (ASO) can provision the account and write its endpoint to a ConfigMap.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: foundry-account
  namespace: kagent
data:
  endpoint: https://my-foundry-account.cognitiveservices.azure.com/
---
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-chat
  namespace: kagent
spec:
  provider: Foundry
  model: gpt-4.1-nano
  foundry:
    endpointFrom:
      name: foundry-account
      key: endpoint
    deployment: gpt-4-1-nano
    apiVersion: "2024-10-21"
```

The ConfigMap must be in the same namespace as the `ModelConfig`.

> **Note:** Updating the endpoint value triggers a rolling update of agent pods that use this `ModelConfig` as their primary model.

## Configure the agent for Azure Workload Identity

First, follow the [AKS Workload Identity deployment guide](https://learn.microsoft.com/azure/aks/workload-identity-deploy-cluster) to configure your cluster and managed identity. Grant the identity the `Cognitive Services User` role on the Foundry resource.

Azure Workload Identity requires the `azure.workload.identity/use: "true"` label on the agent pod and the managed identity client ID on its ServiceAccount. Configure the agent using one of the following options.

### Let kagent create the ServiceAccount

```yaml
apiVersion: kagent.dev/v1alpha2
kind: Agent
metadata:
  name: foundry-agent
  namespace: kagent
spec:
  type: Declarative
  declarative:
    runtime: go
    modelConfig: foundry-chat
    systemMessage: "You are a helpful assistant."
    deployment:
      labels:
        azure.workload.identity/use: "true"
      serviceAccountConfig:
        annotations:
          azure.workload.identity/client-id: <managed-identity-client-id>
```

The ServiceAccount has the same name and namespace as the agent. Therefore, use `system:serviceaccount:<namespace>:<agent-name>` as the subject of the Azure federated identity credential.

> **Note:** If you use Helm to configure a shared ServiceAccount with `controller.agentDeployment.serviceAccountName`, annotate that ServiceAccount and follow [Use an existing ServiceAccount](#use-an-existing-serviceaccount).

### Use an existing ServiceAccount

Create or reuse a pre-annotated ServiceAccount, then reference it from the agent. The pod label is still required.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: foundry-workload-identity
  namespace: kagent
  annotations:
    azure.workload.identity/client-id: <managed-identity-client-id>
---
apiVersion: kagent.dev/v1alpha2
kind: Agent
metadata:
  name: foundry-agent
  namespace: kagent
spec:
  type: Declarative
  declarative:
    runtime: go
    modelConfig: foundry-chat
    systemMessage: "You are a helpful assistant."
    deployment:
      serviceAccountName: foundry-workload-identity
      labels:
        azure.workload.identity/use: "true"
```

Use `system:serviceaccount:<namespace>:<service-account-name>` as the subject of the Azure federated identity credential.

## Memory embeddings

Configure a memory embedding `ModelConfig` for a Foundry embedding deployment.

```yaml
apiVersion: kagent.dev/v1alpha2
kind: ModelConfig
metadata:
  name: foundry-embeddings
  namespace: kagent
spec:
  provider: Foundry
  model: text-embedding-3-small
  foundry:
    endpoint: https://my-foundry-account.cognitiveservices.azure.com/
    deployment: text-embedding-3-small
    apiVersion: "2024-10-21"
  # No API key: use Azure Workload Identity.
```

For the complete memory and embedding configuration and model requirements, see [Agent Memory](/docs/kagent/concepts/agent-memory).

## Troubleshooting

- **The `ModelConfig` reports `Accepted=False`:** Check whether the required `endpointFrom` ConfigMap and key exist with `kubectl describe modelconfig MODEL_CONFIG_NAME --namespace NAMESPACE`.
- **The agent fails to become ready with a Workload Identity credential error:** Confirm the pod label and ServiceAccount annotation, and verify that the federated credential subject matches the ServiceAccount used by the pod.
- **Foundry returns `401 Unauthorized` or `403 Forbidden`:** Confirm that the managed identity has the `Cognitive Services User` role on the Foundry resource, or that the configured API key has access to the resource.
