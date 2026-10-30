---
title: Debug
description: Find where kagent reports a failure, read the readiness conditions, and work back from a symptom to its cause.
weight: 30
author: kagent.dev
---

Most {{< reuse "kagent-docs/snippets/name-product.md" >}} failures surface in the readiness conditions on the {{< gloss "Agent" >}}Agent{{< /gloss >}}. This page explains where to read those conditions, how to tell the real failure from the ones that follow it, and how to work back from the symptoms that report nothing useful on their own.

## Where kagent reports status

A {{< gloss "Harness" >}}Harness{{< /gloss >}} and an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} have **no status at all**, and their list views have no status column, so a healthy resource and a broken one look identical.

```bash
kubectl get agenttemplate -n kagent
```
Example output:
```console
NAME        AGE
assistant   30h
```

The diagnostic surface is the Agent. An Agent pairs one AgentTemplate with one Harness, and its conditions cover that pairing.

```bash
kubectl get agent -n kagent
```
Example output:
```console
NAME        READY   AGE
assistant   True    30h
```

The `READY` column reports the status of the `Ready` condition and nothing else. To find the condition's reason and message, read the Agent's conditions directly.

```bash
kubectl get agent <name> -n kagent \
  -o jsonpath='{range .status.conditions[*]}{.type}{"="}{.status}{"  "}{.reason}{": "}{.message}{"\n"}{end}'
```

Example output for a healthy Agent:
```console
Accepted=True  Accepted: Agent explicitly selects its template and harness
ResolvedRefs=True  Resolved: All runtime references resolved
Compatible=True  Compatible: Resolved configuration is compatible with the Harness
Ready=True  Ready: ActorTemplate golden snapshot is ready
```

## Read the readiness conditions

The four conditions form a pipeline rather than an unordered set, so their order tells you how far preparation reached before it stopped.

Each condition covers one stage, and a stage runs only when the stage before it succeeded.

| Condition | Stage it covers | A failure here means |
| --------- | --------------- | -------------------- |
| `Accepted` | The Agent selects a template and a Harness. | Nothing. kagent writes this condition only as `True`, because an Agent references both resources explicitly. |
| `ResolvedRefs` | Every resource that the Agent references was found, including its AgentTemplate, its Harness, its ModelConfig, and any tool servers. | A reference points at something that does not exist, or the controller cannot read it. |
| `Compatible` | The resolved configuration is valid for the Harness. | The configuration asks for something that its Harness does not support. |
| `Ready` | The ActorTemplate's golden {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} exists, so Sessions can start from it. | Agent Substrate has not finished capturing the golden snapshot, or capture failed. |

When a stage fails, kagent marks that stage `False` with the real reason and message, then marks **every later stage `False` with the reason `Blocked`**. Only the first failure describes an actual problem.

**Read the first condition that is `False` and whose reason is not `Blocked`.** Everything after it is a consequence.

In the following example, one missing ModelConfig is the whole problem, and the two conditions after it do not add independent information.

```console
Accepted=True  Accepted: Agent explicitly selects its template and harness
ResolvedRefs=False  ReferenceResolutionFailed: resolve ModelConfig "does-not-exist": not found
Compatible=False  Blocked: blocked by ResolvedRefs
Ready=False  Blocked: blocked by ResolvedRefs
```

A failed golden snapshot is not final. When Agent Substrate fails to build the golden snapshot, kagent deletes the failed ActorTemplate and rebuilds it after 15 seconds, 1 minute, and 4 minutes, and then every 10 minutes indefinitely. While a rebuild waits, `Ready` is `False` with the reason `ActorTemplateRetrying` and a message such as `golden build failed (GoldenActorCrashed), retry 1 at <time>`. The message omits Agent Substrate's full error, because that error can quote your configuration. Read the full error in the controller log. When a configuration fault causes the failure, kagent retries until you edit the Agent or the SandboxTemplate.

```bash
kubectl logs -n kagent deploy/kagent-controller | grep "golden build failed"
```

The Agent's status also reports two revision fields. `desiredRevision` is the {{< gloss "Revision" >}}revision{{< /gloss >}} that the current spec should produce, and `latestSuccessfulRevision` is the newest revision that finished preparing. A missing `latestSuccessfulRevision` means that the Agent was never ready, and two differing values mean that the newest edit is not yet prepared.

The status also reports a `warnings` list. The list shows the compatibility decisions that kagent made without blocking the revision. A warning does not stop an Agent from becoming ready, and the conditions do not report it.

```bash
kubectl get agent <name> -n kagent -o jsonpath='{.status.warnings}'
```

