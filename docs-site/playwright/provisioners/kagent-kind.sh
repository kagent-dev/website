#!/usr/bin/env bash
#
# Bring up a kind cluster with Agent Substrate + kagent installed, ready for the
# product-UI screenshot capture.
#
# This reproduces the install documented in:
#   content/kagent/1.x/setup/installation.md
# so the screenshots always match what a reader who follows the docs would see.
#
# Chart versions are read from the SAME conrefs that guide renders
# (assets/kagent-docs/versions/{kagent,agent-substrate}.md, 1.x entry), not from
# "latest published". That is the invariant to preserve: a capture must show what a
# reader gets, so when the docs bump a version the next capture follows automatically
# and nothing here needs editing.
#
# It does NOT port-forward and does NOT run Playwright. The caller — the workflow, or
# you — holds the long-lived port-forward and runs the capture, because a port-forward
# that dies with this script would be useless to the thing that needs it.
#
# Usage:
#   OPENAI_API_KEY=… ./kagent-kind.sh [--dry-run] [--no-cluster]
#   ./kagent-kind.sh --delete
#
# Flags:
#   --dry-run     Print every kind/helm/kubectl command without running it.
#   --no-cluster  Skip `kind create` and install into the current kube-context.
#   --delete      Delete the kind cluster and exit.
#
# Env (all have sane defaults):
#   CLUSTER_NAME      kind cluster name                     (default: kagent-shots)
#   NAMESPACE         kagent install namespace              (default: kagent)
#   ATE_NAMESPACE     Agent Substrate namespace             (default: ate-system)
#   KAGENT_VERSION    kagent chart version                  (default: read from docs conref)
#   SUBSTRATE_VERSION Agent Substrate chart version         (default: read from docs conref)
#   NODE_IMAGE        kind node image                       (default: kindest/node:v1.37.0)
#   OPENAI_API_KEY    model provider key (required unless --dry-run)
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-kagent-shots}"
NAMESPACE="${NAMESPACE:-kagent}"
ATE_NAMESPACE="${ATE_NAMESPACE:-ate-system}"
# Kubernetes 1.37+, per the install guide: Agent Substrate depends on the
# certificates.k8s.io/v1beta1 API, which is enabled through runtimeConfig below.
NODE_IMAGE="${NODE_IMAGE:-kindest/node:v1.37.0}"

SUBSTRATE_CRDS_CHART="oci://ghcr.io/kagent-dev/substrate/helm/substrate-crds"
SUBSTRATE_CHART="oci://ghcr.io/kagent-dev/substrate/helm/substrate"
KAGENT_CRDS_CHART="oci://ghcr.io/kagent-dev/kagent/helm/kagent-crds"
KAGENT_CHART="oci://ghcr.io/kagent-dev/kagent/helm/kagent"

DRY_RUN=false
NO_CLUSTER=false
DELETE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run)    DRY_RUN=true ;;
    --no-cluster) NO_CLUSTER=true ;;
    --delete)     DELETE=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Read a version out of a docs conref, for the docs line being captured.
#
# The conrefs hold BOTH lines in one file, as
#   {{< version include-if="0.x" >}}A{{< /version >}}{{< version include-if="1.x" >}}B{{< /version >}}
# so the 1.x value must be selected by its include-if rather than by taking the first
# match — which would silently install the frozen 0.x version and capture the old UI.
resolve_version() {
  local file="$1" override="$2"
  if [[ -n "$override" ]]; then echo "$override"; return; fi
  local conref="${SITE_ROOT}/assets/kagent-docs/versions/${file}"
  if [[ -f "$conref" ]]; then
    local v
    v="$(python3 - "$conref" <<'PY'
import re, sys
txt = open(sys.argv[1]).read()
m = re.search(r'include-if="[^"]*\b1\.x\b[^"]*"[^>]*>}}([^<{]+)', txt)
# A conref with no version shortcode at all is a bare value, which is legitimate:
# some of these files pin one version for every docs line.
print((m.group(1) if m else txt).strip())
PY
)"
    if [[ -n "$v" ]]; then echo "$v"; return; fi
  fi
  echo "ERROR: could not resolve a version from ${conref}" >&2
  exit 1
}

