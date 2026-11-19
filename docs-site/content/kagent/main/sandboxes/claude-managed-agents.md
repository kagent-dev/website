---
title: Host sandboxes for Claude Managed Agents
description: Run the code execution sandboxes of Claude Managed Agents on your own cluster, while Anthropic hosts the agent loop.
weight: 70
author: kagent.dev
---

> [!WARNING]
> This integration is experimental. Its settings are environment variables with the `EXPERIMENTAL_` prefix, and they can change in a future release without notice.

[Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes) can run their tools in a self-hosted sandbox. Anthropic hosts the agent loop, and your infrastructure runs the code that the agent executes. kagent can be that infrastructure. The kagent controller claims work from an Anthropic self-hosted environment, creates a Sandbox for each Claude Session, and starts Anthropic's worker in it. The Sandbox suspends when the Session is idle, and it resumes with its files intact when the Session continues.

## How it works

The integration is a launcher in the kagent controller. It is off by default, and it reads its settings from controller environment variables.

1. The launcher polls your Anthropic environment for work. It authenticates with the environment key, which stays in the controller and never enters a Sandbox.
2. When a Claude Session needs a sandbox, the launcher creates a kagent Sandbox from the SandboxTemplate that you configure, named `anthropic-<session-id>`.
3. The launcher starts `ant beta:worker run` in the Sandbox, with `/data/workspace` as the working directory. The worker receives only the credentials that are scoped to that piece of work.
4. The worker runs the agent's tool calls until the Session is idle for 5 minutes, and then exits. The launcher then suspends the Sandbox, which releases its compute.
5. When the same Claude Session needs its sandbox again, the launcher resumes the Sandbox and starts a new worker. The files under `/data` are still there.

Each Sandbox lives for 12 hours by default, after which kagent deletes it, even if it is suspended. Only the leader controller replica runs the launcher.

| Where the agent loop runs | What runs in your cluster |
| ------------------------- | ------------------------- |
| On the Claude Platform, as a Claude Managed Agent | One Sandbox per Claude Session, running the `ant` worker and the agent's tool calls |

## Before you begin

1. Install the [`ant` command line interface (CLI)](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/quickstart), and sign in.

2. Create a [self-hosted environment](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes) on the Claude Platform, and generate its environment key. Save both values.
   ```bash
   export ANTHROPIC_ENVIRONMENT_ID=env_xxx
   export ANTHROPIC_ENVIRONMENT_KEY=<environment-key>
   ```

3. Install kagent from a build that includes the integration, and set the [sandbox values]({{< link path="sandboxes/templates#before-you-begin" >}}).

## Set up the Sandbox template

The launcher runs the `ant` CLI inside the Sandbox, so the template's tools image must include it. The kagent `sandbox-guest` image includes the `ant` CLI, so you can use that image as the tools image.

