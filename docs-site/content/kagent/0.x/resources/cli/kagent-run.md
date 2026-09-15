---
title: kagent run
description: Run agent project locally with docker-compose and launch chat interface.
weight: 390
---

Run an agent project locally using docker-compose and launch an interactive chat session.

```bash
kagent run [project-directory] [flags]
```

**Flags:**
- `--build` - Rebuild the Docker image before running
- `-h, --help` - help for run
- `--project-dir string` - Project directory (default: current directory)

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-url string` - KAgent URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output

## Example

```bash
kagent run ./my-agent
kagent run .
```
