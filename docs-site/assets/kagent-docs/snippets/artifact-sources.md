## Every source is immutable

A skill or a plugin package changes what an agent does, so kagent only accepts artifact references that cannot shift underneath a running agent. Each source names exactly one of three kinds of artifact, and every kind must be pinned in its own way.

- **`oci`**: An image reference pinned to a digest, in the form `<repository>@sha256:<digest>`. A tag alone is rejected, because a tag can be moved to different content later.
- **`git`**: A repository URL together with a full commit identifier. An abbreviated commit, a branch, or a tag is rejected.
- **`bucket.s3`**: An endpoint, bucket, and key, together with the `versionId` of that exact object version. A region is included where the service requires one for request signing.

Pinning has a practical consequence worth planning for. Publishing a new version means updating the AgentTemplate to name the new digest, commit, or object version, which compiles a new revision. Agents that are already running keep the content that they started with.
