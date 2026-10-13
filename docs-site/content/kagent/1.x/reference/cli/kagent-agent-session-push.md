---
title: kagent agent session push
description: Manage A2A task push callbacks.
weight: 100
---

Manage A2A task push callbacks

```bash
kagent agent session push [command]
```

**Subcommands:**
- [`kagent agent session push create`]({{< link path="reference/cli/kagent-agent-session-push-create" >}}) - Add or replace a task callback
- [`kagent agent session push delete`]({{< link path="reference/cli/kagent-agent-session-push-delete" >}}) - Remove a task callback
- [`kagent agent session push get`]({{< link path="reference/cli/kagent-agent-session-push-get" >}}) - Get a task callback
- [`kagent agent session push list`]({{< link path="reference/cli/kagent-agent-session-push-list" >}}) - List active task callbacks

**Flags:**
- `-h, --help` - help for push

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
