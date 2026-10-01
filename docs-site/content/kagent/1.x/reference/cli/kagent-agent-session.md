---
title: kagent agent session
description: Manage agent conversations.
weight: 50
---

Manage agent conversations

```bash
kagent agent session [command]
```

**Subcommands:**
- [`kagent agent session create`]({{< link path="reference/cli/kagent-agent-session-create" >}}) - Create a Session
- [`kagent agent session delete`]({{< link path="reference/cli/kagent-agent-session-delete" >}}) - Delete a Session
- [`kagent agent session get`]({{< link path="reference/cli/kagent-agent-session-get" >}}) - Get a Session
- [`kagent agent session list`]({{< link path="reference/cli/kagent-agent-session-list" >}}) - List your Sessions

**Flags:**
- `-h, --help` - help for session

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
