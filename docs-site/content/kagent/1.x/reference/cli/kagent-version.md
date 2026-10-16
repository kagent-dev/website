---
title: kagent version
description: Print the kagent version.
weight: 530
---

Print the kagent version

```bash
kagent version [flags]
```

**Flags:**
- `-h, --help` - help for version

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