## A new AgentTemplate never runs

When you create an AgentTemplate directly, nothing prepares it until an Agent references it. The template also has no status for a failure to appear on, so the problem surfaces only when you try to start a conversation.

```console
ERROR:
  Code: FailedPrecondition
  Message: Agent does not have a ready prepared revision
```

Check which Agents exist and what each one references.

```bash
kubectl get agents -n kagent \
  -o jsonpath='{range .items[*]}{.metadata.name}{" template="}{.spec.template.ref.name}{" harness="}{.spec.harnessRef.name}{"\n"}{end}'
```

Example output:
```console
assistant template=assistant harness=kagent
```

An Agent that defines its behavior inline prints an empty `template=`, because it has no `spec.template.ref` to read. If no Agent references your template, create one.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: assistant
  namespace: kagent
spec:
  template:
    ref:
      name: assistant
  harnessRef:
    name: kagent
EOF
```

> [!NOTE]
> An Agent with no conditions at all means that the controller has not reconciled it yet. An Agent with a failing condition means that reconciliation reached that stage and stopped.

## An agent turn times out

A turn that fails with a timeout reports the same error regardless of the underlying cause. To find the cause, rule out each of the following possibilities in order.

```console
ERROR:
  Code: Internal
  Message: actor "ai-01a087c0-1d72-775a-9a32-566acac7b685" request timed out
```

1. **Check that the {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} has ready Workers.** A pool with too few Workers produces exactly this error and does not log a capacity message anywhere. To learn how to recognize this problem and size the pool, see [Tune Agent Substrate]({{< link path="operations/tune-agent-substrate" >}}).
   ```bash
   kubectl get workerpools -n kagent
   ```

2. **Check the model provider.** A turn that reaches the model and waits on a slow or unreachable provider also times out. The agent's own logs name the provider error.

3. **Check the {{< gloss "Actor" >}}Actor{{< /gloss >}} state.** An Actor that is stuck in `RESUMING`, or that is in `CRASHED`, never answers.
   * To review the list of states, see [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume#actor-lifecycle-operations" >}}).
   * To get the current state for every actor, [call `GetSubstrateStatus`]({{< link path="operations/tune-agent-substrate#inspect-the-runtime" >}}).

## An edit to an AgentTemplate has no effect

An edit that appears to do nothing has two possible causes, and the Agent's conditions distinguish them.

One cause is a revision that never prepared. Compare the two revision fields on the Agent that references the template. When `desiredRevision` and `latestSuccessfulRevision` differ, the edit produces a new revision that is not ready, and the conditions say why.

```bash
kubectl get agent <name> -n kagent \
  -o jsonpath='{"desired="}{.status.desiredRevision}{" latestSuccessful="}{.status.latestSuccessfulRevision}{"\n"}'
```

The other cause is deliberate. A {{< gloss "Session" >}}Session{{< /gloss >}} runs the revision that it was created from for its whole life, so editing an AgentTemplate never changes a conversation that already exists. Create a new Session to pick up the edit.

## Collect logs

When the conditions do not explain a failure, collect evidence from the logs. Read the controller log to locate a single failing call, or collect a bug report to give someone else the full diagnostic data at once.

### Read the controller log

The controller records every API call with its gRPC status code.

```bash
kubectl logs -n kagent deployment/kagent-controller
```

A failing call appears as an `rpc completed` line whose `grpc_code` is not `OK`. Search for that line to locate the failure without reading the whole log.

```console
{"time":"2026-09-09T19:23:47.112233381Z","level":"INFO","msg":"rpc completed","component":"grpc","grpc_method":"/lf.a2a.v1.A2AService/SendMessage","rpc_type":"unary","peer":"127.0.0.1:49588","grpc_code":"Internal","duration_ms":5033}
```

If the default log level does not have enough information, raise the controller's log level in your Helm values. The level defaults to `info`.

```yaml
config:
  logging:
    level: debug
```

### Collect a bug report

`kagent bug-report` collects diagnostic data in one command. It writes the kagent resources in a namespace, the names of its secrets, and the logs of every pod into a timestamped directory.

```bash
kagent bug-report -n kagent
```

> [!WARNING]
> A bug report contains your resource definitions and pod logs. These can contain prompts, tool output, and other sensitive material. Review the directory before you attach it to an issue.

The report covers kagent's own resources rather than the Agent Substrate installation underneath it, so add the WorkerPool and SandboxConfig resources when a problem looks like a capacity or sandbox issue.

```bash
kubectl get workerpools,sandboxconfigs -n kagent -o yaml
```
