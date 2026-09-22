---
title: Bring your own agent
description: Run a container image of your own as a kagent agent by implementing the A2A service that the byo runtime expects.
weight: 20
author: kagent.dev
---

The `byo` runtime runs a container image that you build, and treats what is inside it as opaque. {{< reuse "kagent-docs/snippets/name-product.md" >}} still compiles the {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} into a {{< gloss "Revision" >}}revision{{< /gloss >}}, schedules that revision onto {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}}, and routes conversations to it. What the image does with a message is yours to decide. Choose this runtime when you have an agent framework that kagent does not adapt, and you would rather bring the image than the integration.

## What kagent runs and what your image runs

The `byo` runtime divides the work at the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) boundary. Everything on kagent's side of that boundary behaves in the same way as for the built-in runtimes, so a BYO agent is sandboxed, snapshotted, and addressed identically to one that kagent executes itself.

kagent owns the lifecycle, the isolation, and the routing:

- Compiles a Harness and an AgentTemplate into an immutable revision, and creates an {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} from it.
- Wraps the {{< gloss "Actor" >}}Actor{{< /gloss >}} that the image runs in with a [gVisor sandbox]({{< link path="substrate-runtime/sandboxing#sandbox-classes" >}}).
- [Suspends and resumes]({{< link path="substrate-runtime/suspend-and-resume#suspension-between-turns" >}}) the Actor between turns, including its in-memory state.
- Routes every conversation through the A2A gateway, so callers address the AgentInstance rather than the Actor behind it.
- Delivers the compiled agent configuration and agent card to the container as environment variables.

Your image owns the agent's behavior and the two endpoints that expose it:

- An A2A service that accepts a message and returns a reply.
- A readiness endpoint that reports when the service can take traffic.
- Whatever the agent actually does: model calls, tool calls, and conversation state.

Because Agent Substrate snapshots the whole Actor, an image that keeps conversation state in memory keeps it across a suspend. Your image does not need to persist anything to survive the gap between turns.

## The A2A contract

