---
title: kagent
description: Concepts, guides, and reference docs for running declarative AI agents on Kubernetes, from install through day-two operations.
weight: 1
author: kagent.dev
# PDF export. This one page opting into `book` is the whole opt-in: the format
# stitches this page plus its entire .Pages subtree into one print document, so
# the manual is scoped to this section by where the opt-in lives. kmcp is a
# separate section and carries its own, so the site publishes two manuals.
#
# LIST THE WHOLE SET, not just html and book. Hugo's `outputs` REPLACES a page's
# defaults rather than adding to them, so `["html", "book"]` would silently drop
# this page's .md, RSS and llms.txt. Nothing fails and only this page is
# affected, which is exactly why it would survive review. These four are
# `outputs.section` from hugo.yaml, copied, plus `book`.
#
# The book is not built by an ordinary build: docs-theme-extras gates it behind
# `HUGO_PARAMS_BUILDBOOK=true`, which only the PDF workflow in solo-io/docs sets.
outputs: ["html", "rss", "markdown", "llms", "book"]
---

Your complete guide to the AI agent platform for Kubernetes

## What is kagent?

kagent is an innovative AI agent platform designed specifically for Kubernetes environments. 
It empowers developers and operations teams to create intelligent, autonomous agents that can 
monitor, manage, and automate complex Kubernetes workloads using the power of large language models (LLMs).

kagent was created at [Solo.io](https://www.solo.io) in 2025 and is a [Cloud Native Computing Foundation](https://www.cncf.io) sandbox project.

## Key Features

- **AI-Powered Automation** - Create intelligent agents that understand natural language and can perform complex Kubernetes operations
- **Multi-Provider Support** - Works with OpenAI, Anthropic, Google Vertex AI, Azure OpenAI, Ollama, and custom models
- **Tool Integration** - Supports Model Context Protocol (MCP) tools, built-in Kubernetes tools, and custom HTTP tools
- **Agent-to-Agent Communication** - Enable sophisticated workflows through A2A (Agent-to-Agent) interactions
- **Comprehensive Observability** - Built-in tracing and monitoring to understand agent behavior and performance
- **Cloud Native** - Designed from the ground up to run natively in Kubernetes environments

## Why Choose kagent?

Whether you're looking to automate routine operations, implement intelligent monitoring, 
or create sophisticated multi-agent workflows, kagent provides the tools and framework 
to bring AI to your Kubernetes infrastructure. Start with simple automation and scale 
to complex, intelligent systems that can reason about your cluster's state and make 
informed decisions.

## Explore the Documentation

