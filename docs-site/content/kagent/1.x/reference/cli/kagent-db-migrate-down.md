---
title: kagent db migrate down
description: Roll back the latest N migrations.
weight: 130
---

Roll back the latest N migrations. A down migration can delete data.

```bash
kagent db migrate down N [flags]
```

**Flags:**
- `-h, --help` - help for down

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--db-url string` - PostgreSQL connection URL
- `--server-name string` - TLS server name for KAgent endpoints
- `--source string` - Migration source for down, goto, or version
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
