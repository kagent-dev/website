---
title: kmcp completion zsh
description: Generate the autocompletion script for zsh
weight: 70
---

Generate the autocompletion script for the zsh shell.

If shell completion is not already enabled in your environment you will need
to enable it.  You can execute the following once:

	echo "autoload -U compinit; compinit" >> ~/.zshrc

To load completions in your current shell session:

	source <(kmcp completion zsh)

To load completions for every new session, execute once:

\#### Linux:

	kmcp completion zsh > "${fpath[1]}/_kmcp"

\#### macOS:

	kmcp completion zsh > $(brew --prefix)/share/zsh/site-functions/_kmcp

You will need to start a new shell for this setup to take effect.

```bash
kmcp completion zsh [flags]
```

**Flags:**
- `-h, --help` - help for zsh
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `-v, --verbose` - verbose output
