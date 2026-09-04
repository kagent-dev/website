/*
 * Copy and code samples for the redesigned home and /build pages.
 * Keeping it here keeps the page components to layout only.
 */

export type TermLine = {
  /** Prompt prefix rendered in the accent colour, e.g. "$ " */
  p?: string;
  text: string;
  /** Command output (dimmed) */
  out?: boolean;
  /** Success line (green) */
  ok?: boolean;
};

export type BuildStep = {
  kicker: string;
  title: string;
  body: string;
  points: string[];
  href: string;
  linkText: string;
  file: string;
  /** The one-line command that ships this manifest, and what comes back. */
  apply: { cmd: string; result: string };
  code: string[];
};

export const BUILD_STEPS: BuildStep[] = [
  {
    kicker: "sandboxes",
    title: "Give the agent somewhere safe to run",
    body: "An AgentHarness provisions a long-running sandbox on Agent Substrate — an OpenClaw or Hermes coding agent that kagent manages and surfaces in the UI alongside every other agent.",
    points: [
      "Runs on a WorkerPool, or the controller default",
      "Snapshotted, suspended and resumed by Substrate",
      "Chat with it in the dashboard, or wire it into Slack",
    ],
    href: "/docs/kagent/examples/agent-harness/",
    linkText: "Provision a harness",
    file: "openclaw-shell.yaml",
    apply: { cmd: "kubectl apply -f openclaw-shell.yaml", result: "agentharness/openclaw-shell created" },
    code: [
      "apiVersion: kagent.dev/v1alpha2",
      "kind: AgentHarness",
      "metadata:",
      "  name: openclaw-shell",
      "  namespace: kagent",
      "spec:",
      "  backend: openclaw",
      '  description: "OpenClaw shell for platform experiments"',
      "  modelConfigRef: default-model-config",
      "  substrate:",
      "    workerPoolRef:",
      "      name: kagent-default",
    ],
  },
  {
    kicker: "agents",
    title: "Declare the agent, apply it, chat with it",
    body: "The Agent resource is the whole agent: its instructions, its model, its skills and its tools. Apply it and kagent reconciles the running agent to match — the same loop as any other Kubernetes workload.",
    points: [
      "Instructions live in systemMessage, versioned in git",
      "Swap models by changing one field",
      "Or build the same thing in the dashboard form",
    ],
    href: "/docs/kagent/getting-started/first-agent/",
    linkText: "Create your first agent",
    file: "k8s-assistant.yaml",
    apply: { cmd: "kubectl apply -f k8s-assistant.yaml", result: "agent/k8s-assistant-with-skills created" },
    code: [
      "apiVersion: kagent.dev/v1alpha2",
      "kind: Agent",
      "metadata:",
      "  name: k8s-assistant-with-skills",
      "  namespace: kagent",
      "spec:",
      "  description: A K8s agent with deploy skills",
      "  type: Declarative",
      "  skills:",
      "    refs:",
      "      - ghcr.io/acme/k8s-deploy-skill:latest",
      "  declarative:",
      "    modelConfig: default-model-config",
      "    stream: true",
      "    tools:",
      "      - type: McpServer",
      "        mcpServer:",
      "          name: kagent-tool-server",
      "          kind: RemoteMCPServer",
      "          toolNames:",
      "            - k8s_get_resources",
      "            - k8s_apply_manifest",
      "    systemMessage: |",
      "      You are a Kubernetes assistant that",
      "      helps deploy and manage apps.",
    ],
  },
  {
    kicker: "mcp servers",
    title: "Point the agent at the tools it can call",
    body: "Tools reach the cluster over MCP. Declare a server once and every agent in the namespace can reference it by name, picking only the tool names it should be allowed to call.",
    points: [
      "Built-in servers for Kubernetes, Istio, Prometheus and Argo",
      "Bring your own with kmcp, or any MCP-compatible server",
      "toolNames scopes exactly what the agent may invoke",
    ],
    href: "/docs/kagent/getting-started/first-mcp-tool/",
    linkText: "Build your first MCP tool",
    file: "tool-server.yaml",
    apply: { cmd: "kubectl apply -f tool-server.yaml", result: "remotemcpserver/kagent-tool-server created" },
    code: [
      "apiVersion: kagent.dev/v1alpha1",
      "kind: RemoteMCPServer",
      "metadata:",
      "  name: kagent-tool-server",
      "  namespace: kagent",
      "spec:",
      "  description: kagent tool server",
      "  protocol: STREAMABLE_HTTP",
      "  url: http://kagent-tool-server:8084/mcp",
      "",
      "# tools this server exposes, referenced by name",
      "#   k8s_get_resources",
      "#   k8s_describe_resource",
      "#   k8s_apply_manifest",
    ],
  },
  {
    kicker: "models",
    title: "Choose the model, and swap it whenever you like",
    body: "A ModelConfig holds the provider, the model name and the secret it authenticates with. Agents reference it by name, so changing model across a fleet of agents is one field in one resource.",
    points: [
      "Anthropic, OpenAI, Gemini, xAI Grok, Amazon Bedrock, Azure OpenAI, Vertex AI, Ollama",
      "Or any OpenAI-compatible endpoint you host yourself",
      "Keys stay in Kubernetes secrets, never in the agent spec",
    ],
    href: "/docs/kagent/supported-providers/",
    linkText: "See supported providers",
    file: "model-configs.yaml",
    apply: { cmd: "kubectl apply -f model-configs.yaml", result: "4 modelconfigs created" },
    code: [
      "apiVersion: kagent.dev/v1alpha2",
      "kind: ModelConfig",
      "metadata:",
      "  name: claude-sonnet",
      "  namespace: kagent",
      "spec:",
      "  provider: Anthropic",
      "  model: claude-sonnet-4-5",
      "  apiKeySecret: kagent-anthropic",
      "  apiKeySecretKey: ANTHROPIC_API_KEY",
      "---",
      "apiVersion: kagent.dev/v1alpha2",
      "kind: ModelConfig",
      "metadata:",
      "  name: bedrock-claude",
      "  namespace: kagent",
      "spec:",
      "  provider: AmazonBedrock",
      "  model: anthropic.claude-3-5-sonnet-20240620-v1:0",
      "  amazonBedrock:",
      "    region: us-east-1",
      "  apiKeySecret: kagent-bedrock",
      "---",
      "apiVersion: kagent.dev/v1alpha2",
      "kind: ModelConfig",
      "metadata:",
      "  name: grok-fast",
      "  namespace: kagent",
      "spec:",
      "  provider: xAI",
      "  model: grok-4-fast",
      "  apiKeySecret: kagent-xai",
      "  apiKeySecretKey: XAI_API_KEY",
      "---",
      "apiVersion: kagent.dev/v1alpha2",
      "kind: ModelConfig",
      "metadata:",
      "  name: openai-gpt",
      "  namespace: kagent",
      "spec:",
      "  provider: OpenAI",
      "  model: gpt-5.6",
      "  apiKeySecret: kagent-openai",
      "  apiKeySecretKey: OPENAI_API_KEY",
    ],
  },
  {
    kicker: "skills",
    title: "Package what the agent knows how to do",
    body: "A skill is a SKILL.md file plus whatever scripts it needs, built into a container image or pulled from a GitHub repo. Agents read the instructions at runtime and reuse the same skill across every agent that references it.",
    points: [
      "Frontmatter names the skill and says when to use it",
      "Push to any registry — ghcr.io, ECR, or a local one",
      "Or pull them straight from a GitHub repo of skills",
      "kagent pulls it with an init container and mounts /skills",
    ],
    href: "/docs/kagent/examples/skills/",
    linkText: "Add skills to agents",
    file: "k8s-deploy-skill/SKILL.md",
    apply: { cmd: "docker push ghcr.io/acme/k8s-deploy-skill:latest", result: "image pushed" },
    code: [
      "---",
      "name: k8s-deploy-skill",
      "description: Deploy simple apps to Kubernetes",
      "---",
      "# Kubernetes simple deploy skill",
      "",
      "Use this skill when users want to deploy",
      "a basic app on the cluster.",
      "",
      "## Instructions",
      "",
      "- Expect the user to provide an app name,",
      "  along with a docker image reference.",
      "- Call `scripts/deploy-app.py` with the",
      "  supplied name, image and options.",
    ],
  },
];

