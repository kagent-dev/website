---
title: Block PII in an agent's model requests
description: Add a prompt guard to an agentgateway model so that a prompt carrying personally identifiable information never reaches the provider.
weight: 80
author: kagent.dev
---

An agent sends every turn of a conversation to a model provider, and each of those requests carries whatever the person typed, personally identifiable information (PII) included. When agentgateway routes that traffic, the gateway sees each request before the provider does, so you can inspect and stop a prompt at the gateway. This example adds a prompt guard to the model that an agent calls, then watches the gateway reject a prompt that carries an email address.

This guide builds on the routing configured in [Agentgateway model routing]({{< link path="setup/model-providers/byo-agentgateway#set-up-agentgateway-model-routing" >}}), including extending the `AgentgatewayModel` and the {{< gloss "ModelConfig" >}}ModelConfig{{< /gloss >}} that those steps create.

## About prompt guards on a model

A prompt guard inspects the body of an OpenAI-compatible request as the request passes through the gateway, and either rejects the request or masks the matched text. Because the guard runs at the gateway, no change to an {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} is needed, and every agent that shares the model inherits the guard.

A guard can live in two places, and the choice follows the routing that you already use:

- **On the `AgentgatewayModel`**, under `spec.policies.promptGuard`. The guard applies to that one model, and no other resource is involved. This example uses this form, because [agentgateway model routing]({{< link path="setup/model-providers/byo-agentgateway#set-up-agentgateway-model-routing" >}}) attaches models straight to a `Gateway` listener.
- **On an `AgentgatewayPolicy`** that targets an `HTTPRoute`. An `AgentgatewayPolicy` cannot name an `AgentgatewayModel` in its `targetRefs`, so this form requires the model to attach to an HTTPRoute rather than to the listener. For more information about this variant, see [Attach the guard to a route instead](#attach-the-guard-to-a-route-instead).

The following `AgentgatewayModel` carries the guard that the rest of this example applies.

```yaml
apiVersion: agentgateway.dev/v1alpha1
kind: AgentgatewayModel
metadata:
  name: gpt-4o-mini
  namespace: agentgateway-system
spec:
  parentRefs:
  - group: gateway.networking.k8s.io
    kind: Gateway
    name: agentgateway-proxy
    sectionName: http
  provider: OpenAI
  policies:
    auth:
      secretRef:
        name: openai-key
    promptGuard:
      request:
      - regex:
          builtins:
          - Email
          - Ssn
          - CreditCard
          action: Reject
        response:
          message: The prompt contained personally identifiable information.
```

Only `policies.promptGuard` is new in this example. The routing fields and `policies.auth` come from the prerequisite setup, and they appear here because a reapply must carry them.

| Field | Description |
| ----- | ----------- |
| `parentRefs` and `provider` | Route the model to a `Gateway` listener, and name the provider that agentgateway calls. |
| `policies.auth` | The Secret holding the credentials that agentgateway uses to reach the provider. |
| `policies.promptGuard.request[]` | The guards to apply to requests that the agent sends. Each entry sets exactly one guard kind: `regex` matches patterns in the gateway itself, while `webhook`, `openAIModeration`, `bedrockGuardrails`, and `googleModelArmor` hand the content to an external service instead. A separate `response` list guards what the provider sends back. |
| `regex.builtins` | Built-in patterns for common kinds of PII. The five values are `Email`, `Ssn`, `CreditCard`, `PhoneNumber`, and `CaSin`. To add your own patterns, use `regex.matches`, which holds a list of regular expressions and is additive with `builtins`. |
| `regex.action` | What to do with a match, one of `Mask`, `Reject`, and `Audit`. Omit to default to `Mask`, which is also the safer choice for an agent. `Audit` records the action that the guard would have taken and lets the content through, so use it to trial a guard before you enforce it. A `Reject` guard ends the conversation permanently, for the reason described in [Mask instead of reject](#mask-instead-of-reject). |
| `response.message` | The message that the gateway returns to the caller on a rejection. Omit to default to `The request was rejected due to inappropriate content`. A sibling `response.statusCode` field sets the status code, and defaults to `403`. |

> [!IMPORTANT]
> **A request guard inspects the system prompt as well as the messages.** The default scope is `SystemPrompt` and `Messages`, so an AgentTemplate whose `systemPrompt` contains an example email address fails every turn rather than only the turns where a person types one. Check the system prompts of the agents that share a model before you turn on `Reject`.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}), and [create your first agent]({{< link path="get-started/your-first-agent" >}}) so that you have a {{< gloss "Harness" >}}Harness{{< /gloss >}} and know which label it admits. This example uses a Harness named `my-first-harness` that admits the label `kagent.dev/harness: my-first-harness`.

