---
title: kagent completion powershell
description: Generate the autocompletion script for powershell.
weight: 70
---

Generate the autocompletion script for powershell.

To load completions in your current shell session:

	kagent completion powershell | Out-String | Invoke-Expression

To load completions for every new session, add the output of the above command
to your powershell profile.

```bash
kagent completion powershell [flags]
```

**Flags:**
- `-h, --help` - help for powershell
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
