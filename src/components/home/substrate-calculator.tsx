"use client";

/*
 * How long an agent on Agent Substrate takes to wake up, split into its parts,
 * and what a number of agents needs. The constants come from measurements on
 * Agent Substrate v1.0.0-rc2 with gVisor on one 16-vCPU node.
 */

import { useState } from "react";

type Snapshot = "volumes" | "memory";

const SIZES = [
  { name: "Small", cpu: 0.5, mib: 512, label: "½ core · 512 MiB" },
  { name: "Medium", cpu: 1, mib: 1024, label: "1 core · 1 GiB" },
  { name: "Large", cpu: 2, mib: 2048, label: "2 cores · 2 GiB" },
  { name: "X-Large", cpu: 4, mib: 4096, label: "4 cores · 4 GiB" },
];
const AGENTS = [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const DATA = [0, 50, 100, 250, 500, 1000, 2000]; // MB in the workspace
const HELD = [0, 100, 150, 250, 500, 750, 1000]; // MiB the process holds, up to the agent's memory
const NEW = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const DISKS = [125, 250, 500, 1000]; // MiB/s

// Medians of the measured wake-ups, with a Go test agent that starts in almost no time.
const C = {
  startFixS: 0.03, // the router and the request
  startCpuS: { volumes: 0.08, memory: 0.08 }, // CPU-seconds; no faster above 1 core
  fixS: 0.1, // once per restore and per download that has something to move
  localS: 0.5, // restore, s per GB of files at 1 core
  restoreCpuS: 0.45, // restore, CPU-seconds per GB below 1 core
  remoteS: 3.5, // download and decompress, s per GB of files
  heldDlS: 2.8, // download, s per GB of process memory
  heldRestoreS: 0.2, // restore, s per GB of process memory
  kLocal: 0.3, // disk work per GB, wake-up from the node's copy
  kRemote: 2.0, // disk work per GB of files, wake-up from object storage
  kHeld: 1.2, // disk work per GB of process memory
};

const PARTS = [
  { name: "Download", color: "#38bdf8" },
  { name: "Wait for the disk", color: "#34d399" },
  { name: "Agent start", color: "#a78bfa" },
  { name: "Restore", color: "#fbbf24" },
];

type Row = { name: string; note: string; parts: number[]; total: number };

function model(o: { cpu: number; snapshot: Snapshot; heldMiB: number; dataMB: number; disk: number }) {
  const gb = o.dataMB / 1000;
  const hgb = o.snapshot === "memory" ? (o.heldMiB * 1.048576) / 1000 : 0;
  const disk = o.disk * 1.048576; // MB/s
  const start = C.startFixS + C.startCpuS[o.snapshot] / Math.min(o.cpu, 1);
  const restore = (gb > 0 ? C.fixS : 0) + gb * Math.max(C.localS, C.restoreCpuS / o.cpu) + hgb * C.heldRestoreS;
  const download = (gb + hgb > 0 ? C.fixS : 0) + gb * C.remoteS + hgb * C.heldDlS;
  // The disk sets a lower limit: when its work takes longer than the download and the restore, the rest is a wait.
  const parts = (dl: number, diskS: number) => [dl, Math.max(0, diskS - dl - restore), start, restore];
  const rows: Row[] = [
    { name: "New conversation", note: "starts from the template", parts: [0, 0, start, 0], total: 0 },
    { name: "Back within 30 min", note: "from the node's copy", parts: parts(0, ((gb + hgb) * C.kLocal * 1000) / disk), total: 0 },
    { name: "Back later", note: "from object storage", parts: parts(download, ((gb * C.kRemote + hgb * C.kHeld) * 1000) / disk), total: 0 },
  ];
  rows.forEach((r) => (r.total = r.parts.reduce((a, b) => a + b, 0)));
  return rows;
}

const sec = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: x < 10 ? 2 : 1, maximumFractionDigits: x < 10 ? 2 : 1 });
const int = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 0 });
const one = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 1 });
const mb = (x: number) => (x >= 1000 ? `${x / 1000} GB` : `${x} MB`);
const short = (x: number) => (x >= 1000 ? `${x / 1000}k` : String(x));
const gib = (x: number) => (x >= 1024 ? `${one(x / 1024)} TiB` : `${one(x)} GiB`);
const gbs = (x: number) => (x >= 1000 ? `${one(x / 1000)} TB` : `${one(x)} GB`);

