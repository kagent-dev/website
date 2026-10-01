---
title: Standalone sandboxes
description: Run commands and transfer files in a scratch environment that no agent conversation owns.
weight: 25
author: kagent.dev
---

A **Sandbox** is a scratch environment for running commands and working with files. It is scoped to the caller who created it, it expires on a timer, and no agent conversation owns it. You create one from a **SandboxTemplate**, run processes and move files in it, then delete it or let it expire.

A Sandbox and a {{< gloss "Session" >}}Session{{< /gloss >}} are separate runtimes with separate configuration and separate lifetimes. Neither resource references the other.

| What you configure | What runs | What you call it with |
| ------------------ | --------- | --------------------- |
| An {{< gloss "Agent" >}}Agent{{< /gloss >}} pairs an AgentTemplate with a Harness | A Session | A2A interactions and tasks |
| A SandboxTemplate defines a tools environment | A Sandbox | Guest process and file operations |

An agent can create a Sandbox of its own through the kagent {{< gloss "MCP" >}}MCP{{< /gloss >}} server, using the same service that a person calls. The agent's conversation and the Sandbox's lifetime stay independent of each other.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), with a {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} provisioned.

2. Set a guest image digest on your installation. Sandbox preparation needs one, and the chart ships no default. A SandboxTemplate never becomes ready without it. The controller passes the digest to Agent Substrate unchanged and resolves no tags, so supply a digest rather than a tag.
   ```yaml
   controller:
     sandbox:
       guestImage:
         digest: sha256:1821780ef01958f63cb9a1a1d9a175f7e386e7c72859dd29ab86d8644a47d2d4
   ```

