---
title: Install with Helm
description: Get a Helm-managed kagent installation running with one command, then change it with Helm.
weight: 6
author: kagent.dev
# This page lays out its own content, so skip the auto-generated child grid.
disableCards: true
---

{{< tutorial-banner title="Install with Helm" text="Get a Helm installation running with one command, then manage it with Helm from there. For a production setup with your own database, follow Advanced Install." cta="Get it running" anchor="get-it-running" art="logo" >}}

kagent installs as six Helm releases: two for the custom resource definitions, three for Agent Substrate, and one for kagent itself. The charts need some things to exist first, such as the identity material that Agent Substrate signs with, and a PostgreSQL database.

The `kagent install` command does that preparation and then runs Helm for each chart, in the right order. So the simplest way to a Helm installation is to let the CLI create it, and then use Helm for everything after that.

| You want | Follow |
| --- | --- |
| A working installation to try, managed with Helm | [Get it running](#get-it-running), on this page |
| A production installation with your own PostgreSQL, where you run every chart yourself | [Advanced Install]({{< link path="setup/installation#install-with-helm" >}}) |
| Every value that the kagent chart accepts | The [Helm reference]({{< link path="reference/helm" >}}) |

{{% panel title="Get it running" id="get-it-running" %}}
1. Complete [Before you begin]({{< link path="setup#before-you-begin" >}}) on the Install page: the tools, a Kubernetes cluster at 1.37 or later, and your model provider API key.

2. Install. The command creates the six releases, a development PostgreSQL database, and the default harnesses.
   ```bash
   curl -sL https://kagent.dev/install | bash && kagent install
   ```

   To use a provider other than OpenAI, see [Install with CLI]({{< link path="setup#install-kagent" >}}).

3. List the releases.
   ```bash
   helm list -A
   ```

   Example output:
   ```console
   NAME               NAMESPACE                          STATUS    CHART
   kagent             kagent                             deployed  kagent-{{< reuse "kagent-docs/versions/kagent.md" >}}
   kagent-crds        kagent                             deployed  kagent-crds-{{< reuse "kagent-docs/versions/kagent.md" >}}
   substrate          ate-system                         deployed  substrate-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-atelet   ate-system                         deployed  substrate-atelet-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-crds     ate-system                         deployed  substrate-crds-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   substrate-podcert  podcertificate-controller-system   deployed  substrate-podcert-{{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}}
   ```

4. Open the UI with `kagent dashboard`, and [build your first agent]({{< link path="get-started" >}}).
{{% /panel %}}

{{% panel title="Change a setting with Helm" id="change-a-setting" %}}
From here on, the installation is yours to manage with Helm. To see the values that a release was installed with, run this command.

```bash
helm get values kagent -n kagent
```

To change a setting, put it in a values file, and upgrade the release with `--reuse-values`, so that the release keeps its other values. This example sets the sandbox guest image, which [sandbox templates]({{< link path="get-started/sandbox-template" >}}) need.

1. Save the setting.
   ```bash
   cat > sandbox-values.yaml <<'EOF'
   config:
     sandboxes:
       guestImage: {{< reuse "kagent-docs/versions/sandbox-guest-image.md" >}}
   EOF
   ```

2. Upgrade the release at the chart version that is installed.
   ```bash
   export KAGENT_CHART_VERSION=$(helm list -n kagent -o json \
     | jq -er '.[] | select(.name == "kagent") | .chart | ltrimstr("{{< reuse "kagent-docs/snippets/helm-kagent.md" >}}-")')
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --namespace kagent --version "$KAGENT_CHART_VERSION" \
     --reuse-values -f sandbox-values.yaml --wait
   ```

> [!IMPORTANT]
> After you change a release with Helm, do not run `kagent install` against the cluster again. It applies its own values, and overwrites your changes.

To keep the Helm commands and values of the installation in a Git repository, export them. See [Export a CLI installation to Helm]({{< link path="operations/export-to-helm" >}}).
{{% /panel %}}

{{% panel title="Go further" id="go-further" %}}
The installation that you now have uses a development database and evaluation defaults. For production, install each chart yourself, against a PostgreSQL database that you provide. Advanced Install walks through it in six steps.

1. [Get the tools and a database]({{< link path="setup/installation#install-with-helm" >}})
2. [Install the CRDs]({{< link path="setup/installation#install-the-crds" >}})
3. [Set up certificates and identity]({{< link path="setup/installation#set-up-certificates-and-identity" >}})
4. [Prepare the PostgreSQL database]({{< link path="setup/installation#prepare-postgres" >}})
5. [Install Agent Substrate]({{< link path="setup/installation#install-agent-substrate" >}})
6. [Install kagent]({{< link path="setup/installation#install-kagent-helm" >}})

{{< cards cols="3" >}}
  {{< card title="Advanced Install" subtitle="Every chart, in order, with your own database." path="/setup/installation/#install-with-helm" >}}
  {{< card title="Helm reference" subtitle="Every value of the kagent chart." path="/reference/helm/" >}}
  {{< card title="Operational considerations" subtitle="What to change before production." path="/operations/operational-considerations/" >}}
{{< /cards >}}
{{% /panel %}}
