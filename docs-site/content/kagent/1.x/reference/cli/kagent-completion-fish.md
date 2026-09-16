---
title: kagent completion fish
description: Generate the autocompletion script for fish.
weight: 50
---

Generate the autocompletion script for the fish shell.

To load completions in your current shell session:

	kagent completion fish | source

To load completions for every new session, execute once:

	kagent completion fish > ~/.config/fish/completions/kagent.fish

You will need to start a new shell for this setup to take effect.

```bash
kagent completion fish [flags]
```

**Flags:**
- `-h, --help` - help for fish
- `--no-descriptions` - disable completion descriptions

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
