---
title: kagent delete
description: Delete a kagent resource.
weight: 180
---

Delete a kagent resource

```bash
kagent delete [flags]
kagent delete [command]
```

**Subcommands:**
- [`kagent delete agent-instance`](/docs/kagent/1.x/reference/cli/kagent-delete-agent-instance/) - Delete an AgentInstance

**Flags:**
- `-h, --help` - help for delete

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
