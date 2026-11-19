---
title: Give an agent a sandbox
description: Bind the kagent MCP server's sandbox tools to an agent, so that the agent can run the code that it writes in a separate Sandbox.
weight: 40
author: kagent.dev
---

An agent can create its own Sandboxes through the kagent Model Context Protocol ({{< gloss "MCP" >}}MCP{{< /gloss >}}) server, by using the same service that a person reaches with the CLI. In this example, you build an agent that writes a Python program for a request, runs it in a fresh Sandbox, reports the output, and deletes the Sandbox.

A separate Sandbox keeps the code that an agent writes apart from the agent's own {{< gloss "Session" >}}Session{{< /gloss >}}. The Sandbox has its own tools image, its own files, and its own network access, and it does not end when the Session does.

## About the sandbox tools

kagent's Helm chart installs a `RemoteMCPServer` named `kagent-api` in the controller's namespace, pointing at the controller's own `/mcp` endpoint. The server exposes the sandbox tools alongside the session and checkpoint tools, so an AgentTemplate reaches Sandboxes through an ordinary tool binding. An AgentTemplate can reference only an MCP server in its own namespace, so an agent in another namespace needs its own `RemoteMCPServer` that points at the same URL.

Review the following table of kagent tools. Bind only the tools that the agent needs. An agent that runs a program and reads its output does not need the suspend, resume, or kill tools.

{{< reuse "kagent-docs/snippets/sandbox-mcp-tools.md" >}}

## Before you begin

1. Create a SandboxTemplate whose image includes Python, as described in [Set up sandbox templates]({{< link path="sandboxes/templates" >}}). The steps in this guide use the `python` template in the `kagent` namespace.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that your installation has a Harness on kagent's native runtime and a `default-model-config` ModelConfig. The steps in this guide use the `kagent-default` Harness that `kagent install` creates. If you created a Harness yourself, use its name instead.

3. Confirm that the `kagent-api` MCP server is accepted.
   ```bash
   kubectl get remotemcpserver kagent-api -n kagent
   ```

   Example output:
   ```console
   NAME         PROTOCOL          URL                                                          ACCEPTED
   kagent-api   STREAMABLE_HTTP   http://kagent-controller.kagent.svc.cluster.local:8083/mcp   True
   ```

## Create the agent

1. Apply an AgentTemplate that binds the sandbox tools, and an Agent that pairs it with a Harness.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: code-runner
     namespace: kagent
   spec:
     description: Runs Python code in a standalone Sandbox and reports the result
     modelConfig:
       name: default-model-config
     systemPrompt: |
       You run Python code for the user in a standalone kagent Sandbox.
       - Create one Sandbox per request from the python SandboxTemplate in the
         kagent namespace, with a new request_id and ttl_seconds set to 900.
         If a call fails, retry it with the same request_id instead of creating
         another Sandbox.
       - Write the code to main.py with write_sandbox_file. The data_base64
         argument takes the file content encoded in base64.
       - Run it with start_sandbox_process, using the command
         ["python3", "main.py"]. Poll get_sandbox_process until the state is
         PROCESS_STATE_EXITED, then read the output with read_sandbox_outputs.
       - Always delete the Sandbox with delete_sandbox before you answer,
         even when a step fails.
       - Reply with the program's output and its exit code.
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
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: code-runner
     namespace: kagent
   spec:
     template:
       ref:
         name: code-runner
     harnessRef:
       name: kagent-default
   EOF
   ```

   | Setting | Why it matters |
   | ------- | -------------- |
   | `systemPrompt` | The prompt names the template, so that the agent does not have to discover one. It also tells the agent to keep its `request_id` for retries and to delete the Sandbox. Without these instructions, a model can create a new Sandbox for each attempt and leave them running until they expire. |
   | `ttl_seconds` in the prompt | A short lifetime bounds the cost of a Sandbox that the agent fails to delete. |
   | `tools` | The binding lists only the tools that this workflow uses. |

2. Wait until the Agent is ready.
   ```bash
   kagent agent get code-runner
   ```

   Example output:
   ```console
   +-------------+-------+----------------------+
   | NAME        | READY | CREATED              |
   +-------------+-------+----------------------+
   | code-runner | True  | 2026-11-18T21:08:31Z |
   +-------------+-------+----------------------+
   ```

## Run code through the agent

1. Start a Session with the agent, and send it a request.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent code-runner -o json | jq -r '.session.id')
   kagent agent invoke --session $SESSION_ID \
     --task "Compute the count and the sum of the numbers [2, 3, 5] in Python, and print them as JSON."
   ```

   Example output:
   ```console
   {'count': 3, 'sum': 10}
   Exit code: 0
   ```

