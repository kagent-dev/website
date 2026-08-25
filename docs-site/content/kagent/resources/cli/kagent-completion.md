---
title: kagent completion
description: Generate the autocompletion script for the specified shell
weight: 40
---

Generate the autocompletion script for kagent for the specified shell.
See each sub-command's help for details on how to use the generated script.

```bash
kagent completion [command]
```

**Subcommands:**
- [`kagent completion bash`](/docs/kagent/resources/cli/kagent-completion-bash/) - Generate the autocompletion script for bash
- [`kagent completion fish`](/docs/kagent/resources/cli/kagent-completion-fish/) - Generate the autocompletion script for fish
- [`kagent completion powershell`](/docs/kagent/resources/cli/kagent-completion-powershell/) - Generate the autocompletion script for powershell
- [`kagent completion zsh`](/docs/kagent/resources/cli/kagent-completion-zsh/) - Generate the autocompletion script for zsh

**Flags:**
- `-h, --help` - help for completion

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
