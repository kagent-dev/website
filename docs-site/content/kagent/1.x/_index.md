---
title: kagent 1.0 (preview)
linkTitle: "kagent 1.x (preview)"
description: Preview the kagent 1.0 documentation, built on Agent Substrate.
weight: 10
author: kagent.dev
# The 1.x docset is withheld from the published site until the 1.0 release is
# announced. `draft` keeps this section page out of a production `hugo` build and
# the cascade applies it to every descendant, so no 1.x page, list page, or
# llms.txt entry is generated. Authoring is unaffected: `make serve-docs` passes
# -D, so the section renders locally exactly as it will on release.
#
# To publish: delete both keys here, and restore the "1.x" entry in
# params.sections.kagent.versions in hugo.yaml, which is what puts the version
# back in the switcher.
draft: true
cascade:
  draft: true
---

kagent 1.0 moves the runtime from Kubernetes Deployments to [Agent Substrate](https://github.com/agent-substrate/substrate), introducing Harness, AgentTemplate, and AgentInstance as the new API surface. For a summary of what changed in 1.0, see [Release notes]({{< link path="reference/release-notes/1.0#100" >}}).

This section is under active development ahead of the 1.0 release. Pages here may be incomplete, and content may change without notice. For the current stable release, see the [0.x docs]({{< relref "/kagent/0.x" >}}).
