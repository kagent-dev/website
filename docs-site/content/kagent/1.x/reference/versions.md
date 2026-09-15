---
title: Version support
description: Review what a kagent release includes, which Kubernetes version it is tested against, and which upgrades are supported.
weight: 60
author: kagent.dev
---

Only the latest kagent release is supported. The versions on this page apply to that release.

## What a kagent release includes

The kagent Helm chart pulls in {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}} and two other components as subcharts, each on its own release cadence. Because a kagent release pins one version of each, the pinned versions are the combination that kagent is built and tested against.

| Component | Version | What it provides |
| --------- | ------- | ---------------- |
| kagent | {{< reuse "kagent-docs/versions/kagent.md" >}} | The controller, the gRPC API, and the agent runtimes. |
| Agent Substrate | {{< reuse "kagent-docs/versions/agent-substrate.md" >}} | The {{< gloss "Actor" >}}Actor{{< /gloss >}} runtime that every agent runs on, including sandboxing, snapshots, and the {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}}. |
| kmcp | {{< reuse "kagent-docs/versions/kmcp.md" >}} | The MCP server toolkit and its controller. |
| kagent-tools | {{< reuse "kagent-docs/versions/kagent-tools.md" >}} | The bundled tool server that the built-in RemoteMCPServer points at. |

> [!IMPORTANT]
> Do not upgrade Agent Substrate independently of kagent. Substrate folds schema changes into a single baseline migration before its own release, so an existing database keeps its recorded schema version and never applies the change. The cluster then looks healthy, agents answer normally, and every checkpoint operation fails at runtime against a table that was renamed. Install the substrate version that your kagent release pins.

## Kubernetes versions

kagent's CI tests one Kubernetes minor version at a time rather than a matrix, so there is a single tested version rather than a supported range.

kagent's CI tests against Kubernetes {{< reuse "kagent-docs/versions/max-kube.md" >}} today. That version is sourced from `KIND_IMAGE_VERSION` in the [kagent Makefile](https://github.com/kagent-dev/kagent/blob/main/Makefile), which pins the [kindest/node](https://hub.docker.com/r/kindest/node) image that [CI](https://github.com/kagent-dev/kagent/blob/main/.github/workflows/ci.yaml) uses.

Other Kubernetes versions are not exercised in CI and are not guaranteed to work. kagent's Kubernetes client libraries generally follow the [client-go version skew policy](https://github.com/kubernetes/client-go#compatibility-matrix).

## Release support and compatibility

kagent 1.0 is a deliberate clean break from the 0.10.x line, and the compatibility promises start rather than continue at 1.0.

| Upgrade path | Supported |
| ------------ | --------- |
| 0.10.x to 1.0 in place | No. An existing 0.10.x database requires a new PostgreSQL database, because there is no migration bridge. |
| 1.0 back to 0.10.x | No. Downgrade across the 1.0 boundary is unsupported. |
| 1.0 forward to a later minor release | Yes. From 1.0 onward, migrations are append-only and each minor release retains compatibility with the previous release line. |

Moving from 0.10.x therefore means standing up a new installation and recreating your resources on it, rather than running `helm upgrade`. For the procedure, see [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x#in-place-upgrade-blockers" >}}). For the resources that 1.0 replaces or removes, see [Release notes]({{< link path="reference/release-notes/1.0#removed-and-replaced-resources" >}}).

<!--TODO
The agent-substrate, kmcp, kagent-tools, and max-kube conrefs are overwritten
nightly by the update-version-conrefs job in .github/workflows/update-ref-docs.yaml.
Correct a wrong value in that job, not in the conref, or the next run reverts it.
kagent.md is the exception and is hand-maintained.
-->
