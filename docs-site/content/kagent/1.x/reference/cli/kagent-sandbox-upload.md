---
title: kagent sandbox upload
description: Stream a local file into a sandbox (replaces the remote file).
weight: 540
---

Stream a local file into a sandbox (replaces the remote file)

```bash
kagent sandbox upload ID LOCAL_FILE REMOTE_PATH [flags]
```

**Flags:**
- `-h, --help` - help for upload
- `--mode uint32` - Remote Unix file mode, e.g. 0644 (omission uses guest defaults)

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
