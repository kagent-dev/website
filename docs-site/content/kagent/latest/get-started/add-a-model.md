---
title: Add a model
description: Add a model from a second provider in the kagent UI, and run an agent on it beside your default model.
weight: 15
author: kagent.dev
---

{{< tutorial-banner >}}

**Use case:** your team wants to run an agent on a different provider, or to compare two models on the same task.

An agent reaches its model through a model configuration, which names a provider, a model, and where the API key is stored. The installation created one, `default-model-config`, from the API key that you set. In this tutorial, you add a second configuration for another provider in the kagent UI, and create an agent that uses it. Your other agents keep the model that they have.

This tutorial stands on its own. It does not depend on the personal assistant path.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Have an API key for the provider that you want to add. This tutorial uses Anthropic.
3. Open the kagent UI with `kagent dashboard`.

## Add the model

{{< reuse-image src="img/kagent-ui-add-model.gif" alt="The kagent UI adding an Anthropic model configuration and listing it on the Models page" caption="Figure: Adding an Anthropic model configuration, sped up" >}}

1. In the sidebar, click **Models**, and then click **New Model**.

2. From the **Provider** list, choose a provider, such as **Anthropic**.

3. From the **Model** list, choose a model, such as `claude-sonnet-5-5`. To use a model that is not listed, type its name.

4. Leave **Name** empty to name the configuration after the model, and leave **Namespace** as `kagent`.

5. Under **Authentication**, leave **API key** selected, and enter your API key. kagent stores the key in a Kubernetes Secret that the controller creates.

6. Click **Create model**. The **Models** page lists the new configuration with its provider, its model, and the Secret that holds the key.

## Run an agent on the new model

Create an agent that uses the new configuration, so that you can try the model without changing the agents that you already have.

1. In the sidebar, click **Agents**, and then click **New Agent**.

2. In the **Name** field, enter `second-opinion`.

3. In the **Template** section, select **Inline**, and fill in the template.

   | Field | Value |
   | --- | --- |
   | **Model configuration** | The configuration that you created, such as `kagent/claude-sonnet-5-5`. |
   | **Description** | `Answers on a second model` |
   | **System prompt** | `You are a concise, helpful assistant.` |

4. Click **Create agent**, and then click **Refresh** until the agent is **Ready**.

To compare the two models, send the same message to this agent and to an agent that uses `default-model-config`.

To move an existing agent to the new model instead, open the agent's edit form, choose the configuration from the **Model configuration** list, and click **Save agent**.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Read the settings for each provider, and how to share a model across namespaces." >}}
  {{< card link=`{{< link path="get-started" >}}` title="Tutorials" subtitle="Build a personal assistant in the UI, step by step." >}}
{{< /cards >}}
