---
title: Schedule an agent
description: Create a schedule in the kagent UI that runs your agent automatically with a prompt that you choose.
weight: 14
author: kagent.dev
---

{{< tutorial-banner >}}

A schedule runs an agent automatically, at times that you choose, with a prompt that you write. Each run starts a new conversation with the agent. In this tutorial, you schedule the personal assistant to write a plan for your day every morning.

## Before you begin

1. Complete [Build an Agent]({{< link path="get-started/build-an-agent" >}}), so that the `personal-assistant` agent exists.
2. Open the kagent UI with `kagent dashboard`.

## Create the schedule

{{< reuse-image src="img/kagent-ui-schedule.gif" alt="The kagent UI creating a daily schedule named morning-brief for the personal-assistant agent" caption="Figure: Creating a daily schedule for the agent, sped up" >}}

1. In the sidebar, click **Schedules**, and then click **New Schedule**.

2. From the **Agent** list, choose `kagent/personal-assistant`.

3. In the **Name** field, enter `morning-brief`.

4. Set when the schedule runs.

   | Field | Value |
   | --- | --- |
   | **Time zone** | `UTC`, or your own time zone. The schedule follows daylight-saving changes in the time zone that you choose. |
   | **Repeat** | **Daily**. The other choices are every few minutes, hourly, weekly, monthly, and a custom schedule. |
   | **At time** | `09:00` |

5. In the **Prompt** field, enter the message that each run sends to the agent, such as `Give me a short plan for today: three priorities and one reminder to take a break.`

6. Leave **Enable Schedule** on, and click **Create schedule**.

The page of the schedule shows its status, the next execution in your local time, and an **Execution history** table that fills in as the schedule runs.

## Run, pause, or change the schedule

Use the buttons at the top of the page of the schedule.

| Button | Action |
| --- | --- |
| **Run** | Start a run now, without waiting for the next scheduled time. |
| **Pause** | Stop future runs until you resume the schedule. |
| **Edit** | Change the agent, the times, or the prompt. |

Each row of the **Execution history** table links to the conversation of that run.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="agents/scheduled-runs" >}}` title="Scheduled runs" subtitle="Read how schedules work and how to define one in YAML." >}}
  {{< card link=`{{< link path="get-started/your-first-agent" >}}` title="Your first agent" subtitle="Build an agent from YAML and the CLI." >}}
{{< /cards >}}
