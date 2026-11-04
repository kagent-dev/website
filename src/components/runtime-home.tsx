"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import KagentLogo from "./icons/kagent-logo";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import adopters from "@/data/adopters.yaml";

type Adopter = {
  name: string;
  logo?: string;
  logo_light?: string;
  logo_dark?: string;
  website: string;
};

const adopterList = (adopters as { adopters: Adopter[] }).adopters;

const INSTALL = "helm install kagent oci://ghcr.io/kagent-dev/kagent/helm/kagent";

function InstallLine() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* The command stays selectable when the clipboard is blocked. */
    }
  }

  return (
    <div className="rt-install">
      <code>{INSTALL}</code>
      <button type="button" onClick={copy} data-copied={copied}>
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}


const HERO_CYCLE = new Set([0, 2, 4]);

const FLOWS = [
  { d: "M210 30C360 8 450 52 560 119", delay: "0s" },
  { d: "M1190 30C1040 8 950 52 840 119", delay: "1.1s" },
  { d: "M190 186C340 214 450 172 560 161", delay: "0.55s" },
  { d: "M1210 186C1060 214 950 172 840 161", delay: "1.7s" },
];

function HeroArt() {
  return (
    <div className="rt-art">
      <svg className="rt-art-svg" viewBox="0 0 1400 230" role="img" aria-label="kubectl, snapshots, models, and MCP tools connect into Agent Substrate, where five agents come and go in their own sandboxes.">
        {FLOWS.map((flow) => (
          <g key={flow.d}>
            <path className="art-flow" d={flow.d} />
            <path className="art-pulse" d={flow.d} pathLength={100} style={{ animationDelay: flow.delay }} />
          </g>
        ))}

        <g className="art-node">
          <rect x="36" y="8" width="174" height="46" rx="10" />
          <text x="123" y="36" textAnchor="middle">kubectl apply</text>
        </g>
        <g className="art-node art-node-dim">
          <rect x="16" y="162" width="174" height="46" rx="10" />
          <text x="103" y="190" textAnchor="middle">snapshots</text>
        </g>
        <g className="art-node">
          <rect x="1190" y="8" width="174" height="46" rx="10" />
          <text x="1277" y="36" textAnchor="middle">mcp tools</text>
        </g>
        <g className="art-node art-node-dim">
          <rect x="1210" y="162" width="174" height="46" rx="10" />
          <text x="1297" y="190" textAnchor="middle">models</text>
        </g>

        <text className="art-label" x="700" y="86" textAnchor="middle">Agent Substrate</text>
        <rect className="art-frame" x="560" y="97" width="280" height="86" rx="8" />
        {[
          [560, 97],
          [840, 97],
          [560, 183],
          [840, 183],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} className="art-handle" x={x - 4} y={y - 4} width="8" height="8" />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="art-agent" data-cycle={HERO_CYCLE.has(i)} style={{ "--i": i } as CSSProperties}>
            <rect x={580 + i * 50} y="115" width="40" height="50" rx="7" />
            <KagentLogo className="art-mark" x={591 + i * 50} y={132} width={18} height={14} aria-hidden />
          </g>
        ))}
      </svg>
    </div>
  );
}

