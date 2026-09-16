---
title: Skills
description: Package instructions and supporting files as skills, and attach them to an AgentTemplate.
weight: 20
author: kagent.dev
---

A **{{< gloss "Skill" >}}skill{{< /gloss >}}** packages a piece of know-how that an agent can pick up: a set of instructions, together with whatever scripts or reference files those instructions depend on. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} attaches skills by naming where each one comes from, and kagent fetches them and places them where the agent runtime can find them.

## About

A skill is a directory whose root holds a `SKILL.md` file. That file carries front matter naming the skill and describing what it is for, followed by the instructions themselves.

The description makes a skill usable. When an agent starts, the runtime reads the front matter of every skill that is attached to it, and offers those skills to the model as tools that it can call. The model chooses a skill from its description, in the same way that it chooses any other tool. This means that a description that states plainly when to use the skill matters more than the length of the instructions behind it.

A skill can be published on its own, or bundled with other skills in a [plugin package]({{< link path="skills-and-mcp/plugins" >}}), which can also declare {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) servers that kagent adds to the agent's [tools]({{< link path="skills-and-mcp/about-tools" >}}).

## Attach skills to an AgentTemplate

An AgentTemplate attaches skills in two ways, and it can use both at once. Use `spec.skills` for a standalone skill, and `spec.plugins` for a {{< gloss "Plugin package" >}}plugin package{{< /gloss >}}.

```yaml
apiVersion: kagent.dev/v1alpha3
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
  plugins:
    - source:
        git:
          url: https://github.com/example/agent-plugins
          commit: <full-commit-id>
        path: bundles/observability
      skills:
        - log-search
        - runbook-lookup
```

| Field | Description |
| ----- | ----------- |
| `skills[].name` | The name that the skill is mounted under, and the name that the model sees. |
| `skills[].source` | The location to fetch this one skill from. The source root must hold a `SKILL.md` file. |
| `plugins[].source` | The location to fetch the plugin package from. The source root must hold a `plugin.json` manifest. |
| `plugins[].skills` | The names of the skills inside that package to enable. Omit or leave empty to enable none. |
| `source.path` | The directory to select inside the artifact, when the content is not at its root. The path must be relative, and it cannot climb out of the artifact with `..` segments. |

### Plugin allowlist

Attaching a plugin package does not enable any of the skills that it carries. Only the names listed in `plugins[].skills` are enabled.

> [!IMPORTANT]
> An empty skills list enables nothing. Adding a plugin package and omitting its `skills` list gives the agent no skills from that package, which is the safe default rather than an error. Listing skills explicitly also means that a package gaining new skills in a later version does not silently grant them to your agent.

{{< reuse "kagent-docs/snippets/artifact-sources.md" >}}

## Naming rules

Skill names are checked before anything is fetched, and two rules apply across every skill on an AgentTemplate.

- A name must be a single path component. A name containing a slash, or a name of `.` or `..`, is rejected.
- Names must be unique across the whole AgentTemplate. Because standalone skills and plugin skills are mounted into the same place, a standalone skill cannot reuse the name of an enabled plugin skill, and two plugin packages cannot both contribute the same name.

Plugin package names must also be unique. Two entries in `plugins` whose manifests declare the same name are rejected. Unlike skill names, kagent checks this as each package is fetched, because the name comes from the package's `plugin.json` manifest rather than from your AgentTemplate.
