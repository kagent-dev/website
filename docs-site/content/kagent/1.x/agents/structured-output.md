---
title: Structured output
description: Constrain an AgentTemplate's final answer to a JSON Schema, set inline or in a ConfigMap, and troubleshoot schemas and answers that fail validation.
weight: 35
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} can require that its final answer is JSON matching a schema. {{< reuse "kagent-docs/snippets/name-product.md" >}} checks the schema when it builds a {{< gloss "Revision" >}}revision{{< /gloss >}} for an {{< gloss "Agent" >}}Agent{{< /gloss >}}. The revision records the schema and its digest. kagent does not build a revision from a schema that fails the checks, so an Agent that has never been ready cannot start a {{< gloss "Session" >}}Session{{< /gloss >}}. At runtime, the agent validates its complete answer against the recorded schema before it publishes the answer.

The schema goes in one of two AgentTemplate fields, `spec.outputSchema` or `spec.outputSchemaFrom`. The fields are mutually exclusive. An AgentTemplate that sets both is rejected when you apply it, with the message `outputSchema and outputSchemaFrom are mutually exclusive`. If you omit both fields, the agent's final answer is not constrained.

| Field | Description |
| ----- | ----------- |
| `outputSchema` | The schema, written inline in the AgentTemplate. |
| `outputSchemaFrom.name` | The ConfigMap that stores the schema as JSON, in the AgentTemplate's namespace. |
| `outputSchemaFrom.key` | The key within that ConfigMap. |
| `outputSchemaStrict` | Whether the model provider constrains generation to the schema. Defaults to `false`. For the providers that honor it, see [Strict mode](#strict-mode). |

## Before you begin

1. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have the `my-first-harness` Harness and the `default-model-config` {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} that the AgentTemplates in this guide use. That guide also has you install the kagent CLI and `jq`.

   Structured output needs a Harness resource that selects the `kagent` harness with the `golang-adk` image, as `my-first-harness` does. For a Harness of your own, use the `kagent` block and the same `workload.image` as `my-first-harness`. On the `codex`, `claude`, or `byo` harness, an Agent whose template sets a schema is rejected with `Harness runtime "<name>" does not support structured output`. For the differences between harnesses, see [Choose a harness]({{< link path="agents/agent-harness#choose-a-harness" >}}).

2. Check your kagent CLI version. The steps on this page need the {{< reuse "kagent-docs/versions/kagent.md" >}} CLI. A CLI from another release can fail with `unknown command`.
   ```bash
   kagent version
   ```

   If `kagent_version` in the output is not {{< reuse "kagent-docs/versions/kagent.md" >}}, install that version.
   ```bash
   curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash -s -- --version v{{< reuse "kagent-docs/versions/kagent.md" >}}
   ```

## Set the schema inline

Set `spec.outputSchema` to keep the schema in the AgentTemplate, so that the schema and the rest of the agent's configuration change together.

1. Apply an AgentTemplate with a schema, and an Agent that pairs it with the `my-first-harness` Harness.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: structured-answer
     namespace: kagent
   spec:
     description: Answers arithmetic questions with a structured result.
     modelConfig:
       name: default-model-config
     systemPrompt: Answer arithmetic questions. Reply with JSON that has an integer answer and a one-sentence explanation.
     outputSchema:
       type: object
       properties:
         answer:
           type: integer
         explanation:
           type: string
       required:
         - answer
         - explanation
       additionalProperties: false
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: structured-answer
     namespace: kagent
   spec:
     template:
       ref:
         name: structured-answer
     harnessRef:
       name: my-first-harness
   EOF
   ```

   The schema requires an object with an integer `answer` and a string `explanation`, and does not allow other properties. The system prompt describes the same JSON, because some model providers do not receive the schema.

2. Confirm that the Agent is ready.
   ```bash
   kagent agent get structured-answer
   ```

   Example output:
   ```console
   +-------------------+-------+----------------------+
   | NAME              | READY | CREATED              |
   +-------------------+-------+----------------------+
   | structured-answer | True  | 2026-09-29T07:49:30Z |
   +-------------------+-------+----------------------+
   ```

   A `READY` value of `False` right after you apply the Agent is expected, because kagent builds a snapshot of the agent's runtime before it reports the Agent ready. If `READY` stays `False`, see [Troubleshooting](#troubleshooting).

3. Create a Session against the Agent, and save its ID.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent structured-answer -o json | jq -r '.session.id')
   ```

4. Send a question.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "What is 3 plus 5?"
   ```

   Example output:
   ```console
   {"answer":8,"explanation":"Three plus five equals eight."}
   ```

   The CLI prints the validated answer as JSON text. An `answer` of `9` would also pass, because the schema checks only the shape and types of the answer.

## Store the schema in a ConfigMap

Use `outputSchemaFrom` to keep the schema outside the AgentTemplate, so that several AgentTemplates can share one schema. The value in the ConfigMap must be JSON, even though the ConfigMap itself is written in YAML.

1. Create a ConfigMap that stores the schema.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: shared-schemas
     namespace: kagent
   data:
     arithmetic-answer: |-
       {
         "type": "object",
         "properties": {
           "answer": {"type": "integer"},
           "explanation": {"type": "string"}
         },
         "required": ["answer", "explanation"],
         "additionalProperties": false
       }
   EOF
   ```

2. Apply an AgentTemplate that references the key.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: structured-answer-shared
     namespace: kagent
   spec:
     description: Answers arithmetic questions with a structured result.
     modelConfig:
       name: default-model-config
     systemPrompt: Answer arithmetic questions. Reply with JSON that has an integer answer and a one-sentence explanation.
     outputSchemaFrom:
       name: shared-schemas
       key: arithmetic-answer
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: structured-answer-shared
     namespace: kagent
   spec:
     template:
       ref:
         name: structured-answer-shared
     harnessRef:
       name: my-first-harness
   EOF
   ```

3. Confirm that the Agent is ready. Wait until `READY` is `True`.
   ```bash
   kagent agent get structured-answer-shared
   ```

## Supported schemas

The root of the schema must declare `type: object`. kagent accepts the following subset of JSON Schema, which its error messages call the portable output profile.

- `type`, with one value or a list of values such as `["string", "null"]`. Each value is `object`, `array`, `string`, `number`, `integer`, `boolean`, or `null`.
- `properties`, `required`, `additionalProperties`, and `items`
- `enum`, `const`, and `anyOf`
- `title` and `description`
- `$defs`, and references to it in the form `#/$defs/<name>`, which cannot be recursive
- `$schema` and `$id`
- `pattern`, in RE2 syntax, on a schema whose `type` includes `string`
- `format`, on a schema whose `type` includes `string`, with one of the values `date`, `date-time`, `duration`, `email`, `hostname`, `ipv4`, `ipv6`, `time`, or `uuid`

Anything else is rejected, including `oneOf` and `allOf`, conditional schemas such as `if` and `then`, tuple arrays, references outside `$defs`, and validation keywords such as `minimum` and `minLength`. Claude structured outputs do not support word boundaries, so kagent also rejects a `pattern` that uses `\b` or `\B`.

JSON Schema treats `format` as an annotation. kagent forwards `format` to the model provider, but the runtime does not check it on the answer.

A Gemini model answers by calling the `set_model_response` tool of the Go Agent Development Kit (ADK), and that tool checks each property against one type. For a model whose name starts with `gemini-`, kagent therefore rejects a property that uses `anyOf`, `type: null`, or a type list with more than one non-null type. kagent also rejects an array property that does not set `items`. To allow `null` in such a property, use a type list such as `["string", "null"]`. The check skips models on the `GeminiVertexAI` provider.

kagent also enforces the following limits when it builds the revision. A schema that exceeds a limit is rejected, before any agent runs with it.

| Limit | Maximum |
| ----- | ------- |
| Size of the schema as kagent reads it | 64 KiB |
| Nesting depth | 32 levels |
| Schema nodes | 1,000 |

kagent counts depth and nodes through `properties`, `items`, and `anyOf`, and counts a `$defs` entry again each time that it is referenced. The size limit applies before kagent normalizes the schema, so whitespace in a ConfigMap value counts toward it.

## Strict mode

OpenAI models follow `format` and `pattern` during generation only in strict mode. To constrain generation to the schema, set `outputSchemaStrict` to `true` in the AgentTemplate.

```yaml
spec:
  outputSchemaStrict: true
  outputSchema:
    type: object
    properties:
      ticket:
        type: string
        pattern: "^OPS-[0-9]+$"
      due:
        type: [string, "null"]
        format: date
    required:
      - ticket
      - due
    additionalProperties: false
```

The example schema meets every strict mode rule in this section.

| Field | Description |
| ----- | ----------- |
| `outputSchemaStrict` | Sends the schema in strict mode to the OpenAI, Azure OpenAI, and Azure AI Foundry providers. Azure AI Foundry receives it only with the `OpenAI` API format. Other providers ignore the field. |
| `outputSchema.properties.ticket.pattern` | Requires a ticket ID such as `OPS-123`. |
| `outputSchema.properties.due.type` | Allows `null`, which makes `due` optional. |
| `outputSchema.properties.due.format` | Asks for a date such as `2026-11-03`. |

An AgentTemplate that sets `outputSchemaStrict` to `true` without a schema is rejected when you apply it, with the message `outputSchemaStrict requires outputSchema or outputSchemaFrom`. The runtime validates every answer against the schema in both modes.

Strict mode accepts fewer schemas. kagent checks the following rules for every provider, so a schema stays valid when you change the provider of the ModelConfig.

- The root does not use `anyOf`.
- Every node sets `type`, `anyOf`, `enum`, or `$ref`.
- A node that sets `$ref` does not set any other keyword. To add `null`, wrap the reference in `anyOf`, such as `anyOf: [{$ref: "#/$defs/item"}, {type: "null"}]`.
- Every object sets `additionalProperties` to `false` and lists all of its properties in `required`. A map with free-form keys cannot meet this rule.

To make a property optional in strict mode, list it in `required` and add `null` to its type list.

## Read the answer

A successful answer is published as one {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) `DataPart` with the media type `application/json`. The part's metadata includes the SHA-256 digest of the schema that the answer was validated against, under the key `kagent.dev/a2a/output-schema-sha256`. kagent computes the digest after it normalizes the schema, so two schemas that differ only in formatting or key order have the same digest. The Agent's card lists `application/json` as its default output mode, instead of `text`.

To see the part and its metadata, print the task as JSON.

```bash
kagent agent invoke --session $SESSION_ID --task "What is 3 plus 5?" -o json \
  | jq '.task.artifacts[-1].parts'
```

Example output:
```json
[
  {
    "data": {
      "answer": 8,
      "explanation": "Three plus five equals eight."
    },
    "metadata": {
      "kagent.dev/a2a/output-schema-sha256": "59a6341782be5eacb0762a62133c7b45ec785770392216e712f109f11afb6a1b"
    },
    "mediaType": "application/json"
  }
]
```

The runtime holds back the agent's partial output while the agent writes its answer, and publishes only the complete answer. Progress updates, tool calls, approval requests, and input-required messages keep their usual form, and the agent can call tools before it answers. A streaming client that needs only the answer reads the last artifact with content before the task reaches `TASK_STATE_COMPLETED`. That artifact's part includes the `kagent.dev/a2a/output-schema-sha256` metadata key.

## Agents as tools

The schema applies only to the root agent, which is the agent of the AgentTemplate that the Agent names. An AgentTemplate [bound to it as a subagent]({{< link path="skills-and-mcp/about-tools#subagents-as-tools" >}}) does not inherit the schema. If the bound AgentTemplate has a schema of its own, that schema applies only to Agents that name it directly.

If the subagent uses a `Shared` binding, the root agent can hand the conversation to the bound agent, which then answers in its place, in that turn and in the turns that follow. Those tasks fail with `output_validation_failed: root agent produced no result artifact`, because the answers do not come from the root agent. The bound agent's answers still reach the caller as text. Give a schema only to an AgentTemplate whose own agent writes the final answer.

## Answers that fail validation

Structured output does not have a fallback to text. If the model refuses, stops early, or returns an answer that is not JSON or does not match the schema, the task fails. kagent does not publish the invalid answer or include it in the failure message, because it can contain sensitive data. When the agent uses a Gemini model on the `Gemini` provider, however, the agent is told to give its answer as the arguments of a `set_model_response` tool call. kagent publishes that call like any other tool call, before it validates the answer, so an answer given that way reaches the caller even when it fails validation.

For example, an answer that does not match the schema fails the `kagent agent invoke` command with output like the following. The `output_validation_failed:` message states the cause.

```console
processor failed: output_validation_failed: root agent output does not conform to its schema
Error: Session task 01a0ec27-157f-7034-bb89-09855f485b2a ended in TASK_STATE_FAILED
```

Each message follows the `processor failed:` prefix.

| Message | Cause |
| ------- | ----- |
| `output_validation_failed: root agent output does not conform to its schema` | The answer is JSON, but it does not match the schema. |
| `output_validation_failed: root agent output is not valid JSON` | The answer is not JSON. |
| `output_validation_failed: root agent did not complete structured output` | The model stopped for a reason other than finishing normally, such as reaching its token limit. |
| `output_validation_failed: root agent produced no structured value` | The model did not return any answer text. |
| `output_validation_failed: root agent produced no result artifact` | The task ended without a structured answer from the root agent, for example because the root agent handed the conversation to an [agent bound as a tool](#agents-as-tools). |

## Troubleshooting

A schema problem appears on the Agent's status conditions. `ResolvedRefs` reports a ConfigMap or key that kagent cannot find. `Compatible` reports a schema that kagent found but cannot accept, or a Harness whose runtime is not `kagent`.

```bash
kubectl get agent structured-answer-shared -n kagent -o json \
  | jq '[.status.conditions[] | select(.type == "ResolvedRefs" or .type == "Compatible")]'
```

For example, if the `shared-schemas` ConfigMap no longer has the `arithmetic-answer` key, the output is similar to the following. When `ResolvedRefs` fails, `Compatible` reports `Blocked` instead of a result of its own.

```json
[
  {
    "lastTransitionTime": "2026-09-29T07:52:08Z",
    "message": "resolve output schema ConfigMap \"shared-schemas\": key \"arithmetic-answer\" not found",
    "observedGeneration": 1,
    "reason": "ReferenceResolutionFailed",
    "status": "False",
    "type": "ResolvedRefs"
  },
  {
    "lastTransitionTime": "2026-09-29T07:52:08Z",
    "message": "blocked by ResolvedRefs",
    "observedGeneration": 1,
    "reason": "Blocked",
    "status": "False",
    "type": "Compatible"
  }
]
```

The `message` field of the failing condition identifies the cause.

| Message | Condition and reason | Cause |
| ------- | -------------------- | ----- |
| `resolve output schema ConfigMap "x": not found` | `ResolvedRefs`, `ReferenceResolutionFailed` | The ConfigMap does not exist in the AgentTemplate's namespace. |
| `resolve output schema ConfigMap "x": key "y" not found` | `ResolvedRefs`, `ReferenceResolutionFailed` | The ConfigMap does not have that key under `data`. |
| `invalid output schema: schema is empty` | `Compatible`, `UnsupportedConfiguration` | The key's value is empty. |
| `invalid output schema: schema exceeds 65536 bytes` | `Compatible`, `UnsupportedConfiguration` | The schema is larger than 64 KiB. |
| `invalid output schema: decode JSON: ...` | `Compatible`, `UnsupportedConfiguration` | The value is not valid JSON. |
| `invalid output schema: decode trailing JSON: ...` | `Compatible`, `UnsupportedConfiguration` | Text that is not JSON follows the JSON value. |
| `invalid output schema: schema must contain one JSON value` | `Compatible`, `UnsupportedConfiguration` | The value contains more than one JSON value, such as two objects in a row. |
| `invalid output schema: schema does not match the portable output profile: ...` | `Compatible`, `UnsupportedConfiguration` | The schema uses a keyword or form outside the [portable output profile](#supported-schemas), or its root is not an object. |
| `invalid output schema: resolve schema: ...` | `Compatible`, `UnsupportedConfiguration` | kagent cannot resolve the schema, for example because a `$ref` names a `$defs` entry that does not exist. |
| `invalid output schema: pattern ...` | `Compatible`, `UnsupportedConfiguration` | A `pattern` is not valid RE2, uses a word boundary, or the schema's patterns compile to more than 100,000 regexp instructions. |
| `output schema for Gemini: ...` | `Compatible`, `UnsupportedConfiguration` | A property breaks the [Gemini rule](#supported-schemas) for a single type, or an array property does not set `items`. |
| `outputSchemaStrict: ...` | `Compatible`, `UnsupportedConfiguration` | The schema breaks a [strict mode](#strict-mode) rule. |
| `output schema is incompatible with Go ADK: ...` | `Compatible`, `UnsupportedConfiguration` | The schema has a recursive reference, or exceeds the depth or node limit. |
| `Harness runtime "x" does not support structured output` | `Compatible`, `UnsupportedConfiguration` | The Harness does not use the `kagent` harness. |

If the Agent has never been ready, `kagent agent session create` fails with `Agent does not have a ready prepared revision`.

> [!WARNING]
> A Session keeps the revision that it was created from, and validates its answers against that revision's schema. After you change a schema, create a new Session to use it. A changed schema that fails the checks does not stop new Sessions from starting. They start from the Agent's latest ready revision, which `status.latestSuccessfulRevision` reports, so they use the previous schema.

A change to a ConfigMap does not change the AgentTemplate's `metadata.generation`, so check each condition's `lastTransitionTime` to tell whether kagent has seen your fix.

## Clean up

1. Delete the Sessions that you created in this guide.
   ```bash
   kagent agent session list -o json \
     | jq -r '.sessions[] | select(.agent.name == "structured-answer" or .agent.name == "structured-answer-shared") | .id' \
     | xargs -n1 kagent agent session delete
   ```

2. Delete the Agents, the AgentTemplates, and the ConfigMap.
   ```bash
   kubectl delete agent structured-answer structured-answer-shared -n kagent
   kubectl delete agenttemplate structured-answer structured-answer-shared -n kagent
   kubectl delete configmap shared-schemas -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/system-prompts" >}}` title="System prompts" subtitle="Tell the agent what to put in the fields that the schema requires." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Compare the four harnesses and what each one supports." >}}
{{< /cards >}}
