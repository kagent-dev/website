---
title: kmcp init java
description: Initialize a new Java MCP server project
weight: 120
---

Initialize a new MCP server project using the Java framework.

This command will create a new directory with a basic Java MCP project structure,
including a pom.xml file, Maven project structure, and an example tool.

```bash
kmcp init java [project-name] [flags]
```

**Flags:**
- `-h, --help` - help for java

**Global Flags:**
- `--author string` - Author name for the project
- `--description string` - Description for the project
- `--email string` - Author email for the project
- `--force` - Overwrite existing directory
- `--namespace string` - Default namespace for project resources (default "default")
- `--no-git` - Skip git initialization
- `--non-interactive` - Run in non-interactive mode
- `-v, --verbose` - verbose output
