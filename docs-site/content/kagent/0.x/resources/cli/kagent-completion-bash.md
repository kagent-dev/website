---
title: kagent completion bash
description: Generate the autocompletion script for bash.
weight: 50
---

Generate the autocompletion script for the bash shell.

This script depends on the 'bash-completion' package.
If it is not installed already, you can install it via your OS's package manager.

To load completions in your current shell session:

	source <(kagent completion bash)

To load completions for every new session, execute once:

\#### Linux:

	kagent completion bash > /etc/bash_completion.d/kagent

\#### macOS:

	kagent completion bash > $(brew --prefix)/etc/bash_completion.d/kagent

You will need to start a new shell for this setup to take effect.

```bash
kagent completion bash
```

**Flags:**
- `-h, --help` - help for bash
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
