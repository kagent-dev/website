---
title: Add a skill to an agent
description: Package instructions and a script as a skill, publish it as an OCI image, and attach it to an AgentTemplate.
weight: 40
author: kagent.dev
---

A {{< gloss "Skill" >}}skill{{< /gloss >}} packages know-how that an agent picks up at run time. A skill consists of a `SKILL.md` file of instructions, together with the scripts and reference files that those instructions depend on. This example builds a skill that turns raw commit subjects into release notes, publishes it as an Open Container Initiative (OCI) image, and attaches it to an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}.

For the fields that attach a skill and the rules that govern their names, see [Skills]({{< link path="skills-and-mcp/skills" >}}). For the format of a plugin, see [Plugins]({{< link path="skills-and-mcp/plugins" >}}).

## About skills at run time

kagent does not fetch a skill when you apply an AgentTemplate. The compiled revision records the source of each skill, and the skill arrives when the agent starts. For an `oci` source, Agent Substrate pulls the image from the Worker and mounts it as read-only into the {{< gloss "Actor" >}}Actor{{< /gloss >}} before the runtime starts. For a `git` or `bucket` source, the Actor fetches the files itself. The runtime then copies each enabled skill into the directory that its Harness reads, which is `/skills/<skill-name>` on a `kagent` Harness.

Because kagent fetches a skill this late, review the following considerations.

* **A wrong source still compiles.** kagent validates skill names before it accepts an AgentTemplate, but it never checks that the artifact exists or that it contains a `SKILL.md` file. A bad digest produces a revision that reports `Ready`, and the agent then fails to start.
* **A private registry needs Worker credentials.** Agent Substrate pulls an `oci` source with the registry credentials that the Worker uses for workload images. Kubernetes `imagePullSecrets` on a pod do not configure that pull.
* **Each Actor mounts up to 29 distinct skill images.** Images shared by several skills or plugins count once. A revision that needs more fails when kagent builds its ActorTemplate.
* **Scripts run in the runtime image.** A skill's scripts get whatever the Harness image provides. The kagent runtime image is Alpine Linux with `bash`, `git`, and the standard Alpine utilities, and it does **not** include Python.

### Skill tools and built-in tools

On a `kagent` Harness, every agent has kagent's built-in tools, even without a skill. A skill runs its scripts with the built-in `bash` tool. Attaching a skill also adds the skill tools, which read skills. The `claude` and `codex` Harness runtimes also take skills. They expose the skills through their own coding agent's tools.

| Tool | Availability | What it does |
| ---- | ------------ | ------------ |
| `list_skills` | With a skill | Lists the attached skills with their names and descriptions. |
| `load_skill` | With a skill | Reads a skill's full `SKILL.md` instructions. |
| `load_skill_resource` | With a skill | Reads one file inside a skill directory, such as a reference document. |
| `read_file` | Built-in | Reads a file, with line numbers. |
| `write_file` | Built-in | Writes a file, and creates its parent directories. |
| `edit_file` | Built-in | Replaces an exact string in a file. The edit fails when the string occurs more than once, unless the agent asks to replace every occurrence. |
| `list_files` | Built-in | Lists the contents of a directory. |
| `grep_file` | Built-in | Searches a file, or a directory recursively, for a regular expression. |
| `bash` | Built-in | Runs a command in a new shell. A command stops after 60 seconds by default. The agent can raise that limit to 600 seconds for one call. The tool combines standard output and standard error, and truncates the result at 64 KiB. When the call returns, the tool stops every process that the command started. |

The built-in tools accept an absolute path or a path relative to the workspace, `/data/workspace`. The root agent and its subagents share the workspace. The workspace starts empty, and its files survive when the Actor is [suspended and resumed]({{< link path="about/substrate-runtime/suspend-and-resume#what-a-snapshot-captures" >}}). A command that is still running does not survive.

A Harness does not have a per-agent setting for the built-in tools. The `config.runtimeDefaults.builtinTools` Helm values change the built-in tools for every agent in the installation.

```yaml
config:
  runtimeDefaults:
    builtinTools:
      disableFileSearch: true
      disableBash: true
```

| Value | Description |
| ----- | ----------- |
| `disableFileSearch` | Set to `true` to remove `list_files` and `grep_file` from the root agent and from every subagent. Defaults to `false`. This value replaces `skillTools.fileSearchTools` from earlier releases, with the opposite meaning. |
| `disableBash` | Set to `true` to remove the `bash` tool from the root agent and from every subagent. The agent keeps the file tools, and still loads skills. Defaults to `false`. |
| `bashVenvPath` | The path to a Python virtual environment in the Harness image. The `bash` tool adds the environment's `bin` directory to the start of `PATH`, and sets `VIRTUAL_ENV`. The kagent runtime image does not include Python. To use this value, build a Harness image that includes the environment. Defaults to empty. |

