'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";

/* ============================================================
   Icon component — line icons, 1.7px stroke
   ============================================================ */
const Icon = ({ name, size = 20, ...rest }: { name: string; size?: number; [k: string]: unknown }) => {
  const paths: Record<string, React.ReactNode> = {
    sparkles: <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></>,
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>,
    shield: <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/>,
    workflow: <><rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="9" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3h12V9M12 12v3"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    cube: <><path d="M21 7.5v9l-9 5-9-5v-9l9-5z"/><path d="M3 7.5l9 5 9-5M12 12.5V22"/></>,
    plug: <><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8zM12 18v4"/></>,
    activity: <path d="M3 12h4l3-9 4 18 3-9h4"/>,
    check: <path d="M5 12l5 5 9-11"/>,
    arrow: <path d="M5 12h14M13 5l7 7-7 7"/>,
    book: <path d="M4 4v16h14a2 2 0 0 0 2-2V4H8a4 4 0 0 0-4 4zM4 4l4 4M20 4l-4 4"/>,
    git: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8M8 6h6a4 4 0 0 1 4 4v6"/></>,
    discord: <path d="M19.3 5.4A17 17 0 0 0 15 4l-.3.6c1.5.4 2.8 1 4 1.7-1.4-.7-3.7-1.2-6.7-1.2s-5.3.5-6.7 1.2c1.2-.7 2.5-1.3 4-1.7L9 4a17 17 0 0 0-4.3 1.4C2.5 9 2 12.4 2.2 15.7c1.5 1.2 3 2 4.5 2.5l.9-1.3a8 8 0 0 1-2.6-1.3c.2.2.5.3.7.4 2.2 1.1 4.7 1.5 6.3 1.5s4-.4 6.3-1.5l.7-.4a8 8 0 0 1-2.6 1.3l.9 1.3a14 14 0 0 0 4.5-2.5c.3-3.3-.3-6.6-2.4-10.3z"/>,
    brain: <><path d="M12 2a5 5 0 0 0-4.8 3.5A4 4 0 0 0 4 9.5a4 4 0 0 0 1.2 2.9A4.5 4.5 0 0 0 4 15a4.5 4.5 0 0 0 3 4.2V22h2v-3h2v3h2v-2.8A4.5 4.5 0 0 0 16 15a4.5 4.5 0 0 0-1.2-2.6A4 4 0 0 0 16 9.5a4 4 0 0 0-3.2-3.9A5 5 0 0 0 12 2z"/></>,
    handshake: <path d="m11 17 2 2a1 1 0 0 0 1.4-1.4L13 16M14 14l3 3a1 1 0 0 0 1.4-1.4L16 13m1-3 3 3a1 1 0 0 0 1.4-1.4L19 9V5l-4-3-4 4-4-4-4 3v4l3 3a1 1 0 0 0 1.4-1.4L4 9m6-1 4 4"/>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>,
    users: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="3"/><path d="M21 21v-2a3 3 0 0 0-2-2.8"/></>,
    siren: <><path d="M12 2v4M4.9 4.9l2.8 2.8M2 12h4M19.1 4.9l-2.8 2.8M22 12h-4"/><path d="M8 16a4 4 0 1 1 8 0v2H8v-2z"/><path d="M6 20h12"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></>,
    terminal: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 8l4 4-4 4M13 16h4"/></>,
    messageCircle: <><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.2-2.5L3 21l2.5-2.8A9 9 0 0 1 3 12a9 9 0 0 1 18 0z"/></>,
    gitMerge: <><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {paths[name]}
    </svg>
  );
};

/* ============================================================
   Scroll-reveal hook
   ============================================================ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.rv');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ============================================================
   Architecture diagram — interactive SVG
   ============================================================ */
