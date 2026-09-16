---
title: Amazon Bedrock
description: Configure kagent to use models served through AWS Bedrock, with either the native Bedrock provider or its OpenAI-compatible API.
weight: 20
author: kagent.dev
---

Amazon Bedrock serves models from several families behind one AWS API. kagent reaches it two ways: the native `Bedrock` provider, which is the fuller integration, and Bedrock's OpenAI-compatible endpoint through the `OpenAI` provider.

Prefer the native provider. If you need the OpenAI request format, or an inference profile that only that endpoint exposes, use the OpenAI-compatible path.

> [!NOTE]
> Bedrock is the only provider that every runtime supports. A `codex` Harness accepts only OpenAI `gpt-*` model IDs, and both `codex` and `claude` accept no `bedrock` settings beyond `region`. For more information, see [Agent harness]({{< link path="agents/agent-harness#model-provider-support" >}}).

> [!IMPORTANT]
> Both paths authenticate with credentials from a Kubernetes Secret. Attaching an AWS IAM role to the agent, such as with [EKS IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html), is not currently supported: an agent runs as a Substrate Actor rather than as a pod that kagent controls, so there is no per-agent ServiceAccount to attach a role to.

## Before you begin

1. Create an IAM user or role with permissions for Bedrock. At minimum you need `bedrock:InvokeModel` for the models that you use. For more information, see the [AWS Bedrock model access docs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html).

2. Choose an AWS region and a Bedrock model, and confirm that your account has access to that model in that region. For the available models, see the [AWS Bedrock supported models docs](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html).

## Native Bedrock provider

1. Create a Kubernetes Secret that stores your AWS access keys. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic bedrock-credentials -n kagent \
     --from-literal AWS_ACCESS_KEY_ID=<your-access-key> \
     --from-literal AWS_SECRET_ACCESS_KEY=<your-secret-key>
   ```

2. Create a `ModelConfig` that uses the `Bedrock` provider.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: bedrock-model-config
     namespace: kagent
   spec:
     apiKeySecret: bedrock-credentials
     model: us.anthropic.claude-sonnet-4-20250514-v1:0
     provider: Bedrock
     bedrock:
       region: us-east-1
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that holds `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. |
   | `model` | The Bedrock model ID. For the format, see the [AWS Bedrock model IDs](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html). |
   | `provider` | The provider to use, `Bedrock`. |
   | `bedrock.region` | The AWS region that serves the model. This field is required. |

### Bedrock provider settings

The `bedrock` block takes the following settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#bedrockconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `region` | The AWS region that serves the model. Required. |
| `additionalModelRequestFields` | Extra request fields to pass through to the model, as arbitrary JSON. Use this field for parameters that only one model family accepts. |
| `promptCaching` | Whether to cache prompt prefixes across requests. Defaults to `false`. |
| `cacheTTL` | How long a cached prefix lives, either `5m` or `1h`. Defaults to `5m`. |
| `guardrail` | An AWS Bedrock guardrail to apply, given as an `identifier` and a `version`, with an optional `trace` of `disabled`, `enabled`, or `enabled_full`. |
| `readTimeout` | How long to wait on a response, in seconds. |
| `connectTimeout` | How long to wait on a connection, in seconds. |

## OpenAI-compatible endpoint

Bedrock also serves an [OpenAI-compatible chat completions API](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-chat-completions.html), which the `OpenAI` provider can call.

1. Follow the [AWS Bedrock API keys guide](https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started-api-keys.html) to create an API key, and save it as an environment variable.
   ```bash
   export AWS_API_KEY=<your-aws-api-key>
   ```

2. Create a Kubernetes Secret that stores the API key.
   ```bash
   kubectl create secret generic kagent-bedrock -n kagent --from-literal AWS_API_KEY=$AWS_API_KEY
   ```

3. Create a `ModelConfig` that uses the `OpenAI` provider and points at the Bedrock endpoint for your region.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: bedrock-openai-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-bedrock
     apiKeySecretKey: AWS_API_KEY
     model: amazon.titan-text-express-v1
     provider: OpenAI
     openAI:
       baseUrl: https://bedrock-runtime.us-west-2.amazonaws.com/openai/v1
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `apiKeySecret` | The name of the Kubernetes Secret that stores the AWS API key. |
   | `apiKeySecretKey` | The key within that Secret that holds the API key. |
   | `model` | The Bedrock model ID, such as `amazon.titan-text-express-v1`. |
   | `provider` | The provider to use, `OpenAI`. |
   | `openAI.baseUrl` | The Bedrock OpenAI-compatible endpoint for your region, in the form `https://bedrock-runtime.<region>.amazonaws.com/openai/v1`. |

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: bedrock-model-config
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
