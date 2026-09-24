---
title: Agent Substrate telemetry
description: Follow an agent's Actor across suspend and resume by using the Actor identity that Agent Substrate adds to its logs, traces, and metrics.
weight: 35
author: kagent.dev
---

Every {{< reuse "kagent-docs/snippets/name-product.md" >}} agent runs as an {{< gloss "Actor" >}}Actor{{< /gloss >}} on Agent Substrate. An Actor suspends after each turn, and can resume on a different {{< gloss "Worker" >}}Worker{{< /gloss >}} pod the next time, so telemetry that is keyed to a pod loses track of an agent between turns. To keep one agent's telemetry together, Agent Substrate labels its telemetry with the identity of the Actor rather than the pod that ran it.

## What Agent Substrate reports

Agent Substrate reports telemetry from its own components, separately from the telemetry that kagent reports for each agent request.

| Signal | Where it goes | Details |
| ------ | ------------- | ------- |
| Actor logs | The stdout of the Worker pod that runs the Actor | The Actor's own output, and records for each suspend and resume. See [Read an Actor's logs](#read-an-actors-logs). |
| Component logs | Over OTLP, when an OTLP endpoint is set | Logs from the Agent Substrate components, including an access log entry for every request that the router receives. |
| Traces | Over OTLP, when an OTLP endpoint is set | Scheduling, resume, and suspend work. These traces are separate from the agent request trace. See [Agent Substrate traces]({{< link path="observability/tracing#agent-substrate-traces" >}}). |
| Metrics | Over OTLP, when an OTLP endpoint is set | Worker capacity, scheduling, and snapshot timing. See [Agent Substrate metrics]({{< link path="observability/metrics#agent-substrate-metrics" >}}). |

The Agent Substrate Helm chart sets one OTLP endpoint for traces, metrics, and logs through `otel.endpoint`, and samples traces at a ratio of `0.01` by default through `otel.traces.samplingRatio`. The [OTel stack]({{< link path="observability/otel-stack#send-agent-substrate-telemetry-to-the-collector" >}}) and [Lightweight OTel stack]({{< link path="observability/lightweight-otel-stack" >}}) guides set both.

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

Agent Substrate keeps the labels that identify one Actor off its metrics, so that the number of time series does not grow with the number of conversations. Metrics carry the template and WorkerPool labels instead. To look into one agent, use its logs.

## Read an Actor's logs

1. Find the Actor for an AgentInstance. The Actor name is `ai-` followed by the AgentInstance ID.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   kubectl ate get actors --atespace kagent
   ```

   Example output:
   ```console
   ATESPACE   NAME                                      TEMPLATE                                              STATE                   WORKER POD   WORKER IP   VERSION   AGE
   kagent     ai-01a0d409-d249-728e-865c-ee58b55dff04   kagent/my-first-agent-my-first-harness-a995d20d30a7   ACTOR_STATE_SUSPENDED   <none>                   5         32m
   ```

2. Read the logs from the Workers of the WorkerPool that the Harness runs on. A Worker writes the output of every Actor that it runs, so filter the output by the Actor name. The filter returns the Actor's lines from every current Worker in the pool, including the lines from before the Actor last suspended. Worker output mixes JSON records with plain text lines, so the filter skips any line that is not JSON.
   ```bash
   export WORKER_POOL=$(kubectl get harness my-first-harness -n kagent \
     -o jsonpath='{.spec.substrate.workerPoolRef.name}')
   kubectl logs -n kagent -l ate.dev/worker-pool=$WORKER_POOL --tail=-1 \
     | jq -cR "fromjson? | select(.labels[\"ate.actor.name\"] == \"ai-${INSTANCE_ID}\")"
   ```

   Example output:
   ```console
   {"labels":{"ate.actor.name":"ai-01a0d409-d249-728e-865c-ee58b55dff04","ate.actor.uid":"c91579a8-675c-474c-9437-4482ac628774","ate.atespace":"kagent","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-a995d20d30a7"},"message":"Actor restoring","span_id":"d81bb304af04c945","time":"2026-09-24T16:02:52.008842377Z","trace_flags":"00","trace_id":"3b8987f98057610937b38639136d32b5"}
   {"labels":{"ate.actor.name":"ai-01a0d409-d249-728e-865c-ee58b55dff04","ate.actor.uid":"c91579a8-675c-474c-9437-4482ac628774","ate.atespace":"kagent","ate.template.atespace":"kagent","ate.template.name":"my-first-agent-my-first-harness-a995d20d30a7"},"message":"Actor checkpointed","span_id":"4914db77fcc2f59b","time":"2026-09-24T15:30:09.671009219Z","trace_flags":"01","trace_id":"c4971ca2e614428819443f64fe70f81c"}
   ```

   `kubectl logs` reads only the Worker pods that exist now. When a Worker pod is replaced, the output that it held is gone. To keep an Actor's history across Worker replacements, collect the stdout of the Worker pods with a log agent that stores structured JSON, and query it by the same labels. Neither OTel stack guide collects pod stdout.

The `kubectl ate logs actors` command streams the output of a single Actor, but only while the Actor is running on a Worker. A kagent agent runs only during a turn, and the command returns an error the rest of the time.

```console
Error: actor kagent/ai-01a0d409-d249-728e-865c-ee58b55dff04 is not currently running on any worker pod
```

## Suspend and resume records

The records that Agent Substrate writes for an Actor mark each step of a suspend and resume cycle. Each record carries the Actor labels and a `message` field, and no container label. To list only these records for an Actor, filter out the lines that have a container label.

```bash
kubectl logs -n kagent -l ate.dev/worker-pool=$WORKER_POOL --tail=-1 \
  | jq -cR "fromjson? | select(.labels[\"ate.actor.name\"] == \"ai-${INSTANCE_ID}\" and .labels[\"ate.actor.container.name\"] == null) | {time, message}"
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
| `Actor restoring` | A Worker begins to restore the Actor from a snapshot. An AgentInstance's Actor restores even for its first turn, from the snapshot that kagent built for the pair, so this is the first record for every AgentInstance. |
| `Actor restored` | The restore finishes and the Actor can serve the request. |
| `Actor checkpointing` | The Actor begins to suspend, and Agent Substrate begins to write its snapshot. |
| `Actor checkpointed` | The snapshot is written. The Actor is suspended, and the Worker is free for another Actor. |

Each turn produces one cycle of the four records. The time between `Actor restoring` and `Actor restored` is how long the agent took to wake up for the turn.

The Actor that builds a pair's first snapshot, in the `ate-golden` atespace, writes `Actor starting` and `Actor started` instead of the restore records, because it has no snapshot to restore from.

Each record also carries `trace_id`, `span_id`, and `trace_flags`, which join it to the Agent Substrate trace for the same operation. A `trace_flags` value of `01` means that the trace was sampled and is in your tracing backend. A value of `00` means that the trace was not sampled, which is the case for most requests at the default ratio of `0.01`.

## Learn more

The Agent Substrate project documents its telemetry in full, including the complete metric registry, in [Actor observability](https://github.com/agent-substrate/substrate/blob/main/docs/observability.md). That page describes the newest Agent Substrate, which can be ahead of version {{< reuse "kagent-docs/versions/agent-substrate.md" >}} that this guide uses. Records that it describes might not exist in your version, such as actor state change events and per-Actor usage samples.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Read the spans of an agent request, and the separate Agent Substrate traces." >}}
  {{< card link=`{{< link path="substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand what happens to an Actor between turns." >}}
{{< /cards >}}
