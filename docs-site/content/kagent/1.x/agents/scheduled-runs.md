---
title: Scheduled runs
description: Run an agent on a cron schedule that sends a fixed prompt to a new Session for each execution.
weight: 65
author: kagent.dev
---

A schedule sends a fixed prompt to an {{< gloss "Agent" >}}Agent{{< /gloss >}} on a cron schedule. Each execution of the schedule starts a new {{< gloss "Session" >}}Session{{< /gloss >}}. You can open that Session afterward and send more messages to the agent. You can also start an execution immediately, outside the schedule.

kagent stores schedules in its database, not as Kubernetes resources. You manage schedules in the kagent UI or through the `kagent.api.v1.ScheduledRunService` gRPC API. The `kagent` CLI does not manage schedules.

## Before you begin

1. [Install kagent]({{< link path="setup/installation" >}}). To call the API with grpcurl, set `config.server.grpcReflection=true`. grpcurl uses server reflection to find the `ScheduledRunService` methods.
2. Create an Agent that answers a prompt, such as the one in [Your first agent]({{< link path="get-started/your-first-agent" >}}).

## Create a schedule in the UI

The kagent UI builds the cron expression from a form, so the UI is the simplest way to create a schedule.

1. [Open the kagent UI]({{< link path="ui/launch-ui" >}}).
2. In the navigation, click **Schedules**, and then click **New Schedule**.

   If the agent has no schedules yet, you can also click **Create a schedule** on the **Schedules** card of the **Agent Details** page.
3. In the **Agent** list, select the agent to run.
4. Optional: In **Schedule Name**, enter a name of up to 200 characters.
5. In **Time zone**, enter an Internet Assigned Numbers Authority (IANA) time zone name, such as `America/New_York`. If the field is empty, the schedule uses UTC.
6. In **Repeat**, select how often the agent runs. Each option shows its own fields.
   * **Every few minutes** asks for an interval of 1, 5, 10, 15, 20, or 30 minutes.
   * **Hourly** asks for the minute past the hour.
   * **Daily** asks for the time.
   * **Weekly** asks for the days and the time.
   * **Monthly** asks for the day of the month and the time.
   * **Custom (advanced)** asks for a cron expression with five fields.
7. In **Prompt**, enter the message that the agent receives on each execution.
8. Optional: In **Execution timeout (seconds)**, change the limit for each execution. The default is 900 seconds.
9. To create the schedule in a paused state, turn off **Enable Schedule**.
10. Click **Create schedule**. The UI opens the page for the new schedule.

The **Schedules** page lists the schedule with its status and its next execution time. The page shows the time in your browser's local time zone.

## Manage a schedule in the UI

The page for one schedule contains the controls for that schedule and its execution history. To open the page, click the schedule's name on the **Schedules** page or on the **Schedules** card of the agent's **Agent Details** page.

* **Run** starts an execution immediately. A manual execution does not change the next scheduled execution. **Run** also works on a paused schedule.
* **Pause** stops future scheduled executions. **Resume** starts them again.
* **Edit** changes the schedule's configuration.
* **Delete schedule**, in the **Danger zone** section, stops future executions. An execution that already started continues to the end.

The **Execution history** table shows the trigger, state, and failure reason of each execution. To open the Session that an execution started, click **Open conversation**.

## Manage schedules with the API

