---
title: SAP AI Core
description: Configure kagent to use models served through the SAP AI Core Orchestration Service.
weight: 20
author: kagent.dev
---

kagent reaches SAP AI Core through its [Orchestration Service](https://help.sap.com/docs/sap-ai-core/sap-ai-core-service-guide/orchestration), a single endpoint that serves models from several families, including Anthropic, OpenAI, Gemini, Amazon, Meta, and Mistral. Authentication uses OAuth2 client credentials from your SAP AI Core service key.

## Create the ModelConfig

1. Save the OAuth2 client credentials from your SAP AI Core service key as environment variables.
   ```bash
   export SAP_AI_CORE_CLIENT_ID=<your_client_id>
   export SAP_AI_CORE_CLIENT_SECRET=<your_client_secret>
   ```

2. Create a Kubernetes Secret that stores both credentials. The Secret must contain the keys `client_id` and `client_secret` under exactly those names.
   ```bash
   kubectl create secret generic kagent-sapaicore -n kagent \
     --from-literal client_id=$SAP_AI_CORE_CLIENT_ID \
     --from-literal client_secret=$SAP_AI_CORE_CLIENT_SECRET
   ```

   > [!NOTE]
   > SAP AI Core is the one provider that does not use `apiKeySecretKey`. kagent reads `client_id` and `client_secret` directly from the Secret that `apiKeySecret` names, so setting `apiKeySecretKey` has no effect.

3. Create a `ModelConfig` that references the Secret. The endpoint, resource group, and OAuth2 token endpoint all come from your SAP AI Core service key.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: sapaicore-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-sapaicore
     model: anthropic--claude-4.5-sonnet
     provider: SAPAICore
     sapAICore:
       baseUrl: https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com
       authUrl: https://<your-tenant>.authentication.eu10.hana.ondemand.com
       resourceGroup: default
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that holds `client_id` and `client_secret`. |
   | `model` | The model to use, in the Orchestration Service naming convention, such as `anthropic--claude-4.5-sonnet`, `gpt-5-mini`, or `gemini-3-pro-preview`. For the full list, see the [SAP AI Core models docs](https://help.sap.com/docs/sap-ai-core/sap-ai-core-service-guide/models-and-scenarios-in-generative-ai-hub). |
   | `provider` | The provider to use, `SAPAICore`. |
   | `sapAICore.baseUrl` | The base URL for the SAP AI Core API. This field is required. |
   | `sapAICore.authUrl` | The OAuth2 token endpoint. |
   | `sapAICore.resourceGroup` | The resource group within SAP AI Core. Defaults to `default`. |

   For every `sapAICore` field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#sapaicoreconfig" >}}).

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: sapaicore-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
