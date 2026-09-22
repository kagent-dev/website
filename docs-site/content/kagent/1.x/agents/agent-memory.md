---
title: Agent memory
description: Give agents long-term memory that persists across conversations, backed by vector similarity search.
weight: 40
author: kagent.dev
---

An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} remembers its own conversation, because it holds the {{< gloss "Transcript" >}}transcript{{< /gloss >}}. Long-term memory is different: it carries what an agent learned in one conversation into later ones. kagent stores those memories as vectors and retrieves them by similarity to whatever the user just said. Each agent on a {{< gloss "Harness" >}}Harness{{< /gloss >}} keeps its own memories, scoped to the user who created them.

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

> [!IMPORTANT]
> Memory requires an **external** PostgreSQL database with the [pgvector](https://github.com/pgvector/pgvector) extension installed. kagent's bundled database uses the stock `postgres` image, which does not ship pgvector, so it cannot store memories. Point kagent at your own database first.

1. Store the connection string for your database in a Kubernetes Secret, in the same namespace as the kagent controller. The key that you choose becomes the file name that kagent reads, so `db-url` produces the path `/var/secrets/db-url`.
   ```bash
   kubectl create secret generic my-postgres-url-secret -n kagent \
     --from-literal=db-url='postgres://<username>:<password>@<host>:5432/<database>?sslmode=require'
   ```

2. Save the following values, which point kagent at your database, mount the Secret into the controller, and run the migration that creates the pgvector extension.
   ```yaml
   cat > kagent-memory-values.yaml <<EOF
   database:
     postgres:
       # Path to a file holding the connection string, which takes precedence over url
       urlFile: /var/secrets/db-url
       # Runs the vector migration, which creates the pgvector extension and the memory tables
       vectorEnabled: true
       bundled:
         # Use your own database instead of the bundled one
         enabled: false
   controller:
     # Mounts the Secret so that the file at urlFile exists in the controller pod
     volumes:
       - name: db-secret
         secret:
           secretName: my-postgres-url-secret
     volumeMounts:
       - name: db-secret
         mountPath: /var/secrets
         readOnly: true
   EOF
   ```

3. Upgrade your kagent installation with the values file. The `--reuse-values` flag keeps every value that you installed kagent with, such as the Agent Substrate settings, and adds only the values in this file.
   ```bash
   helm upgrade kagent \
     {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
     --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
     --namespace kagent --timeout 10m --reuse-values \
     -f kagent-memory-values.yaml
   ```

4. Wait for the controller to roll out with the new configuration.
   ```bash
   kubectl rollout status deployment/kagent-controller -n kagent --timeout=300s
   ```

## Choose an embedding model

Any provider that the `kagent` runtime supports can serve the embedding model, so the choice typically depends on whichever provider already holds your credentials. The embedding ModelConfig is resolved in the same way that a chat ModelConfig is, which means that the same [provider limitations]({{< link path="setup/model-providers/about-model-providers" >}}) apply to it.

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
   apiVersion: kagent.dev/v1alpha3
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
   | `memory.modelConfigRef.name` | The ModelConfig supplying the embedding model, in the Harness's namespace. Required when `memory` is set. |
   | `memory.ttlDays` | How many days a stored memory stays valid. Minimum 1. When omitted, the server applies a default of 15 days. |

3. Create a new {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} from the Harness and an AgentTemplate that it admits. Editing the Harness compiles a new {{< gloss "Revision" >}}revision{{< /gloss >}}, and an existing AgentInstance keeps running the revision it was created from, so an agent that was already running does not gain memory until you recreate it.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

   The command returns output only after the AgentInstance reaches the `READY` state. Example output:
   ```console
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | ID                                   | AGENT TEMPLATE | HARNESS          | STATE | CREATED              |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | my-first-harness | READY | 2026-08-31T15:02:10Z |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   ```

> [!NOTE]
> Only the `kagent` runtime supports memory. The `memory` block exists only under `spec.kagent`, so a Harness that selects `codex`, `claude`, or `byo` has no settings to configure memory.

## Verify that memory works

Memory is working when a fact from one conversation reaches a later one. An AgentInstance holds the transcript of its own conversation, so the check needs a second AgentInstance that never saw the first.

1. Save the ID of the AgentInstance that you created. The command selects the most recently created AgentInstance for the AgentTemplate.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   ```

2. Tell the agent a fact that is worth remembering.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "Remember that I deploy to the staging cluster on Fridays."
   ```

3. Create a second AgentInstance from the same Harness and AgentTemplate pair. The new AgentInstance starts with an empty transcript.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

4. Save the ID of the new AgentInstance.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   ```

5. Ask the new AgentInstance about the fact. An answer that includes the fact can only have come from memory, because this AgentInstance never saw the earlier conversation.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "When do I deploy to staging?"
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
   | `agent_name` | The agent that owns the memory, written as `<namespace>__NS__<agent-template>_<harness>` with every hyphen replaced by an underscore. The AgentTemplate and Harness pair identifies a runtime, so the same AgentTemplate on two Harnesses owns two separate sets of memories. |
   | `user_id` | The user that the memory belongs to. |
   | `embedding` | The 768-dimensional vector that similarity search compares a query against. |
   | `created_at` and `expires_at` | When kagent wrote the memory, and `ttlDays` after that. |
   | `access_count` | How many times retrieval has returned this memory. |

## Manage memories

The SQL query only reads the table. To list or clear memories, call the `MemoryService` that the kagent controller serves over gRPC.

No CLI command wraps the service yet, so these examples call it with [grpcurl](https://github.com/fullstorydev/grpcurl), and both calls take the `agent_name` exactly as the memory table stores it. Be sure to copy the value out of the table rather than assembling it by hand, because an incorrect name fails silently.

1. Port-forward the controller's gRPC port, and confirm that your kagent installation sets `controller.grpc.reflection=true`.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. List the memories that an agent stores for one user.
   ```bash
   grpcurl -plaintext -d '{
     "agent_name": "kagent__NS__my_first_agent_my_first_harness",
     "user_id": "admin@kagent.dev"
   }' localhost:8083 kagent.api.v1alpha1.MemoryService/List
   ```

   Each entry returns the `id`, `content`, `access_count`, `created_at`, and `expires_at` fields. Results are ranked by how often retrieval has returned them, so the most-used memories appear first.

3. Delete the memories for an agent and user.
   ```bash
   grpcurl -plaintext -d '{
     "agent_name": "kagent__NS__my_first_agent_my_first_harness",
     "user_id": "admin@kagent.dev"
   }' localhost:8083 kagent.api.v1alpha1.MemoryService/Delete
   ```

The memory service also exposes `Search`, `AddSession`, and `AddSessionBatch`. Each method takes a 768-dimensional vector rather than text, because kagent does not embed on the caller's behalf. Call them from a program that already has an embedding model, rather than by hand.

## Memory lifetime

A memory expires `ttlDays` after it is written, which defaults to 15 days. Expiry is per memory rather than per session, so an old preference ages out while a recent one survives.

Changing `ttlDays` on the Harness applies to memories written by AgentInstances created after the change, because the value is compiled into the revision.

## Known limitations

- **Memories are deleted for an agent and user together.** `Delete` clears everything for that pair, and no call removes a single memory.
- **Memories are not shared between agents.** Each agent has its own store, so one agent cannot read what another learned, even on the same Harness and for the same user.
- **The memory implementation is not pluggable.** kagent builds on the Google Agent Development Kit (ADK) memory implementation, and it cannot be swapped for another memory system. To use an alternative, run it as a Model Context Protocol (MCP) server, [bind it as a tool]({{< link path="skills-and-mcp/about-tools" >}}), and instruct the agent to use that instead of the built-in tools.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Configure the rest of the Harness that memory is enabled on." >}}
  {{< card link=`{{< link path="setup/model-providers/about-model-providers" >}}` title="About model providers" subtitle="Understand how a ModelConfig reaches a running agent." >}}
{{< /cards >}}
