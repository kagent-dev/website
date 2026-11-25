---
title: Create a policy
description: Create an egress policy in the kagent UI and attach it to an agent, so that the agent can call an external API.
weight: 13
author: kagent.dev
---

{{< tutorial-banner >}}

An agent runs in a sandbox that cannot reach arbitrary hosts. It can always reach its model and its registered MCP servers. For any other HTTP or HTTPS host, you list the host in an egress policy, and attach the policy to the agent. In this tutorial, you allow an agent to reach the GitHub API, as you would for an agent that reads issues or pull requests.

## Before you begin

1. Complete [Build an Agent]({{< link path="get-started/build-an-agent" >}}), so that you have an agent to attach the policy to. The steps use its `personal-assistant` agent. Any agent works.
2. Open the kagent UI with `kagent dashboard`.

## Create the policy

{{< reuse-image src="img/kagent-ui-egress-policy.gif" alt="The kagent UI creating an egress policy named github-api and attaching it to the personal-assistant agent" caption="Figure: Creating an egress policy and attaching it to the agent, sped up" >}}

1. In the sidebar, click **Policies**, and then click **Create egress policy**.

2. In the **Name** field, enter `github-api`. Leave the **Namespace** as `kagent`.

3. Under **Destination 1**, in the **Origin** field, enter `https://api.github.com`. An origin is a scheme, a host, and an optional port, without a path. A value such as `*.example.com` matches one level of subdomain.

4. Leave **Authentication** set to **None**. To have the gateway add a credential to each request, so that the agent never sees it, choose **Secret key** instead.

5. Click **Create policy**. The page of the policy lists its destinations and, under **Used by**, the agents that list it.

## Attach the policy to your agent

1. In the sidebar, click **Agents**. In the row of the `personal-assistant` agent, click the edit icon.

2. From the **Egress policies** list at the end of the form, choose `github-api`.

3. Click **Save agent**, and wait for the agent to return to **Ready**.

The agent can now send requests to `https://api.github.com`. Requests to hosts that no policy lists are still blocked.

## YAML version

Everything that you did in the UI is stored as Kubernetes resources. To create the same resources from the command line, or to keep them in a Git repository, apply this YAML.

<details class="doc-details">
<summary>The github-api egress policy</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: EgressPolicy
metadata:
  name: github-api
  namespace: kagent
spec:
  destinations:
    - origin: https://api.github.com
EOF
```

</details>

<details class="doc-details">
<summary>The personal-assistant agent, with the policy attached</summary>

```yaml
kubectl apply -f - <<EOF
apiVersion: api.kagent.dev/v1alpha3
kind: Agent
metadata:
  name: personal-assistant
  namespace: kagent
spec:
  harnessRef:
    name: kagent-default
  egressPolicyRefs:
    - name: github-api
  template:
    inline:
      description: My personal assistant
      modelConfig:
        name: default-model-config
      systemPrompt: |-
        You are my personal assistant. Be friendly and concise. Help me plan my day, draft messages, and answer questions.
EOF
```

</details>

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/egress-policies" >}}` title="Egress policies" subtitle="Read how policies, credentials, and the egress gateway work." >}}
  {{< card link=`{{< link path="get-started/schedule-an-agent" >}}` title="Schedule an agent" subtitle="Run your agent automatically." >}}
{{< /cards >}}
