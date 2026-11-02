---
title: Agent memory
description: Give agents long-term memory that persists across conversations, backed by vector similarity search.
weight: 45
author: kagent.dev
---

A {{< gloss "Session" >}}Session{{< /gloss >}} remembers its own conversation, because it holds the {{< gloss "Transcript" >}}transcript{{< /gloss >}}. Long-term memory is different: it carries what an agent learned in one conversation into later ones. kagent stores those memories as vectors and retrieves them by similarity to whatever the user just said. Each agent on a {{< gloss "Harness" >}}Harness{{< /gloss >}} keeps its own memories, scoped to the user who created them.

Memory is configured on the Harness rather than on an AgentTemplate, so it applies to every agent that the Harness runs.

## How an agent uses memory

Enabling memory adds three tools to every agent on the Harness, and appends a short instruction to its system prompt telling it that the tools exist.

| Tool | What it does |
| ---- | ------------ |
| `save_memory` | Stores a specific fact, preference, or finding for later. |
| `load_memory` | Searches stored memories by query when the agent needs context it does not have. |
| `prefetch_memory` | Retrieves memories relevant to the current message before the agent answers. |

Retrieval works by similarity rather than by keyword. kagent encodes the query as a vector, compares it against stored memories by cosine similarity, and puts the closest matches into the agent's context. A search returns at most five memories, and only those that score above 0.3. The agent also saves memories from a finished session on its own, so a user does not need to ask it to remember anything.

Memories are scoped to the agent and to the user who created them, and carry the time that kagent wrote them. One agent cannot read another agent's memories, even on the same Harness.

## Before you begin

