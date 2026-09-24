---
title: Run your own agent image
description: Build a minimal BYO agent image, run it on a byo Harness, and invoke it the same way as any other kagent agent.
weight: 70
author: kagent.dev
---

The `byo` runtime runs a container image that you build, so long as the image implements kagent's {{< gloss "A2A" >}}A2A{{< /gloss >}} (Agent-to-Agent) contract. This example takes the shortest path through that contract: build the minimal BYO agent that kagent tests itself against, run it on a {{< gloss "Harness" >}}Harness{{< /gloss >}}, and invoke it.

The agent that you build here calls no model and binds no tools. It answers every message with a fixed string, which makes it a poor agent and a clear demonstration: everything that happens between `kagent invoke` and that reply is kagent's half of the contract. To review the contract and the configured agents that read their AgentTemplate instead of ignoring it, see [Bring your own agent]({{< link path="agents/bring-your-own-agent" >}}).

## Before you begin

1. [Install kagent]({{< link path="setup/installation#verify-the-installation" >}}), including the port-forward to the controller's gRPC API.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}) so that you have a Harness and AgentTemplate pair to model this one on, and a snapshot location to reuse.

3. Install the following tools.
   * [Docker](https://docs.docker.com/get-started/get-docker/)
   * [git](https://git-scm.com/downloads)

4. Export the container registry that your cluster can pull from. For example, a local kind cluster created with `make create-kind-cluster` runs one on `localhost:5001`.
   ```bash
   export DOCKER_REGISTRY=localhost:5001
   ```

5. Know which {{< gloss "WorkerPool" >}}WorkerPool{{< /gloss >}} and snapshot location your installation uses. The Harness that you created carries both.
   ```bash
   kubectl get harness my-first-harness -n kagent \
     -o custom-columns=WORKERPOOL:.spec.substrate.workerPoolRef.name,SNAPSHOT:.spec.substrate.snapshotPolicy.location
   ```

   Example output:
   ```console
   WORKERPOOL       SNAPSHOT
   kagent-default   s3://ate-snapshots/kagent/
   ```

## Build the agent image

kagent's own end-to-end suite runs an opaque BYO agent from `go/core/test/byoa2a/main.go`, and the repository has a make target that builds it. Building that image rather than writing one from scratch means starting from a version that is proven against the current contract.

1. Clone the kagent repository and navigate to it.
   ```bash
   git clone https://github.com/kagent-dev/kagent.git
   cd kagent
   ```

2. Build the image and push it to your registry. The target builds `go/core/test/byoa2a/main.go` with the repository's Go Dockerfile, which produces a single binary at `/app`.
   ```bash
   make build-byo-a2a DOCKER_REGISTRY=$DOCKER_REGISTRY VERSION=byo-example
   ```

3. Resolve the digest, and save the pinned reference. A Harness rejects an image that names only a tag, because a {{< gloss "Revision" >}}revision{{< /gloss >}} must be reproducible.
   ```bash
   export BYO_IMAGE=$DOCKER_REGISTRY/kagent-dev/kagent/byo-a2a@$(docker buildx imagetools inspect \
     $DOCKER_REGISTRY/kagent-dev/kagent/byo-a2a:byo-example \
     | awk '$1 == "Digest:" { print $2; exit }')
   echo $BYO_IMAGE
   ```

   Example output:
   ```console
   localhost:5001/kagent-dev/kagent/byo-a2a@sha256:ea596db3dac8da570980143210efeb2b47bcfb0a3afc5aa0f325a6063c5cf009
   ```

## Create the Harness and the AgentTemplate

A `byo` Harness carries two fields that the other runtimes do not need: an empty `byo` block to select the runtime, and `workload.command` to override the image entrypoint. The AgentTemplate stays almost empty, because this agent ignores everything that an AgentTemplate would configure.

1. Create the Harness. The repository's Go Dockerfile puts the binary at `/app`, so `command` names that path.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: Harness
   metadata:
     name: byo-example
     namespace: kagent
   spec:
     byo: {}
     workload:
       image: $BYO_IMAGE
       command: ["/app"]
     substrate:
       workerPoolRef:
         name: kagent-default
       snapshotPolicy:
         location: s3://ate-snapshots/kagent/
     allowedAgentTemplates:
       selector:
         matchLabels:
           kagent.dev/harness: byo-example
   EOF
   ```

   > [!NOTE]
   > This Harness sets no `PORT` variable, because `byoa2a/main.go` pins `Port: "80"` in the image. An image that leaves the port to kagent listens on the wrong one and still reports `READY`. For that trap and its workaround, see [Bring your own agent]({{< link path="agents/bring-your-own-agent#the-a2a-contract" >}}).

2. Create the AgentTemplate. The Harness's selector matches on the label, and `description` is the only other field that this agent needs.
   ```yaml
   kubectl apply -f - <<EOF
   apiVersion: kagent.dev/v1alpha3
   kind: AgentTemplate
   metadata:
     name: byo-example-agent
     namespace: kagent
     labels:
       kagent.dev/harness: byo-example
   spec:
     description: A BYO agent that replies with a fixed string.
   EOF
   ```

   `modelConfig` is absent on purpose. kagent requires one for the `kagent` runtime and treats it as optional for `byo`, because a BYO image chooses its own model, or no model at all.

3. Confirm that the pair compiled. `status.harnesses` reports the AgentTemplate's state for each Harness that admits it.
   ```bash
   kubectl get agenttemplate byo-example-agent -n kagent \
     -o jsonpath='{.status.harnesses[?(@.harness=="byo-example")].conditions[*].type}{"\n"}{.status.harnesses[?(@.harness=="byo-example")].conditions[*].status}{"\n"}'
   ```

   Example output:
   ```console
   Accepted ResolvedRefs Compatible Ready
   True True True True
   ```

## Invoke the agent

At this point, the BYO agent behaves in the same way as any other. The {{< gloss "AgentInstance" >}}AgentInstance{{< /gloss >}} is the conversation, the CLI reaches it through the controller's A2A service, and nothing in these commands names the runtime.

1. Create an AgentInstance from the Harness and the AgentTemplate.
   ```bash
   kagent create agent-instance --harness byo-example --agent-template byo-example-agent
   ```

   The command returns only after the AgentInstance reaches `READY`. Example output:
   ```console
   +--------------------------------------+-------------------+-------------+-------+----------------------+
   | ID                                   | AGENT TEMPLATE    | HARNESS     | STATE | CREATED              |
   +--------------------------------------+-------------------+-------------+-------+----------------------+
   | 01a08301-8cd0-72c8-818f-26c7490ce37d | byo-example-agent | byo-example | READY | 2026-09-14T14:22:07Z |
   +--------------------------------------+-------------------+-------------+-------+----------------------+
   ```

2. Save the AgentInstance ID.
   ```bash
   export INSTANCE_ID=$(kagent get agent-instance -o json \
     | jq -r '[.agentInstances[] | select(.agentTemplate.name == "byo-example-agent")] | sort_by(.createdAt) | last | .id')
   ```

3. Send it a message.
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "hello"
   ```

   Example output:
   ```console
   BYO agent response
   ```

   That string is hardcoded, so the reply itself proves nothing. Its path proves the contract: kagent compiled a revision, Agent Substrate started a sandboxed {{< gloss "Actor" >}}Actor{{< /gloss >}} from your image, the controller's A2A gateway routed the message to it, and your executor answered.

4. Send another message to the same AgentInstance. The reply does not change, but the message reaches the same Actor. Agent Substrate suspended that Actor after the first turn and resumed it for this one. For that cycle, see [Suspend and resume]({{< link path="substrate-runtime/suspend-and-resume#suspension-between-turns" >}}).
   ```bash
   kagent invoke --agent-instance $INSTANCE_ID --task "hello again"
   ```

## Change what the agent does

The whole agent is one type with two methods. `Execute` receives a request and yields A2A events until the turn ends, and `Cancel` handles a caller stopping a task that is still running.

```go
type executor struct{}

func (executor) Execute(_ context.Context, request *a2asrv.ExecutorContext) iter.Seq2[a2atype.Event, error] {
	return func(yield func(a2atype.Event, error) bool) {
		if !yield(a2atype.NewSubmittedTask(request, request.Message), nil) {
			return
		}
		message := a2atype.NewMessage(a2atype.MessageRoleAgent, a2atype.NewTextPart("BYO agent response"))
		message.ContextID, message.TaskID = request.ContextID, request.TaskID
		yield(a2atype.NewStatusUpdateEvent(request, a2atype.TaskStateCompleted, message), nil)
	}
}

func (executor) Cancel(context.Context, *a2asrv.ExecutorContext) iter.Seq2[a2atype.Event, error] {
	return func(func(a2atype.Event, error) bool) {}
}
```

Two events make a complete turn. `NewSubmittedTask` acknowledges the message and opens the task, and a `TaskStateCompleted` status update carrying an agent message ends it. Between them, a real agent yields whatever its work produces.

`app.New` serves the A2A gRPC service and the readiness endpoint on your behalf, and the `Port: "80"` line keeps the listener where kagent expects it. Both stay as they are in an agent of your own.

To read the AgentTemplate rather than ignore it, parse the `KAGENT_CONFIG_JSON` variable that kagent sets on the container. For what that variable holds, see [Bring your own agent]({{< link path="agents/bring-your-own-agent#opaque-and-configured-agents" >}}).

## Build and run your own agent

An agent of your own takes the same path as the example image, with two differences: the build names your package, and the Harness moves to the image that it produces.

1. Replace the body of `Execute` with the work that your agent does, and leave the rest of the file as-is.

2. Build and push the image. The `build-byo-a2a` target names its package inline, so a package of your own means calling Docker directly. The Dockerfile takes the package as a build argument, relative to the `go` directory.
   ```bash
   docker build --build-arg BUILD_PACKAGE=core/test/myagent/main.go \
     -t $DOCKER_REGISTRY/kagent-dev/kagent/my-agent:v1 -f go/Dockerfile ./go
   docker push $DOCKER_REGISTRY/kagent-dev/kagent/my-agent:v1
   ```

   That Dockerfile copies `api`, `core`, `adk`, `harness`, and `pkg` from the kagent module, so it suits an agent written inside a checkout. An agent in a module of your own needs a Dockerfile of your own. kagent places no requirement on how the image is built, only on what it serves.

3. Resolve the digest of the new image, as in [Build the agent image](#build-the-agent-image). A Harness rejects an image that names only a tag.
   ```bash
   export BYO_IMAGE=$DOCKER_REGISTRY/kagent-dev/kagent/my-agent@$(docker buildx imagetools inspect \
     $DOCKER_REGISTRY/kagent-dev/kagent/my-agent:v1 \
     | awk '$1 == "Digest:" { print $2; exit }')
   ```

4. Point the Harness at the new image. kagent compiles a revision for the updated pair.
   ```bash
   kubectl patch harness byo-example -n kagent --type=merge \
     -p "{\"spec\":{\"workload\":{\"image\":\"$BYO_IMAGE\"}}}"
   ```

5. Create an AgentInstance from the updated Harness, and invoke it as in [Invoke the agent](#invoke-the-agent). An AgentInstance pins the revision that it was created from, so the one from earlier keeps running the example image.
   ```bash
   kagent create agent-instance --harness byo-example --agent-template byo-example-agent
   ```

## Clean up

1. Delete the AgentInstance. Repeat for any AgentInstance that you created from an image of your own.
   ```bash
   kagent delete agent-instance $INSTANCE_ID
   ```

2. Delete the AgentTemplate and the Harness.
   ```bash
   kubectl delete agenttemplate byo-example-agent -n kagent
   kubectl delete harness byo-example -n kagent
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/bring-your-own-agent" >}}` title="Bring your own agent" subtitle="Read the full A2A contract and the limits of the byo runtime." >}}
  {{< card link=`{{< link path="examples/a2a-agents" >}}` title="Call an agent over A2A" subtitle="Talk to this AgentInstance with grpcurl instead of the CLI." >}}
  {{< card link=`{{< link path="examples/agent-substrate" >}}` title="Agent Substrate" subtitle="Watch the Actor behind your image suspend, checkpoint, and fork." >}}
{{< /cards >}}
