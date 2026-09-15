---
title: kagent mcp secrets
description: Manage project secrets.
weight: 370
---

Manage secrets for MCP server projects.

```bash
kagent mcp secrets [command]
```

**Subcommands:**
- [`kagent mcp secrets sync`](/docs/kagent/0.x/resources/cli/kagent-mcp-secrets-sync/) - Sync secrets to a Kubernetes environment from a local .env file

**Flags:**
- `-h, --help` - help for secrets

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
