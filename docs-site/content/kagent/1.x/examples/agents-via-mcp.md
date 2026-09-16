---
title: Use agents from an MCP client
description: Connect Claude Code, Cursor, or another agent to kagent's MCP server, then discover and invoke your AgentInstances as tools.
weight: 20
author: kagent.dev
---

The kagent controller runs a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server that exposes your {{< gloss "AgentInstance" >}}AgentInstances{{< /gloss >}} as tools. Any MCP client can then discover the agents in your cluster and delegate work to them. This mechanism allows one agent to orchestrate another as a sub-agent.

This example runs in the opposite direction to [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}). There, kagent is the MCP client and an external server provides the tools. Here, kagent is the MCP server and your agents are the tools.

You can do this work from an MCP client such as Claude Code or Cursor, which builds the calls for you, or with raw `curl` requests when you want to see those calls or drive the endpoint without a client.

## About the kagent MCP server

The MCP server is part of the controller's HTTP port rather than a separate deployment, so a default installation already serves it at `/mcp` on port `8083`.

- **Transport**: Streamable HTTP only. Server-Sent Events (SSE) as a standalone transport and stdio are both unsupported, so a client that offers a transport choice must use Streamable HTTP.
- **Sessions**: The handler is stateless, so each request stands alone and a client does not need to establish a session first.
- **Extensions**: The server advertises the `io.modelcontextprotocol/tasks` extension, which changes how invocations behave. For more information, see [Invoke without waiting](#invoke-without-waiting).

> [!NOTE]
> The tools take no session or conversation argument, because an AgentInstance **is** the conversation. Sending a second message to the same `agent_instance_id` continues where the first left off. The reply's `context_id` names the durable conversation rather than the instance, so it differs from the `agent_instance_id` and is shared by any fork taken from it. To hold two independent conversations on one AgentTemplate, create two AgentInstances.

> [!WARNING]
> The open source build does not authenticate this endpoint. Every request is accepted, and the caller's identity is read from an `X-User-Id` header that the caller sets itself, defaulting to `admin@kagent.dev`. Because the endpoint can invoke agents, create checkpoints, and create AgentInstances, do not expose port `8083` outside the cluster. For the wider identity model and what the open source build does guarantee, see [Identity]({{< link path="substrate-runtime/identity" >}}).

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `controller.grpc.reflection=true`. Reflection lets a gRPC client discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have at least one AgentInstance in the `READY` state. The MCP server lists ready instances only.

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl). Deleting a checkpoint has neither an MCP tool nor a kagent command, so cleaning one up calls `CheckpointService` directly.

## Connect a client

