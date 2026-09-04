---
title: kagent mcp init go
description: Initialize a new Go MCP server project
weight: 320
---

Initialize a new MCP server project using the mcp-go framework.

This command will create a new directory with a basic mcp-go project structure,
including a go.mod file, a main.go file, and an example tool.

You must provide a valid Go module name for the project.

```bash
kagent mcp init go [project-name] [flags]
```

**Flags:**
- `--go-module-name string` - The Go module name for the project (e.g., github.com/my-org/my-project)
- `-h, --help` - help for go

**Global Flags:**
- `--author string` - Author name for the project
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output
