---
title: kagent mcp init python
description: Initialize a new Python MCP server project
weight: 340
---

Initialize a new MCP server project using the fastmcp-python framework.

This command will create a new directory with a basic fastmcp-python project structure,
including a pyproject.toml file, a main.py file, and an example tool.

```bash
kagent mcp init python [project-name] [flags]
```

**Flags:**
- `-h, --help` - help for python

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
