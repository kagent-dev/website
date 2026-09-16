---
title: kagent mcp add-tool
description: Add a new MCP tool to your project.
weight: 260
---

Generate a new MCP tool that will be automatically loaded by the server.

This command creates a new tool file in src/tools/ with a generic template.
The tool will be automatically discovered and loaded when the server starts.

Each tool is a Python file containing a function decorated with @mcp.tool().
The function should use the @mcp.tool() decorator from FastMCP.

```bash
kagent mcp add-tool [tool-name] [flags]
```

**Flags:**
- `-d, --description string` - Tool description
- `-f, --force` - Overwrite existing tool file
- `-h, --help` - help for add-tool
- `-i, --interactive` - Interactive tool creation
- `--project-dir string` - Project directory (default: current directory)

**Global Flags:**
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output

## Example

```bash
kagent mcp add-tool weather
kagent mcp add-tool database --description "Database operations tool"
kagent mcp add-tool weather --force  # Overwrite existing tool
```
