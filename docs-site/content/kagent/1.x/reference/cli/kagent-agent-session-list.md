---
title: kagent agent session list
description: List your Sessions.
weight: 90
---

List your Sessions

```bash
kagent agent session list [flags]
```

**Flags:**
- `-h, --help` - help for list
- `--page-size int32` - Number of Sessions to return (default 50, maximum 100)
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
