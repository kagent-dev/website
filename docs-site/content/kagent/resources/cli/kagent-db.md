---
title: kagent db
description: Database operations (migrations, inspection)
weight: 100
---

Database operations (migrations, inspection)

```bash
kagent db [command]
```

**Subcommands:**
- [`kagent db migrate`](/docs/kagent/resources/cli/kagent-db-migrate/) - Apply, roll back, and inspect database migrations

**Flags:**
- `-h, --help` - help for db

**Global Flags:**
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
