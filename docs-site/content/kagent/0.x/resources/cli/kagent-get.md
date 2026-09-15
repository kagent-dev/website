---
title: kagent get
description: Get a kagent resource.
weight: 190
---

Get a kagent resource

```bash
kagent get [flags]
kagent get [command]
```

**Subcommands:**
- [`kagent get agent`](/docs/kagent/0.x/resources/cli/kagent-get-agent/) - Get an agent or list all agents
- [`kagent get session`](/docs/kagent/0.x/resources/cli/kagent-get-session/) - Get a session or list all sessions
- [`kagent get tool`](/docs/kagent/0.x/resources/cli/kagent-get-tool/) - Get tools

**Flags:**
- `-h, --help` - help for get

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
