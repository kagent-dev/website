---
title: kagent uninstall
description: kagent uninstall command
weight: 10
---

Uninstall kagent from a Kubernetes cluster.

```bash
kagent uninstall [flags]
```

**Global Flags:**
- `--kagent-url` - kagent URL (default: "http://localhost:8083")
- `--namespace, -n` - Namespace (default: "kagent")
- `--output-format, -o` - Output format (default: "table")
- `--timeout` - Timeout duration (default: 300s)
- `--verbose, -v` - Verbose output

## Example

Uninstall kagent:

```bash
kagent uninstall
```

