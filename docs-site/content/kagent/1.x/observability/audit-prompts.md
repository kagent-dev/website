---
title: Audit prompts
description: Export the prompts and replies that your agents exchange with a model as OpenTelemetry log events, then query them in a logging backend.
weight: 30
author: kagent.dev
---

Audit every prompt (input) and reply (output) that passes between your agents and their models. Security and compliance teams use these records to review how people use your kagent environment. For example, you can confirm that no request sends personally identifiable information (PII) to a model. You can also reconstruct the instructions that an agent received in an earlier conversation.

## About prompt auditing

The agent runtime emits each message as an OpenTelemetry (OTel) log event. You export these events over the OpenTelemetry Protocol (OTLP) to a logging backend or to a security information and event management (SIEM) system.

### Trace correlation

The runtime emits each event from inside the model call. Each event records the trace ID and the span ID of the request that produced it. Those IDs let you match an audit record to the trace of the same request. The runtime populates both IDs whether or not you enable tracing, but only an enabled tracing pipeline exports the matching trace. With tracing disabled, a lookup of the trace ID in your tracing backend returns nothing. For more information, see [Tracing]({{< link path="observability/tracing" >}}).

### Events

The runtime emits three event names for each model call. The system prompt and the model's reply each produce one event. The message history produces one event for every entry that it holds.

| Event name | What it holds |
| ---------- | ------------- |
| `gen_ai.system.message` | The system prompt for the request, as one concatenated string. |
| `gen_ai.user.message` | One entry from the request's message history. The entry holds a person's message, an earlier agent turn, or a tool result. |
| `gen_ai.choice` | The model's reply, with the reply content and a `finish_reason`. On a turn that calls a tool, the reply content holds the tool call and its arguments instead of text. |

An audit returns more than the prompts that your team wrote. A `gen_ai.system.message` body holds the `systemPrompt` field of your AgentTemplate followed by instructions that the runtime appends, which name the agent and repeat its description. Tool traffic is included as well, because a tool call reaches the log with its arguments, and the tool's output returns as a `gen_ai.user.message` that holds the tool response.

> [!NOTE]
> The runtime labels every history entry as `gen_ai.user.message`, including the agent's own earlier turns and tool results. The `content.role` field in the event body names the speaker. To select only the messages that a person sent, filter on `content.role` instead of on the event name. Each turn also re-emits the full history, so a long conversation produces repeated events. Account for that volume when you set a retention period.

### Environment variables

Two environment variables on the agent runtime control the audit output.

- **`OTEL_LOGGING_ENABLED`**: Whether the runtime installs a log exporter. The default value is `false`, and the runtime then emits no audit events.
- **`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`**: Whether the events include message content. The default value for log events is `false`, and the runtime then replaces each message body with `<elided>`. The event metadata remains.

> [!IMPORTANT]
> The `otel.logging` settings in the kagent Helm chart configure the controller only. The controller passes a fixed list of tracing variables to the agent runtimes that it starts. That list holds no logging variable. As a result, `otel.logging.enabled=true` alone produces no audit events for an AgentInstance. Set the logging variables on the {{< gloss "Harness" >}}Harness{{< /gloss >}} instead, as shown in the following steps. A Harness `spec.env` entry for a logging variable takes effect as written. An entry for a tracing variable does not, because the controller's own value overrides it.

### Runtime support

Only the `kagent` runtime emits these events. The runtime emits them from the model call itself, not from a provider-specific instrumentation library. Auditing therefore covers every model provider that the `kagent` runtime supports. For the available runtimes, see [Choose a runtime]({{< link path="agents/agent-harness#choose-a-runtime" >}}).

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).
2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have a Harness and an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} to configure.

## Install a collector and a logging backend

Set up the path that audit events take from the agent runtime to a logging backend. The runtime exports to an OpenTelemetry collector, and the collector forwards the events to the backend. These steps install Grafana Loki as that backend, because Loki supports the queries that this guide runs later. Datadog, Splunk, and other OTLP-compatible systems work in the same way.

