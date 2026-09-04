import type { Metadata } from "next";
import Link from "next/link";
import { INSTALL_LINES, LOOP_LINES } from "@/data/home-content";
import { ghostBtn, primaryBtn, Section } from "@/components/home/primitives";
import { TerminalRoll } from "@/components/home/terminal";
import { BuildFlow } from "@/components/home/build-flow";
import { AdoptersSection, CommunityBand, FeaturesSection, PipelineGrid } from "@/components/home/sections";

export const metadata: Metadata = {
  title: "Build agents the way you ship everything else | kagent",
  description:
    "Skills, tools and agents are Kubernetes resources. Write them, apply them, review them in a pull request. No framework to learn, no glue code to maintain.",
};

export default function BuildPage() {
  return (
    <>
      {/* Hero */}
      <section id="top" className="relative flex justify-center overflow-hidden px-8 pb-6 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_-20%,rgba(139,47,232,0.22),rgba(0,0,0,0)_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/brand/binary-purple.svg')] bg-[length:340px_auto] bg-repeat opacity-[var(--kg-pat)]" />
        <div className="relative w-full max-w-[1160px]">
          <div className="flex items-center gap-2.5 font-mono text-[12.5px] tracking-[0.06em] text-kg-acc">
            <span className="h-1.5 w-1.5 animate-kg-pulse rounded-full bg-kg-acc" />
            the declarative way to build agents
          </div>
          <h1 className="mt-[26px] max-w-[17ch] text-balance font-display text-[clamp(46px,6.6vw,104px)] font-medium leading-[0.96] tracking-[-0.035em] text-kg-tx1">
            Build agents the way you ship <span className="text-kg-acc">everything else</span>
          </h1>
          <p className="mt-7 max-w-[60ch] text-[19px] leading-[1.6] text-kg-tx2">
            Skills, tools and agents are Kubernetes resources. Write them, apply them, review them in a pull request. No framework to
            learn, no glue code to maintain.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/docs/kagent/getting-started/quickstart" className={primaryBtn}>
              Create your first agent
            </Link>
            <Link href="/docs/kagent" className={ghostBtn}>
              Read the docs
            </Link>
          </div>
          <TerminalRoll title="install kagent" lines={INSTALL_LINES} className="mt-11 max-w-[620px]" />
        </div>
      </section>

      {/* Build walkthrough */}
      <Section id="build" className="pb-6">
        <BuildFlow />
      </Section>

      {/* The whole loop */}
      <Section className="py-24">
        <h2 className="max-w-[24ch] font-display text-[clamp(28px,3.2vw,44px)] font-medium leading-[1.1] tracking-[-0.028em] text-kg-tx1">
          One apply, and the platform takes it from there
        </h2>
        <TerminalRoll title="the whole loop" lines={LOOP_LINES} className="mt-9" />
        <PipelineGrid numbered />
      </Section>

      <FeaturesSection />
      <AdoptersSection />
      <CommunityBand />
    </>
  );
}
