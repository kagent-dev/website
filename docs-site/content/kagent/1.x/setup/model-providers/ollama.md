---
title: Ollama
description: Configure kagent to use models that you run yourself with Ollama, in the cluster or on your own machine.
weight: 20
author: kagent.dev
---

[Ollama](https://ollama.com) runs large language models on hardware that you control. The `Ollama` provider points {{< reuse "kagent-docs/snippets/name-product.md" >}} at a self-hosted Ollama server or at an [Ollama Cloud](https://ollama.com/cloud) model. A self-hosted server takes a host address and no API key. An Ollama Cloud model takes an API key, and leaves the host address unset. The `ModelConfig` selects between them.

> [!IMPORTANT]
> kagent agents call tools, so choose a model that supports function calling. A model without tool support connects successfully and then fails to use any tool that you bind to it.

## Run Ollama in the cluster

Skip this section if you already have an Ollama server that your cluster can reach.

1. Create a namespace for Ollama.
   ```bash
   kubectl create namespace ollama
   ```

2. Create the Ollama Deployment and Service.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: ollama
     namespace: ollama
   spec:
     selector:
       matchLabels:
         name: ollama
     template:
       metadata:
         labels:
           name: ollama
       spec:
         containers:
         - name: ollama
           image: ollama/ollama:latest
           ports:
           - name: http
             containerPort: 11434
             protocol: TCP
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: ollama
     namespace: ollama
   spec:
     type: ClusterIP
     selector:
       name: ollama
     ports:
     - port: 80
       name: http
       targetPort: http
       protocol: TCP
   EOF
   ```

3. Wait for the Ollama pod to start.
   ```bash
   kubectl get pod -n ollama -w
   ```

4. Pull the model that you want to serve. Port-forward to the Ollama service, then run the model with the [Ollama CLI](https://ollama.com/download).
   ```bash
   kubectl port-forward -n ollama svc/ollama 11434:80
   ollama run llama3
   ```

## Create the ModelConfig for a self-hosted server

Create a `ModelConfig` that points at the Ollama server. No Secret is needed, because a self-hosted Ollama server takes no API key.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: ModelConfig
metadata:
  name: llama3-model-config
  namespace: kagent
spec:
  model: llama3
  provider: Ollama
  ollama:
    host: http://ollama.ollama.svc.cluster.local
EOF
```

| Field | Description |
| ----- | ----------- |
| `model` | The name of the model as Ollama knows it, such as `llama3`. This must be a model that you already pulled onto the server. |
| `provider` | The provider to use, `Ollama`. |
| `ollama.host` | The address of the Ollama server. Use the in-cluster Service address when Ollama runs in the same cluster. |
| `apiKeySecret` | The name of a Secret that holds the API key. Leave this unset for a self-hosted server, which takes no key. |
| `apiKeySecretKey` | The key inside the Secret that holds the API key. Leave this unset for a self-hosted server. |

## Use Ollama Cloud

[Ollama Cloud](https://ollama.com/cloud) serves hosted models that you reach with an API key. The same `Ollama` provider covers them, with a differently shaped `ModelConfig`: leave `ollama.host` unset, and set `apiKeySecret` and `apiKeySecretKey` to the Secret that holds the key.

1. Save your [Ollama Cloud API key](https://ollama.com/settings/keys) as an environment variable.
   ```bash
   export OLLAMA_API_KEY=***
   ```

2. Create a Kubernetes Secret that stores the API key. Create it in the same namespace as the AgentTemplates that use it, such as `kagent`.
   ```bash
   kubectl create secret generic kagent-ollama -n kagent --from-literal OLLAMA_API_KEY=$OLLAMA_API_KEY
   ```

3. Create the `ModelConfig`. Omit `ollama.host`.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: ollama-cloud-model-config
     namespace: kagent
   spec:
     model: gpt-oss:120b
     provider: Ollama
     apiKeySecret: kagent-ollama
     apiKeySecretKey: OLLAMA_API_KEY
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `model` | The model name as Ollama Cloud lists it, such as `gpt-oss:120b`. Use a name from the Ollama Cloud catalog, or that name with a `:cloud` or `-cloud` suffix. |
   | `provider` | The provider to use, `Ollama`. |
   | `apiKeySecret` | The name of the Secret that holds your Ollama Cloud API key. |
   | `apiKeySecretKey` | The key inside the Secret that holds the API key. |
   | `apiKeyPassthrough` | Alternative to `apiKeySecret`: forward the Bearer token from incoming A2A requests to the provider. Mutually exclusive with `apiKeySecret`. |

### Routing rule

Three inputs decide together whether a request reaches Ollama Cloud. All three must hold:

- `model` is a name from the Ollama Cloud catalog, or that name with a `:cloud` or `-cloud` suffix.
- `ollama.host` is empty, or set to `api.ollama.com`. Setting `ollama.com` satisfies this rule and then fails inside the Ollama SDK, so leave the host unset.
- A credential is present: `apiKeySecret` is set, or `apiKeyPassthrough` is on.

A non-empty `ollama.host` overrides the other two inputs. With `ollama.host` set to a self-hosted address, a cloud model name and a valid Secret together still reach the self-hosted daemon, not Ollama Cloud. Adding a key to the self-hosted example in [Create the ModelConfig for a self-hosted server](#create-the-modelconfig-for-a-self-hosted-server) produces no cloud request, and no error that accounts for it. Remove `ollama.host` to route to Ollama Cloud.

### Ollama Cloud requirements that no error reports

Two conditions must hold for an Ollama Cloud model, and neither produces a message that names it.

- **Egress must reach `api.ollama.com`.** kagent adds `api.ollama.com` to the agent's egress destinations only when the routing rule holds. On a cluster that restricts egress separately, allow `https://api.ollama.com` there as well.
- **The endpoint must use `https`.** A bare host defaults to `http`, which suits a daemon on a private address and fails against Ollama Cloud. kagent normalizes a cloud endpoint to `https`, so a hand-written `host: api.ollama.com` depends on that normalization.

kagent never passes the key to the agent. The egress gateway fetches the Secret and sets the `authorization` header on the outgoing request, and the agent holds a placeholder. For the full account, see [About model providers]({{< link path="setup/model-providers/about-model-providers#how-a-credential-reaches-the-provider" >}}).

## Ollama provider settings

The `ollama` block takes the following settings. For every field, including its type, default, and validation rules, see the [API reference]({{< link path="reference/api-ref#ollamaconfig" >}}).

| Field | Description |
| ----- | ----------- |
| `host` | The address of the Ollama server. |
| `options` | Ollama runtime options, as a map of string keys to string values. Use this field for the parameters that Ollama accepts per request, such as `num_ctx`. |

## Use the ModelConfig

Reference the ModelConfig by name from an AgentTemplate in the same namespace.

```yaml
spec:
  modelConfig:
    name: llama3-model-config
```

> [!NOTE]
> An agent runs inside a sandboxed Actor with controlled egress, so a self-hosted Ollama server must be reachable from the cluster network. A self-hosted server on your laptop is not reachable from an agent, even when `kubectl port-forward` makes it reachable from your terminal.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
