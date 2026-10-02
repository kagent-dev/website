This split is deliberate, not an implementation detail to work around:

- Applying a Harness, AgentTemplate, or Agent is a **Kubernetes-native operation**, governed by Kubernetes RBAC, exactly like any other CRD.
- Creating, suspending, resuming, sharing, or deleting a Session, and holding a conversation with it, are **kagent-native operations**, governed by kagent's own gRPC authentication and authorization, independent of who can `kubectl apply` an Agent.
