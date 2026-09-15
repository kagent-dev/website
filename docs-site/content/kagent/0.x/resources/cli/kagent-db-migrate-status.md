---
title: kagent db migrate status
description: Show how many migrations are applied vs pending across all sources.
weight: 150
---

Show how many migrations are applied vs pending across all sources

```bash
kagent db migrate status [flags]
```

**Flags:**
- `-h, --help` - help for status
- `--output string` - Output format: "text" (default) or "json" (default "text")

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
