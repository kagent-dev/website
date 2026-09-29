---
title: Agent Substrate telemetry
description: Follow an agent's Actor across suspend and resume by using the Actor identity that Agent Substrate adds to its logs, traces, and metrics.
weight: 45
author: kagent.dev
---

Every {{< reuse "kagent-docs/snippets/name-product.md" >}} agent runs as an {{< gloss "Actor" >}}Actor{{< /gloss >}} on Agent Substrate. An Actor suspends after each turn, and can resume on a different {{< gloss "Worker" >}}Worker{{< /gloss >}} pod the next time, so telemetry that is keyed to a pod loses track of an agent between turns. To keep one agent's telemetry together, Agent Substrate labels its telemetry with the identity of the Actor rather than the pod that ran it.

## What Agent Substrate reports

Agent Substrate reports telemetry from its own components, separately from the telemetry that kagent reports for each agent request.

| Signal | Where it goes | Details |
| ------ | ------------- | ------- |
| Actor logs | The stdout of the Worker pod that runs the Actor | The Actor's own output, and records for each suspend and resume. See [Read an Actor's logs](#read-an-actors-logs). |
| Component logs | The stdout of each component, and over OTLP when an OTLP endpoint is set | Logs from the Agent Substrate components, including a record of every Actor state change and an access log entry for every request that the router receives. See [Actor state changes](#actor-state-changes). |
| Traces | Over OTLP, when an OTLP endpoint is set | Scheduling, resume, and suspend work. These traces are separate from the agent request trace. See [Agent Substrate traces]({{< link path="observability/tracing#agent-substrate-traces" >}}). |
| Metrics | Over OTLP, when an OTLP endpoint is set | Worker capacity, scheduling, and snapshot timing. See [Agent Substrate metrics]({{< link path="observability/metrics#agent-substrate-metrics" >}}). |

The Agent Substrate Helm chart sets one OTLP endpoint for traces, metrics, and logs through `otel.endpoint`, and samples traces at a ratio of `0.01` by default through `otel.traces.samplingRatio`. The [OTel stack]({{< link path="observability/otel-stack#send-agent-substrate-telemetry-to-the-collector" >}}) and [Lightweight OTel stack]({{< link path="observability/lightweight-otel-stack" >}}) guides set both.

The router access log and the Actor state change records are the two sources of Agent Substrate logs over OTLP, and the `otel.logs` settings control both together. To send them to a different backend than traces and metrics, set `otel.logs.endpoint`. To stop exporting them, set `otel.logs.enabled` to `false`. The chart has no setting for the access log alone.

## Actor identity

Agent Substrate adds the following labels to Actor logs and to its component logs about an Actor. Each label maps to a kagent object, so you can find an agent's telemetry from the AgentInstance or the AgentTemplate that you already know.

| Label | Value for a kagent agent |
| ----- | ------------------------ |
| `ate.actor.name` | `ai-<agent-instance-id>`, one Actor for each AgentInstance. |
| `ate.actor.uid` | A unique ID for the lifetime of the Actor. A deleted and recreated Actor gets a new one. |
| `ate.atespace` | The {{< gloss "Atespace" >}}atespace{{< /gloss >}} of the Actor, which is the namespace of the AgentTemplate and Harness, such as `kagent`. The Actors that build a pair's first snapshot run in `ate-golden` instead. |
| `ate.template.name` | The AgentTemplate name, the Harness name, and the short form of the {{< gloss "Revision" >}}revision{{< /gloss >}}, joined by hyphens, such as `my-first-agent-my-first-harness-a995d20d30a7`. All the AgentInstances of one pair at one revision share this value. |
| `ate.template.atespace` | Where the template lives, which matches `ate.atespace` for a kagent agent. |
| `ate.actor.container.name` | The container that wrote the line, such as `kagent`. Records for a suspend or resume omit this label, because the Actor writes them rather than a container. |

Agent Substrate metrics carry template and WorkerPool labels rather than the Actor identity, so that the number of time series does not grow with the number of conversations. To look into one agent, use its logs.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), including the `kubectl-ate` plugin that the installation guide describes.
2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), and send it at least one message, so that the `my-first-agent` AgentTemplate and the `my-first-harness` Harness have an Actor with logs to read. That guide also installs the kagent CLI.
3. Install [`jq`](https://jqlang.org/download/), to read the AgentInstance ID and filter the JSON log records.

## Read an Actor's logs

An Actor writes to the stdout of whichever Worker pod runs it, and a suspended Actor is assigned to no Worker at all. Find the Actor by its AgentInstance ID, then read the Worker pods of its WorkerPool and filter by the Actor's name.

1. Save the ID of the AgentInstance that you want to follow.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   echo $INSTANCE_ID
   ```

   A value of `null` means that no AgentInstance matched. The CLI lists only the AgentInstances that you created, so confirm that you are using the identity that created the agent.

2. Confirm that the Actor exists, and check its state. The Actor name is `ai-` followed by the AgentInstance ID.
   ```bash
   kubectl ate get actors ai-$INSTANCE_ID --atespace kagent
   ```

   Example output:
   ```console
   ATESPACE   NAME                                      TEMPLATE                                              STATE                   WORKER POD   WORKER IP   VERSION   AGE
   kagent     ai-01a0d409-d249-728e-865c-ee58b55dff04   kagent/my-first-agent-my-first-harness-a995d20d30a7   ACTOR_STATE_SUSPENDED   <none>                   5         32m
   ```

   `ACTOR_STATE_SUSPENDED` with a `WORKER POD` of `<none>` is the resting state between turns. Because a suspended Actor names no Worker, the remaining steps read every Worker in the pool rather than one pod.

3. Find the WorkerPool that the Harness runs on.
   ```bash
   export WORKER_POOL=$(kubectl get harness my-first-harness -n kagent \
     -o jsonpath='{.spec.substrate.workerPoolRef.name}')
   echo $WORKER_POOL
   ```

   Example output:
   ```console
   kagent-default
   ```

4. Read the Actor's lines from the Workers in the pool. A Worker writes the output of every Actor that it runs, so the filter selects a single Actor by name. Worker output mixes JSON records with plain text, so the filter also drops any line that is not a JSON object.
   ```bash
   kubectl logs -n kagent -l ate.dev/worker-pool=$WORKER_POOL --tail=-1 \
     | jq -cR --arg actor "ai-$INSTANCE_ID" \
       'fromjson? | objects | select(.labels["ate.actor.name"] == $actor)'
   ```

   Example output:
   ```console
   {"labels":{"ate.actor.name":"ai-01a0d409-d249-728e-865c-ee58b55dff04","ate.actor.uid":"c91579a8-675c-474c-9437-4482ac628774","ate.atespace":"kagent","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-a995d20d30a7"},"message":"Actor restoring","span_id":"d81bb304af04c945","time":"2026-09-24T16:02:52.008842377Z","trace_flags":"00","trace_id":"3b8987f98057610937b38639136d32b5"}
   {"labels":{"ate.actor.name":"ai-01a0d409-d249-728e-865c-ee58b55dff04","ate.actor.uid":"c91579a8-675c-474c-9437-4482ac628774","ate.atespace":"kagent","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-a995d20d30a7"},"message":"Actor checkpointed","span_id":"4914db77fcc2f59b","time":"2026-09-24T15:30:09.671009219Z","trace_flags":"01","trace_id":"c4971ca2e614428819443f64fe70f81c"}
   ```

   The filter returns the Actor's lines from every Worker that currently runs in the pool, including the lines from before the Actor last suspended.

`kubectl logs` reads only the Worker pods that exist now. When a Worker pod is replaced, the output that it held is gone. To keep an Actor's history across Worker replacements, collect the stdout of the Worker pods with a log agent that stores structured JSON, and query it by the same labels. Neither the OTel stack guide nor the Lightweight OTel stack guide collects pod stdout, because both configure the Collector with the OTLP receiver only.

Agent Substrate can also stream a single Actor's output directly, without the pool-wide filter.

```bash
kubectl ate logs actors ai-$INSTANCE_ID --atespace kagent
```

The command reads the Worker that the Actor runs on, so it works only while the Actor is running. A kagent agent runs only during a turn, and the command returns an error the rest of the time.

```console
Error: actor kagent/ai-01a0d409-d249-728e-865c-ee58b55dff04 is not currently running on any worker pod
```

## Suspend and resume records

The records that Agent Substrate writes for an Actor mark each step of a suspend and resume cycle. Each record carries the Actor labels and a `message` field, and no container label. To list only these records for an Actor, filter out the lines that have a container label.

```bash
kubectl logs -n kagent -l ate.dev/worker-pool=$WORKER_POOL --tail=-1 \
  | jq -cR --arg actor "ai-$INSTANCE_ID" \
    'fromjson? | objects | select(.labels["ate.actor.name"] == $actor and .labels["ate.actor.container.name"] == null) | {time, message}'
```

Example output:
```console
{"time":"2026-09-24T15:30:08.965994177Z","message":"Actor restoring"}
{"time":"2026-09-24T15:30:09.04801126Z","message":"Actor restored"}
{"time":"2026-09-24T15:30:09.582808844Z","message":"Actor checkpointing"}
{"time":"2026-09-24T15:30:09.671009219Z","message":"Actor checkpointed"}
{"time":"2026-09-24T16:02:52.008842377Z","message":"Actor restoring"}
{"time":"2026-09-24T16:02:52.093494544Z","message":"Actor restored"}
{"time":"2026-09-24T16:02:52.481758336Z","message":"Actor checkpointing"}
{"time":"2026-09-24T16:02:52.588873294Z","message":"Actor checkpointed"}
```

| `message` | Written when |
| --------- | ------------ |
| `Actor restoring` | A Worker begins to restore the Actor from a snapshot. An AgentInstance's Actor restores even for its first turn, from the snapshot that kagent built for the pair, so `Actor restoring` is the first record for every AgentInstance. |
| `Actor restored` | The restore finishes and the Actor can serve the request. |
| `Actor checkpointing` | The Actor begins to suspend, and Agent Substrate begins to write its snapshot. |
| `Actor checkpointed` | The snapshot is written. The Actor is suspended, and the Worker is free for another Actor. |

Each turn produces one cycle of the four records. The time between `Actor restoring` and `Actor restored` is how long the agent took to wake up for the turn.

The Actor that builds a pair's first snapshot, in the `ate-golden` atespace, writes `Actor starting` and `Actor started` instead of the restore records, because it has no snapshot to restore from.

Each record also carries `trace_id`, `span_id`, and `trace_flags`, which join the record to the Agent Substrate trace for the same operation. A `trace_flags` value of `01` means that the trace was sampled and is in your tracing backend. A value of `00` means that the trace was not sampled, which is the case for most requests at the default ratio of `0.01`.

## Actor state changes

The Agent Substrate API server, `ateapi`, writes an `Actor state changed` record each time an Actor moves to a new state. The record carries the Actor identity labels, the operation that caused the change in `ate.actor.operation.name`, and the new state in `ate.actor.state`. The last record for an Actor tells you its state, and when the Actor entered it.

| `ate.actor.state` | Meaning |
| ----------------- | ------- |
| `resuming` | A turn woke the Actor, and a Worker is restoring it. |
| `running` | The Actor is on a Worker and can serve the turn. |
| `suspending` | The turn ended, and the Actor is writing its snapshot. |
| `suspended` | The snapshot is written, and the Actor holds no Worker. |
| `deleting`, `deleted` | The AgentInstance was deleted. `deleted` is the last record that an Actor gets. |

`ateapi` runs more than one replica, and each replica writes only the changes that it handles. Read the logs of every replica.
```bash
for pod in $(kubectl get pods -n ate-system -o name | grep ate-api-server); do
  kubectl logs -n ate-system "$pod"
done | grep '"msg":"Actor state changed"' | grep "ai-${INSTANCE_ID}"
```

Example output:
```console
{"time":"2026-09-24T17:00:43.007925845Z","level":"INFO","msg":"Actor state changed","ate.atespace":"kagent","ate.actor.name":"ai-01a0d45b-c729-7d67-85c6-daa053202bff","ate.actor.uid":"831c62c5-b5ac-411f-b15e-7addfef97d73","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-699a5ed2f709","ate.actor.operation.name":"resume","ate.actor.state":"resuming","trace_id":"402701838ffd50932dc0aec8e43a1604","span_id":"1f8f032ff37422c7","trace_flags":"00"}
{"time":"2026-09-24T17:00:43.194765137Z","level":"INFO","msg":"Actor state changed","ate.atespace":"kagent","ate.actor.name":"ai-01a0d45b-c729-7d67-85c6-daa053202bff","ate.actor.uid":"831c62c5-b5ac-411f-b15e-7addfef97d73","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-699a5ed2f709","ate.actor.operation.name":"resume","ate.actor.state":"running","trace_id":"402701838ffd50932dc0aec8e43a1604","span_id":"f92aecd47d89ad68","trace_flags":"00"}
```

When the Agent Substrate release sets an OTLP endpoint, `ateapi` also exports each record as an OTLP log with the same attributes, so a logging backend receives the state changes of every Actor without reading pod output. Do not sample this stream. A dropped record leaves the last known state wrong, with nothing to show that a record is missing.

## Learn more

The Agent Substrate project documents its telemetry in full, including the complete metric registry, in [Actor observability](https://github.com/agent-substrate/substrate/blob/main/docs/observability.md). That page describes the newest Agent Substrate, which can be ahead of version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} that this guide uses. Records that it describes might not exist in your version, such as per-Actor usage samples and the restore timing breakdown.

You can also check out the following resources in this documentation set.

{{< cards >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Read the spans of an agent request, and the separate Agent Substrate traces." >}}
  {{< card link=`{{< link path="substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand what happens to an Actor between turns." >}}
{{< /cards >}}
