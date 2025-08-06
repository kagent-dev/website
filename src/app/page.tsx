'use client';

import React from "react";
import { GitBranch, ArrowRight, Code, Bot, Rocket, Network, BarChart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Discord from "@/components/icons/discord";
import { DISCORD_LINK } from "@/data/links";
import Github from "@/components/icons/github";
import KagentLogo from "@/components/icons/kagent-logo";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { motion } from "framer-motion";
import KMCPIcon from "@/components/icons/kmcpicon";
import adopters from "@/data/adopters.yaml";

interface Adopter {
  name: string;
  logo: string;
  website: string;
}

const MarketingPage = () => {
  const benefits = [
    {
      title: "Open Standards",
      icon: Code,
      description: "Built on Agent2Agent (A2A) protocol, Agent Development Kit (ADK), and Model Context Protocol (MCP). We leverage open standards for vendor independence and long-term maintainability."
    },
    {
      title: "Cloud Native Ready",
      icon: Rocket,
      description: "Designed for Kubernetes environments from day one. Deploy, scale, and manage AI applications and workloads with cloud-native best practices and enterprise reliability."
    },
    {
      title: "Observability",
      icon: BarChart,
      description: "Gain full visibility into AI agent operations with detailed observability, performance metrics, and audit trails. Debug, optimize, and maintain confidence in your autonomous systems."
    }];

  // Use cases data made more general
  const challenges = [
    {
      title: "Automated Operations",
      icon: Bot,
      description: "Reduce manual intervention in complex DevOps workflows with intelligent automation and decision-making capabilities."
    },
    {
      title: "Connection Issues",
      icon: Network,
      description: "Pinpoint broken links in multi-hop connections and diagnose application unreachability."
    },
    {
      title: "Performance Analysis",
      icon: BarChart,
      description: "Diagnose and fix application performance degradation automatically."
    },
    {
      title: "Traffic Configuration",
      icon: Settings,
      description: "Troubleshoot Gateway and HTTPRoute issues for proper traffic management."
    }
  ];

  return (
    <>
      {/* Animated Background */}
      <div className="gradient-bg" />

      {/* Hero Section */}
      <div className="pt-32 pb-16 relative">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-medium tracking-tight mb-8"
          >
            Bringing <span className="text-primary">Agentic AI</span> to cloud native
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12 leading-relaxed"
          >
            Open-source tools for DevOps and platform engineers to build, deploy, and run AI-powered solutions in Kubernetes. From intelligent agents to MCP servers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center space-x-4"
          >
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
              <Link href="/docs/kagent/getting-started/quickstart">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-transform" asChild>
              <Link href="https://github.com/kagent-dev" target="_blank" rel="noopener noreferrer">
                View on GitHub <GitBranch className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="max-w-6xl flex flex-col items-center justify-center mx-auto px-6"
        >
          <Image src="/images/hero.png" alt="kagent Architecture" width={800} height={600} className="rounded-lg shadow-2xl" />
        </motion.div>
      </div>

      {/* Projects Section */}
      <div className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-medium text-center mb-20 text-foreground"
          >
            Our projects
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* kagent Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="relative bg-muted/50 backdrop-blur-sm border border-border rounded-3xl p-10">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-6">
                    <KagentLogo className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold text-foreground">kagent</h3>
                    <p className="text-lg text-muted-foreground">Agentic AI Framework</p>
                  </div>
                </div>
                <p className="text-lg text-foreground mb-8 leading-relaxed">
                  An open-source framework for running AI agents in Kubernetes, automating complex DevOps operations and troubleshooting tasks with intelligent workflows.
                </p>
                <div className="flex space-x-4">
                  <Button variant="outline" asChild className="hover:scale-105 transition-transform hover:shadow-lg">
                    <Link href="/docs/kagent/getting-started/quickstart">
                      Quick Start
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="hover:scale-105 transition-transform hover:bg-muted">
                    <Link href="https://github.com/kagent-dev/kagent" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* kmcp Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-muted/50 backdrop-blur-sm border border-border rounded-3xl p-10">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mr-6">
                    <KMCPIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold text-foreground">kmcp</h3>
                    <p className="text-lg text-muted-foreground">MCP Kubernetes toolkit</p>
                  </div>
                </div>
                <p className="text-lg text-foreground mb-8 leading-relaxed">
                  The easiest way to create, deploy, and securely run MCP servers on Kubernetes — from development to production scale.
                </p>
                <div className="flex space-x-4">
                  <Button variant="outline" asChild className="hover:scale-105 transition-transform hover:shadow-lg">
                    <Link href="/docs/kmcp/quickstart">
                      Quick Start
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="hover:scale-105 transition-transform hover:bg-muted">
                    <Link href="https://github.com/kagent-dev/kmcp" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-medium text-center mb-20 text-foreground">Why choose our projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-muted/50 border-border p-8">
                <CardHeader className="space-y-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl text-foreground">{benefit.title}</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground leading-relaxed">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>



      {/* Challenges Section */}
      <div className="py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-medium text-center mb-20 text-foreground">Common challenges solved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {challenges.map((challenge, index) => (
              <Card key={index} className="bg-muted/50 border-border p-8">
                <CardHeader className="space-y-6">
                  <challenge.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl text-foreground">{challenge.title}</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground leading-relaxed">{challenge.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-32 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-medium mb-12 text-foreground">
            Get involved with our <span className="text-violet-500 font-semibold">community</span>
          </h2>
          <p className="text-2xl text-muted-foreground mb-16 leading-relaxed">
            Whether you&apos;re a platform engineer, DevOps professional, or CNCF project maintainer, help us build and shape the future of AI-driven cloud-native operations.
          </p>
          <div className="flex justify-center space-x-8">
            <Button size="lg" className="text-lg px-8 py-4">
              <Discord className="mr-3" />
              <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                Discord
              </Link>
            </Button>
            <Button size="lg" className="text-lg px-8 py-4">
              <Github className="mr-3" />
              <Link href="https://github.com/kagent-dev" target="_blank" rel="noopener noreferrer">
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Adopters Section */}
      <div className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-medium text-center mb-20 text-foreground">Who uses our <span className="text-violet-500 font-semibold">projects</span></h2>
          <div className="overflow-x-auto">
            <div className="flex justify-center items-center gap-10 flex-wrap">
              {adopters.adopters.map((adopter: Adopter, index: number) => (
                <div key={index} className="flex justify-center items-center">
                  <Link href={adopter.website} target="_blank" rel="noopener noreferrer">
                    <Image src={adopter.logo} alt={adopter.name} width={150} height={100} className="object-contain" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="https://github.com/kagent-dev/website?tab=readme-ov-file#adopters" target="_blank" rel="noopener noreferrer" className="text-sm underline hover:underline hover:text-primary">
              Add your logo here
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketingPage;