Export to a collector rather than directly to the backend. The collector holds the rules for which content and metadata leave your cluster. Audit events carry prompt text, so those rules matter more than they do for other telemetry. The collector also lets you change the rules without creating a new AgentInstance.

1. Add the OpenTelemetry Helm repository.
   ```bash
   helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
   helm repo update
   ```

2. Install Loki in single-binary mode. The values file disables the two Loki memcached caches, because the chart requests roughly 10 GB of memory for them by default and a single-node cluster cannot schedule that request.
   ```yaml
   helm upgrade --install loki loki \
   --repo https://grafana.github.io/helm-charts \
   --version {{< reuse "kagent-docs/versions/loki.md" >}} \
   --namespace telemetry \
   --create-namespace \
   --values - <<EOF
   loki:
     commonConfig:
       replication_factor: 1
     schemaConfig:
       configs:
         - from: 2024-04-01
           store: tsdb
           object_store: s3
           schema: v13
           index:
             prefix: loki_index_
             period: 24h
     auth_enabled: false
   singleBinary:
     replicas: 1
   minio:
     enabled: true
   gateway:
     enabled: false
   test:
     enabled: false
   monitoring:
     selfMonitoring:
       enabled: false
       grafanaAgent:
         installOperator: false
   lokiCanary:
     enabled: false
   chunksCache:
     enabled: false
   resultsCache:
     enabled: false
   limits_config:
     allow_structured_metadata: true
   memberlist:
     service:
       publishNotReadyAddresses: true
   deploymentMode: SingleBinary
   backend:
     replicas: 0
   read:
     replicas: 0
   write:
     replicas: 0
   ingester:
     replicas: 0
   querier:
     replicas: 0
   queryFrontend:
     replicas: 0
   queryScheduler:
     replicas: 0
   distributor:
     replicas: 0
   compactor:
     replicas: 0
   indexGateway:
     replicas: 0
   bloomCompactor:
     replicas: 0
   bloomGateway:
     replicas: 0
   EOF
   ```

3. Verify that the logging backend is running.
   ```bash
   kubectl get pods -n telemetry
   ```
   Example output:
   ```console
   NAME           READY   STATUS    RESTARTS   AGE
   loki-0         2/2     Running   0          112s
   loki-minio-0   1/1     Running   0          112s
   ```

4. Create a Helm values file for the collector. The `debug` exporter prints each received event to the collector's own log. Use that log to confirm that events arrive, before you query the backend.
   ```yaml
   cat > otel-collector-audit.yaml <<EOF
   mode: deployment
   image:
     repository: otel/opentelemetry-collector
   config:
     receivers:
       otlp:
         protocols:
           grpc:
             endpoint: 0.0.0.0:4317
           http:
             endpoint: 0.0.0.0:4318
     processors:
       batch:
         timeout: 10s
         send_batch_size: 1024
     exporters:
       debug:
         verbosity: detailed
       otlp_http:
         endpoint: "http://loki.telemetry.svc.cluster.local:3100/otlp"
         tls:
           insecure: true
     service:
       pipelines:
         logs:
           receivers: [otlp]
           processors: [batch]
           exporters: [debug, otlp_http]
   EOF
   ```

   To use a backend other than Loki, replace the `otlp_http` endpoint with the OTLP address of that backend. For example, Datadog uses `https://api.datadoghq.com`.

5. Install the collector with the values file that you created.
   ```bash
   helm install opentelemetry-collector-audit open-telemetry/opentelemetry-collector \
     --namespace telemetry \
     --version {{< reuse "kagent-docs/versions/otel-collector.md" >}} \
     --values otel-collector-audit.yaml
   ```

6. Verify that the collector is running.
   ```bash
   kubectl get pods -n telemetry -l app.kubernetes.io/name=opentelemetry-collector
   ```
   Example output:
   ```console
   NAME                                            READY   STATUS    RESTARTS   AGE
   opentelemetry-collector-audit-xxxxxxxxx-xxxxx   1/1     Running   0          30s
   ```

## Turn on audit logging

