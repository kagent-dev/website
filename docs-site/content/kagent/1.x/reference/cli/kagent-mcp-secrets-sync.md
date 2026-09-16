---
title: kagent mcp secrets sync
description: Sync secrets to a Kubernetes environment from a local .env file.
weight: 370
---

Sync secrets from a local .env file to a Kubernetes secret.

This command reads a .env file and the project's manifest.yaml file to determine
the correct secret name and namespace for the specified environment. It then
creates or updates the Kubernetes secret directly in the cluster.

The command will look for a ".env" file in the project root by default.

```bash
kagent mcp secrets sync [environment] [flags]
```

**Flags:**
- `--dry-run` - Output the generated secret YAML instead of applying it
- `--from-file string` - Source .env file to sync from (default ".env")
- `-h, --help` - help for sync
- `-d, --project-dir string` - Project directory (default: current directory)

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
# Sync secrets to the "staging" environment defined in manifest.yaml
kagent mcp secrets sync staging

# Sync secrets from a custom .env file
kagent mcp secrets sync staging --from-file .env.staging

# Sync secrets from a specific project directory
kagent mcp secrets sync staging --project-dir ./my-project

# Perform a dry run to see the generated secret without applying it
kagent mcp secrets sync production --dry-run
```
