---
title: kagent db migrate status
description: Show migration status.
weight: 150
---

Show migration status

```bash
kagent db migrate status [flags]
```

**Flags:**
- `-h, --help` - help for status
- `--output string` - Output format: "text" or "json" (default "text")

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--db-url string` - PostgreSQL connection URL
- `--server-name string` - TLS server name for KAgent endpoints
- `--source string` - Migration source for down, goto, or version
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
