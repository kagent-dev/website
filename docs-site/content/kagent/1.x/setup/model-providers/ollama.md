---
title: Ollama
description: Configure kagent to use models that you run yourself with Ollama, in the cluster or on your own machine.
weight: 20
author: kagent.dev
---

[Ollama](https://ollama.com) runs large language models on hardware that you control. The `Ollama` provider points kagent at an Ollama server rather than at a hosted API, so it needs a host address instead of an API key.

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

Create a `ModelConfig` that points at the Ollama server. No Secret is needed, because an Ollama server takes no API key.

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
