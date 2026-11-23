---
title: Create a prompt library
description: Create a library of reusable prompt fragments in the kagent UI.
weight: 12
author: kagent.dev
---

{{< tutorial-banner >}}

A prompt library is a named set of prompt fragments, such as a tone of voice or a list of safety rules. Agents include a fragment by its key, so the text lives in one place and a change reaches every agent that uses it. kagent installs one library, `kagent-builtin-prompts`. In this tutorial, you create your own in the kagent UI.

## Before you begin

1. [Install kagent]({{< link path="setup" >}}).
2. Open the kagent UI with `kagent dashboard`.

## Create the library

{{< reuse-image src="img/kagent-ui-prompt-library.gif" alt="The kagent UI creating a prompt library named assistant-prompts with two fragments" caption="Figure: Creating a prompt library with two fragments, sped up" >}}

1. In the sidebar, click **Prompts**, and then click **New Library**.

2. In the **Name** field, enter `assistant-prompts`. Leave the **Namespace** as `kagent`.

3. Click **Add fragment**, and enter a key and the fragment text.

   | Key | Fragment text |
   | --- | --- |
   | `tone` | `Be friendly and concise. Use plain language and short sentences.` |

4. Click **Add fragment** again, and add a second fragment.

   | Key | Fragment text |
   | --- | --- |
   | `safety-rules` | `Never share personal data. Say so when you are not sure of an answer.` |

   Beside each fragment, the form shows the tag that pulls the fragment into a prompt, such as `{{ include "assistant-prompts/tone" }}`.

5. Click **Create library**. The **Prompts** page lists the library with its keys.

## Use a fragment in an agent

kagent stores a library as a ConfigMap of the same name, in the namespace that you chose. An agent can use it in two ways.

* **As the whole system prompt:** In the template form, set **System prompt** to **Read from a ConfigMap**, so that the prompt comes from one key of the library.
* **As part of a prompt:** List the library as a data source of the template, and place the `include` tag where the fragment belongs. For the YAML, see [Template the prompt]({{< link path="agents/system-prompts#template-the-prompt" >}}).

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/system-prompts" >}}` title="System prompts" subtitle="Write, store, and template the prompt of an agent." >}}
  {{< card link=`{{< link path="get-started/egress-policy" >}}` title="Create a policy" subtitle="Create an egress policy in the UI." >}}
{{< /cards >}}
