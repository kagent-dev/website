---
title: kagent invoke
description: Invoke a kagent agent.
weight: 250
---

Invoke a kagent agent

```bash
kagent invoke [flags]
```

**Flags:**
- `-a, --agent string` - Agent
- `-f, --file string` - File to read the task from
- `-h, --help` - help for invoke
- `-s, --session string` - Session
- `-S, --stream` - Stream the response
- `-t, --task string` - Task
- `--token string` - Bearer token to include in A2A requests (for API key passthrough)

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output

## Example

```bash
kagent invoke --agent "k8s-agent" --task "Get all the pods in the kagent namespace"
```
