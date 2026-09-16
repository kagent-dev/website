---
title: kagent mcp
description: MCP (Model Context Protocol) server management.
weight: 260
---

MCP server management commands for creating and managing
Model Context Protocol servers with dynamic tool loading.

```bash
kagent mcp [command]
```

**Subcommands:**
- [`kagent mcp add-tool`](/docs/kagent/0.x/resources/cli/kagent-mcp-add-tool/) - Add a new MCP tool to your project
- [`kagent mcp build`](/docs/kagent/0.x/resources/cli/kagent-mcp-build/) - Build MCP server as a Docker image
- [`kagent mcp deploy`](/docs/kagent/0.x/resources/cli/kagent-mcp-deploy/) - Deploy MCP server to Kubernetes
- [`kagent mcp init`](/docs/kagent/0.x/resources/cli/kagent-mcp-init/) - Initialize a new MCP server project
- [`kagent mcp run`](/docs/kagent/0.x/resources/cli/kagent-mcp-run/) - Run MCP server locally
- [`kagent mcp secrets`](/docs/kagent/0.x/resources/cli/kagent-mcp-secrets/) - Manage project secrets

**Flags:**
- `-h, --help` - help for mcp

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
