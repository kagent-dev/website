---
title: kagent init
description: Initialize a new agent project
weight: 230
---

Initialize a new agent project using the specified framework and language.

You can customize the root agent instructions using the --instruction-file flag.
You can select a specific model using --model-provider and --model-name flags.
If no custom instruction file is provided, a default dice-rolling instruction will be used.
If no model is specified, the agent will need to be configured later.

```bash
kagent init [framework] [language] [agent-name] [flags]
```

**Flags:**
- `--description string` - Description for the agent
- `-h, --help` - help for init
- `--instruction-file string` - Path to file containing custom instructions for the root agent
- `--model-name string` - Model name (e.g., gpt-4, claude-3-5-sonnet, gemini-2.5-flash) (default "gemini-2.5-flash")
- `--model-provider string` - Model provider (OpenAI, Anthropic, Gemini) (default "Gemini")

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `-n, --namespace string` - Namespace (default "kagent")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output

## Example

```bash
kagent init adk python dice
kagent init adk python dice --instruction-file instructions.md
kagent init adk python dice --model-provider Gemini --model-name gemini-2.5-flash
```
