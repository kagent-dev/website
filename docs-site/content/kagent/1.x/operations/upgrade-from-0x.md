---
title: Upgrade from 0.x
description: Move an existing kagent 0.10.x installation to 1.0 by standing up a new installation and recreating your resources on it.
weight: 40
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 has no in-place upgrade path from the 0.10.x line. Moving to 1.0 means installing kagent fresh against a new database, and recreating your resources on it. When your installation runs 1.0, you can perform regular in-place upgrades for later minor releases. To review upgrade paths and versions, see [Version support]({{< link path="reference/versions#release-support-and-compatibility" >}}). For a summary of what 1.0 changes before you plan the move, see [Release notes]({{< link path="reference/release-notes/1.0#100" >}}).

## In-place upgrade blockers

Three independent changes each rule out `helm upgrade`, so working around any one of them does not help.

| Change | Consequence |
| ------ | ----------- |
| The database schema is a clean baseline | 1.0 replaces golang-migrate with goose and starts from a single baseline migration. An existing 0.10.x database has no bridge to it, and 1.0 refuses to run against one. |
| The custom resources moved to a new API group | 1.0 serves its resources under `api.kagent.dev`, where 0.10.x serves them under `kagent.dev`. The groups share no conversion, so nothing stored under the old group is visible through the new CRDs. |
| The resource model is replaced | 0.10.x's `Agent` is gone. What it described is now split between an AgentTemplate and a {{< gloss "Harness" >}}Harness{{< /gloss >}}, paired by a new {{< gloss "Agent" >}}Agent{{< /gloss >}} resource in the `api.kagent.dev` group, and a conversation is a {{< gloss "Session" >}}Session{{< /gloss >}} created against that Agent. The two `Agent` kinds share a name and nothing else. For the model itself, see [Core concepts]({{< link path="about/core-concepts" >}}). |

The two releases also cannot run side by side on one cluster. The group rename separates the custom resources, but both charts name their cluster-scoped ClusterRoles after the release, such as `kagent-getter-role`. When both releases use the default `kagent` release name, the 1.0 install collides with the ClusterRoles that 0.10.x owns. A second cluster keeps the old installation intact while you work.

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

Install 1.0 against the empty database that you provisioned. kagent and Agent Substrate both store their state in that database, each with an owner login that applies migrations and a read/write login that serves runtime queries. `kagent install` normally creates a development database for both. The `--skip-database-setup` flag skips that database. The releases then read the connection Secrets that you create in this section.

Before you start, complete the [Before you begin]({{< link path="setup/installation#before-you-begin" >}}) steps of the installation guide. Those steps prepare the kagent CLI, your provider API key, and a cluster at Kubernetes 1.37 or later.

1. Create the namespaces that hold the connection Secrets. `kagent install` uses the namespaces when they already exist.
   ```bash
   kubectl create namespace kagent
   kubectl create namespace ate-system
   ```

2. Prepare the database for kagent. Follow steps 1 to 3 of [Use an external PostgreSQL instance]({{< link path="operations/operational-considerations#use-an-external-postgresql-instance" >}}), which create the `kagent_owner` and `kagent_readwrite` roles and the `my-postgres-owner` and `my-postgres-readwrite` Secrets.

3. Prepare the same database for Agent Substrate. Agent Substrate ships its own setup script, which creates the `substrate_owner` and `substrate_readwrite` roles and the `substrate` schema. Run it in the same way as the kagent script.
   ```bash
   curl -sSLo substrate-setup.sql https://raw.githubusercontent.com/kagent-dev/substrate/refs/tags/v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}/pkg/postgressetup/setup.sql
   export SUBSTRATE_OWNER_PASSWORD=<substrate-owner-password> SUBSTRATE_READWRITE_PASSWORD=<substrate-readwrite-password>
   psql "$ADMIN_CONNECTION_STRING" --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --set=substrate_schema=substrate \
     --set=substrate_owner_role=substrate_owner \
     --set=substrate_owner_user=substrate_owner_user \
     --set=substrate_readwrite_role=substrate_readwrite \
     --set=substrate_readwrite_user=substrate_readwrite_user \
     --command='\getenv substrate_owner_password SUBSTRATE_OWNER_PASSWORD' \
     --command='\getenv substrate_readwrite_password SUBSTRATE_READWRITE_PASSWORD' \
     --file=substrate-setup.sql
   ```

