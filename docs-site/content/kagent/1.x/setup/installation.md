---
title: Install kagent
description: Install kagent 1.0 and Agent Substrate on a Kubernetes cluster.
weight: 10
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 runs every agent on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}), so an installation sets up two systems in the same cluster. Agent Substrate provides the sandboxed compute that agents run on, and kagent provides the Harness, AgentTemplate, and Agent API that you author against. The `kagent install` command installs kagent, Agent Substrate, and the development PostgreSQL database together.

> [!NOTE]
> These steps install kagent 1.0 fresh. kagent 1.0 has no in-place upgrade from the 0.10.x version line, and installing its custom resource definitions replaces the ones that a 0.10.x installation uses. To move an existing installation, start with [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x#in-place-upgrade-blockers" >}}).

## Before you begin

1. Install the following CLI tools.
   * [`helm`](https://helm.sh/docs/intro/install/), the Kubernetes package manager. Use Helm 3.
   * [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), the Kubernetes command line tool.
   * The kagent CLI, matched to the release that these docs cover.
     ```bash
     curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
     kagent version
     ```

2. Set your model provider API key. The examples in this guide use OpenAI. For other providers, see [Configure model providers]({{< link path="setup/model-providers" >}}).
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. Prepare a Kubernetes cluster at **1.37 or later** and enable it with the following requirements for Agent Substrate.

   {{< tabs >}}
   {{% tab name="Local kind cluster" %}}
   For local testing and development, create a [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) cluster at Kubernetes 1.37 or later. Use kind v0.32.0 or later. Enable the `certificates.k8s.io/v1beta1` API, which Agent Substrate depends on.
   ```bash
   kind create cluster --image kindest/node:v1.37.0 --config=- <<EOF
   kind: Cluster
   apiVersion: kind.x-k8s.io/v1alpha4
   name: kagent
   runtimeConfig:
     "certificates.k8s.io/v1beta1": "true"
   EOF
   ```
   {{% /tab %}}

   {{% tab name="Existing 1.37+ cluster" %}}
   To use an existing Kubernetes 1.37 or later cluster, you must manually enable the `certificates.k8s.io/v1beta1` API, which Agent Substrate depends on.
   1. On each control plane node, add the runtime configuration to the kube-apiserver manifest. The kubelet restarts the static pod when the file changes, so no restart command is needed.
      ```yaml
      # /etc/kubernetes/manifests/kube-apiserver.yaml
      spec:
        containers:
        - command:
          - kube-apiserver
          - --runtime-config=certificates.k8s.io/v1beta1=true
      ```
      > [!NOTE]
      > If the command list already has a `--runtime-config` flag, edit that line instead of adding a second one. A duplicate flag is silently ignored, and the API is not served.

   2. Confirm that the beta group is served. Be sure to check the served API versions, not the resource list.
      ```bash
      kubectl api-versions | grep certificates.k8s.io
      ```

      Example output:
      ```console
      certificates.k8s.io/v1
      certificates.k8s.io/v1beta1
      ```
   {{% /tab %}}
   {{< /tabs >}}

## Install kagent

The kagent CLI installs the CRDs, Agent Substrate, the Substrate PodCertificate controller, a development PostgreSQL database, and kagent in the correct order. It also creates the Substrate identity material and database connection Secrets that the releases need.

1. Install kagent. The following command enables gRPC server reflection so that guides that use `grpcurl` can discover the controller API.
   ```bash
   KAGENT_HELM_EXTRA_ARGS="--set controller.grpc.reflection=true" \
     kagent install --namespace kagent
   ```

   The command uses your provider API key, installs Agent Substrate into `ate-system`, deploys PostgreSQL as `kagent-postgresql` in the kagent namespace, and connects kagent and Substrate to that database with Pod Certificates. The development database does not include the `pgvector` extension and is not intended for production.

2. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

   For production database requirements and direct Helm installation, see [Operational considerations]({{< link path="operations/operational-considerations#choose-a-database" >}}).

## Verify the installation

1. Confirm that the kagent pods are running.
   ```bash
   kubectl get pods -n kagent
   ```
   Example output:
   ```console
   NAME                                              READY   STATUS    RESTARTS   AGE
   kagent-controller-56c67b6cd7-hqj5z                1/1     Running   3          2m
   kagent-default-774d4496bd-sfx4b                   1/1     Running   0          2m
   kagent-grafana-mcp-7c67f5697c-4mf78               1/1     Running   0          2m
   kagent-kmcp-controller-manager-6676b45958-zcvrp   1/1     Running   0          2m
   kagent-postgresql-856b475f59-n258n                1/1     Running   0          2m
   kagent-tools-54959b659c-lfkrz                     1/1     Running   0          2m
   kagent-ui-5fdb6fd85c-vzb2z                        1/1     Running   0          2m
   ```

2. Confirm that the WorkerPool reports a ready replica.
   ```bash
   kubectl get workerpools -n kagent
   ```
   Example output:
   ```console
   NAME             DESIRED   REPLICAS   READY   AGE
   kagent-default   1         1          1       2m
   ```

3. Get the address to reach the kagent gRPC API, which serves the Session lifecycle and conversation calls. The guide to [create your first agent]({{< link path="get-started/your-first-agent" >}}) assumes port-forwarding.
   {{< tabs >}}
   {{% tab name="Port-forward for local testing" %}}
   Forward the controller port and leave the command running. The API is then available at `localhost:8083`.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```
   {{% /tab %}}
   {{% tab name="Cloud Provider LoadBalancer" %}}
   Read the external address of the controller service. The gRPC API listens on port `8083`.
   ```bash
   kubectl get svc -n kagent kagent-controller \
     -o jsonpath="{.status.loadBalancer.ingress[0]['hostname','ip']}"
   ```
   {{% /tab %}}
   {{< /tabs >}}

4. Optional: Open the kagent UI. The UI is a separate `{{< reuse "kagent-docs/snippets/name-ui.md" >}}` service, so it needs its own port-forward in a second terminal. The dashboard is then available at [http://localhost:8082](http://localhost:8082). For the `kagent dashboard` shortcut and a tour of the UI, see [Launch the UI]({{< link path="observability/launch-ui" >}}).
   ```bash
   kubectl port-forward -n kagent svc/{{< reuse "kagent-docs/snippets/name-ui.md" >}} 8082:8080
   ```

   To serve the UI behind a reverse proxy under a prefix such as `/ui` (configurable with `ui.basePath`), see [Serve the UI under a sub-path]({{< link path="setup/reverse-proxy" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then start a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Point kagent at OpenAI, Anthropic, Gemini, or a provider of your own." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults for the database, controller replicas, and Worker node pools." >}}
  {{< card link=`{{< link path="operations/operational-considerations#rotate-the-model-provider-api-key" >}}` title="Rotate the model provider API key" subtitle="Change the API key in the kagent-openai Secret, which Helm owns, without breaking running agents." >}}
{{< /cards >}}
