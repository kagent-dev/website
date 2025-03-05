import { ReactNode } from "react";
import { BookOpenText } from "lucide-react";
import { HelmIcon } from "@/components/icons/helm";
import { IstioIcon } from "@/components/icons/istio";
import { KubernetesIcon } from "@/components/icons/kubernetes";
import { PrometheusIcon } from "@/components/icons/prometheus";
import { ArgoIcon } from "@/components/icons/argo";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  tags: string[];
  builtin: boolean;
  mcp: boolean;
  provider: string;
  stats: {
    version: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  tools: Tool[];
}

interface ToolConfig {
  provider: string;
  description: string;
  component_type: string;
  component_version: number;
  version: number;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
}

// Function to load tools from configuration JSON
const loadToolsFromConfig = (): Tool[] => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const toolConfigs: ToolConfig[] = require("./tools.json");

    return toolConfigs.map((config) => {
      // Determine the icon based on the provider prefix
      let icon: ReactNode;
      let tags: string[] = [];

      if (config.provider.includes("prometheus")) {
        icon = <PrometheusIcon className="w-10 h-10" />;
        tags = ["Prometheus", "Monitoring", "Observability"];
      } else if (config.provider.includes("k8s")) {
        icon = <KubernetesIcon className="w-10 h-10" />;
        tags = ["Kubernetes"];
      } else if (config.provider.includes("istio")) {
        icon = <IstioIcon className="w-10 h-10"/>;
        tags = ["Istio"];
      } else if (config.provider.includes("docs")) {
        icon = <BookOpenText className="w-10 h-10"/>;
        tags = ["Documentation", "Vector DB", "Search"];
      } else if (config.provider.includes("helm")) {
        icon = <HelmIcon className="w-10 h-10" />;
        tags = ["Helm"];
      } else if (config.provider.includes("argo")) {
        icon = <ArgoIcon className="w-10 h-10"/>;
        tags = ["Argo"];
      }
      else {
        // Default icon for other tools
        icon = <BookOpenText />;
        tags = ["Other"];
      }

      // Create a standardized tool object
      return {
        id: config.label.toLowerCase().replace(/\s+/g, "-"),
        name: config.label,
        description: config.description,
        icon,
        tags,
        builtin: true,
        mcp: true,
        provider: config.provider,
        stats: {
          version: `${config.version}.0.0`,
        },
      };
    });
  } catch (error) {
    console.error("Failed to load tools configuration:", error);
    return [];
  }
};

// Load tools from configuration
const tools: Tool[] = loadToolsFromConfig();

// Define all possible categories
const allCategories: Category[] = [
  {
    id: "documentation",
    name: "Documentation",
    description: "Tools for searching and managing documentation across different products and services",
    icon: <BookOpenText />,
    tools: tools.filter((tool) => tool.tags.includes("Documentation")),
  },
  {
    id: "prometheus",
    name: "Prometheus",
    description: "Complete suite of tools for monitoring, querying, and managing Prometheus instances",
    icon: <PrometheusIcon className="w-10 h-10" />,
    tools: tools.filter((tool) => tool.tags.includes("Prometheus")),
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Tools for managing and interacting with Kubernetes clusters",
    icon: <KubernetesIcon className="w-10 h-10" />,
    tools: tools.filter((tool) => tool.tags.includes("Kubernetes")),
  },
  {
    id: "istio",
    name: "Istio",
    description: "Tools for managing and interacting with Istio service mesh",
    icon: <IstioIcon className="w-10 h-10"/>,
    tools: tools.filter((tool) => tool.tags.includes("Istio")),
  },
  {
    id: "helm",
    name: "Helm",
    description: "Tools for managing and interacting with Helm charts and repositories",
    icon: <HelmIcon className="w-10 h-10" />,
    tools: tools.filter((tool) => tool.tags.includes("Helm")),
  },
  {
    id: "argo",
    name: "Argo",
    description: "Tools for managing and interacting with Argo projects and workflows",
    icon: <ArgoIcon className="w-10 h-10"/>,
    tools: tools.filter((tool) => tool.tags.includes("Argo")),
  },
  {
    id: "other",
    name: "Other",
    description: "Other tools that don't fit into the other categories",
    icon: <BookOpenText className="w-10 h-10" />,
    tools: tools.filter((tool) => tool.tags.includes("Other")),
  }
];

// Filter out categories with no tools
export const categories: Category[] = allCategories.filter(category => category.tools.length > 0);

export const getAllTools = () => tools;
export const getToolsByCategory = (categoryId: string) => categories.find((cat) => cat.id === categoryId)?.tools || [];
export const getCategory = (categoryId: string) => categories.find((cat) => cat.id === categoryId);