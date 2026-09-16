---
title: kagent completion
description: Generate the autocompletion script for the specified shell.
weight: 40
---

Generate the autocompletion script for kagent for the specified shell.
See each sub-command's help for details on how to use the generated script.

```bash
kagent completion [command]
```

**Subcommands:**
- [`kagent completion bash`](/docs/kagent/0.x/resources/cli/kagent-completion-bash/) - Generate the autocompletion script for bash
- [`kagent completion fish`](/docs/kagent/0.x/resources/cli/kagent-completion-fish/) - Generate the autocompletion script for fish
- [`kagent completion powershell`](/docs/kagent/0.x/resources/cli/kagent-completion-powershell/) - Generate the autocompletion script for powershell
- [`kagent completion zsh`](/docs/kagent/0.x/resources/cli/kagent-completion-zsh/) - Generate the autocompletion script for zsh

**Flags:**
- `-h, --help` - help for completion

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
