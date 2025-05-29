import { ReactNode } from "react";
import { BotIcon } from "lucide-react";
import { HelmIcon } from "@/components/icons/helm";
import { IstioIcon } from "@/components/icons/istio";
import { KubernetesIcon } from "@/components/icons/kubernetes";
import { PrometheusIcon } from "@/components/icons/prometheus";
import { ArgoIcon } from "@/components/icons/argo";
import { GrafanaIcon } from "@/components/icons/grafana";
import { getToolByProvider } from "./tools";
import { CiliumIcon } from "@/components/icons/cilium";
import KGatewayIcon from "@/components/icons/kgateway";

// NOTE: to produce this file, run the following command:
// helm template <path to kagent repo>/helm/ | yq ea '[.]' -o=json - | jq '[.[] | select(.kind == "Agent")]' > src/data/agents.json
import agentConfigs from "./agents.json";

interface BuiltinTool {
  type: string;
  builtin: {
    name: string;
  };
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemMessage: string[];
  icon: ReactNode;
  tools?: BuiltinTool[];
}

// Function to load agents from configuration JSON
const loadAgentsFromConfig = (): Agent[] => {
  try {
    return agentConfigs.map((config) => {
      // Determine the icon based on the provider prefix
      let icon: ReactNode;

      if (config.name.toLowerCase().includes("observability")) {
        icon = <PrometheusIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("k8s")) {
        icon = <KubernetesIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("istio")) {
        icon = <IstioIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("helm")) {
        icon = <HelmIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("argo")) {
        icon = <ArgoIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("grafana")) {
        icon = <GrafanaIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("cilium")) {
        icon = <CiliumIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("kgateway")) {
        icon = <KGatewayIcon className="w-10 h-10" />;
      } else if (config.name.toLowerCase().includes("promql")) {
        icon = <PrometheusIcon className="w-10 h-10" />;
      } else {
        // Default icon for other agents
        icon = <BotIcon className="w-10 h-10" />;
      }

      // Create a standardized agent object
      const result: Agent = {
        id: config.name.toLowerCase().replace(/\s+/g, "-"),
        name: config.name,
        description: config.description,
        systemMessage: config.systemMessage.split("\n"),
        icon,
        tools: config.tools
          ?.map((tool) => {
            const toolName = tool.builtin?.name;
            if (!toolName || !tool.builtin) {
              return null;
            }
            // Validate that the tool is known/registered
            const isValidTool = getToolByProvider(toolName);
            if (!isValidTool) {
              return null; // Filter out unrecognized tools
            }
            // Construct an object that matches the BuiltinTool interface
            return {
              type: tool.type,
              builtin: {
                name: tool.builtin.name,
                // tool.builtin.config from agents.json is omitted here to strictly
                // match the current BuiltinTool interface definition.
              },
            };
          })
          .filter(Boolean) as BuiltinTool[],
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