2. Set up [agentgateway model routing]({{< link path="setup/model-providers/byo-agentgateway#set-up-agentgateway-model-routing" >}}), which installs agentgateway with `--set agentgatewayModels.enabled=true` and creates a `Gateway` named `agentgateway-proxy` and an `AgentgatewayModel` named `gpt-4o-mini`.

3. Create the [ModelConfig]({{< link path="setup/model-providers/byo-agentgateway#create-the-modelconfig" >}}) that points at the gateway. This example uses a ModelConfig named `agentgateway-model-config` in the `kagent` namespace, and the deployment that it reaches enforces no API key authentication.

## Add the prompt guard to the model

Adding `promptGuard` to a model that already routes traffic changes nothing about the routing, so you reapply the same resource with the guard attached. Keep `policies.auth` in the resource that you reapply, because an apply replaces `policies` wholesale. A model that loses its `auth` is still accepted and programmed, and every request through it returns the provider's own `401`.

1. Reapply the `AgentgatewayModel` with a request guard that rejects three kinds of PII.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: agentgateway.dev/v1alpha1
   kind: AgentgatewayModel
   metadata:
     name: gpt-4o-mini
     namespace: agentgateway-system
   spec:
     parentRefs:
     - group: gateway.networking.k8s.io
       kind: Gateway
       name: agentgateway-proxy
       sectionName: http
     provider: OpenAI
     policies:
       auth:
         secretRef:
           name: openai-key
       promptGuard:
         request:
         - regex:
             builtins:
             - Email
             - Ssn
             - CreditCard
             action: Reject
           response:
             message: The prompt contained personally identifiable information.
   EOF
   ```

2. Confirm that agentgateway accepted the model. A guard that fails validation leaves the model unaccepted, and the gateway keeps serving the previous configuration.
   ```bash
   kubectl get agentgatewaymodel gpt-4o-mini -n agentgateway-system \
     -o jsonpath='{range .status.parents[0].conditions[?(@.type=="Accepted")]}{.status} {.reason} {.message}{end}'
   ```

   Example output:
   ```console
   True Accepted Successfully accepted AgentgatewayModel
   ```

## Watch the gateway reject a prompt

Two paths are worth checking in order. Calling the gateway directly isolates the guard from anything that kagent does, and sending the same content through an agent then shows what a person talking to the agent experiences.

1. Reach the gateway. Choose the tab that matches your cluster.

   {{< tabs >}}
   {{% tab name="Cloud Provider LoadBalancer" %}}
   ```bash
   export AGENTGATEWAY_ADDRESS=$(kubectl get svc -n agentgateway-system agentgateway-proxy -o jsonpath="{.status.loadBalancer.ingress[0]['hostname','ip']}")
   echo $AGENTGATEWAY_ADDRESS
   ```
   {{% /tab %}}
   {{% tab name="Port-forward for local testing" %}}
   ```bash
   kubectl port-forward -n agentgateway-system service/agentgateway-proxy 8080:80
   export AGENTGATEWAY_ADDRESS=localhost:8080
   ```
   {{% /tab %}}
   {{< /tabs >}}

2. Send a prompt that contains an email address.
   ```bash
   curl -i http://$AGENTGATEWAY_ADDRESS/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Summarize the ticket from alex@example.com"}]}'
   ```

   The gateway returns the status code and message from the guard, and the provider never receives the request. Example output:
   ```console
   HTTP/1.1 403 Forbidden

   The prompt contained personally identifiable information.
   ```

3. To confirm that ordinary traffic still reaches the provider, send a prompt that carries no PII.
   ```bash
   curl -i http://$AGENTGATEWAY_ADDRESS/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Summarize the most recent ticket"}]}'
   ```

   The response is an ordinary completion. Example output, truncated:
   ```console
   HTTP/1.1 200 OK
   content-type: application/json

   {"model":"gpt-4o-mini-2024-07-18","usage":{"prompt_tokens":14,"completion_tokens":33,...},"choices":[{"message":{"content":"I'm sorry, but I don't have access to specific ...
   ```

4. Create an agent that uses the guarded model, and an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} to talk to it.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: support-triage
     namespace: kagent
     labels:
       kagent.dev/harness: my-first-harness
   spec:
     description: Summarizes support tickets.
     modelConfig:
       name: agentgateway-model-config
     systemPrompt: |
       You summarize support tickets in two sentences.
   EOF
   kagent create agent-instance --harness my-first-harness --agent-template support-triage
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "support-triage")] | sort_by(.createdAt) | last | .id')
   echo $INSTANCE_ID
   ```

5. Send the agent a task that carries an email address.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "Summarize the ticket from alex@example.com"
   ```

   The turn fails rather than returning a summary. Example output:
   ```console
   llm error response (code STREAM_ERROR): "POST \"http://agentgateway-proxy.agentgateway-system.svc.cluster.local/v1/chat/completions\": 403 Forbidden "
   Error: AgentInstance task 01a0b011-a684-7416-af8f-526242a5c07f ended in TASK_STATE_FAILED
   ```

   The error names the model call and the status code that the gateway returned. Ask the same question without the address, and the agent answers normally.

> [!NOTE]
> **The guard's `response.message` does not reach the person talking to the agent.** A caller who reads the gateway's response directly sees the message, as the curl steps show, but kagent surfaces only the status code and the failed task. Treat `response.message` as something for an operator reading gateway logs rather than as an explanation for the end user, and put the explanation your users need in the agent's system prompt instead.

> [!CAUTION]
> **A rejected turn strands the conversation permanently.** An agent is not a single-shot chat client: the {{< gloss "Transcript" >}}transcript{{< /gloss >}} is append-only, and a failed turn does not remove the message that failed. The AgentInstance resends the whole conversation on every turn, so the prompt that tripped the guard is sent again, and rejected again, for the rest of that AgentInstance's life.
>
> The following sequence reproduces it. A fresh AgentInstance answers `Summarize the most recent ticket` normally. Send `Summarize the ticket from alex@example.com` next, and that turn fails with the `403`. Then send `What is 2+2?`, which carries no PII of its own: that turn fails with a `403` as well, and so does every turn after it.
>
> Creating a new AgentInstance is the only way to recover a conversation that a `Reject` guard has stopped. For agents, that cost is the strongest argument for [masking instead](#mask-instead-of-reject).

## Mask instead of reject

A `Reject` guard ends the conversation for good, as the [previous section](#watch-the-gateway-reject-a-prompt) demonstrates. A `Mask` guard instead lets the turn through with the matched text replaced. Masking is therefore the better default for an agent, and `Reject` belongs to a policy that forbids PII outright and accepts a dead conversation as the price.

Masking also repairs a conversation that a `Reject` guard already stopped. Changing the action re-masks the offending message on the next turn rather than rejecting it, so the stranded AgentInstance answers again without being recreated.

1. Change the action on the request guard to `Mask`.
   ```bash
   kubectl patch agentgatewaymodel gpt-4o-mini -n agentgateway-system --type merge -p \
     '{"spec":{"policies":{"promptGuard":{"request":[{"regex":{"builtins":["Email","Ssn","CreditCard"],"action":"Mask"}}]}}}}'
   ```

2. Send the same prompt again, to the same AgentInstance that the `Reject` guard stranded.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID \
     --task "Summarize this ticket: alex@example.com reports that checkout returns 503 errors during peak hours."
   ```

   The turn succeeds this time. The agent answers, or asks a follow-up question, and the address never reaches the provider. The patch replaces the whole `request` list, so it also drops the `response.message` that the rejection used. A `Mask` guard returns no message, because it rejects nothing.

> [!WARNING]
> **A guard on the response does not inspect streamed content unless you enable it.** Prompt guards default to skipping streaming responses to preserve throughput. Set `policies.promptGuard.streaming: Enabled` to guard them, and note that `Mask` is never applied to a streamed response even then: a guard can reject streamed content, and matched text in a stream that is not rejected passes through unmodified.

## Guard what an agent's tools send

An agent differs from a chat client in that much of its traffic originates from tools rather than from a person. A tool that reads a ticket, a database row, or a Kubernetes resource can feed PII back to the model, and the default scope does not inspect that content.

Add `scope` to the guard to cover tool traffic. `ToolOutput` covers the results that a tool feeds back to the model, and `ToolInput` covers the arguments that the model produces for a tool call.

```yaml
  policies:
    promptGuard:
      request:
      - scope:
        - SystemPrompt
        - Messages
        - ToolOutput
        regex:
          builtins:
          - Email
          - Ssn
          - CreditCard
          action: Mask
```

> [!NOTE]
> Listing `scope` replaces the default rather than adding to it, so name `SystemPrompt` and `Messages` alongside the tool scopes to keep guarding the conversation. In an API that sends tool arguments as opaque JSON, a `Mask` action on `ToolInput` can rewrite those arguments into invalid JSON, so prefer `ToolOutput` unless you have a reason to inspect the arguments.

## Attach the guard to a route instead

An `AgentgatewayPolicy` holds the same `promptGuard` configuration, and one policy can govern every model behind a route rather than one model at a time. Because `targetRefs` accepts an `HTTPRoute` and not an `AgentgatewayModel`, this form needs the model to attach to a route instead of to the listener.

1. Create an `HTTPRoute` whose rule sends traffic to every model, and point the model at the route rather than at the `Gateway`.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: gateway.networking.k8s.io/v1
   kind: HTTPRoute
   metadata:
     name: model-traffic
     namespace: agentgateway-system
   spec:
     parentRefs:
     - name: agentgateway-proxy
       sectionName: http
     rules:
     - name: models
       backendRefs:
       - group: agentgateway.dev
         kind: AgentgatewayModel
         name: "*"
   ---
   apiVersion: agentgateway.dev/v1alpha1
   kind: AgentgatewayModel
   metadata:
     name: gpt-4o-mini
     namespace: agentgateway-system
   spec:
     parentRefs:
     - group: gateway.networking.k8s.io
       kind: HTTPRoute
       name: model-traffic
     provider: OpenAI
     policies:
       auth:
         secretRef:
           name: openai-key
   EOF
   ```

   The model keeps `policies.auth` and drops `policies.promptGuard`, because the `AgentgatewayPolicy` that you create next carries the guard. The `parentRef` needs no `sectionName`, because the route has exactly one rule.

2. Create the `AgentgatewayPolicy` that targets the route rule.
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: agentgateway.dev/v1alpha1
   kind: AgentgatewayPolicy
   metadata:
     name: block-pii
     namespace: agentgateway-system
   spec:
     targetRefs:
     - group: gateway.networking.k8s.io
       kind: HTTPRoute
       name: model-traffic
       sectionName: models
     backend:
       ai:
         promptGuard:
           request:
           - regex:
               builtins:
               - Email
               - Ssn
               - CreditCard
               action: Reject
             response:
               message: The prompt contained personally identifiable information.
   EOF
   ```

3. Confirm that the policy attached to the route.
   ```bash
   kubectl get agentgatewaypolicy block-pii -n agentgateway-system
   ```

   The resource prints an `ACCEPTED` column for whether agentgateway admitted the policy, and an `ATTACHED` column for whether the policy reached its target. Both report `True` when the policy governs the route.

> [!NOTE]
> The listener must allow the `HTTPRoute` kind for this variant. The Gateway that [agentgateway model routing]({{< link path="setup/model-providers/byo-agentgateway#set-up-agentgateway-model-routing" >}}) creates already allows both `HTTPRoute` and `AgentgatewayModel`, so no change to the Gateway is needed.

## Clean up

1. Delete the AgentInstance and the AgentTemplate.
   ```bash
   kagent delete agent-instance $INSTANCE_ID
   kubectl delete agenttemplate support-triage -n kagent
   ```

2. Remove the guard from the model, leaving the routing and the provider credentials in place. The patch names `promptGuard` rather than `policies`, because `policies` also holds the `auth` that lets the gateway reach the provider. A merge patch also succeeds when the model carries no guard, which is the case if you followed [Attach the guard to a route instead](#attach-the-guard-to-a-route-instead).
   ```bash
   kubectl patch agentgatewaymodel gpt-4o-mini -n agentgateway-system --type merge -p '{"spec":{"policies":{"promptGuard":null}}}'
   ```

3. If you followed [Attach the guard to a route instead](#attach-the-guard-to-a-route-instead), delete the policy and the route, and repoint the model at the Gateway listener.
   ```bash
   kubectl delete agentgatewaypolicy block-pii -n agentgateway-system
   kubectl delete httproute model-traffic -n agentgateway-system
   kubectl apply -f - <<EOF
   apiVersion: agentgateway.dev/v1alpha1
   kind: AgentgatewayModel
   metadata:
     name: gpt-4o-mini
     namespace: agentgateway-system
   spec:
     parentRefs:
     - group: gateway.networking.k8s.io
       kind: Gateway
       name: agentgateway-proxy
       sectionName: http
     provider: OpenAI
     policies:
       auth:
         secretRef:
           name: openai-key
   EOF
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers/byo-agentgateway" >}}` title="agentgateway model routing" subtitle="Review the Gateway, AgentgatewayModel, and ModelConfig that carry an agent's model traffic." >}}
  <!--{{< card link=`{{< link path="observability/audit-prompts" >}}` title="Audit prompts" subtitle="Export the prompts and replies that your agents exchange with a model, and query them in a logging backend." >}}-->
  {{< card link="https://agentgateway.dev/docs/kubernetes/latest/documentation/llm/guardrails/regex/#block-requests-with-pii" title="agentgateway regex guardrails" subtitle="Read the full set of regex guards, masking rules, and built-in patterns in the agentgateway documentation." >}}
{{< /cards >}}
