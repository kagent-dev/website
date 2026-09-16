---
title: kagent db
description: Database operations (migrations, inspection).
weight: 110
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
- `--server-name string` - TLS server name for KAgent endpoints
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
