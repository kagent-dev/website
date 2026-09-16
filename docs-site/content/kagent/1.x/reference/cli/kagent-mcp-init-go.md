---
title: kagent mcp init go
description: Initialize a new Go MCP server project.
weight: 310
---

Initialize a new MCP server project using the mcp-go framework.

This command will create a new directory with a basic mcp-go project structure,
including a go.mod file, a main.go file, and an example tool.

You must provide a valid Go module name for the project.

```bash
kagent mcp init go [project-name] [flags]
```

**Flags:**
- `--go-module-name string` - The Go module name for the project (e.g., github.com/my-org/my-project)
- `-h, --help` - help for go

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