1. Create an EgressPolicy that lets the worker reach Anthropic, and a SandboxTemplate that selects it. Every Sandbox has no outbound access by default, and the worker cannot run without access to the Anthropic API.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: EgressPolicy
   metadata:
     name: anthropic-managed-agents
     namespace: kagent
   spec:
     destinations:
       - origin: https://*.anthropic.com
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: SandboxTemplate
   metadata:
     name: claude
     namespace: kagent
   spec:
     workload:
       # The kagent sandbox-guest image of your installation, which includes the ant CLI.
       image: ghcr.io/kagent-dev/kagent/sandbox-guest@sha256:<digest>
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         location: s3://ate-snapshots/kagent/
     egressPolicyRefs:
       - name: anthropic-managed-agents
   EOF
   ```

   To give the agent access to more destinations, such as a package registry, add them to the EgressPolicy. For more information, see [Egress policies]({{< link path="agents/egress-policies" >}}).

2. Wait until the template is ready.
   ```bash
   kubectl wait -n kagent --for=condition=Ready sandboxtemplate/claude --timeout=15m
   ```

## Turn on the launcher

1. Store the environment key in a Secret in the controller's namespace.
   ```bash
   kubectl create secret generic anthropic-environment-key -n kagent \
     --from-literal=key="${ANTHROPIC_ENVIRONMENT_KEY}"
   ```

2. Add the launcher's environment variables to your kagent Helm values, and upgrade the release.
   ```yaml
   controller:
     env:
       - name: EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENABLED
         value: "true"
       - name: EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENVIRONMENT_ID
         value: "<environment-id>"
       - name: EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENVIRONMENT_KEY
         valueFrom:
           secretKeyRef:
             name: anthropic-environment-key
             key: key
       - name: EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_TEMPLATE_NAMESPACE
         value: kagent
       - name: EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_TEMPLATE_NAME
         value: claude
   ```

   | Variable | Description |
   | -------- | ----------- |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENABLED` | Set to `true` to start the launcher. When the value is omitted or `false`, the launcher stays off and the other variables are ignored. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENVIRONMENT_ID` | Required. The Anthropic environment whose work the launcher claims. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_ENVIRONMENT_KEY` | Required. The environment key, which the launcher uses to poll for work and to send heartbeats. The controller does not pass it into any Sandbox. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_TEMPLATE_NAMESPACE` | Required. The namespace of the SandboxTemplate. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_TEMPLATE_NAME` | Required. The name of the SandboxTemplate. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_BASE_URL` | Optional. An override for the Anthropic API endpoint, for both the launcher and the worker. The value must be an `http` or `https` URL without credentials, a query, or a fragment. |
   | `EXPERIMENTAL_ANTHROPIC_SELF_HOSTED_SANDBOXES_TTL` | Optional. The lifetime of each Sandbox, which is also the timeout of its worker. Defaults to `12h`. The value is a positive duration, such as `2h30m`, and the installation's maximum Sandbox lifetime still applies. |

   If the configuration is invalid, the controller logs an error and starts without the launcher.

3. Check the controller logs for errors from the launcher.
   ```bash
   kubectl logs -n kagent deployment/kagent-controller | grep -i "anthropic self-hosted"
   ```

## Run a Claude Session

1. Create a Claude Managed Agent, and save its ID.
   ```bash
   AGENT_ID=$(ant --format json beta:agents create \
     --name "kagent-sandbox-agent" \
     --model claude-haiku-5-5 \
     --system "You are a coding agent. Your working directory is /data/workspace. Be concise." \
     --tool '{type: agent_toolset_20260401}' | jq -r .id)
   ```

2. Create a Session for the agent in your self-hosted environment.
   ```bash
   SESSION_ID=$(ant --format json beta:sessions create \
     --agent "$AGENT_ID" \
     --environment-id "$ANTHROPIC_ENVIRONMENT_ID" | jq -r .id)
   ```

3. Connect to the Session, and ask the agent to create a file, such as `/data/workspace/helloworld.txt` that contains `Hello world!`.
   ```bash
   ant beta:sessions connect "$SESSION_ID"
   ```

   The launcher claims the work and creates a Sandbox named `anthropic-<session-id>` from the `claude` template. The agent's tool calls run in that Sandbox.

4. After 5 minutes without work, the worker exits and kagent suspends the Sandbox. Ask the agent to read the file back. kagent resumes the Sandbox, and the file is still there.

5. Ask the agent to fetch a page from a destination that the EgressPolicy does not allow, such as `https://kagent.dev`. The request fails, because the Sandbox cannot reach that destination.

## View the Sandboxes

The launcher creates each Sandbox under its own identity, not yours, so `kagent sandbox list` does not show them. In an installation without authentication, the `--user-id` flag selects the identity to list as. The launcher's identity combines the `kagent:anthropic-self-hosted-sandboxes` authority with your environment ID, each encoded in URL-safe base64 without padding.

```bash
USER_ID="$(printf '%s' 'kagent:anthropic-self-hosted-sandboxes' | base64 | tr '+/' '-_' | tr -d '=\n')"
USER_ID="${USER_ID}.$(printf '%s' "$ANTHROPIC_ENVIRONMENT_ID" | base64 | tr '+/' '-_' | tr -d '=\n')"
kagent sandbox list --user-id "$USER_ID"
```

Example output:
```console
ID            TEMPLATE       STATE                    OPERATION               EXPIRES               FAILURE
01a1b853-xxx  kagent/claude  RUNTIME_STATE_SUSPENDED  RUNTIME_OPERATION_NONE  2026-11-08T11:24:07Z
```

## Run more than one controller replica

Only the leader controller replica polls Anthropic and launches workers. When leadership moves to another replica, the new leader finds the existing Sandboxes by name and continues to use them. The chart sets `controller.terminationGracePeriodSeconds` to `180` by default, so that a launch that is in progress can finish before the leader releases its lease. Workers that are already running continue in their Sandboxes while leadership changes.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/about" >}}` title="About sandboxes" subtitle="Review the lifecycle, storage, and network rules that apply to every Sandbox." >}}
  {{< card link=`{{< link path="agents/egress-policies" >}}` title="Egress policies" subtitle="Grant the agent's Sandbox access to more destinations, and inject credentials." >}}
{{< /cards >}}
