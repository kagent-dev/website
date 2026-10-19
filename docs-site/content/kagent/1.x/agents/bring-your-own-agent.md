---
title: Bring your own agent
description: Run a container image of your own as a kagent agent by exposing the A2A service that the byo harness expects.
weight: 20
author: kagent.dev
---

The `byo` harness runs a container image that you build, and treats what is inside it as opaque. {{< reuse "kagent-docs/snippets/name-product.md" >}} still builds a {{< gloss "Revision" >}}revision{{< /gloss >}} from the {{< gloss "Harness" >}}Harness{{< /gloss >}} and the {{< gloss "AgentTemplate" >}}AgentTemplate{{< /gloss >}}, schedules that revision onto {{< gloss "Agent Substrate" >}}Agent Substrate{{< /gloss >}}, and routes conversations to it. What the image does with a message is yours to decide. Choose this harness when you already have an agent that is built with an agent framework, and you want to run that agent in kagent.

## Responsibilities on each side of the A2A boundary

{{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) is the contract between kagent and a BYO agent.

Your image owns one side of the A2A contract by:

- Exposing an A2A service that accepts a message and returns a reply.
- Exposing a readiness endpoint that reports when the service can take traffic.
- Deciding what the agent actually does, including model calls, tool calls, and conversation state.

kagent runs a BYO agent exactly as it runs one on a managed harness, and owns the other side of the A2A contract by:

- Building an immutable revision from the {{< gloss "Harness" >}}Harness{{< /gloss >}} and the AgentTemplate, and creating a {{< gloss "Session" >}}Session{{< /gloss >}} from it.
- Running the {{< gloss "Actor" >}}Actor{{< /gloss >}} that hosts your image inside a sandbox. The {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} that the Harness references sets the class: `gvisor`, which every installation provides, or `microvm`, which needs its own Agent Substrate provisioning. For more information, see [Sandbox classes]({{< link path="about/substrate-runtime/sandboxing#sandbox-classes" >}}).
- [Suspending and resuming]({{< link path="about/substrate-runtime/suspend-and-resume#suspension-between-turns" >}}) the Actor between turns. A suspend keeps only the durable volume mounted at `/data`, so an image must write any state that it needs across turns to that directory.
- Routing every conversation through the A2A gateway, so callers address the {{< gloss "Agent" >}}Agent{{< /gloss >}} rather than the Actor behind it.
- Delivering the agent configuration and agent card to the container, which the kagent helpers write to `/config/config.json` and `/config/agent-card.json` at startup.

Because Agent Substrate snapshots the whole Actor, an image that keeps conversation state in memory keeps it across a suspend. Your image does not need to persist anything to survive the gap between turns.

## The A2A contract

Both the Harness and the image must meet the following requirements, and kagent enforces them at different moments. Nothing checks the A2A service until a caller invokes the agent, so a misconfigured image reaches a healthy-looking state first. For examples of how to satisfy each requirement, see the steps in [Configure a BYO Harness](#configure-a-byo-harness) and [Build the image](#build-the-image).

| Requirement | Checked | Detail |
| ----------- | ------- | ------ |
| `spec.workload.command` is set on the Harness | When you apply the Harness | You must set the entrypoint override on a `byo` Harness. A manifest that omits it is rejected with `BYO harnesses must specify workload.command`. |
| `spec.workload.image` is pinned by digest | When you apply the Harness | A `byo` Harness must name an image, and every Harness must pin it by `sha256` digest. A manifest that omits the image is rejected with `BYO harnesses must specify workload.image`, and a tag alone fails the field's pattern. |
| The container serves gRPC on port 80 | When a caller invokes the agent | kagent builds the agent card with a single interface, `http://127.0.0.1:80` bound to gRPC, and that address is not configurable. The service is `lf.a2a.v1.A2AService`. |
| The container answers `GET /readyz` on port 8081 | When Agent Substrate starts the Actor | Agent Substrate probes this path to decide when the Actor is ready, with a 30-second timeout. The probe is on a different port from the A2A service on purpose, so serve it independently. |
| The A2A service speaks gRPC, not JSON-RPC | When a caller invokes the agent | The agent card fixes the protocol binding to gRPC. An image that serves A2A over only JSON-RPC is never reached, regardless of the port it listens on. |

> [!WARNING]
> **An image that serves A2A on another port still reports `READY`.** Agent Substrate probes readiness on port 8081. That probe succeeds whether or not the A2A service on port 80 works, so the mismatch stays hidden until the first invoke. The invoke then fails in the gateway with `Connect: tunnel failed`. That message reports only that the gateway could not open a connection to the agent. It does not name a port. To bind the right port, read the `runtime.port` field of the configuration that kagent delivers. An image that ignores the configuration must bind port 80 itself.

## Compare BYO and declarative agents

kagent resolves the AgentTemplate in the same way for a BYO agent as for a [declarative agent]({{< link path="agents/declarative-agents" >}}), then delivers the result to the container as a JSON document in an environment variable. Both harnesses resolve a ModelConfig through the same code, so the same model providers work and the same ones are rejected. For the provider matrix, see [Model provider support]({{< link path="agents/agent-harness#model-provider-support" >}}).

The kagent harness reads that document and assembles the agent from it. A BYO image decides whether to read it:

- **An opaque agent ignores the document.** The AgentTemplate exists to give the agent an identity and a description, and the image decides everything else, including which model to call and which tools to offer. Every field on an opaque AgentTemplate is optional, `modelConfig` included.
- **A configured agent reads the document.** The image applies the AgentTemplate's system prompt, ModelConfig, tool bindings, skills, and plugins itself. Editing the AgentTemplate changes what the agent does without a rebuild.

Two AgentTemplate features continue to apply regardless of this choice. First, a `byo` Harness rejects structured output, with `Harness runtime "byo" does not support structured output`. Second, the agent card that kagent advertises for a `byo` Agent leaves out the AgentTemplate's skills and declares no extension, so a client cannot discover human-in-the-loop support the way it can for a declarative agent.

Both kinds of BYO agent receive the same environment variables. Agent Substrate delivers the two JSON payloads as private variables, and the kagent helpers write them to files before the agent starts. An image in another language either reads the files that `MaterializeFromEnv` writes or parses the variables itself.

| Environment variable | Contents |
| -------------------- | -------- |
| `KAGENT_CONFIG_JSON`, which the helpers write to `/config/config.json` | The agent configuration, including the resolved system prompt, the model and its settings, every tool, skill, and plugin that the AgentTemplate binds, and a `runtime` object that sets the process settings. |
| `KAGENT_AGENT_CARD_JSON`, which the helpers write to `/config/agent-card.json` | The agent card that kagent advertises for this agent, rendered as JSON. |
| Anything in `spec.env` | The literal values that the Harness sets. |
| Certificate-authority variables and `SSL_CERT_DIR` | The egress gateway's trust bundle, which every Actor receives. For the list and the limit on how many variables an Actor takes, see [Environment variables on an Actor]({{< link path="agents/agent-harness#environment-variables-on-an-actor" >}}). |

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
| `port` | The port to serve A2A on. The controller sets `80` for every harness, and the agent card advertises that same port. |
| `log_level` | `debug`, `info`, `warn`, or `error`, from the `config.runtimeDefaults.logging.level` Helm value. |
| `max_content_length` | The largest A2A request body to accept, in bytes. Zero means unlimited, and an absent field keeps the helper's own default. |

## Configure a BYO Harness

A `byo` Harness takes the same fields as any other Harness. Its own block, `spec.byo`, is an empty object, because the image defines the behavior that the other harnesses take settings for.

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
| `byo` | Yes | Selects this harness. The object is always empty, and naming a second harness alongside it is rejected. |
| `workload.image` | Yes | Your image, pinned by `sha256` digest. A tag alone is rejected, because a revision must be reproducible. |
| `workload.command` | Yes | The entrypoint to run, up to 32 entries. Required for `byo` and optional for every other harness. |
| `env` | No | Any setting that your image reads. Each entry takes a literal `value` only. Put credentials in a ModelConfig or a RemoteMCPServer instead. |

An opaque agent's AgentTemplate sets only a description for the agent card. An Agent then pairs it with the Harness.

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

The A2A contract is a gRPC service and a readiness endpoint, so any language with a gRPC server can satisfy it. kagent ships helpers for Go and Python. To build and run a minimal image end to end before writing your own, see [Run your own agent image]({{< link path="examples/a2a-byo" >}}).

> [!TIP]
> The Go helper produces smaller images, faster startup, and lower memory use than the Python one. Where both suit the agent that you are building, prefer Go.

{{< tabs >}}
{{% tab name="Go" %}}
`github.com/kagent-dev/kagent/go/adk/pkg/app` serves the A2A gRPC service, the readiness endpoint on 8081, and the agent card, given any type that implements `a2asrv.AgentExecutor`. The helper is framework-agnostic, so the executor is the only part that you write. `config.MaterializeFromEnv` writes the payloads that Agent Substrate delivers to `/config`, and `config.LoadAgentConfig` reads the document back.

```go
import (
    "cmp"
    "context"
    "fmt"
    "iter"
    "os"

    a2atype "github.com/a2aproject/a2a-go/v2/a2a"
    "github.com/a2aproject/a2a-go/v2/a2asrv"
    "github.com/kagent-dev/kagent/go/adk/pkg/app"
    "github.com/kagent-dev/kagent/go/adk/pkg/config"
    "github.com/kagent-dev/kagent/go/pkg/logging"
)

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

`app.New` takes an application configuration and an executor, and returns an application that serves the A2A gRPC service and the agent card on the port that the configuration names. These settings in `app.AppConfig` decide whether kagent can reach the result:

- `Port` is the port the A2A listener binds. `app.AppConfig` defaults it to `8080`, which kagent never dials. Pass `cmp.Or(runtime.Port, "80")` instead to take the port from the configuration and fall back to `80` when the configuration omits it.
- `ControlPlaneURL`, or a `ControllerClient` of your own, is required because the helper reports task state to the kagent API.
- `AppName` scopes sessions. The `runtime.Name` value is the Agent's name.

For a complete executor, see [`go/core/test/byoa2a/main.go`](https://github.com/kagent-dev/kagent/blob/main/go/core/test/byoa2a/main.go) in the kagent repository.
{{% /tab %}}
{{% tab name="Python" %}}
The `kagent-adk` package provides helpers for agents that are built with the Google Agent Development Kit (ADK). `KAgentApp` wraps an ADK agent rather than an arbitrary framework, serves A2A over gRPC, and answers the readiness endpoint on 8081. `KAgentConfig.from_file` materializes the payloads that Agent Substrate delivers and reads the `runtime` object back. The listener defaults to `[::]:80`, which matches what kagent dials.

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

`from_file` raises `ValueError` when the document omits `control_plane_url`, `gateway_url`, `name`, or `namespace`, so a standalone process that runs outside Agent Substrate must supply its own `/config/config.json`.

The page uses two configuration objects. `KAgentConfig` holds only the `runtime` object, which supplies the API URL and the app name. `kagent.adk.types.parse_config` parses the whole document into a `Config`, and `KAgentApp` reads the listener address from that `Config`. To bind the address that the configuration names, pass a parsed `Config` as the `config` argument. `parse_config` takes JSON text or a dict rather than a path, so read the file first. Call `from_file` before `parse_config`, because `from_file` materializes the file.

```python
from pathlib import Path

from kagent.adk.types import parse_config

app = KAgentApp(
    root_agent_factory=build_agent,
    agent_card=card,
    kagent_api_url=config.api_url,
    app_name=config.app_name,
    config=parse_config(Path("/config/config.json").read_text()),
).build()
```

The `a2a_grpc_address` argument overrides both the default and the configured address.
{{% /tab %}}
{{% tab name="Any other language" %}}
Implement the contract directly:

1. Serve `lf.a2a.v1.A2AService` over gRPC on port 80. Generate the stubs from the [A2A protocol](https://a2a-protocol.org) definitions.
2. Serve `GET /readyz` over HTTP on port 8081, returning `200`.
3. To honor the AgentTemplate, read the agent configuration from the `KAGENT_CONFIG_JSON` environment variable. An agent that ignores the variable runs as an opaque agent.

The kagent helpers read `KAGENT_CONFIG_JSON` and materialize its contents into `/config/config.json`. An image without those helpers parses the variable directly.
{{% /tab %}}
{{< /tabs >}}

## Known limitations

- **The A2A interface is fixed.** kagent advertises `http://127.0.0.1:80` over gRPC, and `spec.byo` does not take a field that changes the address, the port, or the protocol. An image that serves A2A over only HTTP JSON-RPC cannot run on this harness.
- **The LangGraph, CrewAI, and OpenAI adapters do not satisfy the contract.** The `kagent-langgraph`, `kagent-crewai`, and `kagent-openai` packages each build a FastAPI application with A2A JSON-RPC routes, without a gRPC server. Running LangGraph, CrewAI, or the OpenAI Agents SDK under `byo` means serving A2A over gRPC yourself, as the **Any other language** tab in [Build the image](#build-the-image) describes.
- **Skills load only when the image reads them.** kagent mounts each skill and plugin that an AgentTemplate attaches, and describes them in the agent configuration. The Go helper reads that description. The Python helper does not yet read it, so a Python image runs without its skills.
- **Long-term memory is unavailable.** Memory is configured under `spec.kagent.memory`, and only the `kagent` harness wires it up. A `byo` Harness does not take an equivalent setting. For what a BYO image would need to replace, see [Agent memory]({{< link path="agents/agent-memory" >}}).
- **A broken port mapping looks like a healthy agent.** For the failure and what avoids it, see [The A2A contract](#the-a2a-contract).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="examples/a2a-byo" >}}` title="Run your own agent image" subtitle="Build the minimal BYO agent, run it on a byo Harness, and invoke it." >}}
  {{< card link=`{{< link path="agents/agent-harness" >}}` title="Agent harness" subtitle="Compare the byo harness against the ones that kagent executes itself." >}}
  {{< card link=`{{< link path="examples/a2a-agents" >}}` title="Call an agent over A2A" subtitle="Send messages to an Agent with the same protocol that a BYO image serves." >}}
  {{< card link=`{{< link path="about/substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand what Agent Substrate snapshots while your image is idle." >}}
{{< /cards >}}
