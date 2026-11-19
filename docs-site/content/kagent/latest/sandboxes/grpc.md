---
title: Drive sandboxes over gRPC
description: Create a Sandbox, write a file, run a process, and stream its output from your own application by calling the kagent gRPC API.
weight: 60
author: kagent.dev
---

An application that keeps its own agent loop, such as a chat app that runs the code that a model writes, calls the Sandbox API directly. This example uses [grpcurl](https://github.com/fullstorydev/grpcurl) to show each request and reply. A real application generates a client from kagent's protocol buffer definitions instead.

## About the Sandbox API

The controller serves the Sandbox API on port `8083`, the same port as the rest of the kagent gRPC API. The CLI and the MCP server reach the same services.

| Service | Methods | What it covers |
| ------- | ------- | -------------- |
| `kagent.api.v1.SandboxTemplateService` | `ListSandboxTemplates` | Lists the templates in a namespace, with each template's image and status. |
| `kagent.api.v1.SandboxService` | `CreateSandbox`, `GetSandbox`, `ListSandboxes`, `SuspendSandbox`, `ResumeSandbox`, `DeleteSandbox` | Manages the lifecycle of a Sandbox. |
| `ateenv.v1alpha.ProcessService` | `StartProcess`, `GetProcess`, `StreamProcessOutput`, `SignalProcess`, `WriteProcessInput` | Runs processes inside one Sandbox. |
| `ateenv.v1alpha.FileSystemService` | `WriteFile`, `ReadFile` | Streams files into and out of one Sandbox, up to 64 MiB each. |

The process and file services are the Agent Substrate guest protocol, unchanged. A call to them selects the Sandbox with the `kagent-sandbox-id` metadata header. A call without the header fails with `exactly one kagent-sandbox-id metadata value is required`.

The lifecycle methods follow these rules.

* **Retries**: Each call makes one attempt. After a temporary error, repeat the same call. `CreateSandbox` takes a required `request_id`, from 1 to 128 characters. A retry with the same `request_id` and the same input returns the same Sandbox. A retry with the same `request_id` and different input fails with `AlreadyExists`, and the message `request_id was used for different input`.
* **Conflicts**: A call that conflicts with a lifecycle change that is still running fails with `ABORTED`. Retry it after the other call returns.
* **Reads**: `GetSandbox` and `ListSandboxes` only read state. They never advance pending work.
* **Process starts**: `StartProcess` has no request ID. A start that times out might have started the process anyway, so check before you start it again.

## Before you begin

1. Create a SandboxTemplate whose image includes Python, as described in [Set up sandbox templates]({{< link path="sandboxes/templates" >}}). The steps in this guide use the `python` template in the `kagent` namespace.

2. Confirm that your installation sets `config.server.grpcReflection=true`. Reflection lets grpcurl discover the controller's methods without a local copy of kagent's protocol buffer definitions. If your installation requires authentication, also get an access token for your user, and add `-H "Authorization: Bearer $TOKEN"` to every `grpcurl` command in this guide.

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl) and [`jq`](https://jqlang.org/download/).

4. Port-forward the controller's gRPC port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

## Create a Sandbox

1. List the templates in the `kagent` namespace.
   ```bash
   grpcurl -plaintext -d '{"namespace":"kagent"}' \
     localhost:8083 kagent.api.v1.SandboxTemplateService/ListSandboxTemplates \
     | jq -c '.sandboxTemplates[] | {ref, workloadImage}'
   ```

   Example output:
   ```json
   {"ref":{"namespace":"kagent","name":"python"},"workloadImage":"docker.io/library/python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90"}
   ```

2. Create a Sandbox from the template, and save its ID.
   ```bash
   grpcurl -plaintext -d '{
       "sandbox_template": {"namespace": "kagent", "name": "python"},
       "request_id": "grpc-demo-1",
       "name": "grpc-demo",
       "ttl": "900s"
     }' \
     localhost:8083 kagent.api.v1.SandboxService/CreateSandbox | tee sandbox.json
   export SANDBOX_ID=$(jq -r '.sandbox.id' sandbox.json)
   ```

   Example output:
   ```json
   {
     "sandbox": {
       "id": "01a1f081-7f80-72f2-a10c-d726a3859090",
       "creator": "admin@kagent.dev",
       "sandboxTemplate": {
         "namespace": "kagent",
         "name": "python"
       },
       "preparedRevision": "3445391091bcf759f7519e35aa0b5c7414bbe0a4a22ab91d30828828061d7caf",
       "state": "RUNTIME_STATE_READY",
       "operation": "RUNTIME_OPERATION_NONE",
       "name": "grpc-demo",
       "createdAt": "2026-11-18T21:13:01.056859Z",
       "updatedAt": "2026-11-18T21:13:01.120894792Z",
       "expiresAt": "2026-11-18T21:28:01.056859Z"
     }
   }
   ```

   | Field | Description |
   | ----- | ----------- |
   | `sandbox_template` | Required. The namespace and name of the template. |
   | `request_id` | Required. The key that makes the call safe to retry. Keep it until the call succeeds. |
   | `name` | Optional. A display name, up to 200 characters. |
   | `ttl` | Optional. The lifetime, from `1s` to `86400s`, and capped by the installation's maximum. When you omit it, the installation's default applies. |

   Before you run anything, check that `state` is `RUNTIME_STATE_READY` and `operation` is `RUNTIME_OPERATION_NONE`. If the Sandbox is still being created, call `GetSandbox` with the ID until it is ready.

## Run a program against a file

1. Write an input file into the Sandbox. The `chunk` field takes the file content in base64, and a relative `path` resolves against `/data/workspace`. The `mode` field takes decimal Unix permission bits, such as `420` for `0644`.
   ```bash
   grpcurl -plaintext -H "kagent-sandbox-id: $SANDBOX_ID" \
     -d "{\"path\":\"input.json\",\"mode\":420,\"chunk\":\"$(printf '[2,3,5]\n' | base64)\"}" \
     localhost:8083 ateenv.v1alpha.FileSystemService/WriteFile
   ```

   Example output:
   ```json
   {
     "bytesWritten": "8"
   }
   ```

   `WriteFile` is a client-streaming method, so an application can send a large file in several chunks. grpcurl sends one chunk per request message.

2. Start a process, and save its ID. The `command` field takes an argument list, and the process starts in `/data/workspace` unless you set `cwd`. The call returns as soon as the process starts.
   ```bash
   grpcurl -plaintext -H "kagent-sandbox-id: $SANDBOX_ID" \
     -d '{"command":["python3","-c","import json; v = json.load(open(\"input.json\")); print(json.dumps({\"count\": len(v), \"sum\": sum(v)}))"]}' \
     localhost:8083 ateenv.v1alpha.ProcessService/StartProcess | tee process.json
   export PROCESS_ID=$(jq -r '.processId' process.json)
   ```

   Example output:
   ```json
   {
     "processId": "proc-122be2a77eec355d88547dc9",
     "command": [
       "python3",
       "-c",
       "import json; v = json.load(open(\"input.json\")); print(json.dumps({\"count\": len(v), \"sum\": sum(v)}))"
     ],
     "pid": 9,
     "state": "PROCESS_STATE_RUNNING",
     "startedAt": "2026-11-18T21:13:08.251668463Z"
   }
   ```

3. Stream the process's output until it exits. With `follow` set to `true`, the stream stays open until the process exits, and its last message reports the exit. To continue a stream that dropped, pass the `stdout_offset` and `stderr_offset` of the bytes that you already read.
   ```bash
   grpcurl -plaintext -H "kagent-sandbox-id: $SANDBOX_ID" \
     -d "{\"process_id\":\"$PROCESS_ID\",\"follow\":true}" \
     localhost:8083 ateenv.v1alpha.ProcessService/StreamProcessOutput
   ```

   Example output:
   ```json
   {
     "stdout": "eyJjb3VudCI6IDMsICJzdW0iOiAxMH0K"
   }
   {
     "exit": {
       "processId": "proc-122be2a77eec355d88547dc9",
       "command": [
         "python3",
         "-c",
         "import json; v = json.load(open(\"input.json\")); print(json.dumps({\"count\": len(v), \"sum\": sum(v)}))"
       ],
       "pid": 9,
       "state": "PROCESS_STATE_EXITED",
       "startedAt": "2026-11-18T21:13:08.251668463Z",
       "finishedAt": "2026-11-18T21:13:08.324095549Z"
     }
   }
   ```

   The output arrives in base64. Decoding the `stdout` value gives `{"count": 3, "sum": 10}`. The exit message has no `exitCode` field, because grpcurl omits a field that has its default value, and the default exit code is `0`. A process that fails reports its code, such as `"exitCode": 4`.

4. To check a process without streaming its output, call `GetProcess`.
   ```bash
   grpcurl -plaintext -H "kagent-sandbox-id: $SANDBOX_ID" \
     -d "{\"process_id\":\"$PROCESS_ID\"}" \
     localhost:8083 ateenv.v1alpha.ProcessService/GetProcess
   ```

5. Read a file back from the Sandbox. `ReadFile` streams the file in chunks, each in base64.
   ```bash
   grpcurl -plaintext -H "kagent-sandbox-id: $SANDBOX_ID" \
     -d '{"path":"input.json"}' \
     localhost:8083 ateenv.v1alpha.FileSystemService/ReadFile
   ```

   Example output:
   ```json
   {
     "chunk": "WzIsMyw1XQo="
   }
   ```

## Delete the Sandbox

Delete the Sandbox when the application has what it needs. Deletion removes the Sandbox's files and releases its compute immediately.

```bash
grpcurl -plaintext -d "{\"sandbox_id\":\"$SANDBOX_ID\"}" \
  localhost:8083 kagent.api.v1.SandboxService/DeleteSandbox \
  | jq -c '.sandbox | {state, operation}'
```

Example output:
```json
{"state":"RUNTIME_STATE_DELETED","operation":"RUNTIME_OPERATION_NONE"}
```

A deleted Sandbox stays deleted. Replaying the original `CreateSandbox` request with the same `request_id` fails with `FailedPrecondition`, rather than creating a new Sandbox. To start over, use a new `request_id`.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/about" >}}` title="About sandboxes" subtitle="Review the lifecycle, storage, and network rules that apply to every Sandbox." >}}
  {{< upstream >}}{{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Identity" subtitle="Choose how the controller authenticates the applications that call it." >}}{{< /upstream >}}
{{< /cards >}}
