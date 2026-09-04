---
title: kagent db migrate down
description: Roll back the N most-recent applied migrations for the selected source
weight: 120
---

Roll back the N most-recent applied migrations for the selected source.

Down migrations can lose data by design — a rolled-back column loses
its contents. Refuses to run while the source's tracking table is
dirty; clear it with 'force' first.

```bash
kagent db migrate down N [flags]
```

**Flags:**
- `-h, --help` - help for down

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
