---
title: Human in the loop
description: Pause an agent before it acts, return the request to a person, and resume the turn once the person answers.
weight: 50
author: kagent.dev
---

Some agents only answer questions, and those can run unattended. Others call tools that change a cluster, spend money, or read sensitive information. An agent that takes actions like those should get a person's approval first. The human in the loop (HITL) mechanism lets an agent stop mid-turn, return a question or a pending tool call to a person, and continue once that person answers.

A working HITL setup needs support from both the agent and the client. The agent must pause, which you configure by setting `requireApproval` on a tool binding in an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}. The client must support the Agent2Agent (A2A) human-in-the-loop extension, so that the client can present the request to a person and return the decision to the agent. A client without the extension still sees the agent stop, but cannot answer. Confirm that the client you plan to use supports the extension before you configure an agent to pause. For the clients that support the extension, see [Client support](#client-support).

## Pause lifecycle

A client opens every turn by telling the agent which optional A2A extensions it can handle. A client that requests the HITL extension on that message can answer a pause later in the turn. A client that does not request the extension still receives a reply when the turn finishes. When the agent stops for a person, that client does not receive a payload to answer.

The following diagram traces one turn in which the agent stops.

```mermaid
flowchart TB
    caller["Client sends a message and asks<br>to activate the HITL extension"]
    working["Agent works on the turn"]
    decision{"Does the agent need<br>a person?"}
    pause["Task state becomes<br>INPUT_REQUIRED"]
    request["Status message carries a<br>tool_approval_request<br>or ask_user_request"]
    answer["Client sends a response message<br>on the same task"]
    done["Agent finishes the turn"]

    caller --> working
    working --> decision
    decision -->|no| done
    decision -->|yes| pause
    pause --> request
    request --> answer
    answer --> working
```

The agent works until it either finishes the turn or needs a person. When it needs a person, the task moves to `INPUT_REQUIRED` and its status message carries either a `tool_approval_request` or an `ask_user_request`. The client answers by sending a response message on the same task, and the agent resumes the turn where it left off.

## Pause kinds

An agent pauses either to get permission before it acts or to ask a question. A tool approval and a question raise different requests, but both pause and resume in the same way. A client that handles one handles the other with a different payload.

| Request | Raised when | The client answers with |
| ------- | ----------- | ----------------------- |
| `tool_approval_request` | The agent wants to call a tool from a binding that sets `requireApproval`. | `tool_approval_response` |
| `ask_user_request` | The agent calls the built-in `ask_user` tool because it needs information that only a person has. | `ask_user_response` |

Every pause also adds a plain text part to its status message that states why the agent stopped. A client that never activated the extension receives that text and nothing else. The client can show a person why the agent stopped. The client does not have an `id` to answer with, so the task stays at `INPUT_REQUIRED`. Treat the text as a diagnostic, and send the turn again from a client that requests the extension. The `hint` field of an activated payload contains the same string.

The `kagent` harness composes this text from the pending calls. The wording depends on what the agent stopped for.

| Pause | Text |
| ----- | ---- |
| `ask_user` | The questions the agent asked, joined with `; `. |
| A tool pause whose tools supplied hints | The hints, followed by the tool names in parentheses, such as `Deleting this file requires approval (delete_file, restart_pod)`. |
| A tool pause with no hints | `Approval is required for tool(s): delete_file` |
| A pause that does not include a tool call | `Human input is required before the agent can continue.` |

The `codex` and `claude` harnesses compose the text differently. Both pass through the hint that Codex or Claude Code supplied with the request, so the wording comes from the coding agent rather than from kagent.

### Disable questions

When an agent runs unattended, nobody answers its question, so the task waits at `INPUT_REQUIRED`. To stop agents on the `kagent` harness from asking questions, set the `config.runtimeDefaults.builtinTools.disableAskUser` Helm value to `true`. The value removes the `ask_user` tool from every agent and subagent in the installation, and an AgentTemplate cannot override it. The value defaults to `false`.

```yaml
config:
  runtimeDefaults:
    builtinTools:
      disableAskUser: true
```

The value removes only the question tool. A binding that sets `requireApproval` still pauses the agent for approval, and a remote A2A agent that the agent calls can still pause the turn with its own question. The `codex` and `claude` harnesses do not read the value, because the coding agent supplies its own tools. A `byo` image decides whether to read it.

## Require approval for a tool

Approval is a property of a tool binding. For example, if you set `requireApproval` on an `mcp` tool binding in the AgentTemplate, the agent stops before each call to a tool that the binding exposes.

### Harness support

The Harness that runs an agent decides which pauses the agent can raise, and how precisely a binding can express approval.

| Harness | Tool approval | `ask_user` question | Splitting one server across two bindings |
| ------- | ------------- | ------------------- | ---------------------------------------- |
| `kagent` | Supported | Supported | Supported |
| `codex` | Supported | Supported | Rejected, with `RemoteMCPServer "<name>" is bound more than once`. |
| `claude` | Supported | Unsupported, because the upstream Claude Code tool that backed it was removed. A `claude` agent pauses for tool approval only. | Rejected, with `RemoteMCPServer "<name>" is bound more than once`. A binding whose tool selection kagent cannot verify against the server's discovered tools exposes the whole server and reports a warning. |
| `byo` | Decided by your image | Decided by your image | Not applicable |

kagent passes each binding's `requireApproval` setting to a `byo` image, and the image decides whether to honor it. The agent card for a `byo` Agent never declares the HITL extension, so a client cannot learn from the card that the agent pauses, even when the image implements the extension. For what else that card omits, see [Bring your own agent]({{< link path="agents/bring-your-own-agent#compare-byo-and-declarative-agents" >}}).

### Configure a binding

In the following AgentTemplate, the binding sets `requireApproval`, so the agent stops before it calls either Kubernetes tool.

```yaml
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: cluster-operator
  namespace: kagent
spec:
  tools:
    - mcp:
        server:
          kind: RemoteMCPServer
          name: kagent-tool-server
        tools:
          - k8s_delete_resource
          - k8s_patch_resource
        requireApproval: true
```

{{< reuse "kagent-docs/snippets/review-table.md" >}} For the rest of the binding's fields, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

| Field | Description |
| ----- | ----------- |
| `mcp.tools` | The names of the tools to bind. To bind every tool that the server offers, omit the list or leave it empty. |
| `mcp.requireApproval` | Pauses before each invocation of a tool that this binding exposes. The pause covers the tools in `mcp.tools`, or every tool on the server when `mcp.tools` is omitted or empty. To run the bound tools without approval, omit the field. |

Approval belongs to the binding rather than to the tool name, so one server can supply tools that require approval alongside tools that do not. Bind the tools that require approval in a binding that sets `requireApproval`, and bind the tools that do not in a second binding that omits it. The `codex` and `claude` harnesses reject a second binding to the same server. An agent on those harnesses applies one approval setting to every tool that the server offers.

> [!NOTE]
> kagent 0.x named the tools that needed approval in a `requireApproval` list on the `Agent` resource, which matched tool names across every server. In 1.x, approval is a property of one binding, so the same tool name can pause for one server and run freely for another.

A tool that no binding covers with `requireApproval` runs without a pause. These tools include every built-in tool, for example file access, shell, and web search, and every Model Context Protocol (MCP) tool on a binding that omits the field. The sandbox contains those calls. For more information, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}).

