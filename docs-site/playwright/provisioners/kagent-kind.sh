#!/usr/bin/env bash
#
# Bring up a kind cluster with Agent Substrate + kagent installed, ready for the
# product-UI screenshot capture.
#
# This reproduces the install documented in:
#   content/kagent/1.x/setup/installation.md
# so the screenshots always match what a reader who follows the docs would see.
#
# The kagent version is read from the SAME conref that guide renders
# (assets/kagent-docs/versions/kagent.md, 1.x entry), not from "latest published".
# `kagent install` then installs the Agent Substrate release that kagent version bundles. That is the invariant to preserve: a capture must show what a
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
#   --dry-run     Print every kind/kagent/kubectl command without running it.
#   --no-cluster  Skip `kind create` and install into the current kube-context.
#   --delete      Delete the kind cluster and exit.
#
# Env (all have sane defaults):
#   CLUSTER_NAME      kind cluster name                     (default: kagent-shots)
#   NAMESPACE         kagent install namespace              (default: kagent)
#   KAGENT_VERSION    kagent release; must match the CLI    (default: read from docs conref)
#   NODE_IMAGE        kind node image                       (default: kindest/node:v1.37.0)
#   OPENAI_API_KEY    model provider key (required unless --dry-run)
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-kagent-shots}"
NAMESPACE="${NAMESPACE:-kagent}"
# Kubernetes 1.37+, per the install guide: Agent Substrate depends on the
# PodCertificateRequest and ClusterTrustBundle APIs, which are GA and on by default there.
NODE_IMAGE="${NODE_IMAGE:-kindest/node:v1.37.0}"

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

run() {
  echo "+ $*"
  $DRY_RUN || "$@"
}

if $DELETE; then
  run kind delete cluster --name "$CLUSTER_NAME"
  exit 0
fi

# Fail on a missing tool up front, naming it. Without this the first absent tool
# surfaces mid-run as its own unhelpful error, after the kind cluster already exists.
if ! $DRY_RUN; then
  missing=()
  for tool in kind kubectl kagent jq; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
  done
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

echo "kagent release: ${KAGENT_VERSION}"
echo

# --- Cluster -----------------------------------------------------------------------
# Skip creation when the cluster is already there, so a re-run after a failed install
# picks up where it left off instead of dying on `kind create`.
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
  run kind create cluster --name "$CLUSTER_NAME" --image "$NODE_IMAGE"
fi

# --- kagent + Agent Substrate --------------------------------------------------------
# One `kagent install`, exactly as the install guide runs it. It installs the CRDs,
# Agent Substrate, the substrate-podcert controller, a development PostgreSQL and kagent
# in order, and creates the identity material and database Secrets they need.
#
# This script used to install the substrate charts by hand and bootstrap the CA pools
# with kubectl-ate. Agent Substrate 0.5.0 broke that: the pod-certificate controller
# moved into its own substrate-podcert chart, so `podcertificate-controller-system` no
# longer existed when the pools were written, and substrate began reading pre-created
# PostgreSQL credentials that no chart creates. Every cluster run from 2026-10-13 on
# died at the first pool. The CLI owns that sequence now; do not reproduce it here.
#
# The CLI installs the charts of its own release, so KAGENT_VERSION pins the charts only
# because the CLI on PATH is that release. Refuse a mismatch rather than capture the
# wrong UI.
if ! $DRY_RUN; then
  cli_version="$(kagent version | jq -r .kagent_version)"
  if [[ "$cli_version" != "$KAGENT_VERSION" ]]; then
    echo "kagent CLI is ${cli_version}, but the docs pin ${KAGENT_VERSION}." >&2
    echo "Install the matching CLI; see the Prerequisites section of docs-site/playwright/README.md." >&2
    exit 1
  fi
fi

# `kagent install` takes no Helm flags; chart values reach it through a CLI config file,
# and a relative valuesFiles path resolves against that file's directory. gRPC reflection
# is the one value the install guide sets.
CONFIG_DIR="$(mktemp -d)"
trap 'rm -rf "$CONFIG_DIR"' EXIT
cat > "${CONFIG_DIR}/kagent-values.yaml" <<EOF
config:
  server:
    grpcReflection: true
EOF
cat > "${CONFIG_DIR}/kagent-config.yaml" <<EOF
install:
  kagent:
    valuesFiles: [kagent-values.yaml]
EOF

# Reads OPENAI_API_KEY from the environment.
run kagent --config "${CONFIG_DIR}/kagent-config.yaml" install --namespace "$NAMESPACE" --timeout 15m

run kubectl rollout status deployment/kagent-controller -n "$NAMESPACE" --timeout=300s
# The UI is a separate Deployment, and it is the one the capture actually needs.
run kubectl rollout status deployment/kagent-ui -n "$NAMESPACE" --timeout=300s

echo
echo "Ready. Port-forward the UI and capture:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/kagent-ui 8082:8080 &"
echo "  UI_BASE_URL=http://localhost:8082 npm run update:launch-ui"
echo
echo "Tear down with: $0 --delete"
