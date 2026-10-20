A tool's own arguments and reply are recorded separately, on the `execute_tool` span of each tool call, in the `gcp.vertex.agent.tool_call_args` and `gcp.vertex.agent.tool_response` attributes. `config.runtimeDefaults.telemetry.captureContent` does not govern those two attributes. The runtime records them whenever tracing is on.

Treat the two tool attributes as part of the audit record. On an agent whose tools return sensitive data, account for them as a disclosure.
