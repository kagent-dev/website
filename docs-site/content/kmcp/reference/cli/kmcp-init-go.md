---
title: kmcp init go
description: Initialize a new Go MCP server project
weight: 110
---

Initialize a new MCP server project using the mcp-go framework.

This command will create a new directory with a basic mcp-go project structure,
including a go.mod file, a main.go file, and an example tool.

You must provide a valid Go module name for the project.

```bash
kmcp init go [project-name] [flags]
```

**Flags:**
- `--go-module-name string` - The Go module name for the project (e.g., github.com/my-org/my-project)
- `-h, --help` - help for go

**Global Flags:**
- `--author string` - Author name for the project
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode
- `-v, --verbose` - verbose output
