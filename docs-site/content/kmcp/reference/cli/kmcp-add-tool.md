---
title: kmcp add-tool
description: Add a new MCP tool to your project
weight: 10
---

Generate a new MCP tool that will be automatically loaded by the server.

This command creates a new tool file in src/tools/ with a generic template.
The tool will be automatically discovered and loaded when the server starts.

Each tool is a Python file containing a function decorated with @mcp.tool().
The function should use the @mcp.tool() decorator from FastMCP.

```bash
kmcp add-tool [tool-name] [flags]
```

**Flags:**
- `-d, --description string` - Tool description
- `-f, --force` - Overwrite existing tool file
- `-h, --help` - help for add-tool
- `-i, --interactive` - Interactive tool creation
- `--project-dir string` - Project directory (default: current directory)

**Global Flags:**
- `-v, --verbose` - verbose output

## Example

```bash
kmcp add-tool weather
kmcp add-tool database --description "Database operations tool"
kmcp add-tool weather --force
```
