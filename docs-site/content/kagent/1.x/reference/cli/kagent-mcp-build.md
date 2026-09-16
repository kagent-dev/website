---
title: kagent mcp build
description: Build MCP server as a Docker image.
weight: 270
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
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output

## Example

```bash
kagent mcp build                    # Build Docker image from current directory
kagent mcp build --project-dir ./my-project  # Build Docker image from specific directory
```
