import type { Metadata } from "next";
import SubstrateCalculator from "@/components/home/substrate-calculator";
import { DOCS, HomeFooter, HomeHeader, SUBSTRATE, geistMono, geistSans } from "@/components/home/chrome";

export const metadata: Metadata = {
  title: "Agent Substrate calculator | kagent",
  description: "How fast agents on Agent Substrate wake up, which part of a wake-up takes the time, and the CPU, memory and snapshot storage they need.",
};

const PARTS = [
  ["Download", "A wake-up after the node dropped its copy fetches the snapshot from object storage and decompresses it. Snapshots of code compress to about a third."],
  ["Wait for the disk", "Each wake-up writes and reads its snapshot on the node's disk. A slow disk adds time when its work takes longer than the download and the restore."],
  ["Agent start", "With a Volumes snapshot the agent process starts again. With a Memory snapshot it continues where it stopped. More than 1 core does not make it faster."],
  ["Restore", "Puts the workspace files, and the process memory if the snapshot keeps it, back in the sandbox. Below 1 core it runs within the agent's CPU limit."],
];

export default function SubstrateCalculatorPage() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] font-geist text-white antialiased [color-scheme:dark]`}>
      <HomeHeader />

      <section className="relative mx-auto max-w-6xl px-6 pt-16 md:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[620px]">
          <div className="absolute left-1/2 top-0 h-[480px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.26),rgba(139,92,246,0.06)_55%,transparent)]" />
        </div>
        <div className="font-geistmono text-xs uppercase tracking-[0.2em] text-violet-300">Agent Substrate calculator</div>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">How fast do your agents wake up, and what do they need?</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ks-muted">
          Agents sleep when nobody uses them, and wake up on the next message. Describe your agents to see how long a wake-up takes, which part takes the time, and the CPU, memory and storage they need.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-12">
        <SubstrateCalculator />
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-28">
        <h2 className="text-3xl font-medium tracking-tight">What a wake-up is made of</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-ks-line bg-ks-card p-6">
              <h3 className="text-lg font-medium">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ks-muted">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-ks-muted">
          Measured on Agent Substrate v1.0.0-rc2 with gVisor, on one node with 16 vCPUs, with a minimal Python agent and object storage in the same region. The agent start is the median of the measured wake-ups, and the other values are the best measured results. Your agent&apos;s own start time adds to a wake-up with a Volumes snapshot.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm">
          <a href={`${DOCS}/about/substrate-runtime/sandboxing`} className="group flex items-center gap-1.5 text-violet-300 hover:text-violet-200">
            Read about the runtime <span className="transition group-hover:translate-x-0.5">→</span>
          </a>
          <a href={SUBSTRATE} className="group flex items-center gap-1.5 text-violet-300 hover:text-violet-200">
            About Agent Substrate <span className="transition group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </section>

      <div className="pt-28">
        <HomeFooter />
      </div>
    </div>
  );
}
