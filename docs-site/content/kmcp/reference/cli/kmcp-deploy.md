---
title: kmcp deploy
description: Deploy MCP server to Kubernetes
weight: 80
---

Deploy an MCP server to Kubernetes by generating MCPServer CRDs.

This command generates MCPServer Custom Resource Definitions (CRDs) based on:
- Project configuration from kmcp.yaml
- Docker image built with 'kmcp build --docker'
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
kmcp deploy [flags]
```

**Subcommands:**
- [`kmcp deploy package`](/docs/kmcp/reference/cli/kmcp-deploy-package/) - Deploy an MCP server using a package manager (npx, uvx)

**Flags:**
- `--args strings` - Command arguments
- `--command string` - Command to run (overrides project config)
- `--dry-run` - Generate manifest without applying to cluster
- `--env strings` - Environment variables (KEY=VALUE)
- `--environment string` - Target environment for deployment (e.g., staging, production) (default "staging")
- `-f, --file string` - Path to kmcp.yaml file (default: current directory)
- `--force` - Force deployment even if validation fails
- `-h, --help` - help for deploy
- `--image string` - Docker image to deploy (overrides build image)
- `-n, --namespace string` - Kubernetes namespace (default "default")
- `--no-inspector` - Do not start the MCP inspector after deployment
- `-o, --output string` - Output file for the generated YAML
- `--port int` - Container port (default: from project config)
- `--transport string` - Transport type (stdio, http)

**Global Flags:**
- `-v, --verbose` - verbose output

## Example

```bash
kmcp deploy                          # Deploy with project name to cluster
kmcp deploy my-server                # Deploy with custom name
kmcp deploy --namespace staging      # Deploy to staging namespace
kmcp deploy --dry-run                # Generate manifest without applying to cluster
kmcp deploy --image custom:tag       # Use custom image
kmcp deploy --transport http         # Use HTTP transport
kmcp deploy --output deploy.yaml     # Save to file
kmcp deploy --file /path/to/kmcp.yaml # Use custom kmcp.yaml file
kmcp deploy --environment staging    # Target environment for deployment (e.g., staging, production)
```
