---
title: Agent Substrate
description: Watch an agent's Actor suspend between turns, pin its state with a checkpoint, and fork that checkpoint into a second agent that continues the conversation.
weight: 10
author: kagent.dev
---

[Agent Substrate]({{< link path="about/architecture/agent-substrate" >}}) runs every agent as an Actor: a sandboxed unit of compute that holds a {{< gloss "Worker" >}}Worker{{< /gloss >}} only while a turn is in progress, and whose state you can pin and branch. This example follows one agent through all three behaviors.

The Actor that these steps follow is also the isolation boundary. Every Actor runs in its own {{< gloss "gVisor" >}}gVisor{{< /gloss >}} sandbox rather than sharing one with its neighbors. This isolation allows a model to safely run tools and execute commands. For what the sandbox blocks, see [Sandboxing]({{< link path="about/substrate-runtime/sandboxing" >}}).

## Before you begin

Checkpoints and {{< gloss "Fork" >}}forks{{< /gloss >}} have no kagent CLI commands yet, so this example calls `CheckpointService` with grpcurl.

{{< reuse "kagent-docs/snippets/grpcurl-prerequisites.md" >}}

5. Create a {{< gloss "Session" >}}Session{{< /gloss >}} and send it a message, then save the Session's ID and the ID of the task that the message produced. A checkpoint pins a completed turn, so the conversation needs at least one.
   ```bash
   export SESSION_ID=$(kagent agent session create --agent my-first-agent -o json | jq -r '.session.id')
   export TASK_ID=$(kagent agent invoke --session $SESSION_ID --task "What is 2+2?" -o json | jq -r '.task.id')
   echo "$SESSION_ID $TASK_ID"
   ```

## Watch the Actor suspend between turns

1. List the Actors in your namespace's {{< gloss "Atespace" >}}atespace{{< /gloss >}}. A Session's Actor name is formatted `session-<session-id>`.
   ```bash
   kubectl ate get actors --atespace kagent
   ```

   Between turns, the Actor reports `ACTOR_STATE_SUSPENDED` and holds no Worker, so the `ATEOM POD` column reads `<none>` and the `ATEOM IP` column is blank. The `VERSION` column is the Actor record's revision counter, which increases each time the record is updated. Example output:
   ```console
   ATESPACE   NAME                                      TEMPLATE                                              STATE                   ATEOM POD   ATEOM IP   VERSION   AGE
   kagent     session-0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10   kagent/my-first-agent-5f2b3c1a9e8d   ACTOR_STATE_SUSPENDED   <none>                 4         11m
   ```

2. Send the agent another message. Nothing in the command acknowledges that the Actor was suspended, because resuming is automatic.
   ```bash
   kagent agent invoke --session $SESSION_ID --task "Summarize this conversation so far."
   ```

3. From a second terminal, list the Actors again while the turn is still running.
   ```bash
   kubectl ate get actors --atespace kagent
   ```

   The same Actor now reports `ACTOR_STATE_RUNNING`, names the Worker pod that it resumed onto, and carries a higher `VERSION`. Example output:
   ```console
   ATESPACE   NAME                                      TEMPLATE                                              STATE                 ATEOM POD                                ATEOM IP      VERSION   AGE
   kagent     session-0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10   kagent/my-first-agent-5f2b3c1a9e8d   ACTOR_STATE_RUNNING   kagent/kagent-default-7c9f8b6d54-x2n4p   10.244.1.37   6         12m
   ```

   If the listing already reads `ACTOR_STATE_SUSPENDED`, the turn finished before the command ran. Repeat steps 2 and 3 to catch the Actor mid-turn. A turn is short, and the two transitions on either side of one, `ACTOR_STATE_RESUMING` and `ACTOR_STATE_SUSPENDING`, pass quickly enough that a single listing rarely catches them.

4. After the turn finishes, list the Actors again.
   ```bash
   kubectl ate get actors --atespace kagent
   ```

   The Actor is back to `ACTOR_STATE_SUSPENDED` and holds no Worker again, at a higher `VERSION` than the listing in step 1. The `NAME` and `AGE` columns confirm that this is the same Actor throughout, rather than a new one per turn. Example output:
   ```console
   ATESPACE   NAME                                      TEMPLATE                                              STATE                   ATEOM POD   ATEOM IP   VERSION   AGE
   kagent     session-0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10   kagent/my-first-agent-5f2b3c1a9e8d   ACTOR_STATE_SUSPENDED   <none>                 8         13m
   ```

