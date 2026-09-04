import { Bot } from "lucide-react";
import { Chip, Frame, Tag } from "./blueprint";

/*
 * Schematic above the hero headline: manifests and skills flow in from the
 * left, tools and channels connect on the right, agents sit in the middle.
 * The SVG and the HTML overlays share one 1160x210 coordinate space.
 */

const PATHS = [
  "M 232 30 C 350 30, 380 90, 470 90",
  "M 300 180 C 390 180, 400 125, 470 125",
  "M 905 30 C 800 30, 780 90, 690 90",
  "M 940 180 C 830 180, 780 125, 690 125",
];

export function HeroSchematic() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[1160px] aspect-[1160/210] md:block" aria-hidden>
      <svg viewBox="0 0 1160 210" className="absolute inset-0 h-full w-full text-kg-tx3" fill="none">
        {PATHS.map((d) => (
          <path key={d} d={d} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 5" />
        ))}
      </svg>
      <Tag className="absolute left-[1.7%] top-[14.3%] -translate-y-1/2">kubectl apply -f agent.yaml</Tag>
      <Tag className="absolute left-[3.4%] top-[85.7%] -translate-y-1/2">skills · ghcr.io/acme/k8s-deploy</Tag>
      <Tag className="absolute right-[1.7%] top-[14.3%] -translate-y-1/2">mcp servers · kagent-tool-server</Tag>
      <Tag className="absolute right-[3.4%] top-[85.7%] -translate-y-1/2">a2a · slack · dashboard</Tag>
      <Frame
        label="agents"
        className="absolute left-1/2 top-1/2 flex h-[100px] w-[220px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-3 bg-kg-pg"
      >
        <Chip icon={Bot} />
        <Chip icon={Bot} />
        <Chip icon={Bot} />
      </Frame>
    </div>
  );
}
