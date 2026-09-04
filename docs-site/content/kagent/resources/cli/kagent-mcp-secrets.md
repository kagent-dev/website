---
title: kagent mcp secrets
description: Manage project secrets
weight: 370
---

Manage secrets for MCP server projects.

```bash
kagent mcp secrets [command]
```

**Subcommands:**
- [`kagent mcp secrets sync`](/docs/kagent/resources/cli/kagent-mcp-secrets-sync/) - Sync secrets to a Kubernetes environment from a local .env file

**Flags:**
- `-h, --help` - help for secrets

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
