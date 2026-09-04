---
title: kagent add-mcp
description: Add an MCP server entry to kagent.yaml
weight: 10
---

Add an MCP server entry to kagent.yaml. Use flags for non-interactive setup or run without flags to open the wizard.

```bash
kagent add-mcp [name] [args...] [flags]
```

**Flags:**
- `--arg strings` - Command argument (repeatable)
- `--build string` - Container build (optional; mutually exclusive with --image)
- `--command string` - Command to run MCP server (e.g., npx, uvx, kmcp, or a binary)
- `--env strings` - Environment variable in KEY=VALUE format (repeatable)
- `--header strings` - HTTP header for remote MCP in KEY=VALUE format (repeatable, supports ${VAR} for env vars)
- `-h, --help` - help for add-mcp
- `--image string` - Container image (optional; mutually exclusive with --build)
- `--project-dir string` - Project directory (default: current directory)
- `--remote string` - Remote MCP server URL (http/https)

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