1. Port-forward the controller's HTTP port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. Add `http://localhost:8083/mcp` to your client.
   {{< tabs >}}
   {{% tab name="Claude Code" %}}
   Add `--scope project` to limit the entry to the current project rather than your user configuration.
   ```bash
   claude mcp add --transport http kagent http://localhost:8083/mcp
   ```

   Continue with the steps in [Use agents from Claude Code or Cursor](#use-agents-from-claude-code-or-cursor).
   {{% /tab %}}
   {{% tab name="Cursor" %}}
   Add the server to your Cursor MCP settings.
   ```json
   {
     "mcpServers": {
       "kagent": {
         "url": "http://localhost:8083/mcp"
       }
     }
   }
   ```

   Continue with the steps in [Use agents from Claude Code or Cursor](#use-agents-from-claude-code-or-cursor).
   {{% /tab %}}
   {{% tab name="curl" %}}
   Nothing needs to be registered, because each request stands alone. Confirm the endpoint before you continue. Streamable HTTP replies are framed as events, so each response arrives on a `data:` line.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
   ```
   Example output:
   ```console
   event: message
   data: {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"extensions":{"io.modelcontextprotocol/tasks":{}},"tools":{"listChanged":true}},"protocolVersion":"2025-06-18","serverInfo":{"name":"kagent","version":"v1.0.0"}}}
   ```

   Continue with the steps in [Use agents from curl](#use-agents-from-curl).
   {{% /tab %}}
   {{< /tabs >}}

## Use agents from Claude Code or Cursor

Claude Code and Cursor read the tool schemas and build each call, so you work in plain language rather than JSON. You discover the agents in your cluster, hold a conversation with one, answer the agent when it stops to ask you something, and pin its state so that a second agent can start from that point.

### List and invoke an agent

1. Ask for the agents in the `kagent` namespace. The client calls `list_agent_instances` and reports one line per instance.
   ```console
   > List the kagent agents in the kagent namespace.
   ```

   An unexpectedly empty list is typically due to creator scoping rather than a missing agent. The tool returns only the instances that the calling identity created, and has no option to widen that scope. The kagent command line interface and this endpoint both default to `admin@kagent.dev`, so they see each other's instances. If you created the instance with `kagent --user-id <someone-else>`, send a matching `X-User-Id` header from the client.

2. Ask the agent a question by naming the instance you want to use. The client calls `invoke_agent_instance` and fills in the arguments from the tool schema.
   ```console
   > Ask kagent agent instance <agent-instance-id> in the
     kagent namespace: what is 2+2? Answer with just the number.
   ```

3. Ask a follow-up that depends on the previous answer, such as `Multiply that by 10.`, against the same instance. The word "that" resolves only when the earlier turns are in context, because the transcript belongs to the AgentInstance rather than to the client.

> [!NOTE]
> Nothing here configures whether an invocation blocks or returns a task to poll, because a client declares its own capabilities on each request. A reply means your client did not declare the `io.modelcontextprotocol/tasks` extension and the call waited for the agent to finish. A task ID means it did, and the client polls in the background so that a long agent run never holds a request open.

### Answer an agent's question

When an agent pauses to ask something, kagent returns the question as an MCP elicitation and your client presents its own prompt: the agent's question, and a fixed set of choices where the agent offered them. When you answer it, the agent resumes the turn where it left off. When you refuse it, the agent is told that the person declined, which it can adapt to rather than treating it as an error.

> [!IMPORTANT]
> Only a client that declares the tasks extension can answer an agent. A blocking `invoke_agent_instance` call has nowhere to surface the question, so an agent that pauses leaves that call waiting.

This is the same pause that any other client sees, reached through MCP instead of A2A. For the pause types, the approval model, and what the agent receives, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Checkpoint and fork

You can checkpoint an instance before letting an agent try something risky, then fork that checkpoint to start a second agent from the pinned state. The client calls the three {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} tools, which give it the same operations that the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}) performs from the command line.

1. Ask the client to checkpoint the instance.
   ```console
   > Checkpoint kagent agent instance <agent-instance-id>.
   ```

   The client reports the checkpoint's own ID, the turn that it pinned, and a state of `CHECKPOINT_STATE_READY`. Because the client holds that result in context, you can refer to the checkpoint without repeating its ID.

2. Ask the client to fork that checkpoint.
   ```console
   > Fork that checkpoint.
   ```

   The client reports a second AgentInstance with its own ID, already `READY`, on the same Harness and AgentTemplate as the original.

3. Ask the fork a question.
   ```console
   > Ask that fork what 10+5 is.
   ```

   The fork answers `15`. Ask it about an earlier turn and it answers from the conversation it inherited, because a fork continues from the checkpoint rather than starting fresh.

The two AgentInstances share everything up to the checkpoint and nothing after it, because new turns append only to the branch that received them. A fork also runs the {{< gloss "Revision" >}}revision{{< /gloss >}} its checkpoint was taken on, so editing the AgentTemplate afterwards does not change what the fork runs.

You can now safely [clean up these resources](#clean-up).

## Use agents from curl

With `curl` you build each request yourself, so every field is visible: the tool name, its arguments, and the `_meta` that decides whether a call blocks or returns a task to poll. You list the agents in your cluster, hold a conversation with one, answer the agent when it pauses, and checkpoint an instance to fork a second agent from it. Every request is a `tools/call` to `/mcp` unless it names a `tasks/` method, and none of them needs an `initialize` handshake first.

> [!NOTE]
> Do not put `io.modelcontextprotocol/protocolVersion` in a request's `_meta`. The server then requires a matching `Mcp-Protocol-Version` header and rejects the call without one. Neither field is necessary for any of these requests.

### List and invoke an agent

1. List the ready AgentInstances in the namespace.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "list_agent_instances",
         "arguments": {}
       }
     }'
   ```

   The reply carries one line per instance as text, plus the same data as structured content. Example output:
   ```console
   kagent/01a068e3-aeb6-7abc-8d6f-5ba9becd3143 (my-first-agent via my-first-harness)
   ```

2. Save the ID of the instance that you want to use.
   ```bash
   export INSTANCE_ID=<agent-instance-id>
   ```

