---
title: agentgateway
description: Route kagent model requests through an agentgateway deployment for traffic management, observability, and security.
weight: 20
author: kagent.dev
---

[agentgateway](https://agentgateway.dev/docs/) is an AI-native proxy that adds traffic management, observability, and security to large language model calls. It serves an OpenAI-compatible API, so a {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} for agentgateway sets `provider: OpenAI` and points `openAI.baseUrl` at the Gateway service.

## Set up agentgateway model routing

> [!NOTE]
> The `AgentgatewayModel` feature is experimental and disabled by default. Enable it when you install agentgateway by passing `--set agentgatewayModels.enabled=true` to the control plane Helm chart.

1. Install agentgateway in your cluster, adding `--set agentgatewayModels.enabled=true` to the Helm command for the control plane. For more information, see the [agentgateway documentation](https://agentgateway.dev/docs/kubernetes/latest/setup/).

2. Create a `Gateway` resource for model routing.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: gateway.networking.k8s.io/v1
   kind: Gateway
   metadata:
     name: agentgateway-proxy
     namespace: agentgateway-system
   spec:
     gatewayClassName: agentgateway
     listeners:
     - name: http
       protocol: HTTP
       port: 80
       allowedRoutes:
         namespaces:
           from: All
         kinds:
         - group: gateway.networking.k8s.io
           kind: HTTPRoute
         - group: agentgateway.dev
           kind: AgentgatewayModel
   EOF
   ```

3. Create an `AgentgatewayModel` resource for each model that kagent should reach. The resource name becomes the model name that kagent sends in its requests, so it must match the `model` field of the ModelConfig that you create later. The following example routes requests for `gpt-4o-mini` to OpenAI. For more provider and authentication options, see the [agentgateway model documentation](https://docs.solo.io/agentgateway/latest/llm/models/).
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: agentgateway.dev/v1alpha1
   kind: AgentgatewayModel
   metadata:
     name: gpt-4o-mini
     namespace: agentgateway-system
   spec:
     parentRefs:
     - group: gateway.networking.k8s.io
       kind: Gateway
       name: agentgateway-proxy
       sectionName: http
     provider: OpenAI
   EOF
   ```

4. Save the agentgateway Gateway service address in an environment variable.
   ```bash
   export AGENTGATEWAY_URL=http://agentgateway-proxy.agentgateway-system.svc.cluster.local
   ```

## Create the ModelConfig

Choose the tab that matches how your agentgateway deployment authenticates callers.

{{< tabs >}}
{{% tab name="No authentication" %}}
When your agentgateway deployment enforces no API key authentication, the ModelConfig needs no Secret.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: agentgateway-model-config
  namespace: kagent
spec:
  model: gpt-4o-mini
  provider: OpenAI
  openAI:
    baseUrl: "$AGENTGATEWAY_URL"
EOF
```

| Field | Description |
| ----- | ----------- |
| `model` | The model name to request from agentgateway. This must match the name of an `AgentgatewayModel` resource in your agentgateway deployment. |
| `provider` | The provider to use, `OpenAI`, because agentgateway serves an OpenAI-compatible API. |
| `openAI.baseUrl` | The Kubernetes Service address of your agentgateway Gateway. |
{{% /tab %}}
{{% tab name="API key authentication" %}}
When your agentgateway deployment applies an `apiKeyAuthentication` policy with `mode: Strict`, supply the API key that callers send in the `Authorization` header.

1. Create a Kubernetes Secret that stores the API key, in the same namespace as the AgentTemplates that use it.
   ```bash
   export AGENTGATEWAY_API_KEY=<your-api-key>
   kubectl create secret generic kagent-agentgateway-key -n kagent \
     --from-literal AGENTGATEWAY_API_KEY=$AGENTGATEWAY_API_KEY
   ```

2. Create the `ModelConfig`.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: agentgateway-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-agentgateway-key
     apiKeySecretKey: AGENTGATEWAY_API_KEY
     model: gpt-4o-mini
     provider: OpenAI
     openAI:
       baseUrl: "$AGENTGATEWAY_URL"
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the agentgateway API key. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The model name to request from agentgateway. This must match the name of an `AgentgatewayModel` resource in your agentgateway deployment. |
   | `provider` | The provider to use, `OpenAI`, because agentgateway serves an OpenAI-compatible API. |
   | `openAI.baseUrl` | The Kubernetes Service address of your agentgateway Gateway. |
{{% /tab %}}
{{< /tabs >}}

For every `openAI` field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#openaiconfig" >}}).

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: agentgateway-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/byo-openai" >}}` title="BYO OpenAI-compatible endpoint" subtitle="Point the OpenAI provider at any other compatible service." >}}
{{< /cards >}}
