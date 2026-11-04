[Install kagent]({{< link path="setup/installation" >}}) and set the following `config.sandboxes` values on the installation. Sandbox preparation needs a guest image. The chart does not ship a default guest image, so a SandboxTemplate does not become ready until you set one. The remaining values allocate the compute that each Sandbox runs on and bound how long it lives.
```yaml
config:
  sandboxes:
    guestImage: {{< reuse "kagent-docs/versions/sandbox-guest-image.md" >}}
    cpu: "1"
    memory: 1Gi
    defaultTtl: 3600s
    maxTtl: 86400s
```

A SandboxTemplate cannot override these values, so they apply to every Sandbox in the installation.

| Value | Default | Description |
| ----- | ------- | ----------- |
| `config.sandboxes.guestImage` | `""` | The digest-pinned guest image, as a complete reference. This value is required. The controller passes the reference to Agent Substrate unchanged and does not resolve tags, so pin a digest. Setting `global.imageRegistry` rewrites the registry host of this reference. |
| `config.sandboxes.cpu` | `1` | CPU allocated to each Sandbox. |
| `config.sandboxes.memory` | `1Gi` | Memory allocated to each Sandbox. |
| `config.sandboxes.defaultTtl` | `3600s` | Lifetime applied when `kagent sandbox create` omits `--ttl`. Durations in the `config` block take protobuf seconds notation, so `3600s` rather than `1h`. |
| `config.sandboxes.maxTtl` | `86400s` | Upper bound on any requested lifetime, which the controller caps at `86400s`. A Sandbox expires the configured interval after it is created, regardless of how recently a command ran in it. |
