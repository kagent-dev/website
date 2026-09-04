import Link from "next/link";
import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";
import Github from "@/components/icons/github";
import Discord from "@/components/icons/discord";
import { ArrowLink, ArrowList, Eyebrow, ghostBtn, primaryBtn, Section } from "@/components/home/primitives";
import { DensityPanel, EgressPanel, ResumePanel } from "@/components/home/substrate-panels";
import { BuildFlow } from "@/components/home/build-flow";
import { HeroSchematic } from "@/components/home/hero-schematic";
import { ArchitecturePanel } from "@/components/home/architecture-panel";
import { dotGrid } from "@/components/home/blueprint";
import { AdoptersSection, CommunityBand, FeaturesSection, PipelineGrid } from "@/components/home/sections";

const h3Cls = "mt-4 font-display text-[clamp(28px,3vw,42px)] font-medium leading-[1.1] tracking-[-0.025em] text-kg-tx1";
const bodyCls = "mt-[18px] max-w-[46ch] text-[17px] leading-[1.65] text-kg-tx2";
const rowCls = "grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section id="top" className="relative flex justify-center overflow-hidden px-8 pb-6 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_-20%,rgba(139,47,232,0.22),rgba(0,0,0,0)_65%)]" />
        <div className={`pointer-events-none absolute inset-0 ${dotGrid} [mask-image:linear-gradient(to_bottom,black_40%,transparent)]`} />
        <div className="relative w-full max-w-[1160px]">
          <HeroSchematic />
          <h1 className="mx-auto mt-[26px] max-w-[17ch] text-balance text-center font-display text-[clamp(46px,6.6vw,104px)] font-medium leading-[0.96] tracking-[-0.035em] text-kg-tx1">
            Agents on Kubernetes
          </h1>
          <p className="mx-auto mt-7 max-w-[60ch] text-center text-[19px] leading-[1.6] text-kg-tx2">
            Thousands of agents per cluster, resuming in milliseconds, sandboxed by default. kagent runs on Agent Substrate — the
            runtime built for what agents become next.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/docs/kagent/getting-started/quickstart" className={primaryBtn}>
              Install kagent
            </Link>
            <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <Discord className="h-[17px] w-[17px] opacity-90" />
              Join the community on Discord
            </a>
            <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <Github className="h-[17px] w-[17px] opacity-90" />
              GitHub repo
            </a>
          </div>
        </div>
      </section>

      {/* Substrate intro */}
      <Section id="substrate" className="py-10">
        <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(34px,4.2vw,60px)] font-medium leading-[1.05] tracking-[-0.03em] text-kg-tx1">
          A runtime built for how agents actually run
        </h2>
        <p className="mt-[22px] max-w-[64ch] text-lg leading-[1.6] text-kg-tx2">
          Agents resume in milliseconds, hold nothing while idle, and run sandboxed from the first instruction. Substrate&apos;s core is
          built on Kubernetes, so this is the platform you already operate.
        </p>
        <ArchitecturePanel className="mt-14" />
      </Section>

      {/* Suspend & resume */}
      <Section className="py-[60px]" innerClassName={rowCls}>
        <div>
          <Eyebrow>suspend &amp; resume</Eyebrow>
          <h3 className={h3Cls}>Sub-100ms resume, on demand</h3>
          <p className={bodyCls}>
            Agents don&apos;t usually need to run 24/7, so reserving constant compute for them is very inefficient. Suspend an agent and
            it holds nothing. Resume it and it is back before anyone notices.
          </p>
          <ArrowList
            className="mt-[26px]"
            items={["Filesystems snapshotted on suspend", "Restart from a previously known state", "No compute held while idle"]}
          />
        </div>
        <ResumePanel />
      </Section>

      {/* Density */}
      <Section className="py-[60px]" innerClassName={rowCls}>
        <div>
          <Eyebrow>density</Eyebrow>
          <h3 className={h3Cls}>250 agents on 8 pods</h3>
          <p className={bodyCls}>
            Agents share pools of workers instead of getting their own dedicated compute. Substrate packs more agents onto the system
            than it has compute for, because agents that aren&apos;t running don&apos;t hold any.
          </p>
          <ArrowLink href="https://www.solo.io/topics/ai-infrastructure/how-google-agent-substrate-works" className="mt-[26px]">
            See how the density works
          </ArrowLink>
        </div>
        <DensityPanel />
      </Section>

      {/* Isolation */}
      <Section className="pb-[120px] pt-[60px]" innerClassName={rowCls}>
        <div>
          <Eyebrow>isolation</Eyebrow>
          <h3 className={h3Cls}>Sandboxed by default</h3>
          <p className={bodyCls}>
            Agents can be very dangerous. All compute inside Substrate runs in a sandbox runtime, and Substrate controls all network
            traffic in and out of the agent — nothing gets in or out without explicit permission.
          </p>
        </div>
        <EgressPanel />
      </Section>

      {/* Build walkthrough */}
      <Section id="build" className="pb-6">
        <BuildFlow />
      </Section>

      {/* After apply */}
      <Section className="py-24">
        <h2 className="max-w-[24ch] font-display text-[clamp(28px,3.2vw,44px)] font-medium leading-[1.1] tracking-[-0.028em] text-kg-tx1">
          What happens after you apply
        </h2>
        <PipelineGrid />
      </Section>

      <FeaturesSection />
      <AdoptersSection />
      <CommunityBand />
    </>
  );
}
