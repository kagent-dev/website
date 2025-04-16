"use client";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GITHUB_LINK } from "@/data/links";
import Link from "next/link";
import { agents } from "@/data/agents";
import AgentCard from "@/components/agent-card";
import { Background } from "@/components/background";

const AgentsRegistry = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Background />
      <div className="min-h-screen">
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-medium mb-4">Agents Registry</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Discover and use AI agents to automate your work
            </p>

            <div className="relative max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-2 h-5 w-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Search agents..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
          {/* Bottom CTA Section */}
          <div className="mt-20 py-12 px-8 border border-white/10 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 text-center">
            <h2 className="text-2xl font-medium mb-3">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              Build and contribute your own agents to the registry to help make
              agents smarter and more powerful
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href={GITHUB_LINK} target="_blank" rel="noopener noreferrer">
                <Plus className="h-5 w-5" />
                Create Your Own Agent
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentsRegistry;
