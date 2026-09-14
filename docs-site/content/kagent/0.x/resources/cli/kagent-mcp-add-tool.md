---
title: kagent mcp add-tool
description: Add a new MCP tool to your project
weight: 270
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
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output

## Example

```bash
kagent mcp add-tool weather
kagent mcp add-tool database --description "Database operations tool"
kagent mcp add-tool weather --force  # Overwrite existing tool
```