// A stable hash, not Math.random: the server and the client must agree on every
// slot's phase or React complains about the markup it hydrated.
function slotPhase(i: number) {
  let x = Math.imul(i + 1, 0x9e3779b1);
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

// Both sides answer the same two questions in the same order: where does an
// agent live while it works, and where does it live while it waits. The whole
// argument is the second row, and the footer counts read straight off the art.
const POD_W = 66;
const POD_H = 70;
const POD_STEP = 77;
const SLOT_W = 48;
const SLOT_H = 70;

// 3 in a turn + 7 at rest + 1 arriving = the 11 in the footer.
const STORE_COUNT = 7;
const storeX = (i: number) => 110 + i * 52;
const STORE_Y = 192;
const slotX = (i: number) => i * 58 + 15;
const SLOT_Y = 48;

function Band({ label, count, y = 14 }: { label: string; count: string; y?: number }) {
  return (
    <>
      <text className="cw-band" x="0" y={y}>{label}</text>
      <text className="cw-count" x="454" y={y} textAnchor="end">{count}</text>
    </>
  );
}

function Footer({ figure, gloss }: { figure: string; gloss: string }) {
  return (
    <>
      <path className="cw-rule" d="M0 258H454" />
      <text className="cw-figure" x="0" y="284">{figure}</text>
      <text className="cw-gloss" x="0" y="302">{gloss}</text>
    </>
  );
}

// Amplitudes for the load meter — fixed, not random, so the server and the
// client render the same bars.
const LOAD = [0.95, 0.55, 1, 0.42, 0.78, 0.6];

function Bars({ x, y, bars, step, height: h }: { x: number; y: number; bars: number; step: number; height: number }) {
  return (
    <>
      {Array.from({ length: bars }).map((_, i) => (
        <rect
          className="cw-bar"
          key={i}
          x={x + i * step}
          y={y}
          width={step - 3}
          height={h}
          rx={1}
          style={{ "--h": LOAD[i % LOAD.length], animationDelay: `${-(i * 0.23).toFixed(2)}s` } as CSSProperties}
        />
      ))}
    </>
  );
}

// Every pod is lit and reserved the whole time. Work comes and goes on its own
// clock, so at any moment about half the meters are flat — the pod is up either
// way, which is the argument.
function PodCell({ i }: { i: number }) {
  const x = i * POD_STEP;
  const delay = `${-(i * 2).toFixed(0)}s`;
  const phase = { animationDelay: delay } as CSSProperties;
  return (
    <g>
      <rect className="cw-pod" x={x} y={26} width={POD_W} height={POD_H} rx={9} />
      <KagentLogo className="cw-agent cw-duty-on" style={phase} x={x + 22} y={48} width={22} height={17} aria-hidden />
      <KagentLogo className="cw-agent waiting cw-duty-off" style={phase} x={x + 22} y={48} width={22} height={17} aria-hidden />
      <g className="cw-duty-on" style={phase}>
        <Bars x={x + 13} y={74} bars={5} step={9} height={13} />
      </g>
      <path className="cw-flat cw-duty-off" style={phase} d={`M${x + 13} ${87}H${x + 53}`} />
    </g>
  );
}

function Arrowhead({ x, y }: { x: number; y: number }) {
  return <path className="cw-arrow" d={`M${x} ${y}h30M${x + 24} ${y - 4}l6 4-6 4`} />;
}

function BeforeArt() {
  return (
    <svg className="cw" viewBox="0 0 454 314" role="img" aria-label="Six agents in six reserved pods that never free up. One more agent has nowhere to go, so a pod and a node have to be provisioned for it.">
      <Band label="pods" count="6 of 6 · always reserved" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <PodCell key={i} i={i} />
      ))}

      <Band label="one more agent" count="no room" y={134} />
      <rect className="cw-store" x="0" y="146" width="454" height="96" rx={10} />
      <text className="cw-store-tag" x="14" y="166">nothing free — provision more</text>

      <KagentLogo className="cw-agent" x={16} y={193} width={22} height={17} aria-hidden />
      <Arrowhead x={48} y={201} />

      <rect className="cw-full" x="94" y="180" width="58" height="44" rx={8} />
      <path className="cw-x" d="M112 192l22 20M134 192l-22 20" />
      <text className="cw-tiny" x="123" y="236" textAnchor="middle">full</text>

      <Arrowhead x={166} y={201} />

      <rect className="cw-ghost" x="212" y="174" width="226" height="56" rx={10} />
      <rect className="cw-ghost" x="222" y="182" width="58" height="40" rx={7} style={{ animationDelay: "0.35s" } as CSSProperties} />
      <text className="cw-tiny" x="294" y="205">+1 pod on +1 node</text>

      <Footer figure="7 agents · 7 pods" gloss="Every new agent is another pod — and eventually another node." />
    </svg>
  );
}