KAGENT_VERSION="$(resolve_version kagent.md "${KAGENT_VERSION:-}")"
SUBSTRATE_VERSION="$(resolve_version agent-substrate.md "${SUBSTRATE_VERSION:-}")"

run() {
  echo "+ $*"
  $DRY_RUN || "$@"
}

# For commands that need a shell (heredocs, pipelines). Printed with the key redacted.
run_sh() {
  local printable="$1" script="$2"
  echo "+ ${printable}"
  $DRY_RUN || bash -c "$script"
}

if $DELETE; then
  run kind delete cluster --name "$CLUSTER_NAME"
  exit 0
fi

# Fail on a missing tool up front, naming it. Without this the first absent tool
# surfaces mid-run as its own unhelpful error -- a missing kubectl-ate reads as
# `unknown command "ate" for "kubectl"` -- and by then Agent Substrate is installed,
# so the cluster is half-built. kubectl-ate must match SUBSTRATE_VERSION; it is
# published at https://github.com/kagent-dev/substrate/releases.
if ! $DRY_RUN; then
  missing=()
  for tool in kind helm kubectl jq openssl; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
  kubectl ate --help >/dev/null 2>&1 || missing+=("kubectl-ate")
  if (( ${#missing[@]} )); then
    echo "Missing required tool(s): ${missing[*]}" >&2
    echo "See the Prerequisites section of docs-site/playwright/README.md." >&2
    exit 1
  fi
fi

if ! $DRY_RUN && [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required (the kagent chart needs a model provider key)." >&2
  echo "Re-run with --dry-run to see the commands without installing." >&2
  exit 1
fi

echo "kagent chart:          ${KAGENT_VERSION}"
echo "Agent Substrate chart: ${SUBSTRATE_VERSION}"
echo

# --- Cluster -----------------------------------------------------------------------
# Skip creation when the cluster is already there, so a re-run after a failed install
# picks up where it left off instead of dying on `kind create`. Every step below is a
# `helm upgrade --install` or a `kubectl create` for the same reason.
#
# Reuse it only when it also ANSWERS. `kind get clusters` lists a cluster whose node
# container is stopped -- which is what Docker Desktop leaves behind when it restarts --
# and installing into that one sends every step at an unreachable API server, failing
# with `Kubernetes cluster unreachable` once per step rather than once up front.
if ! $NO_CLUSTER && ! $DRY_RUN && kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; then
  if kubectl --context "kind-${CLUSTER_NAME}" cluster-info >/dev/null 2>&1; then
    echo "kind cluster '${CLUSTER_NAME}' already exists and is reachable; skipping create."
    NO_CLUSTER=true
  else
    echo "kind cluster '${CLUSTER_NAME}' exists but does not answer; recreating it." >&2
    run kind delete cluster --name "$CLUSTER_NAME"
  fi
fi

if ! $NO_CLUSTER; then
  run_sh "kind create cluster --image ${NODE_IMAGE} --config=- (name ${CLUSTER_NAME})" "
kind create cluster --image ${NODE_IMAGE} --config=- <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: ${CLUSTER_NAME}
runtimeConfig:
  \"certificates.k8s.io/v1beta1\": \"true\"
EOF
"
fi

# --- Agent Substrate ----------------------------------------------------------------
run helm upgrade --install substrate-crds "$SUBSTRATE_CRDS_CHART" \
  --version "$SUBSTRATE_VERSION" --namespace "$ATE_NAMESPACE" --create-namespace

# Deliberately no --wait: the pods cannot become ready until the identity material
# below exists, so waiting here would always time out.
run helm upgrade --install substrate "$SUBSTRATE_CHART" \
  --version "$SUBSTRATE_VERSION" --namespace "$ATE_NAMESPACE"

# CA pools that sign service DNS and pod identity certificates. No Helm chart creates
# these; Agent Substrate authenticates its components with mTLS and the material comes
# from the kubectl-ate plugin.
run kubectl ate admin make-ca-pool --ca-id=1 \
  --name=service-dns-ca-pool --secret-namespace=podcertificate-controller-system
run kubectl ate admin make-ca-pool --ca-id=1 \
  --name=pod-identity-ca-pool --secret-namespace=podcertificate-controller-system

# Actor identity pools.
run kubectl ate admin make-jwt-pool --key-id=1 \
  --name=actor-id-jwt-pool --secret-namespace="$ATE_NAMESPACE"
run kubectl ate admin make-ca-pool --ca-id=1 \
  --name=actor-id-ca-pool --secret-namespace="$ATE_NAMESPACE"

run_sh "kubectl create secret generic actor-id-ca-certs (from the actor-id-ca-pool root)" "
set -euo pipefail
actor_id_ca_root=\"\$(kubectl get secret actor-id-ca-pool -n ${ATE_NAMESPACE} \
  -o jsonpath='{.data.pool}' | base64 --decode \
  | jq -r '.CAs[0].RootCertificateDER' | base64 --decode \
  | openssl x509 -inform der -outform pem)\"
kubectl create secret generic actor-id-ca-certs -n ${ATE_NAMESPACE} \
  --from-literal=ca.crt=\"\${actor_id_ca_root}\" \
  --dry-run=client -o yaml | kubectl apply -f -
"

run_sh "kubectl create configmap ate-api-authentication" "
set -euo pipefail
# Ask the cluster for its issuer rather than assuming one. kind 1.37 advertises
# https://kubernetes.default.svc.cluster.local, while the older hardcoded value was
# https://kubernetes.default.svc; a mismatch is accepted at install time and only shows
# up later as \`token issuer ... not trusted\` on every kubectl-ate and ateapi call.
# kagent's own setup-cluster.sh derives it the same way (kagent#2763, fixed in #2770).
k8s_issuer=\"\$(kubectl get --raw /.well-known/openid-configuration | jq -r .issuer)\"
kubectl create configmap ate-api-authentication -n ${ATE_NAMESPACE} \
  --from-literal=authentication.yaml='actorIdentityJWTProvider: kubernetes
jwtProviders:
- name: kubernetes
  issuer: '\"\${k8s_issuer}\"'
  audiences: [api.${ATE_NAMESPACE}.svc]
  certificateAuthorityFile: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
  discoveryTokenFile: /var/run/secrets/kubernetes.io/serviceaccount/token
' --dry-run=client -o yaml | kubectl apply -f -
"

# Roll out again so the pods mount the identity material, and wait this time.
run helm upgrade substrate "$SUBSTRATE_CHART" \
  --version "$SUBSTRATE_VERSION" --namespace "$ATE_NAMESPACE" \
  --reuse-values --wait --timeout 10m

# --- kagent --------------------------------------------------------------------------
run_sh "helm upgrade --install kagent-crds ${KAGENT_CRDS_CHART} --version ${KAGENT_VERSION}" "
helm upgrade --install kagent-crds ${KAGENT_CRDS_CHART} --version ${KAGENT_VERSION} \
  --namespace ${NAMESPACE} --create-namespace --wait
"

# The key is interpolated inside the heredoc, so the printed form is the redacted one.
run_sh "helm upgrade --install kagent ${KAGENT_CHART} --version ${KAGENT_VERSION} -f - (apiKey redacted)" "
helm upgrade --install kagent ${KAGENT_CHART} \
  --version ${KAGENT_VERSION} \
  --namespace ${NAMESPACE} --create-namespace --timeout 10m \
  -f - <<EOF
providers:
  default: openAI
  openAI:
    apiKey: \${OPENAI_API_KEY}
controller:
  grpc:
    reflection: true
  substrate:
    enabled: true
    ateApiEndpoint: dns:///api.${ATE_NAMESPACE}.svc:443
    atenetRouterURL: http://atenet-router.${ATE_NAMESPACE}.svc:80
    defaultWorkerPool:
      name: kagent-default
substrateWorkerPool:
  create: true
  replicas: 1
  workerImage: \"ghcr.io/kagent-dev/substrate/ateom-gvisor:v${SUBSTRATE_VERSION}\"
EOF
"

run kubectl rollout status deployment/kagent-controller -n "$NAMESPACE" --timeout=300s
# The UI is a separate Deployment, and it is the one the capture actually needs.
run kubectl rollout status deployment/kagent-ui -n "$NAMESPACE" --timeout=300s

echo
echo "Ready. Port-forward the UI and capture:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/kagent-ui 8082:8080 &"
echo "  UI_BASE_URL=http://localhost:8082 npm run update:launch-ui"
echo
echo "Tear down with: $0 --delete"
