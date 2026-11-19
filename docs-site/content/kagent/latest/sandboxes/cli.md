---
title: Run commands with the CLI
description: Create a Sandbox, run commands, move files in and out, and suspend, resume, and delete it with the kagent CLI.
weight: 30
author: kagent.dev
aliases:
  - /kagent/latest/about/substrate-runtime/standalone-sandboxes/
  - /kagent/latest/substrate-runtime/standalone-sandboxes/
---

The `kagent sandbox` commands give a person or a script a scratch environment on demand. In this guide, you create a Sandbox, run a script against a file that you upload, download the result, and then walk the Sandbox through its lifecycle.

## Before you begin

1. {{< reuse "kagent-docs/snippets/install-cli.md" >}}

2. Create a SandboxTemplate whose image includes Python, as described in [Set up sandbox templates]({{< link path="sandboxes/templates" >}}). The steps in this guide use the `python` template in the `kagent` namespace.

3. To read the Sandbox ID from the CLI's JSON output, install [`jq`](https://jqlang.org/download/).

## Create a Sandbox

1. List the templates that you can create a Sandbox from. The list includes only the templates in the namespace that `--namespace` selects, which defaults to `kagent`.
   ```bash
   kagent sandbox templates
   ```

   Example output:
   ```console
   NAMESPACE  NAME    IMAGE
   kagent     python  docker.io/library/python:3.13-slim@sha256:e48f59cdba69a3cbd9ed2cf0f348d90d45a8d350d98134cf1070bc106ee9ed90
   ```

2. Generate a request ID for this walkthrough, then create a Sandbox and save its ID. To retry the create command, reuse `$REQUEST_ID`. To start a new walkthrough after deleting or expiring the Sandbox, generate a new request ID.
   ```bash
   export REQUEST_ID="cli-$(uuidgen)"
   export SANDBOX_ID=$(kagent sandbox create python \
     --request-id "$REQUEST_ID" --name my-first-sandbox --ttl 30m \
     -o json | jq -er '.id | select(length > 0)')
   echo $SANDBOX_ID
   ```

   | Flag | Description |
   | ---- | ----------- |
   | `--request-id` | Required. A key that makes the call safe to retry. To retry a failed create, repeat the command with the same request ID and the same flags. A new request ID creates a second Sandbox. |
   | `--name` | Optional. A display name. |
   | `--ttl` | Optional. The Sandbox's lifetime, such as `30m`. When you omit it, the installation's default applies, which is one hour unless an operator changes it. The installation also caps the lifetime, at 24 hours by default. |

3. Check the Sandbox. A Sandbox is ready for commands when `STATE` is `RUNTIME_STATE_READY` and `OPERATION` is `RUNTIME_OPERATION_NONE`. A template that is already prepared usually gives a ready Sandbox as soon as the create command returns.
   ```bash
   kagent sandbox get $SANDBOX_ID
   ```

   Example output:
   ```console
   ID                                    TEMPLATE       STATE                OPERATION               EXPIRES               FAILURE
   01a1f073-a9ad-77b8-88fc-8f63b3381122  kagent/python  RUNTIME_STATE_READY  RUNTIME_OPERATION_NONE  2026-11-18T21:27:54Z
   ```

   To see every Sandbox that you own, run `kagent sandbox list`. The list does not include other users' Sandboxes.

## Run commands and move files

1. Run a command. The CLI prints the process ID when the process starts, streams the output, and reports the exit code when the process finishes.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- python --version
   ```

   Example output:
   ```console
   Process proc-8287f5220c1764358c4134bd in sandbox 01a1f073-a9ad-77b8-88fc-8f63b3381122: started (stdout offset 0, stderr offset 0)
   Python 3.13.18
   Process proc-8287f5220c1764358c4134bd: PROCESS_STATE_EXITED, exit_code=0
   ```

   The `--` separator is required before the command. The command runs without a shell, so to use pipes, redirects, or variables, run a shell explicitly, such as `-- sh -c 'echo $LANG'`. The `exec` command also takes the following options.

   | Flag | Description |
   | ---- | ----------- |
   | `--cwd` | The working directory. Defaults to `/data/workspace`. |
   | `--env` | An environment variable for this process, as `KEY=VALUE`. Repeat the flag to set more than one. |
   | `--wait` | Whether to wait for the process to finish. Defaults to `true`. With `--wait=false`, the command returns as soon as the process starts. |
   | `--timeout` | How long the CLI waits, such as `30s`. Defaults to `5m`. A timeout stops the CLI from waiting, but the process keeps running in the Sandbox. |

   When the process exits with a nonzero code, `kagent sandbox exec` exits with the same code, so a script can check the result.

2. Create a script and an input file on your machine.
   ```bash
   cat > summarize.py <<'EOF'
   import json
   values = json.load(open("input.json"))
   json.dump({"count": len(values), "sum": sum(values)}, open("summary.json", "w"))
   print("wrote summary.json")
   EOF
   printf '[2,3,5]\n' > input.json
   ```

3. Upload both files. A relative destination path resolves against `/data/workspace`. An upload replaces a file that already exists.
   ```bash
   kagent sandbox upload $SANDBOX_ID ./summarize.py summarize.py
   kagent sandbox upload $SANDBOX_ID ./input.json input.json
   ```

   Example output:
   ```console
   Wrote 160 bytes to summarize.py
   Wrote 8 bytes to input.json
   ```

4. Run the script.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- python summarize.py
   ```

