"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Info, ExternalLink, Cog } from "lucide-react";
import Link from "next/link";
import { agents } from "@/data/agents";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const AgentPage = () => {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = agents.find((agent) => agent.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-2xl mb-4">😕</div>
        <h1 className="text-xl font-medium mb-2">Agent not found</h1>
        <p className="text-muted-foreground mb-6">We couldn&apos;t find an agent with ID: {agentId}</p>
        <Button asChild>
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Registry
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/agents" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to the registry
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 text-3xl sm:text-4xl bg-primary/10 rounded-lg">{agent.icon}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium">{agent.name}</h1>
              <p className="text-muted-foreground text-base sm:text-lg mt-2">{agent.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* System Message */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Agent Instructions (system prompt)</CardTitle>
              </div>
              <CardDescription>Instructions that define this agents&apos; behavior</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="prose w-full max-w-none dark:prose-invert">
                <ReactMarkdown>{agent.systemMessage.join("\n")}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tools Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cog className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Tools</CardTitle>
                </div>
                <Badge variant="outline" className="ml-2">
                  {agent.tools?.length || 0}
                </Badge>
              </div>
              <CardDescription>Tools agent has access to</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {agent.tools && agent.tools.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {agent.tools.map((tool) => (
                    <div key={tool.id} className="text-sm text-muted-foreground truncate">
                      {tool.provider}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tools available</p>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" asChild>
            <Link href="/docs/getting-started/quickstart">
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
