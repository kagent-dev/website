import Image from "next/image";
import { FEATURES, PIPELINE } from "@/data/home-content";
import { GITHUB_LINK, DISCORD_LINK } from "@/data/links";
import adoptersYaml from "@/data/adopters.yaml";
import Github from "@/components/icons/github";
import Discord from "@/components/icons/discord";
import { ArrowLink, ghostBtn, primaryBtn, Section } from "./primitives";

type Adopter = { name: string; website: string; logo?: string; logo_light?: string; logo_dark?: string };
const ADOPTERS: Adopter[] = (adoptersYaml as { adopters: Adopter[] }).adopters;

/** The four "what happens after you apply" cards. */
export function PipelineGrid({ numbered = false }: { numbered?: boolean }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PIPELINE.map((p) => (
        <div key={p.num} className="min-h-[148px] rounded-lg border border-kg-bd-soft bg-kg-pg px-6 py-[26px]">
          {numbered && <div className="mb-3.5 font-mono text-[11px] tracking-[0.06em] text-kg-acc">{p.num}</div>}
          <div className="font-display text-[19px] font-medium tracking-[-0.02em] text-kg-tx1">{p.title}</div>
          <div className="mt-2.5 text-[14.5px] leading-[1.55] text-kg-tx3">{p.body}</div>
        </div>
      ))}
    </div>
  );
}

/** "And much more" — the capability grid. */
export function FeaturesSection() {
  return (
    <Section id="features" className="pb-24">
      <h2 className="font-display text-[clamp(30px,3.6vw,48px)] font-medium leading-[1.08] tracking-[-0.03em] text-kg-tx1">
        And much more
      </h2>
      <p className="mt-[18px] max-w-[58ch] text-lg leading-[1.6] text-kg-tx2">
        Every capability works with a single <span className="font-mono text-[15px] text-kg-tx1">helm install</span>. No add-ons, no
        extra databases, no waiting for enterprise.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-[30px] sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <div className="font-display text-base font-medium tracking-[-0.02em] text-kg-tx1">{f.title}</div>
            <div className="mt-[7px] text-[13.5px] leading-[1.55] text-kg-tx3">{f.body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** "Who uses our projects" — adopter logos on white tiles, sourced from data/adopters.yaml. */
export function AdoptersSection() {
  return (
    <Section id="adopters" className="pb-24">
      <h2 className="font-display text-[clamp(28px,3.2vw,42px)] font-medium leading-[1.1] tracking-[-0.028em] text-kg-tx1">
        Who uses our projects
      </h2>
      <div className="mt-9 flex flex-wrap gap-3">
        {ADOPTERS.map((a) => {
          const src = a.logo_light || a.logo;
          if (!src) return null;
          return (
            <a
              key={a.name}
              href={a.website}
              target="_blank"
              rel="noopener noreferrer"
              title={a.name}
              className="flex min-h-[88px] flex-[1_1_170px] max-w-[220px] items-center justify-center rounded-lg bg-white px-5 py-[26px] transition-colors hover:bg-[#F2F3F8]"
            >
              <span className="relative block h-10 w-[150px]">
                <Image src={src} alt={a.name} fill sizes="150px" className="object-contain" />
              </span>
            </a>
          );
        })}
      </div>
      <ArrowLink href="https://github.com/kagent-dev/website?tab=readme-ov-file#adopters" className="mt-[22px]">
        Add your logo here
      </ArrowLink>
    </Section>
  );
}

/** Closing call to action with Discord and GitHub buttons. */
export function CommunityBand() {
  return (
    <Section id="community" className="pb-[120px]">
      <div className="relative overflow-hidden rounded-xl border border-kg-bd bg-[linear-gradient(160deg,rgba(139,47,232,0.18),var(--kg-pg)_55%)] px-6 py-14 text-center sm:px-[52px] sm:py-[68px]">
        <div className="pointer-events-none absolute inset-0 bg-[url('/images/brand/binary-purple.svg')] bg-[length:340px_auto] bg-repeat opacity-[var(--kg-pat)]" />
        <h2 className="relative mx-auto max-w-[20ch] font-display text-[clamp(30px,3.6vw,52px)] font-medium leading-[1.06] tracking-[-0.03em] text-kg-tx1">
          Bring your agents to the cluster you already run
        </h2>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <a href={DISCORD_LINK} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
            <Discord className="h-[18px] w-[18px]" />
            Join the community on Discord
          </a>
          <a href={GITHUB_LINK} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
            <Github className="h-[17px] w-[17px] opacity-90" />
            GitHub repo
          </a>
        </div>
      </div>
    </Section>
  );
}
