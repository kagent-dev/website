---
title: kmcp build
description: Build MCP server as a Docker image
weight: 20
---

Build an MCP server from the current project.
	
This command will detect the project type and build the appropriate
MCP server Docker image.

```bash
kmcp build [flags]
```

**Flags:**
- `-h, --help` - help for build
- `--kind-load` - Load image into kind cluster (requires kind)
- `--kind-load-cluster string` - Name of the kind cluster to load image into (default: current cluster)
- `--platform string` - Target platform (e.g., linux/amd64,linux/arm64)
- `-d, --project-dir string` - Build directory (default: current directory)
- `--push` - Push Docker image to registry
- `-t, --tag string` - Docker image tag (alias for --output)

**Global Flags:**
- `-v, --verbose` - verbose output

## Example

```bash
kmcp build                              # Build Docker image from current directory
kmcp build --project-dir ./my-project   # Build Docker image from specific directory
```
