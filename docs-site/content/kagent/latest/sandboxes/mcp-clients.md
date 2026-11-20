---
title: Use sandboxes from an MCP client
description: Connect Claude Code, Codex, Cursor, or another MCP client to kagent's MCP server, and run the client's code in a Sandbox in your cluster.
weight: 50
author: kagent.dev
---

An MCP client such as Claude Code, Codex, or Cursor runs its agent loop on your machine. When you connect it to the kagent Model Context Protocol ({{< gloss "MCP" >}}MCP{{< /gloss >}}) server, the client can run its code in a Sandbox in your cluster instead of on your machine. The code then runs with the Sandbox's tools image and network rules, and without your local files and credentials.

## About the sandbox tools and prompts

The controller's port `8083` serves both the gRPC API and the `/mcp` HTTP endpoint. The kagent MCP server exposes the following sandbox tools, alongside the agent and Session tools.

{{< reuse "kagent-docs/snippets/sandbox-mcp-tools.md" >}}

The server also gives the client instructions on how to use a Sandbox safely. A client that supports MCP prompts additionally lists two prompts that start a sandbox workflow.

| Prompt | Arguments | What it does |
| ------ | --------- | ------------ |
| `sandbox-task` | `task`, which is required, and `namespace` and `template`, which are optional. `template` requires `namespace`. | Asks the model to complete the task in a temporary Sandbox. The model selects a template, stages the inputs, runs the work, checks the exit code and the result, retrieves the deliverables, and deletes the Sandbox. |
| `sandbox-recovery` | `sandbox_id`, which is required | Asks the model to inspect a Sandbox whose task was interrupted, and to decide how to continue without repeating work that already finished. |

A prompt only returns instructions to the client. It does not call any tool by itself.

## Before you begin

1. Create a SandboxTemplate whose image includes Python, as described in [Set up sandbox templates]({{< link path="sandboxes/templates" >}}). The steps in this guide use the `python` template in the `kagent` namespace.

2. {{< reuse "kagent-docs/snippets/sandbox-api-port-forward.md" >}}

3. {{< reuse "kagent-docs/snippets/sandbox-api-auth.md" >}}

## Connect a client

Add `http://localhost:8083/mcp` to your client. {{% upstream %}}If your installation requires authentication, send the token from the prerequisites as an `Authorization: Bearer <token>` header.{{% /upstream %}}{{% downstream %}}Send the token from the prerequisites as an `Authorization: Bearer <token>` header.{{% /downstream %}} The client examples show how to configure the header. The curl helper adds it automatically from `TOKEN`.

{{< tabs >}}
{{% tab name="Claude Code" %}}
To limit the entry to the current project, add `--scope project`.
{{% upstream %}}
```bash
claude mcp add --transport http kagent http://localhost:8083/mcp
```
{{% /upstream %}}

