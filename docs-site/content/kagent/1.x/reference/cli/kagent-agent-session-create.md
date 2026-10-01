---
title: kagent agent session create
description: Create a Session.
weight: 60
---

Create a Session

```bash
kagent agent session create [flags]
```

**Flags:**
- `--agent string` - Agent name
- `-h, --help` - help for create
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
