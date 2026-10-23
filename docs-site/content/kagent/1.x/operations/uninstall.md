---
title: Uninstall
description: Remove kagent, Agent Substrate, and the development database from a cluster with the kagent CLI.
weight: 50
author: kagent.dev
---

The `kagent uninstall` command removes everything that `kagent install` created. That includes the material that no Helm release owns, such as the identity pools, the development PostgreSQL database, and the cluster-scoped trust bundles. The command removes the components in a fixed order, so that each controller can clear its finalizers before the command deletes that controller.

The command removes:

- The `kagent`, `kagent-crds`, `substrate`, `substrate-podcert`, and `substrate-crds` Helm releases
- Every `kagent.dev` and `ate.dev` custom resource definition, and with them every resource of those kinds in every namespace, such as Agents, Harnesses, ModelConfigs, and SandboxTemplates
- The development PostgreSQL database that `kagent install` deployed, together with its PersistentVolumeClaim and the data on it
- The `ate-system` and `podcertificate-controller-system` namespaces, and the identity pools and certificate authorities in them
- The ClusterTrustBundles that publish the Agent Substrate certificate authorities

The command keeps the `kagent` namespace and anything else in it. A database that `kagent install` did not deploy also stays, such as the database for an installation that used the `--skip-database-setup` flag.

## Before you begin

1. Confirm that you have administrative access to the cluster.
2. Confirm that your kubeconfig points at the cluster that you want to uninstall from. The command prints the name of the current context.
   ```bash
   kubectl config current-context
   ```
3. Back up any Harness, AgentTemplate, and ModelConfig definitions that you want to keep.
4. Confirm that nothing outside kagent depends on the agents that you are removing.

> [!CAUTION]
> Uninstalling deletes every kagent resource in every namespace, along with all agent conversation state in the development database and all stored snapshots. You cannot recover any of it afterward. Back up anything you want to keep before you start.

## Uninstall kagent

Uninstall kagent with the kagent CLI, and then remove the namespace that the command keeps. The command waits for each Helm release to finish its removal, so the uninstall takes about a minute.

1. Uninstall kagent. When kagent runs in a namespace other than `kagent`, add the `--namespace` flag with that namespace. If the namespace does not match, the command stops before it deletes anything, and prints the namespace to use.
   ```bash
   kagent uninstall
   ```

   Example output:
   ```console
   kagent uninstalled successfully

   The kagent namespace stays, with anything else in it. To delete it and everything it holds:
     kubectl delete namespace kagent
   ```

   When a step fails, the command exits with a non-zero status. Run the command again to finish the uninstall. Each step skips what is already gone, and prints a warning for a release that no longer exists.

2. Optional: Delete the `kagent` namespace and everything that remains in it, such as Secrets that you created for your agents.
   ```bash
   kubectl delete namespace kagent
   ```

3. Confirm that no kagent or Agent Substrate definitions remain.
   ```bash
   kubectl get crd | grep -E 'kagent\.dev|ate\.dev'
   kubectl get ns ate-system podcertificate-controller-system
   ```

   The first command prints nothing. The second reports that it found neither namespace.
