---
title: Your first MCP tool
description: Give an agent a Model Context Protocol tool by binding an MCP server to its AgentTemplate.
weight: 20
author: kagent.dev
---

A system prompt tells an agent how to behave. Tools tell it what it can do. This guide binds a {{< gloss "Model Context Protocol" >}}Model Context Protocol{{< /gloss >}} (MCP) tool to the agent that you built in [Your first agent]({{< link path="get-started/your-first-agent" >}}), so that the agent can read live data out of your cluster instead of answering from the model alone. For the full {{< gloss "Tool binding" >}}tool binding{{< /gloss >}} schema, including binding one agent as another agent's tool, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}).

## Before you begin

1. Complete [Your first agent]({{< link path="get-started/your-first-agent" >}}). This guide edits the `my-first-agent` AgentTemplate that the agent guide creates, so keep that AgentTemplate and the `my-first-harness` Harness in place.

2. Confirm that you have the kagent CLI and [`jq`](https://jqlang.org/download/) installed.

## Bind the tool to your AgentTemplate

kagent ships an MCP server of its own, and installs a `RemoteMCPServer` that points at it, so the built-in server is the shortest path to a working tool. An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} takes tools through an `mcp` binding, which names one server and, optionally, the tools to take from it. This guide names the tools specifically, so that the agent gets only the two tools it needs rather than the server's whole catalog.

kagent records what it discovered on the server's status, so the tool names come from the cluster. This guide binds `k8s_get_resources` and `k8s_get_pod_logs`. For the full catalog that the built-in server serves, see the [tools ecosystem reference]({{< link path="reference/tools-ecosystem" >}}).

