1. [Install kagent]({{< link path="setup/installation" >}}), and confirm that your installation sets `controller.grpc.reflection=true`. Reflection lets grpcurl discover the controller's methods without a local copy of kagent's protocol buffer definitions.

2. [Create your first agent]({{< link path="get-started/your-first-agent" >}}), then save the AgentInstance's ID to an environment variable. To find the ID, run `kagent get agent-instance` to list your AgentInstances and copy the value from the `ID` column.
   ```bash
   export INSTANCE_ID=<your-agent-instance-id>
   ```

3. Install [grpcurl](https://github.com/fullstorydev/grpcurl).

4. Port-forward the controller's gRPC port, and leave the command running.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```
