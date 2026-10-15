## Every source is immutable

A skill or a plugin changes what an agent does, so kagent only accepts artifact references that cannot shift underneath a running agent. Each source specifies exactly one of three kinds of artifact, and every kind must be pinned in its own way.

- **`oci`**: An image reference pinned to a digest, in the form `<repository>@sha256:<digest>`. A tag alone is rejected, because a tag can be moved to different content later.
- **`git`**: A repository URL together with a full commit identifier. An abbreviated commit, a branch, or a tag is rejected.
- **`bucket.s3`**: An endpoint, bucket, and key, together with the `versionId` of that exact object version. A region is included where the service requires one for request signing.

If a source sets more than one kind, or none of them, the API server rejects the AgentTemplate with the error `exactly one of the fields in [oci git bucket] must be set`.

Keep in mind that publishing a new version means updating the AgentTemplate to reference the new digest, commit, or object version, which produces a new revision. However, agents that are already running keep the content that they started with.
