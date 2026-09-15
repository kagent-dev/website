---
title: kagent mcp init typescript
description: Initialize a new TypeScript MCP server project.
weight: 340
---

Initialize a new MCP server project using the TypeScript MCP framework.

This command will create a new directory with a basic TypeScript MCP project structure,
including a package.json file, a tsconfig.json file, and an example tool.

```bash
kagent mcp init typescript [project-name] [flags]
```

**Flags:**
- `-h, --help` - help for typescript

**Global Flags:**
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--author string` - Author name for the project
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output
