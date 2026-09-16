---
title: Plugins
description: Understand what a plugin package holds, and what kagent does with one when an agent starts.
weight: 30
author: kagent.dev
---

A **{{< gloss "Plugin package" >}}plugin package{{< /gloss >}}** is a bundle that an AgentTemplate attaches with `spec.plugins`. The package carries {{< gloss "Skill" >}}skills{{< /gloss >}} and can also declare {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) servers. Packages follow the [Agent Plugins](https://agent-plugins.org) 1.0.0 format, which kagent consumes rather than defines. This page covers what a package holds and how kagent handles it. To understand how to attach a plugin package with an AgentTemplate, see [Skills]({{< link path="skills-and-mcp/skills" >}}).

## What a package holds

A package root can hold up to three things.

- `plugin.json` (required): The manifest that names the package.
- `skills/`: One subdirectory per skill, each holding a `SKILL.md` file at its root.
- `mcp.json`: Declares MCP servers that kagent adds to the agent's tools.

kagent reads `name` from the manifest and ignores the rest, so a package that carries `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, or `extensions` is accepted, but none of those fields change what the agent gets. The manifest's `$schema` must be exactly `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`.

> [!NOTE]
> kagent compares that `$schema` value literally. It does not fetch the schema or validate the document against it, so a manifest that names the right schema and holds the wrong shape is rejected by the decoder rather than by schema validation.

## MCP servers

A package that includes `mcp.json` contributes MCP servers to every agent that enables it, alongside any bound directly on the AgentTemplate (see [About tools]({{< link path="skills-and-mcp/about-tools" >}})). The file declares an `mcpServers` object, keyed by server name, and its `$schema` must be exactly `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`.

Each server names a transport in its `type` field, and the transport determines which other fields are allowed.

| Transport | Fields | Description |
| --------- | ------ | ----------- |
| `stdio` | `command`, `args`, `env`, `cwd` | Runs a process inside the agent's sandbox. Specifying `url` or `headers` is rejected. |
| `streamable-http` | `url`, `headers` | Calls a remote server. Specifying `command`, `args`, `env`, or `cwd` is rejected. |
| `sse` | `url`, `headers` | Calls a remote server over Server-Sent Events. Accepts the same fields as `streamable-http`. |

kagent enforces several rules on these servers, and each one exists to keep a package from reaching outside itself.

- A `stdio` command must be either a bare name resolved on the sandbox's path, or a package-relative path beginning with `./`. A command holding a path separator any other way or containing whitespace is rejected.
- A `cwd` must be package-relative or written with the `${PLUGIN_ROOT}` or `${PLUGIN_DATA}` [variables](#referring-to-package-files), and it is rejected if it resolves outside the package.
- A remote `url` must be `http` or `https`, and must not carry user information or fragments. Any host other than a loopback address must use HTTPS.
- Unrecognized fields are rejected rather than ignored.

An invalid server is skipped with a log entry, and the rest of the file still loads. An `mcp.json` that is invalid or that names an unexpected schema is ignored in full.

### Referring to package files

A `stdio` server often needs to run something that the package ships, or to write somewhere durable. Two variables are expanded in `args`, `env` values, and `cwd`.

- `${PLUGIN_ROOT}`: The directory the package was unpacked into. Read-only in practice, and shared by every Actor of the template.
- `${PLUGIN_DATA}`: A per-package data directory that kagent creates. Use it for anything the server writes.

kagent also sets both as environment variables on every `stdio` server, so a server can read them without the package declaring them. A package cannot override either one: an `env` block that sets `PLUGIN_ROOT` or `PLUGIN_DATA` is rejected.

## Package limits

kagent measures a package after fetching it and before mounting anything. A package is rejected if it holds more than 10,000 filesystem entries or more than 100 MB of regular files. A `.git` directory is skipped and counts toward neither.

{{< reuse "kagent-docs/snippets/artifact-sources.md" >}}
