---
title: kagent get agent
description: Get an agent or list all agents.
weight: 200
---

Get an agent by name or list all agents

```bash
kagent get agent [agent_name] [flags]
```

**Flags:**
- `-h, --help` - help for agent

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
