---
title: Add a model
description: Add a second model configuration in the kagent UI, so that your agents can use another provider.
weight: 3
author: kagent.dev
---

An agent reaches its model through a model configuration, which names a provider, a model, and where the API key is stored. The installation created one, `default-model-config`, from the API key that you set. In this tutorial, you add a second one for another provider in the kagent UI.

## Before you begin

1. Optional: Complete [Build an Agent]({{< link path="get-started/build-an-agent" >}}), if you want an agent to try the model with.
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

## Use the model

A template names its model configuration, so to move an agent to the new model, change that one field.

1. In the sidebar, click **Agents**. In the row of the `personal-assistant` agent, click the edit icon.
2. From the **Model configuration** list, choose the new configuration.
3. Click **Save agent**.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="setup/model-providers" >}}` title="Configure model providers" subtitle="Read the settings for each provider, and how to share a model across namespaces." >}}
  {{< card link=`{{< link path="get-started/prompt-library" >}}` title="Create a prompt library" subtitle="Keep reusable prompt text in one place." >}}
{{< /cards >}}