5. Download the result. The CLI replaces the local file only after the download succeeds.
   ```bash
   kagent sandbox download $SANDBOX_ID summary.json ./summary.json
   cat summary.json
   ```

   Example output:
   ```console
   ./summary.json
   {"count": 3, "sum": 10}
   ```

The CLI streams each file, up to 64 MiB. Only regular files can be transferred. To move a directory, archive it first, such as with `tar`, and then upload or download the archive.

## Work with long-running processes

A process keeps running in the Sandbox when the CLI stops waiting for it, for example after a timeout or a lost connection. Keep the process ID so that you can reconnect.

1. Start a process without waiting, and save its process ID. The `-o json` output prints one JSON record per line, and the first record reports the process ID.
   ```bash
   export PROCESS_ID=$(kagent sandbox exec $SANDBOX_ID --wait=false -o json -- \
     sh -c 'for i in 1 2 3 4 5 6; do echo tick $i; sleep 2; done' \
     | jq -r 'select(.event=="started").process_id')
   ```

2. Check the process without waiting for it.
   ```bash
   kagent sandbox process $SANDBOX_ID $PROCESS_ID
   ```

   Example output:
   ```console
   proc-d7eadee9cf78f00bf537e195	PROCESS_STATE_RUNNING
   ```

3. Reconnect to the process, and wait for it to finish. The `wait` command prints the output from the start, then the exit code. To skip output that you already read, pass the offsets that an interrupted command reported, with `--stdout-offset` and `--stderr-offset`.
   ```bash
   kagent sandbox wait $SANDBOX_ID $PROCESS_ID
   ```

   Example output:
   ```console
   tick 1
   tick 2
   tick 3
   tick 4
   tick 5
   tick 6
   Process proc-d7eadee9cf78f00bf537e195: PROCESS_STATE_EXITED, exit_code=0
   ```

4. Start a new process to try stopping it. The previous process has already exited, so killing it would fail. This process sleeps for 10 minutes, leaving time to run the next command.
   ```bash
   export PROCESS_ID=$(kagent sandbox exec $SANDBOX_ID --wait=false -o json -- \
     sh -c 'echo running; sleep 600' \
     | jq -r 'select(.event=="started").process_id')
   ```

5. Stop the new process with `kagent sandbox kill`, then read its exit code. The command sends `SIGKILL` and returns as soon as the guest delivers the signal, so its output can still report `PROCESS_STATE_RUNNING`.
   ```bash
   kagent sandbox kill $SANDBOX_ID $PROCESS_ID
   kagent sandbox wait $SANDBOX_ID $PROCESS_ID
   ```

   Example output:
   ```console
   proc-65dc86558ccbc67f8f4c5204  PROCESS_STATE_RUNNING
   running
   Process proc-65dc86558ccbc67f8f4c5204: PROCESS_STATE_EXITED, exit_code=137
   Error: sandbox process exited with code 137
   ```

   The nonzero exit code is expected for a killed process.

### Read JSON output in a script

With `-o json`, the `exec` and `wait` commands print one JSON record per line, so a script can follow a process without parsing the table output.

```bash
kagent sandbox exec $SANDBOX_ID -o json -- sh -c 'echo out; echo err >&2; exit 3'
```

