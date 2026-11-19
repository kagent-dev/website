---
title: Use sandboxes from an MCP client
description: Connect Claude Code, Cursor, or another MCP client to kagent's MCP server, and run the client's code in a Sandbox in your cluster.
weight: 50
author: kagent.dev
---

An MCP client such as Claude Code or Cursor runs its agent loop on your machine. When you connect it to the kagent Model Context Protocol ({{< gloss "MCP" >}}MCP{{< /gloss >}}) server, the client can run its code in a Sandbox in your cluster instead of on your machine. The code then runs with the Sandbox's tools image and network rules, and without your local files and credentials.

## About the sandbox tools and prompts

The kagent MCP server runs on the controller's HTTP port, at `/mcp` on port `8083`. It exposes the following sandbox tools, alongside the agent and Session tools.

{{< reuse "kagent-docs/snippets/sandbox-mcp-tools.md" >}}

The server also gives the client instructions on how to use a Sandbox safely. A client that supports MCP prompts additionally lists two prompts that start a sandbox workflow.

| Prompt | Arguments | What it does |
| ------ | --------- | ------------ |
| `sandbox-task` | `task`, which is required, and `namespace` and `template`, which are optional. `template` requires `namespace`. | Asks the model to complete the task in a temporary Sandbox. The model selects a template, stages the inputs, runs the work, checks the exit code and the result, retrieves the deliverables, and deletes the Sandbox. |
| `sandbox-recovery` | `sandbox_id`, which is required | Asks the model to inspect a Sandbox whose task was interrupted, and to decide how to continue without repeating work that already finished. |

A prompt only returns instructions to the client. It does not call any tool by itself.

## Before you begin

1. Create a SandboxTemplate whose image includes Python, as described in [Set up sandbox templates]({{< link path="sandboxes/templates" >}}). The steps in this guide use the `python` template in the `kagent` namespace.

2. Port-forward the controller's HTTP port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

## Connect a client

Add `http://localhost:8083/mcp` to your client. If your installation requires authentication, the server rejects a request without a bearer token with `401 Unauthorized`. In that case, get an access token for your user, and add it as an `Authorization: Bearer <token>` header, as shown in each tab.

{{< tabs >}}
{{% tab name="Claude Code" %}}
To limit the entry to the current project, add `--scope project`.
```bash
claude mcp add --transport http kagent http://localhost:8083/mcp
```

If your installation requires authentication, add the token as a header.
```bash
claude mcp add --transport http kagent http://localhost:8083/mcp \
  --header "Authorization: Bearer $TOKEN"
```
{{% /tab %}}
{{% tab name="Cursor" %}}
Add the server to your Cursor MCP settings. If your installation does not require authentication, omit `headers`.
```json
{
  "mcpServers": {
    "kagent": {
      "url": "http://localhost:8083/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```
{{% /tab %}}
{{% tab name="curl" %}}
A `curl` client does not need to register the server. If your installation requires authentication, add `-H "Authorization: Bearer $TOKEN"` to every `curl` command in this guide. Streamable HTTP replies are framed as events, so each response arrives on a `data:` line. Confirm that the server offers both tools and prompts.
```bash
curl -s -X POST http://localhost:8083/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

Example output:
```console
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"capabilities":{"extensions":{"io.modelcontextprotocol/tasks":{}},"prompts":{"listChanged":true},"tools":{"listChanged":true}},"instructions":"...","protocolVersion":"2025-06-18","serverInfo":{"name":"kagent","version":"1.0.1"}}}
```
{{% /tab %}}
{{< /tabs >}}

## Run a task from Claude Code or Cursor

Claude Code and Cursor read the tool schemas and the server's instructions, so you describe the task in plain language.

1. Ask the client to run a task in a Sandbox. Name the template, so that the client does not have to choose one.
   ```console
   > Use the kagent sandbox tools to run a Python script that prints the first
     10 Fibonacci numbers as a JSON list, in a temporary sandbox from the python
     template in the kagent namespace. Report the output and delete the sandbox.
   ```

   The client creates a Sandbox, writes the script, runs it, reads the output, and deletes the Sandbox. Its answer includes the output and the Sandbox ID.
   ```console
   - Exact output (exit code 0):
     [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
   - Sandbox ID: 01a1f076-4ba2-7250-9ae7-a3831d2926a2 (template python, namespace kagent)
   - Deletion: delete_sandbox returned state RUNTIME_STATE_DELETED.
   ```

2. Optional: Start the same workflow from the `sandbox-task` prompt. In Claude Code, the prompt is the `/mcp__kagent__sandbox-task` command. Claude Code separates the command's arguments at spaces, so a task of more than one word does not map cleanly onto the `task` argument. Describe the task in plain language instead, as in the previous step, unless your client prompts for each argument separately.

3. If a task is interrupted, for example because your client lost its connection, ask the client to recover it. The client can use the `sandbox-recovery` prompt with the Sandbox ID to check which processes finished and which files exist before it continues.

## Run a task by using curl

The following steps make the same calls that a client makes for you, so you can see each request and reply. The task reads a JSON array from a file and writes its count and its sum to another file.

1. Create a Sandbox. Keep the `request_id`, so that you can retry the call without creating a second Sandbox.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_sandbox","arguments":{
       "namespace":"kagent","template":"python","request_id":"mcp-json-1","name":"json-summary","ttl_seconds":900}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.structuredContent'
   ```

   Example output:
   ```json
   {"expires_at":"2026-11-18T21:30:03.788683Z","id":"01a1f083-5eeb-74aa-a0eb-8e16a919ead7","name":"json-summary","operation":"RUNTIME_OPERATION_NONE","sandbox_template":{"name":"python","namespace":"kagent"},"state":"RUNTIME_STATE_READY"}
   ```

   Save the ID.
   ```bash
   export SANDBOX_ID=01a1f083-5eeb-74aa-a0eb-8e16a919ead7
   ```

2. Write the input file. The `data_base64` value `WzIsMyw1XQo=` is the base64 form of `[2,3,5]` followed by a newline. A relative path resolves against `/data/workspace`.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"write_sandbox_file","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","path":"input.json","data_base64":"WzIsMyw1XQo="}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.structuredContent'
   ```

   Example output:
   ```json
   {"bytes_written":8}
   ```

3. Start the program, and save the process ID that the call returns.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"start_sandbox_process","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'",
       "command":["python3","-c","import json; from pathlib import Path; v = json.loads(Path(\"input.json\").read_text()); Path(\"summary.json\").write_text(json.dumps({\"count\": len(v), \"sum\": sum(v)}))"]}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.structuredContent'
   ```

   Example output:
   ```json
   {"process_id":"proc-0ac71b322e40f4d166182417"}
   ```

   ```bash
   export PROCESS_ID=proc-0ac71b322e40f4d166182417
   ```

