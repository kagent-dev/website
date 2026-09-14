---
title: kmcp run
description: Run MCP server locally
weight: 160
---

Run an MCP server locally using the Model Context Protocol inspector.

By default, this command will:
1. Load the kmcp.yaml configuration from the project directory
2. Determine the framework type and create the appropriate mcp inspector configuration
3. Launch the MCP inspector, which will start the server when you click "Connect"

If you want to run the server directly without the inspector, use the --no-inspector flag.
This will execute the server directly using the appropriate framework command.

Supported frameworks:
- fastmcp-python: Requires uv to be installed
- mcp-go: Requires Go to be installed

```bash
kmcp run [flags]
```

**Flags:**
- `-h, --help` - help for run
- `--no-inspector` - Run the server directly without launching the MCP inspector
- `-d, --project-dir string` - Project directory to use (default: current directory)
- `--transport string` - Transport mode (stdio or http) (default "stdio")

**Global Flags:**
- `-v, --verbose` - verbose output

## Example

```bash
kmcp run --project-dir ./my-project     # Run with inspector (default)
kmcp run --no-inspector                 # Run server directly without inspector
kmcp run --transport http               # Run with HTTP transport
```