Agent memory requires your own PostgreSQL database with the [pgvector](https://github.com/pgvector/pgvector) extension installed. The default database that `kagent install` deploys runs the stock `postgres` image, which omits pgvector, so that database cannot store memories.

If your installation already uses your own PostgreSQL database, skip step 1 and install pgvector in that database. The vector migration adds only the memory tables, so existing Sessions are kept.

> [!WARNING]
> On the default database, step 1 moves kagent to a new, empty database. Existing Sessions do not carry over.

1. Prepare the database for kagent and create its two connection Secrets. Follow steps 1 to 3 of [Use an external PostgreSQL instance]({{< link path="operations/operational-considerations#use-an-external-postgresql-instance" >}}) to create the `kagent_owner` and `kagent_readwrite` roles and the `my-postgres-owner` and `my-postgres-readwrite` Secrets.

2. Install the pgvector extension in the schema that kagent reads it from. The `config.database.vectorSchema` value names this schema and defaults to `extensions`. Migrations and runtime queries both use the extension, so grant `USAGE` on the schema to both kagent roles.
   ```sql
   CREATE SCHEMA IF NOT EXISTS extensions;
   CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
   GRANT USAGE ON SCHEMA extensions TO kagent_owner, kagent_readwrite;
   ```

   The kagent migrations create the memory tables, and they never create the extension. Be sure to install it yourself before you enable memory.

3. Save the following Helm values to point kagent at your database and run the migration that creates the memory tables.
   ```yaml
   cat > kagent-memory-values.yaml <<EOF
   database:
     postgres:
       # Secrets holding the two connection strings.
       ownerConnectionStringSecretRef:
         name: my-postgres-owner
         key: ownerConnectionString
       readWriteConnectionStringSecretRef:
         name: my-postgres-readwrite
         key: readWriteConnectionString
       # Your database authenticates with passwords, not Pod Certificates.
       clientCertificate:
         enabled: false
   config:
     database:
       # Roles that the setup script created.
       owner:
         role: kagent_owner
       readWrite:
         role: kagent_readwrite
       # Schema that contains the pgvector extension, which you installed in the preceding step.
       vectorSchema: extensions
       # Runs the vector migration, which creates the memory tables.
       vectorEnabled: true
   EOF
   ```

4. Upgrade your kagent installation with the values file. The `--reuse-values` flag keeps every value that you installed kagent with, such as the Agent Substrate settings, and adds only the values in this file.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --timeout 10m --reuse-values \
     -f kagent-memory-values.yaml
   ```

5. Wait for the controller to roll out with the new configuration.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

## Choose an embedding model

Any provider that the `kagent` harness supports can serve the embedding model, so the choice typically depends on whichever provider already holds your credentials. The embedding ModelConfig is resolved in the same way that a chat ModelConfig is, which means that the same [provider limitations]({{< link path="setup/model-providers/about-model-providers" >}}) apply to it.

kagent stores every memory as a **768-dimensional** vector. Models that produce wider vectors are truncated and re-normalized to that width, so no dimension setting is needed and models of different widths can coexist.

An Amazon Bedrock embedding model, for example, looks like the following:

```yaml
spec:
  provider: Bedrock
  model: amazon.titan-embed-text-v2:0
  bedrock:
    region: us-east-1
```

## Enable memory

Add memory to a Harness that already exists. The examples in these steps use `my-first-harness` in the `kagent` namespace, which you create in [Your first agent]({{< link path="get-started/your-first-agent" >}}).

1. Create a `ModelConfig` for the embedding model in the same namespace as your Harness. The model is an embedding model rather than a chat model.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: ModelConfig
   metadata:
     name: embedding-model-config
     namespace: kagent
   spec:
     apiKeySecret: kagent-openai
     apiKeySecretKey: OPENAI_API_KEY
     model: text-embedding-3-small
     provider: OpenAI
     openAI: {}
   EOF
   ```

2. Reference the ModelConfig from your Harness's `spec.kagent.memory` block. A merge patch adds the block and leaves the rest of the Harness spec in place.
   ```bash
   kubectl patch harness my-first-harness -n kagent --type merge -p '
   spec:
     kagent:
       memory:
         modelConfigRef:
           name: embedding-model-config
         ttlDays: 30'
   ```

   {{< reuse "kagent-docs/snippets/review-table.md" >}} To review other available Harness fields, see [Agent harness]({{< link path="agents/agent-harness" >}}).
   | Field | Description |
   | ----- | ----------- |
   | `memory.modelConfigRef.name` | The ModelConfig supplying the embedding model. Required when `memory` is set. The namespace defaults to the Harness's namespace. To use a ModelConfig in another namespace, set `memory.modelConfigRef.namespace`. That ModelConfig must admit the Harness's namespace, as described in [Share a ModelConfig across namespaces]({{< link path="setup/model-providers/about-model-providers#share-a-modelconfig-across-namespaces" >}}). |
   | `memory.ttlDays` | How many days a stored memory stays valid. Minimum 1. When omitted, the server applies a default of 15 days. |

3. Create a new Session against an {{< gloss "Agent" >}}Agent{{< /gloss >}} that uses this Harness. Editing the Harness builds a new {{< gloss "Revision" >}}revision{{< /gloss >}}, and an existing Session keeps running the revision it was created from. An agent that was already running does not gain memory until you start a new Session.
   ```bash
   kagent agent session create --agent my-first-agent
   ```

   The command returns output only after the Session reaches the `READY` state. Example output:
   ```console
   +--------------------------------------+----------------+-------+----------------------+
   | ID                                   | AGENT          | STATE | CREATED              |
   +--------------------------------------+----------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | READY | 2026-08-31T15:02:10Z |
   +--------------------------------------+----------------+-------+----------------------+
   ```

> [!NOTE]
> Only the `kagent` harness supports memory. The `memory` block exists only under `spec.kagent`, so a Harness that selects `codex`, `claude`, or `byo` does not take memory settings.

## Verify that memory works

Memory is working when a fact from one conversation reaches a later one. A Session holds the transcript of its own conversation, so the check needs a second Session that never saw the first.

1. Create a Session and save its ID.
   ```bash
   export FIRST_SESSION_ID=$(kagent agent session create --agent my-first-agent -o json | jq -r '.session.id')
   ```

2. Tell the agent a fact that is worth remembering.
   ```bash
   kagent agent invoke --session $FIRST_SESSION_ID \
     --task "Remember that I deploy to the staging cluster on Fridays."
   ```

3. Create a second Session against the same Agent, and save its ID. The new Session starts with an empty transcript.
   ```bash
   export SECOND_SESSION_ID=$(kagent agent session create --agent my-first-agent -o json | jq -r '.session.id')
   ```

4. Ask the second Session about the fact. An answer that includes the fact can only have come from memory, because this Session never saw the earlier conversation.
   ```bash
   kagent agent invoke --session $SECOND_SESSION_ID --task "When do I deploy to staging?"
   ```

   Example output:
   ```console
   You deploy to the staging cluster on Fridays.
   ```

### What kagent stored

Each memory is one row in the `memory` table, which the vector migration created in your database. A memory that the agent saves at the end of a session is summarized first, so one conversation typically produces several short rows rather than one long one.

1. Connect to the database with the connection string that you stored in the Secret. Any PostgreSQL client works.
   ```bash
   psql 'postgres://<username>:<password>@<host>:5432/<database>?sslmode=require'
   ```

2. Read what an agent saved.
   ```sql
   SELECT agent_name, user_id, content, created_at, expires_at
   FROM memory ORDER BY created_at DESC LIMIT 10;
   ```

   Review the following table to understand the `memory` table output.
   | Column | What it holds |
   | ------ | ------------- |
   | `content` | The text that the agent saved. Retrieval returns it to a later conversation. |
   | `agent_name` | The agent that owns the memory, written as `<namespace>/<agent>`, such as `kagent/my-first-agent`. The name identifies one {{< gloss "Agent" >}}Agent{{< /gloss >}}, so the same AgentTemplate paired into two Agents owns two separate sets of memories. A memory that an earlier release saved keeps its original key, such as `kagent__NS__my_first_agent`, and kagent does not migrate it. The agent no longer retrieves that memory. To list or delete it, pass the original key. |
   | `user_id` | The user that the memory belongs to. |
   | `embedding` | The 768-dimensional vector that similarity search compares a query against. |
   | `created_at` and `expires_at` | When kagent wrote the memory, and `ttlDays` after that. |
   | `access_count` | How many times retrieval has returned this memory. |

## Manage memories

The SQL query only reads the table. To list or clear memories, call the `MemoryService` that the kagent controller serves over gRPC.

No CLI command manages memories, so these examples call the service with [grpcurl](https://github.com/fullstorydev/grpcurl). Each call acts on the memories of the user that the call authenticates as, and does not take a user ID. For how the controller resolves that user, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}). In the default `insecure` mode, a call without an identity runs as `admin@kagent.dev`. In that case, the call returns an empty list for memories that belong to any other user, and a Delete call succeeds without deleting anything. To act on another user's memories in `insecure` mode, add `-H 'X-User-Id: <user_id>'` to each grpcurl call, with the value from the `user_id` column.

Each call also takes the `agent_name` exactly as the memory table stores it. An incorrect name fails silently, so copy the value from the table instead of typing it by hand.

1. Port-forward the controller's gRPC port, and confirm that your kagent installation sets `config.server.grpcReflection=true`.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. List the memories that an agent stores.
   ```bash
   grpcurl -plaintext -d '{
     "agent_name": "kagent/my-first-agent"
   }' localhost:8083 kagent.runtime.v1.MemoryService/List
   ```

   Each entry returns the `id`, `content`, `access_count`, `created_at`, and `expires_at` fields. Results are ranked by how often retrieval has returned them, so the most-used memories appear first.

3. Delete the memories that an agent stores.
   ```bash
   grpcurl -plaintext -d '{
     "agent_name": "kagent/my-first-agent"
   }' localhost:8083 kagent.runtime.v1.MemoryService/Delete
   ```

The memory service also exposes `Search`, `AddSession`, and `AddSessionBatch`. Each method takes a 768-dimensional vector rather than text, because kagent does not embed on the caller's behalf. Call them from a program that already has an embedding model, rather than by hand.

## Memory lifetime

A memory expires `ttlDays` after it is written, which defaults to 15 days. Expiry is per memory rather than per session, so an old preference ages out while a recent one survives.

Changing `ttlDays` on the Harness applies to memories written by Sessions created after the change, because the value is built into the revision.

## Known limitations

- **Memories are deleted for an agent and user together.** `Delete` clears everything for that pair, and no call removes a single memory.
- **Memories are not shared between agents.** Each agent has its own store, so one agent cannot read what another learned, even on the same Harness and for the same user.
- **The memory implementation is not pluggable.** kagent builds on the Google Agent Development Kit (ADK) memory implementation, and it cannot be swapped for another memory system. To use an alternative, run it as a Model Context Protocol (MCP) server, [bind it as a tool]({{< link path="skills-and-mcp/about-tools" >}}), and instruct the agent to use that instead of the built-in tools.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/declarative-agents" >}}` title="Declarative agents" subtitle="Configure the rest of the kagent harness that memory is enabled on." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
