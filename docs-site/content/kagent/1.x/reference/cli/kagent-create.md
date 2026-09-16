---
title: kagent create
description: Create a kagent resource.
weight: 80
---

Create a kagent resource

```bash
kagent create [flags]
kagent create [command]
```

**Subcommands:**
- [`kagent create agent-instance`](/docs/kagent/1.x/reference/cli/kagent-create-agent-instance/) - Create an AgentInstance

**Flags:**
- `-h, --help` - help for create

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
