---
title: kmcp install
description: Install the KMCP controller on a Kubernetes cluster
weight: 150
---

Install the KMCP controller and its required Custom Resource Definitions (CRDs)
on a Kubernetes cluster.

This command should be run once per cluster to set up the necessary infrastructure
for deploying MCP servers.

It will install the following resources:
- MCPServer Custom Resource Definition
- ClusterRole and ClusterRoleBinding for RBAC
- The KMCP controller Deployment

```bash
kmcp install [flags]
```

**Flags:**
- `-h, --help` - help for install
- `--namespace string` - Namespace for the KMCP controller (defaults to kmcp-system) (default "kmcp-system")
- `--version string` - Version of the controller to deploy (defaults to latest)

**Global Flags:**
- `-v, --verbose` - verbose output
