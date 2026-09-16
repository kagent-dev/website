---
title: kagent get
description: Get a kagent resource.
weight: 200
---

Get a kagent resource

```bash
kagent get [flags]
kagent get [command]
```

**Subcommands:**
- [`kagent get agent-instance`](/docs/kagent/1.x/reference/cli/kagent-get-agent-instance/) - Get an AgentInstance or list your AgentInstances
- [`kagent get agent-template`](/docs/kagent/1.x/reference/cli/kagent-get-agent-template/) - Get an AgentTemplate or list AgentTemplates

**Flags:**
- `-h, --help` - help for get

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
