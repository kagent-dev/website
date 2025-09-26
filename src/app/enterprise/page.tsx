'use client';

import React from "react";
import { ExternalLink, Users, BookOpen, Building2, Code, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

// Import data
import distributions from "@/data/enterprise-distributions.yaml";
import training from "@/data/enterprise-training.yaml";
import { DISCORD_LINK, GITHUB_LINK } from "@/data/links";

// Types
interface Distribution {
  name: string;
  title: string;
  description: string;
  logo_light?: string;
  logo_dark?: string;
  logo?: string;
  website: string;
  cta_text: string;
}

interface Training {
  title: string;
  description: string;
  url: string;

}

const EnterprisePage = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get the appropriate logo based on theme
  const getDistributionLogo = (distribution: Distribution): string => {
    if (distribution.logo_light && distribution.logo_dark && mounted) {
      return resolvedTheme === 'dark' ? distribution.logo_dark : distribution.logo_light;
    }
    return distribution.logo || distribution.logo_light || '';
  };

  const getCncfLogo = (): string => {
    if (mounted) {
      return resolvedTheme === 'dark' ? "/images/contributors/cncf-dark.png" : "/images/contributors/cncf-light.png";
    }
    return "/images/contributors/cncf-light.png";
  };

  // Community contributors data
  const contributors = [
    { name: "Google", logo: "/images/contributors/google.svg" },
    { name: "Confluent", logo: "/images/contributors/confluent.svg" },
    { name: "Adobe", logo: "/images/contributors/adobe.svg" },
    { name: "Red Hat", logo: "/images/contributors/redhat.svg" },
    { name: "IBM", logo: "/images/contributors/ibm.svg" },
    { name: "Microsoft", logo: "/images/contributors/microsoft.svg" },
  ];

  return (
    <>
      {/* Animated Background */}
      <div className="gradient-bg" />

      {/* Hero Section */}
      <div className="pt-32 pb-16 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl font-medium tracking-tight mb-6"
              >
                Kagent <span className="text-primary">Enterprise</span> Distributions & Training
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-muted-foreground mb-8 leading-relaxed"
              >
                Kagent was originally created by <Link href="https://solo.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Solo.io</Link> and is a <Link href="https://cncf.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">CNCF</Link> project. The listed partners offer enterprise distributions, training, and commercial support for kagent.
              </motion.p>
            </div>
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Image
                  src={getCncfLogo()}
                  alt="CNCF"
                  width={300}
                  height={150}
                  className="object-contain"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Distributions & Support Section */}
      <div className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-medium text-foreground">Distributions & Support</h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {distributions.distributions.map((distribution: Distribution, index: number) => (
              <motion.div
                key={distribution.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              >
                <Card className="bg-muted/50 border-border p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                      <div className="flex-shrink-0">
                        {getDistributionLogo(distribution) && (
                          <Image
                            src={getDistributionLogo(distribution)}
                            alt={distribution.name}
                            width={120}
                            height={60}
                            className="object-contain"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-foreground mb-2">
                          {distribution.title}
                        </h3>
                        <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                          {distribution.description}
                        </p>
                        <Button asChild className="hover:scale-105 transition-transform">
                          <Link href={distribution.website} target="_blank" rel="noopener noreferrer">
                            {distribution.cta_text}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Training Section */}
      <div className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-medium text-foreground">Training</h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            {training.training.map((course: Training, index: number) => (
              <motion.div
                key={course.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              >
                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-foreground mb-2">
                          {course.title}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-lg leading-relaxed">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button asChild size="lg" className="hover:scale-105 transition-transform">
                        <Link href={course.url} target="_blank" rel="noopener noreferrer">
                          Get started
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-3xl font-medium text-foreground">Our Contributors</h2>
            </div>

            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Kagent is supported by contributions from leading technology companies and organizations worldwide.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center mb-16"
          >
            {contributors.map((contributor, index) => (
              <motion.div
                key={contributor.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="group transition-all duration-300"
              >
                {contributor.logo && (
                  <Image
                    src={contributor.logo}
                    alt={contributor.name}
                    width={300}
                    height={150}
                    className="object-contain"
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-8">Get Involved</h3>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button asChild className="hover:scale-105 transition-transform">
                <Link href={DISCORD_LINK} target="_blank" rel="noopener noreferrer">
                  <Users className="w-4 h-4 mr-2" />
                  Join us on Discord
                </Link>
              </Button>
              <Button variant="outline" asChild className="hover:scale-105 transition-transform">
                <Link href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                  <Code className="w-4 h-4 mr-2" />
                  Contribute on GitHub
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <Link href="https://linkedin.com/company/kagent/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Follow us on LinkedIn
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="https://www.youtube.com/@kagentproject" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Watch us on YouTube
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="https://www.solo.io/resources/lab/kagent-lab-discover-kagent-kmcp" className="text-muted-foreground hover:text-primary transition-colors">
                Explore kagent Labs
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default EnterprisePage;
