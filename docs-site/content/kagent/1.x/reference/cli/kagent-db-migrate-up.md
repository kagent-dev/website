---
title: kagent db migrate up
description: Apply all pending migrations.
weight: 160
---

Apply all pending migrations

```bash
kagent db migrate up [flags]
```

**Flags:**
- `-h, --help` - help for up

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--db-url string` - PostgreSQL connection URL
- `--server-name string` - TLS server name for KAgent endpoints
- `--source string` - Migration source for down, goto, or version
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
