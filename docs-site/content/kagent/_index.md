---
title: kagent
description: Explore concepts, guides, and reference docs for running declarative AI agents on Kubernetes, from install through day-two operations.
weight: 1
author: kagent.dev
disableCards: true
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

# kagent docs

{{< version-cards desc="Select a version of the kagent docs." >}}
