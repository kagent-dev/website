---
title: Install kagent
# Sidebar and breadcrumb label. The section leads the left nav as "Install".
linkTitle: Install
# Left-nav entries under Install for this page's panels (see `sidebarLinks`
# in layouts/_partials/sidebar.html). Install with Helm is its own page,
# helm.md, and lists itself.
sidebarLinks:
  - title: Before you begin
    anchor: before-you-begin
  - title: Install with CLI
    anchor: install-kagent
description: Install kagent and configure the model providers that your agents use.
weight: 5
author: kagent.dev
# This page lays out its own cards, so skip the auto-generated child grid.
disableCards: true
# Tab groups with the same tab names switch together, so picking a provider for
# the API key also picks it for the install command.
tabs:
  sync: true
---

{{< product-title title="Install kagent" >}}

{{% panel title="Before you begin" id="before-you-begin" %}}
1. Install the following tools.
   * [`kubectl`](https://kubernetes.io/docs/tasks/tools/#kubectl), the Kubernetes command line tool.
   * [`helm`](https://helm.sh/docs/intro/install/) 3, the Kubernetes package manager. The kagent CLI runs `helm` to install each chart.
   * [`kind`](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) v0.32.0 or later, only if you create a local cluster.

2. Have a Kubernetes cluster at version **1.37 or later**.

   {{< tabs >}}
   {{% tab name="Local Kind" %}}
   Create a local kind cluster.<span class="kind-tab-marker"></span>
   ```bash
   kind create cluster --name kagent --image kindest/node:v1.37.0
   ```
   {{% /tab %}}

   {{% tab name="Kubernetes" %}}
   You do not need to change the API server configuration.

   Confirm that the cluster serves the required APIs.
   ```bash
   kubectl api-resources --api-group=certificates.k8s.io
   ```

   Example output:
   ```console
   NAME                           SHORTNAMES   APIVERSION               NAMESPACED   KIND
   certificatesigningrequests     csr          certificates.k8s.io/v1   false        CertificateSigningRequest
   clustertrustbundles                         certificates.k8s.io/v1   false        ClusterTrustBundle
   podcertificaterequests                      certificates.k8s.io/v1   true         PodCertificateRequest
   ```
   {{% /tab %}}
   {{< /tabs >}}

3. Set the API key of your model provider.

   {{< tabs >}}
   {{% tab name="OpenAI" %}}
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
   {{% /tab %}}

   {{% tab name="Anthropic" %}}
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```
   {{% /tab %}}

   {{% tab name="Gemini" %}}
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   ```
   {{% /tab %}}

   {{% tab name="Ollama" %}}
   The installer sets up an [Ollama Cloud](https://docs.ollama.com/cloud) model, which takes an API key. To use an Ollama server that you host yourself, see [Ollama]({{< link path="setup/model-providers/ollama" >}}).
   ```bash
   export OLLAMA_API_KEY="your-api-key-here"
   ```
   {{% /tab %}}

   {{% tab name="Others" %}}
   For every other provider, such as xAI, Azure OpenAI, Amazon Bedrock, Google Vertex AI, or a provider of your own, see [Configure model providers]({{< link path="setup/model-providers" >}}).
   {{% /tab %}}
   {{< /tabs >}}

For the full requirements, see the [install guide]({{< link path="setup/installation#before-you-begin" >}}).
{{% /panel %}}

{{% panel title="Install with CLI" id="install-kagent" %}}
{{< include-section page="installation" heading="Install with CLI" local="before-you-begin" >}}
{{% /panel %}}

{{% panel title="Next steps" id="next-steps" %}}
{{< cards cols="3" >}}
  {{< card title="Build an Agent" path="/get-started/build-an-agent/" >}}
  {{< card title="Verify the installation" path="/setup/installation/#verify-the-installation" >}}
  {{< card title="Configure model providers" path="/setup/model-providers/" >}}
{{< /cards >}}
{{% /panel %}}
