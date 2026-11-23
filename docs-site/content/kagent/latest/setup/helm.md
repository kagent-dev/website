---
title: Install with Helm
description: Install kagent and Agent Substrate from their Helm charts, against a PostgreSQL database that you provide.
weight: 6
author: kagent.dev
# This page lays out its own content, so skip the auto-generated child grid.
disableCards: true
---

{{< product-title title="Install with Helm" >}}

For a production installation that Helm manages from the start. To try kagent quickly instead, [install with the CLI]({{< link path="setup#install-kagent" >}}).

{{% panel title="Before you begin" id="before-you-begin" %}}
Have a Kubernetes cluster at version **1.37 or later**. For how to check an existing cluster, see the [install guide]({{< link path="setup/installation#before-you-begin" >}}).
{{% /panel %}}

{{% panel title="Steps" id="steps" %}}
Follow the steps in order, because each one creates what the next one needs.

1. [Get the tools and a database](#install-with-helm)
2. [Install the CRDs](#install-the-crds)
3. [Set up certificates and identity](#set-up-certificates-and-identity)
4. [Prepare the PostgreSQL database](#prepare-postgres)
5. [Install Agent Substrate](#install-agent-substrate)
6. [Install kagent](#install-kagent-helm)
{{% /panel %}}

{{% panel title="Get the tools and a database" id="install-with-helm" %}}
{{< include-section page="installation" heading="Install with Helm" local="install-kagent-helm" >}}
{{% /panel %}}

{{% panel title="Verify the installation" id="verify-the-installation" %}}
{{< include-section page="installation" heading="Verify the installation" >}}
{{% /panel %}}
