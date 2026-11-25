---
title: Add a skill
description: Package know-how as a skill, publish it as an image, and attach it to an agent.
weight: 16
author: kagent.dev
---

{{< tutorial-banner >}}

A {{< gloss "Skill" >}}skill{{< /gloss >}} packages know-how that an agent picks up at run time: a `SKILL.md` file of instructions, plus any scripts and reference files that the instructions use. A tool lets an agent call something. A skill tells it how to do a job.

In this tutorial, you build a skill that turns commit subjects into release notes, publish it as a container image, and attach it to an agent. The kagent UI has no page for skills, so you work from the command line, and then try the agent in the UI.

This tutorial is the short path. For how skills load, the tools that they add, and troubleshooting, see the [Skills example]({{< link path="examples/skills" >}}).

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).

2. Install [Docker](https://docs.docker.com/get-started/get-docker/) to build the skill image.

3. Choose a container registry that your cluster can reach over HTTPS, and set it as an environment variable. Replace the example value with your own repository.
   ```bash
   export SKILL_REPO=ghcr.io/<your-org>/release-notes
   ```

   A registry on `localhost` that only your machine can reach does not work, because Agent Substrate pulls the image from inside the cluster.

## Write the skill

1. Create the skill directory.
   ```bash
   mkdir -p release-notes/scripts
   cd release-notes
   ```

2. Write `SKILL.md`. The front matter needs a `name` and a `description`. The model reads the description to decide when to use the skill, so say plainly when it applies.
   ```bash
   cat > SKILL.md <<'EOF'
   ---
   name: release-notes
   description: Group a list of conventional commit subjects into release notes with Added, Fixed, and Changed sections. Use this skill whenever the user supplies raw commit subjects and wants them turned into release notes.
   ---
   # Release notes

   Turn raw commit subjects into release notes grouped by change type.

   ## Instructions

   1. Ask the user for the commit subjects if they have not supplied them. One subject per line.
   2. Write the subjects to `commits.txt` in your working directory with the `write_file` tool.
   3. Run `bash /skills/release-notes/scripts/group.sh commits.txt` with the `bash` tool.
   4. Return the script's output unchanged. Do not re-order or re-word the entries.
   EOF
   ```

3. Add the script that the instructions call. The script runs in the agent's runtime image, which has `bash` and does not have Python.
   ```bash
   cat > scripts/group.sh <<'EOF'
   #!/usr/bin/env bash
   # Group conventional commit subjects into release note sections.
   set -euo pipefail

   input="${1:?usage: group.sh <file>}"
   added="^feat(\([^)]*\))?!?:"
   fixed="^fix(\([^)]*\))?!?:"

   section() {
     local heading="$1" body="$2"
     [ -n "$body" ] || return 0
     printf '### %s\n%s\n\n' "$heading" "$body"
   }

   strip() {
     sed -E 's/^[a-z]+(\([^)]*\))?!?: *//; s/^/- /'
   }

   section Added   "$(grep -E  "$added" "$input" | strip || true)"
   section Fixed   "$(grep -E  "$fixed" "$input" | strip || true)"
   section Changed "$(grep -Ev "$added|$fixed" "$input" | strip || true)"
   EOF
   chmod +x scripts/group.sh
   ```

4. Check that the script works before you publish it.
   ```bash
   printf 'feat: add checkpoint API\nfix: correct revision digest\ndocs: update install guide\n' > /tmp/commits.txt
   bash scripts/group.sh /tmp/commits.txt
   ```

   Example output:
   ```console
   ### Added
   - add checkpoint API

   ### Fixed
   - correct revision digest

   ### Changed
   - update install guide
   ```

## Publish the skill

kagent takes a skill as a container image whose root is the skill directory.

1. Create the Dockerfile.
   ```bash
   cat > Dockerfile <<'EOF'
   FROM scratch
   COPY . /
   EOF
   ```

2. Build and push the image, for the architecture that your worker nodes run.
   ```bash
   docker buildx build --push --platform linux/amd64 -t "$SKILL_REPO:1.0.0" .
   ```

3. Save the reference with its digest. kagent accepts only a reference that is pinned to a digest, not a tag.
   ```bash
   export SKILL_OCI="$SKILL_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$SKILL_REPO:1.0.0")"
   echo "$SKILL_OCI"
   ```

## Attach the skill to an agent

1. Create an AgentTemplate that lists the skill, and an Agent that runs it on the `kagent-default` harness.
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
     skills:
       - name: release-notes
         source:
           oci: ${SKILL_OCI}
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: release-writer
     namespace: kagent
   spec:
     template:
       ref:
         name: release-writer
     harnessRef:
       name: kagent-default
   EOF
   ```

2. Open the kagent UI with `kagent dashboard`, and click **Agents**. Wait until the `release-writer` agent is **Ready**.

   A ready agent means that kagent accepted the reference, not that the image exists. A wrong digest shows up only when the agent starts a chat.

## Try the skill

1. Click the agent name, `release-writer`, to open its chat page.

2. Send a request that the skill covers.
   ```text
   Turn these commits into release notes:
   feat: add checkpoint API
   fix: correct revision digest
   docs: update install guide
   ```

The agent loads the skill, runs its script, and returns the grouped notes. The conversation shows the `load_skill` and `bash` tool calls.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/add-a-plugin" >}}` title="Add a plugin" subtitle="Ship several skills together as one plugin." >}}
  {{< card link=`{{< link path="examples/skills" >}}` title="Skills example" subtitle="Read how skills load, how to publish a new version, and how to troubleshoot." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Read the fields and the naming rules." >}}
{{< /cards >}}
