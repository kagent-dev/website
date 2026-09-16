---
title: kagent create agent-instance
description: Create an AgentInstance.
weight: 90
---

Create an AgentInstance

```bash
kagent create agent-instance [flags]
```

**Flags:**
- `--agent-template string` - AgentTemplate name
- `--harness string` - Harness name
- `-h, --help` - help for agent-instance
- `--request-id string` - Idempotency key (generated when omitted)

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