5. Check the Session while its Actor is suspended.
   ```bash
   kagent agent session list
   ```

   The Session reports `READY`, even though the Actor that runs it holds no Worker. Example output:
   ```console
   +--------------------------------------+----------------+-------+----------------------+
   | ID                                   | AGENT          | STATE | CREATED              |
   +--------------------------------------+----------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | READY | 2026-08-31T15:02:10Z |
   +--------------------------------------+----------------+-------+----------------------+
   ```

The Session stays `READY` throughout all steps. A suspended agent remains listed and readable because suspension is a property of the Actor underneath the conversation, not of the conversation itself. For the full cycle, see [Suspend and resume]({{< link path="about/substrate-runtime/suspend-and-resume" >}}).

> [!NOTE]
> Two objects report state on this page, and each interface names its states differently. `kubectl ate get actors` reports the Actor's state in full, such as `ACTOR_STATE_SUSPENDED`, because the command prints the Agent Substrate enum name. The kagent CLI trims the prefix from the Session's state and prints `READY`, and the same value reaches you as `RUNTIME_STATE_READY` in a `grpcurl` response. Checkpoints have no CLI command yet, so the next section calls the API directly and reads the checkpoint's state in full, as `CHECKPOINT_STATE_READY`.

## Pin the conversation with a checkpoint

Each suspend writes a {{< gloss "Snapshot" >}}snapshot{{< /gloss >}}, and Agent Substrate is free to collect that snapshot once a newer one supersedes it. A {{< gloss "Checkpoint" >}}checkpoint{{< /gloss >}} pins a snapshot so that you can come back to it.

1. Create a checkpoint. The checkpoint records the snapshot that it pinned and how far the {{< gloss "Transcript" >}}transcript{{< /gloss >}} had advanced. `expectedHeadTaskId` names the terminal task to pin, so the call fails rather than pinning the wrong turn when the conversation has advanced. The `requestId` field is a required idempotency key of 1 to 128 characters, so reusing it returns the same checkpoint rather than creating a second one.
   ```bash
   grpcurl -plaintext \
     -d '{"sessionId":"'"$SESSION_ID"'","expectedHeadTaskId":"'"$TASK_ID"'","requestId":"'"$(uuidgen)"'"}' \
     localhost:8083 kagent.api.v1alpha1.CheckpointService/CreateCheckpoint
   ```

   Example output:
   ```json
   {
     "checkpoint": {
       "id": "0198c3e2-8a41-7d05-b6c2-1f4e9a7b3c58",
       "sessionId": "0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10",
       "headTaskId": "0198c3d9-b7e3-7a24-8f10-6c2d5e8a1b47",
       "historySequence": "4",
       "state": "CHECKPOINT_STATE_READY",
       "createdAt": "2026-08-31T15:12:44Z",
       "name": "my-first-agent turn 4"
     }
   }
   ```

   > [!NOTE]
   > A checkpoint captures a turn boundary, so the named task must be terminal and its snapshot must be written. A newer turn that has already started fails the call with `conversation advanced beyond the expected task`, and a snapshot that is still being written fails it with `snapshot for the expected task is not ready`. The second is safe to retry with the same values; the first needs a newer task ID.

2. Save the checkpoint's `id` to fork from it in the next section.
   ```bash
   export CHECKPOINT_ID=<your-checkpoint-id>
   ```

3. List the checkpoints on the Session at any time. Omit `limit` for the default page of 50, up to a maximum of 100.
   ```bash
   grpcurl -plaintext \
     -d '{"sessionId":"'"$SESSION_ID"'","page":{"limit":50}}' \
     localhost:8083 kagent.api.v1alpha1.CheckpointService/ListCheckpoints
   ```

Underneath, the checkpoint attaches a {{< gloss "Tag" >}}Tag{{< /gloss >}} named `checkpoint-<checkpoint-id>` to the snapshot, and Agent Substrate does not collect a snapshot while a tag names it. You can see the tag by running `kubectl ate get tags --atespace kagent`.

## Fork the conversation into a second agent

Forking creates a second Session from the pinned snapshot, running the revision that the checkpoint was taken on. The fork continues the conversation from the checkpoint: it inherits the {{< gloss "Transcript" >}}transcript{{< /gloss >}} up to that point, along with the Actor's durable state.