1. List the {{< gloss "RemoteMCPServer" >}}RemoteMCPServers{{< /gloss >}} in the `kagent` namespace.
   ```bash
   kubectl get remotemcpserver -n kagent
   ```

   Example output: The `ACCEPTED` column reports whether kagent reached the server and read its catalog. No tool can be bound from a server that is not `True`.
   ```console
   NAME                 PROTOCOL          URL                                   ACCEPTED   AGE
   kagent-tool-server   STREAMABLE_HTTP   http://kagent-tools.kagent:8084/mcp   True       14m
   ```

   To see the tools that the server offers, read the discovered set from its status.
   ```bash
   kubectl get remotemcpserver kagent-tool-server -n kagent \
     -o jsonpath='{range .status.discoveredTools[*]}{.name}{"\t"}{.description}{"\n"}{end}'
   ```

   > [!NOTE]
   > The built-in server is installed only when the `kagent-tools.enabled` Helm value is `true`, which is the default. If the command returns no resources, either re-install with that value enabled, or use your own server as described in [Bind your own MCP server](#bind-your-own-mcp-server).

2. Re-apply the `my-first-agent` AgentTemplate with a `spec.tools` list and a system prompt that tells the model what the tools are for.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: my-first-agent
     namespace: kagent
     labels:
       kagent.dev/harness: my-first-harness
   spec:
     description: My first kagent agent
     modelConfig:
       name: default-model-config
     systemPrompt: |-
       You are a concise, helpful assistant with read access to a Kubernetes cluster.
       Use your tools to answer questions about what is running in the cluster.
       When a question cannot be answered from the tools that you have, say so.
     tools:
       - mcp:
           server:
             kind: RemoteMCPServer
             name: kagent-tool-server
           tools:
             - k8s_get_resources
             - k8s_get_pod_logs
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `mcp.server.kind` | The kind of server resource. `RemoteMCPServer` is the only accepted value. |
   | `mcp.server.name` | The server's name. A binding resolves in the AgentTemplate's own namespace, so it cannot reach a server in another namespace. |
   | `mcp.tools` | Optional. The names of the tools to bind, up to 50. An omitted or empty list exposes every tool on the server. An AgentTemplate takes at most 50 bindings in total. |

3. Confirm that kagent compiled a new {{< gloss "Revision" >}}revision{{< /gloss >}} for the edited AgentTemplate. Every edit produces a new desired revision, and the pair is current when the latest successful revision matches it.
   ```bash
   kubectl get agenttemplate my-first-agent -n kagent \
     -o jsonpath='{range .status.harnesses[*]}{.harness}{"\t"}{.desiredRevision}{"\t"}{.latestSuccessfulRevision}{"\n"}{end}'
   ```

   Example output:
   ```console
   my-first-harness	7c1f9a2b4e8d3f60a5b7c9e1d2f4a6b8c0d2e4f68a9b1c3d5e7f9a1b3c5d7e9f	7c1f9a2b4e8d3f60a5b7c9e1d2f4a6b8c0d2e4f68a9b1c3d5e7f9a1b3c5d7e9f
   ```

   When the two values differ, kagent is still compiling, or compilation failed. A binding that names a RemoteMCPServer that does not exist in the namespace fails at the `ResolvedRefs` condition with the reason `ReferenceResolutionFailed`.

   > [!WARNING]
   > kagent resolves the server, but it does not check the tool names against the tools that the server actually serves. A misspelled tool name compiles into a ready revision, and the only symptom is an agent that never calls the tool that you expected. If a bound tool appears to be missing, check the spelling against the server's catalog.

## Create an AgentInstance that has the tool

An {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} runs the revision that it was created from, and keeps running that revision for its whole life. The instance from the agent guide still runs the revision without tools, so create a second instance to pick up the binding.

1. Create a second AgentInstance from the same Harness and AgentTemplate pair. The command is the one that you ran in the agent guide, but the pair has a newer revision now, so this instance picks up the tools.
   ```bash
   kagent create agent-instance --harness my-first-harness --agent-template my-first-agent
   ```

   Example output:
   ```console
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | ID                                   | AGENT TEMPLATE | HARNESS          | STATE | CREATED              |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   | 0198c4e2-8b3f-7d45-a1c6-9e2f4b8d6a03 | my-first-agent | my-first-harness | READY | 2026-08-31T16:20:38Z |
   +--------------------------------------+----------------+------------------+-------+----------------------+
   ```

2. Save the new AgentInstance's ID to an environment variable.
   ```bash
   export TOOL_INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "my-first-agent")] | sort_by(.createdAt) | last | .id')
   echo $TOOL_INSTANCE_ID
   ```

3. Ask the agent something that it can answer only by calling a tool.
   ```bash
   kagent invoke --agent-instance $TOOL_INSTANCE_ID --task "Which pods are running in the kagent namespace?"
   ```

   The agent calls `k8s_get_resources` and answers from the result rather than from the model's own knowledge.

4. Ask a follow-up question that uses the second tool. The AgentInstance holds the {{< gloss "Transcript" >}}transcript{{< /gloss >}} of the conversation, so the agent can act on the pods that it just listed.
   ```bash
   kagent invoke --agent-instance $TOOL_INSTANCE_ID --task "Show me the last few log lines from the kagent controller pod."
   ```

## Bind your own MCP server

A `RemoteMCPServer` points at any MCP server that the cluster can reach, whether it runs in the cluster or outside it. Create one, then bind it in the same way that you bound the built-in server.

1. Apply a `RemoteMCPServer` for your own server.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: RemoteMCPServer
   metadata:
     name: my-mcp-server
     namespace: kagent
   spec:
     description: An MCP server of my own.
     url: http://my-mcp-server.my-namespace:3000/mcp
     protocol: STREAMABLE_HTTP
     timeout: 30s
   EOF
   ```

   | Field | Description |
   | ----- | ----------- |
   | `description` | A short description of the server. This field is required. |
   | `url` | The address of the server's MCP endpoint. |
   | `protocol` | The transport to use, either `STREAMABLE_HTTP` or `SSE`. Defaults to `STREAMABLE_HTTP`. |
   | `timeout` | How long to wait on a request to the server. Defaults to `30s`. |
   | `headersFrom` | Headers to send with each request, sourced from a Secret or ConfigMap. Use this field for a server that requires an API key. |
   | `allowedNamespaces` | Which namespaces may reference this server. Defaults to the server's own namespace. |
   | `tls` | Trust settings for an HTTPS upstream whose certificate the agent does not already trust. Setting this field alongside an `http://` URL is rejected. |

2. Add a second binding to the AgentTemplate's `spec.tools` list, naming the new server and the tools to take from it.
   ```yaml
   tools:
     - mcp:
         server:
           kind: RemoteMCPServer
           name: kagent-tool-server
         tools:
           - k8s_get_resources
           - k8s_get_pod_logs
     - mcp:
         server:
           kind: RemoteMCPServer
           name: my-mcp-server
         tools:
           - my_tool
   ```

3. Create another AgentInstance to run the revision that includes the new binding.

## Clean up

> [!IMPORTANT]
> Leave the Harness, AgentTemplate, and AgentInstances in place. Other guides build on them, and [Your first agent]({{< link path="get-started/your-first-agent#clean-up" >}}) covers removing them when you are finished with the kagent guides. Leave `kagent-tool-server` in place as well, because the kagent installation owns it.

If you created a RemoteMCPServer of your own in [Bind your own MCP server](#bind-your-own-mcp-server), delete it.

```bash
kubectl delete remotemcpserver my-mcp-server -n kagent
```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Read the full tool binding schema, including binding one agent as another agent's tool." >}}
  {{< card link=`{{< link path="skills-and-mcp/skills" >}}` title="Skills" subtitle="Give your agent capabilities that no MCP server provides." >}}
  {{< card link=`{{< link path="examples/agent-substrate" >}}` title="Agent Substrate" subtitle="Watch your agent's Actor suspend between turns, then checkpoint and fork the conversation." >}}
{{< /cards >}}
