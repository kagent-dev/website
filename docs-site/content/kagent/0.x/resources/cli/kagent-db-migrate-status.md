---
title: kagent db migrate status
description: Show how many migrations are applied vs pending across all sources
weight: 150
---

Show how many migrations are applied vs pending across all sources

```bash
kagent db migrate status [flags]
```

**Flags:**
- `-h, --help` - help for status
- `--output string` - Output format: "text" (default) or "json" (default "text")

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
