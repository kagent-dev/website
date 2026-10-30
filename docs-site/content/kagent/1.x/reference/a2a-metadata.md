---
title: A2A Metadata and Extension Reference
description: Reference the canonical A2A metadata keys and versioned extensions that Kagent supports.
weight: 15
author: kagent.dev
---

## Metadata

A2A metadata is a set of key-value pairs on A2A elements that allows the A2A
protocol to carry extra information.

Kagent runtime adapters translate metadata that a harness produces into
canonical Kagent metadata keys and discard metadata that they cannot translate.
**Kagent metadata keys may change as new semantics are introduced into the core
A2A protocol.**

### `kagent.dev/a2a/timeline-position`

**A2A element:** Message or artifact.

An RFC 3339 timestamp that orders task history.

### `kagent.dev/a2a/task-created-at`

**A2A element:** Task.

An RFC 3339 timestamp that records when the task was created.

### `kagent.dev/a2a/part-type`

**A2A element:** Data part.

Identifies the semantic kind of a data part. The value depends on the runtime
adapter. The supported values are:

* `function_call` - The name and arguments of a function call.
* `function_response` - The return value of a function call.
* `executable_code` - A piece of code to execute.
* `code_execution_result` - The result of a code execution.

The Go ADK adapter recognizes `function_call` and `function_response`. The
Python ADK adapter recognizes `executable_code` and `code_execution_result`.

### `kagent.dev/a2a/usage`

**A2A element:** Task event.

Model usage for one response when the runtime reports it. This key is distinct
from the [token-usage extension](#token-usage), which provides normalized
task-lifetime usage totals.

The Python ADK adapter currently reports the following metadata for a single
model response:

```json
{
  "kagent.dev/a2a/usage": {
    "prompt_token_count": 1300,
    "candidates_token_count": 210,
    "thoughts_token_count": 40,
    "cached_content_token_count": 800,
    "total_token_count": 1550
  }
}
```

### `kagent.dev/a2a/output-schema-sha256`

**A2A element:** Result part.

Binds a structured result to the SHA-256 digest of its compiled output schema.
Consumers can use the digest to identify the schema of the result.

### `kagent.dev/a2a/thought`

**A2A element:** Text part.

A boolean that indicates the text contains model reasoning rather than the
model's answer.

## A2A extensions

[A2A extensions](https://a2a-protocol.org/latest/topics/extensions/) add
semantics that the core A2A protocol does not define. Agents advertise
extensions in their Agent Cards. Harness support varies by extension.

### Human in the loop

The human-in-the-loop (HITL) extension lets an agent pause a task for a
person's decision and resume the same operation. See
[Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Token usage

The token-usage extension reports task-lifetime token usage. Its URI is

```text
https://kagent.dev/extensions/usage/v1
```

The Go and Python ADK runtimes advertise the extension as optional when they
support usage reporting. The payload is stored under the extension URI in the
metadata of the status update that ends an execution: `completed`,
`input-required`, `failed`, or `canceled`. When a client reads the persisted
task later, it finds the same payload in the task's metadata. The key is
omitted when no model call reported usage.

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

| Field | Meaning |
| --- | --- |
| `inputTokens` | Prompt tokens sent to the model. |
| `outputTokens` | Generated tokens, excluding reasoning tokens. |
| `reasoningTokens` | Reasoning tokens, when the provider reports them. |
| `cachedInputTokens` | Provider-cached input tokens; a subset of `inputTokens`. |
| `totalTokens` | The provider-reported total, or the sum of input, output, and reasoning tokens when the provider reports no total. |
| `models` | The same counts per model, ordered by model name. |
