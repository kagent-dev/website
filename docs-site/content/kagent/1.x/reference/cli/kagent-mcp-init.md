---
title: kagent mcp init
description: Initialize a new MCP server project.
weight: 300
---

Initialize a new MCP server project with dynamic tool loading.

This command provides subcommands to initialize a new MCP server project
using one of the supported frameworks.

```bash
kagent mcp init [project-name] [flags]
kagent mcp init [command]
```

**Subcommands:**
- [`kagent mcp init go`](/docs/kagent/1.x/reference/cli/kagent-mcp-init-go/) - Initialize a new Go MCP server project
- [`kagent mcp init java`](/docs/kagent/1.x/reference/cli/kagent-mcp-init-java/) - Initialize a new Java MCP server project
- [`kagent mcp init python`](/docs/kagent/1.x/reference/cli/kagent-mcp-init-python/) - Initialize a new Python MCP server project
- [`kagent mcp init typescript`](/docs/kagent/1.x/reference/cli/kagent-mcp-init-typescript/) - Initialize a new TypeScript MCP server project

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
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output
