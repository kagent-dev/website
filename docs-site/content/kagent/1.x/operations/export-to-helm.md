---
title: Export a CLI installation to Helm
description: Move a CLI installation to Helm so that you can keep its values in version control and apply changes from a CI/CD pipeline.
weight: 45
author: kagent.dev
---

The kagent CLI installs kagent quickly for an evaluation. To manage the installation with Helm afterward, such as to review changes in a pull request and apply them from a continuous integration and continuous delivery (CI/CD) pipeline, export the installation.

The `kagent install` command installs several Helm releases. The command computes the values for each release from your CLI configuration file, its own flags, and the settings that it generates. The `--dry-run` flag writes those Helm commands and values to a directory and leaves the cluster unchanged. You commit that directory to a repository, and the directory becomes the record of the installation.

After you apply the export, manage the installation only with Helm. `kagent install` applies the values from your CLI configuration file, so running it against the cluster again overwrites the changes that you make in the exported values files.

The export contains only the Helm releases. `kagent install` also creates the Agent Substrate identity pools, the development PostgreSQL database, and the database connection Secrets. The export does not include these resources, so this guide applies the export to a cluster where `kagent install` already created them.

## Before you begin

1. Install kagent with the kagent CLI, as described in [Install kagent]({{< link path="setup/installation#install-kagent" >}}). Keep the CLI configuration file that passes Helm values to `kagent install`, and the values files that it references. The CLI reads the configuration file from one of the following locations:
   * The path that you passed with the `--config` flag, such as `kagent-config.yaml`.
   * When you omit `--config`, `~/.config/kagent/config.yaml` on Linux or `~/Library/Application Support/kagent/config.yaml` on macOS.

   If you omitted `--config` and the default file does not exist, the installation used only default values. In that case, omit `--config` from the export command.

2. Install [`helm` 3](https://helm.sh/docs/intro/install/), the Kubernetes package manager. The export requires Helm and access to the charts, but not a connection to the cluster.

## Export the installation

The export must reproduce the installation that runs in your cluster, so run the export with the same configuration file and flags that you installed with.

1. Export the installation to the `kagent-install` directory. The directory must not already exist. The command does not read your model provider API key, so the key does not need to be set. If you installed with the `--skip-database-setup` flag, add the flag to this command too. Otherwise, the exported values connect kagent and Agent Substrate to the development database.
   ```bash
   kagent --config kagent-config.yaml install --namespace kagent --dry-run --output-dir ./kagent-install
   ```

2. Review the files in the directory. The export writes one script, one README file, and one values file for each Helm release.
   ```text
   kagent-install/
   ├── README.md
   ├── install.sh
   └── values/
       ├── kagent-crds.yaml
       ├── substrate-crds.yaml
       ├── substrate-podcert.yaml
       ├── substrate.yaml
       └── kagent.yaml
   ```

   Each values file contains every value that the CLI sets for that release, merged from your values files and the settings that the CLI generates. Chart defaults are not included. A local chart directory in your CLI configuration becomes an absolute path in `install.sh`, so that directory must still exist when you apply the export.

3. Review every values file before you commit the directory or share it. The export copies the values from your own values files as supplied, and does not detect or remove a secret in them. The export replaces only the model provider API key, with a reference to the environment variable that holds the key, such as `${OPENAI_API_KEY}`.

## Apply the export

The `install.sh` script runs `helm upgrade --install` for each release, in installation order, against your current kubeconfig context. In a cluster that `kagent install` set up, the releases already exist, so the script upgrades each release in place with the same values.

1. Confirm that your kubeconfig points at the cluster that runs kagent.
   ```bash
   kubectl config current-context
   ```

2. Set the environment variable for your model provider API key. The `README.md` file in the export lists each variable that the script reads.
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. Run the script. Helm does not expand environment variables in a values file, so `helm upgrade -f values/kagent.yaml` installs the literal text `${OPENAI_API_KEY}` as the API key. Always apply the export by using the script. The script passes the API key to Helm by using the `--set-file` flag, through a private temporary file that the script deletes when it exits.
   ```bash
   sh ./kagent-install/install.sh
   ```

4. Confirm that the releases are deployed. The `STATUS` column shows `deployed` for `kagent-crds`, `kagent`, `substrate-crds`, `substrate`, and `substrate-podcert`.
   ```bash
   helm list -A --filter 'kagent|substrate'
   ```

## Manage the installation with Helm

To change a value after you apply the export, edit the values file for that release in the exported directory, and run `install.sh` again. Commit the change to the repository so that the directory stays the record of the installation.