4. Create the Agent Substrate connection Secrets. The Agent Substrate chart reads these names and keys by default, so its release needs no extra values.
   ```bash
   kubectl create secret generic substrate-postgres-owner \
     --namespace ate-system \
     --from-literal=ownerConnectionString="postgresql://substrate_owner_user:<substrate-owner-password>@<host>:5432/<dbname>?sslmode=verify-full"
   kubectl create secret generic substrate-postgres-readwrite \
     --namespace ate-system \
     --from-literal=readWriteConnectionString="postgresql://substrate_readwrite_user:<substrate-readwrite-password>@<host>:5432/<dbname>?sslmode=verify-full"
   ```

5. Save the kagent Helm values that configure kagent to use your Secrets and roles.
   ```bash
   cat > kagent-values.yaml <<EOF
   database:
     postgres:
       ownerConnectionStringSecretRef:
         name: my-postgres-owner
       readWriteConnectionStringSecretRef:
         name: my-postgres-readwrite
   config:
     server:
       grpcReflection: true
     database:
       owner:
         role: kagent_owner
       readWrite:
         role: kagent_readwrite
       vectorEnabled: true
   EOF
   ```

   | Value | Why |
   | ----- | --- |
   | `database.postgres.ownerConnectionStringSecretRef.name` and `database.postgres.readWriteConnectionStringSecretRef.name` | Read the two connection strings from the Secrets that you created. The keys default to `ownerConnectionString` and `readWriteConnectionString`. |
   | `config.database.owner.role` and `config.database.readWrite.role` | The roles that the kagent setup script created. If you passed other role names to the script, set those names instead. |
   | `config.database.vectorEnabled` | Applies the pgvector migrations, which [long-term memory]({{< link path="agents/agent-memory" >}}) depends on. If your database does not have the pgvector extension installed, omit the value. |
   | `config.server.grpcReflection` | Lets the guides that use `grpcurl` discover the controller API, as in the installation guide. |

   The controller applies migrations at startup. To apply them from a pipeline instead, set `config.database.skipMigrations=true` and run `kagent db migrate up` with the owner login yourself. The controller then verifies the schema and fails if it is not already current.

6. Save a CLI configuration file that references those values. The `kagent db` commands read `database.vectorEnabled` from this file, not from the Helm values. Set it to match `config.database.vectorEnabled`, or omit it when you omit that value.
   ```bash
   cat > kagent-config.yaml <<EOF
   install:
     kagent:
       valuesFiles: [kagent-values.yaml]
   database:
     vectorEnabled: true
   EOF
   ```

7. Install kagent without the development database.
   ```bash
   kagent --config kagent-config.yaml install --namespace kagent --skip-database-setup
   ```

8. Verify the schema before continuing. The `kagent db` commands connect as the owner login and assume the owner role.
   ```bash
   kagent --config kagent-config.yaml db migrate status \
     --db-url "postgresql://kagent_owner_user:<owner-password>@<host>:5432/<dbname>?sslmode=verify-full" \
     --db-role kagent_owner
   ```

   Example output:
   ```console
   2 migration(s) applied, 0 pending
     core: 1 applied (at v1), 0 pending
     vector: 1 applied (at v1), 0 pending
   ```

## Recreate your resources

The export splits into three groups: resources that need only an `apiVersion` change, agents that need rewriting, and resources with no 1.0 equivalent. Work through them in that order, because an AgentTemplate refers to the ModelConfigs and RemoteMCPServers that the first group creates.

### Resources that carry forward

ModelConfig, ModelProviderConfig, and RemoteMCPServer keep every field that `v1alpha2` sets. `v1alpha3` adds fields that 0.10.x did not serve, so an exported resource applies unchanged apart from its `apiVersion`.

1. Recreate the Secrets that your ModelConfigs name before you apply them, or the ModelConfigs resolve to nothing.

