---
title: Plugins
description: Understand what a plugin contains, and what kagent does with one when an agent starts.
weight: 30
author: kagent.dev
---

A **{{< gloss "Plugin" >}}plugin{{< /gloss >}}** is a bundle that an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} attaches with `spec.plugins`. A plugin contains {{< gloss "Skill" >}}skills{{< /gloss >}} and can also declare {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) servers. Plugins follow the [Agent Plugins](https://agent-plugins.org) 1.0.0 specification. To attach a skill that is published on its own, see [Skills]({{< link path="skills-and-mcp/skills#attach-skills-to-an-agenttemplate" >}}).

## Plugin contents

A plugin root contains a manifest, and optionally the skills and the MCP servers that the plugin contributes.

- `plugin.json` (required): The manifest that gives the plugin its name.
- `skills/`: One subdirectory per skill, each with a `SKILL.md` file at its root.
- `mcp.json`: Declares MCP servers that kagent adds to the agent's [tools]({{< link path="skills-and-mcp/about-tools" >}}).

kagent reads `name` from the manifest and ignores the rest. A manifest that sets `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, or `extensions` is accepted, but none of those fields change what the agent gets.

The name must be at most 64 characters. It must start and end with a lowercase letter or a digit, and the characters between can be lowercase letters, digits, dots, and hyphens. A name that contains `--` or `..` is rejected.

The manifest's `$schema` must be exactly `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`. kagent compares that value literally. kagent does not fetch the schema, and it does not check the manifest against the schema.

## Attach a plugin to an AgentTemplate

Use `spec.plugins` to attach a plugin and list the skills that the agent needs from it.

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
| `plugins[].source` | The location to fetch the plugin from. The source root must contain a `plugin.json` manifest. |
| `plugins[].skills` | The names of the skills inside that plugin to enable, up to 50. Omit the list, or leave it empty, to enable none of them. |
| `source.path` | The directory to select inside the artifact, when the content is not at its root. The path must be relative, and it cannot climb out of the artifact with `..` segments. |

One AgentTemplate accepts up to 20 plugins.

### Skill allowlist

List the name of each skill that you want in `plugins[].skills`. A skill's name is the name of its subdirectory under `skills/` in the plugin.

Attaching a plugin does not enable the skills that it contains, and an empty list does not enable any of them. kagent accepts an empty list as a safe default rather than reporting an error. An explicit list also means that a later version of the plugin cannot add skills to your agent. To enable a new skill, add its name.

Plugin names must be unique. If two entries in `plugins` declare the same name in their manifests, the agent fails to start. Skill names come from your AgentTemplate, so kagent checks them before it fetches anything. A plugin name comes from the plugin's own manifest, and kagent can only check that name as each plugin is fetched.

## Claude-format plugins

kagent reads `plugin.json` at the plugin root. A plugin that instead keeps its manifest at `.claude-plugin/plugin.json` is a Claude-format plugin. kagent handles a Claude-format plugin differently on each {{< gloss "Harness" >}}Harness{{< /gloss >}}.

- On the Claude harness, kagent hands the whole plugin to the Claude CLI. The `plugins[].skills` allowlist does not apply, and the agent gets every skill in the plugin.
- On every other harness, the agent fails to start, with the error `plugin is Claude-format; only the Agent Plugins format (plugin.json at the plugin root) is supported here`.

kagent also does not check the `$schema` value in a Claude-format manifest.

## MCP servers

A plugin that includes `mcp.json` contributes MCP servers to every agent that enables it, alongside any bound directly on the AgentTemplate. The file has an `mcpServers` object, keyed by server name, and its `$schema` must be exactly `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`.

Each server specifies a transport in its `type` field, and the transport determines which other fields are allowed.

| Transport | Fields | Description |
| --------- | ------ | ----------- |
| `stdio` | `command`, `args`, `env`, `cwd` | Runs a process in the same place as the agent. Specifying `url` or `headers` is rejected. |
| `streamable-http` | `url`, `headers` | Calls a remote server. Specifying `command`, `args`, `env`, or `cwd` is rejected. |
| `sse` | `url`, `headers` | Calls a remote server over Server-Sent Events. Accepts the same fields as `streamable-http`. |

The path rules on a `stdio` server keep a plugin self-contained. A plugin can run only what it ships or what the agent's image already provides, and it can write only to its own data directory.

- A `stdio` command must be a bare name on the agent's `PATH`, or a path that begins with `./` and resolves inside the plugin directory. A command that uses a path separator any other way or that contains whitespace is rejected.
- A `cwd` must begin with `./`, `${PLUGIN_ROOT}`, or `${PLUGIN_DATA}`, and it must resolve inside the plugin directory or that plugin's data directory. Omit `cwd` to run the command in the plugin directory. If a `cwd` under `${PLUGIN_DATA}` does not exist yet, kagent creates it.
- A remote `url` must be `http` or `https`, and it must not carry user information or fragments. Any host other than a loopback address must use HTTPS.
- Unrecognized fields are rejected rather than ignored.

If one server in the file is invalid, kagent logs the problem and skips that server, but the rest of the file is still loaded. A whole `mcp.json` contributes nothing when it fails to parse, declares an unexpected `$schema`, or omits `mcpServers`.

### Referring to plugin files

A `stdio` server often needs to run something that the plugin ships, or to write somewhere durable. kagent expands two variables in `args`, in `env` values, and in `cwd`.

- `${PLUGIN_ROOT}`: The directory that the plugin was unpacked into. Treat it as read-only.
- `${PLUGIN_DATA}`: The data directory that kagent creates for that plugin. Use it for anything that the server writes.

kagent also sets `PLUGIN_ROOT` and `PLUGIN_DATA` as environment variables on every `stdio` server, so a server can read them without the plugin declaring them. A plugin cannot override either variable. An `env` block that sets one of them is rejected.

## Plugin limits

kagent measures a plugin after fetching it and before mounting anything. A plugin is rejected if it contains more than 10,000 filesystem entries or more than 100 MB of regular files. A `.git` directory is skipped and counts toward neither. A symlink that resolves outside the artifact root is also rejected.

{{< reuse "kagent-docs/snippets/artifact-sources.md" >}}