Add the audit variables to the Harness that your agents run on. The runtime then audits every AgentTemplate that the Harness admits. Auditing therefore applies to an entire Harness, not to a single agent.

1. Add the three environment variables to the Harness. Keep the rest of its configuration unchanged.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: Harness
   metadata:
     name: my-first-harness
     namespace: kagent
   spec:
     kagent: {}
     workload:
       image: <runtime-image>@sha256:<digest>
     env:
       - name: OTEL_LOGGING_ENABLED
         value: "true"
       - name: OTEL_EXPORTER_OTLP_LOGS_ENDPOINT
         value: http://opentelemetry-collector-audit.telemetry.svc.cluster.local:4317
       - name: OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT
         value: "true"
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         location: gs://<your-bucket>/kagent/
     allowedAgentTemplates:
       selector:
         matchLabels:
           kagent.dev/harness: my-first-harness
   EOF
   ```

   {{< reuse "kagent-docs/snippets/review-table.md" >}} The first two variables enable auditing and set its destination. The third variable controls whether the events include message content. For every other field that a Harness takes, see [Agent harness]({{< link path="agents/agent-harness" >}}).

   | Variable | Description |
   | -------- | ----------- |
   | `OTEL_LOGGING_ENABLED` | Installs the log exporter in the agent runtime. If omitted, the runtime emits no audit events, regardless of the other variables. |
   | `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | The address that the runtime exports events to. Set it to the address of the collector. To export over HTTP instead of gRPC, set `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL` to `http/protobuf` and use port `4318`. |
   | `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | Includes message content in the events. If omitted, each event body reads `<elided>`, and the runtime exports only the metadata and the trace IDs. Those fields still record which agent handled a request, and when. |

2. Confirm that kagent compiled a new {{< gloss "Revision" >}}revision{{< /gloss >}} for the edited Harness. The Harness is current when `latestSuccessfulRevision` matches `desiredRevision`.
   ```bash
   kubectl get agenttemplate my-first-agent -n kagent \
     -o jsonpath='{range .status.harnesses[*]}{.harness}{"\t"}{.desiredRevision}{"\t"}{.latestSuccessfulRevision}{"\n"}{end}'
   ```

   Example output:
   ```console
   my-first-harness	4b8e1d3f5a7c9e2b0d4f6a8c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b	4b8e1d3f5a7c9e2b0d4f6a8c1e3b5d7f9a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b
   ```

3. Create a new AgentInstance. An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} pins the revision that it was created from, so an existing instance continues to run without the audit variables.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

## Verify the setup

1. Send a request to the new AgentInstance to produce audit events.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   kagent invoke --agent-instance $INSTANCE_ID --task "What is 2+2?"
   ```

2. Check that the collector received the events. The collector logs its own metrics to the same stream, so filter the output for the audit records.
   ```bash
   kubectl -n telemetry logs -l app.kubernetes.io/name=opentelemetry-collector --tail=200 \
     | grep -B 5 -A 4 "EventName: gen_ai"
   ```
   Example output:
   ```console
   LogRecord #1
   ObservedTimestamp: 2026-09-03 19:26:18.48324493 +0000 UTC
   Timestamp: 1970-01-01 00:00:00 +0000 UTC
   SeverityText:
   SeverityNumber: Unspecified(0)
   EventName: gen_ai.user.message
   Body: Map({"content":{"parts":[{"text":"What is 2+2?"}],"role":"user"}})
   Trace ID: 3d34d2f1b74f30a5cce0d5ed8571e928
   Span ID: 12671255711f5511
   Flags: 1
   ```

   The runtime leaves the `Timestamp` field unset, so every record reports `1970-01-01 00:00:00`. Read `ObservedTimestamp` instead, which records when the collector received the event.

   > [!NOTE]
   > The runtime buffers audit events and exports them in batches, and Agent Substrate suspends an Actor as soon as its response completes. A short conversation can therefore finish before the runtime exports its events, and this command then returns nothing. Send another request to the AgentInstance and check again.

3. Forward the Loki query port. Leave the command running.
   ```bash
   kubectl port-forward -n telemetry svc/loki 3100:3100
   ```

