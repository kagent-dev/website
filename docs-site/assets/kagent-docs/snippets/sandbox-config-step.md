[Install kagent]({{< link path="setup/installation" >}}), then save the following settings in `sandbox-values.yaml`. Sandbox preparation needs a guest image. The chart does not ship a default guest image, so a SandboxTemplate does not become ready until you set one. The remaining values allocate the compute that each Sandbox runs on and bound how long it lives.
```bash
cat > sandbox-values.yaml <<'EOF'
config:
  sandboxes:
    guestImage: {{< reuse "kagent-docs/versions/sandbox-guest-image.md" >}}
    cpu: "1"
    memory: 1Gi
    defaultTtl: 3600s
    maxTtl: 86400s
EOF
```

Apply the file to your existing Helm release. The following commands use [`jq`](https://jqlang.org/download/) to read the installed chart version, so the upgrade preserves both that version and the release's other values.
```bash
export KAGENT_CHART_VERSION=$(helm list -n kagent -o json \
  | jq -er '.[] | select(.name == "kagent") | .chart | ltrimstr("{{< reuse "kagent-docs/snippets/helm-kagent.md" >}}-")')
helm upgrade kagent \
  {{< reuse "kagent-docs/snippets/helm-path.md" >}}/{{< reuse "kagent-docs/snippets/helm-kagent.md" >}} \
  --namespace kagent --version "$KAGENT_CHART_VERSION" \
  --reuse-values -f sandbox-values.yaml --wait
```

A SandboxTemplate cannot override these values, so they apply to every Sandbox in the installation.

The **guest image** provides kagent's process and file service. Use the published `kagent/sandbox-guest` image for your release, or mirror that image into your own registry. A custom build must provide a compatible `kagent-sandbox-guest` executable at `/usr/local/bin/kagent-sandbox-guest`, including its readiness endpoint and process and file APIs. A custom build is useful when you maintain a patched guest. An arbitrary Python or Node.js image cannot replace it. To add interpreters, packages, or command line tools for a task, customize the SandboxTemplate's `spec.workload.image` instead, as described in [Choose a tools image](#choose-a-tools-image).

| Value | Default | Description |
| ----- | ------- | ----------- |
| `config.sandboxes.guestImage` | `""` | Required. The complete, digest-pinned reference to the image that supplies kagent's guest service, as described above. The controller passes the reference to Agent Substrate unchanged and does not resolve tags, so pin a digest. Setting `global.imageRegistry` rewrites the registry host of this reference. |
| `config.sandboxes.cpu` | `1` | CPU allocated to each Sandbox. |
| `config.sandboxes.memory` | `1Gi` | Memory allocated to each Sandbox. |
| `config.sandboxes.defaultTtl` | `3600s` | Lifetime applied when `kagent sandbox create` omits `--ttl`. Durations in the `config` block take protobuf seconds notation, so `3600s` rather than `1h`. |
| `config.sandboxes.maxTtl` | `86400s` | Upper bound on any requested lifetime, which the controller caps at `86400s`. A Sandbox expires the configured interval after it is created, regardless of how recently a command ran in it. |