The `ScheduledRunService` API exposes the same operations as the UI, so a script or a continuous integration (CI) job can manage schedules. The examples in this section use [grpcurl](https://github.com/fullstorydev/grpcurl) to call the API, and they target an Agent named `my-first-agent` in the `kagent` namespace. Requests use snake_case field names, and responses use camelCase field names, such as `time_zone` and `timeZone`.

1. Port-forward the controller's gRPC port.
   ```bash
   kubectl port-forward -n kagent svc/kagent-controller 8083:8083
   ```

2. Create a schedule. The `request_id` field makes the call safe to retry. A second call with the same `request_id` and the same inputs returns the existing schedule.
   ```bash
   grpcurl -plaintext -d '{
     "agent": {"namespace": "kagent", "name": "my-first-agent"},
     "request_id": "weekday-check-1",
     "config": {
       "name": "Weekday cluster check",
       "schedule": "0 9 * * 1-5",
       "time_zone": "America/New_York",
       "prompt": "Summarize any pods that are not Running in the kagent namespace.",
       "execution_timeout": "900s"
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

3. Start an execution immediately. Replace `<id>` with the `id` value from the `CreateScheduledRun` response. A repeated call with the same `request_id` returns the same execution.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>",
     "request_id": "manual-run-1"
   }' localhost:8083 kagent.api.v1.ScheduledRunService/TriggerScheduledRun
   ```

   Example output:
   ```json
   {
     "execution": {
       "id": "01a1a3b6-ac2f-711e-a6ca-0c726aeabb9b",
       "scheduledRunId": "1df2a30a-9030-4674-9841-620ab6bc22ca",
       "manualRequestId": "manual-run-1",
       "state": "SCHEDULED_RUN_EXECUTION_STATE_PENDING",
       ...
     }
   }
   ```

4. Check the execution. Replace `<execution_id>` with the `execution.id` value from the `TriggerScheduledRun` response.
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

5. Pause the schedule. `UpdateScheduledRun` replaces the whole configuration. Send every field that you want to keep, not only the changed field. The `etag` must match the schedule's current `etag`. If the `etag` is stale, the call returns `Aborted`. Call `GetScheduledRun` for the current `etag`, and then retry.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>",
     "etag": "<etag>",
     "config": {
       "name": "Weekday cluster check",
       "schedule": "0 9 * * 1-5",
       "time_zone": "America/New_York",
       "prompt": "Summarize any pods that are not Running in the kagent namespace.",
       "execution_timeout": "900s",
       "paused": true
     }
   }' localhost:8083 kagent.api.v1.ScheduledRunService/UpdateScheduledRun
   ```

   The response omits `nextExecutionTime` while the schedule is paused. To resume the schedule, send the same request with `"paused": false` and the `etag` value from the `UpdateScheduledRun` response.

6. Delete the schedule.
   ```bash
   grpcurl -plaintext -d '{
     "scheduled_run_id": "<id>"
   }' localhost:8083 kagent.api.v1.ScheduledRunService/DeleteScheduledRun
   ```

   The response sets `deletedAt`. `ListScheduledRuns` no longer returns the schedule. `GetScheduledRun` and `ListScheduledRunExecutions` still return the schedule and its history. A `TriggerScheduledRun` call with a new `request_id` returns `FailedPrecondition`.

## Schedule configuration

The `ScheduledRunConfig` message contains the settings that you can change after you create a schedule. You cannot change the Agent after you create the schedule. If the Agent does not exist when you create the schedule, the call returns `FailedPrecondition`.

| Field | Description |
| --- | --- |
| `name` | Optional display name, up to 200 characters. |
| `schedule` | A cron expression with exactly five fields: minute, hour, day of month, month, and day of week. The API rejects macros such as `@daily` and `@every 1h`. |
| `time_zone` | An IANA time zone name, such as `Europe/Berlin`. The default is UTC. The API rejects the value `Local`, because the result would depend on the controller's host. Executions follow daylight-saving changes in the time zone. |
| `prompt` | Required. The message that each execution sends to the agent. The prompt must contain text other than whitespace, and it can be up to 32 KiB. |
| `paused` | When set to `true`, the schedule does not create scheduled executions. A manual trigger still runs. |
| `execution_timeout` | The time limit for each execution, as a protobuf duration such as `"1800s"`. The default is 900 seconds (15 minutes). The limit counts from the moment that kagent accepts the execution, so it includes queueing and Actor provisioning as well as the agent's work. |

## Schedule ownership

A schedule belongs to the user who creates it, by the same [creator ownership]({{< link path="about/substrate-runtime/identity#creator-ownership" >}}) rules that apply to Sessions. Only the creator can see, change, trigger, or delete the schedule. A call from any other user returns `NotFound`, not a permission error. The Sessions that a schedule creates belong to the same creator. A [session share]({{< link path="agents/share-a-session" >}}) never grants access to a schedule.

The creator's identity does not select credentials for the model or for tool calls. Each execution uses the credentials that are configured on the Agent.

To create schedules from unattended automation, call the API as a Kubernetes ServiceAccount. For how the controller turns a ServiceAccount into a creator, see [Service account callers]({{< link path="about/substrate-runtime/identity#service-account-callers" >}}).

> [!WARNING]
> **`insecure` mode is not a security boundary in a default install.** `config.server.auth.mode` defaults to `insecure`, where a caller supplies its own identity in `X-User-Id`. A call without that header runs as `admin@kagent.dev`. A caller can claim any identity and reach any user's schedules. For the modes themselves, see [Controller authentication modes]({{< link path="about/substrate-runtime/identity#controller-authentication-modes" >}}).

## Execution behavior

Each scheduled time or manual trigger creates one execution record. The execution record stores only the prompt that the schedule sent. The Session stores the transcript. A reply that you send later in that Session does not change the execution.

An execution moves through these states.

| State | Meaning |
| --- | --- |
| `PENDING` | kagent accepted the execution and is preparing its Session. |
| `RUNNING` | kagent sent the prompt to the agent. |
| `SUCCEEDED` | The agent's task completed. |
| `FAILED` | The agent's task ended in a state other than completed, or the Session was deleted before the task finished. The `failure_reason` field states the cause. |
| `TIMED_OUT` | The execution timeout elapsed before the agent's task ended. kagent cancels the agent's task. A task that waits for [human approval]({{< link path="agents/human-in-the-loop" >}}) at the deadline also ends as `TIMED_OUT`. |

The following rules control when an execution runs and what its record stores.

* **Missed times are skipped.** When kagent cannot start an execution within 30 seconds of its scheduled time, kagent skips that time and waits for the next one. A controller outage therefore does not produce a burst of executions when the controller returns.
* **Configuration changes apply to future executions.** An execution uses the prompt and the timeout that were current when kagent accepted it.
* **A prompt is sent only once.** If the agent's runtime does not accept the prompt, kagent does not resend it, because a resend could duplicate the agent's work. The execution stays in `RUNNING` until the timeout. <!-- REVIEW: at rc1 such an execution can stay RUNNING past its deadline indefinitely, because the deadline path suspends the Session first and the suspend fails on a crashed or unreachable Actor. Reproduced on rc1 2026-11-04. Restore "and then ends as TIMED_OUT" once kagent fixes this. -->
* **History outlives its Sessions.** An execution keeps its `session_id` after the Session is deleted. The ID is a historical reference and does not mean that the Session still exists.

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Controller identity" subtitle="How the controller resolves the creator that owns a schedule." >}}
  {{< card link=`{{< link path="agents/human-in-the-loop" >}}` title="Human in the loop" subtitle="Approval requests during an agent's task." >}}
{{< /cards >}}
