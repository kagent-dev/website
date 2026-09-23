---
title: Install kagent
description: Install kagent 1.0 and Agent Substrate on a Kubernetes cluster.
weight: 10
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 runs every agent on [Agent Substrate]({{< link path="about/agent-substrate" >}}), so an installation sets up two systems in the same cluster. Agent Substrate provides the sandboxed compute that agents run on, and kagent provides the Harness, AgentTemplate, and AgentInstance API that you author against. Install Agent Substrate first, because the kagent controller connects to it at startup.

> [!NOTE]
> These steps install kagent 1.0 fresh. kagent 1.0 has no in-place upgrade from the 0.10.x version line, and installing its custom resource definitions replaces the ones that a 0.10.x installation uses. To move an existing installation, start with [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x#in-place-upgrade-blockers" >}}).

## Before you begin

1. Install the following CLI tools.
   * [`helm`](https://helm.sh/docs/intro/install/), the Kubernetes package manager. Use Helm 3.
   * [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), the Kubernetes command line tool.
   * [`jq`](https://jqlang.org/download/), to read the cluster's token issuer and the root certificate out of the generated CA pool.
   * [`openssl`](https://www.openssl.org), to convert that certificate to PEM format.
   * [`kubectl-ate`](https://github.com/kagent-dev/substrate/releases), the Agent Substrate command line tool, published as a `kubectl` plugin with each Agent Substrate release.
     ```bash
     curl -fsSL -o kubectl-ate \
       "https://github.com/kagent-dev/substrate/releases/download/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/kubectl-ate-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
     chmod +x kubectl-ate
     sudo mv kubectl-ate /usr/local/bin/
     kubectl ate --help
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

## Install Agent Substrate

Deploy the Agent Substrate control plane and data plane into the `ate-system` namespace, then create the identity material that its components authenticate with. Agent Substrate signs pod identities and service certificates from certificate authority (CA) pools that you generate, and it authenticates callers against a JSON Web Token (JWT) authority pool.

> [!IMPORTANT]
> Creating the identity material is required, and no Helm chart performs it for you. Agent Substrate authenticates its components with mutual Transport Layer Security (mTLS), and the identity material that mTLS depends on is created by the `kubectl-ate` plugin, not by Helm.

1. Install the Agent Substrate custom resource definitions (CRDs).
   ```bash
   helm upgrade --install substrate-crds \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate-crds \
     --version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} \
     --namespace ate-system --create-namespace
   ```

2. Install the Agent Substrate control plane and data plane. Do not add `--wait` to this command, because the pods cannot become ready until you create the identity material in the following steps.
   ```bash
   helm upgrade --install substrate \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate \
     --version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} \
     --namespace ate-system
   ```

3. Create the CA pools that sign service DNS and pod identity certificates.
   ```bash
   kubectl ate admin make-ca-pool --ca-id=1 \
     --name=service-dns-ca-pool \
     --secret-namespace=podcertificate-controller-system
   kubectl ate admin make-ca-pool --ca-id=1 \
     --name=pod-identity-ca-pool \
     --secret-namespace=podcertificate-controller-system
   ```

4. Create the actor identity pools that Agent Substrate uses to issue and verify actor credentials.
   ```bash
   kubectl ate admin make-jwt-pool --key-id=1 \
     --name=actor-id-jwt-pool \
     --secret-namespace=ate-system
   kubectl ate admin make-ca-pool --ca-id=1 \
     --name=actor-id-ca-pool \
     --secret-namespace=ate-system
   ```

5. Extract the actor identity root certificate and store it in the secret that the Agent Substrate API server reads.
   ```bash
   actor_id_ca_root="$(kubectl get secret actor-id-ca-pool -n ate-system \
     -o jsonpath='{.data.pool}' | base64 --decode \
     | jq -r '.CAs[0].RootCertificateDER' | base64 --decode \
     | openssl x509 -inform der -outform pem)"

   kubectl create secret generic actor-id-ca-certs -n ate-system \
     --from-literal=ca.crt="${actor_id_ca_root}"
   ```

6. Create the authentication configuration. The `kubernetes` provider accepts Kubernetes ServiceAccount tokens that are issued for the Agent Substrate API server audience. Kubernetes distributions advertise different issuers, so read the issuer from the cluster rather than naming one. An issuer that does not match the cluster's own is accepted when you create the ConfigMap, and surfaces later as `token issuer ... not trusted` on every `kubectl ate` call.
   ```bash
   k8s_issuer="$(kubectl get --raw /.well-known/openid-configuration | jq -r .issuer)"

   kubectl create configmap ate-api-authentication -n ate-system \
     --from-literal=authentication.yaml="actorIdentityJWTProvider: kubernetes
   jwtProviders:
   - name: kubernetes
     issuer: ${k8s_issuer}
     audiences: [api.ate-system.svc]
     certificateAuthorityFile: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
     discoveryTokenFile: /var/run/secrets/kubernetes.io/serviceaccount/token
   "
   ```

7. Roll Agent Substrate out again so that its pods mount the identity material, and wait for them to become ready.
   ```bash
   helm upgrade substrate \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate \
     --version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} \
     --namespace ate-system --reuse-values --wait --timeout 10m
   ```

8. Verify that Agent Substrate is running.
   ```bash
   kubectl get pods -n ate-system
   ```
   Example output:
   ```console
   NAME                              READY   STATUS      RESTARTS   AGE
   ate-api-server-59fccdf6dc-f77h6   1/1     Running     3          9m
   ate-api-server-59fccdf6dc-q49hv   1/1     Running     3          9m
   ate-controller-6c788456f8-zh2rm   1/1     Running     0          9m
   atelet-wxm5s                      1/1     Running     0          9m
   atenet-egress-66f5699886-6rgg9    2/2     Running     0          9m
   atenet-router-645bd98bdd-dlrv2    2/2     Running     0          9m
   dns-6bf4fff5bb-zqsnm              2/2     Running     0          9m
   postgres-0                        2/2     Running     0          9m
   rustfs-56cdbc9dcb-2ntck           1/1     Running     0          9m
   rustfs-bucket-init-4pxgt          0/1     Completed   0          9m
   ```

## Install kagent

The kagent chart connects the controller to Agent Substrate and creates a WorkerPool for agents to run on. A WorkerPool is platform capacity that you provision once, and every Harness references it. No Harness can run until a WorkerPool exists. The values in the following steps are evaluation defaults, including a bundled PostgreSQL instance, one controller replica, and one Worker. For a production installation, add the production values from [Operational considerations]({{< link path="operations/operational-considerations" >}}) to the same command.

> [!IMPORTANT]
> Install kagent 1.0 with Helm. The `kagent install` command does not yet provision Agent Substrate and cannot produce a working 1.0 installation.

1. Install the kagent CRDs.
   ```bash
   helm upgrade --install kagent-crds \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent-crds.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --create-namespace --wait
   ```

2. Install kagent with the Agent Substrate integration enabled.
   ```bash
   helm upgrade --install kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --create-namespace --timeout 10m \
     -f - <<EOF
   providers:
     default: openAI
     openAI:
       apiKey: ${OPENAI_API_KEY}
   controller:
     grpc:
       reflection: true
     substrate:
       enabled: true
       ateApiEndpoint: dns:///api.ate-system.svc:443
       atenetRouterURL: http://atenet-router.ate-system.svc:80
       defaultWorkerPool:
         name: kagent-default
   substrateWorkerPool:
     create: true
     replicas: 1
     workerImage: "ghcr.io/kagent-dev/substrate/ateom-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}"
   EOF
   ```
   > [!NOTE]
   > `controller.grpc.reflection` lets a gRPC client discover the controller's methods without a local copy of kagent's proto files. The kagent CLI does not need it, because the CLI ships with generated clients for every kagent API. Leave reflection on to explore the API with a general-purpose client such as [grpcurl](https://github.com/fullstorydev/grpcurl), and turn it off for a production installation.

   <!--
   > [!NOTE]
   > The kagent chart carries two settings that enable something called `substrate`, and this step sets only the one nested under `controller`. `controller.substrate.enabled` turns on the controller's Agent Substrate integration, which is what lets a Harness run an agent. The top-level `substrate.enabled` is a different toggle that installs Agent Substrate as a subchart of the kagent release, which places most of its resources in the `kagent` namespace while parts of the chart still reference `ate-system`. Leave the top-level setting at its default of `false`, because the preceding steps install Agent Substrate into `ate-system` themselves.
   -->

3. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

> [!NOTE]
> The kagent controller can restart a few times during a first install while it waits for its bundled PostgreSQL database to accept connections. The controller logs `dial tcp ...:5432: connect: connection refused` and then recovers on its own. A restart loop that reports an `ate-api` dial failure instead indicates an incomplete identity bootstrap.

## Verify the installation

1. Confirm that the kagent pods are running.
   ```bash
   kubectl get pods -n kagent
   ```
   Example output:
   ```console
   NAME                                              READY   STATUS    RESTARTS   AGE
   kagent-controller-659b58768b-2k6h4                1/1     Running   3          2m
   kagent-default-864fdc4c94-xbsl9                   1/1     Running   0          2m
   kagent-kmcp-controller-manager-6676b45958-knkzd   1/1     Running   0          2m
   kagent-postgresql-65cc684b78-9qbh2                1/1     Running   0          2m
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

3. Get the address to reach the kagent gRPC API, which serves the AgentInstance lifecycle and conversation calls. The guide to [create your first agent]({{< link path="get-started/your-first-agent" >}}) assumes port-forwarding.
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

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness and AgentTemplate, and talk to the AgentInstance they produce." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Point kagent at OpenAI, Anthropic, Gemini, or a provider of your own." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults for the database, controller replicas, and Worker node pools." >}}
{{< /cards >}}
