"use client";

/*
 * Hero headline. Alternate versions with the kagent mark inline
 * ("Meet [logo] kagent") can be previewed with ?h=1 to ?h=5.
 */

import Image from "next/image";
import { useSyncExternalStore } from "react";

/* Inline kagent mark, sized to the headline like "Meet [logo] Grok Bot". */
const Mark = () => (
  <span className="relative -my-[0.35em] -mx-[0.04em] inline-block h-[1.65em] w-[1.65em] translate-y-[0.33em] align-baseline">
    <span aria-hidden className="absolute inset-0 rounded-full bg-violet-500/40 blur-xl" />
    <Image src="/images/kagent-logo-mark.png" alt="kagent" width={96} height={96} priority className="relative h-full w-full" />
  </span>
);

/* The kagent lockup (mark + wordmark) shown under the headline. */
const Lockup = () => (
  <div className="mt-7 flex items-center justify-center gap-3">
    <span id="hero-mark" className="relative inline-block h-16 w-16 animate-[float_5s_ease-in-out_infinite] motion-reduce:animate-none md:h-[76px] md:w-[76px]">
      <span aria-hidden className="absolute -inset-4 rounded-full bg-violet-500/55 blur-3xl" />
      <Image src="/images/kagent-logo-mark.png" alt="" width={152} height={152} priority className="relative h-full w-full" />
    </span>
    <span className="text-4xl font-semibold tracking-tight md:text-5xl">kagent</span>
  </div>
);

export const HEADLINES: Record<string, { title: React.ReactNode; sub: string; lockup?: boolean }> = {
  // Default
  "0": {
    title: <>Platform for managing agents<br className="hidden sm:block" /> <span className="bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">securely on Kubernetes</span></>,
    sub: "kagent gives platform teams one place to deploy, manage and govern AI agents on Kubernetes. Orchestrated by kagent, Agent Substrate runs each one in its own sandbox, puts it to sleep while it waits, and wakes it in as little as 150ms.",
  },
  "5": {
    title: <>Run millions of agents, securely,<br className="hidden sm:block" /> on K8s with <span className="whitespace-nowrap"><Mark />kagent</span></>,
    sub: "kagent decides what each agent does. Agent Substrate decides where it runs: in its own sandbox, asleep while it waits, and back in under a second when there's more to do.",
  },
  "4": {
    title: <>Bring AI Agents to every cluster you run</>,
    sub: "kagent decides what each agent does. Agent Substrate decides where it runs: in its own sandbox, asleep while it waits, and back in under a second when there's more to do.",
  },
  "1": {
    title: <>Meet <Mark />kagent</>,
    sub: "AI Agents that live in your Kubernetes clusters. Each one runs in its own sandbox, sleeps while it waits, and wakes in under a second when there's work to do.",
  },
  "2": {
    title: <>Kubernetes, meet <Mark />kagent</>,
    sub: "Declare an agent like any other workload. kagent decides what it does; Agent Substrate decides where it runs, sandboxed and asleep until it's needed.",
  },
  "3": {
    title: <>Run <Mark />AI Agents on every cluster you run</>,
    sub: "Templates for what an agent does, harnesses for where it runs, and Agent Substrate underneath to sandbox, suspend and resume every conversation.",
  },
};


const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export default function HeroHeadline() {
  const h = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get("h") ?? "0", () => "0");
  const head = HEADLINES[HEADLINES[h] ? h : "0"];
  return (
    <>
      <h1 id="hero-title" className="mx-auto max-w-5xl text-[44px] font-medium leading-[1.08] tracking-tight sm:text-5xl md:text-[64px]">{head.title}</h1>
      {head.lockup && <Lockup />}
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ks-muted">{head.sub}</p>
    </>
  );
}
