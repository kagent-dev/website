---
title: Upgrade
description: Upgrade a kagent 1.x installation and Agent Substrate to a later release.
weight: 35
author: kagent.dev
---

An installation of {{< reuse "kagent-docs/snippets/name-product.md" >}} consists of five Helm releases. Upgrade the releases in the order that you installed them, starting with the CRDs, then Agent Substrate, and then the kagent control plane.

Upgrade through each release in order, and do not skip a release. For example, to move from 1.0.0 to 1.0.2, upgrade to 1.0.1 first, and then to 1.0.2. To move to a new minor version, upgrade from the last patch release of the previous minor version, such as from 1.0.2 to 1.1.0. To move a 0.10.x installation to 1.x, see [Upgrade from 0.x]({{< link path="operations/upgrade-from-0x" >}}) instead.

<!-- REVIEW: kagent is moving from semantic versioning to calendar versioning. The release-order examples in the preceding paragraph, the version variables in "Prepare to upgrade", and the release-order rule itself assume semver. Rewrite them when the calendar version format is published. -->

## Prepare to upgrade

Complete every step in this section before you change any release. The steps make sure that Helm manages the installation, back up the database, save the configuration of each release, and set the target versions that the upgrade commands use.

1. If you installed with the kagent CLI, export the installation to Helm first. The `kagent install` command is for getting started, and the upgrade commands in this guide use Helm. For the steps, see [Export a CLI installation to Helm]({{< link path="operations/export-to-helm" >}}). An installation that you [installed with Helm]({{< link path="setup/installation#install-with-helm" >}}) needs no export.

