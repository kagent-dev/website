---
title: Build a documentation agent
description: Crawl a documentation site into a vector database, serve it over MCP, and give an agent semantic search over it.
weight: 60
author: kagent.dev
---

An agent answers from its model unless you give it a source, such as in a vector database. This example crawls a documentation website into a vector database with [doc2vec](https://github.com/kagent-dev/doc2vec), serves that database over the {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP), and binds it to an agent so that the agent searches your documentation before it answers.

Only the last two steps are kagent's. doc2vec and its MCP server are a separate project, so this guide treats them as a supplied tool server and spends its detail on the kagent side. To bind your first MCP tool without the crawl, see [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}).

## About the pieces

This guide installs the following components.
* **doc2vec**: A command line tool that crawls a website or repository, splits it into chunks, embeds each chunk, and writes the vectors to a database. You run it once, outside the cluster.
* **The doc2vec MCP server**: A published container image that reads that database and exposes semantic search as MCP tools. It runs in your cluster as an ordinary Deployment.
* **kagent**: A `RemoteMCPServer` that points at the MCP server, and an AgentTemplate that binds one or more of its tools.

The MCP server exposes three tools, and an AgentTemplate names the ones it wants.

| Tool | Function |
| ---- | -------- |
| `query_documentation` | Semantic search over the crawled documentation, filtered by product and version. |
| `query_code` | Semantic search over crawled source code. |
| `get_chunks` | Returns the chunks of one document, so an agent can read a page rather than a snippet. |

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and [create your first agent]({{< link path="get-started/your-first-agent" >}}) so that you have a Harness and know which label it admits.

2. Install [Node.js](https://nodejs.org) 20 or later, to run doc2vec.

3. Export the API key that doc2vec uses for embeddings.
   > [!NOTE]
   > The MCP server embeds each incoming query, so it needs its own Secret with a model provider key. The agent's ModelConfig does not supply this key, even when both point at the same provider and you reuse the same value.
   ```bash
   export OPENAI_API_KEY=<your-api-key>
   ```

## Crawl your documentation

doc2vec reads a YAML file that names what to crawl and where to put the vectors. This example writes to [Qdrant](https://qdrant.tech), so that the cluster reads the vectors over the network rather than needing a database file inside the pod.

1. Install Qdrant in your cluster.
   ```bash
   helm repo add qdrant https://qdrant.to/helm
   helm repo update
   helm upgrade --install qdrant qdrant/qdrant --namespace kagent --wait
   ```

2. Forward the Qdrant port and leave the command running, so that doc2vec can write to it from your machine.
   ```bash
   kubectl port-forward -n kagent svc/qdrant 6333:6333
   ```

3. Write a doc2vec configuration. Each entry under `sources` becomes one crawl.
   ```bash
   cat > config.yaml <<'EOF'
   embedding:
     provider: 'openai'
     dimension: 3072
     openai:
       model: 'text-embedding-3-large'

   sources:
     - type: website
       product_name: 'kagent'
       version: 'latest'
       url: 'https://kagent.dev/docs/'
       max_size: 1048576
       database_config:
         type: 'qdrant'
         params:
           qdrant_url: 'http://localhost'
           qdrant_port: 6333
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `embedding.dimension` | Must match the model. `text-embedding-3-large` produces 3072 dimensions. |
   | `product_name` and `version` | Stored on every chunk. The `query_documentation` tool filters on them, so an agent can search one product without seeing another. |
   | `database_config.type` | `qdrant` or `sqlite`. Use `sqlite` only when the database file can sit beside the MCP server. |

4. Run the crawl. The crawl embeds every chunk, so it costs model provider usage and takes longer for a large site.
   ```bash
   npx doc2vec config.yaml
   ```

## Deploy the MCP server

The doc2vec project publishes a prebuilt image of the MCP server, so you deploy it rather than build it from source.

1. Store the embedding key that the server uses for incoming queries.
   ```bash
   kubectl create secret generic doc2vec-openai -n kagent \
     --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY"
   ```

2. Deploy the server and a Service for it. The `TRANSPORT_TYPE` must be `http`, because kagent speaks streamable HTTP to a remote MCP server.

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: doc2vec-mcp
     namespace: kagent
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: doc2vec-mcp
     template:
       metadata:
         labels:
           app: doc2vec-mcp
       spec:
         containers:
         - name: mcp
           # Pin the image to 2.11.0. Tag v2.15.1 accepts a query
           # and then fails every search with 'Error querying
           # documentation: fetch failed', from an 'InvalidArgumentError:
           # invalid onError method' inside the image.
           image: ghcr.io/kagent-dev/doc2vec/mcp:2.11.0
           ports:
           - containerPort: 3001
           env:
           - name: TRANSPORT_TYPE
             value: "http"
           - name: PORT
             value: "3001"
           - name: VECTOR_DB_TYPE
             value: "qdrant"
           - name: QDRANT_URL
             value: "http://qdrant.kagent:6333"
           - name: OPENAI_API_KEY
             valueFrom:
               secretKeyRef:
                 name: doc2vec-openai
                 key: OPENAI_API_KEY
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: doc2vec-mcp
     namespace: kagent
   spec:
     selector:
       app: doc2vec-mcp
     ports:
     - port: 3001
       targetPort: 3001
   EOF
   ```

3. Confirm that the server is running on the HTTP transport.
   ```bash
   kubectl logs -n kagent -l app=doc2vec-mcp --tail=5
   ```

   Example output:
   ```console
   Starting MCP server with HTTP transport...
   MCP server is running on port 3001 with HTTP transport
   Connect to: http://localhost:3001/mcp
   ```

## Register the server with kagent

A `RemoteMCPServer` gives kagent the address of the running MCP server. kagent connects to that address, reads the server's tool catalog, and records the tool names in the resource's status. An AgentTemplate then binds names from that list.

1. Create a `RemoteMCPServer` pointing at the Service. The path is `/mcp`.
   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: kagent.dev/v1alpha3
   kind: RemoteMCPServer
   metadata:
     name: doc2vec
     namespace: kagent
   spec:
     description: Semantic search over crawled documentation.
     protocol: STREAMABLE_HTTP
     url: http://doc2vec-mcp.kagent:3001/mcp
     timeout: 30s
   EOF
   ```

2. Confirm that kagent reached the server and read its catalog. `ACCEPTED` reports the result of that discovery.
   ```bash
   kubectl get remotemcpserver doc2vec -n kagent
   ```

   Example output:
   ```console
   NAME      PROTOCOL          URL                                  ACCEPTED
   doc2vec   STREAMABLE_HTTP   http://doc2vec-mcp.kagent:3001/mcp   True
   ```

3. Read the tool names from the cluster, rather than assuming them.
   ```bash
   kubectl get remotemcpserver doc2vec -n kagent \
     -o jsonpath='{.status.discoveredTools[*].name}{"\n"}'
   ```

   Example output:
   ```console
   get_chunks query_code query_documentation
   ```

## Create the agent

The AgentTemplate binds the tools and sets the system prompt that makes the agent search before it answers. This example binds `query_documentation` and `get_chunks`, and leaves out `query_code`, because the crawl covered a website rather than a repository. The prompt also names `productName` and `version` on every query, because `query_documentation` needs both filters together. Passing `productName` alone returns `Error querying documentation: Not Found`, an error that reads like a broken database rather than a missing filter.

1. Apply an AgentTemplate that binds the search tools. Use the label that your Harness admits.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: docs-agent
     namespace: kagent
     labels:
       kagent.dev/harness: my-first-harness
   spec:
     description: Answers questions from the crawled documentation.
     modelConfig:
       name: default-model-config
     systemPrompt: |
       You answer questions about the kagent documentation. Always call
       query_documentation before answering, and always pass both
       productName "kagent" and version "latest" with your query. Answer
       only from the snippets you get back, and say so when they do not
       cover the question.
     tools:
     - mcp:
         server:
           kind: RemoteMCPServer
           name: doc2vec
         tools:
         - query_documentation
         - get_chunks
   EOF
   ```

   > [!IMPORTANT]
   > Do not set `apiGroup` on `tools[].mcp.server`. The API rejects it with `spec.tools[0].mcp.server: Invalid value: apiGroup must be omitted`. Give the reference a `kind` and a `name` only.

   > [!WARNING]
   > kagent resolves the server but never checks the tool names against what the server serves. A misspelled name compiles into a ready revision and fails silently at run time, so copy the names from `status.discoveredTools`.

2. Create an AgentInstance and save its ID.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template docs-agent
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "docs-agent")] | sort_by(.createdAt) | last | .id')
   echo $INSTANCE_ID
   ```

## Ask a question

Ask the agent something that the crawled documentation covers, and then something that it does not, so that you can tell retrieval from recall.

1. Ask a question that the crawl covers.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "What does a Harness do? Answer in two sentences."
   ```

   The agent calls `query_documentation`, receives the matching chunks, and answers from them. Example output:
   ```console
   A Harness is a Kubernetes custom resource that defines how an agent is allowed to run by
   specifying the runtime engine, workload container image and environment, and substrate
   policy for scheduling and storage. It selects exactly one runtime out of kagent, codex,
   claude, or byo, and determines which AgentTemplates can run on it via a selector.
   ```

2. Ask a question that the crawl does not cover, to confirm that the agent refuses rather than falling back on the model.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "How do I configure Istio ambient mode mTLS? Two sentences."
   ```

   Example output:
   ```console
   The provided documentation does not cover how to configure Istio ambient mode mTLS.
   Would you like me to try another query or help with something else?
   ```

## Clean up

1. Delete the AgentInstance and the AgentTemplate.
   ```bash
   kagent delete agent-instance $INSTANCE_ID
   kubectl delete agenttemplate docs-agent -n kagent
   ```

2. Delete the tool server and its registration.
   ```bash
   kubectl delete remotemcpserver doc2vec -n kagent
   kubectl delete deployment doc2vec-mcp -n kagent
   kubectl delete service doc2vec-mcp -n kagent
   kubectl delete secret doc2vec-openai -n kagent
   ```

3. Uninstall Qdrant, and stop the port-forward with `Ctrl+C`. The chart's StatefulSet volume claim outlives the release, so delete the volume as well.
   ```bash
   helm uninstall qdrant -n kagent
   kubectl delete pvc qdrant-storage-qdrant-0 -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Bind a tool from the MCP server that ships with kagent." >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Read the binding fields and how kagent resolves a tool server." >}}
  {{< card link=`{{< link path="examples/skills" >}}` title="Add a skill to an agent" subtitle="Give the same agent packaged instructions alongside its tools." >}}
{{< /cards >}}
