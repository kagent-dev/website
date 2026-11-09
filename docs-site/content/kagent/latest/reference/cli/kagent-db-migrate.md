---
title: kagent db migrate
description: Apply, roll back, and inspect database migrations.
weight: 310
---

Apply, roll back, and inspect database migrations.
Migrations run as the owner login. Connection settings come from database.owner in
the CLI configuration or explicit database flags.

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
- `--db-role string` - Owner role to assume after authentication (required)
- `--db-url string` - PostgreSQL connection URL for the owner login
- `--db-url-file string` - File containing the owner login's PostgreSQL connection URL
- `-h, --help` - help for migrate
- `--source string` - Migration source for down, goto, or version

**Global Flags:**
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--config string` - Configuration file (default: user config directory/kagent/config.yaml)
- `--log-level string` - Log level: debug, info, warn, error (default "info")
- `--server-name string` - TLS server name for KAgent endpoints
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
