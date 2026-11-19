{{% version include-if="1.0.x" %}}
1. [Install kagent]({{< link path="setup/installation" >}}), and [turn on gRPC reflection]({{< link path="setup/installation#install-kagent" >}}). Reflection lets grpcurl discover the controller's methods without a local copy of kagent's protocol buffer definitions.
{{% /version %}}
{{% version include-if="1.1.x" %}}
1. [Install kagent]({{< link path="setup/installation" >}}). {{< reuse "kagent-docs/snippets/grpcurl-reflection.md" >}}
{{% /version %}}

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), then save the Agent's namespace and name to an environment variable, in the `<namespace>/<name>` form that the A2A `tenant` field takes. To list your Agents, run `kagent agent list`.
   ```bash
   export AGENT=kagent/my-first-agent
   ```

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl).

4. Port-forward the controller's gRPC port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```
