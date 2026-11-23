---
title: Build a sandbox coding agent
description: Build an agent that writes Python code, runs it in an isolated Sandbox, and reports the result.
weight: 4
author: kagent.dev
---

{{< tutorial-banner >}}

Build an agent that writes a Python program for a request, runs it in a fresh Sandbox, reports the output, and deletes the Sandbox. The Sandbox keeps the code that the agent writes apart from the agent itself, with its own files and no network access unless you grant it.

This tutorial has two parts. You prepare Sandboxes from the command line, because the kagent UI has no page for sandbox templates. Then you build the agent in the UI.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).

2. Set the sandbox guest image. kagent runs its own guest program in every Sandbox, and the chart does not ship a default image for it, so a sandbox template does not become ready until you set one. Save the setting in a values file.
   ```bash
   cat > sandbox-values.yaml <<'EOF'
   config:
     sandboxes:
       guestImage: {{< reuse "kagent-docs/versions/sandbox-guest-image.md" >}}
   EOF
   ```

3. Apply the file to your kagent release. The commands use [`jq`](https://jqlang.org/download/) to read the installed chart version, so that the upgrade keeps that version and the release's other values.
   ```bash
   export KAGENT_CHART_VERSION=$(helm list -n kagent -o json \
     | jq -er '.[] | select(.name == "kagent") | .chart | ltrimstr("{{< reuse "kagent-docs/snippets/helm-kagent.md" >}}-")')
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --namespace kagent --version "$KAGENT_CHART_VERSION" \
     --reuse-values -f sandbox-values.yaml --wait
   ```

   For the other sandbox settings, such as CPU, memory, and lifetime, see [Set up sandbox templates]({{< link path="sandboxes/templates" >}}).

4. Open the kagent UI with `kagent dashboard`.

## Set up a sandbox template

A SandboxTemplate names the image that every Sandbox starts from. The image holds the programs that the agent can run. This template uses a Python image.

1. Create the template.
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

2. Confirm that the template is ready. This step can take a minute the first time, while a Worker pulls the image.
   ```bash
   kubectl get sandboxtemplate python -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Prepared Sandbox runtime is prepared
   ```

   If the output reports `False PreparationFailed`, the guest image from [Before you begin](#before-you-begin) is not set.

For the fields of a template and how to choose an image, see [Set up sandbox templates]({{< link path="sandboxes/templates" >}}).

## Create the agent

{{< reuse-image src="img/kagent-ui-code-runner.gif" alt="The kagent UI creating an agent named code-runner and choosing the sandbox tools of the kagent-api server" caption="Figure: Creating the code-runner agent with the sandbox tools, sped up" >}}

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `code-runner`. Leave the **Namespace** as `kagent`, and leave **Shared harness** set to `kagent-default`.

3. In the **Template** section, select **Inline**, and fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | `kagent/default-model-config` |
   | **Description** | `Runs Python code in a Sandbox and reports the result` |

4. In the **System prompt** field, enter the following prompt.
   ```text
   You run Python code for the user in a standalone kagent Sandbox.
   - Create one Sandbox per request from the python SandboxTemplate in the
     kagent namespace, with a new request_id and ttl_seconds set to 900.
     If a call fails, retry it with the same request_id.
   - Write the code to main.py with write_sandbox_file, with the file bytes
     as standard base64.
   - Run it with start_sandbox_process, using the command
     ["python3", "main.py"]. Poll get_sandbox_process until the state is
     PROCESS_STATE_EXITED, then read the output with read_sandbox_outputs.
   - Always delete the Sandbox with delete_sandbox before you answer.
   - Reply with the program output and its exit code.
   ```

   The prompt names the template, so that the agent does not have to discover one. It also tells the agent to delete the Sandbox, so that Sandboxes do not pile up.

5. Under **Tools from MCP servers**, click **Add an MCP server**, and choose `kagent/kagent-api` from the **MCP server** list. This server is kagent's own, and it offers the sandbox tools.

6. From the tool list beside it, choose these tools: `list_sandbox_templates`, `create_sandbox`, `get_sandbox`, `write_sandbox_file`, `start_sandbox_process`, `get_sandbox_process`, `read_sandbox_outputs`, `read_sandbox_file`, and `delete_sandbox`.

7. Click **Create agent**, and then click **Refresh** until the agent is **Ready**. This agent can take a couple of minutes to prepare.

## Run code through the agent

1. Click the agent name, `code-runner`, to open its chat page.

2. Send a request, such as `Compute the sum of the numbers [2, 3, 5] in Python and print it as JSON.`

The conversation shows each tool call that the agent makes: creating the Sandbox, writing the file, starting the process, reading the output, and deleting the Sandbox.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML. The sandbox template is already YAML, in [Set up a sandbox template](#set-up-a-sandbox-template).

<details class="doc-details">
<summary>The code-runner agent, with the sandbox tools</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: code-runner
  namespace: kagent
spec:
  harnessRef:
    name: kagent-default
  template:
    inline:
      description: Runs Python code in a Sandbox and reports the result
      modelConfig:
        name: default-model-config
      systemPrompt: |-
        You run Python code for the user in a standalone kagent Sandbox.
        - Create one Sandbox per request from the python SandboxTemplate in the
          kagent namespace, with a new request_id and ttl_seconds set to 900.
          If a call fails, retry it with the same request_id.
        - Write the code to main.py with write_sandbox_file, with the file bytes
          as standard base64.
        - Run it with start_sandbox_process, using the command
          ["python3", "main.py"]. Poll get_sandbox_process until the state is
          PROCESS_STATE_EXITED, then read the output with read_sandbox_outputs.
        - Always delete the Sandbox with delete_sandbox before you answer.
        - Reply with the program output and its exit code.
      tools:
        - mcp:
            server:
              kind: RemoteMCPServer
              name: kagent-api
            tools:
              - list_sandbox_templates
              - create_sandbox
              - get_sandbox
              - write_sandbox_file
              - start_sandbox_process
              - get_sandbox_process
              - read_sandbox_outputs
              - read_sandbox_file
              - delete_sandbox
EOF
```

</details>

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/agent-sandbox-tools" >}}` title="Give an agent sandbox tools" subtitle="Read the full list of sandbox tools and who owns an agent's Sandboxes." >}}
  {{< card link=`{{< link path="sandboxes/about" >}}` title="About Sandboxes" subtitle="Read how Sandboxes are isolated, suspended, and resumed." >}}
{{< /cards >}}