export const PIPELINE = [
  { num: "06", title: "kubectl apply", body: "Skills, tools and agents are ordinary resources in your manifests." },
  { num: "07", title: "kagent reconciles", body: "The controller pulls skill images and wires the agent to its tool servers." },
  { num: "08", title: "Substrate runs it", body: "Sandboxed, resumed in milliseconds, holding no compute while idle." },
  { num: "09", title: "You observe it", body: "Traces, sessions and tool calls, in the dashboard or your own stack." },
];

export const FEATURES = [
  { title: "Agent lifecycle via CRDs", body: "Define, version, and roll out agents with kubectl and GitOps — the same workflow as every other workload." },
  { title: "Agent Substrate runtime", body: "A WorkerPool + Actor model that delivers fast cold starts, low resource overhead, and secure isolation per agent." },
  { title: "Multi-runtime support", body: "Go and Python ADK runtimes. Pick the language that fits, or mix both in the same cluster." },
  { title: "BYO frameworks", body: "LangGraph, CrewAI, Google ADK, or your own — bring any agent framework and kagent orchestrates it." },
  { title: "Long-term memory", body: "Persistent vector-backed memory across sessions. Agents remember context, not just the last prompt." },
  { title: "Human-in-the-loop", body: "Tool approval gates, agent-initiated questions, and cascading HITL — humans stay in control." },
  { title: "Agent-to-Agent (A2A)", body: "Agents discover and invoke each other. Compose multi-agent workflows with first-class delegation." },
  { title: "Skills from Git", body: "Load markdown knowledge from Git repos at startup. Agents learn your runbooks, not just generic docs." },
  { title: "Prompt templates", body: "Reusable prompt fragments from ConfigMaps. DRY your system prompts across agents." },
  { title: "Context compaction", body: "Auto-summarization of long histories. Agents stay coherent in extended conversations without blowing token budgets." },
  { title: "Sandbox & security", body: "Agent sandboxing, RBAC, and security hardening out of the box. Run untrusted code safely." },
  { title: "Full observability", body: "OTel tracing, Prometheus metrics, structured logs. See every prompt, every tool call, every token." },
  { title: "Postgres storage", body: "Production-grade Postgres-backed storage with reviewable migrations. No proprietary database lock-in." },
  { title: "NVIDIA NemoClaw guardrails", body: "Built-in security and privacy guardrails. Run Nemotron locally or route to cloud models — with policy enforcement on every call." },
  { title: "Zero-trust ready", body: "Run on top of Istio or Ambient Mesh. mTLS, fine-grained RBAC, and policy-driven egress for agent traffic." },
  { title: "Standards-based", body: "Native MCP, A2A, OpenTelemetry, and Kubernetes APIs. No proprietary glue, no rewrite tax later." },
];

export const INSTALL_LINES: TermLine[] = [
  { p: "$ ", text: "kagent install" },
  { text: "installing kagent-crds…", out: true },
  { text: "installing kagent…", out: true },
  { text: "kagent installed in namespace kagent", out: true, ok: true },
  { p: "$ ", text: "kagent dashboard" },
];

export const LOOP_LINES: TermLine[] = [
  { p: "$ ", text: "kubectl apply -f agents/" },
  { text: "modelconfig.kagent.dev/default-model-config created", out: true },
  { text: "remotemcpserver.kagent.dev/kagent-tool-server created", out: true },
  { text: "agent.kagent.dev/k8s-assistant-with-skills created", out: true, ok: true },
  { p: "$ ", text: "kubectl get agents -n kagent" },
  { text: "k8s-assistant-with-skills   Ready   12s", out: true },
];