## Implement a client that supports human approval

HITL is an [A2A](https://a2a-protocol.org) message extension, identified by a versioned URI. The following sections follow a client through one pause, from the header that it sends to the response that it returns.

### Request the extension

A client requests the extension by setting the extension URI as the `A2A-Extensions` header on the call that sends a message.

```http
A2A-Extensions: https://kagent.dev/extensions/hitl/v1
```

kagent activates the extension only for calls that request it. kagent then echoes the activated URI back and attaches a structured pause payload only to an activated call. An agent's card declares the extension, so a client can discover HITL support before it sends anything.

A gRPC call names the {{< gloss "Agent" >}}Agent{{< /gloss >}} in the standard A2A `tenant` field, as `<namespace>/<name>`, and requests the extension through a header. Port-forward the controller's gRPC port first, as in [Install kagent]({{< link path="setup/installation" >}}).

```bash
grpcurl -plaintext \
  -H 'A2A-Extensions: https://kagent.dev/extensions/hitl/v1' \
  -d '{
    "tenant": "kagent/cluster-operator",
    "message": {
      "messageId": "msg-1",
      "role": "ROLE_USER",
      "parts": [{"text": "Delete the obsolete pod in the production namespace."}]
    }
  }' localhost:8083 lf.a2a.v1.A2AService/SendStreamingMessage
```

A message that omits both a `contextId` and a task ID starts a new {{< gloss "Session" >}}Session{{< /gloss >}}. To continue an existing one, set the message's `contextId` to the Session ID. Over HTTP, the URL path `/agents/{namespace}/{name}` selects the Agent instead, and no tenant is needed. For both transports, see [Call an agent over A2A]({{< link path="examples/a2a-agents" >}}).

> [!WARNING]
> A send that omits the header produces a pause that no one can answer. The turn still stops, and its status message states the question as prose, without `metadata` or a correlation `id`. The client therefore does not have anything to render or an `id` to answer with. Re-reading that task with the header does not recover the payload, because kagent never attached one. To prevent an unanswerable pause, send the header on every call. Sending it on a read is harmless, and missing it on a send cannot be undone.

### Read the pause

When the agent pauses, the task moves to `INPUT_REQUIRED`. The payload arrives in the status message's `metadata`, keyed by the extension URI. The message's `extensions` array lists the same URI. Each payload includes a `type` field that identifies its shape. kagent stores an attached payload with the task. A later read returns it whether or not that read requests the extension.

Each type travels in one direction. An agent raises a request, and a client answers with the matching response.

| Type | Direction |
| ---- | --------- |
| `tool_approval_request` | Agent to client |
| `ask_user_request` | Agent to client |
| `tool_approval_response` | Client to agent |
| `ask_user_response` | Client to agent |

### Approve or reject a tool

A `tool_approval_request` lists the pending calls, each with an `id`, the tool `name`, and the `args` that the agent chose. Present the pending calls to a person, then send one `tool_approval_response` that decides every call in the request.

```json
{
  "type": "tool_approval_response",
  "approvals": [
    { "id": "<tool-id>", "approved": true },
    { "id": "<other-tool-id>", "approved": false, "rejection_reason": "Deleting that namespace is out of scope." }
  ]
}
```

A rejection reason is optional. The agent receives the reason and can adjust its next action.

### Answer a question

An `ask_user_request` contains an `id` and a list of `questions`. The response echoes the same `id` and answers the questions in order.

```json
{
  "type": "ask_user_response",
  "id": "<request-id>",
  "answers": [
    { "answer": ["us-east-1"] }
  ]
}
```

> [!WARNING]
> Put the extension URI in the response message's `extensions` array as well as in its `metadata`. The `kagent` harness ignores a `metadata` payload that the array does not declare, and delivers the message as ordinary text. The task resumes and the agent replies, so the mistake is silent. The `codex` and `claude` harnesses reject the message with `tool approval response must declare https://kagent.dev/extensions/hitl/v1`.

## Resume a paused task

A paused task waits for the client to send a message that contains the response payload, on the same task and context. kagent rejects a resume attempt on a task that is not waiting.

While the task waits, kagent suspends the {{< gloss "Actor" >}}Actor{{< /gloss >}} to a durable {{< gloss "Snapshot" >}}snapshot{{< /gloss >}} in the same way as at the end of a turn. The snapshot keeps the durable volume and discards the running process. Each harness records the pending request in that volume and continues the turn when the answer arrives.

The `claude` harness resumes its deferred tool call. The `codex` harness runs the approved MCP call itself and continues with the result. The {{< gloss "Worker" >}}Worker{{< /gloss >}} is released in the meantime, so a task that waits at `INPUT_REQUIRED` does not consume pool capacity. The wait also survives the loss of the node. For more information, see [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume" >}}).

On the `codex` and `claude` harnesses, only one pending request survives the suspension. The `codex` harness cancels any other request along with the interrupted turn. The `claude` harness denies a protected call that arrives in a parallel batch, but a single remaining call can still pause for approval. If an approved call fails after it starts, the harness cannot resume the task. To continue the work, start a new Session.

The {{< gloss "Transcript" >}}transcript{{< /gloss >}} only grows, so the question and the answer both stay in the task history. A later reader can see what was asked and what a person decided.

## Task states

An A2A task moves through several states over its life. The following states mean that the task has stopped and is waiting.

| State | Meaning |
| ----- | ------- |
| `INPUT_REQUIRED` | The agent is waiting for a person. A tool approval or a question produces this state. |
| `AUTH_REQUIRED` | The agent is waiting for credentials. kagent's own harnesses never set this state. The gateway accepts a resume from it, so a `byo` image that produces it works. |

## Agents bound as tools

An agent that a parent binds as a tool can raise a pause of its own. The request then includes a `nested` block that identifies the subagent, along with its task and context. A client can therefore tell the person which agent is asking rather than attributing the question to the parent.

## Client support

The AgentTemplate decides that a turn pauses, and the client that raised the turn decides whether a person can answer it. To add support to a client of your own, see [Implement a client that supports human approval](#implement-a-client-that-supports-human-approval).

| Client | HITL |
| ------ | ---- |
| Your own A2A client | Full. Request the extension URI and handle every payload type. |
| An {{< gloss "MCP" >}}MCP{{< /gloss >}} client that supports tasks | Supported. The `invoke_session` tool returns a task, and input requests surface as MCP elicitations. |
| The kagent CLI | Not supported. `kagent agent invoke` does not request the extension, so a turn that pauses stays at `INPUT_REQUIRED` and the CLI cannot answer it. The CLI reports `Input required to continue this Session.` and stops there. Send the turn again from a client that requests the extension. |

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Bind the tools that an approval request would cover." >}}
  {{< card link=`{{< link path="agents/system-prompts" >}}` title="System prompts" subtitle="Tell an agent when to ask rather than act." >}}
{{< /cards >}}
