---
title: kmcp completion bash
description: Generate the autocompletion script for bash
weight: 40
---

Generate the autocompletion script for the bash shell.

This script depends on the 'bash-completion' package.
If it is not installed already, you can install it via your OS's package manager.

To load completions in your current shell session:

	source <(kmcp completion bash)

To load completions for every new session, execute once:

\#### Linux:

	kmcp completion bash > /etc/bash_completion.d/kmcp

\#### macOS:

	kmcp completion bash > $(brew --prefix)/etc/bash_completion.d/kmcp

You will need to start a new shell for this setup to take effect.

```bash
kmcp completion bash
```

**Flags:**
- `-h, --help` - help for bash
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `-v, --verbose` - verbose output
