---
title: Upgrade from 0.x
description: Move an existing kagent 0.10.x installation to 1.0 by standing up a new installation and recreating your resources on it.
weight: 40
author: kagent.dev
---

{{< reuse "kagent-docs/snippets/name-product.md" >}} 1.0 does not have an in-place upgrade path from the 0.10.x line. Moving to 1.0 means installing kagent fresh against a new database and recreating your resources on it. When your installation runs 1.0, you can upgrade in place to later minor releases. For a summary of what 1.0 changes before you plan the move, see [Release notes]({{< link path="reference/release-notes/1.0#100" >}}).

## In-place upgrade blockers

Review the following changes between 0.10.x and 1.0 before you continue. Each change blocks `helm upgrade` by itself, so fixing one change does not unblock the upgrade.

| Change | Consequence |
| ------ | ----------- |
| The database schema is a clean baseline | 1.0 replaces golang-migrate with goose and starts from a single baseline migration. An existing 0.10.x database does not have a migration path to that baseline, and 1.0 refuses to run against a 0.10.x database. |
| The custom resources moved to a new API group | 1.0 serves its resources under `api.kagent.dev`, where 0.10.x serves them under `kagent.dev`. kagent does not convert resources between the groups, so resources stored under the old group are not visible through the new custom resource definitions (CRDs). |
| The resource model is replaced | The 0.10.x Agent kind does not exist in 1.0. Its configuration moves to an AgentTemplate and a {{< gloss "Harness" >}}Harness{{< /gloss >}}, which a new {{< gloss "Agent" >}}Agent{{< /gloss >}} kind in the `api.kagent.dev` group pairs. A conversation is a {{< gloss "Session" >}}Session{{< /gloss >}} that is created against that Agent. For the mapping, see [Agents become an AgentTemplate, a Harness, and an Agent](#agents-become-an-agenttemplate-a-harness-and-an-agent). |

The two releases also cannot run side by side on one cluster. The group rename separates the custom resources, but both charts create the `kagent-tools-cluster-admin-role` ClusterRole and its ClusterRoleBinding, named after the release. When both releases use the default `kagent` release name, the 1.0 install collides with the ClusterRole and ClusterRoleBinding that 0.10.x owns.

> [!WARNING]
> Downgrading from 1.0 to 0.10.x is not supported. Treat the cutover as one-way, and keep the 0.10.x installation running until you have verified the new one.

## Before you begin

1. Read the [kagent releases](https://github.com/kagent-dev/kagent/releases) for the breaking changes in the version that you are moving to, and [Version support]({{< link path="reference/versions#release-support-and-compatibility" >}}) for what 1.0 does and does not promise.

2. Decide where to install 1.0. A second cluster is the safer choice, because it leaves your 0.10.x installation untouched. Installing on the same cluster means uninstalling 0.10.x first, and that step is not reversible. Keep the 0.10.x installation running until you verify the new one.

3. Provision an empty PostgreSQL database for 1.0. The database must be a new database rather than a new schema in the old one. If you point 1.0 at a 0.10.x database, the startup fails with the following error.
   ```console
   source core uses an unsupported migration table. Use a new PostgreSQL database
   ```

4. Back up your 0.10.x database. The backup is a restore point for the old installation only. kagent 1.0 cannot load the backup.
   ```bash
   pg_dump "postgres://<user>:<password>@<host>:5432/<dbname>" \
     --format=custom \
     --file=kagent-0.10-backup.dump
   ```

5. Install [`yq`](https://github.com/mikefarah/yq#install) version 4 or later. The steps in [Resources that you can convert](#resources-that-you-can-convert) use `yq` to convert the exported resources.

6. Install [`jq`](https://jqlang.org/download/). The steps in [Verify the new installation](#verify-the-new-installation) use `jq` to read the Session ID.

## Export your 0.10.x resources

Export your resources before you uninstall 0.10.x. Some resources convert to 1.0, and the rest serve as a reference when you write their 1.0 replacements.

1. Export every kagent resource in your namespace.
   ```bash
   kubectl get agents,agentharnesses,sandboxagents,memories,toolservers,remotemcpservers,modelconfigs,modelproviderconfigs \
     -n kagent -o yaml > kagent-0.10-resources.yaml
   ```

2. List the Secrets that your ModelConfigs reference. kagent does not own these Secrets, so the export does not include them.
   ```bash
   kubectl get modelconfigs -n kagent \
     -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.apiKeySecret}{"\n"}{end}'
   ```

3. If you install 1.0 on the same cluster, uninstall 0.10.x now. For the steps, see [Uninstall kagent]({{< link path="operations/uninstall#uninstall-with-helm" version="0.x" >}}) in the 0.x documentation.

## Install kagent 1.0

Install 1.0 against the empty database that you provisioned. kagent and Agent Substrate both store their state in that database, each with an owner login that applies migrations and a read/write login that serves runtime queries. `kagent install` normally creates a development database for both. When you pass `--skip-database-setup`, `kagent install` does not create the development database. The kagent and Agent Substrate charts then read the connection Secrets that you create in this section.

Before you start, complete the [Before you begin]({{< link path="setup/installation#before-you-begin" >}}) steps of the installation guide. Those steps prepare a cluster at Kubernetes 1.37 or later and your provider API key. Then install the CLI tools in step 1 of [Install with the CLI]({{< link path="setup/installation#install-kagent" >}}).

1. Create the namespaces that contain the connection Secrets. If a namespace already exists, `kagent install` uses it.
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

4. Create the Agent Substrate connection Secrets. The Agent Substrate chart reads these names and keys by default, so its release does not need extra values.
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

   These values connect kagent to the external database and turn on the features that later steps use.

   | Value | Why |
   | ----- | --- |
   | `database.postgres.ownerConnectionStringSecretRef.name` and `database.postgres.readWriteConnectionStringSecretRef.name` | Read the two connection strings from the Secrets that you created. The keys default to `ownerConnectionString` and `readWriteConnectionString`. |
   | `config.database.owner.role` and `config.database.readWrite.role` | The roles that the kagent setup script created. If you passed other role names to the script, set those names instead. |
   | `config.database.vectorEnabled` | Applies the pgvector migrations, which [long-term memory]({{< link path="agents/agent-memory" >}}) depends on. If your database does not have the pgvector extension installed, omit the value. |
   | `config.server.grpcReflection` | Lets the guides that use `grpcurl` discover the controller API. `kagent install` enables it by default, so this value only keeps the setting explicit in the values file. |

6. Save a CLI configuration file that references `kagent-values.yaml`. The `kagent db` commands read `database.vectorEnabled` from this file, not from the Helm values. Set `database.vectorEnabled` to match `config.database.vectorEnabled`. If you omitted `config.database.vectorEnabled`, omit `database.vectorEnabled` too.
   ```bash
   cat > kagent-config.yaml <<EOF
   install:
     kagent:
       valuesFiles: [kagent-values.yaml]
   database:
     vectorEnabled: true
   EOF
   ```

7. Install kagent without the development database. The controller applies migrations at startup. If you apply migrations from a pipeline, set `config.database.skipMigrations=true` and run `kagent db migrate up` with the owner login. The controller then verifies the schema at startup and fails if the schema is not current.
   ```bash
   kagent --config kagent-config.yaml install --namespace kagent --skip-database-setup
   ```

8. Verify the schema before continuing. The `kagent db` commands connect as the owner login and assume the owner role.
   ```bash
   kagent --config kagent-config.yaml db migrate status \
     --db-url "postgresql://kagent_owner_user:<owner-password>@<host>:5432/<dbname>?sslmode=verify-full" \
     --db-role kagent_owner
   ```

   Example output, in which every migration is applied and none are pending:
   ```console
   2 migration(s) applied, 0 pending
     core: 1 applied (at v1), 0 pending
     vector: 1 applied (at v1), 0 pending
   ```

## Recreate your resources

The export splits into resources that convert with small changes, agents that need rewriting, and resources that do not have a 1.0 equivalent. Because an AgentTemplate refers to the ModelConfigs and RemoteMCPServers that you recreate in [Resources that you can convert](#resources-that-you-can-convert), work through the groups in that order.

### Resources that you can convert {#resources-that-you-can-convert}

ModelConfig and RemoteMCPServer keep most of the fields that `v1alpha2` sets. `v1alpha3` renames the ModelConfig field `apiKeyPassthrough` to `tokenPassthrough`, and the field's behavior does not change. `v1alpha3` removes the following ModelConfig fields. When a resource sets any of them, the API server rejects the resource and reports the field as unknown.

- `spec.openAI.tokenExchange`
- `spec.tls.caCertSecretRef` and `spec.tls.caCertSecretKey`
- `spec.tls.disableSystemCAs`

kagent 1.0 cannot pass a mounted credential or certificate file to an agent. In place of `tokenExchange`, use an endpoint that accepts a static API key. For what to use in place of a custom certificate authority bundle, see [Credentials that kagent rejects]({{< link path="setup/model-providers/about-model-providers#credentials-that-kagent-rejects" >}}).

`v1alpha3` reshapes ModelProviderConfig. Model discovery accepts only the `OpenAI` type, which covers any OpenAI-compatible endpoint. A ModelProviderConfig of another type does not have a `v1alpha3` equivalent. The `spec.secretRef` field moves to `spec.discoveryAuth.secretRef`, which references both the Secret and the key within it. kagent uses that credential only to list models, never to invoke them.

1. Recreate the Secrets that your ModelConfigs reference. Without them, the ModelConfigs cannot resolve their API keys.
   ```bash
   kubectl create secret generic <secret-name> -n kagent --from-literal <key>=<api-key>
   ```

2. Convert the ModelConfig, RemoteMCPServer, and `OpenAI` ModelProviderConfig resources to `v1alpha3`. The command drops every other kind and makes the following changes.
   - Sets each `apiVersion`.
   - Renames the `apiKeyPassthrough` field to `tokenPassthrough`.
   - Deletes the ModelConfig fields that `v1alpha3` removed.
   - Removes the metadata that the 0.10.x API server set.
   - Moves the ModelProviderConfig Secret name to `spec.discoveryAuth.secretRef`, with a `<secret-key>` placeholder for the key.
   - Drops the `kagent-grafana-mcp` RemoteMCPServer, because 1.0 does not deploy the Grafana Model Context Protocol (MCP) server behind it.
   ```bash
   yq '.items |= map(select(.kind == "ModelConfig" or .kind == "RemoteMCPServer" or (.kind == "ModelProviderConfig" and .spec.type == "OpenAI")))
     | .items[].apiVersion = "api.kagent.dev/v1alpha3"
     | del(.items[].status, .items[].metadata.resourceVersion, .items[].metadata.uid, .items[].metadata.creationTimestamp, .items[].metadata.generation, .items[].metadata.managedFields, .items[].metadata.annotations["kubectl.kubernetes.io/last-applied-configuration"])
     | (.items[] | select(.kind == "ModelConfig" and has("spec") and (.spec | has("apiKeyPassthrough"))) | .spec) |= (.tokenPassthrough = .apiKeyPassthrough | del(.apiKeyPassthrough))
     | del(.items[] | select(.kind == "ModelConfig") | (.spec.openAI.tokenExchange, .spec.tls.caCertSecretRef, .spec.tls.caCertSecretKey, .spec.tls.disableSystemCAs))
     | del(.items[] | select(.kind == "RemoteMCPServer" and .metadata.name == "kagent-grafana-mcp"))
     | (.items[] | select(.kind == "ModelProviderConfig" and (.spec | has("secretRef"))) | .spec) |= (.discoveryAuth.secretRef = {"name": .secretRef.name, "key": "<secret-key>"} | del(.secretRef))' \
     kagent-0.10-resources.yaml > kagent-1.0-resources.yaml
   ```

3. If the converted file includes a ModelProviderConfig with a `<secret-key>` placeholder, replace the placeholder with the key that contains the API key. A 0.10.x discovery Secret contains exactly one key. To find the key, list the keys of the Secret that `discoveryAuth.secretRef.name` references.
   ```bash
   kubectl get secret <secret-name> -n <namespace> -o go-template='{{range $k, $v := .data}}{{$k}}{{"\n"}}{{end}}'
   ```

4. Apply the converted resources.
   ```bash
   kubectl apply -f kagent-1.0-resources.yaml
   ```

### Agents become an AgentTemplate, a Harness, and an Agent

A 0.10.x Agent described both what the agent does and how it runs. In 1.0, an AgentTemplate defines the agent's behavior, and a Harness defines the runtime and infrastructure. The 1.0 Agent resource pairs one AgentTemplate with one Harness. One Harness serves many Agents, so expect fewer Harnesses than you had 0.10.x Agents.

| 0.10.x Agent field | Equivalent field in 1.0 |
| -------------------- | -------------------- |
| `spec.description` | `AgentTemplate.spec.description` |
| `spec.declarative.systemMessage` | `AgentTemplate.spec.systemPrompt` |
| `spec.declarative.systemMessageFrom` | `AgentTemplate.spec.systemPromptFrom` |
| `spec.declarative.promptTemplate` | `AgentTemplate.spec.promptTemplate`, unchanged |
| `spec.declarative.modelConfig` | `AgentTemplate.spec.modelConfig`, now an object with a `name` rather than a bare string |
| `spec.declarative.tools` | `AgentTemplate.spec.tools`. A 0.10.x tool set `type: McpServer` or `type: Agent` alongside a matching block. A 1.0 binding contains either an `mcp` block or a `subAgent` block and does not have a `type` field. The block that you set determines the binding's kind. For more information, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}). |
| `spec.declarative.memory` | `Harness.spec.kagent.memory`, so memory is now a property of the runtime rather than of one agent |
| `spec.declarative.runtime` | `Harness.spec.workload.image`, through the runtime that the Harness selects |
| `spec.declarative.deployment` | `Harness.spec.workload` and `Harness.spec.substrate`. Agents no longer run as Deployments. |
| `spec.type`, `spec.byo` | The `byo` runtime on a Harness. For more information, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}). |
| `spec.declarative.a2aConfig` | Nothing. Agent2Agent (A2A) is always on, and callers address an Agent at `/agents/{namespace}/{name}`. |
| `spec.iconUrl`, `spec.documentationUrl`, `spec.version`, `spec.provider` | Nothing. kagent builds the agent card from the AgentTemplate's name and description. |
| `spec.declarative.stream`, `executeCodeBlocks`, `shareTools`, `context` | Nothing. `v1alpha3` does not have an equivalent field. |

To recreate your agents, write the three 1.0 resources for each 0.10.x Agent, then apply them. For a worked example of all three resources, see [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-an-agenttemplate-and-an-agent" >}}).

1. Write one AgentTemplate for each 0.10.x Agent. Use the field mapping in the preceding table.

2. Write one Harness for each distinct runtime and infrastructure combination that your agents need. For the Harness fields, see [Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}).

3. Write one Agent for each 0.10.x Agent. Each Agent references its AgentTemplate in `spec.template.ref.name` and its Harness in `spec.harnessRef.name`.

4. Apply the resources. Apply the Harnesses and AgentTemplates first, so that each Agent resolves its references when you create it.
   ```bash
   kubectl apply -f <harnesses-file>
   kubectl apply -f <templates-file>
   kubectl apply -f <agents-file>
   ```

### Removed resources

The following resource kinds do not exist in 1.0. Plan for each one before you cut over.

| Removed resource | What to do |
| ---------------- | ---------- |
| AgentHarness | No equivalent. It provisioned OpenClaw and Hermes coding-agent sandboxes with Slack and Telegram channels. The 1.0 Harness shares part of the name and nothing else. |
| Memory | Configure memory on the Harness by using `spec.kagent.memory`. For more information, see [Agent memory]({{< link path="agents/agent-memory#enable-memory" >}}). |
| SandboxAgent | No equivalent, and none is needed. Every 1.0 agent runs in a gVisor sandbox by default. |
| ToolServer | Use RemoteMCPServer, which 0.10.x already served alongside it. |

## Verify the new installation

Confirm that the resources resolved before you retire anything. Harness and AgentTemplate resources do not report their own statuses, so check for issues in the Agent that references them both.

1. Check that each Agent is ready. Every migrated Agent reports `True` in the `READY` column.
   ```bash
   kagent agent list
   ```
   Example output:
   ```console
   +----------------+-------+----------------------+
   | NAME           | READY | CREATED              |
   +----------------+-------+----------------------+
   | my-first-agent | True  | 2026-11-04T23:30:29Z |
   +----------------+-------+----------------------+
   ```

2. Read the conditions on any Agent that is not ready. `ResolvedRefs` reports a missing reference. The most common cause is a Harness that references a WorkerPool that does not exist.
   ```bash
   kubectl describe agent <agent-name> -n kagent
   ```

3. Create a Session against a migrated Agent, and save its ID.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent <agent-name> -o json | jq -r '.session.id')
   ```

4. Send a message to the Session. A reply confirms the whole path, from the revision to the model credentials.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "Reply with the word ready."
   ```
   Example output:
   ```console
   ready
   ```

## Retire the 0.10.x installation

If you installed 1.0 on a second cluster, remove the old installation after the new one answers correctly. Follow the 0.x procedure, because a 0.10.x installation does not have Agent Substrate, `ate.dev` resources, or identity material to clean up. For those steps, see [Uninstall kagent]({{< link path="operations/uninstall#uninstall-with-helm" version="0.x" >}}) in the 0.x documentation.

Keep the database backup after the uninstall. The backup is the only remaining copy of the 0.10.x conversation history.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/core-concepts" >}}` title="Core concepts" subtitle="Learn the Harness, AgentTemplate, Agent, and Session model that replaces the 0.x Agent resource." >}}
  {{< card link=`{{< link path="reference/versions#release-support-and-compatibility" >}}` title="Version support" subtitle="Check which upgrade paths kagent supports from 1.0 onward." >}}
  {{< card link=`{{< link path="operations/operational-considerations" >}}` title="Operational considerations" subtitle="Replace the evaluation defaults before the new installation serves production traffic." >}}
{{< /cards >}}
