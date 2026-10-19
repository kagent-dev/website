## Every source is immutable

A skill or a plugin changes what an agent does, so kagent only accepts artifact references that cannot shift underneath a running agent. Each source specifies exactly one of three kinds of artifact, and every kind must be pinned in its own way.

- **`oci`**: An image reference pinned to a digest, in the form `<repository>@sha256:<digest>`. A tag alone is rejected, because a tag can be moved to different content later.
- **`git`**: A repository URL together with a full commit identifier. An abbreviated commit, a branch, or a tag is rejected.
- **`bucket.s3`**: An endpoint, bucket, and key, together with the `versionId` of that exact object version. A region is included where the service requires one for request signing.

If a source sets more than one kind, or none of them, the API server rejects the AgentTemplate with the error `exactly one of the fields in [oci git bucket] must be set`.

For an `oci` source, the Agent Substrate worker pulls the image with the registry credentials that it uses for workload images. The worker must therefore be able to reach the registry, and a private registry must accept those credentials. The agent's egress policies do not need to grant access to the registry. Agent Substrate mounts the image in the agent sandbox as a read-only volume, and the agent runtime reads the skill or plugin from that volume.

Each distinct `oci` image uses one mounted volume, and entries that reference the same image share that volume. Agent Substrate allows 32 volumes for each Actor. kagent reserves three of them for runtime data and leaves the other 29 for `oci` images. Because kagent runs an agent and its [subagents]({{< link path="examples/agent-delegation#about-subagent-bindings" >}}) in one Actor, the limit covers the skills and plugins of every AgentTemplate in the subagent tree. kagent rejects a revision over the limit with the error `runtime revision has <n> volumes and <n> container mounts; Substrate supports at most 32 volumes and 32 mounts per container`.

Publishing a new version means updating the AgentTemplate to reference the new digest, commit, or object version. The update produces a new revision. Agents that are already running keep the content that they started with.
