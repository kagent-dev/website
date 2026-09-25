---
title: Audit prompts
description: Capture the prompts and replies that your agents exchange with a model in your traces, then find them in your tracing backend for security and compliance review.
weight: 50
author: kagent.dev
---

Audit the prompts (inputs) and replies (outputs) that pass between your agents and their models. Security and compliance teams use these records to review how people use your {{< reuse "kagent-docs/snippets/name-product.md" >}} environment. For example, you can confirm that no request sends personally identifiable information (PII) to a model. You can also reconstruct the instructions that an agent received in an earlier conversation.

## About prompt auditing

{{< reuse "kagent-docs/snippets/name-product.md" >}} records prompts and replies in traces. When you turn on content capture, the spans for each model call carry the request that the agent sent and the reply that it received. You then find the records in your tracing backend, by agent, by conversation, or by the text that they contain.

The `kagent` runtime does not write prompts or replies to log records, so a logging backend on its own cannot hold a prompt audit trail. Capture is off by default, because the content can include sensitive user and model data.

### What each runtime records

Each runtime records the content on its own instrumentation, so where the content lands differs by runtime. For the available runtimes, see [Choose a runtime]({{< link path="agents/agent-harness#choose-a-runtime" >}}).

| Runtime | Where the content goes | Settings |
| ------- | ---------------------- | -------- |
| `kagent` | The `generate_content` span of each model call, in two attributes. See [What a record holds](#what-a-record-holds). | `otel.captureSensitiveContent` |
| `codex` | The runtime's own spans. | `otel.captureSensitiveContent` |
| `claude` | Prompts and tool details on spans, and assistant replies in the runtime's own log records. With `otel.logging.captureRawApiBodies`, the log records also carry the complete provider request and response bodies, which is a fuller record than the spans give you. | `otel.captureSensitiveContent`, `otel.logging.captureRawApiBodies` |
| `byo` | Nowhere. The controller sends this runtime no telemetry configuration. | None |

For each setting, see the agent harness [telemetry content settings]({{< link path="agents/agent-harness#telemetry-content-settings" >}}).

### What a record holds

On the `kagent` runtime, each `generate_content` span carries the following two attributes, as JSON.

| Attribute | What it holds |
| --------- | ------------- |
| `gcp.vertex.agent.llm_request` | The whole request that the runtime sent to the model. |
| `gcp.vertex.agent.llm_response` | The model's reply. On a turn that calls a tool, the reply holds the tool call and its arguments instead of text. |

The request holds more than the prompts that your team wrote.

- **The system instruction**, which holds the `systemPrompt` field of your AgentTemplate followed by instructions that the runtime appends.
- **The message history**, including the person's messages, the agent's earlier turns, and tool results.
- **The tools** that the agent offered the model, with their definitions.

Each model call carries the full history again, so a long conversation repeats its earlier messages in every span. Account for that volume when you set a retention period.

A payload larger than 32 KiB is cut to a prefix. The attribute then holds a JSON object with `truncated` set to `true`, the `original_size` of the payload in bytes, and the first 32 KiB in `payload_prefix`. Your tracing backend might also limit the size of an attribute, so check its limits before you rely on it for long conversations.

### Delivery

Agent Substrate suspends an Actor as soon as a response completes. The controller therefore sets the `kagent` and `codex` runtimes to flush their spans before each response completes, so that the records of a turn reach your backend before the Actor suspends. The `claude` runtime gets no such flush, so the records of a conversation's last turn can be lost. For more information, see [Traces from a suspended Actor]({{< link path="observability/tracing#traces-from-a-suspended-actor" >}}).

> [!IMPORTANT]
> Traces are a best-effort record. An exporter drops spans without an error when the collector is unreachable or its queue is full, and nothing in the trace shows that a record is missing. Treat captured spans as a review aid, not as a complete or tamper-proof compliance log.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).
2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have a Harness and an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} to send requests to. That guide also installs the kagent CLI. The steps on this page need the {{< reuse "kagent-docs/versions/kagent.md" >}} CLI, because earlier CLI versions have no `agent-instance` commands and fail with `unknown command`. To check your version, run `kagent version`.
3. Install [`jq`](https://jqlang.org/download/), to read the AgentInstance ID and revision out of the CLI's JSON output.
4. Set up a tracing backend, and turn on tracing. The [OTel stack]({{< link path="observability/otel-stack" >}}) sends traces to Tempo, and the [Lightweight OTel stack]({{< link path="observability/lightweight-otel-stack" >}}) sends traces to Jaeger. Both guides turn on tracing for you.

## Turn on content capture

Turn on content capture in the kagent Helm release, then create an AgentInstance that picks up the new setting.

1. Save the current revision of your Harness and AgentTemplate pair. A later step uses it to tell when kagent rebuilds the pair with the new setting. The command first waits for any rebuild that is still in progress, such as one from an earlier Helm upgrade, so that it saves a finished revision.
   ```bash
   for i in $(seq 1 60); do
     REVISIONS=$(kubectl get agenttemplate my-first-agent -n kagent \
       -o jsonpath='{.status.harnesses[0].desiredRevision} {.status.harnesses[0].latestSuccessfulRevision}')
     [ "${REVISIONS% *}" = "${REVISIONS#* }" ] && break
     sleep 5
   done
   export OLD_REVISION=${REVISIONS#* }
   echo "Current revision: $OLD_REVISION"
   ```

2. Upgrade the kagent Helm release. The `--reuse-values` flag keeps the tracing settings that you already set.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent \
     --reuse-values \
     --set otel.captureSensitiveContent=true
   ```

   For an agent on the `claude` runtime, also set `otel.logging.enabled` to `true`, and send the logs to a backend that stores them, such as Loki in the [OTel stack]({{< link path="observability/otel-stack" >}}). Without log export, the replies of a `claude` agent are not recorded.

3. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

4. Wait for kagent to rebuild the pair. The controller rebuilds each pair after the controller restarts, and an AgentInstance that you create before the rebuild finishes starts from the previous revision, without the new setting. The following command prints `Recompiled` when the new revision is ready.
   ```bash
   for i in $(seq 1 60); do
     [ "$(kubectl get agenttemplate my-first-agent -n kagent \
       -o jsonpath='{.status.harnesses[0].latestSuccessfulRevision}')" != "$OLD_REVISION" ] \
       && echo "Recompiled" && break
     sleep 5
   done
   ```
   If the command finishes without printing `Recompiled`, the upgrade did not change the settings that kagent compiles into the pair. Either the setting was already in place, or the chart did not recognize the key. Helm accepts a key that a chart does not define without an error, so check that you upgraded to version {{< reuse "kagent-docs/versions/kagent.md" >}} of the chart, which uses the key on this page.

5. Create a new AgentInstance. An AgentInstance keeps the runtime configuration that it was created with, so only a new AgentInstance captures content.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

6. Confirm that the AgentInstance runs the current revision of the pair. If the command prints `Outdated`, the AgentInstance was created from an earlier revision, and does not capture content. Create another AgentInstance, and run the command again.
   ```bash
   for i in $(seq 1 60); do
     REVISIONS=$(kubectl get agenttemplate my-first-agent -n kagent \
       -o jsonpath='{.status.harnesses[0].desiredRevision} {.status.harnesses[0].latestSuccessfulRevision}')
     [ "${REVISIONS% *}" = "${REVISIONS#* }" ] && break
     sleep 5
   done
   INSTANCE_REVISION=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .preparedRevision')
   [ "$INSTANCE_REVISION" = "${REVISIONS#* }" ] && echo "Current" || echo "Outdated"
   ```

## Verify the setup

Send a request that contains a distinctive phrase, then find that phrase in the captured request.

1. Send a request to the new AgentInstance.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   kagent invoke --agent-instance $INSTANCE_ID --task "Audit check: what is 2+2?"
   ```

2. Find the captured request in your tracing backend.
   {{< tabs >}}
   {{% tab name="Grafana with Tempo" %}}
   1. Forward the Grafana port, and leave the command running.
      ```bash
      kubectl port-forward -n telemetry svc/kube-prometheus-stack-grafana 3000:80
      ```
   2. In your browser, open Grafana at [http://localhost:3000](http://localhost:3000), and log in. For the password, see [Explore the telemetry in Grafana]({{< link path="observability/otel-stack#explore-the-telemetry-in-grafana" >}}).
   3. Open **Explore**, select the **Tempo** data source, and select the **TraceQL** query type.
   4. Run the following query, which returns the model calls whose request contains the phrase.
      ```text
      { span.gcp.vertex.agent.llm_request =~ ".*Audit check.*" }
      ```
   5. Open a trace, and select its `generate_content` span. The **Span Attributes** section shows the two attributes that [What a record holds](#what-a-record-holds) describes.
   {{% /tab %}}
   {{% tab name="Jaeger" %}}
   1. Forward the Jaeger query port, and leave the command running.
      ```bash
      kubectl port-forward -n telemetry svc/jaeger 16686:16686
      ```
   2. In your browser, open Jaeger at [http://localhost:16686](http://localhost:16686).
   3. From the **Service** list, select `my-first-agent-my-first-harness`. From the **Operation** list, select the `generate_content` operation for your model, such as `generate_content gpt-4.1-mini`, and click **Find Traces**.
   4. Open the most recent trace, and expand the `generate_content` span. The **Tags** section shows the two attributes that [What a record holds](#what-a-record-holds) describes.
   {{% /tab %}}
   {{< /tabs >}}

   If both attributes read `{}`, the AgentInstance started without content capture. Check that the previous section printed `Current`, and create a new AgentInstance if it did not.

3. To collect every model call of one conversation, search by its conversation ID. Every span of the conversation carries the ID in the `gen_ai.conversation.id` attribute. For the other attributes that you can search by, see [Correlation attributes]({{< link path="observability/tracing#correlation-attributes" >}}).

> [!CAUTION]
> Anyone who can read your tracing or logging backend can now read the prompts and replies of every agent. Restrict access to the backend, and set a retention period that meets your compliance requirements.

## Turn off content capture

Turn off content capture, then create a new AgentInstance so that the change takes effect.

1. Turn off content capture in the kagent Helm release. Tracing stays on.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --reuse-values \
     --set otel.captureSensitiveContent=false
   ```

2. Create a new AgentInstance, because an existing Actor keeps the configuration that it started with. The spans of an AgentInstance that still captures content keep carrying it until you delete the AgentInstance.

3. Delete the captured content from your backend when your retention policy requires it. Turning off capture does not remove the spans that your backend already stores.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Read the spans and attributes of an agent request." >}}
  {{< card link=`{{< link path="agents/agent-harness#telemetry-content-settings" >}}` title="Telemetry content settings" subtitle="Review how each content setting applies to each runtime." >}}
{{< /cards >}}
