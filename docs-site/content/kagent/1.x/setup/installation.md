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

1. Prepare a Kubernetes cluster at **1.37 or later**. Agent Substrate depends on the `PodCertificateRequest` and `ClusterTrustBundle` APIs. Both are generally available (GA) in 1.37 and served at `certificates.k8s.io/v1` by default.

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

2. Set your model provider API key. The examples in this guide use OpenAI. For other providers, see [Configure model providers]({{< link path="setup/model-providers" >}}).
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. Choose an installation method.
   * **CLI**: For an evaluation, use the `kagent install` command of the kagent CLI. The CLI also deploys a development PostgreSQL database. Follow the steps in [Install with the CLI](#install-kagent).
   * **Helm**: For a production installation that Helm manages from the start, install each Helm chart yourself, against a PostgreSQL database that you provide. Follow the steps in [Install with Helm](#install-with-helm).

## Install with the CLI {#install-kagent}

The kagent CLI installs the CRDs, Agent Substrate, the Agent Substrate PodCertificate controller, a development PostgreSQL database, and kagent in the correct order. The CLI also creates the Agent Substrate identity material and database connection Secrets that the releases need.

1. Install the following CLI tools. The kagent CLI runs `helm` to install each chart.
   * [`helm`](https://helm.sh/docs/intro/install/), the Kubernetes package manager. Use Helm 3.
   * [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), the Kubernetes command line tool.
   * `kagent`, the command line tool of the same version as the kagent release that you want to install.
     ```bash
     curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
     kagent version
     ```

2. Save a Helm values file that enables gRPC server reflection, so that guides that use `grpcurl` can discover the controller API.
   ```bash
   cat > kagent-values.yaml <<EOF
   config:
     server:
       grpcReflection: true
   EOF
   ```

   If your cluster uses a DNS domain other than `cluster.local`, also set `global.clusterDomain` in this file. The chart builds the URLs of the controller and the built-in `kagent-tool-server` MCP server from this domain, so agents cannot reach either service when the value is wrong.
   ```yaml
   global:
     clusterDomain: corp.example
   ```

3. Save a CLI configuration file that points the installer at those values. `kagent install` does not take Helm flags of its own, so chart values reach it through this file. A relative path in `valuesFiles` resolves against the configuration file's own directory.
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
   | `install.bundledPostgresImage` | Optional. The image of the development PostgreSQL database that the installer deploys, for both the database container and its TLS reloader. Defaults to `postgres:18-alpine`, pinned by digest. To pull the image from a mirror, such as in an air-gapped cluster, set the full image reference, such as `mirror.example.com/library/postgres:18-alpine`. |

4. Install kagent.
   ```bash
   kagent --config kagent-config.yaml install --namespace kagent
   ```

   The command reads your provider API key, installs Agent Substrate into `ate-system`, and deploys PostgreSQL as `kagent-postgresql` in the kagent namespace. It then connects kagent and Agent Substrate to that database with Pod Certificates. The development database runs the stock `postgres` image. That image does not include the `pgvector` extension that [long-term memory]({{< link path="agents/agent-memory" >}}) needs.

5. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```
   Example output:
   ```console
   deployment "kagent-controller" successfully rolled out
   ```

   For production database requirements, see [Operational considerations]({{< link path="operations/operational-considerations#choose-a-database" >}}).

## Install with Helm {#install-with-helm}

Install the CRDs, the identity material, the database, Agent Substrate, and kagent. Follow these sections in that order, because each section creates objects that a later section needs. Note that as opposed to a CLI installation, a Helm installation connects to a PostgreSQL database that you provide. The charts do not deploy a database.

1. Install the following CLI tools. The Helm installation does not need the kagent CLI.
   * [`helm`](https://helm.sh/docs/intro/install/), the Kubernetes package manager. Use Helm 3.
   * [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), the Kubernetes command line tool.
   * [`jq`](https://jqlang.org/download/), to read the cluster's token issuer and the root certificate out of the generated certificate authority (CA) pool.
   * [`openssl`](https://www.openssl.org), to convert the root certificate to Privacy Enhanced Mail (PEM) format.
   * [`psql`](https://www.postgresql.org/download/) version 15 or later, to run the database setup scripts.
   * [`kubectl-ate`](https://github.com/kagent-dev/substrate/releases), the Agent Substrate command line tool, published as a `kubectl` plugin with each Agent Substrate release.
     ```bash
     curl -fsSL -o kubectl-ate \
       "https://github.com/kagent-dev/substrate/releases/download/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/kubectl-ate-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
     chmod +x kubectl-ate
     sudo mv kubectl-ate /usr/local/bin/
     kubectl ate --help
     ```

2. Prepare a PostgreSQL instance at version 15 or later, and create an empty database for kagent, such as `kagent`. kagent and Agent Substrate share the database, each in its own schema. The instance must accept connections from pods in the `kagent` and `ate-system` namespaces. Save the connection string of a database administrator.
   ```bash
   export ADMIN_CONNECTION_STRING="postgresql://<admin-user>:<admin-password>@<host>:5432/kagent?sslmode=verify-full"
   ```

### Install the CRDs

The kagent and Agent Substrate custom resource definitions (CRDs) install from their own Helm releases, separate from the charts that run the controllers.

1. Install the kagent CRDs.
   ```bash
   helm upgrade --install kagent-crds \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent-crds.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --create-namespace --wait
   ```

2. Install the Agent Substrate CRDs.
   ```bash
   helm upgrade --install substrate-crds \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate-crds \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system --create-namespace --wait
   ```

### Set up certificates and identity

Agent Substrate authenticates its components with mutual Transport Layer Security (mTLS). You create the CA and JSON Web Token (JWT) pools that sign and verify those identities, and then install the controller that issues certificates from them. No Helm chart creates the pools. The `kubectl-ate` plugin writes each pool to a Kubernetes Secret, and the components that mount those Secrets stay in `ContainerCreating` until the pools exist.

1. Create the CA and JWT pools. Each command writes one pool Secret that Agent Substrate reads when it signs or verifies an identity. `make-ca-pool` and `make-jwt-pool` fail when the pool Secret already exists. To rotate a pool, delete its Secret and run the command again.

   1. Create the namespace that holds the signer pools, then the CA pools that sign service DNS certificates, database login certificates, and pod identity certificates.
      ```bash
      kubectl create namespace podcertificate-controller-system --dry-run=client -o yaml | kubectl apply -f -
      for pool in service-dns-ca-pool postgres-ca-pool pod-identity-ca-pool; do
        kubectl ate admin make-ca-pool --ca-id=1 --key-type=ED25519 \
          --name=${pool} --secret-namespace=podcertificate-controller-system
      done
      ```

   2. Create the actor identity pools that Agent Substrate uses to issue and verify actor credentials.
      ```bash
      kubectl ate admin make-jwt-pool --key-id=1 \
        --name=actor-id-jwt-pool --secret-namespace=ate-system
      kubectl ate admin make-ca-pool --ca-id=1 --key-type=ED25519 \
        --name=actor-id-ca-pool --secret-namespace=ate-system
      ```

   3. Create the egress CA pool. Agent Substrate terminates outbound TLS at its egress gateway to inject model provider and Model Context Protocol (MCP) credentials. Without this pool, every outbound HTTPS call from an agent fails.
      ```bash
      kubectl ate admin make-ca-pool --ca-id=1 --key-type=ECDSAP256 \
        --name=egress-mitm-ca-pool --secret-namespace=ate-system
      ```

2. Configure the authentication that the Agent Substrate API server performs. The `kubernetes` provider accepts Kubernetes ServiceAccount tokens that are issued for the Agent Substrate API server audience.

   1. Extract the actor identity root certificate, and store it in the Secret that the Agent Substrate API server reads.
      ```bash
      actor_id_ca_root="$(kubectl get secret actor-id-ca-pool -n ate-system \
        -o jsonpath='{.data.pool}' | base64 --decode \
        | jq -r '.CAs[0].RootCertificateDER' | base64 --decode \
        | openssl x509 -inform der -outform pem)"

      kubectl create secret generic actor-id-ca-certs -n ate-system \
        --from-literal=ca.crt="${actor_id_ca_root}"
      ```

   2. Determine whether the issuer for the cluster is an internal or external issuer. Kubernetes distributions advertise different issuers, and the `ate-api-authentication` ConfigMap takes a different form for each kind of issuer. An issuer that does not match the cluster's own is accepted when you create the ConfigMap, and later surfaces as `token issuer ... not trusted` on every `kubectl ate` call.
      ```bash
      k8s_issuer="$(kubectl get --raw /.well-known/openid-configuration | jq -r .issuer)"
      echo "${k8s_issuer}"
      ```
      * An in-cluster issuer, such as `https://kubernetes.default.svc.cluster.local` on a kind cluster, does not publish a discovery document that a public client can reach.
      * An external issuer, such as the `https://container.googleapis.com/...` issuer that a GKE cluster advertises, is reachable on the public internet.

   3. Create the authentication configuration for your issuer.

      * For an in-cluster issuer, `certificateAuthorityFile` and `discoveryTokenFile` configure the API server to use its own projected ServiceAccount certificate authority and token.
        ```bash
        kubectl create configmap ate-api-authentication -n ate-system \
          --from-literal=authentication.yaml="jwtProviders:
        - name: kubernetes
          issuer: ${k8s_issuer}
          audiences: [api.ate-system.svc]
          certificateAuthorityFile: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
          discoveryTokenFile: /var/run/secrets/kubernetes.io/serviceaccount/token
        "
        ```
      * For an external issuer, omit both lines. `certificateAuthorityFile` replaces the client's root certificate authorities with the cluster's own, so the TLS handshake with an external issuer fails when the field is set.
        ```bash
        kubectl create configmap ate-api-authentication -n ate-system \
          --from-literal=authentication.yaml="jwtProviders:
        - name: kubernetes
          issuer: ${k8s_issuer}
          audiences: [api.ate-system.svc]
        "
        ```

3. Install the Agent Substrate PodCertificate controller, which signs the certificates that components present to each other.
   ```bash
   helm upgrade --install substrate-podcert \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate-podcert \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace podcertificate-controller-system --create-namespace \
     --wait --timeout 5m
   ```

### Prepare the PostgreSQL database {#prepare-postgres}

kagent and Agent Substrate each connect with an owner login, which applies migrations, and a read/write login, which serves runtime queries. Each project ships a `psql` script that creates its roles, logins, and schema. Each script reads the passwords from environment variables and must run in one transaction.

1. Create the kagent roles and the `kagent` schema.
   ```bash
   curl -sSLo kagent-setup.sql https://raw.githubusercontent.com/kagent-dev/kagent/refs/tags/v{{< reuse "kagent-docs/versions/kagent.md" >}}/go/core/pkg/postgressetup/setup.sql
   export KAGENT_OWNER_PASSWORD=<kagent-owner-password> KAGENT_READWRITE_PASSWORD=<kagent-readwrite-password>
   psql "$ADMIN_CONNECTION_STRING" --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --set=kagent_schema=kagent \
     --set=kagent_owner_role=kagent_owner \
     --set=kagent_owner_user=kagent_owner_user \
     --set=kagent_readwrite_role=kagent_readwrite \
     --set=kagent_readwrite_user=kagent_readwrite_user \
     --command='\getenv kagent_owner_password KAGENT_OWNER_PASSWORD' \
     --command='\getenv kagent_readwrite_password KAGENT_READWRITE_PASSWORD' \
     --file=kagent-setup.sql
   ```

2. Create the Agent Substrate roles and the `substrate` schema in the same database.
   ```bash
   curl -sSLo substrate-setup.sql https://raw.githubusercontent.com/kagent-dev/substrate/refs/tags/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/pkg/postgressetup/setup.sql
   export SUBSTRATE_OWNER_PASSWORD=<substrate-owner-password> SUBSTRATE_READWRITE_PASSWORD=<substrate-readwrite-password>
   psql "$ADMIN_CONNECTION_STRING" --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --set=substrate_schema=substrate \
     --set=substrate_owner_role=substrate_owner \
     --set=substrate_owner_user=substrate_owner_user \
     --set=substrate_readwrite_role=substrate_readwrite \
     --set=substrate_readwrite_user=substrate_readwrite_user \
     --command='\getenv substrate_owner_password SUBSTRATE_OWNER_PASSWORD' \
     --command='\getenv substrate_readwrite_password SUBSTRATE_READWRITE_PASSWORD' \
     --file=substrate-setup.sql
   ```

3. Store the connection string of each login in a Secret. Both charts read these Secret names and keys, and the role and schema names that the setup scripts create, by default, so the releases do not need database values. Leave role settings out of the connection strings, because each component assumes its role after it connects.
   ```bash
   kubectl create secret generic kagent-postgres-owner -n kagent \
     --from-literal=ownerConnectionString="postgresql://kagent_owner_user:${KAGENT_OWNER_PASSWORD}@<host>:5432/kagent?sslmode=verify-full"
   kubectl create secret generic kagent-postgres-readwrite -n kagent \
     --from-literal=readWriteConnectionString="postgresql://kagent_readwrite_user:${KAGENT_READWRITE_PASSWORD}@<host>:5432/kagent?sslmode=verify-full"
   kubectl create secret generic substrate-postgres-owner -n ate-system \
     --from-literal=ownerConnectionString="postgresql://substrate_owner_user:${SUBSTRATE_OWNER_PASSWORD}@<host>:5432/kagent?sslmode=verify-full"
   kubectl create secret generic substrate-postgres-readwrite -n ate-system \
     --from-literal=readWriteConnectionString="postgresql://substrate_readwrite_user:${SUBSTRATE_READWRITE_PASSWORD}@<host>:5432/kagent?sslmode=verify-full"
   ```
   The `sslmode=verify-full` setting makes each component verify the server certificate of the database against a root certificate. How you provide that root certificate depends on the certificate authority (CA) that signed the server certificate.
   * For a publicly trusted CA, add `sslrootcert=system` to each connection string. Each component then verifies the server certificate against the root certificates in its container image.
   * For a private CA, such as the Amazon RDS CA, kagent reads the CA certificate from a file that you mount on the controller. Agent Substrate cannot mount a CA file in this release, so the Agent Substrate connection strings cannot verify a server certificate that a private CA signed.
     <!-- REVIEW: Agent Substrate chart gap, tracked in https://github.com/kagent-dev/substrate/issues/125. Replace the preceding sentence with the procedure when the chart can mount a CA file. -->
     1. Store the CA certificate in a Secret.
        ```bash
        kubectl create secret generic kagent-postgres-ca -n kagent \
          --from-file=ca.crt=<path-to-ca-certificate>
        ```
     2. Add `sslrootcert=/run/postgres-ca/ca.crt` to both kagent connection strings.
     3. When you [install kagent](#install-kagent-helm), add the following values to the command.
        ```yaml
        controller:
          volumes:
            - name: postgres-ca
              secret:
                secretName: kagent-postgres-ca
          volumeMounts:
            - name: postgres-ca
              mountPath: /run/postgres-ca
              readOnly: true
        ```

   For the other database settings, such as the connection pool and the `pgvector` extension that [long-term memory]({{< link path="agents/agent-memory" >}}) needs, see [Use an external PostgreSQL instance]({{< link path="operations/operational-considerations#use-an-external-postgresql-instance" >}}).

### Install Agent Substrate

The `substrate` release installs the Agent Substrate control plane and data plane. The release name must be `substrate`, and the namespace must be `ate-system`.

1. Install Agent Substrate. The command sets the following values.
   * `preview` turns on the `PerTemplateSnapshotLocation` gate, so that Agent Substrate stores the snapshots of each agent at the location that its Harness names.
   * `ateApi.authorization.bootstrapOwners` grants owner access to the Agent Substrate API to the kagent controller and to the `ate-client` ServiceAccount. The API server authorizes every call, and without the controller entry every Agent reports `RuntimePreparationFailed (PermissionDenied)`.
   * `atenetRouter.ingressAllowedSPIFFEIDs` lets the kagent controller send traffic to agents through the Agent Substrate router.
   * `credentialProvider.namespacePolicies` lets the `kagent` atespace read Secrets in the `kagent` namespace, where the agents and the Secrets that they read both live. The provider denies every request until a policy allows it.
   ```bash
   helm upgrade --install substrate \
     {{< reuse "kagent-docs/snippets/helm-substrate.md" >}} \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system \
     --wait --timeout 10m \
     -f - <<EOF
   preview:
     - PerTemplateSnapshotLocation
   ateApi:
     authorization:
       bootstrapOwners:
         - spiffe://cluster.local/ns/kagent/sa/kagent-controller
         - system:serviceaccount:ate-system:ate-client
   atenetRouter:
     ingressAllowedSPIFFEIDs:
       - spiffe://cluster.local/ns/kagent/sa/kagent-controller
   credentialProvider:
     namespacePolicies:
       - atespace: kagent
         allowedNamespaces: [kagent]
   EOF
   ```

2. Verify that Agent Substrate is running.
   ```bash
   kubectl get pods -n ate-system
   ```
   In the output, verify that every pod reports `Running`. The `rustfs-bucket-init` pod belongs to a Job and reports `Completed`.
   ```console
   NAME                                       READY   STATUS      RESTARTS   AGE
   ate-api-server-d8c6d5b57-lzcbg             2/2     Running     0          74s
   ate-api-server-d8c6d5b57-twzg8             2/2     Running     0          74s
   ate-controller-64ff6c8445-mjz5x            1/1     Running     0          75s
   ate-idp-server-66fbf4d6c5-9hgmj            1/1     Running     0          75s
   ate-idp-server-66fbf4d6c5-vhrjl            1/1     Running     0          75s
   atelet-m6pkj                               2/2     Running     0          75s
   atenet-egress-787d98dc77-s92ws             1/1     Running     0          74s
   atenet-router-556c5ff957-9f4jt             1/1     Running     0          75s
   k8s-credential-provider-5c8b8fb5b6-5gb6f   1/1     Running     0          75s
   rustfs-545745bdf6-kc8g6                    1/1     Running     0          75s
   rustfs-bucket-init-v6sf4                   0/1     Completed   0          75s
   ```

### Install kagent with Helm {#install-kagent-helm}

Install the kagent control plane into the `kagent` namespace. The controller applies its database migrations when it starts.

1. Store your model provider API key in the Secret that the chart reads by default. You create this Secret, so Helm does not own it, and you rotate the key by updating the Secret.
   ```bash
   kubectl create secret generic kagent-openai -n kagent \
     --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}"
   ```

2. Label the `kagent` namespace so that the kagent controller can reach the Agent Substrate API server. Agent Substrate installs NetworkPolicies that deny ingress to the `ate-system` namespace by default. The policy of the API server admits only the namespaces that carry the `ate.dev/api-access=true` label. Without the label, the controller fails to connect at startup with `context deadline exceeded`.
   ```bash
   kubectl label namespace kagent ate.dev/api-access=true
   ```

3. Install kagent. The command sets the following values.
   * `controller.substrateClientCertificate.enabled` mounts the certificates that the controller presents to the Agent Substrate API server, and the trust bundle that verifies the server.
   * `substrateWorkerPool` creates the `kagent-default` WorkerPool. `workerImage` tags the Worker image with the Agent Substrate version, because the Agent Substrate controller starts each Worker with the flags of its own version.
   ```bash
   helm upgrade --install kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --timeout 12m \
     -f - <<EOF
   controller:
     substrateClientCertificate:
       enabled: true
   substrateWorkerPool:
     create: true
     workerImage: "ghcr.io/kagent-dev/substrate/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}"
   EOF
   ```

4. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```
   Example output:
   ```console
   deployment "kagent-controller" successfully rolled out
   ```

## Verify the installation

Before you create an agent, confirm that kagent and Agent Substrate are running, and find the address that clients use to reach the kagent API.

1. Confirm that the kagent pods are running.
   ```bash
   kubectl get pods -n kagent
   ```
   In the output, verify that every pod reports `Running`. A Helm installation uses your own database, so it does not list the `kagent-postgresql` pod.

   Example output for a CLI installation:
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
   NAME             DESIRED   REPLICAS   READY   SANDBOXCONFIG    RESOLVED   AGE
   kagent-default   1         1          1       gvisor-default   True       2m
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

4. Optional: Open the kagent UI. The UI is a separate `{{< reuse "kagent-docs/snippets/name-ui.md" >}}` service, so it needs its own port-forward in a second terminal. The UI is then available at [http://localhost:8082](http://localhost:8082). For the `kagent dashboard` shortcut and a tour of the UI, see [Launch the UI]({{< link path="ui/launch-ui" >}}).
   ```bash
   kubectl port-forward -n kagent svc/{{< reuse "kagent-docs/snippets/name-ui.md" >}} 8082:8080
   ```

   To serve the UI behind a reverse proxy under a prefix such as `/ui` (configurable with `ui.basePath`), see [Serve the UI under a sub-path]({{< link path="ui/reverse-proxy" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Apply a Harness, an AgentTemplate, and an Agent, then start a conversation with it." >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Point kagent at OpenAI, Anthropic, Gemini, or a provider of your own." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults for the database, controller replicas, and Worker node pools." >}}
  {{< card link=`{{< link path="operations/operational-considerations#rotate-the-model-provider-api-key" >}}` title="Rotate the model provider API key" subtitle="Change the API key in the kagent-openai Secret without breaking running agents." >}}
  {{< card link=`{{< link path="operations/multiple-namespaces" >}}` title="Run agents in multiple namespaces" subtitle="Prepare more namespaces to run agents, and restrict the controller to the namespaces that you choose." >}}
  {{< card link=`{{< link path="operations/export-to-helm" >}}` title="Export the installation to Helm" subtitle="Write the Helm commands and values that kagent install applies, and manage the installation with Helm." >}}
{{< /cards >}}
