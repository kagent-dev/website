import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Container, FileCode2, Fingerprint, GlobeLock, KeyRound, Link2, ServerCog } from "lucide-react";
import Jobs from "@/components/home/jobs";
import KagentUI from "@/components/home/kagent-ui";
import HeroHeadline from "@/components/home/hero-headline";
import ActorGrid from "@/components/home/actor-grid";
import ScrollMark from "@/components/home/scroll-mark";
import { ADOPTERS } from "@/components/home/adopters";
import { SandboxVisual, ToolsVisual, TeamVisual } from "@/components/home/bento-visuals";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kagent | Run millions of agents, securely, on Kubernetes",
  description:
    "kagent gives platform teams one place to deploy, manage and govern AI agents on Kubernetes, running on Agent Substrate: sandboxed, suspended when idle, resumed on the next message.",
};

const DOCS = "/docs/kagent/1.x";
const START = `${DOCS}/get-started/your-first-agent`;
const GITHUB = "https://github.com/kagent-dev/kagent";
const SUBSTRATE = "https://ate.dev/";

const BtnWhite = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black shadow-[0_0_40px_-6px_rgba(167,139,250,0.75)] transition hover:bg-white/90 hover:shadow-[0_0_56px_-4px_rgba(167,139,250,0.95)]">
    {children}
  </a>
);
const BtnDark = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="rounded-full bg-ks-card2 px-6 py-3 text-[15px] text-white transition hover:bg-white/15">
    {children}
  </a>
);

const Card = ({ title, body, children, className = "" }: { title: string; body: string; children?: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col overflow-hidden rounded-[28px] bg-ks-card p-8 ${className}`}>
    <h3 className="text-xl font-medium">{title}</h3>
    <p className="mt-2 max-w-md leading-relaxed text-ks-muted">{body}</p>
    {children && <div className="mt-8 flex-1">{children}</div>}
  </div>
);

const FAQ: [string, string][] = [
  ["What is Agent Substrate?", "An open-source, Kubernetes-native runtime for agents, originally created by Google and now a CNCF Sandbox project. It runs each agent in its own gVisor sandbox or microVM, suspends idle agents to object storage, and resumes them on any ready worker in under a second."],
  ["How do kagent and Substrate split the work?", "kagent decides what an agent does: its model, prompt, tools and skills, defined in an AgentTemplate. Substrate decides where it runs: which pre-warmed worker, when to suspend it, and where its snapshot lives, configured through a Harness."],
  ["Which models can I use?", "OpenAI, Anthropic, Gemini, Vertex AI, Azure OpenAI and AI Foundry, Amazon Bedrock, Mistral, Ollama, and any OpenAI-compatible endpoint such as xAI or Hugging Face."],
  ["Can I bring my own agent?", "Yes. A Harness can run kagent's own engine, Claude, Codex, or any container image that speaks kagent's A2A contract."],
  ["What happens to a conversation while the agent sleeps?", "The session stays ready. Substrate writes the agent's durable state, including pending approvals, to a snapshot and frees the worker. The next message restores it, usually onto a different worker, and the caller never notices."],
  ["Is it open source?", "Yes. Both kagent and Agent Substrate are Apache 2.0 licensed CNCF Sandbox projects."],
];

const HOW = [
  {
    kind: "AgentTemplate",
    tag: "what",
    Icon: FileCode2,
    body: "The model, the prompt, the MCP tools, skills and plugins. What the agent does, owned by kagent.",
    yaml: "kind: AgentTemplate\nspec:\n  modelConfig:\n    name: claude-sonnet\n  tools:\n  - mcp:\n      server:\n        name: github-mcp",
    link: "Agent templates",
    href: `${DOCS}/agents/declarative-agents`,
  },
  {
    kind: "Harness",
    tag: "where",
    Icon: ServerCog,
    body: "The runtime, the warm WorkerPool and where snapshots go. How and where the agent runs, handed to Substrate.",
    yaml: "kind: Harness\nspec:\n  kagent: {}\n  substrate:\n    workerPoolRef:\n      name: kagent-high\n    snapshotPolicy:\n      location: s3://ate-snapshots/",
    link: "Harnesses",
    href: `${DOCS}/agents/agent-harness`,
  },
  {
    kind: "Agent",
    tag: "pair",
    Icon: Link2,
    body: "Joins one template to one harness. Callers reach it over A2A or MCP, and every chat becomes a sandboxed Session.",
    yaml: "kind: Agent\nspec:\n  template:\n    ref:\n      name: pr-reviewer\n  harnessRef:\n    name: secure",
    link: "Core concepts",
    href: `${DOCS}/about/core-concepts#agent`,
  },
];

