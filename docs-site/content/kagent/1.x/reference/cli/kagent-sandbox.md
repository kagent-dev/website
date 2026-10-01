---
title: kagent sandbox
description: Run commands and transfer files in standalone sandboxes.
weight: 420
---

Run commands and transfer files in standalone sandboxes

```bash
kagent sandbox [command]
```

**Subcommands:**
- [`kagent sandbox create`]({{< link path="reference/cli/kagent-sandbox-create" >}}) - Create a sandbox from a prepared template
- [`kagent sandbox delete`]({{< link path="reference/cli/kagent-sandbox-delete" >}}) - delete a sandbox
- [`kagent sandbox download`]({{< link path="reference/cli/kagent-sandbox-download" >}}) - Download a file, replacing the local destination only after success
- [`kagent sandbox exec`]({{< link path="reference/cli/kagent-sandbox-exec" >}}) - Start a command once and wait for its result
- [`kagent sandbox get`]({{< link path="reference/cli/kagent-sandbox-get" >}}) - get a sandbox
- [`kagent sandbox kill`]({{< link path="reference/cli/kagent-sandbox-kill" >}}) - Terminate a process and its children
- [`kagent sandbox list`]({{< link path="reference/cli/kagent-sandbox-list" >}}) - List your sandboxes
- [`kagent sandbox process`]({{< link path="reference/cli/kagent-sandbox-process" >}}) - Inspect process status without waiting
- [`kagent sandbox resume`]({{< link path="reference/cli/kagent-sandbox-resume" >}}) - resume a sandbox
- [`kagent sandbox suspend`]({{< link path="reference/cli/kagent-sandbox-suspend" >}}) - suspend a sandbox
- [`kagent sandbox templates`]({{< link path="reference/cli/kagent-sandbox-templates" >}}) - List SandboxTemplates in the selected namespace
- [`kagent sandbox upload`]({{< link path="reference/cli/kagent-sandbox-upload" >}}) - Stream a local file into a sandbox (replaces the remote file)
- [`kagent sandbox wait`]({{< link path="reference/cli/kagent-sandbox-wait" >}}) - Collect output and wait for an existing process without restarting it

**Flags:**
- `-h, --help` - help for sandbox

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
