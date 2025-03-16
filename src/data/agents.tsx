import { ReactNode } from "react";
import { BotIcon } from "lucide-react";
import { HelmIcon } from "@/components/icons/helm";
import { IstioIcon } from "@/components/icons/istio";
import { KubernetesIcon } from "@/components/icons/kubernetes";
import { PrometheusIcon } from "@/components/icons/prometheus";
import { ArgoIcon } from "@/components/icons/argo";
import { GrafanaIcon } from "@/components/icons/grafana";
import { getToolByProvider, Tool } from "./tools";
// NOTE: to produce this file, run the following command:
// helm template <path to kagent repo>/helm/ | yq ea '[.]' -o=json - | jq '[.[] | select(.kind == "Agent")]' > src/data/agents.json
import agentConfigs from "./agents.json";

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemMessage: string[];
  icon: ReactNode;
  tools?: Tool[];
}

// Function to load agents from configuration JSON
const loadAgentsFromConfig = (): Agent[] => {
  try {
    return agentConfigs.map((config) => {
      // Determine the icon based on the provider prefix
      let icon: ReactNode;

      if (config.metadata.name.toLowerCase().includes("observability")) {
        icon = <PrometheusIcon className="w-10 h-10" />;
      } else if (config.metadata.name.toLowerCase().includes("k8s")) {
        icon = <KubernetesIcon className="w-10 h-10" />;
      } else if (config.metadata.name.toLowerCase().includes("istio")) {
        icon = <IstioIcon className="w-10 h-10" />;
      } else if (config.metadata.name.toLowerCase().includes("helm")) {
        icon = <HelmIcon className="w-10 h-10" />;
      } else if (config.metadata.name.toLowerCase().includes("argo")) {
        icon = <ArgoIcon className="w-10 h-10" />;
      } else if (config.metadata.name.toLowerCase().includes("grafana")) {
        icon = <GrafanaIcon className="w-10 h-10" />;
      } else {
        // Default icon for other agents
        icon = <BotIcon className="w-10 h-10" />;
      }

      // Create a standardized agent object
      const result: Agent = {
        id: config.metadata.name.toLowerCase().replace(/\s+/g, "-"),
        name: config.metadata.name,
        description: config.spec.description,
        systemMessage: config.spec.systemMessage.split("\n"),
        icon,
        tools: config.spec.tools
          ?.map((tool) => {
            const toolConfig = getToolByProvider(tool.provider);
            if (!toolConfig) {
              return null;
            }
            return {
              ...toolConfig,
              config: tool.config,
            };
          })
          .filter(Boolean) as Tool[],
      };
      return result;
    });
  } catch (error) {
    console.error("Failed to load agents configuration:", error);
    return [];
  }
};

// Load agents from configuration
export const agents: Agent[] = loadAgentsFromConfig();
