'use client';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";
import adopters from "@/data/adopters.yaml";

/* ============================================================
   Icon component — line icons, 1.7px stroke
   ============================================================ */
const Icon = ({ name, size = 20, ...rest }: { name: string; size?: number; [k: string]: unknown }) => {
  const paths: Record<string, React.ReactNode> = {
    sparkles: <><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4M22 5h-4"/></>,
    bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>,
    shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    workflow: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4M17 13V9a2 2 0 0 0-2-2h-4"/></>,
    eye: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></>,
    cube: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></>,
    plug: <><path d="M12 22v-5"/><path d="M9 8V2M15 8V2"/><path d="M18 8v5a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8z"/></>,
    activity: <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>,
    check: <path d="M20 6 9 17l-5-5"/>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    book: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></>,
    git: <><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1 .4-1 1v2"/><path d="M12 12v3"/></>,
    discord: <><path d="M8.12 6.15c1.26-.55 2.57-.9 3.88-1.01M15.88 6.15a14.43 14.43 0 0 0-3.88-1.01"/><path d="M6.6 17.23c1.2.92 2.57 1.59 4.01 1.95M17.4 17.23a11.77 11.77 0 0 1-4.01 1.95"/><path d="M8.56 14.24c-.7 0-1.26-.72-1.26-1.6s.57-1.6 1.26-1.6 1.26.72 1.26 1.6-.56 1.6-1.26 1.6M15.44 14.24c-.7 0-1.26-.72-1.26-1.6s.57-1.6 1.26-1.6 1.26.72 1.26 1.6-.56 1.6-1.26 1.6"/><path d="M19.13 5.09A17.5 17.5 0 0 0 14.78 4l-.52 1.08A16.22 16.22 0 0 0 12 4.96c-.76 0-1.52.04-2.26.12L9.22 4A17.5 17.5 0 0 0 4.87 5.09C2.1 9.28 1.37 13.36 1.73 17.39 3.43 18.67 5.06 19.46 6.66 20a.07.07 0 0 0 .08-.03l1.15-1.62a11.06 11.06 0 0 1-2.8-1.37c.24-.18.47-.37.68-.57 2.66 1.29 5.8 1.29 8.46 0 .22.2.45.4.68.57a11.06 11.06 0 0 1-2.8 1.37L13.26 20a.07.07 0 0 0 .07.03c1.6-.54 3.24-1.33 4.93-2.61.42-4.46-.72-8.5-2.97-12"/></>,
    brain: <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></>,
    handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14h2"/><path d="m3 4 2.71 2.71a5.8 5.8 0 0 0 4.79 1.67L12 8.2"/></>,
    layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></>,
    lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    cog: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    siren: <><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z"/><path d="M12 3v1M18.36 5.64l-.71.71M21 12h-1M6.35 6.35l-.71-.71M4 12H3"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    terminal: <><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></>,
    messageCircle: <><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></>,
    gitMerge: <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></>,
    fileText: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 13H8"/><path d="M16 17H8"/><path d="M16 13h-2"/></>,
    shrink: <><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2M9 15l-6 6"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></>,
    code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
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

    <rect x="20" y="20" width="480" height="380" rx="20" fill="none" stroke="var(--rd-border)" strokeDasharray="4 6" strokeWidth="1.5"/>
    <text x="36" y="44" fontFamily="monospace" fontSize="11" fill="var(--rd-fg-subtle)" letterSpacing="0.5">KUBERNETES CLUSTER</text>

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
          <rect x={a.x} y={160} width={120} height={56} rx={12} fill="var(--rd-card-bg)" stroke="var(--rd-accent)" strokeWidth="1.5"/>
          <circle cx={a.x + 18} cy={188} r={6} fill="var(--rd-accent)"/>
          <text x={a.x + 32} y={184} fontSize="12" fontWeight="500" fill="var(--rd-fg)">Agent</text>
          <text x={a.x + 32} y={199} fontFamily="monospace" fontSize="10" fill="var(--rd-fg-subtle)">{a.label}</text>
          <path d={`M ${a.x + 60} 160 Q ${a.x + 60} 138 260 116`} fill="none" stroke="var(--rd-border)" strokeWidth="1.2"/>
        </g>
      ))}
    </g>

    <g style={{ opacity: active >= 2 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="40" y="248" width="440" height="60" rx="12" fill="var(--rd-surface)" stroke="var(--rd-border)"/>
      <text x="56" y="270" fontFamily="monospace" fontSize="10" fill="var(--rd-fg-subtle)">MCP TOOL LAYER</text>
      {['kubectl', 'prom', 'argocd', 'github', 'pagerduty', 'docs'].map((t, i) => (
        <g key={i}>
          <rect x={56 + i * 70} y={278} width={60} height={22} rx={11} fill="var(--rd-card-bg)" stroke="var(--rd-border)"/>
          <text x={86 + i * 70} y={293} fontFamily="monospace" fontSize="10" fill="var(--rd-accent)" textAnchor="middle">{t}</text>
        </g>
      ))}
      <path d="M 110 216 L 110 248" stroke="var(--rd-border)" strokeWidth="1.2"/>
      <path d="M 260 216 L 260 248" stroke="var(--rd-border)" strokeWidth="1.2"/>
      <path d="M 410 216 L 410 248" stroke="var(--rd-border)" strokeWidth="1.2"/>
    </g>

    <g style={{ opacity: active >= 3 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="40" y="332" width="210" height="48" rx="10" fill="var(--rd-tint)" stroke="var(--rd-border)"/>
      <text x="56" y="350" fontFamily="monospace" fontSize="10" fill="var(--rd-accent)">OPENTELEMETRY</text>
      <text x="56" y="368" fontSize="13" fontWeight="500" fill="var(--rd-accent)">Traces · Metrics · Logs</text>
    </g>

    <g style={{ opacity: active >= 4 ? 1 : 0.2, transition: 'opacity 300ms' }}>
      <rect x="270" y="332" width="210" height="48" rx="10" fill="var(--rd-tint-strong)" stroke="var(--rd-border)"/>
      <text x="286" y="350" fontFamily="monospace" fontSize="10" fill="var(--rd-accent)">SERVICE MESH</text>
      <text x="286" y="368" fontSize="13" fontWeight="500" fill="var(--rd-accent)">Istio · Ambient · mTLS</text>
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
   Quick Start — tabbed terminal install block
   ============================================================ */
const INSTALL_TABS = [
  { label: 'One-liner', cmd: 'curl https://raw.githubusercontent.com/kagent-dev/kagent/refs/heads/main/scripts/get-kagent | bash' },
  { label: 'Brew', cmd: 'brew install kagent' },
];

const QuickStart = () => {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(INSTALL_TABS[tab].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [tab]);

  return (
    <div className="rd-quickstart">
      <div className="rd-qs-terminal">
        <div className="rd-qs-bar">
          <div className="rd-qs-dots"><i /><i /><i /></div>
          <div className="rd-qs-tabs">
            {INSTALL_TABS.map((t, i) => (
              <button
                key={i}
                className={`rd-qs-tab ${i === tab ? 'active' : ''}`}
                onClick={() => { setTab(i); setCopied(false); }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="rd-qs-copy" onClick={copy} aria-label="Copy command">
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
          </button>
        </div>
        <div className="rd-qs-body">
          <code>
            <span className="rd-qs-prompt">$</span> {INSTALL_TABS[tab].cmd}
          </code>
        </div>
      </div>

      <p className="rd-qs-requires">
        <strong>Requires:</strong>{' '}
        <a href="https://kind.sigs.k8s.io/docs/user/quick-start/" target="_blank" rel="noopener noreferrer">kind</a>,{' '}
        <a href="https://helm.sh/docs/intro/install/" target="_blank" rel="noopener noreferrer">Helm</a>, and{' '}
        <a href="https://kubernetes.io/docs/tasks/tools/" target="_blank" rel="noopener noreferrer">kubectl</a>
      </p>
    </div>
  );
};

/* ============================================================
   Main page
   ============================================================ */
export default function RedesignPage() {
  useReveal();


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
                Get Started
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

            {/* Quick Start terminal */}
            <QuickStart />
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
                  src="/images/kagent-agents-ui.gif"
                  alt="kagent Agents Dashboard"
                  width={1280}
                  height={900}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  priority
                  unoptimized
                />
              </div>

              <div className="rd-float-chip rd-float-l">
                <div className="rd-chip-icon" style={{ background: '#FEF0F0', padding: 2 }}>
                  <Image src="/images/openclaw-logo.png" alt="OpenClaw" width={28} height={28} style={{ borderRadius: 4 }} unoptimized />
                </div>
                <div>
                  <div className="rd-chip-label">Agent Harness</div>
                  <div className="rd-chip-sub">NemoClaw · OpenClaw · OpenShell</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-r">
                <div className="rd-chip-icon" style={{ background: '#F0F0F0', padding: 5 }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
                </div>
                <div>
                  <div className="rd-chip-label">Multi-LLM Providers</div>
                  <div className="rd-chip-sub">OpenAI · Anthropic · Gemini · xAI</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-b">
                <div className="rd-chip-icon" style={{ background: '#EEE8FF', padding: 5 }}>
                  <svg width="20" height="22" viewBox="0 0 24 26" fill="none"><path d="M1 12.1962L11.1456 2.05062C12.5465 0.649794 14.8176 0.649794 16.2184 2.05062C17.6193 3.45142 17.6193 5.72261 16.2184 7.12343L8.55637 14.7855" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/><path d="M8.66211 14.6798L16.2184 7.12343C17.6193 5.72261 19.8905 5.72261 21.2914 7.12343L21.3441 7.17626C22.745 8.57709 22.745 10.8483 21.3441 12.2491L12.1684 21.4249C11.7014 21.8918 11.7014 22.6489 12.1684 23.1158L14.0525 25" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/><path d="M13.6821 4.58701L6.17855 12.0905C4.77772 13.4913 4.77772 15.7625 6.17855 17.1634C7.57937 18.5641 9.85053 18.5641 11.2514 17.1634L18.7549 9.65982" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div className="rd-chip-label">MCP Tool Servers</div>
                  <div className="rd-chip-sub">OpenClaw · NemoClaw · kmcp</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-b2">
                <div className="rd-chip-icon" style={{ background: '#E8F0FE', padding: 2 }}>
                  <Image src="/images/kubernetes-logo.png" alt="Kubernetes" width={28} height={28} style={{ borderRadius: 4 }} unoptimized />
                </div>
                <div>
                  <div className="rd-chip-label">Agents as CRDs</div>
                  <div className="rd-chip-sub">GitOps · kubectl · RBAC</div>
                </div>
              </div>

              <div className="rd-float-chip rd-float-t">
                <div className="rd-chip-icon" style={{ background: '#F4EEFE', padding: 2 }}>
                  <Image src="/images/kagent-logo-mark.png" alt="kagent" width={28} height={28} style={{ borderRadius: 4 }} unoptimized />
                </div>
                <div>
                  <div className="rd-chip-label">BYO Frameworks</div>
                  <div className="rd-chip-sub">LangGraph · CrewAI · Google ADK</div>
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
              <p>Every feature works with a single <code className="text-sm px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">helm install</code>. No add-ons, no extra databases, no waiting for enterprise.</p>
            </div>
            <div className="rd-cap-grid">
              {[
                ['Agent lifecycle via CRDs', 'Define, version, and roll out agents with kubectl and GitOps — the same workflow as every other workload.'],
                ['Multi-runtime support', 'Go and Python ADK runtimes. Pick the language that fits, or mix both in the same cluster.'],
                ['BYO frameworks', 'LangGraph, CrewAI, Google ADK, or your own — bring any agent framework and kagent orchestrates it.'],
                ['Long-term memory', 'Persistent vector-backed memory across sessions. Agents remember context, not just the last prompt.'],
                ['Human-in-the-loop', 'Tool approval gates, agent-initiated questions, and cascading HITL — humans stay in control.'],
                ['Agent-to-Agent (A2A)', 'Agents discover and invoke each other. Compose multi-agent workflows with first-class delegation.'],
                ['Skills from Git', 'Load markdown knowledge from Git repos at startup. Agents learn your runbooks, not just generic docs.'],
                ['Prompt templates', 'Reusable prompt fragments from ConfigMaps. DRY your system prompts across agents.'],
                ['Context compaction', 'Auto-summarization of long histories. Agents stay coherent in extended conversations without blowing token budgets.'],
                ['Sandbox & security', 'Agent sandboxing, RBAC, and security hardening out of the box. Run untrusted code safely.'],
                ['Full observability', 'OTel tracing, Prometheus metrics, structured logs. See every prompt, every tool call, every token.'],
                ['Postgres storage', 'Production-grade Postgres-backed storage with reviewable migrations. No proprietary database lock-in.'],
              ].map(([title, desc], i) => (
                <div key={i} className="rd-cap-item rv">
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
                  { name: 'OpenAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" fillRule="evenodd"><path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"/></svg> },
                  { name: 'Anthropic', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#D97757"><path d="M17.304 3.541h-3.672l6.696 16.918H24zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.37 3.553h3.744L10.536 3.541zm-.371 10.223l2.291-5.946 2.292 5.946z"/></svg> },
                  { name: 'xAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" fillRule="evenodd"><path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815"/></svg> },
                  { name: 'Google Gemini', icon: <svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient gradientUnits="userSpaceOnUse" id="ga" x1="7" x2="11" y1="15.5" y2="12"><stop stopColor="#08B962"/><stop offset="1" stopColor="#08B962" stopOpacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gb" x1="8" x2="11.5" y1="5.5" y2="11"><stop stopColor="#F94543"/><stop offset="1" stopColor="#F94543" stopOpacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gc" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stopColor="#FABC12"/><stop offset=".46" stopColor="#FABC12" stopOpacity="0"/></linearGradient></defs><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#ga)"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gb)"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gc)"/></svg> },
                  { name: 'Azure OpenAI', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#0078D4"><path d="M22.379 23.343a1.62 1.62 0 0 0 1.536-2.14L17.35 1.76A1.62 1.62 0 0 0 15.816.657H8.184A1.62 1.62 0 0 0 6.65 1.76L.086 21.204a1.62 1.62 0 0 0 1.536 2.139h4.741a1.62 1.62 0 0 0 1.535-1.103l.977-2.892 4.947 3.675c.28.208.618.32.966.32m-3.084-12.531 3.624 10.739a.54.54 0 0 1-.51.713h-.03a.54.54 0 0 1-.322-.106l-9.287-6.9h4.853m6.313 7.006a1.6 1.6 0 0 0 .007-1.058L9.79 1.76a2 2 0 0 0-.007-.02h6.034a.54.54 0 0 1 .512.366l6.562 19.445a.54.54 0 0 1-.338.684"/></svg> },
                  { name: 'AWS Bedrock', icon: <svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="bedrock-g" x1="80%" x2="20%" y1="20%" y2="80%"><stop offset="0%" stopColor="#6350FB"/><stop offset="50%" stopColor="#3D8FFF"/><stop offset="100%" stopColor="#9AD8F8"/></linearGradient></defs><path d="M13.05 15.513h3.08c.214 0 .389.177.389.394v1.82a1.704 1.704 0 011.296 1.661c0 .943-.755 1.708-1.685 1.708-.931 0-1.686-.765-1.686-1.708 0-.807.554-1.484 1.297-1.662v-1.425h-2.69v4.663a.395.395 0 01-.188.338l-2.69 1.641a.385.385 0 01-.405-.002l-4.926-3.086a.395.395 0 01-.185-.336V16.3L2.196 14.87A.395.395 0 012 14.555L2 14.528V9.406c0-.14.073-.27.192-.34l2.465-1.462V4.448c0-.129.062-.249.165-.322l.021-.014L9.77 1.058a.385.385 0 01.407 0l2.69 1.675a.395.395 0 01.185.336V7.6h3.856V5.683a1.704 1.704 0 01-1.296-1.662c0-.943.755-1.708 1.685-1.708.931 0 1.685.765 1.685 1.708 0 .807-.553 1.484-1.296 1.662v2.311a.391.391 0 01-.389.394h-4.245v1.806h6.624a1.69 1.69 0 011.64-1.313c.93 0 1.685.764 1.685 1.707 0 .943-.754 1.708-1.685 1.708a1.69 1.69 0 01-1.64-1.314H13.05v1.937h4.953l.915 1.18a1.66 1.66 0 01.84-.227c.931 0 1.685.764 1.685 1.707 0 .943-.754 1.708-1.685 1.708-.93 0-1.685-.765-1.685-1.708 0-.346.102-.668.276-.937l-.724-.935H13.05v1.806zM9.973 1.856L7.93 3.122V6.09h-.778V3.604L5.435 4.669v2.945l2.11 1.36L9.712 7.61V5.334h.778V7.83c0 .136-.07.263-.184.335L7.963 9.638v2.081l1.422 1.009-.446.646-1.406-.998-1.53 1.005-.423-.66 1.605-1.055v-1.99L5.038 8.29l-2.26 1.34v1.676l1.972-1.189.398.677-2.37 1.429V14.3l2.166 1.258 2.27-1.368.397.677-2.176 1.311V19.3l1.876 1.175 2.365-1.426.398.678-2.017 1.216 1.918 1.201 2.298-1.403v-5.78l-4.758 2.893-.4-.675 5.158-3.136V3.289L9.972 1.856zM16.13 18.47a.913.913 0 00-.908.92c0 .507.406.918.908.918a.913.913 0 00.907-.919.913.913 0 00-.907-.92zm3.63-3.81a.913.913 0 00-.908.92c0 .508.406.92.907.92a.913.913 0 00.908-.92.913.913 0 00-.908-.92zm1.555-4.99a.913.913 0 00-.908.92c0 .507.407.918.908.918a.913.913 0 00.907-.919.913.913 0 00-.907-.92zM17.296 3.1a.913.913 0 00-.907.92c0 .508.406.92.907.92a.913.913 0 00.908-.92.913.913 0 00-.908-.92z" fill="url(#bedrock-g)" fillRule="nonzero"/></svg> },
                  { name: 'Vertex AI', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M11.995 20.216a1.892 1.892 0 100 3.785 1.892 1.892 0 000-3.785zm0 2.806a.927.927 0 11.927-.914.914.914 0 01-.927.914z" fill="#4285F4"/><path clipRule="evenodd" d="M21.687 14.144c.237.038.452.16.605.344a.978.978 0 01-.18 1.3l-8.24 6.082a1.892 1.892 0 00-1.147-1.508l8.28-6.08a.991.991 0 01.682-.138z" fill="#669DF6" fillRule="evenodd"/><path clipRule="evenodd" d="M10.122 21.842l-8.217-6.066a.952.952 0 01-.206-1.287.978.978 0 011.287-.206l8.28 6.08a1.893 1.893 0 00-1.144 1.479z" fill="#AECBFA" fillRule="evenodd"/><path d="M4.273 4.475a.978.978 0 01-.965-.965V1.09a.978.978 0 111.943 0v2.42a.978.978 0 01-.978.965zM4.247 13.034a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 10.19a.978.978 0 100-1.956.978.978 0 000 1.956zM4.247 7.332a.978.978 0 100-1.956.978.978 0 000 1.956z" fill="#AECBFA"/><path d="M19.718 7.307a.978.978 0 01-.965-.979v-2.42a.965.965 0 011.93 0v2.42a.964.964 0 01-.965.979zM19.743 13.047a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 10.151a.978.978 0 100-1.956.978.978 0 000 1.956zM19.743 2.068a.978.978 0 100-1.956.978.978 0 000 1.956z" fill="#4285F4"/><path d="M11.995 15.917a.978.978 0 01-.965-.965v-2.459a.978.978 0 011.943 0v2.433a.976.976 0 01-.978.991zM11.995 18.762a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 10.64a.978.978 0 100-1.956.978.978 0 000 1.956zM11.995 7.783a.978.978 0 100-1.956.978.978 0 000 1.956z" fill="#669DF6"/><path d="M15.856 10.177a.978.978 0 01-.965-.965v-2.42a.977.977 0 011.702-.763.979.979 0 01.241.763v2.42a.978.978 0 01-.978.965zM15.869 4.913a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM15.869 12.996a.978.978 0 100-1.956.978.978 0 000 1.956z" fill="#4285F4"/><path d="M8.121 15.853a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 7.783a.978.978 0 100-1.956.978.978 0 000 1.956zM8.121 4.913a.978.978 0 100-1.957.978.978 0 000 1.957zM8.134 12.996a.978.978 0 01-.978-.94V9.611a.965.965 0 011.93 0v2.445a.966.966 0 01-.952.94z" fill="#AECBFA"/></svg> },
                  { name: 'Ollama', icon: <svg viewBox="0 0 17 25" width="16" height="22" fill="black"><path fillRule="evenodd" clipRule="evenodd" d="M4.405.102C4.621.199 4.816.358 4.993.568c.295.347.544.845.734 1.435.191.593.315 1.25.362 1.909a4.8 4.8 0 0 1 2.049-.723l.051-.005a3.8 3.8 0 0 1 2.48.539c.101.06.2.125.297.193.05-.647.172-1.289.36-1.868.19-.591.439-1.087.733-1.436.164-.202.365-.361.589-.466.257-.114.53-.134.796-.048.401.13.745.418 1.016.837.248.383.434.874.561 1.463.23 1.061.27 2.458.115 4.142l.053.045.026.022c.757.654 1.284 1.587 1.563 2.67.435 1.69.216 3.585-.534 4.646l-.018.023.002.004c.417.866.67 1.78.724 2.727l.002.034c.064 1.21-.2 2.428-.814 3.625l-.007.011.01.028a10.2 10.2 0 0 1 .438 3.961l-.006.044a.53.53 0 0 1-.263.48.47.47 0 0 1-.484-.029.5.5 0 0 1-.238-.195.55.55 0 0 1-.106-.261.6.6 0 0 1-.01-.287c.167-1.174.01-2.351-.48-3.549a.6.6 0 0 1-.06-.356.6.6 0 0 1 .1-.345l.003-.007c.605-1.05.855-2.08.801-3.091-.046-.885-.325-1.755-.8-2.583a.55.55 0 0 1-.092-.545.47.47 0 0 1 .272-.393l.009-.007c.243-.18.467-.642.58-1.272a5.3 5.3 0 0 0-.095-2.243c-.205-.796-.58-1.459-1.105-1.913-.595-.516-1.383-.765-2.38-.693a.46.46 0 0 1-.373-.1.5.5 0 0 1-.26-.321c-.313-.756-.771-1.297-1.342-1.632a2.6 2.6 0 0 0-1.772-.377c-1.245.112-2.343.91-2.67 1.916a.5.5 0 0 1-.239.35.44.44 0 0 1-.371.133c-1.067.002-1.893.286-2.497.799-.522.443-.878 1.062-1.066 1.804a5.3 5.3 0 0 0-.068 2.143c.112.634.33 1.16.581 1.442l.008.008a.54.54 0 0 1 .109.892c-.36.707-.629 1.76-.673 2.773-.05 1.157.186 2.161.719 2.882l.016.021a.56.56 0 0 1 .095.377.56.56 0 0 1-.054.408c-.576 1.404-.753 2.559-.564 3.468a.55.55 0 0 1-.09.549.46.46 0 0 1-.4.223.44.44 0 0 1-.485-.086.55.55 0 0 1-.295-.446C.165 23.248.33 21.923.881 20.43l.014-.04-.008-.014a6 6 0 0 1-.598-1.487l-.005-.022a6.7 6.7 0 0 1-.177-2.028c.044-1.034.278-2.093.622-2.943l.012-.03-.002-.002c-.293-.475-.51-1.083-.63-1.756l-.005-.027A6.5 6.5 0 0 1 .197 9.252c.262-1.04.777-1.933 1.536-2.578.06-.051.123-.102.186-.15C1.76 4.827 1.8 3.421 2.031 2.353 2.158 1.765 2.345 1.274 2.593.89c.27-.418.614-.707 1.015-.837.266-.086.54-.066.797.049M8.521 10.432c.936 0 1.8.355 2.446.971.63.599 1.005 1.404 1.005 2.205 0 1.009-.406 1.795-1.133 2.297-.62.426-1.451.633-2.403.633-.837 0-1.775-.132-2.397-.672a3.01 3.01 0 0 1-.963-1.716v-.372c0-.804.398-1.61 1.056-2.212.668-.61 1.55-.964 2.485-.964zm0 1.018a2.5 2.5 0 0 0-1.916.739c-.461.42-.722.949-.722 1.42 0 .486.21.942.61 1.288.455.394 1.124.623 1.943.623.799 0 1.473-.167 1.932-.484.463-.318.7-.78.7-1.43 0-.48-.246-1.011-.683-1.427a2.4 2.4 0 0 0-1.864-.73zM9.183 12.825l.004.004a.44.44 0 0 1-.056.557l-.292.261v.507a.47.47 0 0 1-.112.3.38.38 0 0 1-.265.124.38.38 0 0 1-.265-.124.47.47 0 0 1-.112-.3v-.523l-.271-.248a.44.44 0 0 1-.072-.557.35.35 0 0 1 .312-.144.35.35 0 0 1 .258.086l.215.196.22-.198a.35.35 0 0 1 .255-.084.35.35 0 0 1 .235.143zM4.143 10.644c.478 0 .867.443.867.99a.99.99 0 0 1-.254.7.77.77 0 0 1-.614.29.77.77 0 0 1-.613-.291.99.99 0 0 1-.254-.699c0-.262.091-.513.253-.7a.77.77 0 0 1 .615-.29zm8.706 0c.48 0 .868.443.868.99a.99.99 0 0 1-.254.7.77.77 0 0 1-.614.29.77.77 0 0 1-.613-.291.99.99 0 0 1-.254-.699c0-.262.091-.513.253-.7a.77.77 0 0 1 .614-.29zM3.94 1.477l-.003.002a.54.54 0 0 0-.288.271l-.005.007c-.138.215-.258.531-.348.946-.17.786-.216 1.853-.124 3.161.43-.145.899-.236 1.404-.27l.01-.001.019-.039c.046-.093.095-.183.148-.271.123-.876.022-1.923-.253-2.778-.134-.414-.297-.739-.453-.924a.7.7 0 0 0-.107-.103zm9.174.046-.002.001a.7.7 0 0 0-.107.102c-.156.186-.32.511-.453.926-.29.902-.387 2.018-.23 2.923l.058.11.008.016h.03c.496 0 .99.081 1.466.241.086-1.277.034-2.322-.132-3.093-.09-.415-.21-.731-.349-.946l-.004-.007a.54.54 0 0 0-.285-.273z"/></svg> },
                  { name: 'Hugging Face', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M2.25 11.535c0-3.407 1.847-6.554 4.844-8.258a9.822 9.822 0 019.687 0c2.997 1.704 4.844 4.851 4.844 8.258 0 5.266-4.337 9.535-9.687 9.535S2.25 16.8 2.25 11.535z" fill="#FF9D0B"/><path d="M11.938 20.086c4.797 0 8.687-3.829 8.687-8.551 0-4.722-3.89-8.55-8.687-8.55-4.798 0-8.688 3.828-8.688 8.55 0 4.722 3.89 8.55 8.688 8.55z" fill="#FFD21E"/><path d="M11.875 15.113c2.457 0 3.25-2.156 3.25-3.263 0-.576-.393-.394-1.023-.089-.582.283-1.365.675-2.224.675-1.798 0-3.25-1.693-3.25-.586 0 1.107.79 3.263 3.25 3.263h-.003z" fill="#FF323D"/><path d="M14.76 9.21c.32.108.445.753.767.585.447-.233.707-.708.659-1.204a1.235 1.235 0 00-.879-1.059 1.262 1.262 0 00-1.33.394c-.322.384-.377.92-.14 1.36.153.283.638-.177.925-.079l-.002.003zm-5.887 0c-.32.108-.448.753-.768.585a1.226 1.226 0 01-.658-1.204c.048-.495.395-.913.878-1.059a1.262 1.262 0 011.33.394c.322.384.377.92.14 1.36-.152.283-.64-.177-.925-.079l.003.003zm1.12 5.34a2.166 2.166 0 011.325-1.106c.07-.02.144.06.219.171l.192.306c.069.1.139.175.209.175.074 0 .15-.074.223-.172l.205-.302c.08-.11.157-.188.234-.165.537.168.986.536 1.25 1.026.932-.724 1.275-1.905 1.275-2.633 0-.508-.306-.426-.81-.19l-.616.296c-.52.24-1.148.48-1.824.48-.676 0-1.302-.24-1.823-.48l-.589-.283c-.52-.248-.838-.342-.838.177 0 .703.32 1.831 1.187 2.56l.18.14z" fill="#3A3B45"/><path d="M17.812 10.366a.806.806 0 00.813-.8c0-.441-.364-.8-.813-.8a.806.806 0 00-.812.8c0 .442.364.8.812.8zm-11.624 0a.806.806 0 00.812-.8c0-.441-.364-.8-.812-.8a.806.806 0 00-.813.8c0 .442.364.8.813.8zM4.515 13.073c-.405 0-.765.162-1.017.46a1.455 1.455 0 00-.333.925 1.801 1.801 0 00-.485-.074c-.387 0-.737.146-.985.409a1.41 1.41 0 00-.2 1.722 1.302 1.302 0 00-.447.694c-.06.222-.12.69.2 1.166a1.267 1.267 0 00-.093 1.236c.238.533.81.958 1.89 1.405l.24.096c.768.3 1.473.492 1.478.494.89.243 1.808.375 2.732.394 1.465 0 2.513-.443 3.115-1.314.93-1.342.842-2.575-.274-3.763l-.151-.154c-.692-.684-1.155-1.69-1.25-1.912-.195-.655-.71-1.383-1.562-1.383-.46.007-.889.233-1.15.605-.25-.31-.495-.553-.715-.694a1.87 1.87 0 00-.993-.312zm14.97 0c.405 0 .767.162 1.017.46.216.262.333.588.333.925.158-.047.322-.071.487-.074.388 0 .738.146.985.409a1.41 1.41 0 01.2 1.722c.22.178.377.422.445.694.06.222.12.69-.2 1.166.244.37.279.836.093 1.236-.238.533-.81.958-1.889 1.405l-.239.096c-.77.3-1.475.492-1.48.494-.89.243-1.808.375-2.732.394-1.465 0-2.513-.443-3.115-1.314-.93-1.342-.842-2.575.274-3.763l.151-.154c.695-.684 1.157-1.69 1.252-1.912.195-.655.708-1.383 1.56-1.383.46.007.889.233 1.15.605.25-.31.495-.553.718-.694.244-.162.523-.265.814-.3l.176-.012z" fill="#FF9D0B"/><path d="M9.785 20.132c.688-.994.638-1.74-.305-2.667-.945-.928-1.495-2.288-1.495-2.288s-.205-.788-.672-.714c-.468.074-.81 1.25.17 1.971.977.721-.195 1.21-.573.534-.375-.677-1.405-2.416-1.94-2.751-.532-.332-.907-.148-.782.541.125.687 2.357 2.35 2.14 2.707-.218.362-.983-.42-.983-.42S2.953 14.9 2.43 15.46c-.52.558.398 1.026 1.7 1.803 1.308.778 1.41.985 1.225 1.28-.187.295-3.07-2.1-3.34-1.083-.27 1.011 2.943 1.304 2.745 2.006-.2.7-2.265-1.324-2.685-.537-.425.79 2.913 1.718 2.94 1.725 1.075.276 3.813.859 4.77-.522zm4.432 0c-.687-.994-.64-1.74.305-2.667.943-.928 1.493-2.288 1.493-2.288s.205-.788.675-.714c.465.074.807 1.25-.17 1.971-.98.721.195 1.21.57.534.377-.677 1.407-2.416 1.94-2.751.532-.332.91-.148.782.541-.125.687-2.355 2.35-2.137 2.707.215.362.98-.42.98-.42S21.05 14.9 21.57 15.46c.52.558-.395 1.026-1.7 1.803-1.308.778-1.408.985-1.225 1.28.187.295 3.07-2.1 3.34-1.083.27 1.011-2.94 1.304-2.743 2.006.2.7 2.263-1.324 2.685-.537.423.79-2.912 1.718-2.94 1.725-1.077.276-3.815.859-4.77-.522z" fill="#FFD21E"/></svg> },
                ]},
                { label: 'Agents & Frameworks', speed: 'medium', reverse: true, items: [
                  { name: 'LangGraph', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path clipRule="evenodd" d="M6.099 6H17.9C21.264 6 24 8.692 24 12s-2.736 6-6.099 6H6.1C2.736 18 0 15.308 0 12s2.736-6 6.099-6zm5.419 9.3c.148.154.367.146.561.106l.002.001c.09-.072-.038-.163-.16-.25-.074-.052-.145-.102-.166-.147.068-.08-.133-.265-.289-.408a1.52 1.52 0 01-.15-.148c-.11-.119-.155-.268-.2-.418-.03-.1-.06-.2-.11-.292-.304-.694-.653-1.383-1.143-1.97-.315-.39-.674-.74-1.033-1.09a19.384 19.384 0 01-.683-.688c-.226-.229-.362-.511-.499-.794-.114-.236-.228-.473-.396-.68-.507-.735-2.107-.936-2.342.104 0 .032-.01.052-.039.073-.13.094-.245.2-.342.327-.238.326-.274.877.022 1.17l.001-.019c.01-.147.02-.286.139-.391.228.193.576.262.841.117.32.45.422.995.525 1.54.085.456.17.912.382 1.316l.014.022c.124.203.25.41.41.587.059.089.178.184.297.279.157.125.314.25.329.359v.143c-.001.285-.002.58.184.813.103.205-.15.41-.352.385-.112.015-.233-.014-.354-.042-.165-.04-.329-.078-.462-.003-.038.04-.091.04-.145.042-.064.002-.129.004-.167.07-.008.019-.026.04-.045.063-.042.05-.087.105-.033.146l.015-.01c.082-.062.16-.12.27-.084-.014.08.039.102.092.123l.027.012a.344.344 0 01-.008.056c-.009.045-.017.088.018.127a.598.598 0 00.046-.054c.037-.046.073-.092.139-.11.144.19.289.111.471.013.206-.111.459-.248.81-.055-.135-.006-.255.01-.345.12-.023.024-.042.052-.002.084.207-.132.294-.085.375-.04.06.032.115.063.212.024l.07-.036c.155-.083.314-.166.499-.137-.139.039-.188.125-.242.218-.026.047-.054.095-.094.14-.021.021-.03.046-.007.08.29-.023.4-.095.548-.192.07-.046.15-.099.261-.154.124-.075.248-.027.368.02.13.05.255.098.371-.014.037-.033.083-.034.129-.034.016 0 .033 0 .05-.002-.037-.19-.24-.188-.448-.186-.24.003-.483.006-.475-.289.222-.149.224-.407.226-.651 0-.06 0-.117.005-.173.163.09.336.16.508.229.162.065.323.13.474.21.158.25.404.58.732.558.008-.026.016-.047.026-.073.019.004.039.008.059.014.086.02.178.044.223-.056zm6.429-2.829c.19.186.447.29.716.29.269 0 .526-.104.716-.29a.98.98 0 00.297-.7.98.98 0 00-.297-.7 1.024 1.024 0 00-1.08-.224l-.58-.831-.405.272.583.835a.978.978 0 00.05 1.348zm-1.817-2.69a1.03 1.03 0 001.056-.095.991.991 0 00.363-.507.97.97 0 00-.016-.62.994.994 0 00-.39-.488 1.028 1.028 0 00-1.298.14.987.987 0 00-.263.856.98.98 0 00.187.42c.095.125.218.225.36.294zm0 5.752a1.032 1.032 0 001.056-.095.991.991 0 00.363-.507.97.97 0 00-.016-.62.994.994 0 00-.39-.488 1.027 1.027 0 00-1.298.14.986.986 0 00-.263.856.98.98 0 00.187.42c.095.125.218.225.36.294zm.93-3.516v-.492h-1.55a.977.977 0 00-.217-.404l.584-.847-.425-.276-.583.847a1.023 1.023 0 00-1.047.23.973.973 0 00-.296.696c0 .261.107.512.296.696a1.023 1.023 0 001.047.23l.583.847.42-.276-.579-.847a.977.977 0 00.217-.404h1.55z" fill="#1C3C3C" fillRule="evenodd"/></svg> },
                  { name: 'CrewAI', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19.41 10.783a2.753 2.753 0 012.471 1.355c.483.806.622 1.772.385 2.68l-.136.522a9.994 9.994 0 01-3.156 5.058c-.605.517-1.283 1.062-2.083 1.524l-.028.017c-.402.232-.884.511-1.398.756-1.19.602-2.475.997-3.798 1.167-.854.111-1.716.155-2.577.132H9.072a8.588 8.588 0 01-5.046-1.87l-.012-.01-.012-.01A8.024 8.024 0 011.22 17.42a10.916 10.916 0 01-.102-3.779A15.622 15.622 0 012.88 8.4a21.758 21.758 0 012.432-3.678 15.44 15.44 0 013.56-3.182A9.958 9.958 0 0112.44.104h.004l.003-.002c2.057-.384 3.743.374 5.024 1.26a8.28 8.28 0 012.395 2.513l.024.04.023.042a5.474 5.474 0 01.508 4.012c-.239.97-.577 1.914-1.01 2.814z" fill="#461816"/><path d="M18.861 13.165a.748.748 0 011.256.031c.199.332.256.73.159 1.103l-.137.522a7.936 7.936 0 01-2.504 4.014c-.572.49-1.138.939-1.774 1.306-.427.247-.857.496-1.303.707a9.628 9.628 0 01-3.155.973 14.33 14.33 0 01-2.257.116 6.531 6.531 0 01-3.837-1.422 5.967 5.967 0 01-2.071-3.494 8.859 8.859 0 01-.085-3.08 13.56 13.56 0 011.54-4.568 19.701 19.701 0 012.212-3.348 13.382 13.382 0 013.088-2.76 7.9 7.9 0 012.832-1.14c1.307-.245 2.434.207 3.481.933a6.222 6.222 0 011.806 1.892c.423.767.536 1.668.314 2.515a12.394 12.394 0 01-.99 2.67l-.223.497c-.321.713-.642 1.426-.97 2.137a.762.762 0 01-.97.467 3.39 3.39 0 01-2.283-2.49c-.095-.83.04-1.669.39-2.426.288-.746.61-1.477.933-2.208l.248-.563a.53.53 0 00-.204-.742 2.35 2.35 0 00-1.2.702 25.291 25.291 0 00-1.614 1.767 21.561 21.561 0 00-2.619 4.184 7.59 7.59 0 00-.816 2.753 7.042 7.042 0 00.07 2.219 2.055 2.055 0 001.934 1.715c1.801.1 3.59-.363 5.116-1.328.582-.4 1.141-.831 1.675-1.294.752-.71 1.376-1.519 1.958-2.36z" fill="#fff"/></svg> },
                  { name: 'Google ADK', icon: <svg viewBox="0 0 28 28" width="20" height="20"><path d="M14 0C14 7.73 7.73 14 0 14c7.73 0 14 6.27 14 14 0-7.73 6.27-14 14-14-7.73 0-14-6.27-14-14z" fill="#4285F4"/></svg> },
                  { name: 'OpenClaw', icon: <svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient gradientUnits="userSpaceOnUse" id="oca" x1="-.659" x2="27.023" y1=".458" y2="22.855"><stop stopColor="#FF4D4D"/><stop offset="1" stopColor="#991B1B"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="ocb" x1="0" x2="4.311" y1="9.672" y2="14.949"><stop stopColor="#FF4D4D"/><stop offset="1" stopColor="#991B1B"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="occ" x1="19.385" x2="24.399" y1="9.953" y2="14.462"><stop stopColor="#FF4D4D"/><stop offset="1" stopColor="#991B1B"/></linearGradient></defs><path d="M12 2.568c-6.33 0-9.495 5.275-9.495 9.495 0 4.22 3.165 8.44 6.33 9.494v2.11h2.11v-2.11s1.055.422 2.11 0v2.11h2.11v-2.11c3.165-1.055 6.33-5.274 6.33-9.494S18.33 2.568 12 2.568z" fill="url(#oca)"/><path d="M3.56 9.953C.396 8.898-.66 11.008.396 13.118c1.055 2.11 3.164 1.055 4.22-1.055.632-1.477 0-2.11-1.056-2.11z" fill="url(#ocb)"/><path d="M20.44 9.953c3.164-1.055 4.22 1.055 3.164 3.165-1.055 2.11-3.164 1.055-4.22-1.055-.632-1.477 0-2.11 1.056-2.11z" fill="url(#occ)"/><path d="M5.507 1.875c.476-.285 1.036-.233 1.615.037.577.27 1.223.774 1.937 1.488a.316.316 0 01-.447.447c-.693-.693-1.279-1.138-1.757-1.361-.475-.222-.795-.205-1.022-.069a.317.317 0 01-.326-.542zM16.877 1.913c.58-.27 1.14-.323 1.616-.038a.317.317 0 01-.326.542c-.227-.136-.547-.153-1.022.069-.478.223-1.064.668-1.756 1.361a.316.316 0 11-.448-.447c.714-.714 1.36-1.218 1.936-1.487z" fill="#FF4D4D"/><path d="M8.835 9.109a1.266 1.266 0 100-2.532 1.266 1.266 0 000 2.532zM15.165 9.109a1.266 1.266 0 100-2.532 1.266 1.266 0 000 2.532z" fill="#050810"/><path d="M9.046 8.16a.527.527 0 100-1.056.527.527 0 000 1.055zM15.376 8.16a.527.527 0 100-1.055.527.527 0 000 1.054z" fill="#00E5CC"/></svg> },
                  { name: 'NemoClaw', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M10.212 8.976V7.62c.127-.01.256-.017.388-.021 3.596-.117 5.957 3.184 5.957 3.184s-2.548 3.647-5.282 3.647a3.227 3.227 0 01-1.063-.175v-4.109c1.4.174 1.681.812 2.523 2.258l1.873-1.627a4.905 4.905 0 00-3.67-1.846 6.594 6.594 0 00-.729.044m0-4.476v2.025c.13-.01.259-.019.388-.024 5.002-.174 8.261 4.226 8.261 4.226s-3.743 4.69-7.643 4.69c-.338 0-.675-.031-1.007-.092v1.25c.278.038.558.057.838.057 3.629 0 6.253-1.91 8.794-4.169.421.347 2.146 1.193 2.501 1.564-2.416 2.083-8.048 3.763-11.24 3.763-.308 0-.603-.02-.894-.048V19.5H24v-15H10.21zm0 9.756v1.068c-3.356-.616-4.287-4.21-4.287-4.21a7.173 7.173 0 014.287-2.138v1.172h-.005a3.182 3.182 0 00-2.502 1.178s.615 2.276 2.507 2.931m-5.961-3.3c1.436-1.935 3.604-3.148 5.961-3.336V6.523C5.81 6.887 2 10.723 2 10.723s2.158 6.427 8.21 7.015v-1.166C5.77 16 4.25 10.958 4.25 10.958h-.002z" fill="#74B71B" fillRule="nonzero"/></svg> },
                  { name: 'OpenShell', icon: <svg viewBox="0 0 24 24" width="20" height="20"><rect x="2" y="3" width="20" height="18" rx="2" fill="#1a1a2e"/><path d="M6 8l4 4-4 4" stroke="#76B900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 16h6" stroke="#76B900" strokeWidth="2" strokeLinecap="round"/></svg> },
                  { name: 'Hermes Agent', icon: <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="#F5C542"/><text x="12" y="16.5" textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="sans-serif" fill="#fff">H</text></svg> },
                  { name: 'MCP', icon: <svg viewBox="0 0 180 180" width="20" height="20"><path d="M18 84.85L85.88 16.97C95.25 7.6 110.45 7.6 119.82 16.97C129.2 26.34 129.2 41.54 119.82 50.91L68.56 102.18" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M69.27 101.47L119.82 50.91C129.2 41.54 144.39 41.54 153.77 50.91L154.12 51.27C163.49 60.64 163.49 75.83 154.12 85.21L92.72 146.6C89.6 149.72 89.6 154.79 92.72 157.91L105.33 170.52" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/><path d="M102.85 33.94L52.65 84.15C43.28 93.52 43.28 108.71 52.65 118.09C62.02 127.46 77.22 127.46 86.59 118.09L136.79 67.88" stroke="#8A3FFC" strokeWidth="14" strokeLinecap="round" fill="none"/></svg> },
                  { name: 'A2A', icon: <svg viewBox="0 0 860 860" width="20" height="20" fill="black"><circle cx="544" cy="307" r="27"/><circle cx="154" cy="307" r="27"/><circle cx="706" cy="307" r="27"/><circle cx="316" cy="307" r="27"/><path d="M336.5 191.003H162C97.6588 191.003 45.5 243.162 45.5 307.503C45.5 371.844 97.6442 424.003 161.985 424.003C206.551 424.003 256.288 424.003 296.5 424.003C487.5 424.003 374 191.005 569 191.001C613.886 191 658.966 191 698.025 191C762.366 191.001 814.5 243.16 814.5 307.501C814.5 371.843 762.34 424.003 697.998 424.003H523.5" fill="none" stroke="black" strokeWidth="48" strokeLinecap="round"/><path d="M256 510.002C270.359 510.002 282 521.643 282 536.002C282 550.361 270.359 562.002 256 562.002H148C133.641 562.002 122 550.361 122 536.002C122 521.643 133.641 510.002 148 510.002H256ZM712 510.002C726.359 510.002 738 521.643 738 536.002C738 550.361 726.359 562.002 712 562.002H360C345.641 562.002 334 550.361 334 536.002C334 521.643 345.641 510.002 360 510.002H712Z"/><path d="M444 628.002C458.359 628.002 470 639.643 470 654.002C470 668.361 458.359 680.002 444 680.002H100C85.6406 680.002 74 668.361 74 654.002C74 639.643 85.6406 628.002 100 628.002H444ZM548 628.002C562.359 628.002 574 639.643 574 654.002C574 668.361 562.359 680.002 548 680.002C533.641 680.002 522 668.361 522 654.002C522 639.643 533.641 628.002 548 628.002ZM760 628.002C774.359 628.002 786 639.643 786 654.002C786 668.361 774.359 680.002 760 680.002H652C637.641 680.002 626 668.361 626 654.002C626 639.643 637.641 628.002 652 628.002H760Z"/></svg> },
                  { name: 'Python', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M11.9 2c-1 0-1.9.1-2.7.3C6.8 2.9 6.3 4 6.3 5.5v1.8h5.6v.6H5.3c-1.7 0-3.2 1-3.6 2.9-.5 2.2-.5 3.6 0 5.9.4 1.7 1.3 2.9 3 2.9h1.9v-2.6c0-1.9 1.6-3.5 3.5-3.5h5.6c1.6 0 2.9-1.3 2.9-2.9V5.5c0-1.5-1.3-2.7-2.9-3.1-.9-.3-1.8-.4-2.8-.4zM8.8 4.1c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z" fill="#3776AB"/><path d="M18.4 7.9v2.5c0 2-1.7 3.6-3.5 3.6h-5.6c-1.6 0-2.9 1.3-2.9 2.9v5.4c0 1.5 1.3 2.4 2.9 2.9 1.9.5 3.7.6 5.6 0 1.3-.4 2.9-1.2 2.9-2.9v-2.2h-5.6v-.7h8.5c1.7 0 2.3-1.2 2.9-2.9.6-1.8.6-3.5 0-5.9-.4-1.7-1.2-2.9-2.9-2.9h-2.3zm-3.2 11.3c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1z" fill="#FFD43B"/></svg> },
                  { name: 'Go', icon: <svg viewBox="0 0 24 24" width="20" height="20"><ellipse cx="12" cy="13" rx="7.5" ry="9.5" fill="#67D7E0"/><ellipse cx="7.5" cy="4.5" rx="1.8" ry="2.2" fill="#67D7E0"/><ellipse cx="7.5" cy="4.5" rx="1" ry="1.4" fill="#C8B49B"/><ellipse cx="16.5" cy="4.5" rx="1.8" ry="2.2" fill="#67D7E0"/><ellipse cx="16.5" cy="4.5" rx="1" ry="1.4" fill="#C8B49B"/><ellipse cx="9.2" cy="8.5" rx="2.5" ry="2.8" fill="#fff"/><ellipse cx="14.8" cy="8.5" rx="2.5" ry="2.8" fill="#fff"/><circle cx="9.8" cy="8.3" r="1.1" fill="#1A1A1A"/><circle cx="14.2" cy="8.3" r="1.1" fill="#1A1A1A"/><ellipse cx="12" cy="10.5" rx="0.6" ry="0.4" fill="#C8B49B"/><rect x="10.8" y="12" width="1.1" height="1.5" rx="0.3" fill="#fff" stroke="#DADADA" strokeWidth="0.2"/><rect x="12.1" y="12" width="1.1" height="1.5" rx="0.3" fill="#fff" stroke="#DADADA" strokeWidth="0.2"/><ellipse cx="5" cy="14" rx="1.2" ry="2.5" transform="rotate(-15 5 14)" fill="#67D7E0"/><ellipse cx="19" cy="14" rx="1.2" ry="2.5" transform="rotate(15 19 14)" fill="#67D7E0"/><ellipse cx="9.5" cy="22" rx="1.5" ry="0.8" fill="#C8B49B"/><ellipse cx="14.5" cy="22" rx="1.5" ry="0.8" fill="#C8B49B"/></svg> },
                ]},
                { label: 'Dev Tools & Channels', speed: 'fast', items: [
                  { name: 'Claude Code', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fillRule="nonzero"/></svg> },
                  { name: 'Cursor', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M11.925.131L.882 5.392a.84.84 0 0 0-.462.749v11.718a.84.84 0 0 0 .462.749l11.043 5.261a.84.84 0 0 0 .724 0l11.043-5.261a.84.84 0 0 0 .462-.749V6.141a.84.84 0 0 0-.462-.749L12.649.131a.84.84 0 0 0-.724 0m.356 2.673l9.622 16.663a.28.28 0 0 1-.243.418H2.34a.28.28 0 0 1-.243-.418L11.72 2.804a.28.28 0 0 1 .486 0z"/></svg> },
                  { name: 'OpenCode', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" fillRule="evenodd"><path d="M16 6H8v12h8V6zm4 16H4V2h16v20z"/></svg> },
                  { name: 'GitHub', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#24292F"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z"/></svg> },
                  { name: 'Slack', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5.04 15.16a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h2.1v2.1zm1.07 0a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.26a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-5.26z" fill="#E01E5A"/><path d="M8.21 5.04a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v2.1H8.21zm0 1.07a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1H2.94a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27z" fill="#36C5F0"/><path d="M18.96 8.21a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-2.1V8.21zm-1.07 0a2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1V2.94a2.1 2.1 0 0 1 2.1-2.1 2.1 2.1 0 0 1 2.1 2.1v5.27z" fill="#2EB67D"/><path d="M15.79 18.96a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1 2.1 2.1 0 0 1-2.1-2.1v-2.1h2.1zm0-1.07a2.1 2.1 0 0 1-2.1-2.1 2.1 2.1 0 0 1 2.1-2.1h5.27a2.1 2.1 0 0 1 2.1 2.1 2.1 2.1 0 0 1-2.1 2.1h-5.27z" fill="#ECB22E"/></svg> },
                  { name: 'Discord', icon: <svg viewBox="0 0 127.14 96.36" width="20" height="20" fill="#5865F2"><path d="M107.7 8.07A105.15 105.15 0 0081.47 0a72.06 72.06 0 00-3.36 6.83 97.68 97.68 0 00-29.11 0A72.37 72.37 0 0045.64 0a105.89 105.89 0 00-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.71 105.71 0 0032.17 16.15 77.7 77.7 0 006.89-11.11 68.42 68.42 0 01-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0064.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 01-10.87 5.19 77.22 77.22 0 006.89 11.1 105.25 105.25 0 0032.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.45-12.68S53.97 46.1 53.9 53.05c0 6.95-5.12 12.64-11.45 12.64zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68S96.23 46.1 96.14 53.05c0 6.95-5.11 12.64-11.45 12.64z"/></svg> },
                  { name: 'Telegram', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="#0088CC"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg> },
                ]},
                { label: 'Infrastructure', speed: 'medium', reverse: true, items: [
                  { name: 'Kubernetes', icon: <svg viewBox="0 0 128 128" width="20" height="20"><g fill="#486bb3"><path d="M56.484 55.098c.37.27.82.43 1.31.43 1.2 0 2.18-.95 2.23-2.13l.05-.03.75-13.26c-.9.11-1.8.26-2.7.46-4.93 1.12-9.2 3.55-12.54 6.83l10.87 7.71.03-.01zM55.034 74.528a2.218 2.218 0 00-2.58-1.69l-.02-.03-13.05 2.21a26.15 26.15 0 0010.51 13.15l5.06-12.22-.04-.05c.17-.42.23-.89.12-1.37zM50.694 65.118c.44-.12.85-.38 1.16-.76.75-.94.62-2.29-.28-3.07l.01-.05-9.93-8.88a26.07 26.07 0 00-3.7 16.48l12.73-3.67.01-.05zM60.334 69.018l3.66 1.76 3.66-1.75.9-3.95-2.53-3.16h-4.06l-2.54 3.16zM67.934 53.348c.02.46.18.91.49 1.29.75.94 2.1 1.11 3.06.41l.04.02 10.8-7.66c-4.08-3.99-9.4-6.6-15.15-7.3l.75 13.24h.01zM75.514 72.778c-.17-.03-.34-.05-.51-.04-.29.01-.58.09-.85.22a2.23 2.23 0 00-1.08 2.89l-.02.02 5.11 12.34c4.93-3.14 8.61-7.83 10.54-13.24l-13.16-2.23-.03.04zM65.954 79.318a2.246 2.246 0 00-2.04-1.17c-.77.03-1.5.46-1.89 1.18h-.01l-6.42 11.6a26.16 26.16 0 0014.27.73c.88-.2 1.74-.44 2.57-.72l-6.43-11.63h-.05z"/><path d="M124.544 76.788l-10.44-45.33a8.012 8.012 0 00-4.37-5.43l-42.24-20.18a8.157 8.157 0 00-3.92-.78 8.15 8.15 0 00-3.1.78l-42.24 20.18a8.055 8.055 0 00-4.37 5.43l-10.41 45.34a7.92 7.92 0 001.1 6.14c.14.22.3.43.46.64l29.24 36.35a8.087 8.087 0 006.32 3.01l46.89-.01c2.46 0 4.78-1.11 6.32-3.01l29.23-36.36a7.981 7.981 0 001.53-6.77zm-16.07-.55c-.31 1.35-1.76 2.17-3.26 1.85-.01 0-.03 0-.04-.01-.02 0-.03-.01-.05-.02-.21-.05-.47-.09-.65-.14-.86-.23-1.49-.58-2.27-.88-1.67-.6-3.06-1.1-4.41-1.3-.69-.05-1.04.27-1.42.52-.18-.04-.75-.14-1.08-.19-2.42 7.61-7.58 14.21-14.57 18.33.12.29.33.91.42 1.02-.16.43-.4.83-.19 1.49.49 1.27 1.28 2.52 2.24 4.01.46.69.94 1.22 1.36 2.02.1.19.23.48.33.68.65 1.39.17 2.99-1.08 3.59-1.26.61-2.82-.03-3.5-1.43-.1-.2-.23-.46-.31-.65-.36-.82-.48-1.52-.73-2.32-.57-1.68-1.05-3.07-1.73-4.25-.39-.57-.86-.64-1.29-.78-.08-.14-.38-.69-.54-.97-1.4.53-2.84.97-4.34 1.31-6.56 1.49-13.13.89-18.99-1.37l-.57 1.04c-.43.11-.84.23-1.09.53-.92 1.1-1.29 2.86-1.96 4.54-.25.79-.37 1.5-.73 2.32-.08.19-.22.45-.31.64v.01l-.01.01c-.67 1.39-2.23 2.03-3.49 1.43-1.25-.6-1.72-2.2-1.08-3.59.1-.2.22-.49.32-.68.42-.79.89-1.33 1.36-2.02.96-1.5 1.8-2.84 2.29-4.11.12-.42-.06-1-.22-1.43l.46-1.1c-6.73-3.99-12.04-10.34-14.58-18.21l-1.1.19c-.3-.17-.89-.56-1.45-.51-1.35.2-2.74.7-4.41 1.3-.78.3-1.4.64-2.27.87-.18.05-.44.1-.65.15-.02 0-.03.01-.05.02-.01 0-.03 0-.04.01-1.5.32-2.95-.5-3.26-1.85-.31-1.35.65-2.72 2.14-3.08.01 0 .03-.01.04-.01.01 0 .01 0 .02-.01.21-.05.48-.12.68-.16.88-.17 1.6-.13 2.43-.19 1.77-.19 3.23-.34 4.53-.75.41-.17.81-.74 1.09-1.1l1.06-.31c-1.19-8.22.82-16.28 5.16-22.81l-.81-.72c-.05-.32-.12-1.04-.51-1.46-.99-.93-2.25-1.71-3.76-2.64-.72-.42-1.38-.69-2.1-1.23-.15-.11-.36-.29-.52-.42-.01-.01-.03-.02-.04-.03-1.21-.97-1.49-2.64-.62-3.73.49-.61 1.24-.92 2.01-.89.6.02 1.23.24 1.76.66.17.14.41.32.56.45.68.58 1.09 1.16 1.66 1.77 1.25 1.27 2.28 2.32 3.41 3.08.59.35 1.05.21 1.5.15.15.11.63.46.91.65 4.3-4.57 9.96-7.95 16.52-9.44 1.53-.35 3.05-.58 4.57-.7l.06-1.07c.34-.33.71-.79.82-1.31.11-1.36-.07-2.82-.28-4.59-.12-.82-.31-1.51-.35-2.4-.01-.18 0-.44.01-.65 0-.02-.01-.05-.01-.07 0-1.55 1.13-2.81 2.53-2.81s2.53 1.26 2.53 2.81c0 .22.01.52.01.72-.03.89-.23 1.58-.35 2.4-.21 1.76-.4 3.23-.29 4.59.1.68.5.95.83 1.26.01.18.04.79.06 1.13 8.04.71 15.5 4.39 20.99 10.14l.96-.69c.33.02 1.04.12 1.53-.17 1.13-.76 2.16-1.82 3.41-3.08.57-.61.99-1.18 1.67-1.77.15-.13.39-.31.56-.45 1.21-.97 2.9-.86 3.77.23s.59 2.76-.62 3.73c-.17.14-.39.33-.56.45-.72.53-1.38.8-2.1 1.23-1.51.93-2.77 1.71-3.76 2.64-.47.5-.43.98-.48 1.43-.14.13-.63.57-.9.8a32.75 32.75 0 014.74 10.95c.92 3.99 1.06 7.97.53 11.8l1.02.3c.18.26.56.89 1.09 1.1 1.3.41 2.76.56 4.53.75.83.07 1.55.03 2.43.19.21.04.52.12.73.17 1.5.37 2.45 1.74 2.14 3.09z"/><path d="M86.274 52.358l-9.88 8.84.01.03c-.34.3-.6.7-.71 1.18-.27 1.17.44 2.33 1.58 2.65l.01.05 12.79 3.68c.27-2.76.11-5.62-.55-8.48-.66-2.89-1.77-5.56-3.25-7.95z"/></g></svg> },
                  { name: 'Helm', icon: <svg viewBox="0 0 128 128" width="20" height="20"><path fill="#0F1689" d="M35.5 30.5c-.2-.1-.3-.3-.5-.4-3.2-3.1-5.7-6.8-7.2-11.1-.4-1.2-.7-2.4-.7-3.7v-.4c.1-1.7 1.2-2.5 2.8-2.1.5.1 1 .3 1.4.6 1.8.9 3.2 2.2 4.5 3.7 2.3 2.5 4.2 5.5 5.5 8.7 0 .1.1.2.1.2s.1.1.2.1c6.2-3.8 13.3-6.1 20.6-6.5-.1-.2-.1-.4-.1-.6-.7-3.1-1-6.4-.7-9.6.1-1.9.5-3.8 1.1-5.7.3-1 .8-1.8 1.4-2.6.2-.3.5-.5.8-.7.6-.4 1.4-.4 2 0 .6.4 1.1 1 1.5 1.7.6 1.2 1.1 2.5 1.3 3.8.6 2.8.8 5.7.5 8.6-.1 1.7-.4 3.5-.9 5.2 1.8.3 3.6.6 5.4 1 1.8.4 3.5.9 5.2 1.6 1.7.6 3.4 1.4 5 2.2 1.6.8 3.1 1.8 4.7 2.7.1-.1.1-.2.2-.4 1.7-4.7 4.6-8.9 8.4-12.2.9-.8 1.9-1.4 3-1.8.3-.1.6-.2.9-.2 1.6-.2 2.3.8 2.4 2.1.1.9 0 1.8-.2 2.7-.6 2.3-1.5 4.4-2.7 6.4-1.7 2.9-3.8 5.4-6.4 7.5-.1.1-.2.1-.3.3 2.5 2.4 4.8 5.1 6.8 8-.2 0-.3.1-.4.1H93c-.3 0-.6-.2-.8-.4-5.9-6.6-13.8-10.8-22.4-12.1-2.5-.4-5.1-.5-7.7-.3-7.6.5-15 3.4-20.9 8.3-1.5 1.2-3 2.6-4.3 4.1-.2.3-.6.5-1 .5h-8.3c.2-.6 1.7-2.8 3.5-4.8 1.5-1.6 2.9-3 4.4-4.5zm65.4 58.9c-1.8 2.6-3.8 4.9-6.1 7.1.2.2.3.3.5.4 3.9 3.3 6.9 7.6 8.6 12.5.4 1.2.6 2.5.6 3.7 0 .3-.1.6-.2 1-.3.9-1.2 1.5-2.1 1.3-.6-.1-1.2-.3-1.7-.5-.8-.4-1.6-.9-2.3-1.5-3.8-3.2-6.7-7.4-8.4-12.1-.1-.1-.1-.3-.2-.5-2 1.4-4.1 2.6-6.3 3.6s-4.5 1.9-6.8 2.5c-2.4.6-4.7 1.1-7.2 1.4.1.2.1.4.1.6.8 3.1 1 6.3.8 9.5-.1 2-.5 3.9-1.1 5.8-.3.8-.7 1.5-1.1 2.3-.2.3-.4.5-.6.8-1 1.1-2.2 1.1-3.2 0-.4-.4-.7-.9-1-1.5-.8-1.5-1.2-3.1-1.5-4.8-.4-2.3-.5-4.6-.4-6.9.1-1.7.3-3.4.7-5 0-.1.1-.3.1-.4 0 0 0-.1-.1-.2-7.3-.4-14.3-2.6-20.6-6.5l-.3.6c-1.8 4.2-4.4 7.9-7.8 10.8-.9.8-1.9 1.4-3 1.8-.5.2-1.1.3-1.6.2-.6-.1-1.1-.5-1.4-1.2-.4-.9-.3-1.8-.2-2.7.2-1.3.6-2.5 1.1-3.7 1.5-3.7 3.9-7 6.7-9.8.1-.1.2-.2.4-.3 0-.1.1-.1.1-.2-2.7-2.4-5.2-5.1-7.2-8.1.3 0 .4-.1.6-.1h8c.4 0 .7.2.9.4 2.9 3.1 6.3 5.6 10 7.5 3.9 2.1 8.2 3.4 12.6 3.8 12 1.2 22.3-2.5 30.9-11.1.4-.4.9-.7 1.5-.6h8.1l.1.1zm-11.1-39c.7 0 1.4.1 2.1 0 .8-.1 1.3.2 1.9.7 3.2 3 6.4 6 9.7 9l.5.5c.2-.2.4-.3.6-.5 3.3-3.1 6.7-6.2 9.9-9.3.3-.3.7-.4 1.1-.4h2.5v27.4c-.4.1-6.3.2-7 0V63.9l-.1-.1c-2.3 2.1-4.6 4.3-6.9 6.4-2.3-2.2-4.6-4.3-7-6.4l-.1.1v14h-7c-.2-.5-.3-25.9-.2-27.5zm-64.2 0h6.9c.2.5.2 26.8 0 27.4h-6.9c-.1-1.7 0-3.5 0-5.2v-5.2H17v10.3c-.5.2-6.4.2-7 0V50.4h7v9.7c.5.2 7.8.2 8.6 0v-9.7zm15.2 27.4V50.5c.4-.1 15.6-.2 16.6-.1v5.8c-.2 0-.5.1-.7.1h-8.9v4.5h8.5v6h-8.4c-.2.5-.2 4.1-.1 5.1.2 0 .5.1.7.1h8.9v5.8H40.8zm24.6 0c-.1-.7-.1-26.9 0-27.4h6.9v20.2c.3 0 .5 0 .8.1H82v7.2l-16.6-.1z"/></svg> },
                  { name: 'Istio', icon: <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 21L12 3l7 18H5z" fill="#466BB0"/><path d="M12 3l7 18H12V3z" fill="#466BB0" opacity=".5"/></svg> },
                  { name: 'ArgoCD', icon: <svg viewBox="0 0 128 128" width="20" height="20"><path d="M44.035 89.594s-.847 2.55-2.125 3.824a3.844 3.844 0 01-2.972 1.277 49.946 49.946 0 01-6.38 1.274s2.977.426 6.38.851c1.273 0 1.273 0 2.124.426 2.126 0 2.973-1.277 2.973-1.277zm39.11 0s.851 2.55 2.125 3.824a3.858 3.858 0 002.976 1.277 49.8 49.8 0 006.375 1.274s-2.973.426-6.8.851c-1.274 0-1.274 0-2.126.426-2.55 0-2.976-1.277-2.976-1.277z" fill="#e9654b"/><path d="M109.926 47.508c0 25.355-20.555 45.91-45.91 45.91-25.356 0-45.91-20.555-45.91-45.91 0-25.352 20.554-45.906 45.91-45.906 25.355 0 45.91 20.554 45.91 45.906z" fill="#b6cfea"/><path d="M108.227 47.508c0 24.418-19.793 44.21-44.211 44.21-24.414 0-44.207-19.792-44.207-44.21C19.809 23.094 39.602 3.3 64.016 3.3c24.418 0 44.21 19.793 44.21 44.207z" fill="#e6f5f8"/><path d="M100.148 48.36c0 19.956-16.175 36.132-36.132 36.132-19.954 0-36.133-16.176-36.133-36.133 0-19.953 16.18-36.132 36.133-36.132 19.957 0 36.132 16.18 36.132 36.132z" fill="#d0e8f0"/><path d="M42.762 65.363s2.976 48.035 2.976 48.887c0 .422.426 1.273-1.703 2.125-2.125.848-8.926 2.55-8.926 2.55h10.203c4.676 0 4.676-3.827 4.676-4.675 0-.852 1.274-19.129 1.274-19.129s.425 21.68.425 22.527c0 .852-.425 2.125-3.398 2.977-2.125.426-8.504 1.7-8.504 1.7h9.778c5.953 0 5.953-3.825 5.953-3.825l1.273-19.129s.426 19.129.426 21.254c0 1.7-1.274 2.977-5.953 3.824-2.973.852-6.801 1.703-6.801 1.703h11.055c5.523-.425 6.375-4.254 6.375-4.254l9.351-47.609z" fill="#ee794b"/><path d="M85.27 65.363s-2.973 48.035-2.973 48.887c0 .422-.426 1.273 1.7 2.125 2.124.848 8.925 2.55 8.925 2.55H82.719c-4.676 0-4.676-3.827-4.676-4.675 0-.852-1.273-19.129-1.273-19.129s-.426 21.68-.426 22.527c0 .852.426 2.125 3.402 2.977l8.5 1.7H78.47c-5.95 0-5.95-3.825-5.95-3.825l-1.277-19.129s-.426 19.129-.426 21.254c0 1.7 1.278 2.977 5.954 3.824 2.976.852 6.8 1.703 6.8 1.703H72.52c-5.528-.425-6.38-4.254-6.38-4.254L56.79 74.29z" fill="#ee794b"/><path d="M71.668 73.863c0 7.227-3.402 11.907-7.652 11.907s-7.653-5.528-7.653-12.754c0 0 3.403 6.8 8.078 6.8 4.676 0 7.227-5.953 7.227-5.953z" fill="#010101"/><path d="M71.668 73.863c0 4.68-3.402 7.227-7.652 7.227s-7.227-3.399-7.227-7.649c0 0 3.402 4.25 8.078 4.25 4.676 0 6.801-3.828 6.801-3.828z" fill="#fff"/><path d="M92.07 53.887c0 7.277-5.898 13.175-13.175 13.175-7.278 0-13.18-5.898-13.18-13.175 0-7.278 5.902-13.18 13.18-13.18 7.277 0 13.175 5.902 13.175 13.18zm-29.754 0c0 7.277-5.902 13.175-13.18 13.175-7.277 0-13.175-5.898-13.175-13.175 0-7.278 5.898-13.18 13.176-13.18 7.277 0 13.18 5.902 13.18 13.18z" fill="#e9654b"/><path d="M89.098 53.887c0 5.633-4.57 10.203-10.203 10.203-5.633 0-10.204-4.57-10.204-10.203 0-5.637 4.57-10.203 10.204-10.203 5.632 0 10.203 4.566 10.203 10.203zm-30.61 0c0 5.633-4.566 10.203-10.199 10.203-5.637 0-10.203-4.57-10.203-10.203a10.201 10.201 0 0110.203-10.203c5.633 0 10.2 4.566 10.2 10.203z" fill="#fff"/><path d="M51.262 52.61a2.975 2.975 0 11-5.95.003 2.975 2.975 0 015.95-.004zm30.609 0a2.976 2.976 0 11-5.951.001 2.976 2.976 0 015.951-.002z" fill="#010101"/></svg> },
                  { name: 'Prometheus', icon: <svg viewBox="0 0 128 128" width="20" height="20"><path d="M63.66 2.477c33.477.007 60.957 27.296 60.914 60.5-.043 33.703-27.41 60.617-61.613 60.593-33.441-.023-60.477-27.343-60.453-61.086C2.53 29.488 30.066 2.47 63.66 2.477zm-18.504 21.25c.766 3.777.024 7.3-1.113 10.765-.785 2.399-1.871 4.711-2.52 7.145-1.07 4.008-2.28 8.039-2.726 12.136-.64 5.895 1.676 11.086 5.64 16.25l-18.222-3.835c.031.574 0 .792.062.976 1.727 5.074 4.766 9.348 8.172 13.379.36.426 1.18.644 1.79.644 18.167.036 36.335.032 54.503.008.563 0 1.317-.105 1.66-.468 3.895-4.094 6.871-8.758 8.735-14.63l-19.29 3.778c1.274-2.496 2.723-4.688 3.56-7.098 2.855-8.242 1.671-16.21-2.427-23.726-3.289-6.031-6.324-12.035-4.683-19.305-3.473 3.434-4.809 7.8-5.656 12.3-.832 4.434-1.325 8.93-1.97 13.43-.093-.136-.21-.238-.23-.355a13.317 13.317 0 01-.168-1.422c-.394-7.367-1.832-14.465-4.87-21.246-1.786-3.988-3.758-8.07-1.915-12.832-1.246.66-2.375 1.313-3.183 2.246-2.41 2.785-3.407 6.13-3.664 9.793-.22 3.13-.52 6.274-1.102 9.352-.61 3.234-1.574 6.402-3.75 9.375-.875-6.348-.973-12.63-6.633-16.66zM92 86.75H35.016v9.898H92zm-45.684 15.016c-.046 8.242 8.348 14.382 18.723 13.937 8.602-.371 16.211-7.137 15.559-13.937z" fill="#e75225"/></svg> },
                  { name: 'OpenTelemetry', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="17" cy="17" r="2.5" stroke="#F5A800" strokeWidth="2"/><path d="M7 7l7 7" stroke="#425CC7" strokeWidth="2.5" strokeLinecap="round"/><path d="M4 10l3-3 3 3" stroke="#425CC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { name: 'Grafana', icon: <svg viewBox="0 0 128 128" width="20" height="20"><defs><linearGradient id="grafana-g" gradientUnits="userSpaceOnUse" x1="45.842" y1="89.57" x2="45.842" y2="8.802" gradientTransform="translate(-.23 28.462) scale(1.4011)"><stop offset="0" stopColor="#fcee1f"/><stop offset="1" stopColor="#f15b2a"/></linearGradient></defs><path fill="url(#grafana-g)" d="M120.8 56.9c-.2-2.1-.6-4.5-1.2-7.2s-1.8-5.5-3.2-8.6c-1.5-3-3.4-6.2-5.9-9.1-1-1.2-2.1-2.3-3.2-3.5 1.8-6.9-2.1-13-2.1-13-6.7-.4-10.9 2.1-12.4 3.2-.2-.1-.6-.2-.8-.3-1.1-.4-2.3-.9-3.5-1.3-1.2-.3-2.4-.8-3.6-1-1.2-.3-2.5-.6-3.9-.8-.2 0-.4-.1-.7-.1C77.5 6 69.1 2 69.1 2c-9.6 6.2-11.4 14.4-11.4 14.4s0 .2-.1.4c-.6.1-1 .3-1.5.4-.7.2-1.4.4-2.1.8l-2.1.9c-1.4.7-2.8 1.3-4.2 2.1-1.3.8-2.6 1.5-3.9 2.4-.2-.1-.3-.2-.3-.2-12.9-5-24.3 1-24.3 1-1 13.8 5.2 22.3 6.4 23.9-.3.9-.6 1.7-.9 2.5-1 3.1-1.7 6.3-2.1 9.6-.1.4-.1 1-.2 1.4C10.5 67.5 7 79.6 7 79.6 16.9 91 28.5 91.7 28.5 91.7c1.4 2.6 3.2 5.2 5.1 7.5.8 1 1.7 1.9 2.5 2.9-3.6 10.3.6 19 .6 19 11.1.4 18.4-4.8 19.9-6.1 1.1.3 2.2.7 3.3 1 3.4.9 6.9 1.4 10.3 1.5h4.5c5.2 7.5 14.4 8.5 14.4 8.5 6.5-6.9 6.9-13.6 6.9-15.2v-.6c1.3-1 2.6-2 4-3.1 2.6-2.3 4.8-5.1 6.8-7.9.2-.2.3-.6.6-.8 7.4.4 12.5-4.6 12.5-4.6-1.2-7.7-5.6-11.4-6.5-12.1l-.1-.1-.1-.1-.1-.1c0-.4.1-.9.1-1.4.1-.9.1-1.7.1-2.5v-3.3c0-.2 0-.4-.1-.7l-.1-.7-.1-.7c-.1-.9-.3-1.7-.4-2.5-.8-3.3-2.1-6.5-3.7-9.2-1.8-2.9-3.9-5.3-6.3-7.5-2.4-2.1-5.1-3.9-7.9-5.1-2.9-1.3-5.7-2.1-8.7-2.4-1.4-.2-3-.2-4.4-.2h-2.3c-.8.1-1.5.2-2.2.3-3 .6-5.7 1.7-8.1 3.1-2.4 1.4-4.5 3.3-6.3 5.4-1.8 2.1-3.1 4.3-4 6.7-.9 2.3-1.4 4.8-1.5 7.2v2.6c0 .3 0 .6.1.9.1 1.2.3 2.3.7 3.4.7 2.2 1.7 4.2 3 5.9s2.8 3.1 4.4 4.2c1.7 1.1 3.3 1.9 5.1 2.4s3.4.8 5 .7h2.3c.2 0 .4-.1.6-.1.2 0 .3-.1.6-.1.3-.1.8-.2 1.1-.3.7-.2 1.3-.6 2-.8.7-.3 1.2-.7 1.7-1 .1-.1.3-.2.4-.3.6-.4.7-1.2.2-1.8-.4-.4-1.1-.6-1.7-.3-.1.1-.2.1-.4.2-.4.2-1 .4-1.4.6-.6.1-1.1.3-1.7.4-.3 0-.6.1-.9.1h-1.8s-.1 0 0 0h-.7c-.1 0-.3 0-.4-.1-1.2-.2-2.5-.6-3.7-1.1-1.2-.6-2.4-1.3-3.4-2.3-1.1-1-2-2.1-2.8-3.4-.8-1.3-1.2-2.8-1.4-4.2-.1-.8-.2-1.5-.1-2.3v-.7V70c0-.4.1-.8.2-1.2.6-3.3 2.2-6.5 4.7-8.9.7-.7 1.3-1.2 2.1-1.7.8-.6 1.5-1 2.3-1.3.8-.3 1.7-.7 2.5-.9.9-.2 1.8-.4 2.6-.4.4 0 .9-.1 1.3-.1h.8c.1 0 0 0 0 0h.4c1 .1 2 .2 2.9.4 1.9.4 3.7 1.1 5.5 2.1 3.5 2 6.5 5 8.3 8.6.9 1.8 1.5 3.7 1.9 5.8.1.6.1 1 .2 1.5v2.7c0 .6-.1 1.1-.1 1.7-.1.6-.1 1.1-.2 1.7s-.2 1.1-.3 1.7c-.2 1.1-.7 2.1-1 3.2-.8 2.1-1.9 4.1-3.2 5.8-2.6 3.6-6.3 6.6-10.3 8.5-2.1.9-4.2 1.7-6.4 2-1.1.2-2.2.3-3.3.3h-1.6c.1 0 0 0 0 0h-.1c-.6 0-1.2 0-1.8-.1-2.4-.2-4.7-.7-7-1.3-2.3-.7-4.5-1.5-6.6-2.6-4.2-2.2-7.9-5.4-10.9-9-1.4-1.9-2.8-3.9-3.9-5.9s-1.9-4.3-2.5-6.5c-.7-2.2-1-4.5-1.1-6.8v-3.5c0-1.1.1-2.3.3-3.5.1-1.2.3-2.3.6-3.5.2-1.2.6-2.3.9-3.5.7-2.3 1.4-4.5 2.4-6.6 2-4.2 4.5-7.9 7.5-10.9.8-.8 1.5-1.4 2.4-2.1.3-.3 1.1-1 2-1.5s1.8-1.1 2.8-1.5c.4-.2.9-.4 1.4-.7.2-.1.4-.2.8-.3.2-.1.4-.2.8-.3 1-.4 2-.8 3-1.1.2-.1.6-.1.8-.2.2-.1.6-.1.8-.2.6-.1 1-.2 1.5-.4.2-.1.6-.1.8-.2.2 0 .6-.1.8-.1.2 0 .6-.1.8-.1l.4-.1.4-.1c.2 0 .6-.1.8-.1.3 0 .6-.1.9-.1.2 0 .7-.1.9-.1.2 0 .3 0 .6-.1h.7c.3 0 .6 0 .9-.1h.4s.1 0 0 0h4.1c2 .1 4 .3 5.8.7 3.7.7 7.4 1.9 10.6 3.5 3.2 1.5 6.2 3.5 8.6 5.6.1.1.3.2.4.4.1.1.3.2.4.4.3.2.6.6.9.8.3.2.6.6.9.8.2.3.6.6.8.9 1.1 1.1 2.1 2.3 3 3.4 1.8 2.3 3.2 4.6 4.3 6.8.1.1.1.2.2.4.1.1.1.2.2.4s.2.6.4.8c.1.2.2.6.3.8.1.2.2.6.3.8.4 1 .8 2 1.1 3 .6 1.5.9 2.9 1.2 4 .1.4.6.8 1 .8.6 0 .9-.4.9-1-.3-1.7-.3-3.1-.4-4.8z"/></svg> },
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

      {/* WHO USES */}
      <section className="rd-adopters" id="adopters">
        <div className="rd-container">
          <div className="rd-section-head rv">
            <span className="rd-eyebrow">Adopters</span>
            <h2>Who uses our <span className="rd-grad">projects</span></h2>
          </div>
        </div>
        <div className="rd-adopters-track">
          <div className="rd-adopters-scroll">
            {[...(adopters as { adopters: { name: string; logo?: string; logo_light?: string; logo_dark?: string; website: string }[] }).adopters, ...(adopters as { adopters: { name: string; logo?: string; logo_light?: string; logo_dark?: string; website: string }[] }).adopters].map((adopter, i) => (
              <a key={i} href={adopter.website} target="_blank" rel="noopener noreferrer" className="rd-adopter-item">
                <Image
                  src={adopter.logo || adopter.logo_light || ''}
                  alt={adopter.name}
                  width={150}
                  height={60}
                  style={{ objectFit: 'contain', maxHeight: 48 }}
                />
              </a>
            ))}
          </div>
        </div>
        <div className="rd-container">
          <div className="rd-adopters-add rv">
            <a href="https://github.com/kagent-dev/website?tab=readme-ov-file#adopters" target="_blank" rel="noopener noreferrer">
              Add your logo here
            </a>
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
              <div className="rd-stat">2,500+</div>
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
              <div className="rd-stat">100+</div>
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
                Get Started
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
