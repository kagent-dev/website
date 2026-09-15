---
title: kagent db migrate version
description: Show the applied migration version.
weight: 170
---

Show the applied migration version

```bash
kagent db migrate version [flags]
```

**Flags:**
- `-h, --help` - help for version

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--db-url string` - PostgreSQL connection URL
- `--server-name string` - TLS server name for KAgent endpoints
- `--source string` - Migration source for down, goto, or version
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
