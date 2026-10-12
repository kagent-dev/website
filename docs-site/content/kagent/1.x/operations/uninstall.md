---
title: Uninstall
description: Remove kagent and Agent Substrate from a cluster, including the identity material and storage that Helm does not own.
weight: 50
author: kagent.dev
---

Helm removes what its releases own, but does not uninstall the identity material, development database resources, and some storage that it does not own.

Helm removes:

- Every `kagent.dev` and `ate.dev` custom resource definition, and with them every Harness, AgentTemplate, WorkerPool, and SandboxConfig in the cluster
- The object storage volume holding every Actor snapshot

Helm leaves behind:

- The development PostgreSQL Deployment, Service, Secret, and PersistentVolumeClaim that `kagent install` created in the kagent namespace
- The actor identity pools and the `ate-api-authentication` ConfigMap that the install created in `ate-system`
- The service DNS, pod identity, and PostgreSQL certificate authority pools that the install created in `podcertificate-controller-system`
- The `kagent`, `ate-system`, and `podcertificate-controller-system` namespaces

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
> The `kagent uninstall` command is a convenience path that removes the same two kagent releases in the same order. It does not remove Agent Substrate or the development PostgreSQL resources that `kagent install` created, so the rest of this page still applies.

## Uninstall Agent Substrate

Agent Substrate is a separate installation in the `ate-system` namespace, and no kagent command removes it.

1. Uninstall the Agent Substrate chart.
   ```bash
   helm uninstall substrate -n ate-system
   ```

2. Uninstall the Substrate PodCertificate chart.
   ```bash
   helm uninstall substrate-podcert -n podcertificate-controller-system
   ```

3. Uninstall the Agent Substrate CRDs chart, which deletes the `workerpools`, `sandboxconfigs`, and `csidriverconfigs` definitions.
   ```bash
   helm uninstall substrate-crds -n ate-system
   ```

## Remove the identity material

The `kagent install` command created the identity pools outside Helm, so no release owns them and no uninstall removes them. A later install that tries to create a pool that already exists fails with a message naming the secret.

```console
Error: while uploading pool state to secret: secrets "actor-id-jwt-pool" already exists
```

1. Delete the actor identity pools and the material derived from them.
   ```bash
   kubectl delete secret actor-id-jwt-pool actor-id-ca-pool actor-id-ca-certs -n ate-system
   kubectl delete configmap ate-api-authentication -n ate-system
   ```

2. Delete the service DNS, pod identity, and PostgreSQL CA pools.
   ```bash
   kubectl delete secret -n podcertificate-controller-system \
     service-dns-ca-pool pod-identity-ca-pool postgres-ca-pool
   ```

3. Delete the development PostgreSQL resources that `kagent install` created.
   ```bash
   kubectl delete -n kagent \
     deployment/kagent-postgresql \
     service/kagent-postgresql \
     configmap/kagent-postgresql \
     secret/kagent-postgres \
     pvc/kagent-postgresql \
     --ignore-not-found
   ```

> [!IMPORTANT]
> Deleting the development PostgreSQL PersistentVolumeClaim removes all conversation state that the development install stored. Back up anything that you need before you delete it.

## Remove the namespaces

Deleting the namespaces removes anything that the preceding steps missed, including volumes left by optional components.

```bash
kubectl delete namespace kagent ate-system podcertificate-controller-system
```

Confirm that nothing remains.

```bash
kubectl get crd | grep -E 'kagent\.dev|ate\.dev'
kubectl get ns kagent ate-system podcertificate-controller-system
```

The first command prints nothing. The second reports that it found none of the three namespaces.
