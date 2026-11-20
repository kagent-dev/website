| Tool | Required arguments | What it does |
| ---- | ------------------ | ------------ |
| `list_sandbox_templates` | None | Lists the templates that the caller can create a Sandbox from. Takes `namespace` to filter. |
| `create_sandbox` | `namespace`, `template`, `request_id` | Creates a Sandbox. Takes `name` and `ttl_seconds`. A retry with the same `request_id` and the same arguments returns the same Sandbox. |
| `list_sandboxes` | None | Lists the Sandboxes that the caller owns. Takes `page_size` and `page_token`. |
| `get_sandbox`, `suspend_sandbox`, `resume_sandbox`, `delete_sandbox` | `sandbox_id` | Reads, suspends, resumes, or deletes a Sandbox. |
| `write_sandbox_file` | `sandbox_id`, `path`, `data_base64` | Writes a file, replacing one that already exists. Takes `mode` as decimal Unix permission bits, such as `420` for `0644`. Writes up to 1 MiB per call. |
| `read_sandbox_file` | `sandbox_id`, `path` | Returns a file in a form that the model reads directly. Text returns as numbered lines, and a PNG, JPEG, or GIF image returns as an image. |
| `start_sandbox_process` | `sandbox_id`, `command` | Starts a process from an argument list, such as `["python3", "main.py"]`. Takes `cwd` and `env`. Returns a `process_id` without waiting. |
| `get_sandbox_process` | `sandbox_id`, `process_id` | Returns the process's `state`, and its `exit_code` once the state is `PROCESS_STATE_EXITED`. |
| `read_sandbox_outputs` | `sandbox_id`, `process_id` | Returns the output that is available now, in base64, up to 1 MiB, with the offsets to continue from. Takes `stdout_offset` and `stderr_offset`. |
| `kill_sandbox_process` | `sandbox_id`, `process_id` | Sends `SIGKILL` to the process without waiting for it to exit. |
