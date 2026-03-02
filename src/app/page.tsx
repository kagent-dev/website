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
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface Adopter {
  name: string;
  logo?: string;
  logo_light?: string;
  logo_dark?: string;
  website: string;
}

const MarketingPage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get the appropriate logo based on theme
  const getAdopterLogo = (adopter: Adopter): string => {
    // If separate light/dark logos are provided, use them based on theme
    if (adopter.logo_light && adopter.logo_dark && mounted) {
      return resolvedTheme === 'dark' ? adopter.logo_dark : adopter.logo_light;
    }
    // Fall back to single logo or light logo if not mounted yet
    return adopter.logo || adopter.logo_light || '';
  };

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
            className="text-5xl md:text-6xl font-medium tracking-tight mb-8 font-heading"
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-medium text-center mb-20 text-foreground font-heading"
          >
            Our projects
          </motion.h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* kagent Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="relative bg-muted/50 backdrop-blur-sm border border-border rounded-3xl p-10 card-gradient-border card-top-accent transition-shadow duration-300 hover:shadow-lg">
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
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-muted/50 backdrop-blur-sm border border-border rounded-3xl p-10 card-gradient-border card-top-accent transition-shadow duration-300 hover:shadow-lg">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-accent-pop/10 rounded-2xl flex items-center justify-center mr-6">
                    <KMCPIcon className="w-8 h-8 text-accent-pop" />
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
                  <Button variant="outline" asChild className="hover:scale-105 transition-transform hover:shadow-lg border-accent-pop/30 hover:border-accent-pop/60">
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

      {/* Benefits Section - Lead with a full-width highlight, then two cards */}
      <div className="py-32 dot-grid-bg">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-medium text-center mb-20 text-foreground font-heading"
          >
            Why choose our projects
          </motion.h2>

          {/* First benefit - full width highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            {(() => { const LeadIcon = benefits[0].icon; return (
            <Card className="bg-muted/50 border-border p-10 card-gradient-border card-top-accent transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="space-y-0 gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <LeadIcon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-3xl text-foreground font-heading">{benefits[0].title}</CardTitle>
                </div>
                <CardDescription className="text-lg text-muted-foreground leading-relaxed max-w-4xl">{benefits[0].description}</CardDescription>
              </CardHeader>
            </Card>
            ); })()}
          </motion.div>

          {/* Remaining benefits - two-column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {benefits.slice(1).map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              >
                <Card className="bg-muted/50 border-border p-8 h-full card-gradient-border card-top-accent transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="space-y-6">
                    <div className="w-12 h-12 rounded-xl bg-accent-pop/10 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-accent-pop" />
                    </div>
                    <CardTitle className="text-2xl text-foreground font-heading">{benefit.title}</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground leading-relaxed">{benefit.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges Section - Alternating left/right layout */}
      <div className="py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-medium text-center mb-20 text-foreground font-heading"
          >
            Common challenges solved
          </motion.h2>
          <div className="space-y-6">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={index % 2 !== 0 ? 'md:ml-auto md:w-5/6' : 'md:w-5/6'}
              >
                <Card className="bg-muted/50 border-border p-8 card-gradient-border card-top-accent transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="space-y-0 gap-4 flex-row items-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <challenge.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-xl text-foreground font-heading">{challenge.title}</CardTitle>
                      <CardDescription className="text-base text-muted-foreground leading-relaxed">{challenge.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-32 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-medium mb-12 text-foreground font-heading">
              Get involved with our <span className="text-primary font-semibold">community</span>
            </h2>
            <p className="text-2xl text-muted-foreground mb-16 leading-relaxed">
              Whether you&apos;re a platform engineer, DevOps professional, or CNCF project maintainer, help us build and shape the future of AI-driven cloud-native operations.
            </p>
            <div className="flex justify-center space-x-8">
              <Button size="lg" asChild className="text-lg px-8 py-4">
                <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                  <Discord className="mr-3" />
                  Discord
                </Link>
              </Button>
              <Button size="lg" asChild className="text-lg px-8 py-4 bg-accent-pop hover:bg-accent-pop/90">
                <Link href="https://github.com/kagent-dev" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-3" />
                  GitHub
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Adopters Section */}
      <div className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-medium text-center mb-20 text-foreground font-heading"
          >
            Who uses our <span className="text-primary font-semibold">projects</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="overflow-x-auto"
          >
            <div className="flex justify-center items-center gap-10 flex-wrap">
              {adopters.adopters.map((adopter: Adopter, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * index }}
                  className="flex justify-center items-center transition-opacity hover:opacity-75"
                >
                  <Link href={adopter.website} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={getAdopterLogo(adopter)}
                      alt={adopter.name}
                      width={150}
                      height={100}
                      className="object-contain"
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
