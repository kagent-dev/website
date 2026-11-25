---
title: Install with Helm
description: Install kagent and Agent Substrate with Helm alone, on a development database, to get a working installation.
weight: 6
author: kagent.dev
# This page lays out its own content, so skip the auto-generated child grid.
disableCards: true
---

{{< tutorial-banner title="Install with Helm" text="Install kagent with Helm and kubectl alone, in five steps, on a development database. For a production setup, follow Advanced Install." cta="Start with the CRDs" anchor="install-the-crds" art="logo" >}}

This page gets a working installation running with Helm, without the `kagent` CLI. It makes the simplest choices at each step, so that you can copy the commands as they are.

> [!WARNING]
> The database in this page is for evaluation only. It runs in the cluster with fixed passwords, without TLS, and without durable storage. For an installation that you keep, use your own PostgreSQL, as described in [Advanced Install]({{< link path="setup/installation#install-with-helm" >}}).

{{% panel title="Before you begin" id="before-you-begin" %}}
1. Have a Kubernetes cluster at version **1.37 or later**. To create a local one, see [Before you begin]({{< link path="setup#before-you-begin" >}}) on the Install page.

2. Install [`helm`](https://helm.sh/docs/intro/install/) 3, [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), [`jq`](https://jqlang.org/download/), and [`openssl`](https://www.openssl.org).

3. Install `kubectl-ate`, the Agent Substrate plugin for `kubectl`. You use it once, to create the identity material.
   ```bash
   curl -fsSL -o kubectl-ate \
     "https://github.com/kagent-dev/substrate/releases/download/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/kubectl-ate-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')"
   chmod +x kubectl-ate
   sudo mv kubectl-ate /usr/local/bin/
   kubectl ate --help
   ```

4. Set your model provider API key. This page uses OpenAI. For other providers, see [Configure model providers]({{< link path="setup/model-providers" >}}).
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
{{% /panel %}}

{{% panel title="1. Install the CRDs" id="install-the-crds" %}}
The custom resource definitions of kagent and Agent Substrate install from their own charts. These commands also create the `kagent` and `ate-system` namespaces.

```bash
helm upgrade --install kagent-crds \
  {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent-crds.md" >}} \
  --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
  --namespace kagent --create-namespace --wait

helm upgrade --install substrate-crds \
  {{< reuse "kagent-docs/snippets/helm-substrate-path.md" >}}/substrate-crds \
  --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
  --namespace ate-system --create-namespace --wait
```
{{% /panel %}}

{{% panel title="2. Set up identity" id="set-up-identity" %}}
Agent Substrate signs and verifies the identity of every component. You create the keys that it signs with, tell its API server how to verify callers, and install the controller that issues certificates.

1. Create the certificate and token pools.
   ```bash
   kubectl create namespace podcertificate-controller-system

   for pool in service-dns-ca-pool postgres-ca-pool pod-identity-ca-pool; do
     kubectl ate admin make-ca-pool --ca-id=1 --key-type=ED25519 \
       --name=${pool} --secret-namespace=podcertificate-controller-system
   done

   kubectl ate admin make-jwt-pool --key-id=1 \
     --name=actor-id-jwt-pool --secret-namespace=ate-system
   kubectl ate admin make-ca-pool --ca-id=1 --key-type=ED25519 \
     --name=actor-id-ca-pool --secret-namespace=ate-system
   kubectl ate admin make-ca-pool --ca-id=1 --key-type=ECDSAP256 \
     --name=egress-mitm-ca-pool --secret-namespace=ate-system
   ```

2. Configure how the Agent Substrate API server authenticates callers.
   ```bash
   actor_id_ca_root="$(kubectl get secret actor-id-ca-pool -n ate-system \
     -o jsonpath='{.data.pool}' | base64 --decode \
     | jq -r '.CAs[0].RootCertificateDER' | base64 --decode \
     | openssl x509 -inform der -outform pem)"

   kubectl create secret generic actor-id-ca-certs -n ate-system \
     --from-literal=ca.crt="${actor_id_ca_root}"

   k8s_issuer="$(kubectl get --raw /.well-known/openid-configuration | jq -r .issuer)"

   kubectl create configmap ate-api-authentication -n ate-system \
     --from-literal=authentication.yaml="jwtProviders:
   - name: kubernetes
     issuer: ${k8s_issuer}
     audiences: [api.ate-system.svc]
     certificateAuthorityFile: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
     discoveryTokenFile: /var/run/secrets/kubernetes.io/serviceaccount/token
   "
   ```

   > [!NOTE]
   > This configuration suits a cluster whose token issuer is inside the cluster, such as kind. A managed cluster with a public issuer, such as GKE, needs a different form. See [Set up certificates and identity]({{< link path="setup/installation#set-up-certificates-and-identity" >}}).

3. Install the controller that issues the certificates.
   ```bash
   helm upgrade --install substrate-podcert \
     {{< reuse "kagent-docs/snippets/helm-substrate-path.md" >}}/substrate-podcert \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace podcertificate-controller-system \
     --wait --timeout 5m
   ```
{{% /panel %}}

{{% panel title="3. Start a development database" id="start-a-database" %}}
kagent and Agent Substrate share one PostgreSQL database, each in its own schema. The charts do not deploy a database, so start one, create the roles and schemas, and store the connection strings.

1. Run PostgreSQL in the cluster.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: postgres
     namespace: kagent
   spec:
     selector:
       matchLabels:
         app: postgres
     template:
       metadata:
         labels:
           app: postgres
       spec:
         containers:
           - name: postgres
             image: postgres:18-alpine
             env:
               - name: POSTGRES_PASSWORD
                 value: dev-admin-password
               - name: POSTGRES_DB
                 value: kagent
             ports:
               - containerPort: 5432
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: postgres
     namespace: kagent
   spec:
     selector:
       app: postgres
     ports:
       - port: 5432
   EOF
   kubectl rollout status deploy/postgres -n kagent --timeout=180s
   ```

2. Create the roles and schemas. Each project ships a setup script, which you run with the `psql` that is inside the database pod.
   ```bash
   export KAGENT_OWNER_PASSWORD=dev-kagent-owner KAGENT_READWRITE_PASSWORD=dev-kagent-rw
   export SUBSTRATE_OWNER_PASSWORD=dev-substrate-owner SUBSTRATE_READWRITE_PASSWORD=dev-substrate-rw

   curl -sSLo kagent-setup.sql https://raw.githubusercontent.com/kagent-dev/kagent/refs/tags/v{{< reuse "kagent-docs/versions/kagent.md" >}}/go/core/pkg/postgressetup/setup.sql
   curl -sSLo substrate-setup.sql https://raw.githubusercontent.com/kagent-dev/substrate/refs/tags/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/pkg/postgressetup/setup.sql

   kubectl exec -i -n kagent deploy/postgres -- \
     env KAGENT_OWNER_PASSWORD="$KAGENT_OWNER_PASSWORD" KAGENT_READWRITE_PASSWORD="$KAGENT_READWRITE_PASSWORD" \
     psql -U postgres -d kagent --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --set=kagent_schema=kagent \
     --set=kagent_owner_role=kagent_owner --set=kagent_owner_user=kagent_owner_user \
     --set=kagent_readwrite_role=kagent_readwrite --set=kagent_readwrite_user=kagent_readwrite_user \
     --command='\getenv kagent_owner_password KAGENT_OWNER_PASSWORD' \
     --command='\getenv kagent_readwrite_password KAGENT_READWRITE_PASSWORD' \
     --file=/dev/stdin < kagent-setup.sql

   kubectl exec -i -n kagent deploy/postgres -- \
     env SUBSTRATE_OWNER_PASSWORD="$SUBSTRATE_OWNER_PASSWORD" SUBSTRATE_READWRITE_PASSWORD="$SUBSTRATE_READWRITE_PASSWORD" \
     psql -U postgres -d kagent --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --set=substrate_schema=substrate \
     --set=substrate_owner_role=substrate_owner --set=substrate_owner_user=substrate_owner_user \
     --set=substrate_readwrite_role=substrate_readwrite --set=substrate_readwrite_user=substrate_readwrite_user \
     --command='\getenv substrate_owner_password SUBSTRATE_OWNER_PASSWORD' \
     --command='\getenv substrate_readwrite_password SUBSTRATE_READWRITE_PASSWORD' \
     --file=/dev/stdin < substrate-setup.sql
   ```

3. Store the connection strings in the Secrets that the charts read.
   ```bash
   DB="postgres.kagent.svc:5432/kagent?sslmode=disable"

   kubectl create secret generic kagent-postgres-owner -n kagent \
     --from-literal=ownerConnectionString="postgresql://kagent_owner_user:${KAGENT_OWNER_PASSWORD}@${DB}"
   kubectl create secret generic kagent-postgres-readwrite -n kagent \
     --from-literal=readWriteConnectionString="postgresql://kagent_readwrite_user:${KAGENT_READWRITE_PASSWORD}@${DB}"
   kubectl create secret generic substrate-postgres-owner -n ate-system \
     --from-literal=ownerConnectionString="postgresql://substrate_owner_user:${SUBSTRATE_OWNER_PASSWORD}@${DB}"
   kubectl create secret generic substrate-postgres-readwrite -n ate-system \
     --from-literal=readWriteConnectionString="postgresql://substrate_readwrite_user:${SUBSTRATE_READWRITE_PASSWORD}@${DB}"
   ```
{{% /panel %}}

{{% panel title="4. Install Agent Substrate" id="install-agent-substrate" %}}
Agent Substrate installs as two releases: `substrate-atelet`, the agent that runs on each node, and `substrate`, the control plane.

1. Install `atelet`, and wait for it to roll out.
   ```bash
   kubectl create secret generic kagent-rustfs-credentials -n ate-system \
     --from-literal=AWS_ACCESS_KEY_ID=rustfsadmin \
     --from-literal=AWS_SECRET_ACCESS_KEY=rustfsadmin

   helm upgrade --install substrate-atelet \
     {{< reuse "kagent-docs/snippets/helm-substrate-path.md" >}}/substrate-atelet \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system \
     --wait --timeout 10m \
     -f - <<EOF
   preview:
     - PerTemplateSnapshotLocation
     - GoldenEgressPolicy
   objectStore:
     backend: s3
     endpoint: http://rustfs.ate-system.svc:9000
     region: us-east-1
     pathStyle: true
     credentialsSecret: kagent-rustfs-credentials
   EOF

   kubectl rollout status daemonset/atelet -n ate-system --timeout=5m
   ```

2. Install the control plane.
   ```bash
   helm upgrade --install substrate \
     {{< reuse "kagent-docs/snippets/helm-substrate.md" >}} \
     --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
     --namespace ate-system \
     --wait --timeout 10m \
     -f - <<EOF
   atelet:
     enabled: false
   preview:
     - PerTemplateSnapshotLocation
     - GoldenEgressPolicy
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
{{% /panel %}}

{{% panel title="5. Install kagent" id="install-kagent-helm" %}}
1. Store your API key, and let the `kagent` namespace reach the Agent Substrate API.
   ```bash
   kubectl create secret generic kagent-openai -n kagent \
     --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}"

   kubectl label namespace kagent ate.dev/api-access=true
   ```

2. Install kagent. The values create the worker pool and the three default harnesses, so that you can build an agent straight away.
   ```bash
   helm upgrade --install kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --timeout 12m \
     -f - <<EOF
   config:
     server:
       grpcReflection: true
   controller:
     substrateClientCertificate:
       enabled: true
   substrateWorkerPool:
     create: true
     workerImage: "{{< reuse "kagent-docs/snippets/image-substrate.md" >}}/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}"
   harnesses:
     enabled: true
   EOF

   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```
{{% /panel %}}

{{% panel title="Check the installation" id="check-the-installation" %}}
1. List the releases. All six show `deployed`.
   ```bash
   helm list -A
   ```

   Example output:
   ```console
   NAME               NAMESPACE                          STATUS    CHART
   kagent             kagent                             deployed  kagent-{{< reuse "kagent-docs/versions/kagent.md" >}}
   kagent-crds        kagent                             deployed  kagent-crds-{{< reuse "kagent-docs/versions/kagent.md" >}}
   substrate          ate-system                         deployed  substrate-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-atelet   ate-system                         deployed  substrate-atelet-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-crds     ate-system                         deployed  substrate-crds-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-podcert  podcertificate-controller-system   deployed  substrate-podcert-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   ```

2. Wait until the kagent pods are running.
   ```bash
   kubectl wait pods --all -n kagent --for=condition=Ready --timeout=300s
   ```

3. Open the UI. Leave the command running, and open [http://localhost:8082](http://localhost:8082).
   ```bash
   kubectl port-forward -n kagent svc/kagent-ui 8082:8080
   ```

Now [build your first agent]({{< link path="get-started" >}}).
{{% /panel %}}

{{% panel title="Go further" id="go-further" %}}
{{< cards cols="3" >}}
  {{< card title="Advanced Install" subtitle="Your own PostgreSQL, TLS, and every choice explained." path="/setup/installation/#install-with-helm" >}}
  {{< card title="Helm reference" subtitle="Every value of the kagent chart." path="/reference/helm/" >}}
  {{< card title="Operational considerations" subtitle="What to change before production." path="/operations/operational-considerations/" >}}
{{< /cards >}}
{{% /panel %}}
