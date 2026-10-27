---
title: kagent uninstall
description: Uninstall kagent.
weight: 520
---

Uninstall kagent: the kagent and Substrate Helm releases, their CRDs, the
bundled PostgreSQL and its data, and the ate-system and
podcertificate-controller-system namespaces. Removing the CRDs deletes every
resource created from them, such as agents and model configs.

A database that kagent install did not deploy, such as one used with
--skip-database-setup, stays. The kagent namespace stays.

```bash
kagent uninstall [flags]
```

**Flags:**
- `-h, --help` - help for uninstall

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
