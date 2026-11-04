import type { Metadata } from "next";
import RuntimeHome from "@/components/runtime-home";

export const metadata: Metadata = {
  title: "kagent — run agents on Agent Substrate",
  description:
    "kagent runs Agent Substrate on Kubernetes. Actors suspend to object storage and resume on warm workers. Harnesses keep a coding agent ready. Every workload is an isolated sandbox.",
};

export default function Page() {
  return <RuntimeHome />;
}
