---
title: kagent deploy
description: Deploy an agent to Kubernetes
weight: 180
---

Deploy an agent to Kubernetes.

This command will read the kagent.yaml file from the specified project directory,
load environment variables from a .env file, and create an Agent CRD with necessary secrets.

The command will:
1. Load the agent configuration from kagent.yaml
2. Load environment variables from a .env file (including the model provider API key)
3. Create Kubernetes secrets for environment variables and API keys
4. Create an Agent CRD with the appropriate configuration

API Key Requirements:
  The .env file MUST contain the API key for your model provider:
  - Anthropic: ANTHROPIC_API_KEY=your-key-here
  - OpenAI: OPENAI_API_KEY=your-key-here
  - Gemini: GOOGLE_API_KEY=your-key-here

Environment Variables:
  --env-file: REQUIRED. Path to a .env file containing environment variables (including API keys).
              Variables will be stored in a Kubernetes secret and mounted as environment variables.

Dry-Run Mode:
  --dry-run: Output YAML manifests without applying them to the cluster. This is useful
             for previewing changes or for use with GitOps workflows.

```bash
kagent deploy [project-directory] [flags]
```

**Flags:**
- `--dry-run` - Output YAML manifests without applying them to the cluster
- `--env-file string` - Path to .env file containing environment variables (including API keys)
- `-h, --help` - help for deploy
- `-i, --image string` - Image to use (defaults to localhost:5001/{agentName}:latest)
- `--namespace string` - Kubernetes namespace to deploy to (default "kagent")
- `--platform string` - Target platform for Docker build (e.g., linux/amd64, linux/arm64)

**Global Flags:**
- `--config string` - config file (default is $HOME/.kagent/config.yaml) (default "$HOME/.kagent/config.yaml")
- `--kagent-grpc-ca-file string` - CA certificate file for KAgent gRPC
- `--kagent-grpc-server-name string` - TLS server name for KAgent gRPC
- `--kagent-grpc-tls` - Use TLS for KAgent gRPC
- `--kagent-grpc-url string` - KAgent gRPC target (default "localhost:8084")
- `--kagent-url string` - KAgent REST URL (default "http://localhost:8083")
- `-o, --output-format string` - Output format (default "table")
- `--timeout duration` - Timeout (default 5m0s)
- `-v, --verbose` - Verbose output

## Example

```bash
kagent deploy ./my-agent --env-file .env
kagent deploy ./my-agent --env-file .env --image "myregistry/myagent:v1.0"
kagent deploy ./my-agent --env-file .env --namespace "my-namespace"
kagent deploy ./my-agent --env-file .env --dry-run > manifests.yaml
```
