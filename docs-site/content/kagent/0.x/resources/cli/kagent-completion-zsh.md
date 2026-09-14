---
title: kagent completion zsh
description: Generate the autocompletion script for zsh
weight: 80
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
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
