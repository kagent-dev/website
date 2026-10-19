---
title: Call an agent over A2A
description: Use the A2A service that the kagent controller serves to read an Agent's card, send it a message, and stream a reply.
weight: 30
author: kagent.dev
---

Every {{< gloss "Agent" >}}Agent{{< /gloss >}} is reachable over the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) protocol through the kagent controller. This example calls that service directly to read an Agent's card, send it a message, stream a reply, and answer the agent when it pauses for a person.

In {{< reuse "kagent-docs/snippets/name-product.md" >}}, agent traffic runs over A2A. The CLI and the [MCP server]({{< link path="examples/agents-via-mcp" >}}) reach an Agent through the same service.

This example uses [grpcurl](https://github.com/fullstorydev/grpcurl) to show the requests and replies directly. Real callers use an A2A client library rather than assembling requests by hand.

## About the kagent A2A service

The controller serves `lf.a2a.v1.A2AService` on port `8083`, alongside its REST API and its MCP endpoint. The kagent CLI reaches the same port and the same service.

A gRPC caller names the Agent in the standard A2A `tenant` field, as `<namespace>/<name>`, and the controller routes the call to that Agent. The same controller serves A2A over HTTP JSON-RPC, where the URL path selects the Agent instead:

| Transport | How a caller selects the Agent |
| --------- | ----------------------------- |
| gRPC | The `tenant` field on each request, as `<namespace>/<name>` |
| HTTP JSON-RPC | `POST /agents/{namespace}/{name}`, with the card at `GET /agents/{namespace}/{name}/.well-known/agent-card.json` |

An HTTP request that also sets the `tenant` field must set a value that matches its URL. There is no deployment-wide agent card, because the controller serves many Agents.

Both forms replace the `/api/a2a/<namespace>/<agent-name>/` URL paths that kagent 0.x served over HTTP.

A caller addresses the Agent rather than one conversation. The message's `contextId` selects the conversation. Omitting both a `contextId` and a task ID starts a new {{< gloss "Session" >}}Session{{< /gloss >}}, and repeating a `contextId` continues that Session.

{{< reuse "kagent-docs/snippets/examples/a2a-port-warning.md" >}}

### A2A methods

The following table covers the methods that this example uses. The `TaskPushNotificationConfig` calls manage a task's callbacks, and this example reaches them through the kagent CLI. For the further methods that `lf.a2a.v1.A2AService` defines, see the [A2A protocol specification](https://a2a-protocol.org/latest/specification/#31-core-operations).

| Method | What it does |
| ------ | ------------ |
| `GetExtendedAgentCard` | Returns the agent card describing the Agent. |
| `SendMessage` | Sends a message and returns the task after the agent either finishes the turn or pauses for a person. |
| `SendStreamingMessage` | Sends a message and streams events as the agent works. |
| `GetTask` | Reads a task that a previous call created. |
| `CancelTask` | Stops a task that is still running. |
| `CreateTaskPushNotificationConfig` | Adds or replaces a callback for a task that is still active. |
| `ListTaskPushNotificationConfigs` | Lists the active callbacks for one task. |
| `DeleteTaskPushNotificationConfig` | Removes a task callback. |

## Before you begin

{{< reuse "kagent-docs/snippets/grpcurl-prerequisites.md" >}}

## Read the agent card

An A2A client typically starts by reading the agent card, which tells it what the agent is and which protocol features the agent supports.

1. Fetch the card for your Agent.
   ```bash
   grpcurl -plaintext \
     -d '{"tenant":"'"$AGENT"'"}' \
     localhost:8083 lf.a2a.v1.A2AService/GetExtendedAgentCard
   ```

   Example output:
   ```json
   {
     "name": "my_first_agent",
     "description": "My first kagent agent",
     "supportedInterfaces": [
       {
         "url": "http://kagent-controller.kagent.svc:8083/agents/kagent/my-first-agent",
         "protocolBinding": "JSONRPC",
         "protocolVersion": "1.0"
       },
       {
         "url": "http://kagent-controller.kagent.svc:8083",
         "protocolBinding": "GRPC",
         "protocolVersion": "1.0",
         "tenant": "kagent/my-first-agent"
       }
     ],
     "version": "v1",
     "capabilities": {
       "streaming": true,
       "pushNotifications": true,
       "extensions": [
         {
           "uri": "https://kagent.dev/extensions/hitl/v1",
           "description": "Human in the loop for tool approval, ask user, and nested subagents"
         },
         {
           "uri": "https://kagent.dev/extensions/usage/v1",
           "description": "Task-lifetime token usage"
         }
       ],
       "extendedAgentCard": true
     },
     "defaultInputModes": ["text"],
     "defaultOutputModes": ["text"]
   }
   ```

2. Read the card for what a caller acts on.
   * Both `name` and `description` come from the {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}. `name` replaces hyphens with underscores, and `description` is `spec.description` verbatim, so a caller sees the description you wrote.
   * Each `supportedInterfaces` URL is the controller's in-cluster address rather than the Actor's, because a caller reaches the agent through the controller. The card advertises JSON-RPC first, then gRPC. The JSON-RPC URL identifies the Agent in its path. The gRPC entry sets the `tenant` value instead.
   * The `capabilities.pushNotifications` value advertises task callbacks. Each callback belongs to one task, not to the whole Session.
   * The `capabilities.extensions` list names the optional extensions that the agent supports. A client opts into the human-in-the-loop extension per call to answer pauses. With the usage extension, the agent reports the tokens that a task uses. For the payload, see [Read token usage](#read-token-usage).

> [!NOTE]
> The card carries no `skills`. kagent 0.x let you declare agent card skills in an `a2aConfig` block. However, v1alpha3 has no such field, so kagent generates the card from the AgentTemplate's name and description alone. An AgentTemplate's `spec.skills` field is a different feature: those are [Agent Skills]({{< link path="skills-and-mcp/skills" >}}) that the agent can use, not advertisements to a caller.

## Send a message

`SendMessage` blocks until the agent finishes the turn, or pauses to ask a person, and then returns the whole task. A message needs its own ID, a role, and at least one part.

A message part can also carry a file. Put the file's bytes in the part's `raw` field, which JSON encodes as base64, and set `filename` and `mediaType` on the same part.

> [!NOTE]
> Unlike the UI, which checks each file as you stage it, this path accepts any media type. A file whose media type is not text-like reaches the model as the note `[Uploaded file "report.pdf" (application/pdf) could not be read as text.]` instead of contents. The controller's gRPC server rejects any message over 16 MiB, framing included. For how files reach the model, and the file types and sizes that the UI accepts, see [Attach files to a message]({{< link path="observability/launch-ui#attach-files-to-a-message" >}}).

1. Send a message to the Agent. Omitting a `contextId` starts a new Session.
   ```bash
   grpcurl -plaintext \
     -d '{"tenant":"'"$AGENT"'","message":{"messageId":"'"$(uuidgen)"'","role":"ROLE_USER","parts":[{"text":"What is 7 times 6? Answer with just the number."}]}}' \
     localhost:8083 lf.a2a.v1.A2AService/SendMessage
   ```

   The reply text arrives in `artifacts`, not in `status`. Example output, with the message history omitted:
   ```json
   {
     "task": {
       "id": "01a06cfb-a9ae-7ddb-be98-baaf17414998",
       "contextId": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
       "status": {
         "state": "TASK_STATE_COMPLETED",
         "timestamp": "2026-09-04T15:13:52.990137169Z"
       },
       "artifacts": [
         {
           "artifactId": "01a06cfb-bf2c-70ea-8e65-e3ef15133a96",
           "parts": [{ "text": "42" }]
         }
       ],
       "history": [ ]
     }
   }
   ```
   The task returns two identifiers, `id` and `contextId`, and a caller uses them differently.
   * The `id` identifies one turn, and every message returns a new one.
   * The `contextId` identifies the conversation, and is the Session's own ID. A second message that repeats this `contextId` therefore continues the conversation rather than starting a new one.

   Task metadata uses the `kagent.dev/a2a/` namespace. An artifact carries `kagent.dev/a2a/timeline-position`, an RFC 3339 timestamp that orders task history, and the task itself carries `kagent.dev/a2a/task-created-at`. A runtime that reports per-event model usage publishes it as `kagent.dev/a2a/usage` on a task event rather than on the artifact. For task-lifetime usage, see [Read token usage](#read-token-usage).

2. Save the task's `id` and the conversation's `contextId`, so that later steps can read the task and continue the same Session.
   ```bash
   export TASK_ID=<your-task-id>
   export SESSION_ID=<your-context-id>
   ```

## Stream a reply

`SendStreamingMessage` takes the same request and returns a sequence of events instead of one result. A caller can then show a reply as the agent produces it.

1. Send a message on the streaming method.
   ```bash
   grpcurl -plaintext \
     -d '{"tenant":"'"$AGENT"'","message":{"messageId":"'"$(uuidgen)"'","contextId":"'"$SESSION_ID"'","role":"ROLE_USER","parts":[{"text":"Count from 1 to 3."}]}}' \
     localhost:8083 lf.a2a.v1.A2AService/SendStreamingMessage
   ```

2. Read the event sequence. The stream opens with the task at `TASK_STATE_SUBMITTED`, moves to `TASK_STATE_WORKING`, and then emits an artifact update for each chunk of the reply. Every chunk shares one `artifactId`, so a client appends them into a single artifact rather than treating each as a separate answer. Example output, abbreviated to the text of each event:
   ```console
   "state": "TASK_STATE_SUBMITTED"
   "state": "TASK_STATE_WORKING"
   "artifactId": "01a06cfd-1c3c-7e65-8650-2e86f5d7f5eb", "text": "1"
   "artifactId": "01a06cfd-1c3c-7e65-8650-2e86f5d7f5eb", "text": ","
   "artifactId": "01a06cfd-1c3c-7e65-8650-2e86f5d7f5eb", "text": " "
   "artifactId": "01a06cfd-1c3c-7e65-8650-2e86f5d7f5eb", "text": "2"
   ```

## Read a task later

A task outlives the call that created it, so a caller that lost its connection can read the result rather than asking the agent again.

1. Read the task by ID.
   ```bash
   grpcurl -plaintext \
     -d '{"tenant":"'"$AGENT"'","id":"'"$TASK_ID"'"}' \
     localhost:8083 lf.a2a.v1.A2AService/GetTask
   ```

2. Read the task's fields. `GetTask` returns the task itself, rather than wrapping it in a `task` field the way `SendMessage` does. The `status`, `artifacts`, and `history` values are the ones that the original call returned.
   ```json
   {
     "id": "01a06cfb-a9ae-7ddb-be98-baaf17414998",
     "contextId": "01a068e3-aeb6-7abc-8d6f-5ba9becd3143",
     "status": {
       "state": "TASK_STATE_COMPLETED",
       "timestamp": "2026-09-04T15:13:52.990137169Z"
     },
     "artifacts": [
       {
         "artifactId": "01a06cfb-bf2c-70ea-8e65-e3ef15133a96",
         "parts": [{ "text": "42" }]
       }
     ],
     "history": [ ]
   }
   ```
   
A task that is still running reports `TASK_STATE_WORKING` and has no artifacts yet. To stop a task that is still running, call `CancelTask` with the same `id`.

## Read token usage {#read-token-usage}

The `kagent` harness reports the model tokens that a task uses through the optional usage extension, `https://kagent.dev/extensions/usage/v1`. The agent card of an Agent on this harness advertises the extension. A `byo` image that is built with the Go or Python helper also reports usage, but the agent card does not advertise the extension. The `codex` and `claude` harnesses do not report usage.

1. Read a task that completed, paused for input, failed, or was canceled. Use the `GetTask` call from [Read a task later](#read-a-task-later).

2. In the task's `metadata` field, find the entry that is keyed by the usage extension URI.
   ```json
   "metadata": {
     "https://kagent.dev/extensions/usage/v1": {
       "inputTokens": 1000,
       "outputTokens": 150,
       "reasoningTokens": 40,
       "cachedInputTokens": 800,
       "totalTokens": 1190,
       "models": [
         {
           "model": "gpt-4o-2024-11-20",
           "inputTokens": 1000,
           "outputTokens": 150,
           "reasoningTokens": 40,
           "cachedInputTokens": 800,
           "totalTokens": 1190
         }
       ]
     }
   }
   ```

   Each count covers every model call in the task, not only the calls of the latest execution.

   | Field | Meaning |
   | ----- | ------- |
   | `inputTokens` | Prompt tokens sent to the model. |
   | `outputTokens` | Generated tokens, excluding reasoning tokens. |
   | `reasoningTokens` | Reasoning tokens, when the provider reports them. |
   | `cachedInputTokens` | Input tokens served from the provider's cache. This value is a subset of `inputTokens`. |
   | `totalTokens` | The provider-reported total, or `inputTokens + outputTokens + reasoningTokens` when a call does not return a total. |
   | `models` | The same counts per model, ordered by model name. The top-level totals also count calls that do not name a model, but `models` does not list those calls. |

   When a task pauses and resumes, use the latest payload instead of adding it to an earlier one. For a canceled task, the payload includes the model calls that completed before the cancellation. The runtime does not count a call that the cancellation cuts off before the provider sends its final response.

   If no model call returns token counts, the task metadata does not include the usage entry.

## Register task callbacks {#task-callbacks}

A task callback lets a webhook learn when a task needs input or reaches a final state. The callback receives a status update for future `INPUT_REQUIRED`, `AUTH_REQUIRED`, `COMPLETED`, `FAILED`, `CANCELED`, and `REJECTED` states. After the callback arrives, the receiver calls authenticated `GetTask` to read the current state and artifacts.

kagent keeps one pending delivery for each callback, and a newer state replaces a delivery that has not yet succeeded. When a task resumes, kagent discards the pending delivery for the state that the task left, so a receiver does not see every state.

The kagent CLI wraps the three push notification configuration methods, so the steps that follow use the CLI rather than building each request by hand. The CLI defaults to port 8083, which the prerequisites already forward.

1. To register a callback before a new task is dispatched, add `--push-url` to the kagent CLI invocation. The command returns immediately with the task ID and callback ID.
   ```bash
   kagent agent invoke \
     --session $SESSION_ID \
     --task "Run the long task." \
     --push-url https://receiver.example/callback \
     -o json
   ```

2. Save the task ID from the command output so that later steps can address the task.
   ```bash
   export PUSH_TASK_ID=<your-task-id>
   ```

3. To add a second callback to a task that is still active, create one explicitly. The server rejects new callbacks after the task reaches a terminal state.
   ```bash
   kagent agent session push create \
     $SESSION_ID $PUSH_TASK_ID \
     --id audit-webhook \
     --url https://receiver.example/callback
   ```

4. List the callbacks for the task.
   ```bash
   kagent agent session push list $SESSION_ID $PUSH_TASK_ID
   ```

5. Delete a callback that should no longer receive task updates.
   ```bash
   kagent agent session push delete $SESSION_ID $PUSH_TASK_ID audit-webhook
   ```

### Secure callback deliveries

A callback URL is a public endpoint that receives task state from kagent. Before you register a callback in production, decide how the receiver establishes that a delivery came from kagent.

> [!IMPORTANT]
> kagent signs deliveries only when the installation names a signing key, and `controller.push.signing.secretName` is empty by default. Until you set it, kagent posts each callback without an `Authorization` header, and the controller serves `404` at `/.well-known/jwks.json`. A receiver cannot distinguish an unsigned kagent delivery from any other caller, so treat the default configuration as suitable for a trusted network only.

kagent does not generate its own signing key, so you are responsible for creating the key, keeping it, and rotating it. The following steps turn signing on.

1. Generate an Ed25519 private key in unencrypted PKCS#8 PEM form.
   ```bash
   openssl genpkey -algorithm ed25519 -out private-key.pem
   ```

   > [!NOTE]
   > The `openssl` binary that ships with macOS is LibreSSL, which rejects this command with `Algorithm ed25519 not found`. Install OpenSSL 3, or generate the key on another machine.

2. Store the key in a Secret. kagent reads the `private-key.pem` entry, so the entry name is not optional.
   ```bash
   kubectl create secret generic kagent-push-signing -n kagent \
     --from-file=private-key.pem=private-key.pem
   ```

3. Name the Secret in `controller.push.signing.secretName`, and set `config.push.issuer` to a URL that reaches the controller. Use the Helm release name and version that you installed kagent with.
   ```bash
   helm upgrade kagent oci://ghcr.io/kagent-dev/kagent/helm/kagent \
     --namespace kagent --reuse-values \
     --set controller.push.signing.secretName=kagent-push-signing \
     --set config.push.issuer=https://kagent.example
   ```

   The issuer that a receiver trusts must match the host that it fetches the JWKS from. When you omit `config.push.issuer`, Helm derives it from `ui.externalUrl` and then from the in-cluster A2A gateway URL. Either fallback can name a host that does not serve the JWKS.

4. Confirm that the controller publishes a verification key. Before you set the Secret, this path returns `404`.
   ```bash
   curl -s http://localhost:8083/.well-known/jwks.json
   ```

   Example output, which carries the public key alone:
   ```json
   {"keys":[{"kty":"OKP","crv":"Ed25519","alg":"EdDSA","use":"sig","kid":"B1BP8zPNOTEGYyBUVgUAeTyA5hPlnrNc0OB416NY-CM","x":"xIc8dv_I-NrYSvWKg4aKm_X1CjHmiUBSMf9cDXEKesM"}]}
   ```

Receivers verify a signed delivery against the JSON Web Key Set (JWKS). The controller serves the path on the same port as its gRPC, A2A, and MCP endpoints, so a receiver outside of the cluster needs a stable HTTPS URL that routes to the controller. The UI does not proxy the path, so publishing only the UI leaves a receiver with no key to verify against.

Receivers must not send a token or credential when they register a callback. kagent signs each delivery attempt with a fresh five-minute JWT whose audience is the exact callback URL, including the query string. Before you acknowledge the request with a 2xx response, verify the JWT signature, issuer, audience, expiry, and `taskId` claim. The `taskId` claim repeats the `statusUpdate.taskId` value in the body, so a receiver that compares them rejects a token replayed against a different task.

By default, callback URLs must use HTTPS. Callback URLs must not resolve to private, loopback, link-local, unspecified, or multicast addresses. To reach a test receiver inside the cluster, set `config.push.allowHttp=true` or `config.push.allowPrivateNetworks=true`. kagent does not follow redirects, and failed attempts are retried from the database-backed queue.

## When an agent needs a person

An agent can stop mid-task to ask a question or to request approval for a tool call. The task then reports `TASK_STATE_INPUT_REQUIRED` and waits until a caller answers it. Every kagent agent can raise the question kind, because the runtime gives each one a built-in `ask_user` tool, so a system prompt that tells an agent to ask before it answers is enough to see a pause.

Answering a pause needs the human-in-the-loop extension, which a caller requests per call. The extension is a versioned URI, and a request names it in two places: the `A2A-Extensions` header, and the message's own `extensions` list.

1. Send a message that requests the extension.
   ```bash
   grpcurl -plaintext \
     -H "A2A-Extensions: https://kagent.dev/extensions/hitl/v1" \
     -d '{"tenant":"'"$AGENT"'","message":{"messageId":"'"$(uuidgen)"'","role":"ROLE_USER","extensions":["https://kagent.dev/extensions/hitl/v1"],"parts":[{"text":"Should I increase the replica count?"}]}}' \
     localhost:8083 lf.a2a.v1.A2AService/SendMessage
   ```

2. Read the pause. The task stops at `TASK_STATE_INPUT_REQUIRED`, and the status message's `metadata` holds the request, keyed by the extension URI. Example output:
   ```json
   {
     "task": {
       "id": "01a0828d-6bc4-700a-b27e-9115b3174827",
       "status": {
         "state": "TASK_STATE_INPUT_REQUIRED",
         "message": {
           "parts": [{ "text": "Which environment do you mean for increasing the replica count?" }],
           "metadata": {
             "https://kagent.dev/extensions/hitl/v1": {
               "type": "ask_user_request",
               "id": "adk-823f48ab-4a0b-4652-a23f-e9db9724d35f",
               "questions": [
                 {
                   "question": "Which environment do you mean for increasing the replica count?",
                   "choices": ["development", "staging", "production"],
                   "multiple": false
                 }
               ]
             }
           },
           "extensions": ["https://kagent.dev/extensions/hitl/v1"]
         }
       }
     }
   }
   ```

3. Save the task ID, the conversation's `contextId`, and the request `id` to environment variables. The request `id` is within the extension metadata and starts with `adk-`.
   ```bash
   export PAUSED_TASK_ID=<your-task-id>
   export PAUSED_SESSION_ID=<your-context-id>
   export REQUEST_ID=<your-request-id>
   ```

4. Answer on the same task. The response goes in the same metadata key, names the request `id` it answers, and sets `taskId` so that it answers the paused task rather than starting a new turn.
   ```bash
   grpcurl -plaintext \
     -H "A2A-Extensions: https://kagent.dev/extensions/hitl/v1" \
     -d '{"tenant":"'"$AGENT"'","message":{"messageId":"'"$(uuidgen)"'","taskId":"'"$PAUSED_TASK_ID"'","contextId":"'"$PAUSED_SESSION_ID"'","role":"ROLE_USER","extensions":["https://kagent.dev/extensions/hitl/v1"],"parts":[{"text":"staging"}],"metadata":{"https://kagent.dev/extensions/hitl/v1":{"type":"ask_user_response","id":"'"$REQUEST_ID"'","answers":[{"answer":["staging"]}]}}}}' \
     localhost:8083 lf.a2a.v1.A2AService/SendMessage
   ```

   The agent resumes where it paused and finishes the turn. Example output:
   ```console
   "state": "TASK_STATE_COMPLETED"
   "text": "For the staging environment, I recommend increasing the replica count to ensure better load distribution and fault tolerance during testing."
   ```

> [!IMPORTANT]
> A caller that does not request the extension is still interrupted. The task stops at `TASK_STATE_INPUT_REQUIRED` exactly as before, and the question arrives as ordinary text on the status message, but the metadata does not include a request `id`. Without that `id` there is nothing to answer, so the task waits until something cancels it. Request the extension on any call to an agent that can pause.

A tool approval works the same way with a different payload, `tool_approval_request` answered by `tool_approval_response`. For the pause kinds, the approval model, and what a nested agent's pause looks like, see [Human in the loop]({{< link path="agents/human-in-the-loop" >}}).

## Clean up

* This example does not create Kubernetes resources, so you have nothing to delete.
* You can stop the 8083 port-forward for the kagent-controller service with `Ctrl+C`.
* The tasks that your messages created stay on the Session as part of its conversation, and deleting the Session removes them.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/agents-via-mcp" >}}` title="Use agents from an MCP client" subtitle="Reach the same agents through MCP instead, from Claude Code or Cursor." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Handle an agent that pauses to ask a question or request approval." >}}
  {{< card link=`{{< link path="observability/tracing" >}}` title="Tracing" subtitle="Follow one A2A call from the controller through to the Actor that served it." >}}
{{< /cards >}}
