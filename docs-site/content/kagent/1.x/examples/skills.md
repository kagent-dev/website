---
title: Add a skill to an agent
description: Package instructions and a script as a skill, publish it as an OCI image, and attach it to an AgentTemplate.
weight: 40
author: kagent.dev
---

A {{< gloss "Skill" >}}skill{{< /gloss >}} packages know-how that an agent picks up at run time: a `SKILL.md` file of instructions, together with the scripts and reference files those instructions depend on. This example builds a skill that turns raw commit subjects into release notes, publishes it as an OCI image, and attaches it to an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}.

For the fields that attach a skill and the rules that govern their names, see [Skills]({{< link path="skills-and-mcp/skills" >}}). For the format of a multi-skill package, see [Plugins]({{< link path="skills-and-mcp/plugins" >}}).

## About skills at run time

kagent does not fetch a skill when you apply an AgentTemplate. The compiled revision records where each skill comes from, and the {{< gloss "Actor" >}}Actor{{< /gloss >}} fetches it when the agent starts. Every artifact is unpacked under `/plugins`, whether it holds one skill or a package of them, and each enabled skill is then copied to `/skills/<skill-name>`. The agent reads skills only from `/skills`.

Because kagent fetches a skill this late, review the following considerations.

* **A wrong source still compiles.** kagent validates skill names before it accepts an AgentTemplate, but it never checks that the artifact exists or that it holds a `SKILL.md` file. A bad digest produces a revision that reports `Ready`, and the agent then fails to start.
* **Scripts run in the runtime image.** A skill's scripts get whatever the Harness image provides. The kagent runtime image is Alpine Linux with `bash`, `git`, and the standard Alpine utilities, and it does **not** include Python.

### Skill tools

On a `kagent` Harness, attaching a skill adds seven tools to the agent, whether or not the skill ships a script. The first three read skills, and the rest let the agent act on their files. The `claude` and `codex` Harness runtimes take the same skills and expose them through their own coding agent's tools instead.

| Tool | What it does |
| ---- | ------------ |
| `list_skills` | Lists the attached skills with their names and descriptions. |
| `load_skill` | Reads a skill's full `SKILL.md` instructions. |
| `load_skill_resource` | Reads one file inside a skill directory, such as a reference document. |
| `read_file` | Reads a file from the skills directory or the session directory. |
| `write_file` | Writes a file to the session directory. |
| `edit_file` | Replaces an exact string in a file that the agent has already read. |
| `bash` | Runs a shell command in the session directory `/tmp/kagent/<session-id>/`. Commands time out after 30 seconds. |

Attaching a skill also changes what the agent is told. The runtime appends the name and description of every attached skill to the model request, along with an instruction to call `load_skill` before acting on one, so a skill reaches the model even before any tool is called.

> [!IMPORTANT]
> The `bash` tool gives the agent shell access inside its own Actor sandbox, and the sandbox is the boundary that contains it. Review a skill before you attach it, and treat the [egress]({{< link path="substrate-runtime/sandboxing" >}}) that the Actor is granted as the reach that the skill has. Writes are confined to the session directory, so a skill cannot modify `/skills` or another skill's files.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have a Harness and an AgentTemplate to attach a skill to.

3. Install [Docker](https://docs.docker.com/get-started/get-docker/) to build the skill image.

4. Choose a container registry that your cluster can reach over HTTPS, and set it as an environment variable. Replace the example value with your own repository.
   ```bash
   export SKILL_REPO=ghcr.io/<your-org>/release-notes
   ```

   > [!WARNING]
   > kagent pulls a skill image over HTTPS with certificate verification, and v1alpha3 has no option to disable it. kagent 0.x accepted an `insecureSkipVerify` flag for a local registry, but that field does not exist in 1.x. A plain HTTP registry, and a `localhost` registry that only the host can reach, both fail at agent startup.

## Build the skill

A skill is a directory whose root holds a `SKILL.md` file. Everything else in the directory is available to the agent through the skill tools.

1. Create the skill directory.
   ```bash
   mkdir -p release-notes/scripts
   cd release-notes
   ```

2. Write `SKILL.md`. The YAML front matter must carry a `name` and a `description`, and the body holds the instructions the agent follows.
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

   ## Notes

   - The script reads conventional commit prefixes: `feat:` becomes Added, `fix:` becomes Fixed, and everything else becomes Changed.
   - A section with no entries is omitted.
   EOF
   ```

   The `description` decides whether the skill is ever used. The agent sees every attached skill's name and description, and chooses among them the same way it chooses any other tool, so state plainly when the skill applies. The instructions in the body are only read after the agent calls `load_skill`.

3. Add the script that the instructions call. The script runs in the agent's runtime image, so it uses `bash` rather than Python.
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

4. Confirm that the script works before you publish it. The `bash` tool returns a failed command's error to the model rather than to you, so a broken script produces an unreliable answer rather than a failed resource.
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

## Publish the skill as an OCI image

kagent pulls an `oci` source as a container image and unpacks its flattened filesystem, so the image holds the skill directory and nothing else. Build it from `scratch`, which produces an image whose root **is** the skill root.

1. Create the Dockerfile.
   ```bash
   cat > Dockerfile <<'EOF'
   FROM scratch
   COPY . /
   EOF
   ```

2. Build and push the image. Build for the architecture that your worker nodes run, because kagent pulls the `linux/amd64` or `linux/arm64` manifest that matches the node.
   ```bash
   docker buildx build --push --platform linux/amd64 -t "$SKILL_REPO:1.0.0" .
   ```

3. Read the image digest and save the pinned reference. An `oci` source must be pinned to a digest, and a tag alone is rejected.
   ```bash
   export SKILL_OCI="$SKILL_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$SKILL_REPO:1.0.0")"
   echo "$SKILL_OCI"
   ```

   Example output:
   ```console
   ghcr.io/example-org/release-notes@sha256:3091b917d23de93c40e38a574aea1e5615989ca4d7b38f79431c87e04adfa58a
   ```

## Attach the skill to an AgentTemplate

1. Add a `skills` entry to the AgentTemplate that your Harness admits. Keep the labels and the model configuration that your existing template uses, and change only the name and the skill.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: release-writer
     namespace: kagent
     labels:
       kagent.dev/harness: my-first-harness
   spec:
     modelConfig:
       name: default-model-config
     description: Writes release notes from commit subjects.
     systemPrompt: You help maintainers turn commit history into release notes.
     skills:
       - name: release-notes
         source:
           oci: ${SKILL_OCI}
   EOF
   ```

   Two fields carry the skill, and each is checked at a different time.

   | Field | Description |
   | ----- | ----------- |
   | `skills[].name` | The directory the skill is mounted under, and the name the agent sees. It must match no other skill on the template. |
   | `skills[].source.oci` | The digest-pinned image reference, in the form `<repository>@sha256:<digest>`. |

