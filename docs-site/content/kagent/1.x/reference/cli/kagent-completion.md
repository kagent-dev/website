---
title: kagent completion
description: Generate the autocompletion script for the specified shell.
weight: 30
---

Generate the autocompletion script for kagent for the specified shell.
See each sub-command's help for details on how to use the generated script.

```bash
kagent completion [command]
```

**Subcommands:**
- [`kagent completion bash`]({{< link path="reference/cli/kagent-completion-bash" >}}) - Generate the autocompletion script for bash
- [`kagent completion fish`]({{< link path="reference/cli/kagent-completion-fish" >}}) - Generate the autocompletion script for fish
- [`kagent completion powershell`]({{< link path="reference/cli/kagent-completion-powershell" >}}) - Generate the autocompletion script for powershell
- [`kagent completion zsh`]({{< link path="reference/cli/kagent-completion-zsh" >}}) - Generate the autocompletion script for zsh

**Flags:**
- `-h, --help` - help for completion

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