> [!NOTE]
> The two branches share everything up to the checkpoint and nothing after it. New turns append only to the Session that received them, so the original's history and the checkpoint itself stay unchanged no matter what the fork goes on to do. Each branch runs its own Actor.

1. Fork the checkpoint.
   ```bash
   grpcurl -plaintext \
     -d '{"checkpointId":"'"$CHECKPOINT_ID"'","requestId":"'"$(uuidgen)"'"}' \
     localhost:8083 kagent.api.v1alpha1.CheckpointService/ForkSession
   ```

   The response carries a new Session with its own ID. Example output:
   ```json
   {
     "session": {
       "id": "0198c3e5-1d62-7f38-a904-8b3c7e2f5d16",
       "agent": {
         "namespace": "kagent",
         "name": "my-first-agent"
       },
       "state": "RUNTIME_STATE_READY",
       "contextId": "0198c3e5-1d62-7f38-a904-8b3c7e2f5d16",
       "name": "my-first-agent turn 4"
     }
   }
   ```

   A fork receives fresh conversation and task IDs rather than inheriting the source's, so `contextId` is the fork's own `id`. The transcript it replays stops at the checkpoint's boundary. The fork takes the checkpoint's `name` as its own.

2. Save the fork's ID, then ask it about a turn that happened before the checkpoint.
   ```bash
   export FORK_ID=<your-fork-session-id>
   kagent agent invoke --session $FORK_ID --task "What did I ask you first?"
   ```

   The fork answers from the conversation it inherited. That is the difference between a fork and a new Session on the same Agent. Send the original a different question and the two diverge from here.

3. List your Sessions to verify that both appear as separate conversations.
   ```bash
   kagent agent session list
   ```

   The two rows share an Agent, and differ in their IDs and creation times. Each one has its own Actor, named `session-<session-id>`. Example output:
   ```console
   +--------------------------------------+----------------+-------+----------------------+
   | ID                                   | AGENT          | STATE | CREATED              |
   +--------------------------------------+----------------+-------+----------------------+
   | 0198c3d7-4f2a-7b61-9c3e-5d8f7a2b4e10 | my-first-agent | READY | 2026-08-31T15:02:10Z |
   | 0198c3e5-1d62-7f38-a904-8b3c7e2f5d16 | my-first-agent | READY | 2026-08-31T15:14:02Z |
   +--------------------------------------+----------------+-------+----------------------+
   ```

A fork runs the compiled {{< gloss "Revision" >}}revision{{< /gloss >}} that its checkpoint was taken on, not whatever revision the Agent resolves to now. Editing the Agent after checkpointing does not change what a fork of that checkpoint runs. That stability is the point of a checkpoint: it holds a known-good configuration you can return to, rather than tracking the template as it moves on.

> [!NOTE]
> A checkpoint can only be forked when its snapshot captured durable data alone. kagent compiles every ActorTemplate to take a `Data`-scope snapshot on commit, so a checkpoint taken on a suspended Session is forkable. A checkpoint whose snapshot also captured process state is rejected with `Checkpoint includes process state and cannot be forked`, because process memory belongs to the one Actor that produced it.

## Clean up

1. Delete the checkpoint. Deleting removes the Tag and releases the pin, and Agent Substrate can collect the snapshot whenever no tag names it.
   ```bash
   grpcurl -plaintext \
     -d '{"checkpointId":"'"$CHECKPOINT_ID"'"}' \
     localhost:8083 kagent.api.v1alpha1.CheckpointService/DeleteCheckpoint
   ```

2. Delete the fork. A fork is a Session in its own right, so deleting the checkpoint that it started from does not remove it.
   ```bash
   kagent agent session delete $FORK_ID
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="about/substrate-runtime/suspend-and-resume" >}}` title="Suspend and resume" subtitle="Understand the snapshot cycle that checkpoints pin." >}}
  {{< card link=`{{< link path="about/substrate-runtime/sandboxing" >}}` title="Sandboxing" subtitle="See what the sandbox around each Actor isolates." >}}
  {{< card link=`{{< link path="about/substrate-runtime/identity" >}}` title="Identity" subtitle="See who owns a Session and the checkpoints taken on it." >}}
{{< /cards >}}
