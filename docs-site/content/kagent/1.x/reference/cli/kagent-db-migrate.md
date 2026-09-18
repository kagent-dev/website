---
title: kagent db migrate
description: Apply, roll back, and inspect database migrations.
weight: 120
---

Apply, roll back, and inspect database migrations.
The command reads POSTGRES_DATABASE_URL when --db-url is empty.

```bash
kagent db migrate [command]
```

**Subcommands:**
- [`kagent db migrate down`]({{< link path="reference/cli/kagent-db-migrate-down" >}}) - Roll back the latest N migrations
- [`kagent db migrate goto`]({{< link path="reference/cli/kagent-db-migrate-goto" >}}) - Move one source to version V
- [`kagent db migrate status`]({{< link path="reference/cli/kagent-db-migrate-status" >}}) - Show migration status
- [`kagent db migrate up`]({{< link path="reference/cli/kagent-db-migrate-up" >}}) - Apply all pending migrations
- [`kagent db migrate version`]({{< link path="reference/cli/kagent-db-migrate-version" >}}) - Show the applied migration version

**Flags:**
- `--db-url string` - PostgreSQL connection URL
- `-h, --help` - help for migrate
- `--source string` - Migration source for down, goto, or version

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--server-name string` - TLS server name for KAgent endpoints
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
