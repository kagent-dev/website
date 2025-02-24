import React from "react";
import { Bot, Wrench, GitBranch, ArrowRight, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const MarketingPage = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-8">
            Bringing <span className="text-primary">Agentic AI</span> to cloud native
          </h1>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            An open-source framework for DevOps and platform engineers to run AI agents in Kubernetes, automating complex operations and troubleshooting tasks.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/docs/quickstart">
                Quick Start <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="" asChild>
              <Link href="https://github.com/kagent-dev/kagent" target="_blank" rel="noopener noreferrer">
                View on GitHub <GitBranch className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Components Section */}
      <div className="py-32 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-medium text-center mb-16">Built for cloud-native operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Wrench className="h-6 w-6 text-violet-500 mb-4" />
                <CardTitle>Tools</CardTitle>
                <CardDescription className="text-gray-400">Pre-defined functions for AI agents to interact with Kubernetes, Prometheus, Istio, and Argo</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Bot className="h-6 w-6 text-violet-500 mb-4" />
                <CardTitle>Agents</CardTitle>
                <CardDescription className="text-gray-400">Autonomous systems that plan, execute tasks, analyze results, and continuously improve outcomes</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Code className="h-6 w-6 text-violet-500 mb-4" />
                <CardTitle>Framework</CardTitle>
                <CardDescription className="text-gray-400">Simple interface to run agents via UI or declaratively, with full extensibility for custom solutions</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-32 bg-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-medium text-center mb-16">Common challenges solved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle>{useCase.title}</CardTitle>
                  <CardDescription className="text-gray-400">{useCase.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-medium mb-8">Join the kagent Community</h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Whether you&apos;re a platform engineer, DevOps professional, or CNCF project maintainer, help us build the future of AI-driven cloud-native operations.
          </p>
          <div className="flex justify-center space-x-6">
            <Button variant="outline" size="lg">
              Join CNCF Slack
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="https://github.com/kagent-dev/kagent" target="_blank" rel="noopener noreferrer">
                Contribute
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const useCases = [
  {
    title: "Connection Issues",
    description: "Pinpoint broken links in multi-hop connections and diagnose application unreachability",
  },
  {
    title: "Performance Analysis",
    description: "Diagnose and fix application performance degradation automatically",
  },
  {
    title: "Alert Management",
    description: "Generate intelligent alerts and bug reports from Prometheus based on specific conditions",
  },
  {
    title: "Traffic Configuration",
    description: "Troubleshoot Gateway and HTTPRoute issues for proper traffic management",
  },
];

export default MarketingPage;
