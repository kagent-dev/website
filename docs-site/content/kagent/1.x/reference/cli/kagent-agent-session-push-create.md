---
title: kagent agent session push create
description: Add or replace a task callback.
weight: 110
---

Add or replace a task callback

```bash
kagent agent session push create SESSION_ID TASK_ID [flags]
```

**Flags:**
- `-h, --help` - help for create
- `--id string` - Callback ID (generated when omitted)
- `--url string` - HTTP or HTTPS callback URL

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
