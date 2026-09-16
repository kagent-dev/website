---
title: kagent mcp secrets
description: Manage project secrets.
weight: 360
---

Manage secrets for MCP server projects.

```bash
kagent mcp secrets [command]
```

**Subcommands:**
- [`kagent mcp secrets sync`](/docs/kagent/1.x/reference/cli/kagent-mcp-secrets-sync/) - Sync secrets to a Kubernetes environment from a local .env file

**Flags:**
- `-h, --help` - help for secrets

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
