---
title: kagent mcp
description: MCP (Model Context Protocol) server management
weight: 260
---

MCP server management commands for creating and managing
Model Context Protocol servers with dynamic tool loading.

```bash
kagent mcp [command]
```

**Subcommands:**
- [`kagent mcp add-tool`](/docs/kagent/resources/cli/kagent-mcp-add-tool/) - Add a new MCP tool to your project
- [`kagent mcp build`](/docs/kagent/resources/cli/kagent-mcp-build/) - Build MCP server as a Docker image
- [`kagent mcp deploy`](/docs/kagent/resources/cli/kagent-mcp-deploy/) - Deploy MCP server to Kubernetes
- [`kagent mcp init`](/docs/kagent/resources/cli/kagent-mcp-init/) - Initialize a new MCP server project
- [`kagent mcp run`](/docs/kagent/resources/cli/kagent-mcp-run/) - Run MCP server locally
- [`kagent mcp secrets`](/docs/kagent/resources/cli/kagent-mcp-secrets/) - Manage project secrets

**Flags:**
- `-h, --help` - help for mcp

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
