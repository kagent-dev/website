---
title: kagent invoke
description: Invoke an AgentInstance.
weight: 240
---

Invoke an existing AgentInstance through the A2A API.

```bash
kagent invoke [flags]
```

**Flags:**
- `--agent-instance string` - AgentInstance ID
- `-f, --file string` - Read task text from a file or - for stdin
- `-h, --help` - help for invoke
- `-S, --stream` - Stream the response
- `-t, --task string` - Task text
- `--token string` - Model API key passed through as an A2A Bearer token

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

## Example

```bash
kagent invoke --agent-instance 8bd650a8-9775-488f-8bc1-0d52bf7bdcab --task "Get all the pods"
```