// Two workers stay held. Three more take an agent, hold it for a turn and let
// it go, so the pool turns over without anything sliding across the picture.
const POOL_HELD = new Set([0, 5]);
const POOL_TURNS = [
  { slot: 2, delay: "0s" },
  { slot: 4, delay: "-3s" },
  { slot: 7, delay: "-6s" },
];
const TURN_SLOTS = new Map(POOL_TURNS.map((t) => [t.slot, t.delay]));

function AfterArt() {
  return (
    <svg className="cw" viewBox="0 0 454 314" role="img" aria-label="Eleven agents on a pool of eight workers. A few hold a worker while they take a turn; one more arrives as a snapshot in object storage and needs no new pod.">
      <Band label="in a turn" count="3 of 8 workers" />
      {Array.from({ length: 8 }).map((_, i) => {
        const delay = TURN_SLOTS.get(i);
        const turning = delay !== undefined;
        return (
          <g key={i}>
            <rect
              className={POOL_HELD.has(i) ? "cw-slot on" : "cw-slot"}
              data-turn={turning || undefined}
              style={turning ? ({ animationDelay: delay } as CSSProperties) : undefined}
              x={i * 58}
              y={26}
              width={SLOT_W}
              height={SLOT_H}
              rx={8}
            />
            {(POOL_HELD.has(i) || turning) && (
              <g
                className={turning ? "cw-turn" : undefined}
                style={turning ? ({ animationDelay: delay } as CSSProperties) : undefined}
              >
                <KagentLogo className="cw-agent" x={slotX(i)} y={SLOT_Y} width={17} height={13} aria-hidden />
                <Bars x={i * 58 + 8} y={76} bars={5} step={7} height={12} />
              </g>
            )}
          </g>
        );
      })}

      <Band label="one more agent" count="no new pod" y={134} />
      <rect className="cw-store" x="0" y="146" width="454" height="96" rx={10} />
      <text className="cw-store-tag" x="14" y="166">object storage</text>
      <KagentLogo className="cw-agent cw-arrive" x={16} y={193} width={22} height={17} aria-hidden />
      <Arrowhead x={48} y={201} />
      {Array.from({ length: STORE_COUNT }).map((_, i) => (
        <KagentLogo className="cw-agent dim" key={i} x={storeX(i)} y={STORE_Y} width={24} height={18} aria-hidden />
      ))}

      <Footer figure="11 agents · 8 workers" gloss="It becomes a snapshot and waits. No new pod, no new node." />
    </svg>
  );
}

function Compare() {
  return (
    <div className="cmp">
      <span className="cmp-arrow" aria-hidden>
        <svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
      </span>
      <div className="cmp-side">
        <p><span className="cmp-tag">before</span>One pod per agent</p>
        <p className="cmp-k8s">a Deployment, and its pod, for every agent</p>
        <BeforeArt />
      </div>
      <div className="cmp-side">
        <p><span className="cmp-tag after">after</span>Worker pool</p>
        <p className="cmp-k8s">one WorkerPool, and the agents land on it</p>
        <AfterArt />
      </div>
    </div>
  );
}

function Arrow({ both = false }: { both?: boolean }) {
  return (
    <svg className="flow-arrow" viewBox="0 0 40 8" width="40" height="8" aria-hidden>
      <path d={both ? "M3 4h34M7 1 3 4l4 3M33 1l4 3-4 3" : "M1 4h35M32 1l4 3-4 3"} />
    </svg>
  );
}

function LifeBox({ slot, label }: { slot: string; label: string }) {
  return (
    <div className="life-box" data-slot={slot}>
      <span className="life-body">
        <KagentLogo className="life-agent" aria-hidden />
        <span>{label}</span>
      </span>
    </div>
  );
}

function LifeLeg({ label, leg, hot }: { label: string; leg: string; hot?: boolean }) {
  return (
    <span className={hot ? "life-step hot" : "life-step"}>
      <b>{label}</b>
      <span className="life-track">
        <Arrow />
        <i data-leg={leg} />
      </span>
    </span>
  );
}

