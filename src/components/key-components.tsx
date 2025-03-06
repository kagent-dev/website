"use client";
import { Wrench, Code } from "lucide-react";
import { useRouter } from "next/navigation";
import KagentLogo from "./icons/kagent-logo";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

const keyComponents = [
  {
    title: "Tools",
    icon: Wrench,
    link: "/tools",
    description: "Predefined functions for AI agents to interact with Kubernetes, Prometheus, Istio, Argo, Helm, and other cloud-native projects",
  },
  {
    title: "Agents",
    icon: KagentLogo,
    link: "/agents",
    description: "Autonomous systems that plan, execute tasks, analyze results, and continuously improve outcomes",
  },
  {
    title: "Framework",
    icon: Code,
    link: "/docs/concepts",
    description: "Simple CLI and UI interface to run agents, with full extensibility for custom solutions",
  },
];

export function KeyComponents() {
  const router = useRouter();
  return keyComponents.map((component, index) => (
    <Card key={index} className="bg-white/5 border-white/10 group  hover:border-violet-500/50 hover:cursor-pointer" onClick={() => router.push(component.link)}>
      <CardHeader>
        <component.icon className="h-6 w-6 text-violet-400 group-hover:text-violet-600 mb-4" />
        <CardTitle>{component.title}</CardTitle>
        <CardDescription className="text-gray-400">{component.description}</CardDescription>
      </CardHeader>
    </Card>
  ));
}
