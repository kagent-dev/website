---
title: Set up a sandbox template
description: Create a sandbox template, then start a Sandbox from it and run a command.
weight: 18
author: kagent.dev
---

{{< tutorial-banner >}}

A Sandbox is an isolated scratch environment that a person, a script, or an agent creates to run commands. A **sandbox template** says what every Sandbox of one kind starts with: the container image that holds its programs, and the worker pool that runs it.

In this tutorial, you create a template for Python, start a Sandbox from it, and run a command in it. The kagent UI has no page for sandbox templates, so you work from the command line.

{{< reuse-image src="img/kagent-sandbox-template.gif" alt="A terminal creating the python sandbox template, waiting for it to be ready, creating a Sandbox from it, running python --version in it, and deleting it" caption="Figure: Creating the template and running a command in a Sandbox" >}}

## Before you begin

1. [Install kagent]({{< link path="setup" >}}), and make sure that the `kagent` CLI and [`jq`](https://jqlang.org/download/) are on your path.

2. Set the sandbox guest image. kagent runs its own guest program in every Sandbox, and the chart does not ship a default image for it, so a template does not become ready until you set one.
   ```bash
   cat > sandbox-values.yaml <<'EOF'
   config:
     sandboxes:
       guestImage: {{< reuse "kagent-docs/versions/sandbox-guest-image.md" >}}
   EOF
   ```

3. Apply the file to your kagent release. The commands read the installed chart version, so that the upgrade keeps that version and the release's other values.
   ```bash
   export KAGENT_CHART_VERSION=$(helm list -n kagent -o json \
     | jq -er '.[] | select(.name == "kagent") | .chart | ltrimstr("{{< reuse "kagent-docs/snippets/helm-kagent.md" >}}-")')
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --namespace kagent --version "$KAGENT_CHART_VERSION" \
     --reuse-values -f sandbox-values.yaml --wait
   ```

## Choose an image

The image holds every program that the Sandbox can run. A Sandbox has no network access unless you grant it, so a command cannot install a missing package later.

kagent accepts only an image that is pinned to a digest. To read the digest of a public image, run this command.

```bash
docker buildx imagetools inspect python:3.13-slim --format '{{json .Manifest.Digest}}'
```

## Create the template

1. Apply the template. It uses the `kagent-default` worker pool and the snapshot location that the installation sets up.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: SandboxTemplate
   metadata:
     name: python
     namespace: kagent
   spec:
     workload:
       image: docker.io/library/python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90
     env:
       - name: LANG
         value: C.UTF-8
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         location: s3://ate-snapshots/kagent/
   EOF
   ```

2. Wait until the template is ready. kagent builds a snapshot of the template first, which can take a minute the first time that a Worker pulls the image.
   ```bash
   kubectl wait sandboxtemplate/python -n kagent --for=condition=Ready --timeout=5m
   ```

   If the command times out, read the reason.
   ```bash
   kubectl get sandboxtemplate python -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   The reason `PreparationFailed` usually means that the guest image from [Before you begin](#before-you-begin) is not set.

3. List the templates that you can create a Sandbox from.
   ```bash
   kagent sandbox templates
   ```

   Example output:
   ```console
   NAMESPACE  NAME    IMAGE
   kagent     python  docker.io/library/python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90
   ```

## Try the template

1. Create a Sandbox from the template, and save its ID. The request ID makes the command safe to retry.
   ```bash
   export SANDBOX_ID=$(kagent sandbox create python --request-id "cli-$(uuidgen)" -o json | jq -r .id)
   echo $SANDBOX_ID
   ```

2. Run a command in the Sandbox.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- python --version
   ```

   Example output:
   ```console
   Process proc-2c32646d3e4cac9f0763a1da in sandbox 01a209a5-684a-7106-85ca-8851f2059dd6: started (stdout offset 0, stderr offset 0)
   Python 3.13.18
   Process proc-2c32646d3e4cac9f0763a1da: PROCESS_STATE_EXITED, exit_code=0
   ```

3. Delete the Sandbox when you are done.
   ```bash
   kagent sandbox delete $SANDBOX_ID
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/sandbox-coding-agent" >}}` title="Build a sandbox coding agent" subtitle="Give an agent the tools to create Sandboxes from this template." >}}
  {{< card link=`{{< link path="sandboxes/cli" >}}` title="Run commands with the CLI" subtitle="Upload files, run scripts, and suspend and resume a Sandbox." >}}
  {{< card link=`{{< link path="sandboxes/templates" >}}` title="Set up sandbox templates" subtitle="Read every field of a template, and how to grant network access." >}}
{{< /cards >}}
