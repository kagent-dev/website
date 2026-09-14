---
title: Upgrade from 0.x
description: Move an existing kagent 0.10.x installation to 1.0 by standing up a new installation and recreating your resources on it.
weight: 40
author: kagent.dev
---

kagent 1.0 has no in-place upgrade path from the 0.10.x line. Moving to 1.0 means installing kagent fresh against a new database, and recreating your resources on it. When your installation runs 1.0, you can perform regular in-place upgrades for later minor releases. To review upgrade paths and versions, see [Version support]({{< link path="reference/versions#release-support-and-compatibility" >}}).

## In-place upgrade blockers

Three independent changes each rule out `helm upgrade`, so working around any one of them does not help.

| Change | Consequence |
| ------ | ----------- |
| The database schema is a clean baseline | 1.0 replaces golang-migrate with goose and starts from a single baseline migration. An existing 0.10.x database has no bridge to it, and 1.0 refuses to run against one. |
| The custom resources serve one API version | The 1.0 CRDs serve `v1alpha3` alone and declare no conversion strategy, so objects stored as `v1alpha2` cannot be read through them. |
| The resource model is replaced | The `Agent` resource is gone. What it described is now split between an AgentTemplate and a {{< gloss "Harness" >}}Harness{{< /gloss >}}, and a conversation is an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} created from that pair. For the model itself, see [Core concepts]({{< link path="about/core-concepts" >}}). |

The two releases also cannot run side by side on one cluster. `modelconfigs.kagent.dev`, `modelproviderconfigs.kagent.dev`, and `remotemcpservers.kagent.dev` exist in both, and a CRD is cluster-scoped, so installing 1.0's CRDs replaces 0.10.x's. A second cluster keeps the old installation intact while you work.

> [!WARNING]
> Downgrading from 1.0 back to 0.10.x is unsupported. Treat the cutover as one-way, and keep the 0.10.x installation running until you have verified the new one.

## Before you begin

