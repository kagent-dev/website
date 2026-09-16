---
title: kagent completion zsh
description: Generate the autocompletion script for zsh.
weight: 70
---

Generate the autocompletion script for the zsh shell.

If shell completion is not already enabled in your environment you will need
to enable it.  You can execute the following once:

	echo "autoload -U compinit; compinit" >> ~/.zshrc

To load completions in your current shell session:

	source <(kagent completion zsh)

To load completions for every new session, execute once:

\#### Linux:

	kagent completion zsh > "${fpath[1]}/_kagent"

\#### macOS:

	kagent completion zsh > $(brew --prefix)/share/zsh/site-functions/_kagent

You will need to start a new shell for this setup to take effect.

```bash
kagent completion zsh [flags]
```

**Flags:**
- `-h, --help` - help for zsh
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
