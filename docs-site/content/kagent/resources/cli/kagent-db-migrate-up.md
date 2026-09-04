---
title: kagent db migrate up
description: Apply all pending migrations across every registered source
weight: 160
---

Applies pending migrations for every registered source in
registration order, through the same orchestrator the server runs at
startup: per-source advisory locking, pre-run version snapshots, and
compensating rollback of earlier sources when a later one fails.

Refuses to run while any source's tracking table is dirty; clear it
with 'force' first.

The --source flag is intentionally not applicable to up; pass it only
on the per-source subcommands (down/goto/force).

```bash
kagent db migrate up [flags]
```

**Flags:**
- `-h, --help` - help for up

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
