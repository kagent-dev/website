---
title: Use agents from an MCP client
description: Connect Claude Code, Cursor, or another MCP client to kagent's MCP server, then discover your agents and invoke them as tools.
weight: 20
author: kagent.dev
---

The kagent controller runs a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) server that exposes your agents and their {{< gloss "Session" >}}Sessions{{< /gloss >}} as tools. Any MCP client can then discover the agents in your cluster and delegate work to them. This mechanism allows one agent to orchestrate another as a subagent.

This example runs in the opposite direction to [Your first MCP tool]({{< link path="get-started/your-first-mcp-tool" >}}). There, kagent is the MCP client and an external server provides the tools. Here, kagent is the MCP server and your agents are the tools.

An MCP client such as Claude Code or Cursor builds each call. To see each call, or to drive the endpoint without a client, send raw `curl` requests.

## About the kagent MCP server

The MCP server runs on the controller's HTTP port, so a default installation already serves it at `/mcp` on port `8083`.

- **Transport**: Clients connect over Streamable HTTP. Standalone Server-Sent Events (SSE) and stdio are unsupported.
- **State**: The handler is stateless. Each request stands alone, and a client does not need to establish an MCP session first.
- **Extensions**: The server advertises the `io.modelcontextprotocol/tasks` extension, which changes how invocations behave. For more information, see [Invoke without waiting](#invoke-without-waiting).

{{< reuse "kagent-docs/snippets/examples/mcp-endpoint-warning.md" >}}

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `config.server.grpcReflection=true`. Reflection lets a gRPC client discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that the cluster has an {{< gloss "Agent" >}}Agent{{< /gloss >}} to invoke.

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl) to delete the checkpoint in [Clean up](#clean-up).

## Connect a client

A client reaches the MCP server through a port-forward to the controller's HTTP port. After the port-forward runs, register the endpoint in your client, or confirm the endpoint with a `curl` request.

1. Port-forward the controller's HTTP port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. Add `http://localhost:8083/mcp` to your client.
   {{< tabs >}}
   {{% tab name="Claude Code" %}}
   To limit the entry to the current project, add `--scope project`.
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
   A `curl` client does not need to register the server. Before you continue, confirm the endpoint. Streamable HTTP replies are framed as events, so each response arrives on a `data:` line.
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

Claude Code and Cursor read the tool schemas and build each call, so you work in plain language. You discover the agents in your cluster, start a Session with one, answer the agent when it stops to ask you something, and checkpoint its Session.

### List and invoke an agent

The `list_agents` tool returns the Agents that the caller can see. The `invoke_agent` tool sends one of them a message and starts a Session.

1. Ask for your agents. The client calls `list_agents` and reports the namespace and name of each Agent. A listed Agent is not necessarily ready, and the caller might lack permission to invoke it.
   ```console
   > List my kagent agents.
   ```

2. Ask the agent a question by naming the Agent. The client calls `invoke_agent` with the Agent's namespace and name. The call starts a new Session, and the reply includes the Session ID.
   ```console
   > Ask the kagent agent my-first-agent in the kagent namespace: what is 2+2?
     Answer with just the number.
   ```

   If your client declares the `io.modelcontextprotocol/tasks` extension, the reply is a task ID instead, and the client polls the task in the background. A client declares its own capabilities on each request, so nothing on the server decides whether a call blocks.

3. Ask a follow-up that depends on the previous answer, such as `Multiply that by 10.`, in the same Session. The client calls `invoke_agent` again with the `session_id` from the first reply. The word "that" points back to the earlier answer. The model can follow the reference because the transcript belongs to the Session rather than to the client.

   Because a Session _is_ one conversation, a second message to the same `session_id` continues where the first left off. The reply's `context_id` is the Session's own ID. To hold two independent conversations with one Agent, invoke the Agent by name twice, which starts two Sessions.

4. To continue a Session that already exists, ask the client to list your Sessions.
   ```console
   > List my kagent sessions.
   ```

   The `list_sessions` tool returns only the Sessions that the calling identity created, and cannot widen that scope. The kagent command line interface (CLI) and this endpoint both default to `admin@kagent.dev`, so they see each other's Sessions. If you created the Session as another user with `kagent --user-id <someone-else>`, send a matching `X-User-Id` header from the client.

### Answer an agent's question

When an agent pauses to ask something, kagent returns the question as an MCP elicitation, and your client presents its own prompt with the agent's question and any choices that the agent offered. When you answer the prompt, the agent resumes the turn where it left off. When you refuse it, the agent is told that the person declined, and the agent can adapt to the refusal.

Only a client that declares the tasks extension can answer an agent. A blocking `invoke_agent` call cannot show the question, so an agent that pauses leaves that call waiting.

The pause is the same one that any other client sees, reached through MCP instead of Agent2Agent (A2A). For the pause kinds, the approval model, and what the agent receives, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Checkpoint a Session

Before an agent tries something risky, you can checkpoint its Session. The {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} tools give the client the same checkpoint operations that are performed from the command line in the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

1. Ask the client to checkpoint the Session.
   ```console
   > Checkpoint kagent session <session-id>.
   ```

   The client reports the checkpoint's own ID, the turn that it pinned, and a state of `CHECKPOINT_STATE_READY`. Because the client keeps that result in context, you can refer to the checkpoint without repeating its ID. To inspect or delete the checkpoint later, keep its ID.

You can now safely [clean up these resources](#clean-up).

## Use agents from curl

With `curl` you build each request yourself, so every field is visible, including the tool name, its arguments, and the `_meta` field that decides whether a call blocks or returns a task to poll. You list the agents in your cluster, start a Session with one, answer the agent when it pauses, and checkpoint the Session. Every request is a `tools/call` to `/mcp` unless it names a `tasks/` method, and no request needs an `initialize` handshake first.

Do not put `io.modelcontextprotocol/protocolVersion` in a request's `_meta`. If a request includes it, the server requires a matching `Mcp-Protocol-Version` header and rejects the call without one. None of these requests need either field.

### List and invoke an agent by using curl

Each request in this section is a blocking `tools/call`. The reply returns after the agent finishes the turn.

1. List the Agents that you can see. To limit the list to one namespace, add a `namespace` argument.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "list_agents",
         "arguments": {}
       }
     }'
   ```

   The reply contains an `agents` array of namespace and name references, plus a `next_page_token` when more Agents remain. A listed Agent is not necessarily ready, and the caller might lack permission to invoke it. Example output:
   ```json
   {
     "agents": [
       { "namespace": "kagent", "name": "my-first-agent" }
     ]
   }
   ```

2. Start a Session by sending the Agent a message, and wait for the reply. The `agent` argument takes a reference from the `list_agents` result. A blocking call does not need `_meta`, because by default the tool does not require a client capability.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent",
         "arguments": {
           "agent": { "namespace": "kagent", "name": "my-first-agent" },
           "message": "What is 2+2? Answer with just the number."
         }
       }
     }'
   ```

   The reply text comes back as the tool's content, with the new Session's ID and the task identifiers alongside it. Example output:
   ```json
   {
     "session_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
     "task_id": "01a06d0d-5fcf-7b07-aae3-1f470a8ee157",
     "context_id": "ce5a10b8-7789-4ba7-8395-e60a339de763",
     "state": "TASK_STATE_COMPLETED",
     "text": "4"
   }
   ```

