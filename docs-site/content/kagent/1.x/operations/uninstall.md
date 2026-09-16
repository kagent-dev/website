---
title: Uninstall
description: Remove kagent and Agent Substrate from a cluster, including the identity material and storage that Helm does not own.
weight: 50
author: kagent.dev
---

Helm removes what its releases own, but does not uninstall the identity material and some storage that it does not own.

Helm removes:

- Every `kagent.dev` and `ate.dev` custom resource definition, and with them every Harness, AgentTemplate, WorkerPool, and SandboxConfig in the cluster
- kagent's bundled PostgreSQL volume, holding all conversation state
- The object storage volume holding every Actor snapshot
- The `podcertificate-controller-system` namespace, with the service DNS and pod identity CA pools inside it

Helm leaves behind:

- The actor identity pools that the install created in `ate-system` with `kubectl ate`, and the `ate-api-authentication` ConfigMap beside them
- Agent Substrate's PostgreSQL volume, `data-postgres-0`, because a StatefulSet volume claim outlives its release
- The `kagent` and `ate-system` namespaces

This guide includes both Helm steps to uninstall its owned components, and manual steps to remove separate material that can block a later reinstallation.

## Before you begin

1. Confirm that you have administrative access to the cluster.
2. Back up any Harness, AgentTemplate, and ModelConfig definitions that you want to keep.
3. Confirm that nothing outside kagent depends on the agents that you are removing.

> [!CAUTION]
> Uninstalling deletes every kagent resource in every namespace, along with all agent conversation state and all stored snapshots. None of it can be recovered afterward. Back up anything you want to keep before you start.

## Uninstall kagent

Remove the kagent release before the CRDs release, because deleting the definitions first strands the controller.

1. Uninstall the kagent chart.
   ```bash
   helm uninstall kagent -n kagent
   ```

2. Uninstall the CRDs chart. This step deletes every `kagent.dev` custom resource definition, and Kubernetes deletes every resource of those kinds across all namespaces with them.
   ```bash
   helm uninstall kagent-crds -n kagent
   ```

> [!NOTE]
> The `kagent uninstall` command removes the same two releases in the same order, and it is a convenience rather than a different path. It does not touch Agent Substrate, so the rest of this page still applies. Prefer Helm, for the same reason that the install guide does: the CLI does not manage the Agent Substrate layer.

## Uninstall Agent Substrate

Agent Substrate is a separate installation in the `ate-system` namespace, and no kagent command removes it.

1. Uninstall the Agent Substrate chart.
   ```bash
   helm uninstall substrate -n ate-system
   ```

2. Uninstall the Agent Substrate CRDs chart, which deletes the `workerpools`, `sandboxconfigs`, and `csidriverconfigs` definitions.
   ```bash
   helm uninstall substrate-crds -n ate-system
   ```

## Remove the identity material

The install created the actor identity pools with the `kubectl ate` plugin instead of Helm, so no release owns them and no uninstall removes them. A later install that tries to create a pool that already exists fails with a message naming the secret.

```console
Error: while uploading pool state to secret: secrets "actor-id-jwt-pool" already exists
```

The service DNS and pod identity CA pools do not need to be manually removed. Because the install created them inside `podcertificate-controller-system`, a namespace that the Agent Substrate chart owns, `helm uninstall substrate` deletes that namespace and the pools along with it.

1. Delete the actor identity pools and the material derived from them.
   ```bash
   kubectl delete secret actor-id-jwt-pool actor-id-ca-pool actor-id-ca-certs -n ate-system
   kubectl delete configmap ate-api-authentication -n ate-system
   ```

2. Delete the Agent Substrate database volume, which a StatefulSet volume claim keeps alive after its release is gone.
   ```bash
   kubectl delete pvc data-postgres-0 -n ate-system
   ```

> [!IMPORTANT]
> Deleting `data-postgres-0` matters even if you plan to reinstall immediately. Agent Substrate folds its schema changes into a single baseline migration before release, so a database that survives from an earlier version keeps that migration marked as applied and never picks up the new schema. The cluster then looks healthy and fails later, at the first checkpoint operation.

## Remove the namespaces

Deleting the namespaces removes anything that the preceding steps missed, including volumes left by optional components.

```bash
kubectl delete namespace kagent ate-system
```

Confirm that nothing remains.

```bash
kubectl get crd | grep -E 'kagent\.dev|ate\.dev'
kubectl get ns kagent ate-system podcertificate-controller-system
```

The first command prints nothing. The second reports that it found none of the three namespaces.
