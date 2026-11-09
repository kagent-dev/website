---
title: Skills
description: Package instructions and supporting files as skills, and attach them to an AgentTemplate.
weight: 20
author: kagent.dev
---

A **{{< gloss "Skill" >}}skill{{< /gloss >}}** packages a piece of know-how that an agent can pick up: a set of instructions, together with whatever scripts, command-line tools, or reference files those instructions depend on. You attach a skill to an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} by specifying where it comes from, and kagent fetches it and places it where the agent can find it.

## About

A skill is a directory whose root holds a `SKILL.md` file. That file carries front matter naming the skill and describing what it is for, followed by the instructions themselves.

The description makes a skill usable. When an agent starts, it reads the front matter of every skill that is attached to it. The agent then offers those skills to the model as tools that the model can call. The model chooses a skill from its description in the same way that it chooses any other tool. A description that states plainly when to use the skill therefore matters more than the length of the instructions behind it.

A skill can be published on its own, or bundled with other skills in a {{< gloss "Plugin" >}}plugin{{< /gloss >}}. For what a plugin contains and how to attach one, see [Plugins]({{< link path="skills-and-mcp/plugins" >}}).

## Attach skills to an AgentTemplate

Use `spec.skills` to attach a standalone skill. Each entry gives the skill a name and an immutable source to fetch it from.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: incident-responder
  namespace: kagent
spec:
  modelConfig:
    name: default-model-config
  systemPrompt: You help engineers work through production incidents.
  skills:
    - name: incident-triage
      source:
        oci: registry.example.com/skills/incident-triage@sha256:<digest>
```

| Field | Description |
| ----- | ----------- |
| `skills[].name` | The name that the skill is mounted under, and the name that the model sees. |
| `skills[].source` | The location to fetch this one skill from. The source root must contain a `SKILL.md` file. |
| `source.path` | The directory to select inside the artifact, when the content is not at its root. The path must be relative, and it cannot climb out of the artifact with `..` segments. |

One AgentTemplate accepts up to 50 standalone skills. To give an agent the skills that a plugin contains, [use `spec.plugins` instead]({{< link path="skills-and-mcp/plugins#attach-a-plugin-to-an-agenttemplate" >}}). An AgentTemplate can use both fields at once.

{{< reuse "kagent-docs/snippets/artifact-sources.md" >}}

## Naming rules

kagent checks skill names before it fetches anything. These rules apply to every skill on an AgentTemplate, whether the skill is standalone or comes from a plugin.

- A name must be a single path component. A name containing a slash, or a name of `.` or `..`, is rejected.
- Names must be unique across the whole AgentTemplate. Because standalone skills and plugin skills are mounted into the same place, a standalone skill cannot reuse the name of an enabled plugin skill, and two plugins cannot both contribute the same name.
