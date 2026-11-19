---
title: Install kagent
description: Install kagent and Agent Substrate on a Kubernetes cluster with the kagent CLI.
weight: 10
author: kagent.dev
---

Install kagent on a Kubernetes cluster in about five minutes. The kagent CLI sets up kagent, [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}), and a development database for you.

> [!NOTE]
> This install is for evaluation. For production, [install with Helm]({{< link path="setup/install-helm" >}}). Upgrading from 0.10.x? Start with [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x#in-place-upgrade-blockers" >}}).

## Before you begin

1. Prepare a Kubernetes cluster at **1.37 or later**.

   {{< tabs >}}
   {{% tab name="Local kind cluster" %}}
   Create a local cluster with [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) v0.32.0 or later.
   ```bash
   kind create cluster --name kagent --image kindest/node:v1.37.0
   ```
   {{% /tab %}}
   {{% tab name="Existing 1.37+ cluster" %}}
   Confirm that the cluster serves the certificate APIs that Agent Substrate needs.
   ```bash
   kubectl api-resources --api-group=certificates.k8s.io
   ```
   ```console
   NAME                           SHORTNAMES   APIVERSION               NAMESPACED   KIND
   certificatesigningrequests     csr          certificates.k8s.io/v1   false        CertificateSigningRequest
   clustertrustbundles                         certificates.k8s.io/v1   false        ClusterTrustBundle
   podcertificaterequests                      certificates.k8s.io/v1   true         PodCertificateRequest
   ```
   {{% /tab %}}
   {{< /tabs >}}

2. Install [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl) and [`helm`](https://helm.sh/docs/intro/install/) 3.

3. Get an API key for your model provider, such as OpenAI, Anthropic, or Gemini.

## Install with the CLI {#install-kagent}

1. **Install the kagent CLI.**
   ```bash
   curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent \
     | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
   ```

2. **Install kagent with your model provider.** Pick your provider, set its API key, and run the installer.

   {{< tabs >}}
   {{% tab name="OpenAI" %}}
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   kagent install
   ```
   {{% /tab %}}
   {{% tab name="Anthropic" %}}
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"

   cat > kagent-config.yaml <<EOF
   install:
     defaultModelProvider: Anthropic
   EOF

   kagent --config kagent-config.yaml install
   ```
   {{% /tab %}}
   {{% tab name="Gemini" %}}
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"

   cat > kagent-config.yaml <<EOF
   install:
     defaultModelProvider: Gemini
   EOF

   kagent --config kagent-config.yaml install
   ```
   {{% /tab %}}
   {{% tab name="Other" %}}
   `install.defaultModelProvider` also accepts `AzureOpenAI`, `Ollama`, `GeminiVertexAI`, `AnthropicVertexAI`, and `Bedrock`. These providers need settings beyond an API key, so read your provider's page in [Configure model providers]({{< link path="setup/model-providers" >}}) before you install.
   {{% /tab %}}
   {{< /tabs >}}

3. **Turn on gRPC reflection.** The guides that call the kagent API with `grpcurl` need it.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --reuse-values \
     --set config.server.grpcReflection=true
   ```

4. **Wait for the controller to roll out.**
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```
   ```console
   deployment "kagent-controller" successfully rolled out
   ```

## Verify the installation

1. Check that every pod reports `Running`.
   ```bash
   kubectl get pods -n kagent
   ```
   ```console
   NAME                                 READY   STATUS    RESTARTS   AGE
   kagent-controller-56c67b6cd7-hqj5z   1/1     Running   0          2m
   kagent-default-774d4496bd-sfx4b      1/1     Running   0          2m
   kagent-postgresql-856b475f59-n258n   2/2     Running   0          2m
   kagent-tools-54959b659c-lfkrz        1/1     Running   0          2m
   kagent-ui-5fdb6fd85c-vzb2z           1/1     Running   0          2m
   ```

2. Check that the WorkerPool is ready.
   ```bash
   kubectl get workerpools -n kagent
   ```
   ```console
   NAME             DESIRED   REPLICAS   READY   SANDBOXCONFIG    RESOLVED   AGE
   kagent-default   1         1          1       gvisor-default   True       2m
   ```

3. Port-forward the kagent API, and leave the command running. The guides that follow use `localhost:8083`.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

## Open the UI

In a second terminal, port-forward the UI, then open [http://localhost:8082](http://localhost:8082).

```bash
kubectl port-forward -n kagent svc/{{< reuse "kagent-docs/snippets/name-ui.md" >}} 8082:8080
```

For a tour of the UI, see [Launch the UI]({{< link path="ui/launch-ui" >}}).

## Customize the installation

### Pass Helm values at install time {#cli-helm-values}

`kagent install` takes chart values only through a CLI configuration file. List your values files under `install.kagent.valuesFiles`, and pass the file with `--config`. For example, if your cluster uses a DNS domain other than `cluster.local`, set `global.clusterDomain`, or agents cannot reach the controller and the built-in tool server.

```bash
cat > kagent-values.yaml <<EOF
global:
  clusterDomain: corp.example
EOF

cat > kagent-config.yaml <<EOF
install:
  kagent:
    valuesFiles: [kagent-values.yaml]
EOF

kagent --config kagent-config.yaml install
```

| Field in `kagent-config.yaml` | Description |
| --- | --- |
| `install.defaultModelProvider` | The model provider to install with. Defaults to `OpenAI`. |
| `install.kagent.valuesFiles` | Helm values files for the kagent chart, in order. The last file wins. A relative path resolves against the configuration file's directory. |
| `install.bundledPostgresImage` | Optional. Image of the development PostgreSQL database. Defaults to `postgres:18-alpine`, pinned by digest. Set a full reference, such as `mirror.example.com/library/postgres:18-alpine`, to pull from a mirror. |

### What the CLI installs

`kagent install` installs the CRDs, Agent Substrate into `ate-system`, and kagent into the `kagent` namespace. It also deploys a development PostgreSQL database, `kagent-postgresql`. That database does not include the `pgvector` extension that [long-term memory]({{< link path="agents/agent-memory" >}}) needs. For production database requirements, see [Operational considerations]({{< link path="operations/operational-considerations#choose-a-database" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent and start a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Use Anthropic, Gemini, Bedrock, or a provider of your own." >}}
  {{< card link=`{{< link path="setup/install-helm" >}}` title="Install for production" subtitle="Install with Helm against your own PostgreSQL database." >}}
{{< /cards >}}
