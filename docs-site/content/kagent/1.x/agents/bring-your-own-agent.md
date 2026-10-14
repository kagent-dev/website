---
title: Bring your own agent
description: Run a container image of your own as a kagent agent by implementing the A2A service that the byo runtime expects.
weight: 20
author: kagent.dev
---

The `byo` runtime runs a container image that you build, and treats what is inside it as opaque. {{< reuse "kagent-docs/snippets/name-product.md" >}} still compiles the {{< gloss "Harness" >}}Harness{{< /gloss >}} and {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}} into a {{< gloss "Revision" >}}revision{{< /gloss >}}, schedules that revision onto {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}}, and routes conversations to it. What the image does with a message is yours to decide. Choose this runtime when you already have an agent that is built with an agent framework, and you want to run that agent in kagent.

## What kagent runs and what your image runs

The `byo` runtime divides the work at the {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) boundary. Everything on kagent's side of that boundary behaves in the same way as for the built-in runtimes, so a BYO agent is sandboxed, snapshotted, and addressed identically to one that kagent executes itself.

kagent owns the lifecycle, the isolation, and the routing:

- Compiles an {{< gloss "Agent" >}}Agent{{< /gloss >}} into an immutable revision, and creates a {{< gloss "Session" >}}Session{{< /gloss >}} from it.
- Wraps the {{< gloss "Actor" >}}Actor{{< /gloss >}} that the image runs in with a [gVisor sandbox]({{< link path="about/substrate-runtime/sandboxing#sandbox-classes" >}}).
- [Suspends and resumes]({{< link path="about/substrate-runtime/suspend-and-resume#suspension-between-turns" >}}) the Actor between turns, including its in-memory state.
- Routes every conversation through the A2A gateway, so callers address the Agent rather than the Actor behind it.
- Delivers the compiled agent configuration and agent card to the container, which the kagent helpers write to `/config/config.json` and `/config/agent-card.json` at startup.

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
| The A2A service speaks gRPC, not JSON-RPC | The agent card fixes the protocol binding to gRPC. An image that serves A2A over JSON-RPC alone is never reached, regardless of the port it listens on. |

