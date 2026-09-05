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
    kicker: "harnesses",
    title: "Give agents a runtime to run on",
    body: "A Harness is the reusable runtime and its Substrate policy: the worker pool its actors are scheduled onto, where snapshots go, and which templates it admits. Define it once and every template labelled for it runs there.",
    points: [
      "The kagent runtime, Claude, Codex, or bring your own image",
      "Actors scheduled onto a WorkerPool of sandboxed workers",
      "Admits templates by label, so one harness backs many agents",
    ],
    href: "/docs/kagent/examples/agent-harness/",
    linkText: "Set up a harness",
    file: "harness.yaml",
    apply: { cmd: "kubectl apply -f harness.yaml", result: "harness.kagent.dev/kagent created" },
    code: [
      "apiVersion: kagent.dev/v1alpha3",
      "kind: Harness",
      "metadata:",
      "  name: kagent",
      "  namespace: kagent",
      "spec:",
      "  kagent: {}",
      "  workload:",
      "    # pinned by digest, never by tag",
      "    image: ghcr.io/kagent-dev/kagent/golang-adk@sha256:92a7c4c0…",
      "  substrate:",
      "    workerPoolRef:",
      "      name: kagent-default",
      "    snapshotPolicy:",
      "      location: s3://ate-snapshots/kagent",
      "  allowedAgentTemplates:",
      "    selector:",
      "      matchLabels:",
      "        kagent.dev/harness: kagent",
    ],
  },
  {
    kicker: "templates",
    title: "Declare what the agent can do",
    body: "An AgentTemplate is the portable part of an agent: its prompt, its model, its tools and skills. Label it for a harness and kagent derives the agent from the two — there is no Agent manifest to write.",
    points: [
      "Prompt, model and tools in one versioned resource",
      "Swap models by changing one field",
      "Or build the same thing in the dashboard",
    ],
    href: "/docs/kagent/getting-started/first-agent/",
    linkText: "Create your first agent",
    file: "k8s-assistant.yaml",
    apply: { cmd: "kubectl apply -f k8s-assistant.yaml", result: "agenttemplate.kagent.dev/k8s-assistant created" },
    code: [
      "apiVersion: kagent.dev/v1alpha3",
      "kind: AgentTemplate",
      "metadata:",
      "  name: k8s-assistant",
      "  namespace: kagent",
      "  labels:",
      "    kagent.dev/harness: kagent",
      "spec:",
      "  description: Kubernetes assistant with deploy skills",
      "  modelConfig:",
      "    name: default-model-config",
      "  systemPrompt: |",
      "    You are a Kubernetes assistant that helps",
      "    deploy and manage apps. Prefer read-only",
      "    tools first. Never invent cluster state.",
      "  tools:",
      "    - mcp:",
      "        server:",
      "          kind: RemoteMCPServer",
      "          name: kagent-tool-server",
      "        tools:",
      "          - k8s_get_resources",
      "          - k8s_apply_manifest",
      "  skills:",
      "    - name: k8s-deploy",
      "      source:",
      "        oci: ghcr.io/acme/k8s-deploy-skill@sha256:3f1c…",
    ],
  },
  {
    kicker: "mcp servers",
    title: "Point the agent at the tools it can call",
    body: "Tools reach the cluster over MCP. Declare a server once and every template in the namespace can bind to it by name, picking only the tool names it should be allowed to call.",
    points: [
      "Built-in servers for Kubernetes, Istio, Prometheus and Argo",
      "Bring your own with kmcp, or any MCP-compatible server",
      "The tools list scopes exactly what the agent may invoke",
    ],
    href: "/docs/kagent/getting-started/first-mcp-tool/",
    linkText: "Build your first MCP tool",
    file: "tool-server.yaml",
    apply: { cmd: "kubectl apply -f tool-server.yaml", result: "remotemcpserver.kagent.dev/kagent-tool-server created" },
    code: [
      "apiVersion: kagent.dev/v1alpha3",
      "kind: RemoteMCPServer",
      "metadata:",
      "  name: kagent-tool-server",
      "  namespace: kagent",
      "spec:",
      "  description: kagent tool server",
      "  protocol: STREAMABLE_HTTP",
      "  url: http://kagent-tools.kagent:8084/mcp",
      "  timeout: 30s",
      "",
      "# tools this server exposes, bound by name",
      "#   k8s_get_resources",
      "#   k8s_describe_resource",
      "#   k8s_apply_manifest",
    ],
  },
  {
    kicker: "models",
    title: "Choose the model, and swap it whenever you like",
    body: "A ModelConfig holds the provider, the model name and the secret it authenticates with. Templates reference it by name, so changing model across a fleet of agents is one field in one resource.",
    points: [
      "Anthropic, OpenAI, Gemini, Bedrock, Azure OpenAI, Vertex AI, Foundry, SAP AI Core, Ollama",
      "Keys stay in Kubernetes secrets, never in the template",
      "Harnesses can add long-term memory with a second ModelConfig for embeddings",
    ],
    href: "/docs/kagent/supported-providers/",
    linkText: "See supported providers",
    file: "model-configs.yaml",
    apply: { cmd: "kubectl apply -f model-configs.yaml", result: "3 modelconfigs created" },
    code: [
      "apiVersion: kagent.dev/v1alpha3",
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
      "apiVersion: kagent.dev/v1alpha3",
      "kind: ModelConfig",
      "metadata:",
      "  name: bedrock-claude",
      "  namespace: kagent",
      "spec:",
      "  provider: Bedrock",
      "  model: anthropic.claude-3-5-sonnet-20240620-v1:0",
      "  bedrock:",
      "    region: us-east-1",
      "  apiKeySecret: kagent-bedrock",
      "---",
      "apiVersion: kagent.dev/v1alpha3",
      "kind: ModelConfig",
      "metadata:",
      "  name: openai-gpt",
      "  namespace: kagent",
      "spec:",
      "  provider: OpenAI",
      "  model: gpt-4.1-mini",
      "  apiKeySecret: kagent-openai",
      "  apiKeySecretKey: OPENAI_API_KEY",
    ],
  },
  {
    kicker: "skills",
    title: "Package what the agent knows how to do",
    body: "A skill is a SKILL.md file plus whatever scripts it needs, built into an OCI image or committed to a Git repo. A template lists the skills it uses, pinned by digest or commit, and every agent derived from it reads them at runtime.",
    points: [
      "Frontmatter names the skill and says when to use it",
      "Pin by OCI digest or Git commit — skills are immutable artifacts",
      "Reference the same skill from as many templates as you like",
    ],
    href: "/docs/kagent/examples/skills/",
    linkText: "Add skills to agents",
    file: "k8s-deploy-skill/SKILL.md",
    apply: { cmd: "docker push ghcr.io/acme/k8s-deploy-skill", result: "sha256:3f1c… pushed" },
    code: [
      "---",
      "name: k8s-deploy",
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

export const MODEL = [
  {
    kind: "AgentTemplate",
    title: "What the agent can do",
    body: "The model, the prompt, and the tools and skills it may call. Versioned in git and applied like any other manifest.",
  },
  {
    kind: "Harness",
    title: "How it runs",
    body: "The runtime, and the pool of Substrate workers its actors are scheduled onto. One harness can back many templates.",
  },
  {
    kind: "AgentInstance",
    title: "One conversation, one actor",
    body: "Open the agent and chat, and kagent schedules an instance onto a harness worker as a Substrate actor: sandboxed, suspendable, back in milliseconds.",
  },
];

export const PIPELINE = [
  { num: "06", title: "kubectl apply", body: "Templates, harnesses and tools are ordinary resources in your manifests." },
  { num: "07", title: "kagent derives the agent", body: "The controller matches templates to harnesses, pulls skills and wires up tool servers." },
  { num: "08", title: "Substrate runs each chat", body: "Every conversation is an actor: sandboxed, resumed in milliseconds, holding nothing idle." },
  { num: "09", title: "You observe it", body: "Traces, sessions and tool calls, in the dashboard or your own stack." },
];

export const FEATURES = [
  { title: "Templates and harnesses as CRDs", body: "What an agent can do and how it runs are Kubernetes resources — versioned, reviewed and rolled out with kubectl and GitOps." },
  { title: "Agent Substrate runtime", body: "Every conversation is an actor on a WorkerPool: fast cold starts, low resource overhead, and isolation per instance." },
  { title: "Multi-runtime harnesses", body: "Run a template on the kagent runtime, on Claude or Codex, or bring your own image. Swap the harness, keep the template." },
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
  { text: "harness.kagent.dev/kagent created", out: true },
  { text: "agenttemplate.kagent.dev/k8s-assistant created", out: true, ok: true },
  { p: "$ ", text: "kubectl get agenttemplates -n kagent" },
  { text: "NAME            AGE", out: true },
  { text: "k8s-assistant   12s", out: true },
];