2. [Launch the kagent UI]({{< link path="ui/launch-ui" >}}) to check which tools the agent called. Leave the following command running, then open [http://localhost:8082](http://localhost:8082).
   ```bash
   kagent dashboard
   ```

   Open the `code-runner` agent's Session. The conversation view shows each tool call that the agent made. A typical run calls `create_sandbox`, `write_sandbox_file`, `start_sandbox_process`, `get_sandbox_process`, `read_sandbox_outputs`, and `delete_sandbox`. The model can repeat a status check or make additional calls.

   {{< reuse-image-light src="img/kagent-ui-sandbox-tools.png" alt="The code-runner Session in the kagent UI, showing sandbox tool calls and the Python result." >}}
   {{< reuse-image-dark srcDark="img/kagent-ui-sandbox-tools-dark.png" alt="The code-runner Session in the kagent UI in dark mode, showing sandbox tool calls and the Python result." >}}

3. Confirm that the agent deleted its Sandbox.
   ```bash
   kagent sandbox list
   ```

   The list shows only the Sandboxes that your identity owns.{{% upstream %}} In an installation without authentication, the agent and the CLI share the same default identity, so an empty list confirms the cleanup.{{% /upstream %}} With authentication on, the agent's Sandboxes belong to the identity of its MCP connection, as described in [Who owns an agent's Sandboxes](#who-owns-an-agents-sandboxes).

## Who owns an agent's Sandboxes

An agent owns the Sandboxes that it creates under the identity that its MCP connection authenticated, not under the identity of the person that the agent is talking to. A {{< gloss "Session" >}}Session{{< /gloss >}} share token does not grant access to a Sandbox.

To have an agent create Sandboxes as the person who invoked it, enable credential propagation. The kagent runtime then passes the caller's credentials and identity to the MCP servers that you trust, so each person sees only the Sandboxes that the agent created for them.

1. Save the runtime setting in a Helm values file.
   ```bash
   cat > token-propagation-values.yaml <<'EOF'
   config:
     runtimeDefaults:
       tokenPropagation:
         enabled: true
   EOF
   ```

2. Read the installed chart version and apply the file to the existing release, preserving its other values.
   ```bash
   export KAGENT_CHART_VERSION=$(helm list -n kagent -o json \
     | jq -er '.[] | select(.name == "kagent") | .chart | ltrimstr("kagent-")')
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --namespace kagent --version "$KAGENT_CHART_VERSION" \
     --reuse-values -f token-propagation-values.yaml --wait
   ```

3. Configure the MCP server to opt in to receiving the caller's token, as described in [Caller token passthrough]({{< link path="skills-and-mcp/about-tools#caller-token-passthrough" >}}). Enabling propagation alone does not make every MCP server trusted.

## Clean up

```bash
kubectl delete agent code-runner -n kagent
kubectl delete agenttemplate code-runner -n kagent
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/mcp-clients" >}}` title="Use sandboxes from an MCP client" subtitle="Give Claude Code or Cursor the same sandbox tools." >}}
  {{< card link=`{{< link path="sandboxes/about" >}}` title="About sandboxes" subtitle="Review the lifecycle, storage, and network rules that apply to every Sandbox." >}}
{{< /cards >}}
