---
title: kagent sandbox create
description: Create a sandbox from a prepared template.
weight: 430
---

Create a sandbox. Retain --request-id and all inputs for retries; each call makes one lifecycle attempt. Activity does not extend the TTL.

```bash
kagent sandbox create TEMPLATE --request-id ID [flags]
```

**Flags:**
- `-h, --help` - help for create
- `--name string` - Display name
- `--request-id string` - Stable idempotency key; reuse with identical inputs for retries
- `--ttl duration` - Lifetime (omission uses operator policy)

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
