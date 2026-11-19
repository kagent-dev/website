---
title: Set up sandbox templates
description: Turn on Sandboxes in your installation, choose a tools image, and create the SandboxTemplate that every Sandbox starts from.
weight: 20
author: kagent.dev
---

A **SandboxTemplate** defines the tools environment that a Sandbox starts from. It names a tools image, the {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} that runs it, and the network access that it gets. An operator creates templates, and a caller picks one by namespace and name when it creates a Sandbox. This page shows how to set up the installation for Sandboxes, choose an image, and create a template.

## Before you begin

1. {{< reuse "kagent-docs/snippets/sandbox-config-step.md" >}}

2. {{< reuse "kagent-docs/snippets/install-cli.md" >}}

## Choose a tools image

Each Sandbox needs a container image with all of the tools, or programs, that the Sandbox can run, such as an interpreter, a compiler, or a command line tool. kagent adds its own guest program to every Sandbox to serve process and file operations, so the tools image needs nothing else. You can use a public image as it is, or build your own.

1. Pick a public image such as Python, or build an image that already contains every program that the Sandbox needs. A Sandbox has no outbound network access by default, so a command cannot install a missing package at run time unless you [grant network access](#grant-network-access).

2. Look up the image's digest. The API server rejects an image that is referenced by a tag alone, because each prepared revision must be reproducible. For a multi-architecture image, use the digest of the image index, so that each node pulls the variant for its own architecture.
   ```bash
   docker buildx imagetools inspect python:3.13-slim --format '{{json .Manifest.Digest}}'
   ```

   Example output:
   ```console
   "sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90"
   ```

3. Check the image against the following requirements, which kagent applies when it runs the image.

   | Behavior | What it means for your image |
   | -------- | ---------------------------- |
   | kagent replaces the entrypoint. | The image's own `ENTRYPOINT` and `CMD` do not run. A SandboxTemplate does not take a startup command, so start any process that a task needs through a process call. |
   | kagent mounts a durable volume at `/data`. | Anything that the image places under `/data` is hidden by the mount. Install programs and files elsewhere, such as under `/opt` or `/usr/local`. |
   | Commands start in `/data/workspace`. | The guest creates `/data/workspace` and `/data/guest-logs` before the Sandbox reports ready. If the image runs as a user other than root, that user must be able to write to `/data`. |
   | The Workers must be able to pull the image. | If the image is in a private registry, configure the pull credentials for the WorkerPool's nodes. |

## Create a SandboxTemplate

A SandboxTemplate is a namespaced kagent custom resource that describes a reusable runtime for Sandbox instances.

1. Create a SandboxTemplate. The following example uses the Python image from the previous section.

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

   {{< reuse "kagent-docs/snippets/review-table.md" >}} For the complete schema, see the [API reference]({{< link path="reference/api-ref#sandboxtemplate" >}}).

   | Field | Required | Description |
   | ----- | -------- | ----------- |
   | `workload.image` | Yes | The tools image, pinned by `sha256` digest, in the `<image>@sha256:<digest>` form. The API server rejects a reference without a digest, with the message `spec.workload.image in body should match '^[^[:space:]@]+@sha256:[a-f0-9]{64}$'`. |
   | `env` | No | Environment variables for every process in the Sandbox, up to 100. Each entry sets a literal `value`, which is required and can be an empty string. A template cannot read a value from a Secret, and the API server rejects a `credentialRef` entry as an unknown field. To give a Sandbox a credential, [inject it at the egress gateway](#grant-network-access) instead. |
   | `substrate.workerPoolRef.name` | Yes | The WorkerPool in the template's namespace that runs the Sandboxes. The pool also decides the sandbox class, such as gVisor. |
   | `substrate.snapshotPolicy.location` | Yes | The object storage location for the Sandbox's {{< gloss "Snapshot" >}}snapshots{{< /gloss >}}. |
   | `egressPolicyRefs` | No | Up to 16 EgressPolicy resources in the template's namespace that grant the Sandbox outbound access. When this field is omitted, the Sandbox has no outbound access. |

2. Confirm that the template is ready. kagent builds a snapshot of the template's runtime before it reports `Ready`, which can take a minute the first time that a Worker pulls the image.
   ```bash
   kubectl get sandboxtemplate python -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Prepared Sandbox runtime is prepared
   ```

   | Reason | What it means |
   | ------ | ------------- |
   | `Preparing` | kagent is still building the snapshot. Wait, then check again. |
   | `Prepared` | The template is ready, and callers can create Sandboxes from it. |
   | `ActorTemplateRetrying` | The snapshot build failed, and kagent retries it after 15 seconds, 1 minute, 4 minutes, and then every 10 minutes. The message names the failure reason, the retry number, and its time, such as `golden build failed (GoldenActorCrashed), retry 1 at 2026-11-18T21:05:03Z`. Common causes are an image that the Workers cannot pull and a missing or wrong guest image. For the full error, read the controller logs. |

3. Confirm that callers can see the template.
   ```bash
   kagent sandbox templates
   ```

   Example output:
   ```console
   NAMESPACE  NAME    IMAGE
   kagent     python  docker.io/library/python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90
   ```

## Grant network access

A Sandbox cannot open any outbound connection until its template selects an EgressPolicy. Inside the Sandbox, a destination that no policy allows does not resolve, so a client reports a name-resolution error. For example, Python reports `Name or service not known`.

To allow a destination, [create an egress policy]({{< link path="agents/egress-policies" >}}) in the template's namespace and update the template to refer to the egress policy. A policy change applies to running and suspended Sandboxes without recreating them.

## Update or delete a template

When you edit a template, kagent prepares a new revision. New Sandboxes use the new revision after it is ready, and existing Sandboxes keep the revision that they were created from. If the new revision fails to prepare, callers keep creating Sandboxes from the last revision that succeeded.

When you delete a template, callers can no longer create Sandboxes from it. Sandboxes that already exist keep running until they are deleted or expire.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/cli" >}}` title="Run commands with the CLI" subtitle="Create a Sandbox from this template, run commands, and move files." >}}
  {{< card link=`{{< link path="agents/egress-policies" >}}` title="Egress policies" subtitle="Grant a Sandbox access to a destination, and inject a credential." >}}
{{< /cards >}}