1. Read the [kagent releases](https://github.com/kagent-dev/kagent/releases) for the breaking changes in the version that you are moving to, and [Version support]({{< link path="reference/versions#release-support-and-compatibility" >}}) for what 1.0 does and does not promise.

2. Decide where you will install 1.0. A second cluster is the safer choice, because it leaves your 0.10.x installation untouched. Installing on the same cluster means uninstalling 0.10.x first, and that step is not reversible.

3. Provision an empty PostgreSQL database for 1.0. It must be a new database rather than a new schema in the old one, and pointing 1.0 at a 0.10.x database fails at startup with a clear error.
   ```console
   source core uses an unsupported migration table. Use a new PostgreSQL database
   ```

4. Back up your 0.10.x database. The backup is a restore point for the old installation rather than an input to the new one, because no procedure loads it into 1.0.
   ```bash
   pg_dump "postgres://<user>:<password>@<host>:5432/<dbname>" \
     --format=custom \
     --file=kagent-0.10-backup.dump
   ```

## Export your 0.10.x resources

Your Kubernetes resources do carry forward, so export them before anything replaces the CRDs. Conversation history does not carry forward.

1. Export every kagent resource in your namespace.
   ```bash
   kubectl get agents,agentharnesses,sandboxagents,memories,toolservers,remotemcpservers,modelconfigs,modelproviderconfigs \
     -n kagent -o yaml > kagent-0.10-resources.yaml
   ```

2. Note which Secrets your ModelConfigs reference. Secrets are ordinary Kubernetes resources that kagent does not own, so recreate them on the new cluster by whatever means you created them originally.
   ```bash
   kubectl get modelconfigs -n kagent \
     -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.apiKeySecret}{"\n"}{end}'
   ```

## Install kagent 1.0

Install 1.0 the same way as a first-time installation, with one addition: point it at the empty database that you provisioned. The full procedure covers Agent Substrate and the identity material that it needs before you install kagent 1.0.

1. Follow all steps in the [1.0 installation guide]({{< link path="setup/installation" >}}). Set the following Helm values on the kagent install, rather than changing them afterward.

   | Value | Why |
   | ----- | --- |
   | `database.postgres.url` | Your new database's connection string. Setting it takes precedence over the bundled instance. Use `urlFile` instead to read the string from a file. |
   | `database.postgres.bundled.enabled=false` | Turns off the bundled PostgreSQL instance. The bundled instance is for development and evaluation, and it is not suitable for production. |
   | `database.postgres.vectorEnabled=true` | Applies the pgvector migrations, which [long-term memory]({{< link path="agents/agent-memory" >}}) depends on. Your database must have the pgvector extension installed. |

   The controller applies migrations at startup. To apply them from a pipeline instead, set `database.postgres.skipMigrations=true` and run `kagent db migrate up` yourself. The controller then verifies the schema and fails if it is not already current. For sizing and connection guidance on the database itself, see [Use an external PostgreSQL instance]({{< link path="operations/operational-considerations#use-an-external-postgresql-instance" >}}).

2. Verify the schema before continuing.
   ```bash
   kagent db migrate status --db-url "postgres://<user>:<password>@<host>:5432/<dbname>"
   ```

## Recreate your resources

The export splits into three groups: resources that need only an `apiVersion` change, agents that need rewriting, and resources with no 1.0 equivalent. Work through them in that order, because an AgentTemplate refers to the ModelConfigs and RemoteMCPServers that the first group creates.

### Resources that carry forward

ModelConfig, ModelProviderConfig, and RemoteMCPServer have identical fields in `v1alpha2` and `v1alpha3`.

1. Recreate the Secrets that your ModelConfigs name before you apply them, or the ModelConfigs resolve to nothing.

2. Change the `apiVersion` and apply the resources unchanged.
   ```bash
   sed 's|^apiVersion: kagent.dev/v1alpha2$|apiVersion: kagent.dev/v1alpha3|' \
     kagent-0.10-resources.yaml > kagent-1.0-resources.yaml
   ```

### Agents become an AgentTemplate and a Harness

A 0.10.x `Agent` described both what the agent does and how it runs. In 1.0 these concepts are separated into two resources: an AgentTemplate holds the agent's behavior, and a Harness holds the runtime and infrastructure. One Harness serves many AgentTemplates, so expect fewer Harnesses than you had Agents.

| 0.10.x `Agent` field | Equivalent field in 1.0 |
| -------------------- | -------------------- |
| `spec.description` | `AgentTemplate.spec.description` |
| `spec.declarative.systemMessage` | `AgentTemplate.spec.systemPrompt` |
| `spec.declarative.systemMessageFrom` | `AgentTemplate.spec.systemPromptFrom` |
| `spec.declarative.promptTemplate` | `AgentTemplate.spec.promptTemplate`, unchanged |
| `spec.declarative.modelConfig` | `AgentTemplate.spec.modelConfig`, now an object with a `name` rather than a bare string |
| `spec.declarative.tools` | `AgentTemplate.spec.tools`, reshaped. See the following note. |
| `spec.declarative.memory` | `Harness.spec.kagent.memory`, so memory is now a property of the runtime rather than of one agent |
| `spec.declarative.runtime` | `Harness.spec.workload.image`, through the runtime that the Harness selects |
| `spec.declarative.deployment` | `Harness.spec.workload` and `Harness.spec.substrate`. Agents no longer run as Deployments. |
| `spec.type`, `spec.byo` | The `byo` runtime on a Harness. See [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |
| `spec.declarative.a2aConfig` | Nothing. A2A is always on, and callers address an AgentInstance by ID. |
| `spec.iconUrl`, `spec.documentationUrl`, `spec.version`, `spec.provider` | Nothing. kagent builds the agent card from the AgentTemplate's name and description. |
| `spec.declarative.stream`, `executeCodeBlocks`, `shareTools`, `context` | Nothing. `v1alpha3` has no equivalent field. |

> [!NOTE]
> Tool bindings changed shape. A 0.10.x tool set `type: McpServer` or `type: Agent` alongside a matching block. A 1.0 `ToolBinding` carries an `mcp` or `agent` block and no discriminator, so the block you set is the binding's kind. For what each binding does, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

Write one Harness for each distinct runtime and infrastructure combination that your agents need, then label each AgentTemplate so that a Harness admits it. A Harness admits nothing until its `allowedAgentTemplates.selector` matches, and an AgentTemplate has no field naming a Harness. For the full field reference, see [Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}), and for a worked pair, see [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-and-an-agenttemplate" >}}).

### Resources with no 1.0 equivalent

Four resource kinds are removed rather than replaced, so plan for each one before you cut over.

| Removed resource | What to do |
| ---------------- | ---------- |
| `AgentHarness` | No equivalent. It provisioned OpenClaw and Hermes coding-agent sandboxes with Slack and Telegram channels. 1.0's `Harness` shares part of the name and nothing else. |
| `Memory` | Configure memory on the Harness with `spec.kagent.memory` instead. See [Agent memory]({{< link path="agents/agent-memory#enable-memory" >}}). |
| `SandboxAgent` | No equivalent, and none is needed. Every 1.0 agent runs in a gVisor sandbox by default. |
| `ToolServer` | Use `RemoteMCPServer`, which 0.10.x already served alongside it. |

## Verify the new installation

Confirm that the resources resolved before you retire anything, because a Harness that is missing a dependency reports the reason on itself.

1. Check that each Harness is ready. A Harness that is not ready most often names a WorkerPool that does not exist.
   ```bash
   kubectl get harness -n kagent
   ```

2. Check that each AgentTemplate compiled against the Harness that admits it. `status.harnesses` carries one entry per admitting Harness, each ending in a `Ready` condition. An AgentTemplate has no status print column, so read the conditions rather than the table.
   ```bash
   kagent get agent-template <template-name> -o json
   ```

3. Create an AgentInstance from a migrated pair and send it a message. A reply confirms the whole path, from the compiled revision to the model credentials.
   ```bash
   kagent create agent-instance --harness <harness-name> --agent-template <template-name>
   ```

## Retire the 0.10.x installation

Once the new installation answers correctly, remove the old one. Follow the 0.x procedure rather than the one in these docs: a 0.10.x installation has no Agent Substrate, no `ate.dev` resources, and no identity material to clean up. See [Uninstall kagent]({{< relref "/kagent/0.x/operations/uninstall" >}}#uninstall-with-helm) in the 0.x documentation.

Keep the database backup after the uninstall for your own records. It is the only remaining copy of the 0.10.x conversation history, and nothing in 1.0 can read it.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/core-concepts" >}}` title="Core concepts" subtitle="Learn the Harness, AgentTemplate, and AgentInstance model that replaces the Agent resource." >}}
  {{< card link=`{{< link path="reference/versions" >}}` title="Version support" subtitle="Check which upgrade paths kagent supports from 1.0 onward." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults before the new installation carries real traffic." >}}
{{< /cards >}}
