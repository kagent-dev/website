The `signal_to_metrics` connector derives the `gen_ai.invoke_agent.duration` metric from the `invoke_agent` spans that the `kagent` runtime emits. That runtime does not record the metric itself.

The connector reads the spans before any sampling in the collector. Its conditions skip the two A2A server instrumentation scopes. A span from those scopes carries the `invoke_agent` operation only when that layer also records the metric, so skipping the scopes prevents a double count.

The connector emits delta histograms, and the Prometheus exporter accepts only cumulative ones. The `deltatocumulative` processor converts them. Without it, the exporter logs `Dropped misaligned histogram datapoint` and keeps one point per series, so the duration queries return almost nothing.