const TRUST = [
  {
    tag: "identity",
    title: "A verified identity per agent",
    Icon: Fingerprint,
    body: "Each actor proves who it is with a certificate, and can present an Actor token to the services it calls, so policy follows the agent rather than the pod.",
    link: "Identity",
    href: `${DOCS}/about/substrate-runtime/identity`,
  },
  {
    tag: "no credentials",
    title: "Zero ambient credentials",
    Icon: KeyRound,
    body: "Sandboxes hold no API keys. The egress gateway injects credentials into the calls a policy allows, so the agent never sees the secret.",
    link: "Credential injection",
    href: `${DOCS}/about/substrate-runtime/networking-and-egress#credential-injection`,
  },
  {
    tag: "no open network",
    title: "Default-deny egress",
    Icon: GlobeLock,
    body: "Every outbound connection goes through the egress gateway and is checked against the agent's EgressPolicy. Anything no rule allows is denied.",
    link: "Egress policies",
    href: `${DOCS}/agents/egress-policies`,
  },
  {
    tag: "no escape",
    title: "Sandboxed, single-tenant actors",
    Icon: Container,
    body: "Each conversation runs in its own gVisor sandbox or microVM, isolated from the host and from every other agent on the same worker.",
    link: "Sandboxing",
    href: `${DOCS}/about/substrate-runtime/sandboxing`,
  },
];


