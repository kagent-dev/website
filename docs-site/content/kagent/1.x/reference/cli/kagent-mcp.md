---
title: kagent mcp
description: MCP (Model Context Protocol) server management.
weight: 250
---

MCP server management commands for creating and managing
Model Context Protocol servers with dynamic tool loading.

```bash
kagent mcp [command]
```

**Subcommands:**
- [`kagent mcp add-tool`]({{< link path="reference/cli/kagent-mcp-add-tool" >}}) - Add a new MCP tool to your project
- [`kagent mcp build`]({{< link path="reference/cli/kagent-mcp-build" >}}) - Build MCP server as a Docker image
- [`kagent mcp deploy`]({{< link path="reference/cli/kagent-mcp-deploy" >}}) - Deploy MCP server to Kubernetes
- [`kagent mcp init`]({{< link path="reference/cli/kagent-mcp-init" >}}) - Initialize a new MCP server project
- [`kagent mcp run`]({{< link path="reference/cli/kagent-mcp-run" >}}) - Run MCP server locally
- [`kagent mcp secrets`]({{< link path="reference/cli/kagent-mcp-secrets" >}}) - Manage project secrets

**Flags:**
- `-h, --help` - help for mcp

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