3. Send a message and wait for the reply. A blocking call needs no `_meta`, because the tool's default behavior asks nothing of the client.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent_instance",
         "arguments": {
           "agent_instance_id": "'"$INSTANCE_ID"'",
           "message": "What is 2+2? Answer with just the number."
         }
       }
     }'
   ```

   The reply text comes back as the tool's content, with the task identifiers alongside it. Example output:
   ```json
   {
     "agent_instance_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
     "task_id": "01a06d0d-5fcf-7b07-aae3-1f470a8ee157",
     "context_id": "ce5a10b8-7789-4ba7-8395-e60a339de763",
     "state": "TASK_STATE_COMPLETED",
     "text": "4"
   }
   ```

4. Send the same request again with `Multiply that by 10.` as the `message`. The word "that" resolves only when the earlier turns are in context. Note that `context_id` is unchanged while `task_id` is new, so the second turn joined the first conversation instead of starting its own. 
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent_instance",
         "arguments": {
           "agent_instance_id": "'"$INSTANCE_ID"'",
           "message": "Multiply that by 10."
         }
       }
     }'
   ```
   Example output:
   ```json
   {
     "agent_instance_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
     "task_id": "01a06d0d-6864-79f1-a4cb-8547f77638ba",
     "context_id": "ce5a10b8-7789-4ba7-8395-e60a339de763",
     "state": "TASK_STATE_COMPLETED",
     "text": "40"
   }
   ```

### Invoke without waiting

Declaring the `io.modelcontextprotocol/tasks` extension changes the same tool's result. Rather than blocking, `invoke_agent_instance` returns immediately with a task to poll, which keeps a long agent run from holding a request open. Because the handler is stateless, every request repeats the declaration in its `_meta` rather than establishing it once, and that includes each poll.

1. Invoke the agent with the extension declared in `params._meta`. Leave the declaration out and the tool blocks instead, as in [List and invoke an agent](#list-and-invoke-an-agent-1).
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 3,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent_instance",
         "arguments": {
           "agent_instance_id": "'"$INSTANCE_ID"'",
           "message": "Count to three."
         },
         "_meta": {
           "io.modelcontextprotocol/clientCapabilities": {
             "extensions": { "io.modelcontextprotocol/tasks": {} }
           }
         }
       }
     }'
   ```

   The task carries an opaque ID of the form `v1.<encoded reference>` that identifies the namespace, the instance, and the A2A task together, so pass it back verbatim rather than parsing it. Example output:
   ```json
   {
     "taskId": "v1.eyJuYW1lc3BhY2UiOiJrYWdlbnQiLCJpbnN0YW5jZUlkIjoi...",
     "status": "working",
     "createdAt": "2026-09-04T15:35:25.722159606Z",
     "lastUpdatedAt": "2026-09-04T15:35:25.722159606Z",
     "ttlMs": null,
     "pollIntervalMs": 1000,
     "resultType": "task"
   }
   ```

2. Save the task ID. The value ends in base64, so quote it.
   ```bash
   export TASK_ID='<task-id>'
   ```

3. Poll the task with `tasks/get`. Carry the same `_meta` declaration on every poll: a request that omits it is rejected with `-32021 tasks capability required but not declared by client` rather than falling back to a blocking read.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 4,
       "method": "tasks/get",
       "params": {
         "taskId": "'"$TASK_ID"'",
         "_meta": {
           "io.modelcontextprotocol/clientCapabilities": {
             "extensions": { "io.modelcontextprotocol/tasks": {} }
           }
         }
       }
     }'
   ```