4. Query the events for the agent's service. The runtime builds the service name from the AgentTemplate name and the Harness name, and replaces each hyphen with an underscore. For example, `my-first-agent` on `my-first-harness` reports as `my_first_agent_my_first_harness`.
   ```bash
   curl -s -G 'http://localhost:3100/loki/api/v1/query_range' \
     --data-urlencode 'query={service_name="my_first_agent_my_first_harness"}' \
     --data-urlencode "start=$(( $(date +%s) - 3600 ))000000000" \
     --data-urlencode "end=$(date +%s)000000000" | jq
   ```

   Each entry holds the message content in the log line. The `stream` object holds the agent identity in the `service_name` and `service_namespace` labels, and holds the trace IDs as structured metadata. Loki does not record the event name, so the response carries no `event_name` field, and every event from one request shares a single stream. Example output:
   ```json
   {
     "status": "success",
     "data": {
       "resultType": "streams",
       "result": [
         {
           "stream": {
             "service_name": "my_first_agent_my_first_harness",
             "service_namespace": "kagent",
             "scope_name": "gcp.vertex.agent",
             "trace_id": "3d34d2f1b74f30a5cce0d5ed8571e928",
             "span_id": "12671255711f5511",
             "flags": "1"
           },
           "values": [
             [
               "1788463578483244930",
               "{\"content\":{\"parts\":[{\"text\":\"What is 2+2?\"}],\"role\":\"user\"}}"
             ],
             [
               "1788463578483063303",
               "{\"content\":\"You are a concise, helpful assistant. ...\"}"
             ]
           ]
         }
       ]
     }
   }
   ```

## Refine audit queries

An audit usually needs a narrower set of events than the full message history of one agent. Loki does not index the event name, so each of the following examples selects an event type by a field in the event body instead. The examples use the Loki query language. Adapt each example to the query language of your own backend.

- Return only the model's replies. Only a `gen_ai.choice` event carries a `finish_reason` field, so that field selects the replies.
  ```bash
  curl -s -G 'http://localhost:3100/loki/api/v1/query_range' \
    --data-urlencode 'query={service_namespace="kagent"} | json reason="finish_reason" | reason != ""' \
    --data-urlencode "start=$(( $(date +%s) - 3600 ))000000000" \
    --data-urlencode "end=$(date +%s)000000000" | jq
  ```

- Return only the messages that a person sent, and exclude the agent's replayed history. The filter reads `content.role` from the event body, because only a person's message sets that field to `user`.
  ```bash
  curl -s -G 'http://localhost:3100/loki/api/v1/query_range' \
    --data-urlencode 'query={service_namespace="kagent"} | json role="content.role" | role="user"' \
    --data-urlencode "start=$(( $(date +%s) - 3600 ))000000000" \
    --data-urlencode "end=$(date +%s)000000000" | jq
  ```

- Return every message from every agent that contains a given string. For example, this query checks whether a request sent a credential to a model.
  ```bash
  curl -s -G 'http://localhost:3100/loki/api/v1/query_range' \
    --data-urlencode 'query={service_namespace="kagent"} |= "password"' \
    --data-urlencode "start=$(( $(date +%s) - 3600 ))000000000" \
    --data-urlencode "end=$(date +%s)000000000" | jq
  ```

To follow a request from its audit records into its trace, take the `trace_id` from any entry and look it up in your tracing backend. The lookup returns a trace only when [tracing]({{< link path="observability/tracing" >}}) is also enabled. With tracing disabled, the record still carries a trace ID, but no pipeline exported the trace that the ID names.

## Turn off audit logging

1. Remove the three environment variables from the `spec.env` field of the Harness.

2. Create a new AgentInstance, so that its Actor starts without the audit variables.

3. Remove the collector and the logging backend.
   ```bash
   helm uninstall opentelemetry-collector-audit -n telemetry
   helm uninstall loki -n telemetry
   kubectl delete namespace telemetry
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Follow one request from the controller through to the Actor that ran your agent." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Review every field that a Harness takes, including the environment that its runtime receives." >}}
{{< /cards >}}
