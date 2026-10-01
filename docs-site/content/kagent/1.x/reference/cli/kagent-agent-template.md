---
title: kagent agent template
description: Discover reusable agent templates.
weight: 100
---

Discover reusable agent templates

```bash
kagent agent template [command]
```

**Subcommands:**
- [`kagent agent template get`]({{< link path="reference/cli/kagent-agent-template-get" >}}) - Get an AgentTemplate
- [`kagent agent template list`]({{< link path="reference/cli/kagent-agent-template-list" >}}) - List AgentTemplates

**Flags:**
- `-h, --help` - help for template

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
