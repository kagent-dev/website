---
title: kmcp init
description: Initialize a new MCP server project
weight: 100
---

Initialize a new MCP server project with dynamic tool loading.

This command provides subcommands to initialize a new MCP server project
using one of the supported frameworks.

```bash
kmcp init [project-name] [flags]
```

**Subcommands:**
- [`kmcp init go`](/docs/kmcp/reference/cli/kmcp-init-go/) - Initialize a new Go MCP server project
- [`kmcp init java`](/docs/kmcp/reference/cli/kmcp-init-java/) - Initialize a new Java MCP server project
- [`kmcp init python`](/docs/kmcp/reference/cli/kmcp-init-python/) - Initialize a new Python MCP server project
- [`kmcp init typescript`](/docs/kmcp/reference/cli/kmcp-init-typescript/) - Initialize a new TypeScript MCP server project

**Flags:**
- `--author string` - Author name for the project
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `-h, --help` - help for init
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode

**Global Flags:**
- `-v, --verbose` - verbose output
