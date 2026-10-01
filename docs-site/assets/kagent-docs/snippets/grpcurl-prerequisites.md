1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `controller.grpc.reflection=true`. Reflection lets grpcurl discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), then save the Agent's namespace and name to an environment variable, in the `<namespace>/<name>` form that the A2A `tenant` field takes. To list your Agents, run `kagent agent list`.
   ```bash
   export AGENT=kagent/my-first-agent
   ```

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl).

4. Port-forward the controller's gRPC port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```
