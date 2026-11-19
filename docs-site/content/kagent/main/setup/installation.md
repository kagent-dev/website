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

Choose your model provider, then set its API key and run the installer.

{{< tabs >}}
{{% tab name="OpenAI" %}}
```bash
export OPENAI_API_KEY="your-api-key-here"
curl -sL https://kagent.dev/install | bash && kagent install
```
{{% /tab %}}
{{% tab name="Anthropic" %}}
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
curl -sL https://kagent.dev/install | bash && kagent install --provider Anthropic
```
{{% /tab %}}
{{% tab name="Gemini" %}}
```bash
export GOOGLE_API_KEY="your-api-key-here"
curl -sL https://kagent.dev/install | bash && kagent install --provider Gemini
```
{{% /tab %}}
{{% tab name="Other" %}}
`kagent install --provider` also accepts `AzureOpenAI`, `Ollama`, `GeminiVertexAI`, `AnthropicVertexAI`, and `Bedrock`. These providers need settings beyond an API key, so read your provider's page in [Configure model providers]({{< link path="setup/model-providers" >}}) before you install.
{{% /tab %}}
{{< /tabs >}}

When `kagent install` finishes, it prints the next steps.

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

3. Confirm that the default Harnesses exist. The output lists `kagent-default`, `codex-default`, and `claude-default`.
   ```bash
   kubectl get harnesses -n kagent
   ```

4. Port-forward the kagent API, and leave the command running. The guides that follow use `localhost:8083`.
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

### Install a specific release

The install script installs the newest kagent release, and the CLI installs the kagent release of its own version. To install a specific release instead, such as the release that these docs cover, pass `--version` to the script.

```bash
curl -sL https://kagent.dev/install | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
kagent version --client
```

The script supports macOS and Linux on `amd64` and `arm64`, and Windows on `amd64` from Git Bash or MSYS, where it installs `kagent.exe`.

### Pass Helm values to the kagent chart {#cli-helm-values}

`kagent install` does not take Helm flags of its own. To pass your own values to the kagent chart, list the values files in a CLI configuration file and pass the file with `--config`.

For example, if your cluster uses a DNS domain other than `cluster.local`, set `global.clusterDomain`. The chart builds the URLs of the controller and the built-in `kagent-tool-server` MCP server from this domain, so agents cannot reach either service when the value is wrong. `kagent install` does not detect the domain.

1. Save a Helm values file.
   ```bash
   cat > kagent-values.yaml <<EOF
   global:
     clusterDomain: corp.example
   EOF
   ```
2. Save a CLI configuration file that lists the values file. A relative path in `valuesFiles` resolves against the configuration file's own directory.
   ```bash
   cat > kagent-config.yaml <<EOF
   install:
     kagent:
       valuesFiles: [kagent-values.yaml]
   EOF
   ```

   | Field | Description |
   | --- | --- |
   | `install.kagent.valuesFiles` | The Helm values files that the installer passes to the kagent chart, in order. The last file wins. |
   | `install.defaultModelProvider` | Optional. The provider to install with when you omit `--provider`. Defaults to `OpenAI`. |
   | `install.bundledPostgresImage` | Optional. The image of the development PostgreSQL database that the installer deploys, for both the database container and its TLS reloader. Defaults to `postgres:18-alpine`, pinned by digest. To pull the image from a mirror, such as in an air-gapped cluster, set the full image reference, such as `mirror.example.com/library/postgres:18-alpine`. |
3. Install kagent with the configuration file.
   ```bash
   kagent --config kagent-config.yaml install
   ```

### What the CLI installs

`kagent install` installs the CRDs, Agent Substrate into `ate-system`, the Agent Substrate PodCertificate controller, and kagent into the `kagent` namespace, in the correct order. It also sets up the following.

* A development PostgreSQL database, `kagent-postgresql` in the kagent namespace. kagent and Agent Substrate connect to it with Pod Certificates. The database runs the stock `postgres` image, which does not include the `pgvector` extension that [long-term memory]({{< link path="agents/agent-memory" >}}) needs. For production database requirements, see [Operational considerations]({{< link path="operations/operational-considerations#choose-a-database" >}}).
* The `kagent-default` WorkerPool, and the `kagent-default`, `codex-default`, and `claude-default` Harnesses that run on it. An Agent in the kagent namespace can set `spec.harnessRef` to one of these Harnesses without you writing your own. `spec.harnessRef` is namespace-local, so an Agent in another namespace needs its own Harness.
* gRPC server reflection on the controller, so that guides that use `grpcurl` can discover the controller API.

To check each component, see [Verify the installation](#verify-the-installation).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Create an agent and start a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Use Anthropic, Gemini, Bedrock, or a provider of your own." >}}
  {{< card link=`{{< link path="setup/install-helm" >}}` title="Install for production" subtitle="Install with Helm against your own PostgreSQL database." >}}
{{< /cards >}}