2. Confirm that the template compiled. The revision is ready when `desiredRevision` and `latestSuccessfulRevision` hold the same value.
   ```bash
   kubectl get agenttemplate release-writer -n kagent \
     -o jsonpath='{range .status.harnesses[*]}{.harness}{"\t"}{.desiredRevision}{"\t"}{.latestSuccessfulRevision}{"\n"}{end}'
   ```

   > [!NOTE]
   > A ready revision means that kagent accepted the reference, not that the image exists. kagent fetches the skill when the agent starts, so a wrong digest surfaces in the next step rather than this one.

3. Create an AgentInstance. An AgentInstance pins the revision that it was created on, so an instance that already exists does not pick up the skill.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template release-writer
   ```

4. Save the AgentInstance's ID to an environment variable.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "release-writer")] | sort_by(.createdAt) | last | .id')
   echo $INSTANCE_ID
   ```

## Ask the agent to use the skill

1. Send the agent a request that matches the skill's description.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "Turn these commit subjects into release notes. feat: add checkpoint API. fix: correct revision digest. docs: update install guide."
   ```

2. Read the reply. The agent calls `load_skill` to read the instructions, `write_file` to stage the commit subjects, and `bash` to run the script, then returns the script's output.

   Example output:
   ```console
   ### Added
   - add checkpoint API

   ### Fixed
   - correct revision digest

   ### Changed
   - update install guide
   ```

3. Ask the agent what skills it holds, to confirm the attachment from the agent's own side.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "What skills do you have?"
   ```

## Publish a new version of the skill

A source is immutable, so changing a skill is a two-step change: publish new content, then point the AgentTemplate at it.

1. Edit the skill.

2. Build and push the skill under a new tag and read the new digest.
   ```bash
   docker buildx build --push --platform linux/amd64 -t "$SKILL_REPO:1.1.0" .
   export SKILL_OCI="$SKILL_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$SKILL_REPO:1.1.0")"
   ```

3. Update `skills[].source.oci` on the AgentTemplate with the new digest, which compiles a new revision.

4. Create a new AgentInstance. Agents that are already running keep the skill content they started with, because their revision is pinned.

## Bundle the skill in a plugin package

A standalone source carries one skill. A {{< gloss "Plugin package" >}}plugin package{{< /gloss >}} carries several skills, and an AgentTemplate attaches the package once and names the skills it wants. Use a package when you ship a set of skills together, or when you want the same artifact to contribute [MCP servers]({{< link path="skills-and-mcp/plugins" >}}) as well.

1. Restructure the directory so that each skill sits under `skills/`, and add the manifest that makes it a package.
   ```bash
   cd ..
   mkdir -p release-tools/skills
   mv release-notes release-tools/skills/release-notes
   cd release-tools
   cat > plugin.json <<'EOF'
   {
     "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
     "name": "release-tools"
   }
   EOF
   ```

   > [!NOTE]
   > kagent compares the `$schema` value literally and rejects anything else, so copy it exactly. Of the remaining manifest fields, kagent reads only `name`.

