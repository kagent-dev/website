---
title: A2A metadata and extension reference
description: Reference the canonical A2A metadata keys and versioned extensions that kagent supports.
weight: 15
author: kagent.dev
---

## Metadata

Agent2Agent (A2A) metadata is a set of key-value pairs on A2A elements that lets the A2A protocol transmit extra information.

kagent runtime adapters translate the metadata that a harness produces into canonical kagent metadata keys, and discard metadata that they cannot translate. These metadata semantics and formats are stable unless otherwise noted. However, kagent depends on each harness to produce them, and a harness that the kagent project does not own might emit different metadata across versions. The kagent project owns the [kagent harness]({{< link path="agents/agent-harness#kagent-harness" >}}), so the metadata from that harness is stable across versions.

### `kagent.dev/a2a/timeline-position`

**A2A element:** Message or artifact.

An RFC 3339 timestamp that orders task history.

### `kagent.dev/a2a/task-created-at`

**A2A element:** Task.

An RFC 3339 timestamp that records when the task was created.

### `kagent.dev/a2a/part-type`

**A2A element:** Data part.

The semantic kind of a data part. The value depends on the runtime adapter that produced the part. Of the following values, the kagent harness recognizes `function_call` and `function_response`.

| Value | Meaning |
| --- | --- |
| `function_call` | The name and arguments of a function call. |
| `function_response` | The return value of a function call. |
| `executable_code` | A piece of code to execute. |
| `code_execution_result` | The result of a code execution. |

### `kagent.dev/a2a/usage`

**A2A element:** Task event.

Best-effort model usage for one response, present only if the runtime reports it. The format of this value is harness-specific and might change in later versions. For normalized usage totals over the lifetime of a task, use the [token-usage extension](#token-usage).

The kagent harness reports the following camelCase metadata for a single model response:

```json
{
  "kagent.dev/a2a/usage": {
    "promptTokenCount": 1300,
    "candidatesTokenCount": 210,
    "thoughtsTokenCount": 40,
    "cachedContentTokenCount": 800,
    "totalTokenCount": 1550
  }
}
```

### `kagent.dev/a2a/output-schema-sha256`

**A2A element:** Result part.

The SHA-256 digest of the compiled output schema of a structured result. Consumers can use the digest to identify the schema of the result.

### `kagent.dev/a2a/thought`

**A2A element:** Text part.

A boolean that indicates that the text contains model reasoning rather than the model's answer.

## A2A extensions

[A2A extensions](https://a2a-protocol.org/latest/topics/extensions/) add semantics that the core A2A protocol does not define. Agents advertise extensions in their Agent Cards. Harness support varies by extension.

### Human in the loop

The human-in-the-loop extension lets an agent pause a task for a person's decision and then resume the same operation. For details, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Token usage

The token-usage extension reports token usage over the lifetime of a task. Its URI is:

```text
https://kagent.dev/extensions/usage/v1
```

When the kagent harness supports usage reporting, it advertises this optional extension. The payload appears under the extension URI in the metadata of the status update that ends an execution. An execution ends in the `completed`, `input-required`, `failed`, or `canceled` state. When a client reads the persisted task later, the task's metadata contains the same payload. When no model call reported usage, the metadata does not contain the key.

```json
{
  "id": "my-task",
  "contextId": "my-context",
  "status": {
    "state": "completed",
    "timestamp": "2026-10-30T19:10:00Z"
  },
  "metadata": {
    "https://kagent.dev/extensions/usage/v1": {
      "inputTokens": 1300,
      "outputTokens": 210,
      "reasoningTokens": 40,
      "cachedInputTokens": 800,
      "totalTokens": 1550,
      "models": [
        {
          "model": "gpt-4o-2024-11-20",
          "inputTokens": 1000,
          "outputTokens": 150,
          "reasoningTokens": 40,
          "cachedInputTokens": 800,
          "totalTokens": 1190
        }
      ]
    }
  }
}
```

The top-level counts are totals for the whole task. The `models` array reports the same fields for each model that the task called.

| Field | Meaning |
| --- | --- |
| `inputTokens` | Prompt tokens sent to the model. |
| `outputTokens` | Generated tokens, excluding reasoning tokens. |
| `reasoningTokens` | Reasoning tokens, if the provider reports them. |
| `cachedInputTokens` | Provider-cached input tokens, a subset of `inputTokens`. |
| `totalTokens` | The provider-reported total. If the provider reports no total, the sum of input, output, and reasoning tokens. |
| `models` | The same counts per model, ordered by model name. |
| `models[].model` | The model identifier. |