3. Download the kagent CLI, as described in [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Operator settings

The rest of `controller.sandbox` sets the compute and the lifetime that every Sandbox gets. A SandboxTemplate cannot override them, so these are the installation's policy rather than a per-template choice.

| Value | Default | Description |
| ----- | ------- | ----------- |
| `controller.sandbox.guestImage.digest` | `""` | The digest-pinned guest image. Required: preparation fails without it. |
| `controller.sandbox.cpu` | `1` | CPU allocated to each Sandbox. |
| `controller.sandbox.memory` | `1Gi` | Memory allocated to each Sandbox. |
| `controller.sandbox.defaultTTL` | `1h` | Lifetime applied when `kagent sandbox create` omits `--ttl`. |
| `controller.sandbox.maxTTL` | `24h` | Upper bound on any requested lifetime. |

Activity does not extend a Sandbox's lifetime. A Sandbox expires the configured interval after it is created, however recently a command ran in it.

> [!WARNING]
> **A Sandbox reaches no network destination.** kagent configures no allowed egress for a Sandbox, so a command that fetches a package, clones a repository, or calls an API fails. Plan on moving what a command needs into the Sandbox with `kagent sandbox upload`. Destination configuration on a SandboxTemplate is follow-up work.

## Create a SandboxTemplate

A SandboxTemplate is a namespaced `api.kagent.dev/v1alpha3` resource that prepares a reusable runtime. Applying one does not allocate a Sandbox.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: SandboxTemplate
metadata:
  name: scratch
  namespace: kagent
spec:
  workload:
    # Replace with your own tools image and its digest.
    image: registry.example.com/tools@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
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

{{< reuse "kagent-docs/snippets/review-table.md" >}} For the complete schema, see the [API reference]({{< link path="reference/api-ref#sandboxtemplate" >}}).

| Field | Required | Description |
| ----- | -------- | ----------- |
| `workload.image` | Yes | The tools image, pinned by `sha256` digest. A tag alone is rejected, because a prepared revision must be reproducible. |
| `env` | No | Environment defaults for the guest, up to 100. Each entry sets a literal `value`, which is required and may be an empty string. The schema defines no secret-backed source, so the API server rejects a `credentialRef` entry as an unknown field. |
| `substrate.workerPoolRef.name` | Yes | The WorkerPool that this template's Actors are scheduled onto. |
| `substrate.snapshotPolicy.location` | Yes | The object storage location for Actor {{< gloss "Snapshot" >}}snapshots{{< /gloss >}}. |

A SandboxTemplate takes no startup command and no guest toggle. kagent supplies the guest entrypoint from the image that `controller.sandbox.guestImage.digest` names. That image replaces the tools image's own entrypoint. Your tools image contributes the installed programs and nothing else.

Confirm that the template prepared a revision before you create a Sandbox from it.

```bash
kubectl get sandboxtemplate scratch -n kagent \
  -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
```

Editing a template prepares a new revision. A Sandbox that already exists keeps the revision it was created from, and deleting the template retires preparation without removing the Sandboxes that pinned it.

## Run a command

Each `kagent sandbox` command makes one lifecycle attempt rather than retrying for you, so `create` takes a stable `--request-id` that you reuse to retry the same creation.

1. List the templates that your installation prepared.
   ```bash
   kagent sandbox templates
   ```

   Example output:
   ```console
   NAMESPACE  NAME     IMAGE
   kagent     scratch  registry.example.com/tools@sha256:aaaa...
   ```

2. Create a Sandbox, and save its ID.
   ```bash
   export SANDBOX_ID=$(kagent sandbox create scratch --request-id my-first-sandbox -o json | jq -r '.id')
   echo $SANDBOX_ID
   ```

   Run the command without `-o json` to see the table instead. `STATE` and `OPERATION` both matter, because lifecycle work can still be pending when a call returns.
   ```console
   ID                                    TEMPLATE        STATE                OPERATION               EXPIRES               FAILURE
   0198c3f1-2a44-7c90-b5e1-9d8f3a7b2c04  kagent/scratch  RUNTIME_STATE_READY  RUNTIME_OPERATION_NONE  2026-10-01T16:30:00Z
   ```

3. Run a command in the Sandbox. The default working directory is `/data/workspace`, which the guest creates before it reports ready.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- python --version
   ```

   A timeout stops the command from waiting rather than stopping the remote process. To reconnect to a process that outlived its `exec`, pass its process ID to `kagent sandbox wait`.

4. Move a file in, run against it, and read the result back out.
   ```bash
   kagent sandbox upload $SANDBOX_ID ./script.py /data/workspace/script.py
   kagent sandbox exec $SANDBOX_ID -- python /data/workspace/script.py
   kagent sandbox download $SANDBOX_ID /data/workspace/out.txt ./out.txt
   ```

5. Delete the Sandbox when you are finished. Deleting is not required, because the Sandbox expires on its own. Deleting it releases the compute immediately.
   ```bash
   kagent sandbox delete $SANDBOX_ID
   ```

> [!IMPORTANT]
> **Suspending a Sandbox interrupts whatever it is doing.** `kagent sandbox suspend` waits for no process, output stream, or file transfer, so a command can be cut off mid-run and a file can be left partly written. Resuming restores the durable files under `/data`, but a process handle does not survive, because the guest holds it in memory. Suspend a Sandbox only when you can repeat whatever it was running.

## Reach a sandbox from an agent

kagent's Helm chart installs a `RemoteMCPServer` named `kagent-api` in the controller's namespace, pointing at the controller's own `/mcp` endpoint. That one server exposes the Session and checkpoint tools alongside the sandbox tools, so an AgentTemplate reaches sandboxes through an ordinary tool binding.

```yaml
tools:
  - mcp:
      server:
        kind: RemoteMCPServer
        name: kagent-api
      tools:
        - list_sandbox_templates
        - create_sandbox
        - list_sandboxes
```

An agent that creates a Sandbox owns it under whatever identity the MCP connection authenticated, not under the identity of the person it is talking to. A Session share token grants no access to a Sandbox. To have an agent act for the person who invoked it, configure credential propagation: the Go kagent runtime reads `KAGENT_PROPAGATE_TOKEN=true` to pass the caller's credentials and identity to the MCP servers that you trust.

The MCP transfer limits are tighter than the command line's. A gRPC file transfer is bounded at 64 MiB. An MCP transfer or output read is bounded at 1 MiB, encodes bytes as base64, and returns a continuation offset for reading more.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="substrate-runtime/sandboxing" >}}` title="Sandboxing" subtitle="Understand the gVisor boundary that a Sandbox shares with every agent Actor." >}}
  {{< card link=`{{< link path="examples/agents-via-mcp" >}}` title="Use agents from an MCP client" subtitle="Reach the same MCP server that serves the sandbox tools." >}}
  {{< card link=`{{< link path="reference/cli/kagent-sandbox" >}}` title="kagent sandbox" subtitle="Look up every flag that the sandbox commands take." >}}
{{< /cards >}}
