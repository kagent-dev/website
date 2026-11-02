---
title: kagent install
description: Install kagent.
weight: 370
---

Install kagent. With --dry-run, write Helm commands and merged values to a directory without changing the cluster. Complete the documented prerequisites before running the exported commands.

```bash
kagent install [flags]
```

**Flags:**
- `--dry-run` - Export Helm commands and values without changing the cluster
- `-h, --help` - help for install
- `--output-dir string` - Directory for --dry-run output (must not exist) (default "kagent-install")
- `--profile string` - Installation profile (minimal)
- `--skip-database-setup` - Skip bundled PostgreSQL deployment and initialization

**Global Flags:**
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--config string` - Configuration file (default: user config directory/kagent/config.yaml)
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `--log-level string` - Log level: debug, info, warn, error (default "info")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output
