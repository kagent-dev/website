---
title: kagent sandbox exec
description: Start a command once and wait for its result.
weight: 460
---

Start a process once. By default, stream available output while waiting. A timeout stops waiting, not the remote process. Retain its process ID and use sandbox wait to reconnect. An uncertain start is never retried. JSON output is a stream of started/output/finished/interrupted records.

```bash
kagent sandbox exec ID -- COMMAND [ARG...] [flags]
```

**Flags:**
- `--cwd string` - Working directory inside the sandbox (default "/data/workspace")
- `--env stringToString` - Process environment (KEY=VALUE) (default [])
- `-h, --help` - help for exec
- `--wait` - Wait for completion and return the process exit code (default true)

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
