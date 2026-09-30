---
title: Ollama
description: Configure kagent to use models that you run yourself with Ollama, in the cluster or on your own machine.
weight: 20
author: kagent.dev
---

[Ollama](https://ollama.com) runs large language models on hardware that you control. The `Ollama` provider covers both: point {{< reuse "kagent-docs/snippets/name-product.md" >}} at a self-hosted Ollama server, or use an [Ollama Cloud](https://ollama.com/cloud) model. A self-hosted server needs a host address, while an Ollama Cloud model needs an API key and no host. The choice between the two is made in the `ModelConfig`, not in the provider.

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

## Create the ModelConfig

For a self-hosted server, create a `ModelConfig` that points at it. No Secret is needed, because an Ollama server takes no API key.

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
| `apiKeyPassthrough` | Forward the Bearer token from incoming A2A requests to the provider. Use this when your cluster fronts kagent with an identity-aware gateway and you do not want to store a key in a Secret. |

## Use Ollama Cloud

[Ollama Cloud](https://ollama.com/cloud) serves hosted models that you use with an API key. The same `Ollama` provider covers it, but the `ModelConfig` is shaped differently: `ollama.host` stays unset and the credential fields carry the key.

1. Store the key in a Secret.
   ```bash
   kubectl create secret generic ollama-cloud-key \
     -n kagent \
     --from-literal=key=ollama-...
   ```

2. Create the `ModelConfig`. Omit `ollama.host`.
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
     apiKeySecret: ollama-cloud-key
     apiKeySecretKey: key
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `model` | The model name as Ollama Cloud lists it, such as `gpt-oss:120b`. A name from the Ollama Cloud catalog, or that name with a `:cloud` suffix. |
   | `provider` | The provider to use, `Ollama`. |
   | `apiKeySecret` | The name of the Secret that holds your Ollama Cloud API key. |
   | `apiKeySecretKey` | The key inside the Secret that holds the API key. |
   | `apiKeyPassthrough` | Alternative to `apiKeySecret`: forward the Bearer token from incoming A2A requests to the provider. Mutually exclusive with `apiKeySecret`. |

3. (Optional) If you front kagent with an identity-aware gateway, set `apiKeyPassthrough: true` and leave `apiKeySecret` and `apiKeySecretKey` unset. The agent's egress then carries the caller's token instead of a key stored in a Secret.

### Routing rule

Three inputs decide together whether a request reaches Ollama Cloud. All three must hold:

- `model` is a name from the Ollama Cloud catalog, or that name with a `:cloud` suffix.
- `ollama.host` is empty, or already `api.ollama.com` or `ollama.com`.
- A credential is present: `apiKeySecret` is set, or `apiKeyPassthrough` is on.

A non-empty `ollama.host` wins. With `host` set to a self-hosted address, a cloud model name and a valid Secret together still reach the self-hosted daemon, not Ollama Cloud. A reader who follows the self-hosted example above and then adds a key gets no cloud request and no error explaining why. Remove `ollama.host` to route to Ollama Cloud.

### Behavior that does not surface as an error

- **The agent never sees the key.** The egress gateway injects `authorization: Bearer *** against `https://api.ollama.com`, and the agent holds a placeholder. The credential binding, the `OLLAMA_API_KEY` environment reference, and the egress entry share one predicate, so they cannot disagree.
- **The egress list must allow the host.** kagent adds `api.ollama.com` to the destination list only when the routing rule above holds. On a restricted cluster, verify that egress to `https://api.ollama.com` is allowed.
- **`http` breaks the cloud endpoint.** A bare host defaults to `http`, which suits a daemon on a private address but fails against Ollama Cloud. Cloud endpoints are normalized to `https`, so a hand-written `host: api.ollama.com` depends on that normalization.
- **`api.ollama.com`, not `ollama.com`.** The Ollama SDK special-cases `ollama.com` by deriving an Authorization header from a locally signed nonce, and fails before the request leaves the process when that key is absent, as it is in an agent pod.
- **The key is optional.** `OLLAMA_API_KEY` is returned for the `Ollama` provider but treated as optional, because a self-hosted daemon needs none.
- **The catalog decides cloud membership.** The catalog renders from `OllamaCloudModels`, which mirrors `GET https://api.ollama.com/api/tags`, so the list a user picks from and the rule that routes the choice cannot drift apart.

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
> An agent runs inside a sandboxed Actor with controlled egress, so the Ollama server must be reachable from the cluster network. An Ollama server on your laptop is not reachable from an agent, even when `kubectl port-forward` makes it reachable from your terminal.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent that uses this model, and hold a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