const ArchDiagram = ({ active }: { active: number }) => (
  <svg viewBox="0 0 520 420" className="w-full" style={{ maxWidth: 520 }}>
    <defs>
      <linearGradient id="purpleG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8A3FFC"/>
        <stop offset="100%" stopColor="#5B21B6"/>
      </linearGradient>
      <linearGradient id="blueG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#20B7F3"/>
        <stop offset="100%" stopColor="#0E7FB0"/>
      </linearGradient>
    </defs>

    <rect x="20" y="20" width="480" height="380" rx="20" fill="none" stroke="#E1DEEC" strokeDasharray="4 6" strokeWidth="1.5"/>
    <text x="36" y="44" fontFamily="monospace" fontSize="11" fill="#9AA0B5" letterSpacing="0.5">KUBERNETES CLUSTER</text>

    <g style={{ opacity: active >= 1 ? 1 : 0.25, transition: 'opacity 300ms' }}>
      <rect x="180" y="60" width="160" height="56" rx="12" fill="url(#purpleG)" />
      <text x="260" y="86" fontSize="14" fontWeight="500" fill="#fff" textAnchor="middle">kagent control plane</text>
      <text x="260" y="103" fontFamily="monospace" fontSize="10" fill="rgba(255,255,255,0.7)" textAnchor="middle">Agent + Session CRDs</text>
    </g>

    <g style={{ opacity: active >= 0 ? 1 : 0.25, transition: 'opacity 300ms' }}>
      {[
        { x: 50, label: 'k8s-agent' },
        { x: 200, label: 'istio-agent' },
        { x: 350, label: 'observability' },
      ].map((a, i) => (
        <g key={i}>
          <rect x={a.x} y={160} width={120} height={56} rx={12} fill="#fff" stroke="#8A3FFC" strokeWidth="1.5"/>
          <circle cx={a.x + 18} cy={188} r={6} fill="#8A3FFC"/>
          <text x={a.x + 32} y={184} fontSize="12" fontWeight="500" fill="#151927">Agent</text>
          <text x={a.x + 32} y={199} fontFamily="monospace" fontSize="10" fill="#6B7289">{a.label}</text>
          <path d={`M ${a.x + 60} 160 Q ${a.x + 60} 138 260 116`} fill="none" stroke="#CFCAE0" strokeWidth="1.2"/>
        </g>
      ))}
    </g>

    <g style={{ opacity: active >= 2 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="40" y="248" width="440" height="60" rx="12" fill="#FAFAFB" stroke="#E1DEEC"/>
      <text x="56" y="270" fontFamily="monospace" fontSize="10" fill="#9AA0B5">MCP TOOL LAYER</text>
      {['kubectl', 'prom', 'argocd', 'github', 'pagerduty', 'docs'].map((t, i) => (
        <g key={i}>
          <rect x={56 + i * 70} y={278} width={60} height={22} rx={11} fill="#fff" stroke="#CFCAE0"/>
          <text x={86 + i * 70} y={293} fontFamily="monospace" fontSize="10" fill="#5B21B6" textAnchor="middle">{t}</text>
        </g>
      ))}
      <path d="M 110 216 L 110 248" stroke="#CFCAE0" strokeWidth="1.2"/>
      <path d="M 260 216 L 260 248" stroke="#CFCAE0" strokeWidth="1.2"/>
      <path d="M 410 216 L 410 248" stroke="#CFCAE0" strokeWidth="1.2"/>
    </g>

    <g style={{ opacity: active >= 3 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="40" y="332" width="210" height="48" rx="10" fill="#E6F6FE" stroke="#9DD9F8"/>
      <text x="56" y="350" fontFamily="monospace" fontSize="10" fill="#0E7FB0">OPENTELEMETRY</text>
      <text x="56" y="368" fontSize="13" fontWeight="500" fill="#0E7FB0">Traces · Metrics · Logs</text>
    </g>

    <g style={{ opacity: active >= 4 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="270" y="332" width="210" height="48" rx="10" fill="#F4EEFE" stroke="#C8A8FF"/>
      <text x="286" y="350" fontFamily="monospace" fontSize="10" fill="#5B21B6">SERVICE MESH</text>
      <text x="286" y="368" fontSize="13" fontWeight="500" fill="#5B21B6">Istio · Ambient · mTLS</text>
    </g>
  </svg>
);

/* ============================================================
   How it works — interactive steps
   ============================================================ */
const HowItWorks = () => {
  const [active, setActive] = useState(0);
  const steps = [
    ['Define', 'Write an Agent CRD', 'Point at any LLM, attach the tools the agent needs (via MCP), and pick the cluster it should run in.'],
    ['Deploy', 'kubectl apply -f agent.yaml', 'kagent provisions the runtime, wires up RBAC, and registers the agent with your service mesh.'],
    ['Connect', 'Tools and other agents', 'MCP servers expose your APIs as tools. A2A lets agents delegate to each other across the cluster.'],
    ['Observe', 'Traces, metrics, logs', 'Every step emits OTel spans. See exactly which prompt, which tool, which token caused the latency.'],
    ['Govern', 'Policy and identity', 'Mesh-level mTLS, policy-driven egress, audit logs. Your security team\'s existing controls just work.'],
  ];

  return (
    <section className="rd-how" id="how">
      <div className="rd-container">
        <div className="rd-section-head rv">
          <span className="rd-eyebrow">Kubernetes-native agent runtime</span>
          <h2>Five steps. No new platform.</h2>
        </div>
        <div className="rd-how-grid">
          <div className="rd-how-steps rv">
            {steps.map((s, i) => (
              <button
                key={i}
                className={`rd-how-step ${i === active ? 'active' : ''}`}
                onClick={() => setActive(i)}
              >
                <div className="rd-how-num">{i + 1}</div>
                <div>
                  <h4>{s[1]}</h4>
                  <p>{s[2]}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="rd-how-diagram rv">
            <ArchDiagram active={active} />
          </div>
        </div>
      </div>
    </section>
  );
};

/* ============================================================
   Main page
   ============================================================ */
export default function RedesignPage() {
  useReveal();

  const [ghStars, setGhStars] = useState<string>('—');
  const [ghContributors, setGhContributors] = useState<string>('—');

  useEffect(() => {
    fetch('https://api.github.com/repos/kagent-dev/kagent')
      .then(r => r.json())
      .then(d => {
        if (typeof d.stargazers_count === 'number') {
          setGhStars(d.stargazers_count.toLocaleString());
        }
      })
      .catch(() => {});

    fetch('https://api.github.com/repos/kagent-dev/kagent/contributors?per_page=1&anon=true', { method: 'HEAD' })
      .then(r => {
        const link = r.headers.get('link');
        if (link) {
          const match = link.match(/page=(\d+)>; rel="last"/);
          if (match) setGhContributors(match[1]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="rd-shell">

      {/* HERO */}
      <section className="rd-hero">
        <div className="rd-hero-wash" />
        <div className="rd-container rd-hero-inner">
          <div className="rv rd-hero-text">
            <span className="rd-eyebrow">Kubernetes-native agent runtime</span>
            <h1 className="rd-hero-h1">
              Bring AI agents to <span className="rd-grad">every cluster you run</span>
            </h1>
            <p className="rd-lead">
              kagent runs your agents where your workloads already live — on Kubernetes.
              Deploy, observe, and govern AI agents with the tools your platform team
              already trusts. Open source. Production grade. Built by the founders of Istio.
            </p>
            <div className="rd-hero-ctas">
              <Link href="/docs/kagent/getting-started/quickstart" className="rd-btn rd-btn--purple">
                Install kagent
                <svg className="rd-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <Link href={GITHUB_LINK} className="rd-btn rd-btn--ghost" target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
                Star on GitHub
              </Link>
            </div>
            <div className="rd-hero-meta">
              <span>CNCF Sandbox</span>
              <span className="rd-dot" />
              <span>Works with any LLM</span>
            </div>
          </div>

          {/* Hero visual — platform hero image in browser frame */}
          <div className="rd-hero-visual rv">
            <div className="rd-hero-frame">
              <div className="rd-browser">
                <div className="rd-browser-bar">
                  <div className="rd-dots"><i /><i /><i /></div>
                  <div className="rd-url">kagent.dev / platform</div>
                  <div style={{ width: 32 }} />
                </div>
                <Image
                  src="/images/redesign/kagent-dashboard-hero.png"
                  alt="kagent Agents Dashboard"
                  width={1280}
                  height={900}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  priority
                />
              </div>

              <div className="rd-float-chip rd-float-l">
                <div className="rd-chip-icon" style={{ background: '#F4EEFE', color: '#8A3FFC' }}>
                  <Icon name="sparkles" size={16} />
                </div>
                <div>
                  <div className="rd-chip-label">12 agents healthy</div>
                  <div className="rd-chip-sub">Auto-scaled · 0 errors</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-r">
                <div className="rd-chip-icon" style={{ background: '#E6F6FE', color: '#20B7F3' }}>
                  <Icon name="plug" size={16} />
                </div>
                <div>
                  <div className="rd-chip-label">47 MCP tools</div>
                  <div className="rd-chip-sub">Connected · A2A enabled</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-b">
                <div className="rd-chip-icon" style={{ background: '#E8F8EF', color: '#22C55E' }}>
                  <Icon name="activity" size={16} />
                </div>
                <div>
                  <div className="rd-chip-label">p95 · 184ms</div>
                  <div className="rd-chip-sub">Last 24h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY KAGENT */}
      <section className="rd-why" id="why">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Why kagent</span>
            <h2>The shortest path from prototype to production agents.</h2>
            <p>You already know how to run things on Kubernetes — pods, services, RBAC, observability, GitOps. kagent makes agents another first-class workload, not a new platform to learn.</p>
          </div>
          <div className="rd-value-grid">
            {[
              ['workflow', 'Declarative agents', 'Define agents as Kubernetes CRDs — versioned in Git, reviewed in PRs, rolled out with the same tools you already use.'],
              ['plug', 'Bring your own everything', 'Any LLM, any framework, any tool. Native MCP, A2A, and OpenAI-compatible endpoints — no lock-in, no rewrites.'],
              ['eye', 'Observable by default', 'OpenTelemetry traces, Prometheus metrics, structured logs. See every prompt, every tool call, every token.'],
              ['shield', 'Zero-trust ready', 'Run on top of Istio or Ambient Mesh. mTLS, fine-grained RBAC, and policy-driven egress for agent traffic.'],
              ['shield', 'NVIDIA NemoClaw', 'Built-in security and privacy guardrails via NVIDIA NemoClaw. Run Nemotron locally or route to cloud models — with policy enforcement on every call.'],
              ['book', 'Standards-based', 'Native MCP, A2A, OpenTelemetry, and Kubernetes APIs. No proprietary glue, no rewrite tax later.'],
            ].map(([icon, title, body], i) => (
              <div key={i} className="rd-value-card rv">
                <div className="rd-v-icon"><Icon name={icon} /></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>

          {/* Platform Capabilities */}
          <div className="rd-capabilities rv" style={{ marginTop: 80 }}>
            <div className="rd-section-head">
              <span className="rd-eyebrow">Platform capabilities</span>
              <h2>Everything you need. Nothing you don&apos;t.</h2>
              <p>Every feature works with a single <code style={{ fontSize: 14, background: '#F4F2FA', padding: '2px 8px', borderRadius: 6, color: '#5B21B6' }}>helm install</code>. No add-ons, no extra databases, no waiting for enterprise.</p>
            </div>
            <div className="rd-cap-grid">
              {[
                ['workflow', 'Agent lifecycle via CRDs', 'Define, version, and roll out agents with kubectl and GitOps — the same workflow as every other workload.'],
                ['layers', 'Multi-runtime support', 'Go and Python ADK runtimes. Pick the language that fits, or mix both in the same cluster.'],
                ['plug', 'BYO frameworks', 'LangGraph, CrewAI, Google ADK, or your own — bring any agent framework and kagent orchestrates it.'],
                ['brain', 'Long-term memory', 'Persistent vector-backed memory across sessions. Agents remember context, not just the last prompt.'],
                ['handshake', 'Human-in-the-loop', 'Tool approval gates, agent-initiated questions, and cascading HITL — humans stay in control.'],
                ['users', 'Agent-to-Agent (A2A)', 'Agents discover and invoke each other. Compose multi-agent workflows with first-class delegation.'],
                ['book', 'Skills from Git', 'Load markdown knowledge from Git repos at startup. Agents learn your runbooks, not just generic docs.'],
                ['cog', 'Prompt templates', 'Reusable prompt fragments from ConfigMaps. DRY your system prompts across agents.'],
                ['activity', 'Context compaction', 'Auto-summarization of long histories. Agents stay coherent in extended conversations without blowing token budgets.'],
                ['lock', 'Sandbox & security', 'Agent sandboxing, RBAC, and security hardening out of the box. Run untrusted code safely.'],
                ['eye', 'Full observability', 'OTel tracing, Prometheus metrics, structured logs. See every prompt, every tool call, every token.'],
                ['cube', 'Postgres storage', 'Production-grade Postgres-backed storage with reviewable migrations. No proprietary database lock-in.'],
              ].map(([icon, title, desc], i) => (
                <div key={i} className="rd-cap-item rv">
                  <div className="rd-cap-check"><Icon name={icon} size={18} /></div>
                  <div>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations — scrolling icon marquees */}
          <div className="rd-integrations rv" style={{ marginTop: 80 }}>
            <div className="rd-section-head">
              <span className="rd-eyebrow">Integrations</span>
              <h2>Connects to what you already run.</h2>
              <p>Multi-LLM, multi-framework, multi-tool. No lock-in at any layer of the stack.</p>
            </div>
            <div className="rd-marquee-wrap">
              {[
                { label: 'LLM Providers', speed: 'slow', items: [
                  { name: 'OpenAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M22.28 9.37a5.83 5.83 0 0 0-.5-4.79A5.9 5.9 0 0 0 15.45 1.5a5.84 5.84 0 0 0-4.42 2.02 5.83 5.83 0 0 0-4.36-.46A5.9 5.9 0 0 0 2.95 6.2a5.84 5.84 0 0 0 .72 6.84 5.83 5.83 0 0 0 .5 4.79A5.9 5.9 0 0 0 10.5 20.9a5.83 5.83 0 0 0 4.42-2.02 5.83 5.83 0 0 0 4.36.46 5.9 5.9 0 0 0 3.72-3.14 5.84 5.84 0 0 0-.72-6.84zM10.5 19.81a4.37 4.37 0 0 1-2.81-1.02l.14-.08 4.67-2.7a.76.76 0 0 0 .38-.66v-6.57l1.97 1.14a.07.07 0 0 1 .04.05v5.45a4.39 4.39 0 0 1-4.39 4.39zm-7.6-4.02a4.37 4.37 0 0 1-.52-2.94l.14.08 4.67 2.7a.76.76 0 0 0 .76 0l5.7-3.29v2.27a.07.07 0 0 1-.03.06l-4.72 2.73a4.39 4.39 0 0 1-6-1.61zm-1-10.2A4.37 4.37 0 0 1 4.2 3.6l-.04.16v5.4a.76.76 0 0 0 .38.66l5.7 3.29-1.97 1.14a.07.07 0 0 1-.07 0L3.48 11.52a4.39 4.39 0 0 1-1.58-6zm15.1 3.52L11.3 5.82l1.97-1.14a.07.07 0 0 1 .07 0l4.72 2.73a4.39 4.39 0 0 1-.68 7.93v-5.56a.76.76 0 0 0-.38-.66zm1.96-2.94-.14-.08-4.67-2.7a.76.76 0 0 0-.76 0L7.7 6.78V4.5a.07.07 0 0 1 .03-.06l4.72-2.73a4.39 4.39 0 0 1 6.52 4.54zM6.81 11.51l-1.97-1.14a.07.07 0 0 1-.04-.05V4.88a4.39 4.39 0 0 1 7.2-3.37l-.14.08-4.67 2.7a.76.76 0 0 0-.38.66v6.57zm1.07-2.31L10.5 7.5l2.62 1.5v3.02l-2.62 1.51-2.62-1.5z"/></svg> },
                  { name: 'Anthropic', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#D97757"><path d="M17.304 3.541h-3.672l6.696 16.918H24zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.37 3.553h3.744L10.536 3.541zm-.371 10.223l2.291-5.946 2.292 5.946z"/></svg> },
                  { name: 'xAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M16.99 6.01L17.1 22h2.45l.12-18.37zM17.01 2.4l-3.68 0L6.29 12.05l1.84 2.6zm-9.82 19.6h3.68l1.84-2.6-1.84-2.6zM2.44 6.01L10.3 22h3.68L6.12 6.01z"/></svg> },
                  { name: 'Google Gemini', icon: <svg viewBox="0 0 28 28" width="20" height="20"><path d="M14 0C14 7.73 7.73 14 0 14c7.73 0 14 6.27 14 14 0-7.73 6.27-14 14-14-7.73 0-14-6.27-14-14z" fill="#4796E3"/></svg> },
                  { name: 'Azure OpenAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#0078D4"><path d="M22.379 23.343a1.62 1.62 0 0 0 1.536-2.14L17.35 1.76A1.62 1.62 0 0 0 15.816.657H8.184A1.62 1.62 0 0 0 6.65 1.76L.086 21.204a1.62 1.62 0 0 0 1.536 2.139h4.741a1.62 1.62 0 0 0 1.535-1.103l.977-2.892 4.947 3.675c.28.208.618.32.966.32m-3.084-12.531 3.624 10.739a.54.54 0 0 1-.51.713h-.03a.54.54 0 0 1-.322-.106l-9.287-6.9h4.853m6.313 7.006a1.6 1.6 0 0 0 .007-1.058L9.79 1.76a2 2 0 0 0-.007-.02h6.034a.54.54 0 0 1 .512.366l6.562 19.445a.54.54 0 0 1-.338.684"/></svg> },
                  { name: 'AWS', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M8.1 13.7c0 .3.03.5.08.65.06.15.13.32.22.5.04.06.05.12.05.17 0 .07-.04.15-.14.22l-.46.3c-.07.04-.13.06-.19.06-.07 0-.15-.04-.22-.1a2.3 2.3 0 0 1-.26-.34 5.3 5.3 0 0 1-.22-.43c-.57.67-1.28 1-2.14 1-.61 0-1.1-.17-1.46-.52-.36-.35-.54-.82-.54-1.4 0-.62.22-1.12.66-1.5.44-.39 1.03-.58 1.78-.58.24 0 .5.02.77.06.27.04.55.1.84.17v-.53c0-.55-.12-.94-.34-1.17-.23-.23-.63-.35-1.19-.35-.26 0-.52.03-.79.1a5.8 5.8 0 0 0-.78.25l-.12.04c-.05.02-.09.03-.11.03-.1 0-.15-.07-.15-.22v-.36c0-.12.01-.2.05-.26a.5.5 0 0 1 .21-.14c.26-.13.56-.24.92-.33a4.4 4.4 0 0 1 1.14-.14c.85 0 1.48.19 1.88.58.39.39.6.97.6 1.77v2.33zm-2.96 1.1c.24 0 .49-.05.75-.14.26-.09.5-.25.69-.47.12-.14.2-.29.26-.46.05-.18.08-.39.08-.63v-.31c-.22-.05-.45-.1-.67-.13a5.5 5.5 0 0 0-.68-.04c-.49 0-.85.1-1.09.29-.24.2-.36.47-.36.84 0 .34.09.6.27.77.17.18.43.27.75.28zm5.86.8c-.13 0-.22-.03-.27-.08-.05-.04-.1-.14-.14-.27l-1.54-5.07a1.3 1.3 0 0 1-.07-.27c0-.11.05-.17.16-.17h.72c.14 0 .23.03.28.08.05.04.09.14.13.27l1.1 4.33 1.02-4.33c.04-.14.07-.23.13-.27.05-.04.16-.08.29-.08h.58c.14 0 .23.03.28.08.05.04.1.14.13.27l1.03 4.39 1.13-4.39c.04-.14.09-.23.13-.27.06-.04.15-.08.28-.08h.68c.11 0 .17.05.17.17 0 .03-.01.07-.02.12a1 1 0 0 1-.05.16l-1.58 5.07c-.04.14-.09.23-.14.27-.05.04-.15.08-.27.08h-.63c-.14 0-.23-.03-.28-.08-.05-.05-.1-.14-.13-.27l-1.01-4.22-1 4.21c-.04.14-.08.23-.13.28-.05.05-.15.08-.28.08h-.63zm9.36.24c-.37 0-.74-.04-1.1-.13-.36-.09-.64-.18-.84-.29-.12-.07-.2-.14-.23-.21a.53.53 0 0 1-.04-.2v-.37c0-.15.06-.22.17-.22.04 0 .09.01.13.02l.17.07c.24.1.5.19.78.25.29.06.56.09.85.09.45 0 .8-.08 1.03-.24.24-.16.36-.4.36-.7 0-.2-.07-.38-.2-.52-.14-.15-.4-.28-.77-.4l-1.1-.34c-.56-.17-.97-.43-1.22-.77a1.8 1.8 0 0 1-.37-1.08c0-.31.07-.58.21-.82.14-.24.33-.44.57-.6.24-.16.51-.28.82-.36.31-.08.63-.12.98-.12.17 0 .35.01.53.03.18.03.35.06.51.1.16.04.31.08.45.13.14.05.25.1.33.15a.7.7 0 0 1 .21.18c.04.06.05.13.05.22v.34c0 .15-.06.22-.17.22a.8.8 0 0 1-.27-.08c-.37-.17-.78-.25-1.24-.25-.4 0-.72.07-.93.21-.22.14-.33.36-.33.66 0 .21.07.39.22.53.15.14.44.28.85.41l1.07.34c.55.17.95.41 1.18.72.24.3.35.65.35 1.04 0 .32-.07.6-.2.87-.14.26-.33.49-.57.68-.24.19-.53.33-.87.43-.36.11-.73.16-1.13.16z" fill="#232F3E"/><path d="M20.6 17.15c-1.48 1.03-3.63 1.58-5.48 1.58-2.6 0-4.93-.96-6.7-2.56-.14-.13-.01-.3.16-.2 1.91 1.11 4.27 1.78 6.71 1.78 1.64 0 3.45-.34 5.11-1.06.25-.1.46.17.2.46z" fill="#FF9900"/><path d="M21.14 16.51c-.19-.24-1.26-.12-1.74-.06-.15.02-.17-.11-.04-.2.85-.6 2.25-.43 2.41-.23.17.21-.04 1.62-.85 2.3-.12.1-.24.05-.18-.08.18-.45.59-1.48.4-1.73z" fill="#FF9900"/></svg> },
                  { name: 'Vertex AI', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="#4285F4"/><path d="M12 6l-5 9h3l2-3.5L14 15h3L12 6z" fill="#fff"/></svg> },
                  { name: 'Ollama', icon: <svg viewBox="0 0 17 25" width="16" height="22" fill="black"><path fillRule="evenodd" clipRule="evenodd" d="M4.405.102C4.621.199 4.816.358 4.993.568c.295.347.544.845.734 1.435.191.593.315 1.25.362 1.909a4.8 4.8 0 0 1 2.049-.723l.051-.005a3.8 3.8 0 0 1 2.48.539c.101.06.2.125.297.193.05-.647.172-1.289.36-1.868.19-.591.439-1.087.733-1.436.164-.202.365-.361.589-.466.257-.114.53-.134.796-.048.401.13.745.418 1.016.837.248.383.434.874.561 1.463.23 1.061.27 2.458.115 4.142l.053.045.026.022c.757.654 1.284 1.587 1.563 2.67.435 1.69.216 3.585-.534 4.646l-.018.023.002.004c.417.866.67 1.78.724 2.727l.002.034c.064 1.21-.2 2.428-.814 3.625l-.007.011.01.028a10.2 10.2 0 0 1 .438 3.961l-.006.044a.53.53 0 0 1-.263.48.47.47 0 0 1-.484-.029.5.5 0 0 1-.238-.195.55.55 0 0 1-.106-.261.6.6 0 0 1-.01-.287c.167-1.174.01-2.351-.48-3.549a.6.6 0 0 1-.06-.356.6.6 0 0 1 .1-.345l.003-.007c.605-1.05.855-2.08.801-3.091-.046-.885-.325-1.755-.8-2.583a.55.55 0 0 1-.092-.545.47.47 0 0 1 .272-.393l.009-.007c.243-.18.467-.642.58-1.272a5.3 5.3 0 0 0-.095-2.243c-.205-.796-.58-1.459-1.105-1.913-.595-.516-1.383-.765-2.38-.693a.46.46 0 0 1-.373-.1.5.5 0 0 1-.26-.321c-.313-.756-.771-1.297-1.342-1.632a2.6 2.6 0 0 0-1.772-.377c-1.245.112-2.343.91-2.67 1.916a.5.5 0 0 1-.239.35.44.44 0 0 1-.371.133c-1.067.002-1.893.286-2.497.799-.522.443-.878 1.062-1.066 1.804a5.3 5.3 0 0 0-.068 2.143c.112.634.33 1.16.581 1.442l.008.008a.54.54 0 0 1 .109.892c-.36.707-.629 1.76-.673 2.773-.05 1.157.186 2.161.719 2.882l.016.021a.56.56 0 0 1 .095.377.56.56 0 0 1-.054.408c-.576 1.404-.753 2.559-.564 3.468a.55.55 0 0 1-.09.549.46.46 0 0 1-.4.223.44.44 0 0 1-.485-.086.55.55 0 0 1-.295-.446C.165 23.248.33 21.923.881 20.43l.014-.04-.008-.014a6 6 0 0 1-.598-1.487l-.005-.022a6.7 6.7 0 0 1-.177-2.028c.044-1.034.278-2.093.622-2.943l.012-.03-.002-.002c-.293-.475-.51-1.083-.63-1.756l-.005-.027A6.5 6.5 0 0 1 .197 9.252c.262-1.04.777-1.933 1.536-2.578.06-.051.123-.102.186-.15C1.76 4.827 1.8 3.421 2.031 2.353 2.158 1.765 2.345 1.274 2.593.89c.27-.418.614-.707 1.015-.837.266-.086.54-.066.797.049M8.521 10.432c.936 0 1.8.355 2.446.971.63.599 1.005 1.404 1.005 2.205 0 1.009-.406 1.795-1.133 2.297-.62.426-1.451.633-2.403.633-.837 0-1.775-.132-2.397-.672a3.01 3.01 0 0 1-.963-1.716v-.372c0-.804.398-1.61 1.056-2.212.668-.61 1.55-.964 2.485-.964zm0 1.018a2.5 2.5 0 0 0-1.916.739c-.461.42-.722.949-.722 1.42 0 .486.21.942.61 1.288.455.394 1.124.623 1.943.623.799 0 1.473-.167 1.932-.484.463-.318.7-.78.7-1.43 0-.48-.246-1.011-.683-1.427a2.4 2.4 0 0 0-1.864-.73zM9.183 12.825l.004.004a.44.44 0 0 1-.056.557l-.292.261v.507a.47.47 0 0 1-.112.3.38.38 0 0 1-.265.124.38.38 0 0 1-.265-.124.47.47 0 0 1-.112-.3v-.523l-.271-.248a.44.44 0 0 1-.072-.557.35.35 0 0 1 .312-.144.35.35 0 0 1 .258.086l.215.196.22-.198a.35.35 0 0 1 .255-.084.35.35 0 0 1 .235.143zM4.143 10.644c.478 0 .867.443.867.99a.99.99 0 0 1-.254.7.77.77 0 0 1-.614.29.77.77 0 0 1-.613-.291.99.99 0 0 1-.254-.699c0-.262.091-.513.253-.7a.77.77 0 0 1 .615-.29zm8.706 0c.48 0 .868.443.868.99a.99.99 0 0 1-.254.7.77.77 0 0 1-.614.29.77.77 0 0 1-.613-.291.99.99 0 0 1-.254-.699c0-.262.091-.513.253-.7a.77.77 0 0 1 .614-.29zM3.94 1.477l-.003.002a.54.54 0 0 0-.288.271l-.005.007c-.138.215-.258.531-.348.946-.17.786-.216 1.853-.124 3.161.43-.145.899-.236 1.404-.27l.01-.001.019-.039c.046-.093.095-.183.148-.271.123-.876.022-1.923-.253-2.778-.134-.414-.297-.739-.453-.924a.7.7 0 0 0-.107-.103zm9.174.046-.002.001a.7.7 0 0 0-.107.102c-.156.186-.32.511-.453.926-.29.902-.387 2.018-.23 2.923l.058.11.008.016h.03c.496 0 .99.081 1.466.241.086-1.277.034-2.322-.132-3.093-.09-.415-.21-.731-.349-.946l-.004-.007a.54.54 0 0 0-.285-.273z"/></svg> },
                  { name: 'Hugging Face', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#FFD21E"><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1M8.863 7.207c.618-.337 1.338-.193 1.807.088.39.233.675.586.822.86a.29.29 0 0 1-.127.39.29.29 0 0 1-.39-.128c-.105-.196-.323-.462-.614-.636-.342-.204-.8-.3-1.2-.082-.626.341-.73 1.205-.727 1.728 0 .262.026.487.05.625a.29.29 0 0 1-.236.335.29.29 0 0 1-.335-.236 6 6 0 0 1-.055-.696c-.003-.59.098-1.678.905-2.248m7.503 2.248a6 6 0 0 0-.055-.696.29.29 0 0 0-.335-.236.29.29 0 0 0-.236.335c.024.138.05.363.05.625.004.524-.1 1.387-.726 1.728-.4.219-.859.122-1.2-.082-.292-.174-.51-.44-.615-.636a.29.29 0 0 0-.39-.127.29.29 0 0 0-.127.389c.147.274.431.627.822.86.469.281 1.189.425 1.807.088.807-.57.908-1.658.905-2.248M7.32 13.286c.086-.09.231-.092.32-.007.865.832 2.094 1.386 3.464 1.504.2.006.382.008.544.004a8.7 8.7 0 0 0 3.907-1.46.226.226 0 0 1 .316.057.23.23 0 0 1-.057.316 9.15 9.15 0 0 1-4.12 1.538c-.176.005-.37.003-.582-.003-1.49-.129-2.83-.73-3.787-1.65a.23.23 0 0 1-.006-.3m1.632 2.016c.32-.113.983-.241 1.756-.116.773.126 1.283.469 1.475.652a.226.226 0 0 1-.003.32.226.226 0 0 1-.32-.003c-.126-.12-.552-.406-1.2-.511-.648-.106-1.225-.001-1.478.088a.226.226 0 0 1-.29-.14.226.226 0 0 1 .06-.29m4.796-.116c.773-.125 1.437.003 1.756.116a.226.226 0 0 1 .14.29.226.226 0 0 1-.29.14c-.253-.09-.83-.194-1.478-.088-.648.105-1.074.39-1.2.511a.226.226 0 0 1-.32.003.226.226 0 0 1-.003-.32c.192-.183.702-.526 1.475-.652z"/></svg> },
                ]},
                { label: 'Agents & Frameworks', speed: 'medium', reverse: true, items: [
                  { name: 'LangGraph', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1C3C3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5l3 8M16 7.5l-3 8M8.5 6h7"/></svg> },
                  { name: 'CrewAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FF5A50" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><path d="M10 9l2 5M14 9l-2 5"/></svg> },
                  { name: 'Google ADK', icon: <svg viewBox="0 0 28 28" width="20" height="20"><path d="M14 0C14 7.73 7.73 14 0 14c7.73 0 14 6.27 14 14 0-7.73 6.27-14 14-14-7.73 0-14-6.27-14-14z" fill="#4285F4"/></svg> },
                  { name: 'OpenClaw', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 8c-1-1-2-3-1-5s3-2 4-1l2 3 2-3c1-1 3-1 4 1s0 4-1 5l-3 3v3l4 3v3H6v-3l4-3v-3L6 8z" fill="#E74C3C"/></svg> },
                  { name: 'NemoClaw', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5.888 13.832v-3.664C8.09 7.212 11.046 5.536 14.5 5.536c1.62 0 3.13.388 4.47 1.065v2.7c-1.26-.92-2.8-1.465-4.47-1.465-2.66 0-4.98 1.44-6.24 3.58v1.168c1.26 2.14 3.58 3.58 6.24 3.58 1.67 0 3.21-.545 4.47-1.465v2.7c-1.34.677-2.85 1.065-4.47 1.065-3.454 0-6.41-1.676-8.612-4.632z" fill="#76B900"/></svg> },
                  { name: 'OpenShell', icon: <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="3" width="20" height="18" rx="2" fill="#1a1a2e"/><path d="M6 8l4 4-4 4" stroke="#76B900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16h6" stroke="#76B900" strokeWidth="2" strokeLinecap="round"/></svg> },
                  { name: 'Hermes Agent', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#7C3AED"/><path d="M8 8h8v2H8zm2 3h4v2h-4zm-1 3h6v2H9z" fill="#fff" opacity=".9"/><path d="M6 6l3-3M18 6l-3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                  { name: 'MCP', icon: <svg viewBox="0 0 180 180" width="20" height="20"><path d="M18 84.85L85.88 16.97C95.25 7.6 110.45 7.6 119.82 16.97C129.2 26.34 129.2 41.54 119.82 50.91L68.56 102.18" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M69.27 101.47L119.82 50.91C129.2 41.54 144.39 41.54 153.77 50.91L154.12 51.27C163.49 60.64 163.49 75.83 154.12 85.21L92.72 146.6C89.6 149.72 89.6 154.79 92.72 157.91L105.33 170.52" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M102.85 33.94L52.65 84.15C43.28 93.52 43.28 108.71 52.65 118.09C62.02 127.46 77.22 127.46 86.59 118.09L136.79 67.88" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/></svg> },
                  { name: 'A2A', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#20B7F3" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 12h6M9 12l6-6M9 12l6 6"/></svg> },
                  { name: 'Python', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M11.9 2c-1 0-1.9.1-2.7.3C6.8 2.9 6.3 4 6.3 5.5v1.8h5.6v.6H5.3c-1.7 0-3.2 1-3.6 2.9-.5 2.2-.5 3.6 0 5.9.4 1.7 1.3 2.9 3 2.9h1.9v-2.6c0-1.9 1.6-3.5 3.5-3.5h5.6c1.6 0 2.9-1.3 2.9-2.9V5.5c0-1.5-1.3-2.7-2.9-3.1-.9-.3-1.8-.4-2.8-.4zM8.8 4.1c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z" fill="#3776AB"/><path d="M18.4 7.9v2.5c0 2-1.7 3.6-3.5 3.6h-5.6c-1.6 0-2.9 1.3-2.9 2.9v5.4c0 1.5 1.3 2.4 2.9 2.9 1.9.5 3.7.6 5.6 0 1.3-.4 2.9-1.2 2.9-2.9v-2.2h-5.6v-.7h8.5c1.7 0 2.3-1.2 2.9-2.9.6-1.8.6-3.5 0-5.9-.4-1.7-1.2-2.9-2.9-2.9h-2.3zm-3.2 11.3c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z" fill="#FFD43B"/></svg> },
                  { name: 'Go', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M1.8 10.2s-.1-.1 0-.2l2.6.8s.1.1.1.2l-2.7-.8zm18.4 0s.1-.1 0-.2l-2.6.8s-.1.1-.1.2l2.7-.8z" fill="#00ACD7"/><path d="M12 3.6c-3.8 0-7.3 2-7.3 5.6 0 3.8 3.3 5.3 7.3 5.3s7.3-1.5 7.3-5.3c0-3.6-3.5-5.6-7.3-5.6z" fill="#00ACD7"/><path d="M12 4.3c-3.4 0-6.2 1.7-6.2 4.9 0 3.3 2.7 4.6 6.2 4.6s6.2-1.3 6.2-4.6c0-3.2-2.8-4.9-6.2-4.9z" fill="#fff"/><ellipse cx="9.6" cy="8.2" rx="1.1" ry="1.4" fill="#00ACD7"/><ellipse cx="14.4" cy="8.2" rx="1.1" ry="1.4" fill="#00ACD7"/><path d="M9.5 11.5s1 1.4 2.5 1.4 2.5-1.4 2.5-1.4" fill="none" stroke="#00ACD7" strokeWidth=".8" strokeLinecap="round"/></svg> },
                ]},
                { label: 'Dev Tools & Channels', speed: 'fast', items: [
                  { name: 'Claude Code', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#D97757"><path d="M17.304 3.541h-3.672l6.696 16.918H24zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.37 3.553h3.744L10.536 3.541zm-.371 10.223l2.291-5.946 2.292 5.946z"/></svg> },
                  { name: 'Cursor', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M11.925.131L.882 5.392a.84.84 0 0 0-.462.749v11.718a.84.84 0 0 0 .462.749l11.043 5.261a.84.84 0 0 0 .724 0l11.043-5.261a.84.84 0 0 0 .462-.749V6.141a.84.84 0 0 0-.462-.749L12.649.131a.84.84 0 0 0-.724 0m.356 2.673l9.622 16.663a.28.28 0 0 1-.243.418H2.34a.28.28 0 0 1-.243-.418L11.72 2.804a.28.28 0 0 1 .486 0z"/></svg> },
                  { name: 'OpenCode', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#656363" strokeWidth="1.8" strokeLinecap="round"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 3l-4 18"/></svg> },
                  { name: 'pi.dev', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#151927"><text x="12" y="18" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="serif">π</text></svg> },
                  { name: 'GitHub', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#24292F"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg> },
                  { name: 'Slack', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5.04 15.16a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h2.1v2.1zm1.07 0a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.26a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-5.26z" fill="#E01E5A"/><path d="M8.21 5.04a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v2.1H8.21zm0 1.07a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1H2.94a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27z" fill="#36C5F0"/><path d="M18.96 8.21a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-2.1V8.21zm-1.07 0a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1V2.94a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.27z" fill="#2EB67D"/><path d="M15.79 18.96a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-2.1h2.1zm0-1.07a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-5.27z" fill="#ECB22E"/></svg> },
                  { name: 'Discord', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#5865F2"><path d="M20.3 4.4A18.7 18.7 0 0 0 15.5 3l-.6 1.2A17.4 17.4 0 0 0 9.1 4.2L8.5 3A18.7 18.7 0 0 0 3.7 4.4 19.3 19.3 0 0 0 .5 18.4a18.8 18.8 0 0 0 5.7 2.9l.8-1.2a12.2 12.2 0 0 1-3.8-1.8l.9-.7c3.5 1.6 7.3 1.6 10.8 0l.9.7a12.2 12.2 0 0 1-3.8 1.8l.8 1.2a18.8 18.8 0 0 0 5.7-2.9A19.3 19.3 0 0 0 20.3 4.4zM8 15.6c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4zm8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4z"/></svg> },
                  { name: 'Telegram', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#0088CC"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg> },
                ]},
                { label: 'Infrastructure', speed: 'medium', reverse: true, items: [
                  { name: 'Kubernetes', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 1.5L3 6.7v10.4l9 5.2 9-5.2V6.7L12 1.5z" fill="#326CE5"/><path d="M12 4l5.5 3.2v6.3L12 16.7l-5.5-3.2V7.2L12 4z" fill="none" stroke="#fff" strokeWidth=".8"/><circle cx="12" cy="10.5" r="1.5" fill="#fff"/></svg> },
                  { name: 'Helm', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#0F1689"/><circle cx="12" cy="12" r="2" fill="#fff"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                  { name: 'Istio', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 21L12 3l7 18H5z" fill="#466BB0"/><path d="M12 3l7 18H12V3z" fill="#466BB0" opacity=".5"/></svg> },
                  { name: 'Cilium', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z" fill="#8061A9"/><path d="M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5L12 7z" fill="#F9C515"/></svg> },
                  { name: 'ArgoCD', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="11" r="9" fill="#EF7B4D"/><circle cx="12" cy="10" r="4" fill="#fff"/><circle cx="12" cy="10" r="2" fill="#EF7B4D"/><path d="M8 17c0 0 2 3 4 3s4-3 4-3" fill="#EF7B4D" stroke="#EF7B4D" strokeWidth="1"/></svg> },
                  { name: 'Prometheus', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#E6522C"/><path d="M12 3v4M12 9v3M8 19h8M7 16.5h10M9 7h6v2H9zm-1 3h8v2H8zm1 3h6v2H9z" stroke="#fff" strokeWidth=".8" fill="#fff"/></svg> },
                  { name: 'OpenTelemetry', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="17" cy="17" r="2.5" stroke="#F5A800" strokeWidth="2"/><path d="M7 7l7 7" stroke="#425CC7" strokeWidth="2.5" strokeLinecap="round"/><path d="M4 10l3-3 3 3" stroke="#425CC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { name: 'Grafana', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#F15B2A"/><circle cx="12" cy="12" r="5" fill="#F9C322"/><circle cx="12" cy="12" r="2.5" fill="#F15B2A"/></svg> },
                  { name: 'GitHub Actions', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#24292F"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg> },
                  { name: 'Langfuse', icon: <svg viewBox="0 0 24 24" width="20" height="20"><rect width="24" height="24" rx="4" fill="#0F172A"/><path d="M7 17V7h2v8h5v2H7z" fill="#fff"/></svg> },
                  { name: 'GKE', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#4285F4"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4L12 8z" fill="#fff"/></svg> },
                  { name: 'EKS', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#FF9900"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4L12 8z" fill="#fff"/></svg> },
                  { name: 'AKS', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#0078D4"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4L12 8z" fill="#fff"/></svg> },
                  { name: 'OCI', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#C74634"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4L12 8z" fill="#fff"/></svg> },
                ]},
              ].map((row, ri) => (
                <div key={ri} className="rd-marquee-row">
                  <div className="rd-marquee-label">{row.label}</div>
                  <div className="rd-marquee-track">
                    <div className={`rd-marquee-scroll rd-marquee-${row.speed}${row.reverse ? ' rd-marquee-reverse' : ''}`}>
                      {[...row.items, ...row.items].map((item, ii) => (
                        <div key={ii} className="rd-marquee-item">
                          <div className="rd-marquee-icon">{item.icon}</div>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* USE CASES */}
      <section className="rd-usecases" id="usecases">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Use cases</span>
            <h2>What teams ship with kagent.</h2>
            <p>From day-zero installs to platform-wide rollouts, kagent powers the agent surface area inside platform engineering organizations.</p>
          </div>
          <div className="rd-uc-grid">
            {[
              ['siren', 'Incident response', 'A pager-aware agent that triages alerts, correlates traces, drafts the runbook, and opens the rollback PR — with humans approving each step.'],
              ['search', 'Observability copilot', 'Conversational PromQL and trace navigation. Ask "why did checkout p99 spike at 3am" and get the actual answer, with citations.'],
              ['terminal', 'Platform self-service', 'Devs ask for a namespace, a database, or a CI pipeline in plain English. The agent files the GitOps PR; your existing approvals do the rest.'],
              ['brain', 'Knowledge agents', 'RAG over runbooks, ADRs, and Slack history — but with mTLS, RBAC, and audit logs that your security team will actually sign off on.'],
              ['messageCircle', 'Chat providers', 'Message OpenClaw, Hermes, and other agents through Telegram, WhatsApp, Slack, or Discord. Every channel connects via A2A — one agent works on every platform.'],
              ['gitMerge', 'Multi-agent workflows', 'Chain agents together to automate complex operations end-to-end. One agent triages, another investigates, a third remediates — coordinated via A2A with full observability at every step.'],
            ].map(([icon, title, body], i) => (
              <div key={i} className="rd-uc-card rv">
                <div className="rd-uc-icon"><Icon name={icon} /></div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="rd-uc-link">
                  Read the pattern
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="rd-standards" id="standards">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Built on standards</span>
            <h2>An open stack, not another silo.</h2>
            <p>kagent doesn&apos;t reinvent the wheel. It composes the protocols that the agent ecosystem is converging on — so you can swap models, frameworks, and tools without rewriting your agents.</p>
          </div>
          <div className="rd-std-grid">
            {/* MCP — official Model Context Protocol logo */}
            <div className="rd-std-card rv">
              <div className="rd-std-mark" style={{ background: 'linear-gradient(135deg,#8A3FFC,#5B21B6)' }}>
                <svg width="28" height="28" viewBox="0 0 180 180" fill="none">
                  <path d="M18 84.8528L85.8822 16.9706C95.2548 7.59798 110.451 7.59798 119.823 16.9706C129.196 26.3431 129.196 41.5391 119.823 50.9117L68.5581 102.177" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M69.2652 101.47L119.823 50.9117C129.196 41.5391 144.392 41.5391 153.765 50.9117L154.118 51.2652C163.491 60.6378 163.491 75.8338 154.118 85.2063L92.7248 146.6C89.6006 149.724 89.6006 154.789 92.7248 157.913L105.331 170.52" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M102.853 33.9411L52.6482 84.1457C43.2756 93.5183 43.2756 108.714 52.6482 118.087C62.0208 127.459 77.2167 127.459 86.5893 118.087L136.794 67.8822" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Model Context Protocol</h4>
              <p>Connect any tool — REST, gRPC, databases, internal APIs — through a single declarative spec.</p>
            </div>

            {/* A2A — official Agent-to-Agent protocol logo */}
            <div className="rd-std-card rv">
              <div className="rd-std-mark" style={{ background: 'linear-gradient(135deg,#20B7F3,#0E7FB0)' }}>
                <svg width="28" height="28" viewBox="0 0 860 860" fill="none">
                  <circle cx="544" cy="307" r="27" fill="#fff"/>
                  <circle cx="154" cy="307" r="27" fill="#fff"/>
                  <circle cx="706" cy="307" r="27" fill="#fff"/>
                  <circle cx="316" cy="307" r="27" fill="#fff"/>
                  <path d="M336.5 191.003H162C97.6588 191.003 45.5 243.162 45.5 307.503C45.5 371.844 97.6442 424.003 161.985 424.003C206.551 424.003 256.288 424.003 296.5 424.003C487.5 424.003 374 191.005 569 191.001C613.886 191 658.966 191 698.025 191C762.366 191.001 814.5 243.16 814.5 307.501C814.5 371.843 762.34 424.003 697.998 424.003H523.5" stroke="#fff" strokeWidth="48" strokeLinecap="round"/>
                  <path d="M256 510.002C270.359 510.002 282 521.643 282 536.002C282 550.361 270.359 562.002 256 562.002H148C133.641 562.002 122 550.361 122 536.002C122 521.643 133.641 510.002 148 510.002H256ZM712 510.002C726.359 510.002 738 521.643 738 536.002C738 550.361 726.359 562.002 712 562.002H360C345.641 562.002 334 550.361 334 536.002C334 521.643 345.641 510.002 360 510.002H712Z" fill="#fff"/>
                  <path d="M444 628.002C458.359 628.002 470 639.643 470 654.002C470 668.361 458.359 680.002 444 680.002H100C85.6406 680.002 74 668.361 74 654.002C74 639.643 85.6406 628.002 100 628.002H444ZM548 628.002C562.359 628.002 574 639.643 574 654.002C574 668.361 562.359 680.002 548 680.002C533.641 680.002 522 668.361 522 654.002C522 639.643 533.641 628.002 548 628.002ZM760 628.002C774.359 628.002 786 639.643 786 654.002C786 668.361 774.359 680.002 760 680.002H652C637.641 680.002 626 668.361 626 654.002C626 639.643 637.641 628.002 652 628.002H760Z" fill="#fff"/>
                </svg>
              </div>
              <h4>Agent-to-Agent</h4>
              <p>Compose multi-agent systems with first-class delegation, hand-off, and shared memory.</p>
            </div>

            {/* OpenTelemetry — official CNCF logo */}
            <div className="rd-std-card rv">
              <div className="rd-std-mark" style={{ background: 'linear-gradient(135deg,#F59E0B,#B45309)' }}>
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <circle cx="17.9" cy="23.6" r="2.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.8,25.3l-2.3,2.3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4.1,26.8l2.1,2.1" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9.6,27.2L5.5,23l5.3-5.3l2.1,2.2c-1.5,1.7-1.6,3.4-1.1,5.2L9.6,27.2z" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.6,18l-2.8-3l4.6-4.6l5.3,5.3l-2.1,2.1C19,16.8,17.1,17.1,15.6,18z" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M26.5,14.7l-7.9-7.9c-0.4-0.4-0.4-1,0-1.4l1.7-1.7c0.4-0.4,1-0.4,1.4,0l7.9,7.9c0.4,0.4,0.4,1,0,1.4l-1.7,1.7C27.5,15,26.9,15,26.5,14.7z" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>OpenTelemetry</h4>
              <p>Every prompt, tool call, and token emits OTel traces — the same pipeline as the rest of your stack.</p>
            </div>

            {/* Kubernetes — official helm wheel logo */}
            <div className="rd-std-card rv">
              <div className="rd-std-mark" style={{ background: 'linear-gradient(135deg,#326CE5,#1D4ED8)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                  <path d="M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .484.606zm-.833-2.129a.44.44 0 0 0 .173-.756l.002-.011L7.585 9.7a5.143 5.143 0 0 0-.73 3.255l2.514-.725.002-.009zm1.145-1.98a.44.44 0 0 0 .699-.337l.01-.005.15-2.62a5.144 5.144 0 0 0-3.01 1.442l2.147 1.523.004-.002zm.76 2.75l.723.349.722-.347.18-.78-.5-.623h-.804l-.5.623.179.779zm1.5-3.095a.44.44 0 0 0 .7.336l.008.003 2.134-1.513a5.188 5.188 0 0 0-2.992-1.442l.148 2.615.002.001zm10.876 5.97l-5.773 7.181a1.6 1.6 0 0 1-1.248.594l-9.261.003a1.6 1.6 0 0 1-1.247-.596l-5.776-7.18a1.583 1.583 0 0 1-.307-1.34L2.1 5.573c.108-.47.425-.864.863-1.073L11.305.513a1.606 1.606 0 0 1 1.385 0l8.345 3.985c.438.209.755.604.863 1.073l2.062 8.955c.108.47-.005.963-.308 1.34zm-3.289-2.057c-.042-.01-.103-.026-.145-.034-.174-.033-.315-.025-.479-.038-.35-.037-.638-.067-.895-.148-.105-.04-.18-.165-.216-.216l-.201-.059a6.45 6.45 0 0 0-.105-2.332 6.465 6.465 0 0 0-.936-2.163c.052-.047.15-.133.177-.159.008-.09.001-.183.094-.282.197-.185.444-.338.743-.522.142-.084.273-.137.415-.242.032-.024.076-.062.11-.089.24-.191.295-.52.123-.736-.172-.216-.506-.236-.745-.045-.034.027-.08.062-.111.088-.134.116-.217.23-.33.35-.246.25-.45.458-.673.609-.097.056-.239.037-.303.033l-.19.135a6.545 6.545 0 0 0-4.146-2.003l-.012-.223c-.065-.062-.143-.115-.163-.25-.022-.268.015-.557.057-.905.023-.163.061-.298.068-.475.001-.04-.001-.099-.001-.142 0-.306-.224-.555-.5-.555-.275 0-.499.249-.499.555l.001.014c0 .041-.002.092 0 .128.006.177.044.312.067.475.042.348.078.637.056.906a.545.545 0 0 1-.162.258l-.012.211a6.424 6.424 0 0 0-4.166 2.003 8.373 8.373 0 0 1-.18-.128c-.09.012-.18.04-.297-.029-.223-.15-.427-.358-.673-.608-.113-.12-.195-.234-.329-.349-.03-.026-.077-.062-.111-.088a.594.594 0 0 0-.348-.132.481.481 0 0 0-.398.176c-.172.216-.117.546.123.737l.007.005.104.083c.142.105.272.159.414.242.299.185.546.338.743.522.076.082.09.226.1.288l.16.143a6.462 6.462 0 0 0-1.02 4.506l-.208.06c-.055.072-.133.184-.215.217-.257.081-.546.11-.895.147-.164.014-.305.006-.48.039-.037.007-.09.02-.133.03l-.004.002-.007.002c-.295.071-.484.342-.423.608.061.267.349.429.645.365l.007-.001.01-.003.129-.029c.17-.046.294-.113.448-.172.33-.118.604-.217.87-.256.112-.009.23.069.288.101l.217-.037a6.5 6.5 0 0 0 2.88 3.596l-.09.218c.033.084.069.199.044.282-.097.252-.263.517-.452.813-.091.136-.185.242-.268.399-.02.037-.045.095-.064.134-.128.275-.034.591.213.71.248.12.556-.007.69-.282v-.002c.02-.039.046-.09.062-.127.07-.162.094-.301.144-.458.132-.332.205-.68.387-.897.05-.06.13-.082.215-.105l.113-.205a6.453 6.453 0 0 0 4.609.012l.106.192c.086.028.18.042.256.155.136.232.229.507.342.84.05.156.074.295.145.457.016.037.043.09.062.129.133.276.442.402.69.282.247-.118.341-.435.213-.71-.02-.039-.045-.096-.065-.134-.083-.156-.177-.261-.268-.398-.19-.296-.346-.541-.443-.793-.04-.13.007-.21.038-.294-.018-.022-.059-.144-.083-.202a6.499 6.499 0 0 0 2.88-3.622c.064.01.176.03.213.038.075-.05.144-.114.28-.104.266.039.54.138.87.256.154.06.277.128.448.173.036.01.088.019.13.028l.009.003.007.001c.297.064.584-.098.645-.365.06-.266-.128-.537-.423-.608zM16.4 9.701l-1.95 1.746v.005a.44.44 0 0 0 .173.757l.003.01 2.526.728a5.199 5.199 0 0 0-.108-1.674A5.208 5.208 0 0 0 16.4 9.7zm-4.013 5.325a.437.437 0 0 0-.404-.232.44.44 0 0 0-.372.233h-.002l-1.268 2.292a5.164 5.164 0 0 0 3.326.003l-1.27-2.296h-.01zm1.888-1.293a.44.44 0 0 0-.27.036.44.44 0 0 0-.214.572l-.003.004 1.01 2.438a5.15 5.15 0 0 0 2.081-2.615l-2.6-.44-.004.005z"/>
                </svg>
              </div>
              <h4>Kubernetes-native</h4>
              <p>Agents, sessions, and tools as CRDs. GitOps, RBAC, and admission controllers come for free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EDITIONS */}
      <section className="rd-editions" id="editions">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Fully open source</span>
            <h2>Everything included. No paywall.</h2>
            <p>kagent is open source forever. Every feature ships in the community edition — no enterprise tier required.</p>
          </div>
          <div className="rd-ed-grid" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="rd-ed-card rd-ed-os rv">
              <div className="rd-ed-tag">OPEN SOURCE · APACHE 2.0</div>
              <h3>kagent</h3>
              <p className="rd-ed-sub">Everything you need to run agents on a Kubernetes cluster. Forever free, forever open.</p>
              <ul className="rd-ed-list">
                {[
                  'Agent and Session CRDs',
                  'Native MCP and A2A support',
                  'OpenTelemetry tracing + Prometheus metrics',
                  'CLI, dashboard, and Helm chart',
                  'NemoClaw support',
                  'Chat channels — Slack, Discord, Telegram, WhatsApp',
                  'Community support via Discord',
                ].map((t, i) => <li key={i}><Icon name="check" size={16} />{t}</li>)}
              </ul>
              <div className="rd-ed-cta">
                <Link href={GITHUB_LINK} className="rd-btn rd-btn--ghost" target="_blank" rel="noopener noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg>
                  Star on GitHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="rd-community" id="community">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Community</span>
            <h2>Built in the open, by people you can talk to.</h2>
            <p>kagent is a CNCF Sandbox project. Roadmap is public. PRs are welcome. The maintainers hang out in Discord and answer in hours, not days.</p>
          </div>
          <div className="rd-comm-grid">
            <div className="rd-comm-card rv">
              <div className="rd-c-icon"><Icon name="git" /></div>
              <div className="rd-stat">{ghStars}</div>
              <div className="rd-stat-l">GITHUB STARS</div>
              <h4>Open source</h4>
              <p>Apache 2.0. Public roadmap, public RFCs, public weekly community calls.</p>
              <Link className="rd-c-link" href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">github.com/kagent-dev →</Link>
            </div>
            <div className="rd-comm-card rv">
              <div className="rd-c-icon"><Icon name="discord" /></div>
              <div className="rd-stat">2,800+</div>
              <div className="rd-stat-l">DISCORD MEMBERS</div>
              <h4>Live community</h4>
              <p>Maintainers and operators sharing patterns, debugging clusters, shipping integrations together.</p>
              <Link className="rd-c-link" href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">Join Discord →</Link>
            </div>
            <div className="rd-comm-card rv">
              <div className="rd-c-icon"><Icon name="cube" /></div>
              <div className="rd-stat">{ghContributors}</div>
              <div className="rd-stat-l">CONTRIBUTORS</div>
              <h4>Real momentum</h4>
              <p>From individual operators to teams at hyperscalers. Weekly releases, monthly community demos.</p>
              <Link className="rd-c-link" href={`${GITHUB_LINK}/graphs/contributors`} target="_blank" rel="noopener noreferrer">See contributors →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="rd-cta-band">
        <div className="rd-container">
          <div className="rd-cta-card rv">
            <span className="rd-eyebrow" style={{ color: '#9DD9F8' }}>Ready in 5 minutes</span>
            <h2>Run your first agent on Kubernetes today.</h2>
            <p className="rd-lead">One Helm chart. One CRD. One namespace. You&apos;ll be looking at agent traces before your coffee gets cold.</p>
            <div className="rd-hero-ctas">
              <Link href="/docs/kagent/getting-started/quickstart" className="rd-btn rd-btn--purple">
                Install kagent
                <svg className="rd-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/docs/kagent" className="rd-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
