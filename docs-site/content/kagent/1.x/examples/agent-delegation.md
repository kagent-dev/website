---
title: Delegate work to another agent
description: Bind one AgentTemplate to another as a subagent tool, and watch a front-line agent hand a conversation to a specialist.
weight: 50
author: kagent.dev
---

An {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} can bind another AgentTemplate as a tool, so that a general agent passes work to a specialist instead of answering itself. This example builds a front-line incident agent with two specialists behind it, and shows what a caller sees when a hand-off happens.

For the binding fields and the rules that constrain a tree, see [About tools]({{< link path="skills-and-mcp/about-tools" >}}). For the Harness that all of these templates run on, see [Agent harness]({{< link path="agents/agent-harness" >}}).

## About subagent bindings

A binding names a second AgentTemplate in the same namespace and describes when to use it.

> [!IMPORTANT]
> **A subagent binding hands over the conversation rather than returning an answer.** kagent compiles the binding into a subagent of the parent and runs the whole tree in one Actor, so the parent's model can transfer the turn to it. Once that happens, the bound agent answers, and it keeps answering the turns that follow in the same conversation. The parent does not receive the bound agent's output and cannot summarize it or combine it with a second agent's. Plan a tree around routing a conversation to the right specialist, rather than around a coordinator that collects results.

Every field is required. For the complete schema, see the [API reference]({{< link path="reference/api-ref#subagenttoolbinding" >}}).

| Field | Description |
| ----- | ----------- |
| `tools[].subAgent.name` | The name that the parent's model sees for this binding. It replaces the bound template's own name. |
| `tools[].subAgent.description` | What the binding is for. The parent's model reads this to decide when to hand work over, so it does the same job that a tool description does. |
| `tools[].subAgent.templateRef.name` | The AgentTemplate to bind, in the same namespace. |

> [!NOTE]
> Dedicated subagents, which would give a bound agent its own {{< gloss "Actor" >}}Actor{{< /gloss >}}, sandbox, and Session, are not part of the served API. The `subAgent.agentRef` field that would select one is deferred until a dedicated subagent can create and invoke its own Session.

Every template in the tree is an ordinary AgentTemplate, and only the coordinator needs an {{< gloss "Agent" >}}Agent{{< /gloss >}}. A bound template compiles under the coordinator's Agent and its Harness, so the specialists need neither an Agent nor a Harness reference of their own.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), so that you have a Harness to pair with. This example uses a Harness named `my-first-harness` in the `kagent` namespace.

## Create specialist agents

Apply two ordinary AgentTemplates. Nothing marks them as bound, because a template does not know that something binds it.

1. Create the specialists. Each system prompt makes its replies recognizable so that you can tell which agent answered.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: incident-researcher
     namespace: kagent
   spec:
     description: Gathers evidence about an incident.
     modelConfig:
       name: default-model-config
     systemPrompt: |
       You research incidents. Given a symptom, list at most three concrete
       things to check, and label your reply "RESEARCHER:".
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: incident-reviewer
     namespace: kagent
   spec:
     description: Reviews a conclusion for unsupported claims.
     modelConfig:
       name: default-model-config
     systemPrompt: |
       You review incident conclusions. Point out any claim that the evidence
       does not support, and label your reply "REVIEWER:".
   EOF
   ```

2. Confirm that both templates exist. An AgentTemplate carries no status of its own, because the Agent that pairs it with a Harness owns readiness.
   ```bash
   kagent agent template list
   ```

   Example output:
   ```console
   +----------------------+----------------------+
   | NAME                 | CREATED              |
   +----------------------+----------------------+
   | incident-researcher  | 2026-09-08T20:22:33Z |
   | incident-reviewer    | 2026-09-08T20:22:33Z |
   +----------------------+----------------------+
   ```

## Bind specialists to a front-line agent

Each binding renames the specialist that it points to, so the coordinator's system prompt names a researcher and a reviewer rather than `incident-researcher` and `incident-reviewer`. One Session on the coordinator's Agent then runs the whole tree, and the specialists never need Agents of their own.

1. Create the agent that routes work, binding both specialists under `tools`.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: api.kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: incident-coordinator
     namespace: kagent
   spec:
     description: Routes an incident to the right specialist.
     modelConfig:
       name: default-model-config
     systemPrompt: |
       You triage incidents. Hand a request for evidence to the researcher,
       and a request to check a conclusion to the reviewer.
     tools:
     - subAgent:
         name: researcher
         description: Research the available evidence before conclusions are drawn.
         templateRef:
           name: incident-researcher
     - subAgent:
         name: reviewer
         description: Review a proposed conclusion for unsupported claims.
         templateRef:
           name: incident-reviewer
   ---
   apiVersion: api.kagent.dev/v1alpha3
   kind: Agent
   metadata:
     name: incident-coordinator
     namespace: kagent
   spec:
     templateRef:
       name: incident-coordinator
     harnessRef:
       name: my-first-harness
   EOF
   ```

2. Confirm that the coordinator compiled. Binding a template that binds another, or introducing a cycle, fails here rather than at run time.
   ```bash
   kubectl get agent incident-coordinator -n kagent \
     -o jsonpath='{range .status.conditions[?(@.type=="Ready")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Ready ActorTemplate golden snapshot is ready
   ```

3. Create a Session on the coordinator's Agent, and save its ID.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent incident-coordinator -o json | jq -r '.session.id')
   echo $SESSION_ID
   ```

## Watch the hand-off

1. Send a request that matches one specialist's description.
   ```bash
   kagent agent invoke --session $SESSION_ID \
     --task "The checkout service is returning 503s. Investigate."
   ```

   The reply comes back from the researcher, in the researcher's own voice, rather than from the coordinator. Example output:
   ```console
   RESEARCHER: To investigate the checkout service returning 503 errors, check these three concrete things:

   1. Service Health and Resource Usage: Verify if the checkout service instances are running properly...
   2. Dependency Status: Confirm that all external services or databases that the checkout service depends on...
   3. Load and Traffic Patterns: Look for an unusual spike in requests...
   ```

2. Send a second message, and note which agent answers it.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "Who are you? Answer with just your label."
   ```

   Example output:
   ```console
   RESEARCHER
   ```

   The conversation stayed with the researcher. A hand-off is not scoped to one turn: the specialist that took the conversation keeps it. To reach a different specialist, start a new conversation by creating a second Session on the coordinator's Agent.

## Clean up

1. Delete the Session.
   ```bash
   kagent agent session delete $SESSION_ID
   ```

2. Delete the Agent, then the three AgentTemplates, starting with the coordinator.
   ```bash
   kubectl delete agent incident-coordinator -n kagent
   kubectl delete agenttemplate incident-coordinator -n kagent
   kubectl delete agenttemplate incident-researcher incident-reviewer -n kagent
   ```

   > [!NOTE]
   > Deleting a bound specialist while the coordinator still binds it breaks the coordinator rather than the specialist. Its `ResolvedRefs` condition reports `resolve AgentTemplate "incident-researcher": not found`, and `Compatible` and `Ready` both report `blocked by ResolvedRefs`. Recreating the specialist, or removing the binding, clears it.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="skills-and-mcp/about-tools" >}}` title="About tools" subtitle="Read the binding fields and the rules that constrain a subagent tree." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Understand the Harness that every template in the tree runs on." >}}
  {{< card link=`{{< link path="examples/a2a-agents" >}}` title="Call an agent over A2A" subtitle="Reach the same agents directly, and see what a hand-off looks like on the wire." >}}
{{< /cards >}}