> [!WARNING]
> **An image that listens on another port still reports `READY`.** Readiness is probed on port 8081, which succeeds no matter what the A2A service does, so nothing surfaces the mismatch until an invoke fails with `Connect: tunnel failed`. The compiled configuration sets port `80` in its `runtime.port` field, so an image that reads the configuration binds the right port. An image that ignores the configuration must pin port 80 itself. This gap is tracked as [kagent#2758](https://github.com/kagent-dev/kagent/issues/2758).

## Opaque and configured agents

kagent resolves an AgentTemplate for a `byo` Harness in the same way as for the `kagent` runtime, then hands the result to the container. The two ways of using this runtime differ only in whether the image reads it.

- **An opaque agent ignores the compiled configuration.** The AgentTemplate exists to give the agent an identity and a description, and the image decides everything else, including which model to call and which tools to offer. Every field on an opaque AgentTemplate is optional, `modelConfig` included.
- **A configured agent reads the compiled configuration.** The image honors the AgentTemplate's system prompt, ModelConfig, tool bindings, skills, and plugins, so an operator changes the agent's behavior by editing the AgentTemplate rather than by rebuilding the image.

kagent builds a revision for the `byo` runtime in the same way that it does for the `kagent` runtime, so a configured BYO agent accepts the same model providers and the same AgentTemplate features as the built-in runtime. For the provider matrix, see [Model provider support]({{< link path="agents/agent-harness#model-provider-support" >}}). For what an AgentTemplate can bind, see [Tool and skill support]({{< link path="agents/agent-harness#tool-and-skill-support" >}}).

Both kinds of agent receive the same inputs. Agent Substrate delivers the two JSON payloads as private environment variables, and the kagent helpers write them to files before the agent starts. An image in another language either reads the files that `MaterializeFromEnv` writes or parses the variables itself.

| Input | Contents |
| ----- | -------- |
| `KAGENT_CONFIG_JSON`, which the helpers write to `/config/config.json` | The compiled agent configuration, including the resolved system prompt, the model and its settings, every tool, skill, and plugin that the AgentTemplate binds, and a `runtime` object that sets the process settings. |
| `KAGENT_AGENT_CARD_JSON`, which the helpers write to `/config/agent-card.json` | The agent card that kagent advertises for this agent, rendered as JSON. |
| Anything in `spec.env` | The literal values that the Harness sets. The field does not take a secret-backed source, so put credentials on a ModelConfig or a RemoteMCPServer instead. Agent Substrate accepts at most 32 environment variables on an Actor, and the variables that kagent adds count toward that limit. A revision that exceeds 32 is rejected. |

The `runtime` object is the root of the configuration document, and subagents inherit it. The object includes the settings that a process needs before it serves a request.

```json
{
  "runtime": {
    "control_plane_url": "http://kagent-controller.kagent.svc:8083",
    "gateway_url": "http://kagent-controller.kagent.svc:8083",
    "name": "my-byo-agent",
    "namespace": "kagent",
    "log_level": "info",
    "port": "80",
    "max_content_length": 0
  }
}
```

| Field | Contents |
| ----- | -------- |
| `control_plane_url` | The kagent API that the agent reports task state to. Required by the Go and Python helpers. |
| `gateway_url` | The A2A gateway that the agent reaches other agents and MCP servers through. |
| `name` and `namespace` | The Agent's name and the AgentTemplate's namespace, which kagent's helpers use to scope sessions. |
| `port` | The port to serve A2A on. The controller sets `80` for every runtime, and the agent card advertises that same port. |
| `log_level` | `debug`, `info`, `warn`, or `error`, from the `config.runtimeDefaults.logging.level` Helm value. |
| `max_content_length` | The largest A2A request body to accept, in bytes. Zero means unlimited, and an absent field keeps the helper's own default. |

> [!IMPORTANT]
> The process settings moved into the configuration document in {{< reuse "kagent-docs/versions/kagent.md" >}}. An image that reads `KAGENT_PORT`, `KAGENT_NAME`, `KAGENT_NAMESPACE`, `KAGENT_API_URL`, or `KAGENT_A2A_GRPC_ADDRESS` reads them as unset, and naming one of these variables in `spec.env` sets a variable that nothing reads. Read the `runtime` object instead.

## Configure a BYO Harness

A `byo` Harness takes the same fields as any other, minus the runtime settings block. `spec.byo` is an empty object, because the runtime has nothing to configure. The image holds the behavior.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Harness
metadata:
  name: my-byo-harness
  namespace: kagent
spec:
  byo: {}
  workload:
    image: <your-registry>/my-agent@sha256:<digest>
    command: ["/my-agent"]
  substrate:
    workerPoolRef:
      name: kagent-default
    snapshotPolicy:
      location: s3://ate-snapshots/kagent/
EOF
```

{{< reuse "kagent-docs/snippets/review-table.md" >}} For the fields that every Harness shares, see [Configure a Harness]({{< link path="agents/agent-harness#configure-a-harness" >}}).

| Field | Required | Description |
| ----- | -------- | ----------- |
| `byo` | Yes | Selects this runtime. The object is always empty, and naming a second runtime alongside it is rejected. |
| `workload.image` | Yes | Your image, pinned by `sha256` digest. A tag alone is rejected, because a revision must be reproducible. |
| `workload.command` | Yes | The entrypoint to run, up to 32 entries. Required for `byo` and optional for every other runtime. |
| `env` | No | Provider credentials and any setting that your image reads. Each entry takes a literal `value` or a `credentialRef`. |

An opaque agent's AgentTemplate carries only a description for the agent card. An Agent then pairs it with the Harness.

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: AgentTemplate
metadata:
  name: my-byo-template
  namespace: kagent
spec:
  description: An agent that my own image implements.
---
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: my-byo-agent
  namespace: kagent
spec:
  template:
    ref:
      name: my-byo-template
  harnessRef:
    name: my-byo-harness
EOF
```

To configure the agent from Kubernetes instead, add the fields that any AgentTemplate takes, and read `/config/config.json` in the image. For what those fields mean, see [Your first agent]({{< link path="get-started/your-first-agent#create-a-harness-an-agenttemplate-and-an-agent" >}}).

## Build the image

The A2A contract is a gRPC service and a readiness endpoint, so any language with a gRPC server can satisfy it. kagent ships helpers for two of them. To build and run a minimal image end to end before writing your own, see [Run your own agent image]({{< link path="examples/a2a-byo" >}}).

> [!TIP]
> The Go helper produces smaller images, faster startup, and lower memory use than the Python one. Where both suit the agent that you are building, prefer Go.

{{< tabs >}}
{{% tab name="Go" %}}
`github.com/kagent-dev/kagent/go/adk/pkg/app` serves the A2A gRPC service, the readiness endpoint on 8081, and the agent card, given any type that implements `a2asrv.AgentExecutor`. The helper is framework-agnostic, so the executor is the only part that you write. `config.MaterializeFromEnv` writes the payloads that Agent Substrate delivers to `/config`, and `config.LoadAgentConfig` reads the document back.

```go
if err := config.MaterializeFromEnv("/config"); err != nil {
    return err
}
compiled, err := config.LoadAgentConfig("/config/config.json")
if err != nil {
    return err
}
runtime := compiled.ProcessConfig()

application, err := app.New(app.AppConfig{
    AgentCard: a2atype.AgentCard{
        Name:         "my-agent",
        Version:      "v1",
        Capabilities: a2atype.AgentCapabilities{Streaming: true},
    },
    ControlPlaneURL:  runtime.ControlPlaneURL,
    MaxContentLength: runtime.MaxContentLength,
    Port:             cmp.Or(runtime.Port, "80"),
    AppName:          cmp.Or(runtime.Name, "my-agent"),
    Logger:           logger,
}, myExecutor{})
if err != nil {
    return err
}
return application.Run()
```

Because the helper reports task state to the kagent API, you must set either `ControlPlaneURL` or your own `ControllerClient` in `app.AppConfig`. When `runtime.port` is omitted or unset, `cmp.Or` supplies `80`. Without that fallback, the helper listens on its own `8080` by default, which kagent never dials.

For a complete executor, see [`go/core/test/byoa2a/main.go`](https://github.com/kagent-dev/kagent/blob/main/go/core/test/byoa2a/main.go) in the kagent repository.
{{% /tab %}}
{{% tab name="Python" %}}
The `kagent-adk` package serves A2A over gRPC and its readiness endpoint on 8081. `KAgentConfig.from_file` materializes the payloads that Agent Substrate delivers and reads the `runtime` object back. The listener defaults to `[::]:80`, which matches what kagent dials.

```python
from kagent.adk import KAgentApp
from kagent.core import KAgentConfig

config = KAgentConfig.from_file()

app = KAgentApp(
    root_agent_factory=build_agent,
    agent_card=card,
    kagent_api_url=config.api_url,
    app_name=config.app_name,
).build()
```

`from_file` raises `ValueError` when the document omits `control_plane_url`, `gateway_url`, `name`, or `namespace`, so a standalone process that runs outside Agent Substrate must supply its own `/config/config.json`. `KAgentApp` wraps a Google Agent Development Kit (ADK) agent rather than an arbitrary framework.

To bind the address that the configuration names rather than the default, pass the parsed document as the `agent_config` argument. The `a2a_grpc_address` argument overrides both.
{{% /tab %}}
{{% tab name="Any other language" %}}
Implement the contract directly:

1. Serve `lf.a2a.v1.A2AService` over gRPC on port 80. Generate the stubs from the [A2A protocol](https://a2a-protocol.org) definitions.
2. Serve `GET /readyz` over HTTP on port 8081, returning `200`.
3. To honor the AgentTemplate, read the compiled configuration from the `KAGENT_CONFIG_JSON` environment variable. An agent that ignores the variable runs as an opaque agent.

The kagent helpers read `KAGENT_CONFIG_JSON` and materialize its contents into `/config/config.json`. An image without those helpers parses the variable directly.
{{% /tab %}}
{{< /tabs >}}

## Known limitations

- **The A2A interface is fixed.** kagent advertises `http://127.0.0.1:80` over gRPC, and `spec.byo` does not take a field that changes the address, the port, or the protocol. An image that serves A2A over HTTP JSON-RPC alone cannot run on this runtime.
- **The `kagent-langgraph` and `kagent-crewai` adapters do not qualify yet.** Both build a FastAPI application with A2A JSON-RPC routes and no gRPC server, so neither satisfies the contract as shipped. Running LangGraph or CrewAI under `byo` currently means serving A2A over gRPC yourself.
- **Long-term memory is unavailable.** Memory is configured under `spec.kagent.memory`, and only the `kagent` runtime wires it up. A `byo` Harness has no equivalent setting. For what a BYO image would need to replace, see [Agent memory]({{< link path="agents/agent-memory" >}}).
- **A broken port mapping presents as a healthy agent.** For the failure and what avoids it, see [The A2A contract](#the-a2a-contract).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/a2a-byo" >}}` title="Run your own agent image" subtitle="Build the minimal BYO agent, run it on a byo Harness, and invoke it." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Compare the byo runtime against the three that kagent executes itself." >}}
  {{< card link=`{{< link path="examples/a2a-agents" >}}` title="Call an agent over A2A" subtitle="Send messages to an Agent with the same protocol that a BYO image serves." >}}
  {{< card link=`{{< link path="about/substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand what Agent Substrate snapshots while your image is idle." >}}
{{< /cards >}}
