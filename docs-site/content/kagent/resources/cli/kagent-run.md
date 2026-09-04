---
title: kagent run
description: Run agent project locally with docker-compose and launch chat interface
weight: 390
---

Run an agent project locally using docker-compose and launch an interactive chat session.

```bash
kagent run [project-directory] [flags]
```

**Flags:**
- `--build` - Rebuild the Docker image before running
- `-h, --help` - help for run
- `--project-dir string` - Project directory (default: current directory)

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

## Example

```bash
kagent run ./my-agent
kagent run .
```
