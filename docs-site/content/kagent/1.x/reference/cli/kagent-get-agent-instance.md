---
title: kagent get agent-instance
description: Get an AgentInstance or list your AgentInstances.
weight: 210
---

Get an AgentInstance or list your AgentInstances

```bash
kagent get agent-instance [ID] [flags]
```

**Flags:**
- `-h, --help` - help for agent-instance
- `--page-size int32` - Number of AgentInstances to return (default 50, maximum 100)
- `--page-token string` - Token returned by the previous page

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
