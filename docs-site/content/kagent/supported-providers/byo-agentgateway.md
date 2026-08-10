---
title: agentgateway
description: Configure an agentgateway deployment as a model endpoint for kagent.
weight: 9
author: kagent.dev
---

You can route model requests through an [agentgateway](https://agentgateway.dev/docs/) deployment. agentgateway is an AI-native proxy that provides traffic management, observability, and security for LLM calls. Because agentgateway exposes an OpenAI-compatible API, you configure the `ModelConfig` with `provider: OpenAI` and point `openAI.baseUrl` at the agentgateway Gateway service address.

## Set up agentgateway model routing

> [!NOTE]
> The `AgentgatewayModel` feature is experimental and disabled by default. Enable it when you install agentgateway by passing `--set agentgatewayModels.enabled=true` to the control plane Helm chart.

1. Install agentgateway in your cluster. For more information, see the [agentgateway documentation](https://agentgateway.dev/docs/kubernetes/latest/setup/). Add `--set agentgatewayModels.enabled=true` to the Helm command for the agentgateway control plane.

2. Create a `Gateway` resource for model routing. agentgateway uses a separate `Gateway` for model traffic, independent of any waypoint proxy you may already have.

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
   EOF
   ```

3. Create an `AgentgatewayModel` resource for each model you want kagent to access. The resource name is the model name that kagent sends in requests, so it must match `spec.model` in the `ModelConfig`. The following example routes requests for `gpt-4o-mini` to the OpenAI provider. For more provider options and authentication configuration, see the [agentgateway model documentation](https://agentgateway.dev/docs/kubernetes/latest/llm/models/).

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

## Connect to an agentgateway endpoint

1. Create a `ModelConfig` resource. Choose the tab that matches your agentgateway authentication configuration.

   {{< tabs >}}
   {{% tab name="No authentication" %}}
   If your agentgateway deployment does not enforce API key authentication, apply the following `ModelConfig`.

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

   | Setting | Description |
   | --- | --- |
   | `provider` | Set to `OpenAI`, because agentgateway exposes an OpenAI-compatible API. |
   | `model` | The model name to request from agentgateway. This value must match the name of an `AgentgatewayModel` resource in your agentgateway deployment. |
   | `openAI.baseUrl` | The Kubernetes service address of your agentgateway Gateway, set in `$AGENTGATEWAY_URL`. |
   {{% /tab %}}
   {{% tab name="API key authentication" %}}
   If your agentgateway deployment applies an `apiKeyAuthentication` policy with `mode: Strict`, you must provide an API key in the `ModelConfig`.

   1. Save your agentgateway API key and create a Kubernetes secret in the same namespace as your agent, such as `kagent`.

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

agentgateway is now added as a model endpoint in kagent. Next, you can {{< upstream >}}[create or update an agent](https://kagent.dev/docs/kagent/getting-started/first-agent){{< /upstream >}}{{< downstream >}}[create or update an agent]({{< link-hextra path="/agents/basic/" >}}){{< /downstream >}} to use this model.
