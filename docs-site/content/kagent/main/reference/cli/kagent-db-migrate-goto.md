---
title: kagent db migrate goto
description: Move one source to version V.
weight: 330
---

Move one source to version V. Version zero removes its schema.

```bash
kagent db migrate goto V [flags]
```

**Flags:**
- `-h, --help` - help for goto

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--config string` - Configuration file (default: user config directory/kagent/config.yaml)
- `--db-role string` - Owner role to assume after authentication (required)
- `--db-url string` - PostgreSQL connection URL for the owner login
- `--db-url-file string` - File containing the owner login's PostgreSQL connection URL
- `--log-level string` - Log level: debug, info, warn, error (default "info")
- `--server-name string` - TLS server name for KAgent endpoints
- `--source string` - Migration source for down, goto, or version
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