4. Check that the process exited successfully. While the process runs, `state` reads `PROCESS_STATE_RUNNING` and `exit_code` is absent.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_sandbox_process","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","process_id":"'"$PROCESS_ID"'"}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.structuredContent'
   ```

   Example output:
   ```json
   {"exit_code":0,"process_id":"proc-0ac71b322e40f4d166182417","state":"PROCESS_STATE_EXITED"}
   ```

5. Read the result file. Text returns as numbered lines, so the JSON arrives as line 1.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"read_sandbox_file","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","path":"summary.json"}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.content'
   ```

   Example output:
   ```json
   [{"type":"text","text":"1\t{\"count\": 3, \"sum\": 10}\n"}]
   ```

6. Delete the Sandbox.
   ```bash
   curl -s -X POST http://localhost:8083/mcp \
     -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"delete_sandbox","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'"}}}' \
     | sed -n 's/^data: //p' | jq -c '.result.structuredContent | {id, state}'
   ```

   Example output:
   ```json
   {"id":"01a1f083-5eeb-74aa-a0eb-8e16a919ead7","state":"RUNTIME_STATE_DELETED"}
   ```

A tool call that fails still returns a result, with `isError` set to `true` and the error in the text content, such as `Sandbox or process not found`. Check `isError` before you use a result.

## Limits

The MCP tools move data through the model's context, so their limits are tighter than the CLI's and the gRPC API's. For a larger file, use the CLI or the gRPC API, which stream files up to 64 MiB.

| What | Limit |
| ---- | ----- |
| `write_sandbox_file` | 1 MiB of file content per call, in base64. A write replaces the whole file, and the tool cannot append. |
| `read_sandbox_outputs` | 1 MiB of combined output per call, in base64. Pass the returned offsets to read more. |
| `read_sandbox_file`, text | 2,000 lines or 32 KiB per page, whichever comes first. A line longer than 2,000 bytes is cut and marked `[line cut]`. Pass `offset` and `limit` to page. |
| `read_sandbox_file`, images | PNG, JPEG, and GIF files up to 10 MiB. Other files return a description instead of their content. |

## Clean up

1. Remove the server entry from your client. In Claude Code, run `claude mcp remove kagent`. In Cursor, delete the `kagent` entry from your MCP settings.

2. Stop the port-forward with `Ctrl+C`.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/agents-via-mcp" >}}` title="Use agents from an MCP client" subtitle="Invoke your kagent agents from the same MCP connection." >}}
  {{< card link=`{{< link path="sandboxes/grpc" >}}` title="Drive sandboxes over gRPC" subtitle="Stream larger files and process output from your own application." >}}
{{< /cards >}}