2. Change the `apiVersion` and apply the resources unchanged.
   ```bash
   sed 's|^apiVersion: kagent.dev/v1alpha2$|apiVersion: api.kagent.dev/v1alpha3|' \
     kagent-0.10-resources.yaml > kagent-1.0-resources.yaml
   ```

### Agents become an AgentTemplate, a Harness, and an Agent

A 0.10.x `Agent` described both what the agent does and how it runs. In 1.0 these concepts are separated into two resources: an AgentTemplate holds the agent's behavior, and a Harness holds the runtime and infrastructure. A third resource, 1.0's own `Agent`, pairs one of each. One Harness serves many Agents, so expect fewer Harnesses than you had 0.10.x Agents.

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
| `spec.type`, `spec.byo` | The `byo` runtime on a Harness. For more information, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |
| `spec.declarative.a2aConfig` | Nothing. A2A is always on, and callers address an Agent at `/agents/{namespace}/{name}`. |
| `spec.iconUrl`, `spec.documentationUrl`, `spec.version`, `spec.provider` | Nothing. kagent builds the agent card from the AgentTemplate's name and description. |
| `spec.declarative.stream`, `executeCodeBlocks`, `shareTools`, `context` | Nothing. `v1alpha3` has no equivalent field. |

> [!NOTE]
> Tool bindings changed shape. A 0.10.x tool set `type: McpServer` or `type: Agent` alongside a matching block. A 1.0 `ToolBinding` carries an `mcp` or `subAgent` block and no discriminator, so the block you set is the binding's kind. For what each binding does, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

Write one Harness for each distinct runtime and infrastructure combination that your agents need. Then write one Agent for each 0.10.x Agent, naming the AgentTemplate and the Harness that it pairs. Neither reusable resource names the other, so the Agent makes a template runnable. For the full field reference, see [Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}), and for a worked example, see [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-an-agenttemplate-and-an-agent" >}}).

### Resources with no 1.0 equivalent

Four resource kinds are removed rather than replaced, so plan for each one before you cut over.

| Removed resource | What to do |
| ---------------- | ---------- |
| `AgentHarness` | No equivalent. It provisioned OpenClaw and Hermes coding-agent sandboxes with Slack and Telegram channels. 1.0's `Harness` shares part of the name and nothing else. |
| `Memory` | Configure memory on the Harness with `spec.kagent.memory` instead. For more information, see [Agent memory]({{< link path="agents/agent-memory#enable-memory" >}}). |
| `SandboxAgent` | No equivalent, and none is needed. Every 1.0 agent runs in a gVisor sandbox by default. |
| `ToolServer` | Use `RemoteMCPServer`, which 0.10.x already served alongside it. |

## Verify the new installation

Confirm that the resources resolved before you retire anything. Harness and AgentTemplate resources do not report their own statuses, so check for issues in the Agent that references them both.

1. Check that each Agent is ready.
   ```bash
   kagent agent list
   ```

2. Read the conditions on any Agent that is not ready. `ResolvedRefs` reports a missing reference, and a Harness that names a WorkerPool that does not exist is the most common cause.
   ```bash
   kubectl describe agent <agent-name> -n kagent
   ```

3. Create a Session against a migrated Agent and send it a message. A reply confirms the whole path, from the revision to the model credentials.
   ```bash
   kagent agent session create --agent <agent-name>
   ```

## Retire the 0.10.x installation

Once the new installation answers correctly, remove the old one. Follow the 0.x procedure rather than the one in these docs: a 0.10.x installation has no Agent Substrate, no `ate.dev` resources, and no identity material to clean up. For those steps, see [Uninstall kagent]({{< relref "/kagent/0.x/operations/uninstall" >}}#uninstall-with-helm) in the 0.x documentation.

Keep the database backup after the uninstall for your own records. It is the only remaining copy of the 0.10.x conversation history, and nothing in 1.0 can read it.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/core-concepts" >}}` title="Core concepts" subtitle="Learn the Harness, AgentTemplate, Agent, and Session model that replaces the 0.x Agent resource." >}}
  {{< card link=`{{< link path="reference/versions" >}}` title="Version support" subtitle="Check which upgrade paths kagent supports from 1.0 onward." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults before the new installation carries real traffic." >}}
{{< /cards >}}
