---
title: Run agents in multiple namespaces
description: Prepare additional namespaces to run agents, restrict the controller to the namespaces that you choose, and share configuration across them.
weight: 25
author: kagent.dev
---

By default, {{< reuse "kagent-docs/snippets/name-product.md" >}} runs agents only in the kagent namespace. The controller watches every namespace in the cluster. When several teams run agents, give each team a namespace of its own. This guide prepares a namespace to run agents, limits the controller to the namespaces that you list, and points to the settings that share a model or an MCP server across namespaces.

## Default namespace layout

A {{< reuse "kagent-docs/snippets/name-product.md" >}} installation places its components and permissions in a few namespaces. The layout depends on how you installed kagent. Each default links to the section of this guide that changes it.

When you install kagent with `kagent install`, the installation sets up the following defaults:

* The `kagent` namespace holds the controller, the UI, the tool server, the development database, and the `kagent-default` WorkerPool. It is the only namespace that can run agents. To run agents in another namespace, see [Prepare a namespace to run agents](#prepare-a-namespace-to-run-agents).
* The `ate-system` namespace holds Agent Substrate. The `podcertificate-controller-system` namespace holds its Pod Certificate controller.
* The controller watches every namespace. The chart grants the controller cluster-scoped role-based access control (RBAC). To narrow both scopes, see [Restrict kagent to specific namespaces](#restrict-kagent-to-specific-namespaces).
* Agent Substrate has one credential policy. The policy lets agents in `kagent` read Secrets in `kagent` only. Each namespace that you prepare gets a policy of its own.
* The `default-model-config` ModelConfig and the `kagent-tool-server` RemoteMCPServer admit references from the `kagent` namespace only. To use them from another namespace, see [Share configuration across namespaces](#share-configuration-across-namespaces).

When you install the charts directly with Helm, the installation sets up the following defaults:

* The `kagent` namespace holds the controller, the UI, and the tool server. The namespace has no WorkerPool, because the kagent chart sets `substrateWorkerPool.create` to `false`. No namespace can run agents, including `kagent`, until you prepare it as described in [Prepare a namespace to run agents](#prepare-a-namespace-to-run-agents).
* The `ate-system` namespace holds Agent Substrate.
* The controller watches every namespace. The chart grants the controller cluster-scoped RBAC. To narrow both scopes, see [Restrict kagent to specific namespaces](#restrict-kagent-to-specific-namespaces).
* Agent Substrate has no credential policy, because the Agent Substrate chart sets `credentialProvider.namespacePolicies` to an empty list. Each namespace that you prepare gets a policy of its own.
* The `kagent-tool-server` RemoteMCPServer admits references from the `kagent` namespace only. To use it from another namespace, see [Share configuration across namespaces](#share-configuration-across-namespaces).

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).
2. Install [yq](https://github.com/mikefarah/yq) version 4. The steps use yq to edit the Agent Substrate Helm values.

## Prepare a namespace to run agents

An Agent needs a WorkerPool and an Agent Substrate credential policy in its own namespace. A Harness can select only a WorkerPool in the Harness's namespace. Agent Substrate denies every Secret read from a namespace that has no credential policy. The denial includes reads of that namespace's own Secrets. Without the policy, the Agent becomes ready. However, every model call fails with a `403 Forbidden` error.

The following steps prepare the `team-a` namespace.

1. Create a ServiceAccount and a WorkerPool in the namespace. The pool must set both placement labels to its own name and namespace. For more information about the labels, see [Keep placement scoped to the pool's namespace]({{< link path="operations/tune-agent-substrate#workerpool-placement-labels" >}}).
   ```yaml
   kubectl create namespace team-a
   kubectl create serviceaccount team-a-worker -n team-a
   kubectl apply -f - <<EOF
   apiVersion: ate.dev/v1
   kind: WorkerPool
   metadata:
     name: team-a-pool
     namespace: team-a
     labels:
       kagent.dev/worker-pool-name: team-a-pool
       kagent.dev/worker-pool-namespace: team-a
   spec:
     replicas: 1
     sandboxClasses:
       - name: gvisor
         configRef:
           name: gvisor-default
     workerImage: ghcr.io/kagent-dev/substrate/ateworker-gvisor:v{{< reuse "kagent-docs/versions/agent-substrate.md" >}}
     template:
       serviceAccountName: team-a-worker
   EOF
   ```

2. Add an Agent Substrate credential policy for the namespace.
   1. Save the current values of the Agent Substrate release. The `credentialProvider.namespacePolicies` list that you set replaces the existing list. The next substep builds the new list from these values.
      ```bash
      helm get values substrate -n ate-system --all -o yaml > substrate-current-values.yaml
      ```
   2. Write a values file that keeps the existing policies and adds a policy for the namespace. The `atespace` value is the namespace of the Agent. The `allowedNamespaces` value lists the namespaces whose Secrets its agents can read.
      ```bash
      yq '{"credentialProvider": {"namespacePolicies": ((.credentialProvider.namespacePolicies // []) + [{"atespace": "team-a", "allowedNamespaces": ["team-a"]}])}}' \
        substrate-current-values.yaml > substrate-namespace-policies.yaml
      cat substrate-namespace-policies.yaml
      ```
      Example output:
      ```yaml
      credentialProvider:
        namespacePolicies:
          - allowedNamespaces:
              - kagent
            atespace: kagent
          - atespace: team-a
            allowedNamespaces:
              - team-a
      ```
   3. Upgrade the Agent Substrate release with the values file.
      ```bash
      helm upgrade substrate \
        {{< reuse "kagent-docs/snippets/helm-substrate.md" >}} \
        --version {{< reuse "kagent-docs/versions/agent-substrate-chart.md" >}} \
        --namespace ate-system \
        --reuse-values \
        -f substrate-namespace-policies.yaml
      ```

3. Confirm that the WorkerPool has a ready Worker.
   ```bash
   kubectl get workerpools -n team-a
   ```
   The `READY` column for the `team-a-pool` lists `1`:
   ```console
   NAME          DESIRED   REPLICAS   READY   SANDBOXCONFIG    RESOLVED   AGE
   team-a-pool   1         1          1       gvisor-default   True       6s
   ```

4. Select the pool in the `spec.substrate.workerPoolRef` field of each Harness in the namespace. Agents in `team-a` cannot use `default-model-config`, because it admits only the `kagent` namespace. Create a ModelConfig and its API key Secret in `team-a`. To use a ModelConfig from another namespace instead, see [Share configuration across namespaces](#share-configuration-across-namespaces).
   ```yaml
   spec:
     substrate:
       workerPoolRef:
         name: team-a-pool
   ```

## Restrict kagent to specific namespaces

By default, the controller watches every namespace. The chart creates ClusterRoles and ClusterRoleBindings for cluster-scoped RBAC. To limit the controller, restrict it to the namespaces that run agents. Then, verify that an unwatched namespace stays unmanaged.

### Set the watched namespaces

`global.watchNamespaces` sets two scopes from one value: the namespaces where the chart grants the controller RBAC, and the namespaces that the controller watches. For each listed namespace, the chart replaces every kagent ClusterRole with a Role and RoleBinding. The chart also adds each listed namespace to the watch. The chart appends the install namespace to the list, so the release's own resources remain managed. Because one value sets both scopes, the two scopes cannot disagree.

Set `global.watchNamespaces` when you install kagent, or later with a `helm upgrade` of the kagent release. Create every listed namespace before upgrading, because the chart creates a Role and RoleBinding in each one.

```bash
helm upgrade kagent \
  {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
  --version {{< reuse "kagent-docs/versions/kagent.md" >}} \
  --namespace kagent \
  --reuse-values \
  --set 'global.watchNamespaces={prod-agents,staging-agents}'
```

The change restarts the controller with the new watch scope. To return to watching every namespace, set the value to an empty list, such as `--set-json 'global.watchNamespaces=[]'`.

### Set the RBAC and watch scopes separately

The chart also has a separate key for each scope. The `rbac.namespaces` key sets the RBAC scope, and the `config.kubernetes.watchNamespaces` key sets the watch scope. Use these keys only when the two scopes must differ. Otherwise, use `global.watchNamespaces`. The following rules apply to the separate keys:

* `rbac.namespaces` takes precedence over `global.watchNamespaces` whenever the key is present. An explicit `rbac.namespaces: []` restores cluster-scoped RBAC. When `rbac.namespaces` is set, it must include the install namespace. Otherwise, the render fails.
* `config.kubernetes.watchNamespaces` is an explicit watch override. When `rbac.namespaces` is set, a watch entry that references a namespace outside the RBAC scope fails the render, because the controller would loop on `Forbidden` errors at runtime. When `global.watchNamespaces` is set, the chart adds the entries to the watch scope without failing the render. In both cases, the watch list replaces the default list. The chart does not add the install namespace. To keep watching the install namespace, list it explicitly.

### Verify the restricted installation

Verify a namespaced installation by checking that an unwatched namespace stays unmanaged. The `kubectl get agents` command and conditions checks from the guide to [create your first agent]({{< link path="get-started/your-first-agent" >}}) apply to each watched namespace.

1. Create one Agent in each watched namespace. An Agent outside the kagent namespace needs a WorkerPool and an Agent Substrate credential policy in its namespace before it can run. For the steps, see [Prepare a namespace to run agents](#prepare-a-namespace-to-run-agents).
   ```bash
   kubectl apply -n prod-agents -f my-agent.yaml
   kubectl apply -n staging-agents -f my-agent.yaml
   ```

2. Create one Agent in a namespace that the list does not cover.
   ```bash
   kubectl apply -n dev-agents -f my-agent.yaml
   ```

3. Confirm that the controller reconciles the watched Agents.
   ```bash
   kubectl get agents -n prod-agents
   kubectl get agents -n staging-agents
   ```
   Example output:
   ```console
   NAME           AGE   READY
   my-agent       30s   True
   my-agent       30s   True
   ```

4. Confirm that the Agent in the unwatched namespace stays unmanaged. The controller does not have a watch entry for that namespace. The Agent's `READY` value therefore stays `UNKNOWN`, and its conditions stay empty.
   ```bash
   kubectl get agents -n dev-agents
   kubectl get agent my-agent -n dev-agents -o jsonpath='{.status.conditions}'
   ```
   Example output:
   ```console
   NAME           AGE   READY
   my-agent       30s   UNKNOWN
   null
   ```

## Share configuration across namespaces

An Agent in one namespace can use a ModelConfig or a RemoteMCPServer in another namespace when the target resource admits the Agent's namespace. A platform team can then keep one model configuration and its credentials in a shared namespace. For the conditions and the steps, see the following sections:

* [Share a ModelConfig across namespaces]({{< link path="setup/model-providers/about-model-providers#share-a-modelconfig-across-namespaces" >}})
* [Share an MCP server across namespaces]({{< link path="skills-and-mcp/about-tools#share-an-mcp-server-across-namespaces" >}})
* [Reach kagent-tool-server from another namespace]({{< link path="reference/tools-ecosystem#reach-kagent-tool-server-from-another-namespace" >}})

## Namespace isolation

A namespace separates the agents of one team from another team's agents in the following places:

* Kubernetes RBAC governs who can create Agents, Harnesses, AgentTemplates, and EgressPolicies in the namespace.
* The Agent Substrate credential policy limits which namespaces' Secrets the namespace's agents can read.
* An Agent or SandboxTemplate can select only the EgressPolicies in its own namespace. For more information, see [Access control]({{< link path="agents/egress-policies#access-control" >}}).
* A ModelConfig or RemoteMCPServer admits references only from the namespaces in its `allowedNamespaces` field.

A namespace does not separate the callers of the kagent API. The open source authorizer permits every API check. A caller that reaches the controller can start Sessions with an Agent in any watched namespace. The caller can also write AgentTemplates and Harnesses through the API without Kubernetes RBAC. Creator scoping keeps one caller's Sessions out of another caller's list. However, creator scoping is not a security boundary. For how kagent identifies and authorizes callers, see [Identity]({{< link path="about/substrate-runtime/identity" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Identity" subtitle="Learn how kagent identifies each caller and scopes a Session to its creator." >}}
  {{< card link=`{{< link path="agents/egress-policies" >}}` title="Egress policies" subtitle="Grant an agent access to more destinations, and inject credentials into its requests." >}}
  {{< card link=`{{< link path="about/substrate-runtime/sandboxing" >}}` title="Sandboxing" subtitle="Learn how Agent Substrate isolates each Actor in its own sandbox." >}}
{{< /cards >}}
