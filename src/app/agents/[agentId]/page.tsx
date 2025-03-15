"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agents } from "@/data/agents";

const AgentPage = () => {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = agents.find((agent) => agent.id === agentId);

  if (!agent) {
    return <div>Agent not found {agentId}</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Link
            href="/agents"
            className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to the registry
          </Link>
          <div className="flex items-center space-x-3">
            <span className="text-2xl sm:text-3xl">{agent.icon}</span>
            <h1 className="text-2xl sm:text-3xl font-medium">{agent.name}</h1>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
            {agent.description}
          </p>
        </div>
      </div>
      {/* system message */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
            System Prompt:
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
            {agent.systemMessage.map((message, i) => (
              <p key={i}>{message}</p>
            ))}
          </p>
        </div>
      </div>
      {/* list card for all tool */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-base sm:text-lg mt-3 sm:mt-4">
              {agent.tools?.length} tools available
            </h2>
            <div className="flex flex-col gap-2">
              {agent.tools?.map((tool) => (
                <div key={tool.id}>
                  <Badge variant="outline">{tool.provider}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
