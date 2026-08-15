---
title: Version Support
linkTitle: Version Support
description: Which Kubernetes version kagent is tested against.
weight: 4
author: kagent.dev
---

kagent's CI tests against Kubernetes {{< reuse "versions/max-kube.md" >}} today.

Only the latest kagent release is supported. The tested Kubernetes version above applies to that release. Older kagent releases are not maintained or supported, regardless of which Kubernetes version they were originally tested against.

The tested version is sourced from `KIND_IMAGE_VERSION` in the [kagent Makefile](https://github.com/kagent-dev/kagent/blob/main/Makefile), which pins the [kindest/node](https://hub.docker.com/r/kindest/node) image used in [CI](https://github.com/kagent-dev/kagent/blob/main/.github/workflows/ci.yaml). CI tests one Kubernetes minor version at a time, not a matrix.

Kubernetes versions other than the one listed above are not tested in CI and are not guaranteed to work, though kagent's Kubernetes client libraries generally follow the [client-go version skew policy](https://github.com/kubernetes/client-go#compatibility-matrix).

This page should be updated whenever `KIND_IMAGE_VERSION` changes in the kagent Makefile. The value is sourced from `docs-site/assets/versions/max-kube.md`.