4. If the `status` reports `working` or `cancelled`, send the request from the previous step again, waiting the interval that `pollIntervalMs` suggests between calls. A status of `input_required` means the agent is waiting on a person, which is explored in [Answer an agent's question](#answer-an-agents-question-1).

5. When the `status` reads `completed`, stop polling. The `result` field holds the same content that a blocking call would have returned as both `content` and `structuredContent`. Example output:
   ```json
   {
     "status": "completed",
     "statusMessage": "1, 2, 3.",
     "resultType": "complete",
     "result": {
       "content": [{ "type": "text", "text": "1, 2, 3." }]
     }
   }
   ```

Two more methods complete the set. `tasks/cancel` stops a run that is still working, and `tasks/update` answers an agent that is waiting on a person.

> [!WARNING]
> Read `status` rather than `resultType` to decide that a run is over. A paused task reports `resultType` as `complete` while its `status` is still `input_required`, so `resultType` alone does not mean an answer is waiting.

> [!NOTE]
> `statusMessage` changes meaning with the status. On a `working` task it holds the raw task record rather than a readable sentence, because the agent has not produced any text yet, so do not present it to a person as progress text. On an `input_required` task it holds the agent's question, and on a `completed` task it holds the reply.

### Answer an agent's question

When an agent pauses to ask something, the task's status becomes `input_required` and `tasks/get` returns an `inputRequests` object describing what the agent needs. kagent builds that as an MCP elicitation, and answering it is a `tasks/update` call.

1. Poll the paused task and read `inputRequests`. It is keyed by request ID, and each entry is an `elicitation/create` call whose `requestedSchema` is the schema kagent built for the pause. Note the key, because answering needs it. Example output:
   ```json
   {
     "status": "input_required",
     "statusMessage": "Which database should we use?",
     "inputRequests": {
       "01a06d12-4832-7e1f-873d-c25bc6b6b70b": {
         "method": "elicitation/create",
         "params": {
           "mode": "form",
           "message": "Which database should we use?",
           "requestedSchema": {
             "type": "object",
             "properties": {
               "response": {
                 "type": "string",
                 "description": "Which database should we use?",
                 "enum": ["PostgreSQL", "MySQL"]
               }
             },
             "required": ["response"],
             "additionalProperties": false
           }
         }
       }
     }
   }
   ```

   The schema's shape depends on what the agent asked for.
   - **A question** becomes one string field per question, named `response` when the agent asks one question and `response_1`, `response_2`, and so on when it asks more than one. A question with a fixed set of choices restricts the field to those values with `enum`, and one that accepts more than one answer takes an array.
   - **A tool approval** becomes one boolean field per tool, named `approve_1`, `approve_2`, and so on. A response must decide every tool in the request.

2. Save the request ID that keys the entry.
   ```bash
   export INPUT_REQUEST_ID=<input-request-id>
   ```

3. Send the answer with `tasks/update`, keying `inputResponses` by the same request ID. An elicitation result of `accept` sends the answers on, while `decline` and `cancel` tell the agent that the person refused. An agent can adapt to a refusal rather than treating it as an error.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 5,
       "method": "tasks/update",
       "params": {
         "taskId": "'"$TASK_ID"'",
         "inputResponses": {
           "'"$INPUT_REQUEST_ID"'": {
             "action": "accept",
             "content": { "response": "PostgreSQL" }
           }
         },
         "_meta": {
           "io.modelcontextprotocol/clientCapabilities": {
             "extensions": { "io.modelcontextprotocol/tasks": {} }
           }
         }
       }
     }'
   ```

   The reply confirms only that the update was accepted, and carries no agent output. Example output:
   ```json
   { "resultType": "complete" }
   ```

4. Poll the task again to collect the resumed turn. The agent picks up where it paused, so the status returns to `working` and then `completed` with the answer your response produced. Example output:
   ```json
   {
     "status": "completed",
     "statusMessage": "You chose PostgreSQL as the database to use.",
     "resultType": "complete",
     "result": {
       "content": [{ "type": "text", "text": "You chose PostgreSQL as the database to use." }]
     }
   }
   ```

> [!WARNING]
> A response whose key does not match the `inputRequests` key is discarded silently. The call still returns `{ "resultType": "complete" }`, but the agent never receives the answer and the task stays `input_required` until something answers it under the right key or cancels it. Read the key from `tasks/get` rather than reusing a task ID or a checkpoint ID.

For the pause types, the approval model, and what the agent receives, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Checkpoint and fork

The three checkpoint tools pin an instance's state and start a second agent from it. None of them needs the tasks extension, so none carries `_meta`.

1. Create a checkpoint. The `request_id` is an idempotency key, so repeating the call with the same value returns the checkpoint that the first call created rather than pinning a second one.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 6,
       "method": "tools/call",
       "params": {
         "name": "create_agent_instance_checkpoint",
         "arguments": {
           "agent_instance_id": "'"$INSTANCE_ID"'",
           "request_id": "my-first-checkpoint"
         }
       }
     }'
   ```

   The result identifies the checkpoint and the turn it pinned. Example output:
   ```json
   {
     "checkpoint": {
       "id": "01a06d19-540a-7040-befb-ec4499c96ff2",
       "agent_instance_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
       "head_task_id": "01a06d13-2504-7245-9eaf-9c1870c51d26",
       "history_sequence": 398,
       "state": "CHECKPOINT_STATE_READY",
       "created_at": "2026-09-04T15:46:11.594634Z"
     }
   }
   ```

2. Save the checkpoint ID.
   ```bash
   export CHECKPOINT_ID=<checkpoint-id>
   ```