Example output:
```json
{"event":"started","sandbox_id":"01a1f073-a9ad-77b8-88fc-8f63b3381122","process_id":"proc-7d73878f680b7009754a2f40","stdout_offset":0,"stderr_offset":0}
{"event":"output","sandbox_id":"01a1f073-a9ad-77b8-88fc-8f63b3381122","process_id":"proc-7d73878f680b7009754a2f40","source":"stdout","data":"b3V0Cg==","stdout_offset":4,"stderr_offset":0}
{"event":"output","sandbox_id":"01a1f073-a9ad-77b8-88fc-8f63b3381122","process_id":"proc-7d73878f680b7009754a2f40","source":"stderr","data":"ZXJyCg==","stdout_offset":4,"stderr_offset":4}
{"event":"finished","sandbox_id":"01a1f073-a9ad-77b8-88fc-8f63b3381122","process_id":"proc-7d73878f680b7009754a2f40","state":"PROCESS_STATE_EXITED","exit_code":3,"stdout_offset":4,"stderr_offset":4}
```

| Event | When it is printed | Fields beyond the IDs and offsets |
| ----- | ------------------ | --------------------------------- |
| `started` | Once, when the process starts | None |
| `output` | For each chunk of output | `source`, which is `stdout` or `stderr`, and `data`, which is the chunk in base64 |
| `finished` | Once, when the process exits | `state` and `exit_code` |
| `interrupted` | Once, when the CLI stops waiting before the process exits, such as after a timeout | None. Pass the offsets to `kagent sandbox wait` to continue. |

Other `kagent sandbox` commands print a single JSON object with `-o json`, with field names in camel case, such as `expiresAt`.

## Suspend and resume a Sandbox

Suspending a Sandbox releases its compute while keeping its files. Resuming it brings the files back on whichever Worker has room.

> [!IMPORTANT]
> **Suspending a Sandbox interrupts whatever it is doing.** `kagent sandbox suspend` does not wait for any process, output stream, or file transfer, so a command can be cut off partway through and a file can be left partly written. Resuming restores the files under `/data`, but not the running processes or their IDs. Suspend a Sandbox only when you can repeat what it was running.

1. Suspend the Sandbox.
   ```bash
   kagent sandbox suspend $SANDBOX_ID
   ```

   Example output:
   ```console
   ID                                    TEMPLATE       STATE                    OPERATION               EXPIRES               FAILURE
   01a1f073-a9ad-77b8-88fc-8f63b3381122  kagent/python  RUNTIME_STATE_SUSPENDED  RUNTIME_OPERATION_NONE  2026-11-18T21:27:54Z
   ```

2. Try listing the workspace while the Sandbox is suspended. kagent does not resume a Sandbox automatically, so the command fails.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- ls /data/workspace
   ```

   Example output:
   ```console
   Error: start process in sandbox 01a1f073-a9ad-77b8-88fc-8f63b3381122: command may have started; do not blindly retry: rpc error: code = FailedPrecondition desc = Sandbox is not ready or has expired
   ```

3. Resume the Sandbox. The expiration time stays the same, because resuming does not extend the lifetime.
   ```bash
   kagent sandbox resume $SANDBOX_ID
   ```

4. Repeat the workspace command. It now succeeds and confirms that the files that you created are still in `/data/workspace`.
   ```bash
   kagent sandbox exec $SANDBOX_ID -- ls /data/workspace
   ```

   Example output:
   ```console
   Process proc-c1c4db1babc16359c2e26b2e in sandbox 01a1f07c-f027-7cd1-aeed-1e01814d85d6: started (stdout offset 0, stderr offset 0)
   input.json
   summarize.py
   summary.json
   Process proc-c1c4db1babc16359c2e26b2e: PROCESS_STATE_EXITED, exit_code=0
   ```

   Files that a command wrote outside `/data`, such as in `/tmp`, are gone, and a process ID from before the suspension returns `process ... not found`.

## Delete the Sandbox

If you do not delete a Sandbox, kagent deletes it when it expires.

1. Download any files that you want to keep, such as the result from this guide. Deletion removes the Sandbox's files.
   ```bash
   kagent sandbox download $SANDBOX_ID summary.json ./summary.json
   ```

2. Delete the Sandbox to release its compute and storage immediately.
   ```bash
   kagent sandbox delete $SANDBOX_ID
   ```

## Next steps

{{< cards >}}
  {{< card link=`{{< link path="sandboxes/agent-sandbox-tools" >}}` title="Give an agent a sandbox" subtitle="Let an agent create Sandboxes and run code through the kagent MCP server." >}}
  {{< card link=`{{< link path="sandboxes/grpc" >}}` title="Use sandboxes with the gRPC API" subtitle="Call the same service from your own application." >}}
  {{< card link=`{{< link path="reference/cli/kagent-sandbox" >}}` title="kagent sandbox" subtitle="Look up every flag that the sandbox commands take." >}}
{{< /cards >}}
