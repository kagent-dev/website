---
title: Kubernetes Compatibility
linkTitle: Kubernetes Compatibility
description: Which Kubernetes versions kagent is tested and supported against.
weight: 4
author: kagent.dev
---

kagent's CI tests against Kubernetes {{</* reuse "versions/max-kube.md" */>}} today. Below is a history of which Kubernetes version each release was tested against, and the policy we follow going forward.

## Compatibility matrix

| kagent version | Kubernetes version tested | Status |
|---|---|---|
| v0.7.11 and later (including main) | 1.35 | Supported |
| v0.6.16 to v0.7.10 | 1.34 | Supported |
| Earlier than v0.6.16 | 1.33 and earlier | Untested, best effort only |

The tested version comes from `KIND_IMAGE_VERSION` in the [kagent Makefile](https://github.com/kagent-dev/kagent/blob/main/Makefile). This pins the [kindest/node](https://hub.docker.com/r/kindest/node) image used to spin up the Kind cluster in [CI](https://github.com/kagent-dev/kagent/blob/main/.github/workflows/ci.yaml). Right now CI only exercises one Kubernetes minor version per release, not a matrix.

## Support policy

kagent tests and supports one Kubernetes minor version per release: whatever `KIND_IMAGE_VERSION` was pinned to when that release was cut. We want to move to an N-2 policy (current version plus the two before it) once CI actually runs a version matrix instead of a single pinned version.

Versions not listed in the table above are not tested in CI. They might still work. kagent's Kubernetes client libraries (client-go, k8s.io/api, k8s.io/apimachinery) follow the [official client-go skew policy](https://github.com/kubernetes/client-go#compatibility-matrix), which generally supports API servers within one minor version of the client. That said, kagent does not guarantee compatibility outside the versions above.

## Keeping this page current

Update this page whenever `KIND_IMAGE_VERSION` changes in the kagent Makefile, or when a new kagent version ships. The current tested version is sourced from `docs-site/assets/versions/max-kube.md`. Update that file, then add a new row to the table for the release.
