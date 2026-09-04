---
title: kmcp deploy package
description: Deploy an MCP server using a package manager (npx, uvx)
weight: 90
---

Deploy an MCP server using a package manager to run Model Context Protocol servers.

This subcommand creates an MCPServer Custom Resource Definition (CRD) that runs
an MCP server using npx (for npm packages) or uvx (for Python packages).

The deployment name, manager, and args are required. The package manager must be either 'npx' or 'uvx'.

```bash
kmcp deploy package [flags]
```

**Flags:**
- `--args strings` - Arguments to pass to the package manager (e.g., package names) (required)
- `--deployment-name string` - Name for the deployment (required)
- `--dry-run` - Generate manifest without applying to cluster
- `--env strings` - Environment variables (KEY=VALUE)
- `-h, --help` - help for package
- `--image string` - Docker image to deploy (overrides default)
- `--manager string` - Package manager to use (npx or uvx) (required)
- `-n, --namespace string` - Kubernetes namespace
- `--no-inspector` - Do not start the MCP inspector after deployment
- `-o, --output string` - Output file for the generated YAML
- `--port int` - Container port (default: 3000)
- `--secrets strings` - List of Kubernetes secret names to mount
- `--transport string` - Transport type (stdio, http)

**Global Flags:**
- `-v, --verbose` - verbose output

## Example

```bash
kmcp deploy package --deployment-name github-server --manager npx --args @modelcontextprotocol/server-github                             # Deploy GitHub MCP server
kmcp deploy package --deployment-name github-server --manager npx --args @modelcontextprotocol/server-github  --dry-run                  # Print YAML without deploying
kmcp deploy package --deployment-name my-server --manager npx --args my-package --env "KEY1=value1,KEY2=value2"                          # Set environment variables
kmcp deploy package --deployment-name github-server --manager npx --args @modelcontextprotocol/server-github  --secrets secret1,secret2  # Mount Kubernetes secrets
kmcp deploy package --deployment-name my-server --manager npx --args my-package --no-inspector                                           # Deploy without starting inspector
kmcp deploy package --deployment-name my-server --manager uvx --args mcp-server-git                                                      # Use UV and write managed tools and installables to /tmp directories
```
