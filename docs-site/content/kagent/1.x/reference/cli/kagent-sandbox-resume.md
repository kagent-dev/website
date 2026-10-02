---
title: kagent sandbox resume
description: resume a sandbox.
weight: 510
---

Inspect or change sandbox lifecycle. Mutations make one attempt; retry the same mutation on transient errors. Get only observes. Suspend can interrupt work; delete removes files.

```bash
kagent sandbox resume ID [flags]
```

**Flags:**
- `-h, --help` - help for resume

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
