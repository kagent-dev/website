'use client';

import React from "react";
import { GitBranch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Discord from "@/components/icons/discord";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";
import Github from "@/components/icons/github";
import { KeyComponents } from "@/components/key-components";
import { UseCases } from "@/components/use-cases";
import Image from "next/image";
import { motion } from "framer-motion";

const MarketingPage = () => {
  return (
    <>
      {/* Animated Background */}
      <div className="gradient-bg" />

      {/* Hero Section */}
      <div className="pt-32 pb-16 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
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
            className="text-xl text-gray-400 mb-12 leading-relaxed"
          >
            An open-source framework for DevOps and platform engineers to run AI agents in Kubernetes, automating complex operations and troubleshooting tasks.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center space-x-4"
          >
            <Button size="lg" asChild className="hover:scale-105 transition-transform">
              <Link href="/docs/getting-started/quickstart">
                Quick Start <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-transform" asChild>
              <Link href="https://github.com/kagent-dev/kagent" target="_blank" rel="noopener noreferrer">
                View on GitHub <GitBranch className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="max-w-5xl flex items-center justify-center mx-auto mt-16"
        >
          <Image src="/images/hero.png" alt="Hero Image" width={800} height={600} className="rounded-lg shadow-2xl" />
        </motion.div>
      </div>

      {/* Key Components Section */}
      <div className="py-32 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-medium text-center mb-16">Built for cloud-native operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <KeyComponents />
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-32 bg-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-medium text-center mb-16">Common challenges solved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <UseCases />
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-medium mb-8">
            Get involved with the <span className="text-violet-500 font-semibold">kagent</span> community
          </h2>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Whether you&apos;re a platform engineer, DevOps professional, or CNCF project maintainer, help us build and shape the future of AI-driven cloud-native operations with kagent.
          </p>
          <div className="flex justify-center space-x-6">
            <Button size="lg">
              <Discord />
              <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                Discord
              </Link>
            </Button>
            <Button size="lg">
              <Github />
              <Link href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarketingPage;
