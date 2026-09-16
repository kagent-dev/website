---
title: System prompts
description: Set an agent's system prompt inline or from a ConfigMap, and template it with values that kagent resolves at compile time.
weight: 30
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}'s system prompt defines the agent's role and how it should behave. kagent resolves the prompt when it compiles a {{< gloss "Revision" >}}revision{{< /gloss >}}, so the text that an agent runs with is fixed for the life of an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}}. Editing the prompt affects instances created after the edit compiles, but not ones that are already running.

## Write an effective prompt

A prompt that works tends to carry four things, in roughly this order.

- **Role.** What the agent is, in a sentence, such as `You are a Kubernetes assistant.`
- **Scope.** What the agent should and should not take on, which matters more as you give it more tools.
- **Instructions.** How the agent should behave in the cases that you care about: when to ask for clarification, what to do when a tool fails, and when to refuse.
- **Response format.** What a good answer looks like. For example, ask for Markdown, or for a summary before detail.

Two things are worth stating explicitly, because models otherwise guess: what the agent should do when it does not know an answer, and whether it should act or ask first when an action is consequential. For approval gates that the runtime enforces rather than the prompt, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

## Set the prompt inline

Set `spec.systemPrompt` to keep the prompt in the AgentTemplate itself, so that the prompt and the rest of the agent's configuration change together. Inline suits a prompt that only one AgentTemplate uses.

```yaml
spec:
  systemPrompt: |-
    You are a Kubernetes assistant. You help users understand what is running in their cluster.

    # Instructions
    - Ask for clarification before running a tool when a request is ambiguous.
    - Answer from tool output rather than from memory of how clusters usually look.
    - Say so plainly when a question cannot be answered with the tools you have.
```

Write the value as a YAML block scalar, such as the `|-` in the example, so that the blank lines, headings, and lists that structure the prompt reach the model as written. A folded scalar collapses them into a single paragraph.

## Store the prompt in a ConfigMap

Use `systemPromptFrom` to keep the prompt outside the AgentTemplate. Several AgentTemplates can then share one prompt, and a prompt can change without editing the agent.

1. Create a ConfigMap holding the prompt.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: shared-prompts
     namespace: kagent
   data:
     kubernetes-assistant: |-
       You are a Kubernetes assistant. You help users understand what is running in their cluster.
   EOF
   ```

2. Reference the key from the AgentTemplate.
   ```yaml
   spec:
     systemPromptFrom:
       name: shared-prompts
       key: kubernetes-assistant
   ```

   `systemPrompt` and `systemPromptFrom` are mutually exclusive, and an AgentTemplate that sets both is rejected. If you omit both fields, the revision compiles with no system prompt at all, and the agent runs on its harness's default behavior.

   | Field | Description |
   | ----- | ----------- |
   | `systemPromptFrom.name` | The ConfigMap holding the prompt, in the AgentTemplate's namespace. |
   | `systemPromptFrom.key` | The key within that ConfigMap. |

> [!NOTE]
> A prompt can come only from a ConfigMap. Earlier versions of kagent also accepted a Secret, through a `systemMessageFrom.type` field that v1alpha3 does not have. A system prompt is not a credential, so keep secrets out of it and pass them to the runtime as [Harness environment variables]({{< link path="agents/agent-harness" >}}) instead.

## Template the prompt

Set `spec.promptTemplate` to run the prompt through [Go templates](https://pkg.go.dev/text/template) before it reaches the model. Templating applies to both inline prompts or prompts set in a ConfigMap.

```yaml
spec:
  description: Answers questions about a Kubernetes cluster.
  systemPrompt: |-
    You are {{ .AgentTemplateName }}. {{ .Description }}

    You have these tools available: {{ .ToolNames }}

    {{ include "shared-prompts/response-format" }}
  promptTemplate:
    dataSources:
      - name: shared-prompts
```

The following values are available to a template.

| Value | Description |
| ----- | ----------- |
| `.AgentTemplateName` | The AgentTemplate's `metadata.name`. |
| `.AgentTemplateNamespace` | The AgentTemplate's `metadata.namespace`. |
| `.Description` | The AgentTemplate's `spec.description`. |
| `.ToolNames` | The tool names selected from every {{< gloss "MCP" >}}MCP{{< /gloss >}} server the AgentTemplate binds. Agents bound as tools are not included. Prefer this value over listing tools by hand, because it cannot drift from the bindings that the AgentTemplate declares. |

Additionally, the `include` function pulls in one key from a ConfigMap that `dataSources` lists. The argument is formatted `"<source>/<key>"`, where the source is the ConfigMap's name. Every key in every listed ConfigMap becomes available, so two sources that share a key name collide. kagent rejects that at compile time rather than picking one.

| Field | Description |
| ----- | ----------- |
| `dataSources[].name` | A ConfigMap in the AgentTemplate's namespace, up to 20 entries. |
| `dataSources[].alias` | An alternative identifier to use in `include` paths. The ConfigMap is still looked up by `name`. |

An alias only changes what you type. In this example configuration, `include "house-style/tone"` fails and `include "style/tone"` succeeds.

```yaml
spec:
  systemPrompt: |-
    {{ include "shared-prompts/response-format" }}

    {{ include "style/tone" }}
  promptTemplate:
    dataSources:
      - name: shared-prompts
      - name: house-style
        alias: style
```

> [!NOTE]
> A prompt template can reach only the supported values and the ConfigMaps that `dataSources` names. Templates cannot read arbitrary Kubernetes objects.

## Troubleshooting

Prompt problems surface on the `ResolvedRefs` condition, because they are reference failures rather than runtime errors. No revision compiles, so no new AgentInstance can start.

An AgentTemplate reports one set of conditions for each Harness that admits it, under `status.harnesses`. To check the condition for your Harness, run the following command.

```bash
kubectl get agenttemplate my-first-agent -n kagent -o json \
  | jq '.status.harnesses[] | {harness, conditions: [.conditions[] | select(.type == "ResolvedRefs")]}'
```

In the output, a failure sets the reason to `ReferenceResolutionFailed` and the resolve error is listed in the message. Example output:

```json
{
  "harness": "my-first-harness",
  "conditions": [
    {
      "type": "ResolvedRefs",
      "status": "False",
      "observedGeneration": 2,
      "lastTransitionTime": "2026-08-31T15:02:10Z",
      "reason": "ReferenceResolutionFailed",
      "message": "resolve systemPromptFrom: ConfigMap \"shared-prompts\" does not contain key \"kubernetes-assistant\""
    }
  ]
}
```

| Message | Cause |
| ------- | ----- |
| `resolve systemPromptFrom: ConfigMap "x" not found` | The ConfigMap does not exist in the AgentTemplate's namespace. |
| `resolve systemPromptFrom: ConfigMap "x" does not contain key "y"` | The ConfigMap exists but has no such key. |
| `resolve prompt source "x": ConfigMap not found` | A `dataSources` entry names a ConfigMap that does not exist. |
| `duplicate prompt template identifier "x/y"` | Two data sources expose the same `source/key` path. Give one of them an `alias`. |
| `prompt template "x/y" not found, available: [...]` | An `include` path does not match any available key. The error lists every path that is available. |
| `parse system message template: ...` | The template is not valid Go template syntax. |

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Bind the tools that a prompt can refer to." >}}
  {{< card link=`{{< link path="agents/agent-memory" >}}` title="Agent memory" subtitle="Let an agent carry what it learned into later conversations." >}}
{{< /cards >}}
