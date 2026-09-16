---
title: Debug
description: Find where kagent reports a failure, read the readiness conditions, and work back from a symptom to its cause.
weight: 30
author: kagent.dev
---

Most kagent failures surface in one place: the readiness conditions that a {{< gloss "Harness" >}}Harness{{< /gloss >}} writes onto the {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} that it admits. This page explains where to read those conditions, how to tell the real failure from the ones that follow it, and how to work back from the symptoms that report nothing useful on their own.

## Where kagent reports status

Two habits from Kubernetes lead nowhere here, so it is worth knowing what reports nothing before you start.

A Harness carries **no status at all**. Its `READY` column is always blank, and the resource has no `status` key to read.

```bash
kubectl get harness -n kagent
```
Example output:
```console
NAME     READY   AGE
kagent           30h
```

The AgentTemplate list view carries no status column either, so a healthy template and a broken one look identical in it.

```bash
kubectl get agenttemplate -n kagent
```
Example output:
```console
NAME        AGE
assistant   30h
```

The diagnostic surface is the AgentTemplate's `status.harnesses[]` array. Each entry covers one Harness that admits the template, and it holds that pairing's conditions and revisions. Read it directly.

```bash
kubectl get agenttemplate <name> -n kagent \
  -o jsonpath='{range .status.harnesses[*]}{"Harness: "}{.harness}{"\n"}{range .conditions[*]}{"  "}{.type}{"="}{.status}{"  "}{.reason}{": "}{.message}{"\n"}{end}{end}'
```
Example output from a healthy pairing:
```console
Harness: kagent
  Accepted=True  Accepted: Harness admission selector matches the AgentTemplate
  ResolvedRefs=True  Resolved: All runtime references resolved
  Compatible=True  Compatible: Resolved configuration is compatible with the Harness
  Ready=True  Ready: ActorTemplate golden snapshot is ready
```

## Read the readiness conditions

The four conditions form a pipeline rather than an unordered set, so their order tells you how far preparation reached before it stopped.

Each condition covers one stage, and a stage runs only when the stage before it succeeded.

| Condition | Stage it covers | A failure here means |
| --------- | --------------- | -------------------- |
| `Accepted` | The Harness admission selector matched this AgentTemplate. | Nothing. This condition is only ever written as `True`, so a template that fails admission has no entry rather than a false one. |
| `ResolvedRefs` | Every resource that the template names was found, including its ModelConfig and any tool servers. | A reference points at something that does not exist, or the controller cannot read it. |
| `Compatible` | The resolved configuration is valid for the Harness runtime. | The template asks for something that its Harness runtime does not support. |
| `Ready` | The ActorTemplate's golden {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} exists, so instances can start from it. | Agent Substrate has not finished capturing the golden snapshot, or capture failed. |

When a stage fails, kagent marks that stage `False` with the real reason and message, then marks **every later stage `False` with the reason `Blocked`**. Only the first failure describes an actual problem.

**Read the first condition that is `False` and whose reason is not `Blocked`.** Everything after it is a consequence.

In the following example, one missing ModelConfig is the whole problem, and the two conditions after it carry no independent information.

```console
Harness: kagent
  Accepted=True  Accepted: Harness admission selector matches the AgentTemplate
  ResolvedRefs=False  ReferenceResolutionFailed: resolve ModelConfig "does-not-exist": not found
  Compatible=False  Blocked: blocked by ResolvedRefs
  Ready=False  Blocked: blocked by ResolvedRefs
```

The same entry carries two revision fields that answer a different question. `desiredRevision` is the {{< gloss "Revision" >}}revision{{< /gloss >}} that the current spec should produce, and `latestSuccessfulRevision` is the newest one that finished preparing. A missing `latestSuccessfulRevision` means the template has never been ready, and two differing values mean the newest edit has not prepared yet.

## An AgentTemplate reports no conditions

An AgentTemplate that no Harness admits gets no `status.harnesses[]` entry at all, so any command that ranges over that array prints nothing.

The status object holds an `observedGeneration` and nothing else.

```console
status:
  observedGeneration: 1
```

No error appears on either resource, because the Harness has no status to write one to and the AgentTemplate was never paired. The failure surfaces only when you try to use the template.