// One eight-second loop: the actor works, checkpoints out, sits as a snapshot,
// then restores. Every box and the two travelling dots run off that timeline.
function Lifecycle() {
  return (
    <div className="life" aria-hidden>
      <figure>
        <LifeBox slot="run-a" label="triage" />
        <figcaption>running</figcaption>
      </figure>
      <LifeLeg label="suspend" leg="out" />
      <figure>
        <LifeBox slot="store" label="snapshot" />
        <figcaption>0 vCPU</figcaption>
      </figure>
      <LifeLeg label="resume" leg="back" hot />
      <figure>
        <LifeBox slot="run-b" label="triage" />
        <figcaption>sub-second</figcaption>
      </figure>
    </div>
  );
}

// Vendor marks, inlined from src/components/icons/brands/. Filled, not stroked,
// so they sit beside the line-art glyphs without looking like another diagram.
const BRAND = {
  openai: "M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z",
  claude: "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z",
} as const;

function Brand({ d }: { d: string }) {
  return (
    <svg className="chain-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function HarnessChain() {
  return (
    <div className="chain" aria-hidden>
      <div className="chain-node">
        <KagentLogo className="chain-icon" aria-hidden />
        kagent
      </div>
      <span className="chain-link">
        <b>a2a</b>
        <Arrow both />
        <i>many sessions</i>
      </span>
      <div className="chain-sandbox">
        <p className="chain-tag">isolated sandbox · long-lived actor</p>
        <div>
          <b>
            <Mark d="M4 7h11m-3-3 3 3-3 3M20 17H9m3-3-3 3 3 3" />
            executor
          </b>
          <span className="chain-fork" />
          <div className="chain-pick">
            <b>
              <Brand d={BRAND.openai} />
              codex
            </b>
            <span className="chain-or">or</span>
            <b>
              <Brand d={BRAND.claude} />
              claude
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}

const TERMS = [
  ["agent", "What you declare: a model, instructions and tools."],
  ["actor", "One running instance of an agent, with its own memory and filesystem."],
  ["harness", "A long-lived actor running a coding agent \u2014 Codex or Claude \u2014 rather than a kagent runtime."],
  ["worker", "A pre-warmed gVisor pod. It hosts one actor at a time."],
] as const;

const EGRESS = [
  { host: "api.anthropic.com", ok: true },
  { host: "mcp tool server", ok: true },
  { host: "169.254.169.254", ok: false },
  { host: "10.0.0.0/8", ok: false },
] as const;

function Wall() {
  const lanes = [68, 104, 140, 176];
  const exit = 216; // right edge of the actor box
  const exitY = 122; // every lane fans out of one point, centred on the lanes
  const wall = 252; // the boundary itself

  return (
    <svg className="wall" viewBox="0 0 560 240" role="img" aria-label="An isolated sandbox with a private actor filesystem. Its boundary opens only for api.anthropic.com and the MCP tool server; 169.254.169.254 and 10.0.0.0/8 are stopped at the wall.">
      <path className="wall-frame" d="M248 24H30a14 14 0 0 0-14 14v174a14 14 0 0 0 14 14h218" />
      <text className="wall-tag" x="32" y="46">isolated sandbox</text>

      <rect className="wall-agent" x="30" y="64" width="186" height="100" rx="10" />
      <KagentLogo className="wall-agent-mark" x={107} y={88} width={32} height={24} aria-hidden />
      <text className="wall-name" x="123" y="140" textAnchor="middle">actor filesystem</text>
      {/* The qualifier sits under the box rather than inside it — at this width
          a second centred line crowds the border. */}
      <text className="wall-sub" x="123" y="188" textAnchor="middle">private to this actor</text>

      {/* One boundary with two openings — the gaps are the whole point. */}
      <path
        className="wall-barrier"
        d={`M${wall} 24V${lanes[0] - 9}M${wall} ${lanes[0] + 9}V${lanes[1] - 9}M${wall} ${lanes[1] + 9}V226`}
      />

      <text className="wall-col" x="304" y="40">destination</text>
      <text className="wall-col" x="544" y="40" textAnchor="end">verdict</text>
      <path className="wall-rule" d="M304 50H544" />

      {EGRESS.map((row, i) => {
        const y = lanes[i];
        const stop = row.ok ? wall : wall - 7;
        return (
          <g key={row.host}>
            <path
              className={row.ok ? "wall-ok" : "wall-no"}
              d={`M${exit} ${exitY}C${exit + 13} ${exitY} ${wall - 13} ${y} ${stop} ${y}`}
            />
            {row.ok ? (
              <path className="wall-ok" d={`M${wall} ${y}H292`} />
            ) : (
              <path className="wall-no" d={`M${wall - 6} ${y - 6}l12 12M${wall + 6} ${y - 6}l-12 12`} />
            )}
            <text className="wall-host" x="304" y={y + 4}>{row.host}</text>
            <text className={row.ok ? "wall-mark" : "wall-mark no"} x="544" y={y + 4} textAnchor="end">
              {row.ok ? "allowed" : "denied"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const MANIFESTS = [
  {
    id: "actor",
    label: "ActorTemplate",
    hint: "the object for an actor, including a harness",
    source: `apiVersion: ate.dev/v1alpha1
kind: ActorTemplate
metadata:
  name: codex
  namespace: kagent
spec:
  containers:
  - name: harness
    command: ["/app"]
  workerPoolRef:
    name: kagent-default
    namespace: kagent
  snapshotsConfig:
    location: gs://ate-snapshots/kagent/codex`,
    result: "actortemplate.ate.dev/codex  Ready",
  },
  {
    id: "pool",
    label: "WorkerPool",
    hint: "the warm pods actors land on",
    source: `apiVersion: ate.dev/v1alpha1
kind: WorkerPool
metadata:
  name: kagent-default
  namespace: kagent
spec:
  replicas: 3`,
    result: "workerpool.ate.dev/kagent-default  3/3 warm",
  },
] as const;

function colorLine(line: string) {
  if (line.trim().startsWith("#") || line.trim() === "") return <span className="c-dim">{line || " "}</span>;
  const keyed = line.match(/^(\s*)([A-Za-z][A-Za-z0-9]*)(:)(.*)$/);
  if (!keyed) return <span className="c-val">{line}</span>;
  return (
    <>
      <span>{keyed[1]}</span>
      <span className="c-key">{keyed[2]}</span>
      <span className="c-dim">{keyed[3]}</span>
      <span className="c-val">{keyed[4]}</span>
    </>
  );
}

function Manifests() {
  const [tab, setTab] = useState<(typeof MANIFESTS)[number]["id"]>("actor");
  const current = MANIFESTS.find((item) => item.id === tab) ?? MANIFESTS[0];

  return (
    <div className="manifest">
      <div className="manifest-tabs" role="tablist" aria-label="Resources">
        {MANIFESTS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === current.id}
            aria-controls="manifest-panel"
            className={item.id === current.id ? "on" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="manifest-panel"
        aria-labelledby={`tab-${current.id}`}
      >
        <p className="manifest-hint">{current.hint}</p>
        <pre>
          <code>
            {current.source.split("\n").map((line, i) => (
              <div key={i}>{colorLine(line)}</div>
            ))}
          </code>
        </pre>
        <p className="manifest-result">{current.result}</p>
      </div>
    </div>
  );
}

function Mark({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RuntimeHome() {
  return (
    <div className="rt">
      <section className="rt-hero">
        <HeroArt />
        <h1>
          <span>A handful of pods.</span> <span>A cluster full of agents.</span>
        </h1>
        <p className="rt-lead">
          kagent is the control plane. Agent Substrate is the runtime. Actors sleep in
          object storage and wake on any warm worker. A harness keeps a coding agent
          ready. An isolated sandbox wraps every one of them.
        </p>
        <div className="rt-ctas">
          <Link href="/docs/kagent/introduction/installation" className="hp-btn hp-btn-primary">
            Install kagent
          </Link>
          <a href="#workers" className="hp-btn hp-btn-ghost">
            See the runtime
          </a>
        </div>
        <InstallLine />
      </section>

      <section className="rt-terms" aria-label="Runtime vocabulary">
        <dl>
          {TERMS.map(([term, definition]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rt-facts" aria-label="Runtime characteristics">
        <article>
          <Mark d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
          <h2>Sub-second resume</h2>
          <p>A suspended actor restores onto a warm worker. The scheduler never sees it.</p>
        </article>
        <article>
          <Mark d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
          <h2>30× the actors</h2>
          <p>Eight pods hold 240 actors. Only the ones in a turn occupy a worker.</p>
        </article>
        <article>
          <Mark d="M12 3l8 4v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7z" />
          <h2>Isolated sandbox by default</h2>
          <p>Every actor and every harness gets its own sandbox. Egress starts closed.</p>
        </article>
      </section>

      <section className="rt-compare" id="workers">
        <h2>One pod per agent wastes the pod.</h2>
        <p>
          A worker is a warm isolated sandbox that hosts one actor at a time. Idle actors
          checkpoint to object storage and hold nothing, so a small pool runs far more
          agents than it has pods.
        </p>
        <Compare />
        <Link href="/docs/kagent/concepts/agent-substrate">Read how the pool works</Link>
      </section>

      <section className="bento" id="actors">
        <article>
          <div className="bento-art">
            <Lifecycle />
          </div>
          <h2>Actors sleep between turns</h2>
          <p>
            An actor template becomes an actor with its own memory and filesystem. Between
            messages Substrate snapshots that state and frees the worker. The next message
            restores it onto whichever worker is free.
          </p>
          <Link href="/docs/kagent/concepts/agent-substrate">See an actor template</Link>
        </article>
        <article id="harness">
          <div className="bento-art">
            <HarnessChain />
          </div>
          <h2>A harness stays up</h2>
          <p>
            A harness is an actor template that stays up. It runs Codex or Claude inside
            one long-lived actor, and kagent reaches it over A2A. Same sandbox. Many sessions.
          </p>
          <Link href="/docs/kagent/examples/agent-harness">Provision a harness</Link>
        </article>
        <article className="bento-wide" id="sandbox">
          <div className="bento-art">
            <Wall />
          </div>
          <div>
            <h2>The sandbox is the default</h2>
            <p>
              Untrusted code stays inside an isolated sandbox. Fresh filesystem, no path to the host.
              Traffic leaves only for hosts you name. The metadata address and the cluster
              network stop at the boundary.
            </p>
            <Link href="/docs/kagent/concepts/agent-substrate">How isolation works</Link>
          </div>
        </article>
      </section>

      <section className="rt-declare" id="declare">
        <div className="rt-declare-copy">
          <p className="rt-kicker">kubectl apply</p>
          <h2>Two objects. One install.</h2>
          <p>
            Declare a worker pool and an actor template. A harness is that same template,
            kept alive across sessions. kagent reconciles both onto Agent Substrate.
          </p>
        </div>
        <Manifests />
      </section>

      <section className="rt-logos" aria-label="Teams using kagent">
        <h2>Teams running kagent</h2>
        <div>
          {adopterList.map((adopter) => (
            <a key={adopter.name} href={adopter.website} target="_blank" rel="noreferrer">
              <img
                src={adopter.logo_dark || adopter.logo || adopter.logo_light || ""}
                alt={adopter.name}
              />
            </a>
          ))}
        </div>
      </section>

      <section className="rt-close">
        <h2>Install the control plane. The runtime comes with it.</h2>
        <InstallLine />
        <div className="rt-ctas">
          <Link href="/docs/kagent/getting-started/quickstart" className="hp-btn hp-btn-primary">
            Start the quickstart
          </Link>
          <a href={DISCORD_LINK} className="hp-btn hp-btn-ghost" target="_blank" rel="noreferrer">
            Join Discord
          </a>
          <a href={GITHUB_LINK} className="hp-btn hp-btn-ghost" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
