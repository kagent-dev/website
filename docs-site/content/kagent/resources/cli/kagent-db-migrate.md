---
title: kagent db migrate
description: Apply, roll back, and inspect database migrations
weight: 110
---

Apply, roll back, and inspect database migrations independently
of server startup. Reads POSTGRES_DATABASE_URL from the environment when
--db-url is omitted.

```bash
kagent db migrate [command]
```

**Subcommands:**
- [`kagent db migrate down`](/docs/kagent/resources/cli/kagent-db-migrate-down/) - Roll back the N most-recent applied migrations for the selected source
- [`kagent db migrate force`](/docs/kagent/resources/cli/kagent-db-migrate-force/) - Mark version V as applied without running its SQL
- [`kagent db migrate goto`](/docs/kagent/resources/cli/kagent-db-migrate-goto/) - Move the selected source's schema to version V
- [`kagent db migrate status`](/docs/kagent/resources/cli/kagent-db-migrate-status/) - Show how many migrations are applied vs pending across all sources
- [`kagent db migrate up`](/docs/kagent/resources/cli/kagent-db-migrate-up/) - Apply all pending migrations across every registered source
- [`kagent db migrate version`](/docs/kagent/resources/cli/kagent-db-migrate-version/) - Print the highest applied migration version

**Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `-h, --help` - help for migrate
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.

**Global Flags:**
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