function Field({ label, value, children, hint }: { label: string; value?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium">{label}</span>
        {value && <span className="font-geistmono text-sm text-violet-300">{value}</span>}
      </div>
      {children}
      {hint && <p className="text-[13px] leading-relaxed text-ks-muted">{hint}</p>}
    </div>
  );
}

// A slider that snaps to the given steps, with the step values under it.
function Steps({ label, steps, value, onChange, fmt }: { label: string; steps: number[]; value: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  const i = Math.max(0, steps.indexOf(value));
  return (
    <div className="grid gap-1.5">
      <input
        type="range"
        aria-label={label}
        aria-valuetext={fmt(value)}
        min={0}
        max={steps.length - 1}
        step={1}
        value={i}
        onChange={(e) => onChange(steps[+e.target.value])}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-400"
        style={{ background: `linear-gradient(#a78bfa, #a78bfa) 0 / ${(i / (steps.length - 1)) * 100}% 100% no-repeat, rgb(255 255 255 / 0.1)` }}
      />
      <div className="flex justify-between font-geistmono text-[11px] text-white/40">
        {steps.map((s, n) => (
          <span key={s} className="w-0 whitespace-nowrap text-center [display:flex] [justify-content:center]">
            {n === 0 || n === steps.length - 1 || steps.length <= 6 || n % 2 === 0 ? fmt(s) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pills<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; text: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="grid gap-1 rounded-2xl border border-ks-line bg-ks-bg p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-2 py-2 text-[13px] leading-tight transition ${o.value === value ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

export default function SubstrateCalculator() {
  const [agents, setAgents] = useState(100);
  const [size, setSize] = useState(1);
  const [snapshot, setSnapshot] = useState<Snapshot>("memory");
  const [held, setHeld] = useState(150);
  const [data, setData] = useState(100);
  const [disk, setDisk] = useState(500);
  const [newPct, setNewPct] = useState(20);
  const [tip, setTip] = useState<string | null>(null);

  const pkg = SIZES[size];
  const heldSteps = HELD.filter((x) => x <= pkg.mib);
  const heldMiB = heldSteps.includes(held) ? held : heldSteps[heldSteps.length - 1];
  const rows = model({ cpu: pkg.cpu, snapshot, heldMiB, dataMB: data, disk });
  const avg = (newPct / 100) * rows[0].total + (1 - newPct / 100) * rows[2].total;
  const top = Math.max(...rows.map((r) => r.total));

  const cores = agents * pkg.cpu;
  const memGiB = (agents * pkg.mib) / 1024;
  const snapGB = (agents * (data + (snapshot === "memory" ? heldMiB * 1.048576 : 0))) / 1000;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <form onSubmit={(e) => e.preventDefault()} aria-label="Your agents" className="grid gap-7 rounded-[28px] bg-ks-card p-7">
        <Field label="Agents" value={int(agents)}>
          <Steps label="Agents" steps={AGENTS} value={agents} onChange={setAgents} fmt={short} />
        </Field>
        <Field label="Agent size" value={pkg.label}>
          <Pills label="Agent size" options={SIZES.map((s, i) => ({ value: i, text: s.name }))} value={size} onChange={setSize} />
        </Field>
        <Field
          label="Snapshot fidelity"
          hint={
            snapshot === "volumes"
              ? "kagent's default. The snapshot keeps the files, and the agent process starts again at each wake-up, so your agent's own start time adds to the times shown."
              : "The snapshot keeps the files and the process memory, so the agent continues where it stopped."
          }
        >
          <Pills
            label="Snapshot fidelity"
            options={[
              { value: "memory" as Snapshot, text: "Memory" },
              { value: "volumes" as Snapshot, text: "Volumes" },
            ]}
            value={snapshot}
            onChange={setSnapshot}
          />
        </Field>
        {snapshot === "memory" && (
          <Field label="Process memory at a suspend" value={`${heldMiB} MiB`}>
            <Steps label="Process memory at a suspend" steps={heldSteps} value={heldMiB} onChange={setHeld} fmt={String} />
          </Field>
        )}
        <Field label="Files in the workspace" value={data ? mb(data) : "none"}>
          <Steps label="Files in the workspace" steps={DATA} value={data} onChange={setData} fmt={(x) => (x >= 1000 ? `${x / 1000} GB` : String(x))} />
        </Field>
        <Field label="Disk speed of each node" value={`${disk} MiB/s`}>
          <Pills label="Disk speed of each node" options={DISKS.map((d) => ({ value: d, text: String(d) }))} value={disk} onChange={setDisk} />
        </Field>
        <Field label="New conversations" value={`${newPct}%`}>
          <Steps label="New conversations" steps={NEW} value={newPct} onChange={setNewPct} fmt={(x) => `${x}%`} />
        </Field>
      </form>

      <section aria-label="Wake-up time and resources" aria-live="polite" className="grid gap-8 rounded-[28px] border border-ks-line bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 md:p-9">
        <div>
          <div className="font-geistmono text-xs uppercase tracking-[0.2em] text-violet-300">Average wake-up</div>
          <div className="mt-3 text-7xl font-medium tracking-tight md:text-8xl">
            {sec(avg)}
            <span className="ml-2 text-3xl text-ks-muted">s</span>
          </div>
          <p className="mt-2 text-ks-muted">{newPct === 100 ? "Every conversation is new." : `With ${newPct}% new conversations, the rest back after more than 30 minutes.`}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.name} className="rounded-2xl border border-ks-line bg-ks-bg p-4">
              <div className="font-geistmono text-2xl">{sec(r.total)} s</div>
              <div className="mt-1 text-sm">{r.name}</div>
              <div className="text-[13px] text-ks-muted">{r.note}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ks-muted">
            {PARTS.map((p) => (
              <li key={p.name} className="flex items-center gap-2">
                <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                {p.name}
              </li>
            ))}
          </ul>
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[9.5rem_minmax(0,1fr)_4.5rem]">
              <span className="text-sm text-white/80">{r.name}</span>
              <div className="col-span-2 row-start-2 flex h-5 min-w-0 sm:col-span-1 sm:row-start-auto" style={{ width: `${(r.total / top) * 100}%` }}>
                {r.parts.map((s, i) =>
                  s > 0.005 ? (
                    <div
                      key={i}
                      tabIndex={0}
                      onMouseEnter={() => setTip(`${r.name}: ${PARTS[i].name.toLowerCase()} ${sec(s)} s`)}
                      onFocus={() => setTip(`${r.name}: ${PARTS[i].name.toLowerCase()} ${sec(s)} s`)}
                      onMouseLeave={() => setTip(null)}
                      onBlur={() => setTip(null)}
                      aria-label={`${r.name}, ${PARTS[i].name}: ${sec(s)} s`}
                      className="h-full border-r-2 border-[#141414] outline-none transition-[width] duration-300 first:rounded-l last:rounded-r last:border-r-0 focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                      style={{ width: `${(s / r.total) * 100}%`, background: PARTS[i].color }}
                    />
                  ) : null,
                )}
              </div>
              <span className="text-right font-geistmono text-sm sm:col-start-3 sm:row-start-1">{sec(r.total)} s</span>
            </div>
          ))}
          <p className="h-5 text-[13px] text-white/70">{tip ?? "Point at a bar to see each part."}</p>
        </div>

        <div className="border-t border-ks-line pt-7">
          <h3 className="text-xl font-medium">
            To run {int(agents)} agent{agents === 1 ? "" : "s"} at once
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              [one(cores), "CPU cores"],
              [gib(memGiB), "memory"],
              [snapGB ? `≤ ${gbs(snapGB)}` : "0 GB", `snapshot storage while ${agents === 1 ? "it sleeps" : "they sleep"}`],
            ].map(([v, k]) => (
              <div key={k} className="rounded-2xl border border-ks-line bg-ks-bg p-4">
                <div className="font-geistmono text-2xl">{v}</div>
                <div className="mt-1 text-[13px] text-ks-muted">{k}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ks-muted">The sum of the agents&apos; limits, with the agents packed evenly and waking up at different times. Agents that sleep use no CPU or memory, only snapshot storage.</p>
        </div>
      </section>
    </div>
  );
}
