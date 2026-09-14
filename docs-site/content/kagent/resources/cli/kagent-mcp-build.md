---
title: kagent mcp build
description: Build MCP server as a Docker image
weight: 280
---

Build an MCP server from the current project.

This command will detect the project type and build the appropriate
MCP server Docker image.

```bash
kagent mcp build [flags]
```

**Flags:**
- `-h, --help` - help for build
- `--kind-load` - Load image into kind cluster (requires kind)
- `--kind-load-cluster string` - Name of the kind cluster to load image into (default: current cluster)
- `--platform string` - Target platform (e.g., linux/amd64,linux/arm64)
- `-d, --project-dir string` - Build directory (default: current directory)
- `--push` - Push Docker image to registry
- `-t, --tag string` - Docker image tag (alias for --output)

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
kagent mcp build                    # Build Docker image from current directory
kagent mcp build --project-dir ./my-project  # Build Docker image from specific directory
```
