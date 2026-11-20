Install [`jq`](https://jqlang.org/download/), then define these helpers in your shell. `mcp_result` extracts JSON from the server's event stream and checks JSON-RPC and MCP tool errors. `mcp_call` sends a request and automatically adds the bearer header when `TOKEN` is set. Quoted arguments keep the token in one header value in both Bash and Zsh. `pipefail` makes a pipeline fail when any command in it fails.
```bash
set -o pipefail
mcp_result() {
  sed -n 's/^data: //p' | jq -e '
    if .error then error(.error.message)
    elif .result.isError then
      error([.result.content[]? | select(.type == "text") | .text] | join("\n"))
    elif .result then .result
    else error("Missing MCP result") end'
}
mcp_call() {
  local payload="$1"
  shift
  if [ -n "${TOKEN:-}" ]; then
    set -- "$@" -H "Authorization: Bearer $TOKEN"
  fi
  curl -fsS -X POST http://localhost:8083/mcp \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    "$@" -d "$payload" | mcp_result
}
```

Initialize the client and confirm that the server offers tools and prompts.
```bash
mcp_call '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  | jq -c '.capabilities | {tools, prompts}'
```

Example output:
```console
{"tools":{"listChanged":true},"prompts":{"listChanged":true}}
```
