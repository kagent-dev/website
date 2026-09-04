---
title: kmcp completion fish
description: Generate the autocompletion script for fish
weight: 50
---

Generate the autocompletion script for the fish shell.

To load completions in your current shell session:

	kmcp completion fish | source

To load completions for every new session, execute once:

	kmcp completion fish > ~/.config/fish/completions/kmcp.fish

You will need to start a new shell for this setup to take effect.

```bash
kmcp completion fish [flags]
```

**Flags:**
- `-h, --help` - help for fish
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `-v, --verbose` - verbose output