3. Save the Session ID from the reply.
   ```bash
   export SESSION_ID=<session-id>
   ```

4. Send `Multiply that by 10.` to the same Session. This time, `session_id` replaces `agent`, because the call takes exactly one of the two. The word "that" points back to the earlier answer. The model can follow the reference because the transcript belongs to the Session. In the reply, `context_id` is unchanged and `task_id` is new, so the second turn continued the same Session.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent",
         "arguments": {
           "session_id": "'"$SESSION_ID"'",
           "message": "Multiply that by 10."
         }
       }
     }'
   ```
   Example output:
   ```json
   {
     "session_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
     "task_id": "01a06d0d-6864-79f1-a4cb-8547f77638ba",
     "context_id": "ce5a10b8-7789-4ba7-8395-e60a339de763",
     "state": "TASK_STATE_COMPLETED",
     "text": "40"
   }
   ```

### Invoke without waiting

Declaring the `io.modelcontextprotocol/tasks` extension changes the same tool's result. Rather than blocking, `invoke_agent` returns immediately with a task to poll, which keeps a long agent run from holding a request open. Because the handler is stateless, every request, including each poll, repeats the declaration in its `_meta`. The `tasks/cancel` method stops a run that is still working, and the `tasks/update` method answers an agent that is waiting on a person.

1. Invoke the agent with the extension declared in `params._meta`. If you omit the declaration, the tool blocks, as in [List and invoke an agent by using curl](#list-and-invoke-an-agent-by-using-curl).
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 3,
       "method": "tools/call",
       "params": {
         "name": "invoke_agent",
         "arguments": {
           "session_id": "'"$SESSION_ID"'",
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

   The task has an opaque ID of the form `v1.<encoded reference>` that identifies the namespace, the Session, and the A2A task. Pass the ID back verbatim. Example output:
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

3. Poll the task with `tasks/get`. Include the same `_meta` declaration on every poll. The server rejects a poll that omits it with `-32021 tasks capability required but not declared by client`.
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

4. If the `status` reports `working` or `cancelled`, send the `tasks/get` request again after the interval that `pollIntervalMs` suggests. On a `working` task, `statusMessage` contains the raw task record, because the agent has not produced text yet, so do not present it as progress text. A status of `input_required` means the agent is waiting on a person. To answer it, see [Answer an agent's question by using curl](#answer-an-agents-question-by-using-curl).

5. When the `status` reads `completed`, stop polling. Read `status`, not `resultType`, to decide that a run is over, because a paused task reports `resultType` as `complete` while its `status` is still `input_required`. The `result` field contains the same content that a blocking call would have returned as both `content` and `structuredContent`. Example output:
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


### Answer an agent's question by using curl

When an agent pauses to ask something, the task's status becomes `input_required` and `tasks/get` returns an `inputRequests` object describing what the agent needs. kagent builds the request as an MCP elicitation. To answer it, send a `tasks/update` call.

1. Poll the paused task and read `inputRequests`. `inputRequests` is keyed by request ID, and each entry is an `elicitation/create` call whose `requestedSchema` is the schema that kagent built for the pause. Note the key, because the `tasks/update` call requires it. Example output:
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

3. Send the answer with `tasks/update`, keying `inputResponses` by the same request ID. An `accept` result sends the answers to the agent. A `decline` or `cancel` result tells the agent that the person refused. If the response key does not match the `inputRequests` key, the server rejects the response with an `Invalid params` error (`-32602`), and the task stays `input_required`. Read the key from `tasks/get`, and do not reuse a task ID or a checkpoint ID.
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

   The reply confirms only that the update was accepted, and does not include agent output. Example output:
   ```json
   { "resultType": "complete" }
   ```

4. Poll the task again to collect the resumed turn. The agent picks up where it paused, so the status returns to `working` and then `completed` with the answer that your response produced. Example output:
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

For the pause kinds, the approval model, and what the agent receives, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

### Checkpoint a Session by using curl

The checkpoint tools pin a Session's state. These tools do not need the tasks extension, so their requests omit `_meta`.

1. Create a checkpoint of the latest finished turn. `expected_head_task_id` identifies the turn to pin. If the Session has advanced past that turn, the call fails. Use the `$TASK_ID` that an earlier invocation returned. `request_id` is an idempotency key, so a repeated call with the same value returns the existing checkpoint.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 6,
       "method": "tools/call",
       "params": {
         "name": "create_session_checkpoint",
         "arguments": {
           "session_id": "'"$SESSION_ID"'",
           "expected_head_task_id": "'"$TASK_ID"'",
           "request_id": "my-first-checkpoint"
         }
       }
     }'
   ```

   The result identifies the checkpoint and the turn that it pinned. Example output:
   ```json
   {
     "checkpoint": {
       "id": "01a06d19-540a-7040-befb-ec4499c96ff2",
       "session_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
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

3. List the Session's checkpoints.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{
       "jsonrpc": "2.0",
       "id": 7,
       "method": "tools/call",
       "params": {
         "name": "list_session_checkpoints",
         "arguments": {
           "session_id": "'"$SESSION_ID"'"
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
         "session_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
         "head_task_id": "01a0690f-058d-7d29-a880-9b5d6d30b772",
         "history_sequence": 91,
         "state": "CHECKPOINT_STATE_READY",
         "created_at": "2026-09-03T20:56:47.689204Z"
       },
       {
         "id": "01a06d19-540a-7040-befb-ec4499c96ff2",
         "session_id": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
         "head_task_id": "01a06d13-2504-7245-9eaf-9c1870c51d26",
         "history_sequence": 398,
         "state": "CHECKPOINT_STATE_READY",
         "created_at": "2026-09-04T15:46:11.594634Z"
       }
     ]
   }
   ```

