import { Bot, RefreshCw } from "lucide-react";
import { Chip, Frame, dotGrid } from "./blueprint";

/** The per-pod process overhead: runtime, sidecars, health checks. */
function Overhead({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kg-tx3 text-kg-tx3 ${className}`}
    >
      <RefreshCw className="h-[15px] w-[15px]" />
    </span>
  );
}

const podCls = "relative flex h-[108px] w-[108px] flex-col justify-between border border-kg-bd bg-kg-panel p-2.5";

/**
 * "Pod per agent" against "worker pool": the same nine agents, with the
 * process overhead paid once instead of once per agent.
 */
export function ArchitecturePanel({ className = "" }: { className?: string }) {
  return (
    <Frame label="pod per agent vs agent substrate" className={`${dotGrid} px-6 py-12 sm:px-12 ${className}`}>
      <div className="flex flex-wrap items-start justify-center gap-x-16 gap-y-10">
        <figure className="m-0 flex flex-col items-center gap-5">
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={podCls}>
                <Chip icon={Bot} />
                <Overhead className="self-end" />
              </div>
            ))}
          </div>
          <figcaption className="text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-tx3">
            pod per agent
            <br />4 agents · 4× overhead
          </figcaption>
        </figure>

        <figure className="m-0 flex flex-col items-center gap-5">
          <div className={`${podCls} h-[226px] w-[226px] p-3`}>
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }, (_, i) => (
                <Chip key={i} icon={Bot} />
              ))}
            </div>
            <Overhead className="self-end" />
          </div>
          <figcaption className="text-center font-mono text-[11.5px] leading-[1.5] tracking-[0.06em] text-kg-acc">
            agent substrate worker pool
            <br />9 agents · 1× overhead
          </figcaption>
        </figure>

        <ul className="m-0 flex list-none flex-col gap-4 p-0 pt-2 font-mono text-[12px] tracking-[0.05em] text-kg-tx2">
          <li className="flex items-center gap-3.5">
            <Chip icon={Bot} /> agent
          </li>
          <li className="flex items-center gap-3.5">
            <Overhead /> pod overhead
          </li>
        </ul>
      </div>
    </Frame>
  );
}
