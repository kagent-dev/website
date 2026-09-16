---
title: kagent db migrate version
description: Print the highest applied migration version.
weight: 170
---

Print the highest applied migration version.
For a single registered source the value is on one line; multi-source
binaries print one line per source. When multiple sources are
registered, --source filters to a single track.

```bash
kagent db migrate version [flags]
```

**Flags:**
- `-h, --help` - help for version

**Global Flags:**
- `--db-url string` - PostgreSQL connection URL (defaults to value of POSTGRES_DATABASE_URL env var)
- `--source string` - Migration source name for per-source ops (down/goto/force/version); inferred when only one source is registered. Not applicable to up or status — those aggregate across every registered source.
