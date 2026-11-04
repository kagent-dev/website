---
title: Scheduled runs
description: Run an agent on a cron schedule, where each run sends a fixed prompt to a new Session.
weight: 65
author: kagent.dev
---

A scheduled run sends a fixed prompt to an {{< gloss "Agent" >}}Agent{{< /gloss >}} on a cron schedule. Each run starts a new {{< gloss "Session" >}}Session{{< /gloss >}}, so every run is a separate conversation that you can open and continue afterward. You can also start a run immediately, outside the schedule.

kagent stores schedules in its database, not as Kubernetes resources. You manage them in the kagent UI or through the `kagent.api.v1.ScheduledRunService` gRPC API. The `kagent` CLI has no schedule commands.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}).
2. Create an Agent that answers a prompt, such as the one in [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Create a schedule in the UI

The kagent UI builds the cron expression from a form, so the UI is the simplest way to create a schedule.

1. [Open the kagent UI]({{< link path="ui/launch-ui" >}}).
2. In the navigation, click **Schedules**, and then click **New Schedule**. You can also open an agent and click **Create a schedule** on its **Schedules** card.
3. In the **Agent** list, select the agent to run.
4. Optional: In **Schedule Name**, enter a name of up to 200 characters.
5. In **Time zone**, enter an IANA time zone name, such as `America/New_York`. When the field is empty, the schedule uses UTC.
6. In **Repeat**, select how often the agent runs, and then fill in the fields for that option.
   * **Every few minutes** runs at an interval of 1, 5, 10, 15, 20, or 30 minutes.
   * **Hourly**, **Daily**, **Weekly**, and **Monthly** ask for the minute, time, days, or day of the month.
   * **Custom (advanced)** takes a cron expression with five fields.
7. In **Prompt**, enter the message that the agent receives on each run.
8. Optional: In **Execution timeout (seconds)**, change the limit for each run. The default is 900 seconds.
9. To create the schedule without running it, turn off **Enable Schedule**.
10. Click **Create schedule**.

The **Schedules** page lists the new schedule with its status and its next execution time, in your browser's local time zone.

## Manage a schedule in the UI

The page for one schedule holds the controls for that schedule and its execution history. To open the page, click the schedule's name on the **Schedules** page or on the agent's **Schedules** card.

* **Run** starts an execution immediately. A manual run does not change the next scheduled execution, and it works on a paused schedule.
* **Pause** stops future scheduled executions. **Resume** starts them again.
* **Edit** changes the schedule's configuration. A change applies only to executions that have not started yet.
* **Delete schedule**, in the **Danger zone** section, stops future executions. An execution that already started continues to the end.

The **Execution history** table shows the trigger, state, and failure reason of each execution. To continue the conversation that an execution started, click **Open conversation**.

## Manage schedules with the API

The `ScheduledRunService` API exposes the same operations as the UI, so a script or a CI job can manage schedules. These examples call the API with [grpcurl](https://github.com/fullstorydev/grpcurl) and an Agent named `my-first-agent` in the `kagent` namespace.

1. Port-forward the controller's gRPC port, and confirm that your kagent installation sets `config.server.grpcReflection=true`.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. Create a schedule. The `request_id` makes the call safe to retry, because a second call with the same `request_id` and the same inputs returns the existing schedule rather than creating another one.
   ```bash
   grpcurl -plaintext -d '{
     "agent": {"namespace": "kagent", "name": "my-first-agent"},
     "request_id": "weekday-check-1",
     "config": {
       "name": "Weekday cluster check",
       "schedule": "0 9 * * 1-5",
       "time_zone": "America/New_York",
       "prompt": "Summarize any pods that are not Running in the kagent namespace."
     }
   }' localhost:8083 kagent.api.v1.ScheduledRunService/CreateScheduledRun
   ```

   Example output:
   ```json
   {
     "scheduledRun": {
       "id": "1df2a30a-9030-4674-9841-620ab6bc22ca",
       "creator": "admin@kagent.dev",
       "config": {
         "name": "Weekday cluster check",
         "schedule": "0 9 * * 1-5",
         "timeZone": "America/New_York",
         "prompt": "Summarize any pods that are not Running in the kagent namespace.",
         "executionTimeout": "900s"
       },
       "etag": "a711c6b3-4721-4fa9-b6a7-2b85e87ea84d",
       "nextExecutionTime": "2026-11-04T14:00:00Z",
       ...
     }
   }
   ```

   Save the `id` and the `etag` values for the next steps.

3. Start an execution immediately. Each `request_id` starts one execution. A repeated call with the same `request_id` returns the same execution.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>",
     "request_id": "manual-run-1"
   }' localhost:8083 kagent.api.v1.ScheduledRunService/TriggerScheduledRun
   ```

4. Check the execution. Replace `<execution_id>` with the `execution.id` value from the previous step.
   ```bash
   grpcurl -plaintext -d '{
     "execution_id": "<execution_id>"
   }' localhost:8083 kagent.api.v1.ScheduledRunService/GetScheduledRunExecution
   ```

   Example output:
   ```json
   {
     "execution": {
       "id": "01a1a3b6-ac2f-711e-a6ca-0c726aeabb9b",
       "scheduledRunId": "1df2a30a-9030-4674-9841-620ab6bc22ca",
       "manualRequestId": "manual-run-1",
       "sessionId": "01a1a3b6-ad45-788f-bb9c-57b4471a6d6c",
       "state": "SCHEDULED_RUN_EXECUTION_STATE_SUCCEEDED",
       "taskId": "01a1a3b6-af28-7365-ad33-2de74e9e7dc8",
       ...
     }
   }
   ```

   The `sessionId` is the Session that the execution created. To list every execution of a schedule, call `ListScheduledRunExecutions` with the `scheduled_run_id`.

5. Pause the schedule. `UpdateScheduledRun` replaces the whole configuration, so send every field that you want to keep, not only the changed field. The `etag` must match the schedule's current `etag`. A stale `etag` returns `Aborted`, and you must get the schedule again before you retry.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>",
     "etag": "<etag>",
     "config": {
       "name": "Weekday cluster check",
       "schedule": "0 9 * * 1-5",
       "time_zone": "America/New_York",
       "prompt": "Summarize any pods that are not Running in the kagent namespace.",
       "paused": true
     }
   }' localhost:8083 kagent.api.v1.ScheduledRunService/UpdateScheduledRun
   ```

   The response omits `nextExecutionTime` while the schedule is paused. To resume the schedule, send the same request with `"paused": false` and the new `etag`.

