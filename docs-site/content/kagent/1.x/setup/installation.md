---
title: Install kagent
description: Install kagent 1.0 and Agent Substrate on a Kubernetes cluster.
weight: 10
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 runs every agent on [Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}), so an installation sets up two systems in the same cluster. Agent Substrate provides the sandboxed compute that agents run on. kagent provides the Harness, AgentTemplate, and Agent API that you author against.

> [!NOTE]
> These steps install kagent 1.0 fresh. kagent 1.0 does not support an in-place upgrade from the 0.10.x version line, and installing its custom resource definitions (CRDs) replaces the ones that a 0.10.x installation uses. To move an existing installation, start with [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x#in-place-upgrade-blockers" >}}).

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

3. Prepare a Kubernetes cluster at **1.37 or later**. Agent Substrate depends on the `PodCertificateRequest` and `ClusterTrustBundle` APIs. Both are generally available (GA) in 1.37 and served at `certificates.k8s.io/v1` by default.

   {{< tabs >}}
   {{% tab name="Local kind cluster" %}}
   For local testing and development, create a [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) cluster at Kubernetes 1.37 or later. Use kind v0.32.0 or later. The cluster does not need extra API configuration.
   ```bash
   kind create cluster --name kagent --image kindest/node:v1.37.0
   ```
   {{% /tab %}}

   {{% tab name="Existing 1.37+ cluster" %}}
   You do not need to change the API server configuration.

   Confirm that the cluster serves the required APIs.
   ```bash
   kubectl api-resources --api-group=certificates.k8s.io
   ```

   Example output:
   ```console
   NAME                           SHORTNAMES   APIVERSION               NAMESPACED   KIND
   certificatesigningrequests     csr          certificates.k8s.io/v1   false        CertificateSigningRequest
   clustertrustbundles                         certificates.k8s.io/v1   false        ClusterTrustBundle
   podcertificaterequests                      certificates.k8s.io/v1   true         PodCertificateRequest
   ```
   {{% /tab %}}
   {{< /tabs >}}

## Install kagent

The kagent CLI installs the CRDs, Agent Substrate, the Agent Substrate PodCertificate controller, a development PostgreSQL database, and kagent in the correct order. The CLI also creates the Agent Substrate identity material and database connection Secrets that the releases need.

1. Save a Helm values file that enables gRPC server reflection, so that guides that use `grpcurl` can discover the controller API.
   ```bash
   cat > kagent-values.yaml <<EOF
   config:
     server:
       grpcReflection: true
   EOF
   ```

2. Save a CLI configuration file that points the installer at those values. `kagent install` does not take Helm flags of its own, so chart values reach it through this file. A relative path in `valuesFiles` resolves against the configuration file's own directory.
   ```bash
   cat > kagent-config.yaml <<EOF
   install:
     kagent:
       valuesFiles: [kagent-values.yaml]
   EOF
   ```

3. Install kagent.
   ```bash
   kagent --config kagent-config.yaml install --namespace kagent
   ```

   The command reads your provider API key, installs Agent Substrate into `ate-system`, and deploys PostgreSQL as `kagent-postgresql` in the kagent namespace. It then connects kagent and Agent Substrate to that database with Pod Certificates. The development database runs the stock `postgres` image. That image does not include the `pgvector` extension that [long-term memory]({{< link path="agents/agent-memory" >}}) needs.

4. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

   For production database requirements and direct Helm installation, see [Operational considerations]({{< link path="operations/operational-considerations#choose-a-database" >}}).

## Verify the installation

Before you create an agent, confirm that kagent and Agent Substrate are running, and find the address that clients use to reach the kagent API.

1. Confirm that the kagent pods are running.
   ```bash
   kubectl get pods -n kagent
   ```
   Example output:
   ```console
   NAME                                              READY   STATUS    RESTARTS   AGE
   kagent-controller-56c67b6cd7-hqj5z                1/1     Running   3          2m
   kagent-default-774d4496bd-sfx4b                   1/1     Running   0          2m
   kagent-postgresql-856b475f59-n258n                2/2     Running   0          2m
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

3. Get the address to reach the kagent gRPC API, which serves Agent, AgentTemplate, Session, and conversation calls. The guide to [create your first agent]({{< link path="get-started/your-first-agent" >}}) assumes port-forwarding.
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

   To use this address with the kagent CLI, pass it in the `--api-url` flag.
   ```bash
   kagent agent list --api-url http://<address>:8083
   ```
   {{% /tab %}}
   {{< /tabs >}}

4. Optional: Open the kagent UI. The UI is a separate `{{< reuse "kagent-docs/snippets/name-ui.md" >}}` service, so it needs its own port-forward in a second terminal. The UI is then available at [http://localhost:8082](http://localhost:8082). For the `kagent dashboard` shortcut and a tour of the UI, see [Launch the UI]({{< link path="observability/launch-ui" >}}).
   ```bash
   kubectl port-forward -n kagent svc/{{< reuse "kagent-docs/snippets/name-ui.md" >}} 8082:8080
   ```

   To serve the UI behind a reverse proxy under a prefix such as `/ui` (configurable with `ui.basePath`), see [Serve the UI under a sub-path]({{< link path="setup/reverse-proxy" >}}).

## Restrict kagent to specific namespaces

By default the controller watches every namespace, and the chart creates cluster-scoped role-based access control (RBAC) resources, which are ClusterRoles and ClusterRoleBindings. To restrict kagent to a set of namespaces, set `global.watchNamespaces` in your Helm values:

```yaml
global:
  watchNamespaces: [prod-agents, staging-agents]
```

The chart derives both surfaces from `global.watchNamespaces`, so the surfaces cannot disagree. For that reason, use `global.watchNamespaces` in preference to the per-surface keys. The chart replaces every kagent ClusterRole with a Role and RoleBinding in each listed namespace. The chart also limits the controller's watch to the same list. The chart appends the install namespace to the list automatically, so the release's own resources remain managed.

The per-surface keys still exist for installations that scope the surfaces independently, and the validation rules bind them:

- `rbac.namespaces` takes precedence over `global.watchNamespaces` whenever the key is present. An explicit `rbac.namespaces: []` restores cluster-scoped RBAC. When `rbac.namespaces` is set, it must include the install namespace, or the render fails.
- `config.kubernetes.watchNamespaces` is an explicit watch override. When `rbac.namespaces` is set, a watch entry that references a namespace outside the RBAC scope fails the render, because the controller would loop on `Forbidden` errors at runtime. When `global.watchNamespaces` is set, the chart folds the entries into the watch scope and does not fail the render. In both cases, the watch list replaces the default. When `config.kubernetes.watchNamespaces` is set, the chart does not add the install namespace back. For the controller to keep watching the install namespace, list it explicitly.
- The `kagent-tool-server` RemoteMCPServer that the chart creates admits references from its own namespace only. An Agent in another watched namespace that binds it does not become ready until you set `allowedNamespaces` on that server. See [Reach kagent-tool-server from another namespace]({{< link path="reference/tools-ecosystem#reach-kagent-tool-server-from-another-namespace" >}}).

Verify a namespaced installation in the same way as the default one, and also check that an unwatched namespace stays unmanaged. The `kubectl get agents` and conditions checks from the guide to [create your first agent]({{< link path="get-started/your-first-agent" >}}) apply to each watched namespace.

1. Create one Agent in each watched namespace.
   ```bash
   kubectl apply -n prod-agents -f my-agent.yaml
   kubectl apply -n staging-agents -f my-agent.yaml
   ```
2. Create one Agent in a namespace that the list does not cover.
   ```bash
   kubectl apply -n dev-agents -f my-agent.yaml
   ```
3. Confirm that the controller reconciles the watched Agents.
   ```bash
   kubectl get agents -n prod-agents
   kubectl get agents -n staging-agents
   ```
   Example output:
   ```console
   NAME           AGE   READY
   my-agent       30s   True
   my-agent       30s   True
   ```
4. Confirm that the Agent in the unwatched namespace stays unmanaged. The Agent's `READY` value stays `UNKNOWN` and its conditions stay empty, because the controller does not have a watch entry for that namespace.
   ```bash
   kubectl get agents -n dev-agents
   kubectl get agent my-agent -n dev-agents -o jsonpath='{.status.conditions}'
   ```
   Example output:
   ```console
   NAME           AGE   READY
   my-agent       30s   UNKNOWN
   null
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then start a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Point kagent at OpenAI, Anthropic, Gemini, or a provider of your own." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults for the database, controller replicas, and Worker node pools." >}}
  {{< card link=`{{< link path="operations/operational-considerations#rotate-the-model-provider-api-key" >}}` title="Rotate the model provider API key" subtitle="Change the API key in the kagent-openai Secret, which Helm owns, without breaking running agents." >}}
  {{< card link=`{{< link path="operations/export-to-helm" >}}` title="Export the installation to Helm" subtitle="Write the Helm commands and values that kagent install applies, and manage the installation with Helm." >}}
{{< /cards >}}
