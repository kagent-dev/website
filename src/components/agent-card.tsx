import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Agent } from "@/data/agents";

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="block h-full group"
    >
      <Card className="flex h-full flex-col card-gradient-border card-top-accent transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-heading">
            <span className="text-2xl">{agent.icon}</span>
            <span>{agent.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <p className="text-muted-foreground flex-1">{agent.description}</p>
          <div className="mt-4 flex items-center text-sm text-primary transition-transform duration-200 group-hover:translate-x-1">
            View Agent <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AgentCard;
