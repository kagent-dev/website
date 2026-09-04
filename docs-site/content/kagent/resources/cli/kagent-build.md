---
title: kagent build
description: Build a Docker images for an agent project
weight: 30
---

Build Docker images for an agent project created with the init command.

This command will look for a kagent.yaml file in the specified project directory and build Docker images using docker build. The images can optionally be pushed to a registry.

Image naming:
- If --image is provided, it will be used as the full image specification (e.g., ghcr.io/myorg/my-agent:v1.0.0)
- Otherwise, defaults to localhost:5001/{agentName}:latest where agentName is loaded from kagent.yaml

```bash
kagent build [project-directory] [flags]
```

**Flags:**
- `-h, --help` - help for build
- `--image string` - Full image specification (e.g., ghcr.io/myorg/my-agent:v1.0.0)
- `--platform string` - Target platform for Docker build (e.g., linux/amd64, linux/arm64)
- `--push` - Push the image to the registry

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
kagent build ./my-agent
kagent build ./my-agent --image ghcr.io/myorg/my-agent:v1.0.0
kagent build ./my-agent --image ghcr.io/myorg/my-agent:v1.0.0 --push
```
