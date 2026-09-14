---
title: kagent db migrate force
description: Mark version V as applied without running its SQL
weight: 130
---

Used to reconcile the selected source's tracking table after manual
remediation, e.g. to clear a dirty flag left by a failed migration.
V=0 clears the version record entirely (the "no migrations applied"
state). Any other V must correspond to a shipped migration file in
the selected source — otherwise the tracking row would point at a
version the binary cannot apply or roll back to, wedging the DB.

```bash
kagent db migrate force V [flags]
```

**Flags:**
- `-h, --help` - help for force

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