6. Delete the schedule.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>"
   }' localhost:8083 kagent.api.v1.ScheduledRunService/DeleteScheduledRun
   ```

   The response sets `deletedAt`. `ListScheduledRuns` no longer returns the schedule, but `GetScheduledRun` and `ListScheduledRunExecutions` still return the schedule and its history. A `TriggerScheduledRun` call with a new `request_id` returns `FailedPrecondition`.

## Schedule configuration

The `ScheduledRunConfig` message holds the settings that you can change after you create a schedule. The Agent that a schedule runs is set at creation and cannot change. The Agent must exist when you create the schedule, or the call returns `FailedPrecondition`.

| Field | Description |
| --- | --- |
| `name` | Optional display name, up to 200 characters. |
| `schedule` | A cron expression with exactly five fields: minute, hour, day of month, month, and day of week. Macros such as `@daily` and `@every 1h` are rejected. |
| `time_zone` | An IANA time zone name, such as `Europe/Berlin`. The default is UTC. The value `Local` is rejected, because the result would depend on the controller's host. Executions follow daylight-saving changes in the time zone. |
| `prompt` | Required. The message that each execution sends to the agent. The prompt must contain text other than whitespace, and it can be up to 32 KiB. |
| `paused` | When set to `true`, the schedule creates no scheduled executions. A manual trigger still runs. |
| `execution_timeout` | The time limit for each execution, as a protobuf duration such as `"1800s"`. The default is 15 minutes. The limit counts from the moment that kagent accepts the execution, so it includes queueing and Actor provisioning as well as the agent's work. |

## Schedule ownership

A schedule belongs to the user who creates it, by the same [creator ownership]({{< link path="about/substrate-runtime/identity#creator-ownership" >}}) rules that apply to Sessions. Only the creator can see, change, trigger, or delete the schedule. For any other user, the schedule does not exist, and a call returns `NotFound` rather than a permission error. The Sessions that a schedule creates belong to the same creator. A [session share]({{< link path="agents/share-a-session" >}}) never grants access to a schedule.

The creator is the owner of the schedule, not a credential for its runs. The agent runs with its own configured credentials, and the creator's identity does not select credentials for the model or for tool calls.

To create schedules from unattended automation, call the API as a Kubernetes ServiceAccount. For how the controller turns a ServiceAccount into a creator, see [Service account callers]({{< link path="about/substrate-runtime/identity#service-account-callers" >}}).

> [!WARNING]
> **`insecure` mode is not a security boundary in a default install.** `config.server.auth.mode` defaults to `insecure`, where a caller supplies its own identity in `X-User-Id`. A call without that header runs as `admin@kagent.dev`. A caller can claim any identity and reach any user's schedules. For the modes themselves, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}).

## Execution behavior

Each scheduled time or manual trigger creates one execution record. The execution record tracks the first prompt that the schedule sent. The Session holds the transcript, and a reply that you send later in that Session does not change the execution.

An execution moves through these states.

| State | Meaning |
| --- | --- |
| `PENDING` | kagent accepted the execution and is preparing its Session. |
| `RUNNING` | kagent sent the prompt to the agent. |
| `SUCCEEDED` | The agent's task completed. |
| `FAILED` | The agent's task ended in a state other than completed, or the Session was deleted before the task finished. The `failure_reason` field names the cause. |
| `TIMED_OUT` | The execution timeout elapsed first. kagent cancels the agent's task. A task that waits for [human approval]({{< link path="agents/human-in-the-loop" >}}) at the deadline also ends as `TIMED_OUT`. |

Several rules decide which executions run.

* **Missed times are skipped.** When kagent cannot start an execution within 30 seconds of its scheduled time, kagent skips that time and waits for the next one. A controller outage therefore does not produce a burst of runs when the controller returns.
* **Configuration changes apply to future executions.** An execution keeps the prompt and the timeout that were current when kagent accepted it.
* **A prompt is sent only once.** If the agent's runtime does not accept the prompt, kagent does not resend it, because a resend could duplicate the agent's work. The execution stays in `RUNNING` until the timeout. <!-- REVIEW: at rc1 such an execution can stay RUNNING past its deadline indefinitely, because the deadline path suspends the Session first and the suspend fails on a crashed or unreachable Actor. Reproduced on rc1 2026-11-04. Restore "and then ends as TIMED_OUT" once kagent fixes this. -->
* **History outlives its Sessions.** An execution keeps its `session_id` after the Session is deleted. The ID is a historical reference and does not mean that the Session still exists.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Controller identity" subtitle="How the controller resolves the creator that owns a schedule." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Approval requests, which a scheduled run cannot wait on past its timeout." >}}
{{< /cards >}}
