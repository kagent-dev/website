---
title: kagent mcp deploy
description: Deploy MCP server to Kubernetes.
weight: 280
---

Deploy an MCP server to Kubernetes by generating MCPServer CRDs.

This command generates MCPServer Custom Resource Definitions (CRDs) based on:
- Project configuration from manifest.yaml
- Docker image built with 'kagent mcp build --docker'
- Deployment configuration options

The generated MCPServer will include:
- Docker image reference from the build
- Transport configuration (stdio/http)
- Port and command configuration
- Environment variables and secrets

The command can also apply Kubernetes secret YAML files to the cluster before deploying the MCPServer.
The secrets will be referenced in the MCPServer CRD for mounting as volumes to the MCP server container.
Secret namespace will be overridden with the deployment namespace to avoid the need for reference grants
to enable cross-namespace references.

```bash
kagent mcp deploy [flags]
kagent mcp deploy [command]
```

**Subcommands:**
- [`kagent mcp deploy package`](/docs/kagent/1.x/reference/cli/kagent-mcp-deploy-package/) - Deploy an MCP server using a package manager (npx, uvx)

**Flags:**
- `--args strings` - Command arguments
- `--command string` - Command to run (overrides project config)
- `--dry-run` - Generate manifest without applying to cluster
- `--env strings` - Environment variables (KEY=VALUE)
- `--environment string` - Target environment for deployment (e.g., staging, production) (default "staging")
- `-f, --file string` - Path to manifest.yaml file (default: current directory)
- `--force` - Force deployment even if validation fails
- `-h, --help` - help for deploy
- `--image string` - Docker image to deploy (overrides build image)
- `-n, --namespace string` - Kubernetes namespace (default "default")
- `--no-inspector` - Do not start the MCP inspector after deployment (default true)
- `--output string` - Output file for the generated YAML
- `--port int` - Container port (default: from project config)
- `--transport string` - Transport type (stdio, http)

**Global Flags:**
- `--api-url string` - KAgent control-plane API URL (default "http://localhost:8083")
- `--ca-file string` - CA certificate file for KAgent endpoints
- `--gateway-url string` - KAgent A2A and MCP gateway URL (default "http://localhost:8083")
- `-o, --output-format string` - Output format (default "table")
- `--server-name string` - TLS server name for KAgent endpoints
- `--timeout duration` - Timeout (default 5m0s)
- `--user-id string` - Caller identity used to select the server-side data partition (default "admin@kagent.dev")
- `-v, --verbose` - Verbose output

## Example

```bash
kagent mcp deploy                               # Deploy with project name to cluster
kagent mcp deploy my-server                     # Deploy with custom name
kagent mcp deploy --namespace staging           # Deploy to staging namespace
kagent mcp deploy --dry-run                     # Generate manifest without applying to cluster
kagent mcp deploy --image custom:tag            # Use custom image
kagent mcp deploy --transport http              # Use HTTP transport
kagent mcp deploy --output deploy.yaml          # Save to file
kagent mcp deploy --file /path/to/manifest.yaml # Use custom manifest.yaml file
kagent mcp deploy --environment staging         # Target environment for deployment (e.g., staging, production)
```
