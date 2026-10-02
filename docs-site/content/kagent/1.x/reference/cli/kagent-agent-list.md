---
title: kagent agent list
description: List Agents.
weight: 40
---

List Agents

```bash
kagent agent list [flags]
```

**Flags:**
- `-h, --help` - help for list
- `--page-size int` - Number of Agents per page (0 uses 100; maximum 100)
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