```console
ERROR:
  Code: FailedPrecondition
  Message: AgentTemplate and Harness do not have a ready prepared revision
```

The cause is almost always a missing admission label. A Harness admits AgentTemplates through `spec.allowedAgentTemplates.selector`, and the Harness that ships with kagent selects on one label.

```bash
kubectl get harness kagent -n kagent -o jsonpath='{.spec.allowedAgentTemplates.selector}'
```
Example output:
```console
{"matchLabels":{"kagent.dev/harness":"kagent"}}
```

Add the label that the selector expects, and the conditions appear within seconds.

```yaml
apiVersion: kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: assistant
  namespace: kagent
  labels:
    kagent.dev/harness: kagent
```

> [!NOTE]
> No entry in `status.harnesses[]` means admission never happened, so check the label first. An entry with a failing condition means admission succeeded and a later stage failed.

## An agent turn times out

A turn that fails with a timeout reports the same error whatever the underlying cause, so this symptom needs elimination rather than reading.

```console
ERROR:
  Code: Internal
  Message: actor "ai-01a087c0-1d72-775a-9a32-566acac7b685" request timed out
```

Work through the causes in this order.

1. **Check that the {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} has ready Workers.** A pool with too few Workers produces exactly this error and logs no capacity message anywhere. To learn how to recognize this problem and size the pool, see [Tune Agent Substrate]({{< link path="operations/tune-agent-substrate" >}}).
   ```bash
   kubectl get workerpools -n kagent
   ```

2. **Check the model provider.** A turn that reaches the model and waits on a slow or unreachable provider also times out. The agent's own logs name the provider error.

3. **Check the {{< gloss "Actor" >}}Actor{{< /gloss >}} state.** An Actor stuck in `RESUMING`, or sitting in `CRASHED`, never answers.
   * To review the list of states, see [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume/#actor-lifecycle-operations" >}}).
   * To get the current state for every actor, [call `GetSubstrateStatus`]({{< link path="operations/tune-agent-substrate#inspect-the-runtime" >}}).

## An edit to an AgentTemplate has no effect

An edit that appears to do nothing has two possible causes, and the conditions distinguish them.

The first cause is a revision that never prepared. Compare the two revision fields on the AgentTemplate: when `desiredRevision` and `latestSuccessfulRevision` differ, the edit produced a new revision that has not become ready, and the conditions say why.

```bash
kubectl get agenttemplate <name> -n kagent \
  -o jsonpath='{range .status.harnesses[*]}{.harness}{" desired="}{.desiredRevision}{" latestSuccessful="}{.latestSuccessfulRevision}{"\n"}{end}'
```

The second cause is deliberate. An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} runs the revision that it was created from for its whole life, so editing an AgentTemplate never changes an instance that already exists. Create a new AgentInstance to pick up the edit.

## Collect logs

Once the resource status is exhausted, kagent offers two ways to gather evidence. Read the controller log to locate a single failing call, or collect a bug report to hand somebody else everything at once.

### Read the controller log

The controller records every API call with its gRPC status code.

```bash
kubectl logs -n kagent deployment/kagent-controller
```

A failing call appears as an `rpc completed` line whose `grpc_code` is not `OK`, which locates the failure without reading the whole log.

```console
{"time":"2026-09-09T19:23:47.112233381Z","level":"INFO","msg":"rpc completed","component":"grpc","grpc_method":"/lf.a2a.v1.A2AService/SendMessage","rpc_type":"unary","peer":"127.0.0.1:49588","grpc_code":"Internal","duration_ms":5033}
```

If the default log level does not have enough information, raise the controller's log level.

```yaml
controller:
  loglevel: debug
```

### Collect a bug report

`kagent bug-report` gathers the whole picture in one command. It writes the kagent resources in a namespace, the names of its secrets, and the logs of every pod into a timestamped directory.

```bash
kagent bug-report -n kagent
```

> [!WARNING]
> A bug report contains your resource definitions and pod logs, which can hold prompts, tool output, and other sensitive material. Review the directory before you attach it to an issue.

The report covers kagent's own resources rather than the Agent Substrate installation underneath it, so add the WorkerPool and the runtime status when a problem looks like a capacity or sandbox issue.

```bash
kubectl get workerpools,sandboxconfigs -n kagent -o yaml
```