3. List the instance's checkpoints to confirm what you can fork from.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 7,
       "method": "tools/call",
       "params": {
         "name": "list_agent_instance_checkpoints",
         "arguments": {
           "agent_instance_id": "'"$INSTANCE_ID"'"
         }
       }
     }'
   ```

   The result is a `checkpoints` array of the same records, oldest first. Example output:
   ```json
   {
     "checkpoints": [
       {
         "id": "01a0690f-5548-7935-b7ca-70919fc9c221",
         "agent_instance_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
         "head_task_id": "01a0690f-058d-7d29-a880-9b5d6d30b772",
         "history_sequence": 91,
         "state": "CHECKPOINT_STATE_READY",
         "created_at": "2026-09-03T20:56:47.689204Z"
       },
       {
         "id": "01a06d19-540a-7040-befb-ec4499c96ff2",
         "agent_instance_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
         "head_task_id": "01a06d13-2504-7245-9eaf-9c1870c51d26",
         "history_sequence": 398,
         "state": "CHECKPOINT_STATE_READY",
         "created_at": "2026-09-04T15:46:11.594634Z"
       }
     ]
   }
   ```

4. Fork the checkpoint into a second AgentInstance. This call takes `checkpoint_id` rather than an instance ID, because the checkpoint already identifies the instance it was taken on.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 8,
       "method": "tools/call",
       "params": {
         "name": "fork_agent_instance",
         "arguments": {
           "checkpoint_id": "'"$CHECKPOINT_ID"'",
           "request_id": "my-first-fork"
         }
       }
     }'
   ```

   The result is a new AgentInstance with its own ID, already `READY`, on the same Harness and AgentTemplate as the original. Example output:
   ```json
   {
     "agent_instance": {
       "id": "01a06d19-7eec-797b-87b8-7397a96b1544",
       "harness": "my-first-harness",
       "agent_template": "my-first-agent",
       "state": "AGENT_INSTANCE_STATE_READY"
     }
   }
   ```

5. Invoke the fork with `invoke_agent_instance` and its new ID. Note that `context_id` matches the original's rather than the fork's own ID, because the fork continues the conversation that the checkpoint pinned. Example output:
   ```json
   {
     "agent_instance_id": "01a06d19-7eec-797b-87b8-7397a96b1544",
     "task_id": "01a06d19-80e7-7554-8288-377eda9e861b",
     "context_id": "ce5a10b8-7789-4ba7-8395-e60a339de763",
     "state": "TASK_STATE_COMPLETED",
     "text": "15"
   }
   ```

A fork runs the {{< gloss "Revision" >}}revision{{< /gloss >}} its checkpoint was taken on, so editing the AgentTemplate afterwards does not change what the fork runs. For what a checkpoint captures, why a checkpoint taken on a suspended instance is the forkable kind, and what a fork does and does not inherit, see [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume" >}}) and the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

You can now safely [clean up these resources](#clean-up).

## Clean up

1. Delete the fork that you created. No MCP tool deletes an AgentInstance, so use the kagent command line interface.
   ```bash
   kagent delete agent-instance <fork-agent-instance-id>
   ```

2. Port-forward the controller's gRPC port, and leave the command running. `CheckpointService` listens there rather than on the HTTP port that serves MCP.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

3. Delete the checkpoint that you created.
   ```bash
   grpcurl -plaintext \
     -d '{"checkpointId":"<checkpoint-id>"}' \
     localhost:8083 kagent.api.v1alpha1.CheckpointService/DeleteCheckpoint
   ```

4. Remove the server entry from your client. In Claude Code, run `claude mcp remove kagent`. In Cursor, delete the `kagent` entry from your MCP settings.

5. Stop both port-forwards with `Ctrl+C`.

## MCP tool reference

The server exposes five tools. Two cover discovery and conversation, and three expose the {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} operations, so a client can pin and branch an agent's state as well as talk to it. Every tool takes a `namespace` because an AgentInstance is scoped to one. No tool deletes an object, so removing an AgentInstance or a checkpoint means leaving MCP for the command line.

| Tool | Required arguments | What it does |
| ---- | ------------------ | ------------ |
| `list_agent_instances` | `namespace` | Lists the ready AgentInstances that the caller created. Takes `match_labels`, `page_size`, and `page_token`. |
| `invoke_agent_instance` | `namespace`, `agent_instance_id`, `message` | Sends a message and returns the agent's reply. Takes `message_id` for idempotency. |
| `create_agent_instance_checkpoint` | `namespace`, `agent_instance_id` | Pins the conversation at a turn boundary. Takes `request_id` for idempotency. |
| `list_agent_instance_checkpoints` | `namespace`, `agent_instance_id` | Lists that instance's checkpoints. Takes `page_size` and `page_token`. |
| `fork_agent_instance` | `namespace`, `checkpoint_id` | Creates a new AgentInstance from a checkpoint. Takes `request_id` for idempotency. |

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/agent-substrate" >}}` title="Agent Substrate" subtitle="Watch the Actor beneath an agent suspend between turns and resume on demand." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Understand the pauses that an agent can raise and how a client answers them." >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Point kagent at an MCP server so that your agent gains tools of its own." >}}
{{< /cards >}}