export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] font-geist text-white antialiased [color-scheme:dark]`}>
      <ScrollMark />
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="#" className="flex items-center gap-3 text-lg font-semibold">
          <Image src="/images/kagent-logo-mark.png" alt="" width={36} height={36} />
          kagent
        </a>
        <nav className="hidden gap-8 text-sm text-white/80 md:flex">
          <Link href={DOCS} className="hover:text-white">Docs</Link>
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#agents" className="hover:text-white">Agents</a>
          <Link href="/community" className="hover:text-white">Community</Link>
          <Link href="/enterprise" className="hover:text-white">Enterprise</Link>
        </nav>
        <div className="flex gap-2">
          <a href={GITHUB} className="hidden rounded-full bg-ks-card2 px-4 py-2 text-sm sm:block">GitHub</a>
          <a href={START} className="rounded-full bg-white px-4 py-2 text-sm text-black">Get started</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 text-center md:pt-28">
        {/* backdrop: purple glow + faint grid that fades out */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[820px]">
          <div className="absolute left-1/2 top-0 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.32),rgba(139,92,246,0.08)_55%,transparent)]" />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_35%,black,transparent)]" />
        </div>
        <HeroHeadline />
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <BtnWhite href={START}>Run your first agent</BtnWhite>
          <BtnDark href={GITHUB}>View on GitHub</BtnDark>
        </div>
        <div className="mt-16 lg:-mx-12">
          <KagentUI />
          <p className="mt-4 text-sm text-ks-muted">This is the kagent UI, and you can click around in it. Open an agent to chat, approve or reject its actions, or leave it idle and watch it suspend.</p>
        </div>
      </section>


      {/* Stats */}
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <div className="grid overflow-hidden rounded-[24px] border border-ks-line bg-gradient-to-b from-white/[0.035] to-white/[0.01] sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["<500", "ms", "to resume a suspended agent on any ready worker"],
            ["500+", "/s", "suspend and resume activations per second"],
            ["10", "×", "higher density than standard container runtimes"],
            ["2", "\u00a0isolation modes", "microVM and gVisor sandboxes, one lifecycle"],
          ].map(([n, unit, label], i) => (
            <div key={label} className={`px-8 py-8 ${i > 0 ? "border-t border-ks-line sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-ks-line" : ""} ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:border-ks-line" : ""}`}>
              <div className="flex items-baseline">
                <span className="text-5xl font-medium tracking-tight">{n}</span>
                <span className="ml-0.5 text-2xl font-medium tracking-tight text-white/55">{unit}</span>
              </div>
              <p className="mt-3 leading-relaxed text-ks-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bento */}
      <section id="features" className="mx-auto max-w-6xl px-6 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-medium tracking-tight">Run thousands of agents on a few pods</h2>
          <p className="mt-4 text-lg leading-relaxed text-ks-muted">
            Agents aren&apos;t microservices or batch jobs. They hold state, wait most of the time, and run code you didn&apos;t write. A pod per agent pays for every idle minute. Substrate packs them onto a few warm workers and puts the idle ones to sleep.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="grid items-center gap-8 rounded-[28px] bg-ks-card p-8 md:col-span-2 lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
            <div>
              <h3 className="text-2xl font-medium tracking-tight">Asleep when idle, back in milliseconds</h3>
              <p className="mt-3 leading-relaxed text-ks-muted">
                When an agent waits on a person or a model, Substrate snapshots it to storage and frees its worker. The next request goes through the atenet router, and the agent resumes on whichever warm worker has room.
              </p>
              <p className="mt-3 leading-relaxed text-ks-muted">Here, every agent in the grid shares the same four warm pods.</p>
              <p className="mt-6 text-sm text-white/70">Click any dim square to send that agent a request.</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-ks-line bg-ks-bg p-4">
              <ActorGrid />
            </div>
          </div>
          <Card title="Sandboxed by default" body="Every conversation runs in its own gVisor sandbox or microVM. No ambient credentials, no network unless an EgressPolicy allows it.">
            <SandboxVisual />
          </Card>
          <Card title="Uses the tools you already have" body="Connect any MCP server: GitHub, Atlassian, Figma, Slack, Notion, Linear, Sentry, Stripe, Hugging Face and more.">
            <ToolsVisual />
          </Card>
          <div className="grid items-center gap-8 rounded-[28px] bg-ks-card p-8 md:col-span-2 lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
            <div>
              <h3 className="text-2xl font-medium tracking-tight">Agents that work together</h3>
              <p className="mt-3 leading-relaxed text-ks-muted">
                Give one agent others as subagent tools. It hands off the work, each subagent runs in its own sandbox, and the answers come back stitched together.
              </p>
            </div>
            <div className="mx-auto w-full max-w-md">
              <TeamVisual />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="font-geistmono text-xs uppercase tracking-[0.2em] text-violet-300">How it works</div>
            <h2 className="mt-3 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              kagent decides what.
              <br />
              Substrate decides where.
            </h2>
          </div>
          <a href={`${DOCS}/about/core-concepts`} className="group flex items-center gap-1.5 text-sm text-violet-300 hover:text-violet-200">
            Read the core concepts <span className="transition group-hover:translate-x-0.5">→</span>
          </a>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {HOW.map((c) => (
            <div key={c.kind} className="group flex flex-col rounded-2xl border border-ks-line bg-ks-card p-6 transition hover:border-violet-400/30">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/30 via-violet-500/10 to-transparent text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_-12px_rgba(139,92,246,0.8)] transition group-hover:border-violet-300/50 group-hover:text-white">
                  <c.Icon size={22} strokeWidth={1.6} />
                </span>
                <span className="rounded-full border border-ks-line px-2.5 py-0.5 font-geistmono text-[11px] uppercase tracking-wider text-white/55">{c.tag}</span>
              </div>
              <h3 className="mt-5 font-geistmono text-xl">{c.kind}</h3>
              <p className="mt-2 leading-relaxed text-ks-muted">{c.body}</p>
              <pre className="mt-5 flex-1 overflow-x-auto rounded-xl bg-ks-bg px-4 py-3 font-geistmono text-[12px] leading-5 text-white/75">{c.yaml}</pre>
              <a href={c.href} className="mt-5 flex items-center gap-1.5 text-sm text-violet-300 hover:text-violet-200">
                {c.link} <span className="transition group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ks-muted">
          Apply the three resources with kubectl or GitOps. The kagent controller compiles each Agent into an immutable Substrate ActorTemplate, and from there Substrate&apos;s own control and data plane handle scheduling and suspend/resume, so the Kubernetes API stays off the request path.
        </p>
      </section>

      {/* Zero trust */}
      <section id="security" className="mx-auto max-w-6xl px-6 pt-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="font-geistmono text-xs uppercase tracking-[0.2em] text-violet-300">Zero trust for agents</div>
            <h2 className="mt-3 text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              Every agent has an identity, but no credentials, no open network, and no way out.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ks-muted">
              Each conversation runs as its own sandboxed actor, while thousands of them share a small pool of workers.
            </p>
          </div>
          <a href={`${DOCS}/about/substrate-runtime/sandboxing`} className="group flex items-center gap-1.5 text-sm text-violet-300 hover:text-violet-200">
            Read about the runtime <span className="transition group-hover:translate-x-0.5">→</span>
          </a>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((c) => (
            <div key={c.title} className="group flex flex-col rounded-2xl border border-ks-line bg-ks-card p-6 transition hover:border-violet-400/30">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/30 via-violet-500/10 to-transparent text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_-12px_rgba(139,92,246,0.8)] transition group-hover:border-violet-300/50 group-hover:text-white">
                  <c.Icon size={22} strokeWidth={1.6} />
                </span>
                <span className="rounded-full border border-ks-line px-2.5 py-0.5 font-geistmono text-[10.5px] uppercase tracking-wider text-white/55">{c.tag}</span>
              </div>
              <h3 className="mt-5 text-lg font-medium leading-snug">{c.title}</h3>
              <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-ks-muted">{c.body}</p>
              <a href={c.href} className="mt-6 flex items-center gap-1.5 text-sm text-violet-300 hover:text-violet-200">
                {c.link} <span className="transition group-hover:translate-x-0.5">→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Jobs */}
      <section id="agents" className="mx-auto max-w-6xl px-6 pt-32">
        <h2 className="mb-10 text-4xl font-medium tracking-tight">Give each agent a job</h2>
        <Jobs />
      </section>

      {/* Teams */}
      <section className="mx-auto max-w-6xl px-6 pt-32 text-center">
        <p className="text-sm text-ks-muted">Teams running kagent</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {ADOPTERS.map((a) => (
            <a key={a.name} href={a.website} title={a.name} className="opacity-60 transition hover:opacity-100">
              <Image src={a.logo} alt={a.name} width={140} height={40} className={`${a.size ?? "h-8"} w-auto object-contain ${a.original ? "" : "brightness-0 invert"}`} />
            </a>
          ))}
        </div>
        <a href="https://github.com/kagent-dev/website?tab=readme-ov-file#adopters" className="mt-8 inline-block text-sm text-ks-muted hover:text-white">
          Running kagent? Add your logo →
        </a>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 pt-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium tracking-tight">FAQs</h2>
          <div className="divide-y divide-ks-line border-t border-ks-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="text-xl text-ks-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-xl leading-relaxed text-ks-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-6xl px-6 pt-40 text-center">
        <h2 className="text-5xl font-medium tracking-tight">Run your first agent</h2>
        <p className="mt-4 text-lg text-ks-muted">One install, three resources, one conversation.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BtnWhite href={START}>Get started</BtnWhite>
          <BtnDark href={SUBSTRATE}>About Agent Substrate</BtnDark>
        </div>
        {/* faint kagent mark: only the top half shows, fading into the footer */}
        <div aria-hidden className="pointer-events-none mx-auto mt-20 h-[320px] max-w-3xl overflow-hidden [mask-image:linear-gradient(to_bottom,black_35%,transparent)]">
          <Image id="footer-mark" src="/images/kagent-logo-mark.png" alt="" width={720} height={720} className="mx-auto -mt-[110px] w-[640px] max-w-full opacity-[0.22]" />
        </div>
      </section>

      <footer className="border-t border-ks-line">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-6 py-10 text-sm text-ks-muted md:flex-row">
          <span>kagent and Agent Substrate are CNCF Sandbox projects.</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href={DOCS} className="hover:text-white">Docs</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <a href={GITHUB} className="hover:text-white">GitHub</a>
            <a href={SUBSTRATE} className="hover:text-white">ate.dev</a>
            <Link href="/community" className="hover:text-white">Community</Link>
            <Link href="/enterprise" className="hover:text-white">Enterprise</Link>
            <a href="https://discord.gg/Fu3k65f2k3" className="hover:text-white">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
