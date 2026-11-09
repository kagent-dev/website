---
title: kagent db
description: Database operations (migrations, inspection).
weight: 300
---

Database operations (migrations, inspection)

```bash
kagent db [command]
```

**Subcommands:**
- [`kagent db migrate`]({{< link path="reference/cli/kagent-db-migrate" >}}) - Apply, roll back, and inspect database migrations

**Flags:**
- `-h, --help` - help for db

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--config string` - Configuration file (default: user config directory/kagent/config.yaml)
- `--log-level string` - Log level: debug, info, warn, error (default "info")
- `--server-name string` - TLS server name for KAgent endpoints
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
