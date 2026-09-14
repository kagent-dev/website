---
title: kagent mcp run
description: Run MCP server locally
weight: 360
---

Run an MCP server locally using the Model Context Protocol inspector.

By default, this command will:
1. Load the manifest.yaml configuration from the project directory
2. Determine the framework type and create the appropriate mcp inspector configuration
3. Launch the MCP inspector and select STDIO as the transport type, the server will start when you click "Connect"

If you want to run the server directly without the inspector, use the --no-inspector flag.
This will execute the server directly using the appropriate framework command.

Supported frameworks:
- fastmcp-python: Requires uv to be installed
- mcp-go: Requires Go to be installed

```bash
kagent mcp run [flags]
```

**Flags:**
- `-h, --help` - help for run
- `--no-inspector` - Run the server directly without launching the MCP inspector
- `-d, --project-dir string` - Project directory to use (default: current directory)
- `--transport string` - Transport mode (stdio or http) (default "stdio")

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
kagent run mcp --project-dir ./my-project     # Run with inspector (default)
kagent run mcp --no-inspector                 # Run server directly without inspector
kagent run mcp --transport http               # Run with HTTP transport
```