The `builtinTools` Helm values also include `disableAskUser`, which removes the question tool. For more information, see [Disable questions]({{< link path="agents/human-in-the-loop#disable-questions" >}}).

Attaching a skill also changes the model request. The runtime appends the name and description of every attached skill to the model request, along with an instruction to call `load_skill` before the agent acts on a skill. The model therefore sees each skill before the agent calls any tool.

> [!IMPORTANT]
> The `bash` tool gives the agent shell access inside its own Actor sandbox, and the sandbox is the boundary that contains the agent. The file tools are not limited to the workspace. They read and write anywhere in the sandbox, including `/skills`, so one skill's instructions can change another skill's files. Review a skill before you attach it, and treat the [egress]({{< link path="about/substrate-runtime/sandboxing" >}}) that you grant the Actor as the reach that the skill has.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have a Harness and an AgentTemplate to attach a skill to.

3. Install [Docker](https://docs.docker.com/get-started/get-docker/) to build the skill image.

4. Choose a container registry that your cluster can reach over HTTPS, and set it as an environment variable. Replace the example value with your own repository.
   ```bash
   export SKILL_REPO=ghcr.io/<your-org>/release-notes
   ```

   > [!WARNING]
   > Agent Substrate pulls a skill image on the Worker. API version v1alpha3 does not have an option to skip certificate verification. kagent 0.x accepted an `insecureSkipVerify` flag for a local registry, but that field does not exist in 1.x. A `localhost` registry that only the host can reach fails at agent startup.

## Build the skill

A skill is a directory whose root holds a `SKILL.md` file. Everything else in the directory is available to the agent through the skill tools.

1. Create the skill directory.
   ```bash
   mkdir -p release-notes/scripts
   cd release-notes
   ```

2. Write `SKILL.md`. The YAML front matter must include a `name` and a `description`. The body contains the instructions that the agent follows.
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

   The model reads the `description` to decide whether to load the skill, in the same way that it chooses any other tool. In the `description`, state plainly when the skill applies. The agent reads the instructions in the body only after it calls `load_skill`.

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

4. Before you publish the script, confirm that it works. The `bash` tool returns a failed command's error to the model, not to you. A broken script therefore produces an unreliable answer, not a failed resource.
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

Agent Substrate mounts an `oci` source as a container image. The image must contain the skill directory and nothing else. Build it from `scratch`, which produces an image whose root **is** the skill root.

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

To give an agent the skill, reference the skill image from the AgentTemplate that the agent runs, and start a Session on the revision that kagent compiles.

1. Add a `skills` entry to an AgentTemplate, and pair it with your Harness through an Agent. Keep the model configuration that your existing template uses, and change only the name and the skill.
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
       name: my-first-harness
   EOF
   ```

   Two fields define the skill, and each is checked at a different time.

   | Field | Description |
   | ----- | ----------- |
   | `skills[].name` | The directory that the skill is mounted under, and the name that the agent sees. The name must not match any other skill name on the template. |
   | `skills[].source.oci` | The digest-pinned image reference, in the form `<repository>@sha256:<digest>`. |

2. Confirm that the Agent compiled. The revision is ready when `desiredRevision` and `latestSuccessfulRevision` report the same value.
   ```bash
   kubectl get agent release-writer -n kagent \
     -o jsonpath='{.status.desiredRevision}{"\t"}{.status.latestSuccessfulRevision}{"\n"}'
   ```

   > [!NOTE]
   > A ready revision means that kagent accepted the reference, not that the image exists. A wrong digest surfaces only when the agent starts.

3. Create a {{< gloss "Session" >}}Session{{< /gloss >}}, and save its ID to an environment variable. A Session pins the revision that it was created on, so a Session that already exists does not pick up the skill.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent release-writer -o json | jq -r '.session.id')
   echo $SESSION_ID
   ```

## Ask the agent to use the skill

Send requests in the Session that you created, and check that the agent runs the skill's script.

1. Send the agent a request that matches the skill's description.
   ```bash
   kagent agent invoke --session $SESSION_ID \
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

3. To confirm the attachment from the agent's own side, ask the agent which skills it has.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "What skills do you have?"
   ```

## Publish a new version of the skill

A source is immutable. To change a skill, publish new content, and then point the AgentTemplate at the new digest.

1. Edit the skill.

2. Build and push the skill under a new tag and read the new digest.
   ```bash
   docker buildx build --push --platform linux/amd64 -t "$SKILL_REPO:1.1.0" .
   export SKILL_OCI="$SKILL_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$SKILL_REPO:1.1.0")"
   ```

3. Update `skills[].source.oci` on the AgentTemplate with the new digest. kagent compiles a new revision.

4. Create a new Session. Sessions that already exist keep the skill content of their pinned revision.

## Bundle the skill in a plugin

While a standalone source contains one skill, a {{< gloss "Plugin" >}}plugin{{< /gloss >}} contains multiple skills. An AgentTemplate attaches the plugin once and lists the skills that it wants. To ship a set of skills together, or to have the same artifact contribute [Model Context Protocol (MCP) servers]({{< link path="skills-and-mcp/plugins#mcp-servers" >}}) as well, use a plugin.

1. Restructure the directory so that each skill sits under `skills/`, and add the manifest that makes it a plugin.
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

2. Build and push the plugin, and read its digest. A plugin image is built in the same way as a single skill from `scratch`, so that the plugin root is the image root.
   ```bash
   export PLUGIN_REPO=ghcr.io/<your-org>/release-tools
   mv skills/release-notes/Dockerfile .
   docker buildx build --push --platform linux/amd64 -t "$PLUGIN_REPO:1.0.0" .
   export PLUGIN_OCI="$PLUGIN_REPO@$(docker buildx imagetools inspect --format '{{.Manifest.Digest}}' "$PLUGIN_REPO:1.0.0")"
   ```

3. Attach the plugin with `plugins` instead of `skills`, and list the skills to enable.
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
   > A plugin enables only the skills that you list. If you omit `plugins[].skills`, or leave it empty, the agent does not get any of the skills, and kagent accepts the empty list without an error. For why an explicit list is the safer default, see [Plugins]({{< link path="skills-and-mcp/plugins#skill-allowlist" >}}).

4. Create a Session on the new revision, and confirm that the agent still has the skill. The `$SESSION_ID` Session is pinned to the revision that included the standalone skill.
   ```bash
   export PLUGIN_SESSION_ID=$(kagent agent session create --agent release-writer -o json | jq -r '.session.id')
   kagent agent invoke --session $PLUGIN_SESSION_ID --task "What skills do you have?"
   ```

   The agent reports `release-notes` exactly as before. A skill behaves in the same way whether it arrives on its own or inside a plugin, because kagent copies both into `/skills` before the agent starts.

## Troubleshoot a skill that does not load

A skill that kagent cannot fetch stops the agent from starting at all, rather than producing an agent without that skill. The agent logs the failure and exits, and the Agent never becomes ready.

1. Check the Agent's `Ready` condition. A skill that cannot be fetched leaves the Agent waiting, because the Actor that builds the golden snapshot also fetches the skill.
   ```bash
   kubectl get agent release-writer -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   False ActorTemplatePending waiting for the ActorTemplate golden snapshot
   ```

   > [!NOTE]
   > This condition does not name the skill, and reports the same reason for any Actor that has not yet produced a snapshot. An agent that is merely still starting looks identical to one whose skill cannot be fetched.

2. Find the WorkerPool that the Harness runs on, and read its Workers' logs. The Actor writes the failure to the Worker logs, not to the Agent.

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

   A pool runs the Workers for every agent on it. To find the entries for one agent, filter by the `ate.template.name` label. Its value is the AgentTemplate name, the Harness name, and the revision's short form, joined by hyphens.

3. Match the message to its cause.

   | Message | Cause |
   | ------- | ----- |
   | `pull <image>: ... 401 Unauthorized` | The registry needs credentials that the cluster does not have. |
   | `pull <image>: ... x509` or a Transport Layer Security (TLS) error | The registry does not serve HTTPS with a certificate that the runtime trusts. |
   | `SKILL.md is required` | The artifact was fetched, but the root that `source.path` selects does not contain a `SKILL.md` file. |
   | `symlink "..." escapes artifact root` | A symlink in the artifact points outside it. |
   | `artifact contains more than 10000 filesystem entries`, or `artifact exceeds 104857600 bytes` | The artifact exceeds one of the plugin limits. |

> [!TIP]
> Build the skill image with `--platform` set to the architecture of your worker nodes. kagent asks the registry for the `linux/amd64` or `linux/arm64` manifest that matches the node it runs on, so an image published for one architecture alone fails on the other.

## Clean up

1. Delete the Sessions that you created. Deleting the Agent does not remove them. If you did not complete the plugin section, skip the `$PLUGIN_SESSION_ID` command.
   ```bash
   kagent agent session delete $SESSION_ID
   kagent agent session delete $PLUGIN_SESSION_ID
   ```

2. Delete the Agent and the AgentTemplate.
   ```bash
   kubectl delete agent release-writer -n kagent
   kubectl delete agenttemplate release-writer -n kagent
   ```

3. Remove the skill directory from your machine. The directory is `release-notes`, or `release-tools` if you completed the plugin section.
   ```bash
   cd ..
   rm -rf release-notes release-tools
   ```

4. Delete the images that you pushed, `$SKILL_REPO` and `$PLUGIN_REPO`, by using your registry's own tooling.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/plugins" >}}` title="Plugins" subtitle="Bundle skills and MCP servers into one plugin that an AgentTemplate attaches at once." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Read the full set of skill fields, source kinds, and naming rules." >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Give the same agent a tool from an MCP server alongside its skills." >}}
{{< /cards >}}
