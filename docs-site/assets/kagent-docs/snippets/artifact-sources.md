## Every source is immutable

A skill or a plugin changes what an agent does, so kagent only accepts artifact references that cannot shift underneath a running agent. Each source specifies exactly one of three kinds of artifact, and every kind must be pinned in its own way.

- **`oci`**: An image reference pinned to a digest, in the form `<repository>@sha256:<digest>`. A tag alone is rejected, because a tag can be moved to different content later.
- **`git`**: A repository URL together with a full commit identifier. An abbreviated commit, a branch, or a tag is rejected.
- **`bucket.s3`**: An endpoint, bucket, and key, together with the `versionId` of that exact object version. A region is included where the service requires one for request signing.

If a source sets more than one kind, or none of them, the API server rejects the AgentTemplate with the error `exactly one of the fields in [oci git bucket] must be set`.

For an `oci` source, Agent Substrate pulls the image and mounts it in the agent sandbox as a read-only image volume. The agent runtime reads the selected skill or plugin from the mounted directory. The registry pull uses the worker's image cache and registry credentials. The agent's network egress does not need registry access. Agent Substrate workers that run the agent must therefore be able to reach a private registry. The optional `source.path` value selects the package directory inside the mounted image.

Each distinct `oci` image reference becomes one mounted volume. Agent Substrate limits each Actor to 32 mounted volumes, and kagent reserves three volumes for runtime data. With the remaining capacity, one AgentTemplate can reference up to 29 distinct `oci` images across its standalone skills and plugins. Reusing the same digest-pinned image across entries counts once.

Publishing a new version means updating the AgentTemplate to reference the new digest, commit, or object version. The update produces a new revision. Agents that are already running keep the content that they started with.