For an authenticated connection, add the token as a header.
```bash
claude mcp add --transport http kagent http://localhost:8083/mcp \
  --header "Authorization: Bearer $TOKEN"
```
{{% /tab %}}
{{% tab name="Codex" %}}
Add the server to the [Codex CLI](https://developers.openai.com/codex/mcp/).
{{% upstream %}}
```bash
codex mcp add kagent --url http://localhost:8083/mcp
```
{{% /upstream %}}

For an authenticated connection, configure Codex to read the token from the `TOKEN` environment variable. Export that variable in the shell where you run Codex.
```bash
codex mcp add kagent --url http://localhost:8083/mcp \
  --bearer-token-env-var TOKEN
```
{{% /tab %}}
{{% tab name="Cursor" %}}
Add the server to your Cursor MCP settings. {{% upstream %}}If your installation does not require authentication, omit `headers`.{{% /upstream %}}
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
A `curl` client does not need to register the server. Continue with [Run a task by using curl](#run-a-task-by-using-curl) to define the request helper and initialize the client. The helper adds the bearer header from `TOKEN` and reads the JSON from the server's `data:` event lines.
{{% /tab %}}
{{< /tabs >}}

## Run a task from Claude Code, Codex, or Cursor

Claude Code, Codex, and Cursor read the tool schemas and the server's instructions, so you describe the task in plain language.

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

{{< reuse "kagent-docs/snippets/sandbox-mcp-call.md" >}}

1. Generate a request ID for this walkthrough, then create a Sandbox. Keep `$REQUEST_ID` unchanged when retrying the same create request. For a new walkthrough, generate a new ID. Reusing the ID of an expired or deleted Sandbox returns `Sandbox is expired, deleted, suspended, or unavailable for this operation`. Changing only the display name does not reset a request ID.
   ```bash
   export REQUEST_ID="mcp-$(uuidgen)"
   ```

   ```bash
   mcp_call '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_sandbox","arguments":{
       "namespace":"kagent","template":"python","request_id":"'"$REQUEST_ID"'","name":"json-summary","ttl_seconds":900}}}' \
     | jq -ce '.structuredContent | select(.id != "")' | tee mcp-sandbox.json
   ```

   Example output:
   ```json
   {"expires_at":"2026-11-18T21:30:03.788683Z","id":"01a1f083-5eeb-74aa-a0eb-8e16a919ead7","name":"json-summary","operation":"RUNTIME_OPERATION_NONE","sandbox_template":{"name":"python","namespace":"kagent"},"state":"RUNTIME_STATE_READY"}
   ```

   Save the returned ID, rather than copying the example ID. Confirm that the Sandbox reports `RUNTIME_STATE_READY` and `RUNTIME_OPERATION_NONE` before continuing.
   ```bash
   export SANDBOX_ID=$(jq -er '.id | select(length > 0)' mcp-sandbox.json)
   ```

2. Write the input file. The `data_base64` value `WzIsMyw1XQo=` is the base64 form of `[2,3,5]` followed by a newline. A relative path resolves against `/data/workspace`.
   ```bash
   mcp_call '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"write_sandbox_file","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","path":"input.json","data_base64":"WzIsMyw1XQo="}}}' \
     | jq -c '.structuredContent'
   ```

   Example output:
   ```json
   {"bytes_written":8}
   ```

3. Start the program, and save the process ID that the call returns.
   ```bash
   mcp_call '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"start_sandbox_process","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'",
       "command":["python3","-c","import json; from pathlib import Path; v = json.loads(Path(\"input.json\").read_text()); Path(\"summary.json\").write_text(json.dumps({\"count\": len(v), \"sum\": sum(v)}))"]}}}' \
     | jq -ce '.structuredContent | select(.process_id != "")' | tee mcp-process.json
   ```

   Example output:
   ```json
   {"process_id":"proc-0ac71b322e40f4d166182417"}
   ```

   ```bash
   export PROCESS_ID=$(jq -er '.process_id | select(length > 0)' mcp-process.json)
   ```

4. Check that the process exited successfully. While the process runs, `state` reads `PROCESS_STATE_RUNNING` and `exit_code` is absent. Repeat this command until `state` is `PROCESS_STATE_EXITED` and `exit_code` is `0` before reading the result file.
   ```bash
   mcp_call '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_sandbox_process","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","process_id":"'"$PROCESS_ID"'"}}}' \
     | jq -c '.structuredContent'
   ```

   Example output:
   ```json
   {"exit_code":0,"process_id":"proc-0ac71b322e40f4d166182417","state":"PROCESS_STATE_EXITED"}
   ```

   An empty `process_id` with `PROCESS_STATE_UNSPECIFIED` is not a running process. It can be the default structured output of a failed tool call, such as a process ID that does not exist in this Sandbox. The helper reports the error text instead. Check that `$SANDBOX_ID` and `$PROCESS_ID` came from the successful calls in this walkthrough. Process IDs from before a suspend and resume are no longer valid.

5. Read the result file. Text returns as numbered lines, so the JSON arrives as line 1.
   ```bash
   mcp_call '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"read_sandbox_file","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'","path":"summary.json"}}}' \
     | jq -c '.content'
   ```

   Example output:
   ```json
   [{"type":"text","text":"1\t{\"count\": 3, \"sum\": 10}\n"}]
   ```

6. Delete the Sandbox.
   ```bash
   mcp_call '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"delete_sandbox","arguments":{
       "sandbox_id":"'"$SANDBOX_ID"'"}}}' \
     | jq -c '.structuredContent | {id, state}'
   ```

   Example output:
   ```json
   {"id":"01a1f083-5eeb-74aa-a0eb-8e16a919ead7","state":"RUNTIME_STATE_DELETED"}
   ```

A tool call that fails can return HTTP success and a result with `isError` set to `true`. Its text content carries the error, such as `Sandbox or process not found`. Filtering directly to `structuredContent` hides that error, so the helper checks it first. Stop at a failed step and correct the error before using its output in another call.

## Limits

The MCP tools move data through the model's context, so their limits are tighter than the CLI's and the gRPC API's. For a larger file, use the CLI or the gRPC API, which stream files up to 64 MiB.

| What | Limit |
| ---- | ----- |
| `write_sandbox_file` | 1 MiB of file content per call, in base64. A write replaces the whole file, and the tool cannot append. |
| `read_sandbox_outputs` | 1 MiB of combined output per call, in base64. Pass the returned offsets to read more. |
| `read_sandbox_file`, text | 2,000 lines or 32 KiB per page, whichever comes first. A line longer than 2,000 bytes is cut and marked `[line cut]`. Pass `offset` and `limit` to page. |
| `read_sandbox_file`, images | PNG, JPEG, and GIF files up to 10 MiB. Other files return a description instead of their content. |

## Clean up

1. Remove the server entry from your client.

   {{< tabs >}}
   {{% tab name="Claude Code" %}}
   ```bash
   claude mcp remove kagent
   ```
   {{% /tab %}}
   {{% tab name="Codex" %}}
   ```bash
   codex mcp remove kagent
   ```
   {{% /tab %}}
   {{% tab name="Cursor" %}}
   Remove the `kagent` entry from `mcpServers` in your Cursor MCP settings. If it was the only server, the configuration becomes:
   ```json
   {
     "mcpServers": {}
   }
   ```
   Keep any other server entries.
   {{% /tab %}}
   {{% tab name="curl" %}}
   No server entry was registered. Remove the local response files after deleting the Sandbox.
   ```bash
   rm mcp-sandbox.json mcp-process.json
   unset SANDBOX_ID PROCESS_ID REQUEST_ID
   unset -f mcp_call mcp_result
   ```
   {{% /tab %}}
   {{< /tabs >}}

2. Stop the port-forward by pressing `Ctrl+C` in its terminal. Run `unset TOKEN` in your client terminal to remove the token from that shell.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/agents-via-mcp" >}}` title="Use agents from an MCP client" subtitle="Invoke your kagent agents from the same MCP connection." >}}
  {{< card link=`{{< link path="sandboxes/grpc" >}}` title="Use sandboxes with the gRPC API" subtitle="Stream larger files and process output from your own application." >}}
{{< /cards >}}