To start a second Session from a checkpoint, call `fork_session` with the checkpoint ID. For what a fork replays and where it diverges, see [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume#checkpoints" >}}) and the [Agent Substrate example]({{< link path="examples/agent-substrate" >}}).

You can now safely [clean up these resources](#clean-up).

## Clean up

1. Delete the checkpoint that you created. If you used Claude Code or Cursor, set `CHECKPOINT_ID` to the ID that the client reported. `CheckpointService` listens on the same port that serves MCP, so the port-forward from [Connect a client](#connect-a-client) already reaches the service.
   ```bash
   grpcurl -plaintext \
     -d '{"checkpointId":"'"$CHECKPOINT_ID"'"}' \
     localhost:8083 kagent.api.v1.CheckpointService/DeleteCheckpoint
   ```

2. Remove the server entry from your client. In Claude Code, run `claude mcp remove kagent`. In Cursor, delete the `kagent` entry from your MCP settings.

3. Stop the port-forward with `Ctrl+C`.

## MCP tool reference

The server exposes the following agent and Session tools. Some cover discovery and conversation, and the rest expose the {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} operations, so a client can pin an agent's state as well as talk to it. An Agent is addressed by its namespace and name, and a Session by its own universally unique identifier (UUID). None of these tools deletes a Session or a checkpoint. To delete a Session, run `kagent agent session delete`. To delete a checkpoint, call the gRPC API directly, because the CLI has no checkpoint command. The server also exposes a set of [standalone sandbox]({{< link path="about/substrate-runtime/standalone-sandboxes" >}}) tools, which this example does not cover.

| Tool | Required arguments | What it does |
| ---- | ------------------ | ------------ |
| `list_agents` | None | Lists the Agents that the caller can see. Takes `namespace` to filter, and `page_size` and `page_token`. |
| `list_sessions` | None | Lists the ready Sessions that the caller created. Takes `page_size` and `page_token`. |
| `invoke_agent` | `message`, and exactly one of `agent` or `session_id` | Starts a new Session with `agent`, or continues one with `session_id`, and returns the agent's reply with the Session and task IDs. Takes `message_id` for idempotency. |
| `create_session_checkpoint` | `session_id`, `expected_head_task_id` | Pins the Session at a turn boundary. The call fails if the Session has advanced past that task. Takes `request_id` for idempotency. |
| `list_session_checkpoints` | `session_id` | Lists that Session's checkpoints. Takes `page_size` and `page_token`. |
| `fork_session` | `checkpoint_id` | Starts a second Session from a checkpoint, replaying the Session's transcript through the pinned turn. Takes `request_id` for idempotency. |

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/agent-substrate" >}}` title="Agent Substrate" subtitle="Watch the Actor beneath an agent suspend between turns and resume on demand." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Understand the pauses that an agent can raise and how a client answers them." >}}
  {{< card link=`{{< link path="get-started/your-first-mcp-tool" >}}` title="Your first MCP tool" subtitle="Point kagent at an MCP server so that your agent gains tools of its own." >}}
{{< /cards >}}
