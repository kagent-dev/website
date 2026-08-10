---
title: agentgateway
description: Configure an agentgateway deployment as a model endpoint for kagent.
weight: 9
author: kagent.dev
---

You can route model requests through an [agentgateway](https://agentgateway.dev/docs/) deployment. Agentgateway is an AI-native proxy that provides traffic management, observability, and security for LLM calls. Because agentgateway exposes an OpenAI-compatible API, you configure the `ModelConfig` with `provider: OpenAI` and set `openAI.baseUrl` to your agentgateway Gateway service address.

## Set up agentgateway model routing {#setup}

> [!NOTE]
> The `AgentgatewayModel` feature is experimental and disabled by default. You must enable it when you install agentgateway by passing `--set agentgatewayModels.enabled=true` to the control plane Helm chart.

1. Install agentgateway in your cluster. For more information, see the [agentgateway documentation](https://agentgateway.dev/docs/kubernetes/latest/setup/). Add `--set agentgatewayModels.enabled=true` to the Helm command for the agentgateway control plane.

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

3. Create an `AgentgatewayModel` resource for each model that you want kagent to access. The resource name becomes the model name that kagent sends in requests, so it must match `spec.model` in the kagent `ModelConfig`. The following example routes requests for `gpt-4o-mini` to the OpenAI provider. For more provider options and authentication configuration, see the [agentgateway model documentation](https://docs.solo.io/agentgateway/latest/llm/models/).
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
   ```sh
   export AGENTGATEWAY_URL=http://agentgateway-proxy.agentgateway-system.svc.cluster.local
   ```

## Connect to an agentgateway endpoint {#connect}

1. Create a `ModelConfig` resource. Choose the tab that matches your agentgateway authentication configuration.

   {{< tabs >}}
   {{% tab name="No authentication" %}}
   If your agentgateway deployment does not enforce any API key authentication, apply the following `ModelConfig`.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha2
   kind: ModelConfig
   metadata:
     name: agentgateway-model
     namespace: kagent
   spec:
     provider: OpenAI
     model: gpt-4o-mini
     openAI:
       baseUrl: "$AGENTGATEWAY_URL"
   EOF
   ```

   {{< reuse "conrefs/snippets/field-desc/review-table.md" >}} For more information, see the [API docs]({{< link-hextra path="/reference/api/kagent/#modelconfigspec" >}}).

   | Setting | Description |
   | --- | --- |
   | `provider` | Set to `OpenAI`, because agentgateway exposes an OpenAI-compatible API. |
   | `model` | The model name to request from agentgateway. This value must match the name of an `AgentgatewayModel` resource in your agentgateway deployment. |
   | `openAI.baseUrl` | The Kubernetes service address of your agentgateway Gateway, set in `$AGENTGATEWAY_URL`. |
   {{% /tab %}}
   {{% tab name="API key authentication" %}}
   If your agentgateway deployment applies an `apiKeyAuthentication` policy with `mode: Strict`, you must provide an API key in the `ModelConfig`.

   1. Save the API key that the agentgateway `apiKeyAuthentication` policy requires. This is the key that clients must send in the `Authorization` header when they call agentgateway. Create a Kubernetes secret in the same namespace as your agent, such as `kagent`.
      ```bash
      export AGENTGATEWAY_API_KEY=<your-api-key>
      kubectl create secret generic kagent-agentgateway-key -n kagent \
        --from-literal AGENTGATEWAY_API_KEY=$AGENTGATEWAY_API_KEY
      ```

   2. Create the `ModelConfig` resource.
      ```yaml
      kubectl apply -f - <<EOF
      apiVersion: kagent.dev/v1alpha2
      kind: ModelConfig
      metadata:
        name: agentgateway-model
        namespace: kagent
      spec:
        provider: OpenAI
        model: gpt-4o-mini
        apiKeySecret: kagent-agentgateway-key
        apiKeySecretKey: AGENTGATEWAY_API_KEY
        openAI:
          baseUrl: "$AGENTGATEWAY_URL"
      EOF
      ```

   {{< reuse "conrefs/snippets/field-desc/review-table.md" >}} For more information, see the [API docs]({{< link-hextra path="/reference/api/kagent/#modelconfigspec" >}}).

   | Setting | Description |
   | --- | --- |
   | `provider` | Set to `OpenAI`, because agentgateway exposes an OpenAI-compatible API. |
   | `model` | The model name to request from agentgateway. This value must match the name of an `AgentgatewayModel` resource in your agentgateway deployment. |
   | `apiKeySecret` | The name of the Kubernetes secret that stores your agentgateway API key. |
   | `apiKeySecretKey` | The key in the secret that stores your API key. |
   | `openAI.baseUrl` | The Kubernetes service address of your agentgateway Gateway, set in `$AGENTGATEWAY_URL`. |
   {{% /tab %}}
   {{< /tabs >}}

2. Verify that the `ModelConfig` is accepted.
   ```bash
   kubectl get modelconfig agentgateway-model -n kagent -o yaml
   ```

Agentgateway is now added as a model endpoint in kagent. Next, you can [create or update an agent]({{< link-hextra path="/getting-started/first-agent/" >}}) to use this model.