A `byo` image must meet four requirements to run as an agent. kagent enforces only `spec.workload.command` at apply time, and the rest surface as a failed invoke rather than as a validation error. The steps in the [Configure a byo Harness](#configure-a-byo-harness) and [Build the image](#build-the-image) sections later in this page show how to satisfy each requirement.

| Requirement | Detail |
| ----------- | ------ |
| `spec.workload.command` is set on the Harness | A `byo` Harness must override the image entrypoint, because kagent does not infer it. |
| The container serves gRPC on port 80 | kagent builds the agent card with a single interface, `http://127.0.0.1:80` bound to gRPC, and that address is not configurable. The service is `lf.a2a.v1.A2AService`. |
| The container answers `GET /readyz` on port 8081 | Agent Substrate probes this path to decide when the Actor is ready, with a 30-second timeout. The probe is on a different port from the A2A service on purpose, so serve it independently. |
| The A2A service speaks gRPC, not JSON-RPC | The agent card fixes the protocol binding to gRPC. An image that serves A2A over JSON-RPC alone is never reached, whatever port it listens on. |

> [!WARNING]
> **A `byo` Harness injects no `PORT` variable, and an image that listens elsewhere still reports `READY`.** Readiness is probed on port 8081, which succeeds no matter what the A2A service does, so nothing surfaces the mismatch until an invoke fails with `Connect: tunnel failed`. Either pin port 80 in the image, or set `PORT` in the Harness's `spec.env` as the examples on this page do. This gap is tracked as [kagent#2758](https://github.com/kagent-dev/kagent/issues/2758).

## Opaque and configured agents

kagent compiles an AgentTemplate for a `byo` Harness in the same way as for the `kagent` runtime, then hands the result to the container as environment variables. The two ways of using this runtime differ only in whether the image reads them.

- **An opaque agent ignores the compiled configuration.** The AgentTemplate exists to give the agent an identity and a description, and the image decides everything else, including which model to call and which tools to offer. Every field on an opaque AgentTemplate is optional, `modelConfig` included.
- **A configured agent reads the compiled configuration.** The image honors the AgentTemplate's system prompt, ModelConfig, tool bindings, skills, and plugins, so an operator changes the agent's behavior by editing the AgentTemplate rather than by rebuilding the image.

The `kagent` and `byo` runtimes compile through the same path, so a configured BYO agent accepts the same model providers and the same AgentTemplate features as the built-in runtime. For the provider matrix, see [Model provider support]({{< link path="agents/agent-harness#model-provider-support" >}}). For what an AgentTemplate can bind, see [Tool and skill support]({{< link path="agents/agent-harness#tool-and-skill-support" >}}).

Both kinds of agent receive the same variables.

| Variable | Contents |
| -------- | -------- |
| `KAGENT_CONFIG_JSON` | The compiled agent configuration: the resolved system prompt, the model and its settings, and every tool, skill, and plugin that the AgentTemplate binds. |
| `KAGENT_AGENT_CARD_JSON` | The agent card that kagent advertises for this agent, rendered as JSON. |
| `KAGENT_NAMESPACE` and `KAGENT_NAME` | The AgentTemplate's namespace and name, which kagent's own helpers use to scope sessions. |
| Anything in `spec.env` | Literal values and `credentialRef` lookups from the Harness, resolved before the Actor starts. |

> [!NOTE]
> Agent Substrate accepts at most 32 environment variables on an Actor, and the compiled configuration counts toward that limit. A revision that exceeds it fails to compile rather than starting and misbehaving.

## Configure a BYO Harness

A `byo` Harness takes the same fields as any other, minus the runtime settings block. `spec.byo` is an empty object, because the runtime has nothing to configure. The image holds the behavior.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: Harness
metadata:
  name: my-byo-harness
  namespace: kagent
spec:
  byo: {}
  workload:
    image: <your-registry>/my-agent@sha256:<digest>
    command: ["/my-agent"]
  env:
    - name: PORT
      value: "80"
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: gs://<your-bucket>/kagent/
  allowedAgentTemplates:
    selector:
      matchLabels:
        kagent.dev/harness: my-byo-harness
EOF
```

{{< reuse "kagent-docs/snippets/review-table.md" >}} For the fields that every Harness shares, see [Configure a Harness]({{< link path="agents/agent-harness#configure-a-harness" >}}).

| Field | Required | Description |
| ----- | -------- | ----------- |
| `byo` | Yes | Selects this runtime. The object is always empty, and naming a second runtime alongside it is rejected. |
| `workload.image` | Yes | Your image, pinned by `sha256` digest. A tag alone is rejected, because a revision must be reproducible. |
| `workload.command` | Yes | The entrypoint to run, up to 32 entries. Required for `byo` and optional for every other runtime. |
| `env` | No | Set `PORT` here unless the image pins port 80 itself. |

An opaque agent's AgentTemplate carries only the label that the Harness selects on, plus a description for the agent card.

```yaml
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: my-byo-agent
  namespace: kagent
  labels:
    kagent.dev/harness: my-byo-harness
spec:
  description: An agent that my own image implements.
EOF
```

To configure the agent from Kubernetes instead, add the fields that any AgentTemplate takes, and read `KAGENT_CONFIG_JSON` in the image. For what those fields mean, see [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-and-an-agenttemplate" >}}).

## Build the image

The A2A contract is a gRPC service and a readiness endpoint, so any language with a gRPC server can satisfy it. kagent ships helpers for two of them. To build and run a minimal image end to end before writing your own, see [Run your own agent image]({{< link path="examples/a2a-byo" >}}).

> [!TIP]
> The Go helper produces smaller images, faster startup, and lower memory use than the Python one. Where both suit the agent that you are building, prefer Go.

{{< tabs >}}
{{% tab name="Go" %}}
`github.com/kagent-dev/kagent/go/adk/pkg/app` serves the A2A gRPC service, the readiness endpoint on 8081, and the agent card, given any type that implements `a2asrv.AgentExecutor`. The helper is framework-agnostic, so the executor is the only part that you write.

```go
application, err := app.New(app.AppConfig{
    AgentCard: a2atype.AgentCard{
        Name:         "my-agent",
        Version:      "v1",
        Capabilities: a2atype.AgentCapabilities{Streaming: true},
    },
    Port:    "80",
    AppName: "my-agent",
    Logger:  logger,
}, myExecutor{})
if err != nil {
    return err
}
return application.Run()
```

Setting `Port` to `80` keeps this image working without a `PORT` variable on the Harness. Omitting it falls back to the `PORT` environment variable and then to a default of `8080`, which kagent never dials.

For a complete executor, see [`go/core/test/byoa2a/main.go`](https://github.com/kagent-dev/kagent/blob/main/go/core/test/byoa2a/main.go) in the kagent repository.
{{% /tab %}}
{{% tab name="Python" %}}
The `kagent-adk` package serves A2A over gRPC, defaulting its listener to `[::]:80` and its readiness endpoint to 8081. The default address matches what kagent dials, so a Python image needs no `PORT` variable on the Harness.

```python
from kagent.adk import KAgentApp

app = KAgentApp(
    root_agent_factory=build_agent,
    agent_card=card,
    kagent_api_url=os.environ["KAGENT_URL"],
    app_name="my-agent",
).build()
```

`KAgentApp` wraps a Google Agent Development Kit (ADK) agent rather than an arbitrary framework. Override the listener with the `KAGENT_A2A_GRPC_ADDRESS` environment variable, or the `a2a_grpc_address` argument.
{{% /tab %}}
{{% tab name="Any other language" %}}
Implement the contract directly:

1. Serve `lf.a2a.v1.A2AService` over gRPC on port 80. Generate the stubs from the [A2A protocol](https://a2a-protocol.org) definitions.
2. Serve `GET /readyz` over HTTP on port 8081, returning `200`.
3. Read `KAGENT_CONFIG_JSON` if the agent should honor its AgentTemplate, or ignore it and run an opaque agent.
{{% /tab %}}
{{< /tabs >}}

## Known limitations

- **The A2A interface is fixed.** kagent advertises `http://127.0.0.1:80` over gRPC, and `spec.byo` takes no field to change the address, the port, or the protocol. An image that serves A2A over HTTP JSON-RPC alone cannot run on this runtime.
- **The `kagent-langgraph` and `kagent-crewai` adapters do not qualify yet.** Both build a FastAPI application with A2A JSON-RPC routes and no gRPC server, so neither satisfies the contract as shipped. Running LangGraph or CrewAI under `byo` currently means serving A2A over gRPC yourself.
- **Long-term memory is unavailable.** Memory is configured under `spec.kagent.memory` and wired only by the `kagent` runtime's compiler. A `byo` Harness has no equivalent setting. For what a BYO image would need to replace, see [Agent memory]({{< link path="agents/agent-memory" >}}).
- **A broken port mapping presents as a healthy agent.** Readiness passes on 8081 regardless of the A2A service, so the AgentInstance reports `READY` and every invoke fails. This is [kagent#2758](https://github.com/kagent-dev/kagent/issues/2758).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/a2a-byo" >}}` title="Run your own agent image" subtitle="Build the minimal BYO agent, run it on a byo Harness, and invoke it." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Compare the byo runtime against the three that kagent executes itself." >}}
  {{< card link=`{{< link path="examples/a2a-agents" >}}` title="Call an agent over A2A" subtitle="Send messages to an AgentInstance with the same protocol that a BYO image serves." >}}
  {{< card link=`{{< link path="substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand what Agent Substrate snapshots while your image is idle." >}}
{{< /cards >}}
