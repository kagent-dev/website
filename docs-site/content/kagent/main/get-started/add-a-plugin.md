---
title: Add a plugin
description: Bundle skills into a plugin, publish it as an image, and attach it to an agent.
weight: 17
author: kagent.dev
---

A {{< gloss "Plugin" >}}plugin{{< /gloss >}} is a bundle of skills that you publish and attach as one unit. An agent attaches the plugin once, and lists the skills that it wants from it. Use a plugin to ship a set of skills together, or to share the same set across several agents.

In this tutorial, you turn the skill from [Add a skill]({{< link path="get-started/add-a-skill" >}}) into a plugin, publish it, and switch the agent to it. The kagent UI has no page for plugins, so you work from the command line.

## Before you begin

1. Complete [Add a skill]({{< link path="get-started/add-a-skill" >}}). This tutorial reuses its `release-notes` directory, its `Dockerfile`, and the `release-writer` agent.

2. Set the repository for the plugin image. Replace the example value with your own repository.
   ```bash
   export PLUGIN_REPO=ghcr.io/<your-org>/release-tools
   ```

## Build the plugin

A plugin is a directory with a `plugin.json` manifest at its root and one subdirectory per skill under `skills/`.

1. From the `release-notes` directory, move the skill under `skills/` in a new plugin directory.
   ```bash
   cd ..
   mkdir -p release-tools/skills
   mv release-notes release-tools/skills/release-notes
   cd release-tools
   ```

2. Add the manifest. Copy the `$schema` value exactly, because kagent rejects any other value. Of the other fields, kagent reads only `name`.
   ```bash
   cat > plugin.json <<'EOF'
   {
     "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
     "name": "release-tools"
   }
   EOF
   ```

## Publish the plugin

Build the plugin image the same way as a skill image, so that the plugin directory is the root of the image.

```bash
mv skills/release-notes/Dockerfile .
docker buildx build --push --platform linux/amd64 -t "$PLUGIN_REPO:1.0.0" .
export PLUGIN_OCI="$PLUGIN_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$PLUGIN_REPO:1.0.0")"
echo "$PLUGIN_OCI"
```

## Attach the plugin to the agent

1. Re-apply the AgentTemplate with `plugins` instead of `skills`, and list the skills to enable.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: release-writer
     namespace: kagent
   spec:
     modelConfig:
       name: default-model-config
     description: Writes release notes from commit subjects.
     systemPrompt: You help maintainers turn commit history into release notes.
     plugins:
       - source:
           oci: ${PLUGIN_OCI}
         skills:
           - release-notes
   EOF
   ```

   > [!IMPORTANT]
   > A plugin enables only the skills that you list. If you omit `skills`, or leave it empty, the agent gets none of them, and kagent accepts the empty list without an error.

2. In the kagent UI, click **Agents**, and wait until the `release-writer` agent returns to **Ready**.

3. Open the agent, start a **New chat**, and ask `What skills do you have?` The agent reports `release-notes`, the same as before. A chat that you started earlier keeps the version of the agent that it began with, so use a new one.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/plugins" >}}` title="Plugins" subtitle="Read what a plugin can contain, including MCP servers, and its limits." >}}
  {{< card link=`{{< link path="examples/skills" >}}` title="Skills example" subtitle="Read the long version, with troubleshooting." >}}
{{< /cards >}}
