import { Bot, Boxes, Cpu, FileText, Layers, Wrench } from "lucide-react";
import { Chip, Frame } from "./blueprint";

/*
 * Schematic above the hero headline: the kagent object model. A template
 * (what the agent can do) and a harness (how it runs) derive an agent; every
 * conversation with it becomes an AgentInstance, scheduled as a Substrate
 * actor onto one of the harness's workers.
 *
 * The SVG and the HTML overlays share one 1160x230 coordinate space. The
 * frames are fixed-size and pinned to the edges, so the paths overshoot a
 * little into them and stay connected as the container scales down.
 */

const PATHS = [
  // template -> agent, harness -> agent
  "M 290 58 C 360 58, 380 100, 440 100",
  "M 290 172 C 360 172, 380 130, 440 130",
  // agent -> three instances
  "M 700 115 C 780 115, 800 62, 870 62",
  "M 700 115 L 870 115",
  "M 700 115 C 780 115, 800 168, 870 168",
];

const sideFrame = "flex h-full w-full items-center gap-3 bg-kg-pg px-4";
const note = "whitespace-nowrap font-mono text-[10.5px] leading-[1.5] tracking-[0.04em] text-kg-tx3";

export function HeroSchematic() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[1160px] aspect-[1160/230] lg:block" aria-hidden>
      <svg viewBox="0 0 1160 230" className="absolute inset-0 h-full w-full text-kg-tx3" fill="none">
        {PATHS.map((d) => (
          <path key={d} d={d} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 5" />
        ))}
      </svg>

      {/* What the agent can do */}
      <div className="absolute left-0 top-[8.7%] h-[76px] w-[300px]">
        <Frame label="AgentTemplate" className={sideFrame}>
          <Chip icon={Cpu} />
          <Chip icon={FileText} />
          <Chip icon={Wrench} />
          <span className={`ml-auto ${note}`}>
            model · prompt
            <br />
            tools · skills
          </span>
        </Frame>
      </div>

      {/* How it runs */}
      <div className="absolute left-0 top-[58.3%] h-[76px] w-[300px]">
        <Frame label="Harness" className={sideFrame}>
          <Chip icon={Boxes} />
          <Chip icon={Layers} />
          <span className={`ml-auto ${note}`}>
            runtime
            <br />
            worker pool
          </span>
        </Frame>
      </div>

      {/* Derived from the two */}
      <div className="absolute left-1/2 top-1/2 h-[92px] w-[260px] -translate-x-1/2 -translate-y-1/2">
        <Frame label="Agent · derived" className="flex h-full w-full items-center gap-4 bg-kg-pg px-5">
          <Chip icon={Bot} />
          <span className="whitespace-nowrap font-mono text-[11px] leading-[1.6] tracking-[0.04em] text-kg-tx2">
            k8s-assistant
            <br />
            <span className="text-kg-tx3">template + harness</span>
          </span>
        </Frame>
      </div>

      {/* One actor per conversation */}
      <div className="absolute right-0 top-[8.7%] h-[190px] w-[290px]">
        <Frame label="AgentInstances · actors" className="flex h-full w-full items-center justify-center gap-5 bg-kg-pg px-5">
          <div className="flex flex-col gap-2 border border-kg-bd bg-kg-panel p-2.5">
            <div className="grid grid-cols-3 gap-2">
              <Chip icon={Bot} />
              <Chip icon={Bot} />
              <Chip icon={Bot} muted />
              <Chip icon={Bot} muted />
              <Chip icon={Bot} />
              <Chip icon={Bot} muted />
            </div>
            <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.05em] text-kg-tx4">worker · kagent-default</span>
          </div>
          <span className={note}>
            one chat
            <br />
            one actor
          </span>
        </Frame>
      </div>
    </div>
  );
}
