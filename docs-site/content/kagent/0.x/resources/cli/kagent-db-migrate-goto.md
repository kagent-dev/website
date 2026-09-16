---
title: kagent db migrate goto
description: Move the selected source's schema to version V.
weight: 140
---

Move the selected source's schema to version V (forward or backward).
V=0 is the special "empty schema" target: every applied migration in
the source is rolled back.

Refuses to run while the source's tracking table is dirty; clear it
with 'force' first.

```bash
kagent db migrate goto V [flags]
```

**Flags:**
- `-h, --help` - help for goto

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