2. Read the [kagent release notes](https://github.com/kagent-dev/kagent/releases) for every release between your current version and the target version. A release can rename or remove a Helm value, and the chart fails to render when a removed value is still set.

3. Confirm the installed version of each release.
   ```bash
   helm list -A --filter 'kagent|substrate'
   ```
   The output lists five releases. The `CHART` column shows the version of each release.
   * The `kagent` and `kagent-crds` releases are in the `kagent` namespace.
   * The `substrate` and `substrate-crds` releases are in the `ate-system` namespace.
   * The `substrate-podcert` release is in the `podcertificate-controller-system` namespace.

4. Back up the PostgreSQL database that kagent and Agent Substrate share. The upgrade keeps your data. However, the kagent controller and the Agent Substrate API server change the database schema when they start on the new version. To return to the previous version, you must restore the backup.
   ```bash
   pg_dump "postgresql://<user>:<password>@<host>:5432/kagent" \
     --format=custom \
     --file=kagent-backup.dump
   ```

5. Save the values of each release to a file. The upgrade commands reapply these files, so each release keeps its database settings and model provider settings. The `--reuse-values` flag also reapplies the defaults of the previous chart version, and the new chart can reject a default that it removed. Do not use that flag.
   ```bash
   helm get values substrate-podcert -n podcertificate-controller-system -o yaml > substrate-podcert-values.yaml
   helm get values substrate -n ate-system -o yaml > substrate-values.yaml
   helm get values kagent -n kagent -o yaml > kagent-values.yaml
   ```
   For an installation that you exported from the kagent CLI, the `kagent-values.yaml` file contains your model provider API key in plain text. Store the files securely.

6. Save the target versions in environment variables. The following values are the versions that this documentation describes. To step through an earlier release first, set the versions of that release.
   ```bash
   export KAGENT_VERSION={{< reuse "kagent-docs/versions/kagent.md" >}}
   export SUBSTRATE_VERSION={{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   ```

## Upgrade the CRDs

Upgrade the kagent and Agent Substrate custom resource definitions (CRDs) before the controllers that read them. Both charts ship the CRDs as templates, so `helm upgrade` updates the CRDs in place.

1. Upgrade the kagent CRDs.
   ```bash
   helm upgrade kagent-crds \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent-crds.md" >}} \
     --version ${KAGENT_VERSION} \
     --namespace kagent --wait
   ```

2. Upgrade the Agent Substrate CRDs.
   ```bash
   helm upgrade substrate-crds \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate-crds \
     --version ${SUBSTRATE_VERSION} \
     --namespace ate-system --wait
   ```

## Upgrade Agent Substrate

Upgrade the Agent Substrate PodCertificate controller, followed by the Agent Substrate control plane and data plane. The kagent controller connects to the Agent Substrate API server, so Agent Substrate moves to the new version first.

<!-- REVIEW: Order not verified. Confirm with engineering that a new Agent Substrate accepts calls from the previous kagent controller during the window between these two sections. -->

1. Upgrade the PodCertificate controller.
   ```bash
   helm upgrade substrate-podcert \
     oci://ghcr.io/kagent-dev/substrate/helm/substrate-podcert \
     --version ${SUBSTRATE_VERSION} \
     --namespace podcertificate-controller-system \
     --wait --timeout 5m \
     -f substrate-podcert-values.yaml
   ```

2. Upgrade Agent Substrate.
   ```bash
   helm upgrade substrate \
     {{< reuse "kagent-docs/snippets/helm-substrate.md" >}} \
     --version ${SUBSTRATE_VERSION} \
     --namespace ate-system \
     --wait --timeout 10m \
     -f substrate-values.yaml
   ```

3. Confirm that the Agent Substrate pods are running.
   ```bash
   kubectl get pods -n ate-system
   ```
   In the output, verify that every pod reports `Running` and that every container is ready. A pod that belongs to a Job, such as the snapshot bucket setup Job, reports `Completed`.

## Upgrade kagent {#upgrade-kagent}

Upgrade the kagent control plane. The upgrade has no separate migration step.

1. Upgrade kagent. The saved values pin the Worker image to the previous Agent Substrate version, so the command sets the image again after the values file. A later `-f` file overrides an earlier one.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version ${KAGENT_VERSION} \
     --namespace kagent --timeout 12m \
     -f kagent-values.yaml \
     -f - <<EOF
   substrateWorkerPool:
     workerImage: "ghcr.io/kagent-dev/substrate/ateworker-gvisor:v${SUBSTRATE_VERSION}"
   EOF
   ```

2. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```
   ```console
   deployment "kagent-controller" successfully rolled out
   ```

## Verify the upgrade

Confirm that every release runs the new version and that the agents are ready.

1. Confirm that each release reports the target version.
   ```bash
   helm list -A --filter 'kagent|substrate'
   ```
   For the `kagent` and `kagent-crds` releases, the `CHART` column shows the target kagent version. For the `substrate`, `substrate-crds`, and `substrate-podcert` releases, the `CHART` column shows the target Agent Substrate version.

2. Confirm that the kagent pods are running.
   ```bash
   kubectl get pods -n kagent
   ```
   In the output, verify that every pod reports `Running`. An installation that uses the development database also lists a `kagent-postgresql` pod.
   ```console
   NAME                                              READY   STATUS    RESTARTS   AGE
   kagent-controller-56c67b6cd7-hqj5z                1/1     Running   0          2m
   kagent-default-774d4496bd-sfx4b                   1/1     Running   0          2m
   kagent-postgresql-856b475f59-n258n                2/2     Running   0          2m
   kagent-tools-54959b659c-lfkrz                     1/1     Running   0          2m
   kagent-ui-5fdb6fd85c-vzb2z                        1/1     Running   0          2m
   ```

   If the controller restarts in a loop, see [The controller restarts after an upgrade]({{< link path="operations/debug#controller-restarts-after-upgrade" >}}).

3. Confirm that the WorkerPool reports a ready replica.
   ```bash
   kubectl get workerpools -n kagent
   ```
   In the output, verify that the `READY` column matches the `DESIRED` column, and that the `RESOLVED` column reports `True`.
   ```console
   NAME             DESIRED   REPLICAS   READY   SANDBOXCONFIG    RESOLVED   AGE
   kagent-default   1         1          1       gvisor-default   True       2m
   ```

4. Confirm that your agents are ready.
   ```bash
   kubectl get agents -A
   ```
   In the output, verify that every Agent reports `True` in the `READY` column.
   ```console
   NAMESPACE   NAME       READY   AGE
   kagent      my-agent   True    3d
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Review the production values for replicas, resources, and storage." >}}
  {{< card link=`{{< link path="operations/debug" >}}` title="Debug" subtitle="Diagnose a controller or Agent that does not become ready." >}}
{{< /cards >}}
