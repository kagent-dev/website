---
title: kmcp init python
description: Initialize a new Python MCP server project
weight: 130
---

Initialize a new MCP server project using the fastmcp-python framework.

This command will create a new directory with a basic fastmcp-python project structure,
including a pyproject.toml file, a main.py file, and an example tool.

```bash
kmcp init python [project-name] [flags]
```

**Flags:**
- `-h, --help` - help for python

**Global Flags:**
- `--author string` - Author name for the project
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode
- `-v, --verbose` - verbose output
