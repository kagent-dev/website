---
title: kagent agent
description: Discover agents and work with their conversations.
weight: 10
---

Discover agents and work with their conversations

```bash
kagent agent [command]
```

**Subcommands:**
- [`kagent agent get`]({{< link path="reference/cli/kagent-agent-get" >}}) - Get an Agent
- [`kagent agent invoke`]({{< link path="reference/cli/kagent-agent-invoke" >}}) - Invoke a Session
- [`kagent agent list`]({{< link path="reference/cli/kagent-agent-list" >}}) - List Agents
- [`kagent agent session`]({{< link path="reference/cli/kagent-agent-session" >}}) - Manage agent conversations
- [`kagent agent template`]({{< link path="reference/cli/kagent-agent-template" >}}) - Discover reusable agent templates

**Flags:**
- `-h, --help` - help for agent

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
