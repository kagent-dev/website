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

{{< tutorial-banner title="Install kagent" text="Install kagent and Agent Substrate on your Kubernetes cluster with one command, then open the dashboard and build your first agent." cta="Install with CLI" anchor="install-kagent" art="logo" >}}

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

For the full requirements, see [Advanced Install]({{< link path="setup/installation#before-you-begin" >}}).
{{% /panel %}}

{{% panel title="Install with CLI" id="install-kagent" %}}
The CLI installation suits evaluation, because it deploys a development PostgreSQL database. To pin a release or pass your own chart values, see [Customize the CLI installation]({{< link path="setup/installation#customize-the-cli-installation" >}}).

1. Install the kagent CLI and run it. The first command downloads the `kagent` CLI. The second installs the CRDs, Agent Substrate, a development PostgreSQL database, and kagent into your cluster, in that order, and takes a few minutes. `kagent install` reads the API key that you set in [Before you begin](#before-you-begin), and uses OpenAI unless you name another provider in the `--provider` flag.

   {{< tabs >}}
   {{% tab name="OpenAI" %}}
   ```bash
   curl -sL https://kagent.dev/install | bash && kagent install
   ```
   {{% /tab %}}

   {{% tab name="Anthropic" %}}
   ```bash
   curl -sL https://kagent.dev/install | bash && kagent install --provider Anthropic
   ```
   {{% /tab %}}

   {{% tab name="Gemini" %}}
   ```bash
   curl -sL https://kagent.dev/install | bash && kagent install --provider Gemini
   ```
   {{% /tab %}}

   {{% tab name="Ollama" %}}
   ```bash
   curl -sL https://kagent.dev/install | bash && kagent install --provider Ollama
   ```
   {{% /tab %}}

   {{% tab name="Others" %}}
   `kagent install` sets up one of the providers in the other tabs. To use a different provider, install with one of them, then add yours as described in [Configure model providers]({{< link path="setup/model-providers" >}}).
   {{% /tab %}}
   {{< /tabs >}}

   <details class="doc-details">
   <summary>Password prompt, or an older kagent already installed?</summary>
   <p>The install script puts the CLI in <code>/usr/local/bin</code>, and asks for your password to write there. To install without <code>sudo</code>, into <code>$HOME/bin</code>, run the script with <code>bash -s -- --no-sudo</code>.</p>
   <p>If an older <code>kagent</code> is already on your path, your shell can keep running that one, and <code>kagent install</code> then installs the older release. Run <code>kagent version</code> and check that <code>kagent_version</code> is the release that the script downloaded.</p>
   </details>

   <div class="kind-only">

   {{< reuse-image src="img/kagent-install-cli-kind.gif" alt="A terminal creating a kind cluster, running the kagent install command, and listing the running kagent pods" caption="Figure: Installing kagent on a local kind cluster with the CLI, sped up" >}}

   </div>

2. Open the kagent dashboard. The command forwards the UI to `http://localhost:8082`, and on macOS also opens it in your browser. On Linux and Windows, follow the port-forward steps in [Launch the UI]({{< link path="ui/launch-ui" >}}). The dashboard lists your agents, models, MCP servers, and the tools that kagent discovered.
   ```bash
   kagent dashboard
   ```

   {{< reuse-image src="img/kagent-ui-dashboard.png" srcDark="img/kagent-ui-dashboard-dark.png" alt="The kagent dashboard after a fresh installation" caption="Figure: The kagent dashboard after a fresh installation" >}}

Then create an agent in [Build an Agent]({{< link path="get-started/build-an-agent" >}}).
{{% /panel %}}

{{% panel title="Next steps" id="next-steps" %}}
{{< cards cols="3" >}}
  {{< card title="Build an Agent" path="/get-started/build-an-agent/" >}}
  {{< card title="Verify the installation" path="/setup/installation/#verify-the-installation" >}}
  {{< card title="Configure model providers" path="/setup/model-providers/" >}}
{{< /cards >}}
{{% /panel %}}