2. Build and push the package, and read its digest. A package image is built the same way as a single skill, from `scratch`, so that the package root is the image root.
   ```bash
   export PLUGIN_REPO=ghcr.io/<your-org>/release-tools
   mv skills/release-notes/Dockerfile .
   docker buildx build --push --platform linux/amd64 -t "$PLUGIN_REPO:1.0.0" .
   export PLUGIN_OCI="$PLUGIN_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$PLUGIN_REPO:1.0.0")"
   ```

3. Attach the package with `plugins` instead of `skills`, and list the skills to enable.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: release-writer
     namespace: kagent
     labels:
       kagent.dev/harness: my-first-harness
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
   > A package enables only the skills that you list. If you omit `plugins[].skills`, or leave it empty, the agent gets none of them, and kagent accepts that rather than reporting an error. For why an explicit list is the safer default, see [Skills]({{< link path="skills-and-mcp/skills" >}}).

4. Create an AgentInstance on the new revision, and confirm that the agent still has the skill. The instance from the previous section is pinned to the revision that carried the standalone skill.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template release-writer
   export PLUGIN_INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "release-writer")] | sort_by(.createdAt) | last | .id')
   kagent invoke --agent-instance $PLUGIN_INSTANCE_ID --task "What skills do you have?"
   ```

   The agent reports `release-notes` exactly as before. A skill behaves the same whether it arrives on its own or inside a package, because kagent copies both into `/skills` before the agent starts.

## Troubleshoot a skill that does not load

A skill that kagent cannot fetch stops the agent from starting at all, rather than producing an agent without that skill. The runtime logs the failure and exits, and the AgentTemplate never becomes ready.

1. Check the AgentTemplate's `Ready` condition. A skill that cannot be fetched leaves it waiting, because the Actor that builds the template's golden snapshot is the Actor that fetches the skill.
   ```bash
   kubectl get agenttemplate <template-name> -n kagent \
     -o jsonpath='{range .status.harnesses[0].conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   False ActorTemplatePending waiting for the ActorTemplate golden snapshot
   ```

   > [!NOTE]
   > This condition does not name the skill, and reports the same reason for any Actor that has not yet produced a snapshot. An agent that is merely still starting looks identical to one whose skill cannot be fetched.

2. Find the WorkerPool that the Harness runs on, and read its Workers' logs. The Actor writes the failure there rather than to the AgentTemplate.
   ```bash
   export WORKER_POOL=$(kubectl get harness my-first-harness -n kagent \
     -o jsonpath='{.spec.substrate.workerPoolRef.name}')
   kubectl logs -n kagent -l ate.dev/worker-pool=$WORKER_POOL --tail=200 \
     | grep -i "materialize"
   ```

   Example output:
   ```console
   {"error":"materialize agent plugins: materialize skill \"release-notes\": pull ghcr.io/example-org/release-notes@sha256:3091b91...: Get \"https://ghcr.io/v2/\": EOF","labels":{"ate.atespace":"ate-golden","ate.template.name":"release-writer-my-first-harness-23c20dcb296d"},"level":"ERROR","msg":"failed to materialize Agent Plugins"}
   ```

   A pool runs the Workers for every agent on it, so filter by the `ate.template.name` label to find one agent. Its value is the AgentTemplate name, the Harness name, and the revision's short form, joined by hyphens.

3. Match the message to its cause.

   | Message | Cause |
   | ------- | ----- |
   | `pull <image>: ... 401 Unauthorized` | The registry needs credentials that the cluster does not have. |
   | `pull <image>: ... x509` or a TLS error | The registry does not serve HTTPS with a certificate the runtime trusts. |
   | `SKILL.md is required` | The artifact was fetched, but no `SKILL.md` file sits at the root that `source.path` selects. |
   | `symlink "..." escapes artifact root` | A symlink in the artifact points outside it. |
   | `artifact contains more than 10000 filesystem entries`, or `artifact exceeds 104857600 bytes` | The artifact is over one of the package limits. |

> [!TIP]
> Build the skill image with `--platform` set to the architecture of your worker nodes. kagent asks the registry for the `linux/amd64` or `linux/arm64` manifest that matches the node it runs on, so an image published for one architecture alone fails on the other.

## Clean up

1. Delete the AgentInstances that you created. Deleting the AgentTemplate does not remove them. Skip the second command if you did not complete the plugin package section.
   ```bash
   kagent delete agent-instance $INSTANCE_ID
   kagent delete agent-instance $PLUGIN_INSTANCE_ID
   ```

2. Delete the AgentTemplate.
   ```bash
   kubectl delete agenttemplate release-writer -n kagent
   ```

3. Remove the skill directory from your machine. The directory is `release-notes`, or `release-tools` if you completed the plugin package section.
   ```bash
   cd ..
   rm -rf release-notes release-tools
   ```

4. Delete the images that you pushed, `$SKILL_REPO` and `$PLUGIN_REPO`, using your registry's own tooling.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/plugins" >}}` title="Plugins" subtitle="Bundle several skills, and MCP servers, into one package that an AgentTemplate attaches at once." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Read the full set of skill fields, source kinds, and naming rules." >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Give the same agent a tool from an MCP server alongside its skills." >}}
{{< /cards >}}
