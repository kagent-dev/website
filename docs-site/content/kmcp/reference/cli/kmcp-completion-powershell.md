---
title: kmcp completion powershell
description: Generate the autocompletion script for powershell
weight: 60
---

Generate the autocompletion script for powershell.

To load completions in your current shell session:

	kmcp completion powershell | Out-String | Invoke-Expression

To load completions for every new session, add the output of the above command
to your powershell profile.

```bash
kmcp completion powershell [flags]
```

**Flags:**
- `-h, --help` - help for powershell
- `--no-descriptions` - disable completion descriptions

**Global Flags:**
- `-v, --verbose` - verbose output
