---
title: kagent completion fish
description: Generate the autocompletion script for fish.
weight: 60
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
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
