---
title: Audit prompts
description: Capture the prompts and replies that your agents exchange with a model in your traces, then find them in your tracing backend for security and compliance review.
weight: 50
author: kagent.dev
---

Audit the prompts (inputs) and replies (outputs) that pass between your agents and their models. Security and compliance teams use these records to review how people use your {{< reuse "kagent-docs/snippets/name-product.md" >}} environment. For example, you can confirm that no request sends personally identifiable information (PII) to a model. You can also reconstruct the instructions that an agent received in an earlier conversation.

## About prompt auditing

{{< reuse "kagent-docs/snippets/name-product.md" >}} records prompts and replies in traces. When you turn on content capture, the runtime records the agent's request and the model's reply on its spans. You then find the records in your tracing backend.

The `kagent` runtime does not write prompts or replies to log records, so a logging backend on its own cannot hold a prompt audit trail. Capture is off by default, because the content can include sensitive user and model data.

### Content capture by harness

Each harness records the content on its own instrumentation, so where the content lands differs by harness. The settings in the last column are the fields in the `config.runtimeDefaults.telemetry` Helm block. For the available harnesses, see [Choose a harness]({{< link path="agents/agent-harness#choose-a-harness" >}}).

| Harness | Where the content goes | Settings |
| ------- | ---------------------- | -------- |
| `kagent` | The `generate_content` span of each model call, in three attributes. See [What a record holds](#what-a-record-holds). | `captureContent` |
| `codex` | The `invoke_agent` span for prompts and replies, and the `execute_tool` span for tool arguments and successful results. Codex also records prompts in its own telemetry. | `captureContent` |
| `claude` | The `invoke_agent` span for prompts and replies, and the `execute_tool` span for tool arguments and successful results. Claude Code also records prompts and tool details on its own spans, and assistant replies in its own log records. With `captureRawApiBodies`, the log records also include the complete provider request and response bodies. These bodies are a fuller record than the spans. | `captureContent`, `captureRawApiBodies` |
| `byo` | Wherever the image's own instrumentation records it. The controller sets `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` on this harness, but an image that does not read the variable records nothing. | `captureContent` |

For each setting, see the agent harness [telemetry content settings]({{< link path="agents/agent-harness#telemetry-content-settings" >}}).

### What a record holds

On the `kagent` runtime, each `generate_content` span carries the following three attributes, as JSON.

| Attribute | What it holds |
| --------- | ------------- |
| `gen_ai.system_instructions` | The `systemPrompt` field of your AgentTemplate, followed by the instructions that the runtime appends. |
| `gen_ai.input.messages` | The chat history sent to the model, as a list of messages with a `role` and typed `parts`. |
| `gen_ai.output.messages` | The model's reply, with its `finish_reason`. On a turn that calls a tool, the reply holds the tool call and its arguments instead of text. |

The record holds more than the prompts that your team wrote.

The system instruction holds the instructions that the runtime appends as well as the prompt your team wrote, and the message history holds the person's messages, the agent's earlier turns, and the model's tool calls.

{{< reuse "kagent-docs/snippets/observability/audit-tool-attributes.md" >}}

On the `codex` and `claude` runtimes, the `invoke_agent` span holds only the current turn's prompt and the reply to that prompt. The `chat` spans hold no content. The `execute_tool` span holds tool arguments and successful results in the `gen_ai.tool.call.arguments` and `gen_ai.tool.call.result` attributes.

On the `kagent` runtime, the span of each model call holds the full conversation history. A long conversation therefore repeats its earlier messages in every span. Account for that volume when you set a retention period.

The `kagent` runtime does not shorten these attributes. The `claude` and `codex` runtimes bound each captured prompt, reply, tool argument, and tool result to the `config.runtimeDefaults.telemetry.maxCaptureBytes` budget, which defaults to 16384 bytes. A shortened capture sets the `kagent.capture.input_truncated` or `kagent.capture.output_truncated` attribute. Your tracing backend might also limit the size of an attribute, so check its limits before you rely on it for long conversations.

### Delivery

Agent Substrate suspends an Actor as soon as a response completes. The controller therefore sets the `kagent` and `codex` runtimes to flush their spans before each response completes, so that the records of a turn reach your backend before the Actor suspends. On the `claude` runtime, kagent flushes the spans that it writes in the same way, but not the spans of Claude Code itself. Claude Code's records of a conversation's last turn can therefore be lost. For more information, see [Traces from a suspended Actor]({{< link path="observability/tracing#traces-from-a-suspended-actor" >}}).

> [!IMPORTANT]
> Traces are a best-effort record. An exporter drops spans without an error when the collector is unreachable or its queue is full, and nothing in the trace shows that a record is missing. Treat captured spans as a review aid, not as a complete or tamper-proof compliance log.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).
2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have an {{< gloss "Agent" >}}Agent{{< /gloss >}} to send requests to. That guide also installs the kagent CLI. The steps on this page need the {{< reuse "kagent-docs/versions/kagent.md" >}} CLI, because the CLIs of other releases, newer ones included, do not have the Session commands that these steps use. To check your version, run `kagent version`.
3. Install [`jq`](https://jqlang.org/download/), to read the Session ID and revision out of the CLI's JSON output.
4. Set up a tracing backend, and turn on tracing. {{< reuse "kagent-docs/snippets/observability/tracing-backend.md" >}}

## Turn on content capture

Turn on content capture in the kagent Helm release, then create a Session that picks up the new setting.

1. Save the current revision of your Agent. A later step uses it to tell when kagent rebuilds the Agent with the new setting. The command first waits for any rebuild that is still in progress, such as one from an earlier Helm upgrade, so that it saves a finished revision.
   ```bash
   for i in $(seq 1 60); do
     REVISIONS=$(kubectl get agent my-first-agent -n kagent \
       -o jsonpath='{.status.desiredRevision} {.status.latestSuccessfulRevision}')
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
     --set config.runtimeDefaults.telemetry.captureContent=true
   ```

   For an agent on the `claude` runtime, also set `config.runtimeDefaults.telemetry.logs.endpoint` to the address of your collector, and send the logs to a backend that stores them. {{< reuse "kagent-docs/snippets/observability/claude-logs-backend.md" >}} Without log export, the replies of a `claude` agent are not recorded.

3. Wait for the controller to roll out.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

4. Wait for kagent to rebuild the Agent. The controller rebuilds each Agent after the controller restarts. A Session that you create before the rebuild finishes starts from the previous revision, without the new setting. The following command prints `Recompiled` when the new revision is ready.
   ```bash
   for i in $(seq 1 60); do
     [ "$(kubectl get agent my-first-agent -n kagent \
       -o jsonpath='{.status.latestSuccessfulRevision}')" != "$OLD_REVISION" ] \
       && echo "Recompiled" && break
     sleep 5
   done
   ```
   If the command finishes without printing `Recompiled`, the upgrade did not change the settings that kagent compiles into the Agent. Either the setting was already in place, or the chart did not recognize the key. Helm accepts a key that a chart does not define without an error, so check that you upgraded to version {{< reuse "kagent-docs/versions/kagent.md" >}} of the chart, which uses the key on this page.

5. Create a new Session. A Session keeps the runtime configuration that it was created with, so only a new Session captures content.
   ```bash
   kagent agent session create --agent my-first-agent
   ```

6. Confirm that the Session runs the Agent's current revision. If the command prints `Outdated`, the Session was created from an earlier revision, and does not capture content. Create another Session, and run the command again.
   ```bash
   for i in $(seq 1 60); do
     REVISIONS=$(kubectl get agent my-first-agent -n kagent \
       -o jsonpath='{.status.desiredRevision} {.status.latestSuccessfulRevision}')
     [ "${REVISIONS% *}" = "${REVISIONS#* }" ] && break
     sleep 5
   done
   SESSION_REVISION=$(kagent agent session get $SESSION_ID -o json | jq -r '.session.preparedRevision')
   [ "$SESSION_REVISION" = "${REVISIONS#* }" ] && echo "Current" || echo "Outdated"
   ```

## Verify the setup

Send a request that contains a distinctive phrase, then find that phrase in the captured request.

{{< reuse "kagent-docs/snippets/observability/audit-verify-steps.md" >}}

> [!CAUTION]
> Anyone who can read your tracing or logging backend can now read the prompts and replies of every agent. Restrict access to the backend, and set a retention period that meets your compliance requirements.

## Turn off content capture

Turn off content capture, then create a new Session so that the change takes effect.

1. Turn off content capture in the kagent Helm release. Tracing stays on.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --reuse-values \
     --set config.runtimeDefaults.telemetry.captureContent=false
   ```

2. Create a new Session, because an existing Actor keeps the configuration that it started with. The spans of a Session that still captures content keep carrying it until you delete the Session.

3. Delete the captured content from your backend when your retention policy requires it. Turning off capture does not remove the spans that your backend already stores.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Read the spans and attributes of an agent request." >}}
  {{< card link=`{{< link path="agents/agent-harness#telemetry-content-settings" >}}` title="Telemetry content settings" subtitle="Review how each content setting applies to each harness." >}}
{{< /cards >}}
