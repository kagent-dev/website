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
#
# TEMPORARY source-build mode (see "Source-build mode" below):
#   KAGENT_CHART_DIR  path to a kagent checkout; installs its local charts instead
#                     of the published ones, for use before 1.0 is released
#   KAGENT_IMAGE_REGISTRY / KAGENT_IMAGE_TAG   the locally built images to run
set -euo pipefail

# --- Source-build mode ------------------------------------------------------------
#
# Set KAGENT_CHART_DIR to install kagent from a checkout's `helm/` directory rather
# than from the published OCI charts.
#
# This exists because, as of 2026-09-15, THE CHART THE 1.x DOCS PIN DOES NOT EXIST.
# `versions/kagent.md` pins `1.0.0-beta0`; the newest published tag is `0.10.1` and
# there is no 1.x tag, branch, or floating image tag anywhere. So the normal path —
# install exactly what a reader installs — has nothing to install, and the captures
# would otherwise be blocked until 1.0 ships.
#
# The tradeoff is the one this harness otherwise exists to avoid: a source build is
# NOT what a reader gets, so any baseline captured this way must be RE-CAPTURED from
# the published chart once 1.0 is out. Record which build a baseline came from.
# Precedent: the enterprise agentgateway standalone harness did exactly this ahead of
# a release, and its README carries the same warning.
#
# Delete this mode when `versions/kagent.md` points at a chart that actually pulls.
KAGENT_CHART_DIR="${KAGENT_CHART_DIR:-}"
SOURCE_BUILD=false
if [[ -n "$KAGENT_CHART_DIR" ]]; then
  SOURCE_BUILD=true
  KAGENT_IMAGE_REGISTRY="${KAGENT_IMAGE_REGISTRY:-localhost:5001}"
  KAGENT_IMAGE_TAG="${KAGENT_IMAGE_TAG:-}"
fi

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

if $SOURCE_BUILD; then
  if [[ ! -d "${KAGENT_CHART_DIR}/helm/kagent" ]]; then
    echo "KAGENT_CHART_DIR=${KAGENT_CHART_DIR} has no helm/kagent directory." >&2
    exit 1
  fi
  if [[ -z "$KAGENT_IMAGE_TAG" ]]; then
    # The chart's default tag is the chart version, which for a source build is a
    # `git describe` stamp that matches nothing in any registry. Make the caller say
    # which locally built images to run rather than failing later on ImagePullBackOff.
    echo "KAGENT_IMAGE_TAG is required in source-build mode (the tag of your locally built images)." >&2
    exit 1
  fi
  echo "kagent chart:          ${KAGENT_CHART_DIR}/helm  (SOURCE BUILD — not what a reader installs)"
  echo "kagent images:         ${KAGENT_IMAGE_REGISTRY}/kagent-dev/kagent/*:${KAGENT_IMAGE_TAG}"
else
  echo "kagent chart:          ${KAGENT_VERSION}"
fi
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

# Side-load the locally built images into the node's containerd. This is why
# source-build mode needs no local registry: nothing is ever pulled, so the whole
# registry-plus-containerd-mirror arrangement the kagent dev loop uses is unnecessary.
# Only the controller and the UI are built — every other image the chart instantiates
# (Substrate workers, kagent-tools, kmcp, postgres) is published and pulls normally,
# and golang-adk is referenced as per-agent runtime config rather than deployed.
if $SOURCE_BUILD; then
  for image in controller ui; do
    run kind load docker-image \
      "${KAGENT_IMAGE_REGISTRY}/kagent-dev/kagent/${image}:${KAGENT_IMAGE_TAG}" \
      --name "$CLUSTER_NAME"
  done
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
# Ask the cluster for its issuer rather than assuming one: kind 1.37 advertises
# https://kubernetes.default.svc.cluster.local, and a mismatch is accepted at install
# time, surfacing later as \`token issuer ... not trusted\` on every kubectl-ate and
# ateapi call. kagent's own setup-cluster.sh and the install guide both derive it
# (kagent#2763, fixed in #2770).
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
# A source build installs the checkout's chart directories and pins the images to the
# ones built from it. Everything downstream of here is identical either way, so the two
# modes differ only in these four values.
if $SOURCE_BUILD; then
  CRDS_REF="${KAGENT_CHART_DIR}/helm/kagent-crds"
  CHART_REF="${KAGENT_CHART_DIR}/helm/kagent"
  VERSION_FLAG=""
  # IfNotPresent, because the images were side-loaded into the node with
  # `kind load docker-image` rather than pushed anywhere. The chart's default of Always
  # would send containerd to a registry that has never heard of this tag.
  IMAGE_FLAGS="--set registry=${KAGENT_IMAGE_REGISTRY} --set tag=${KAGENT_IMAGE_TAG} --set imagePullPolicy=IfNotPresent"
else
  CRDS_REF="$KAGENT_CRDS_CHART"
  CHART_REF="$KAGENT_CHART"
  VERSION_FLAG="--version ${KAGENT_VERSION}"
  IMAGE_FLAGS=""
fi

run_sh "helm upgrade --install kagent-crds ${CRDS_REF} ${VERSION_FLAG}" "
helm upgrade --install kagent-crds ${CRDS_REF} ${VERSION_FLAG} \
  --namespace ${NAMESPACE} --create-namespace --wait
"

# The key is interpolated inside the heredoc, so the printed form is the redacted one.
run_sh "helm upgrade --install kagent ${CHART_REF} ${VERSION_FLAG} ${IMAGE_FLAGS} -f - (apiKey redacted)" "
helm upgrade --install kagent ${CHART_REF} \
  ${VERSION_FLAG} ${IMAGE_FLAGS} \
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
