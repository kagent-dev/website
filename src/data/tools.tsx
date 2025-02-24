import { ReactNode } from "react";
import { BookOpenText } from "lucide-react";

const PrometheusIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="-4.649 -0.667 64 64" overflow="visible" {...{ className }}>
    <path
      d="M27.35-.667c-17.673 0-32 14.326-32 32s14.328 32 32 32 32-14.327 32-32-14.328-32-32-32zm0 59.89c-5.028 0-9.105-3.36-9.105-7.5h18.2c0 4.142-4.077 7.5-9.105 7.5zM42.4 49.24H12.31v-5.454H42.4v5.454zm-.108-8.26H12.397l-.297-.344c-3.08-3.74-3.804-5.7-4.508-7.68-.012-.066 3.734.766 6.39 1.363 0 0 1.367.316 3.364.68-1.918-2.25-3.057-5.107-3.057-8.03 0-6.415 4.92-12.02 3.145-16.55 1.728.14 3.575 3.646 3.7 9.126 1.837-2.538 2.605-7.172 2.605-10.014 0-2.942 1.94-6.36 3.878-6.477-1.73 2.85.448 5.29 2.382 11.35.726 2.276.633 6.106 1.193 8.535.186-5.045 1.053-12.405 4.254-14.946-1.412 3.2.21 7.205 1.318 9.13 1.79 3.106 2.873 5.46 2.873 9.9 0 2.984-1.102 5.793-2.96 8 2.113-.397 3.572-.754 3.572-.754l6.862-1.34c0-.001-.997 4.1-4.828 8.05z"
      fill="#da4e31"
    />
  </svg>
);

const KubernetesIcon = () => (
  <svg width="800px" height="800px" viewBox="0 -10.44 722.846 722.846" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
    <path
      d="M358.986 10.06a46.725 46.342 0 00-17.906 4.531L96.736 131.341a46.725 46.342 0 00-25.28 31.438l-60.282 262.25a46.725 46.342 0 006.344 35.531 46.725 46.342 0 002.656 3.688l169.125 210.28a46.725 46.342 0 0036.531 17.438l271.219-.062a46.725 46.342 0 0036.531-17.406l169.063-210.313a46.725 46.342 0 009.03-39.219L651.3 162.716a46.725 46.342 0 00-25.281-31.437L381.643 14.59a46.725 46.342 0 00-22.657-4.53z"
      fill="#326ce5"
    />
    <path
      d="M361.408 99.307c-8.077.001-14.626 7.276-14.625 16.25 0 .138.028.27.03.406-.011 1.22-.07 2.689-.03 3.75.192 5.176 1.32 9.138 2 13.907 1.23 10.206 2.26 18.667 1.625 26.531-.62 2.965-2.803 5.677-4.75 7.562l-.344 6.188a190.337 190.337 0 00-26.438 4.062c-37.974 8.623-70.67 28.184-95.562 54.594a245.167 245.167 0 01-5.281-3.75c-2.612.353-5.25 1.159-8.688-.844-6.545-4.405-12.506-10.486-19.719-17.812-3.305-3.504-5.698-6.841-9.625-10.219-.891-.767-2.252-1.804-3.25-2.594-3.07-2.447-6.69-3.724-10.187-3.843-4.496-.154-8.824 1.604-11.656 5.156-5.036 6.315-3.424 15.968 3.593 21.562.071.057.147.101.219.157.964.781 2.145 1.783 3.031 2.437 4.167 3.077 7.973 4.652 12.125 7.094 8.747 5.402 15.999 9.88 21.75 15.281 2.246 2.394 2.639 6.613 2.938 8.438l4.687 4.187c-25.093 37.764-36.707 84.41-29.843 131.938l-6.125 1.781c-1.615 2.085-3.896 5.365-6.282 6.344-7.525 2.37-15.994 3.24-26.218 4.312-4.8.4-8.943.161-14.032 1.125-1.12.212-2.68.619-3.906.906l-.125.032c-.067.015-.155.048-.219.062-8.62 2.083-14.157 10.006-12.375 17.813 1.783 7.808 10.203 12.556 18.875 10.687.063-.014.154-.017.219-.031.098-.022.184-.07.281-.094 1.21-.265 2.724-.56 3.782-.843 5.003-1.34 8.626-3.308 13.125-5.032 9.676-3.47 17.691-6.37 25.5-7.5 3.26-.255 6.697 2.012 8.406 2.969l6.375-1.094c14.67 45.483 45.414 82.245 84.344 105.313l-2.657 6.375c.958 2.475 2.014 5.824 1.3 8.27-2.838 7.36-7.7 15.13-13.237 23.792-2.681 4.002-5.425 7.108-7.844 11.688-.579 1.096-1.316 2.78-1.875 3.937-3.759 8.043-1.002 17.305 6.219 20.782 7.266 3.497 16.284-.192 20.187-8.25.006-.012.026-.02.031-.032.004-.009-.004-.022 0-.03.556-1.143 1.344-2.645 1.813-3.72 2.072-4.747 2.762-8.815 4.219-13.406 3.87-9.72 5.995-19.919 11.322-26.274 1.459-1.74 3.837-2.41 6.303-3.07l3.312-6c33.938 13.027 71.927 16.523 109.875 7.907a189.77 189.77 0 0025.094-7.563c.93 1.651 2.661 4.826 3.125 5.625 2.506.815 5.24 1.236 7.469 4.531 3.985 6.81 6.71 14.865 10.031 24.594 1.457 4.591 2.178 8.66 4.25 13.406.472 1.082 1.256 2.605 1.812 3.75 3.895 8.085 12.943 11.787 20.22 8.282 7.219-3.478 9.979-12.74 6.218-20.782-.559-1.158-1.327-2.841-1.906-3.937-2.42-4.58-5.163-7.655-7.844-11.656-5.537-8.662-10.13-15.858-12.969-23.22-1.187-3.796.2-6.157 1.125-8.624-.554-.635-1.739-4.22-2.437-5.906 40.457-23.889 70.298-62.022 84.312-106.063 1.893.298 5.182.88 6.25 1.094 2.2-1.45 4.222-3.344 8.188-3.031 7.808 1.129 15.823 4.03 25.5 7.5 4.498 1.723 8.121 3.723 13.125 5.062 1.057.283 2.572.547 3.781.813.097.023.183.071.281.093.066.015.156.017.219.032 8.672 1.866 17.094-2.88 18.875-10.688 1.78-7.807-3.754-15.732-12.375-17.812-1.254-.286-3.032-.77-4.25-1-5.09-.964-9.231-.727-14.031-1.125-10.225-1.072-18.694-1.943-26.219-4.313-3.068-1.19-5.251-4.841-6.313-6.344l-5.906-1.718c3.062-22.155 2.237-45.212-3.062-68.282-5.349-23.284-14.8-44.58-27.407-63.343 1.515-1.378 4.377-3.911 5.188-4.657.237-2.624.033-5.375 2.75-8.281 5.751-5.4 13.003-9.879 21.75-15.281 4.152-2.443 7.99-4.017 12.156-7.094.942-.696 2.23-1.798 3.219-2.594 7.015-5.596 8.63-15.248 3.594-21.562-5.037-6.314-14.797-6.91-21.813-1.313-.998.791-2.353 1.823-3.25 2.594-3.926 3.378-6.351 6.714-9.656 10.219-7.213 7.326-13.174 13.438-19.719 17.844-2.836 1.65-6.99 1.08-8.875.968l-5.562 3.969c-31.72-33.26-74.905-54.525-121.406-58.656-.13-1.949-.3-5.471-.344-6.532-1.904-1.821-4.204-3.376-4.781-7.312-.637-7.864.426-16.325 1.656-26.531.679-4.769 1.807-8.73 2-13.907.044-1.176-.027-2.884-.031-4.156-.001-8.974-6.548-16.25-14.625-16.25zm-18.313 113.438l-4.344 76.718-.312.157c-.292 6.863-5.94 12.343-12.875 12.343-2.841 0-5.463-.912-7.594-2.468l-.125.062-62.906-44.594c19.333-19.01 44.063-33.06 72.562-39.53a154.125 154.125 0 0115.594-2.688zm36.656 0c33.274 4.092 64.045 19.159 87.625 42.25l-62.5 44.312-.218-.093c-5.548 4.051-13.364 3.046-17.688-2.375a12.807 12.807 0 01-2.812-7.47l-.063-.03zM232.126 283.62l57.438 51.375-.063.312c5.185 4.507 5.95 12.328 1.625 17.75a12.892 12.892 0 01-6.687 4.406l-.063.25-73.625 21.25c-3.747-34.265 4.329-67.573 21.375-95.343zm258.157.03c8.534 13.833 14.996 29.283 18.843 46.032 3.801 16.548 4.755 33.067 3.188 49.031l-74-21.312-.063-.313c-6.626-1.81-10.699-8.551-9.156-15.312a12.786 12.786 0 014.094-6.844l-.031-.156 57.125-51.125zm-140.657 55.313h23.532l14.625 18.282-5.25 22.812-21.125 10.156-21.188-10.187-5.25-22.813zm75.438 62.563c1-.05 1.995.04 2.969.219l.125-.157 76.156 12.875c-11.146 31.314-32.473 58.44-60.969 76.594l-29.562-71.406.093-.125c-2.715-6.31.002-13.71 6.25-16.719 1.6-.77 3.271-1.197 4.938-1.281zm-127.906.312c5.811.082 11.024 4.116 12.375 10.032.632 2.77.324 5.513-.72 7.937l.22.281-29.25 70.688c-27.348-17.549-49.13-43.824-60.782-76.063l75.5-12.812.125.156c.845-.155 1.701-.23 2.532-.219zm63.78 30.97a12.764 12.764 0 016.032 1.28c2.56 1.233 4.537 3.174 5.781 5.5h.282l37.218 67.25a154.256 154.256 0 01-14.875 4.157c-28.464 6.463-56.838 4.504-82.53-4.25l37.124-67.125h.063a12.91 12.91 0 0110.906-6.813z"
      fontWeight="400"
      color="#000000"
      fill="#ffffff"
      stroke="#ffffff"
      strokeWidth=".25"
      overflow="visible"
      fontFamily="Sans"
    />
  </svg>
);

const IstioIcon = () => (
  <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 77.62745 102.5" className="w-6 h-6">
    <path
      style={{
        fill: "#516baa",
      }}
      d="m31.05548,54.44523v24.1773c.00065.04512-.03164.084-.07611.09164l-23.27949,3.99047c-.05091.0076-.09834-.02751-.10594-.07841-.00256-.01712-.0003-.03461.00653-.05051L30.87996,30.58635c.02242-.04633.07815-.06572.12449-.04331.0316.01529.05193.04704.05259.08214l-.00156,23.82005Zm3.92367-13.93321v38.21148c.00046.04691.03573.08617.08232.09164l34.87031,3.89415c.0512.00527.09698-.03196.10226-.08316.00167-.01616-.00092-.03247-.00751-.04732L35.15623,4.70041c-.02237-.04636-.07809-.0658-.12444-.04343-.03117.01504-.05144.04612-.05264.08071v35.77433Zm34.68546,45.76213l-38.57341,11.57218c-.02155.00797-.04524.00797-.06679,0l-23.309-11.57217c-.04636-.0203-.06749-.07435-.04719-.12071.01513-.03455.04988-.0563.08757-.05481h61.88241c.0508.00825.08531.05613.07706.10693-.00482.0297-.02369.05525-.05066.06859Z"
    />
  </svg>
);
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

const tools: Tool[] = [
  // Documentation Tools
  {
    id: "docs-query",
    name: "Documentation Query Tool",
    description: "Searches a vector database for relevant documentation of products such as Istio, Kubernetes, Prometheus",
    icon: <BookOpenText />,
    tags: ["Documentation", "Vector DB", "Search"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.docs.QueryTool",
    stats: {
      version: "1.0.0",
    },
  },
  // Prometheus Tools
  {
    id: "prom-query",
    name: "Prometheus Query Tool",
    description: "Tool for executing queries in Prometheus",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Query"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.QueryTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-query-range",
    name: "Prometheus Range Query Tool",
    description: "Tool for executing range queries in Prometheus",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Query", "Range"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.QueryRangeTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-series-query",
    name: "Series Query Tool",
    description: "Find series matching a metadata selector",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Series", "Query"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.SeriesQueryTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-label-names",
    name: "Label Names Tool",
    description: "Get all label names",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Labels"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.LabelNamesTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-label-values",
    name: "Label Values Tool",
    description: "Get values for a specific label",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Labels"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.LabelValuesTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-targets",
    name: "Targets Tool",
    description: "Provides information about all Prometheus scrape targets and their current state",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Targets", "Monitoring"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.TargetsTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-rules",
    name: "Rules Tool",
    description: "Retrieves Prometheus alerting and recording rules",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Rules", "Alerts"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.RulesTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-alerts",
    name: "Alerts Tool",
    description: "Retrieves active Prometheus alerts",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Alerts"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.AlertsTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-target-metadata",
    name: "Target Metadata Tool",
    description: "Retrieves Prometheus target metadata",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Metadata", "Targets"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.TargetMetadataTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-alertmanagers",
    name: "Alertmanagers Tool",
    description: "Retrieves Prometheus alertmanager discovery state",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Alertmanager"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.AlertmanagersTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-metadata",
    name: "Metadata Tool",
    description: "Retrieves Prometheus metric metadata",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Metadata"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.MetadataTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-config",
    name: "Status Config Tool",
    description: "Retrieves Prometheus configuration",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Configuration"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.StatusConfigTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-flags",
    name: "Status Flags Tool",
    description: "Retrieves Prometheus flag values",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Configuration"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.StatusFlagsTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-runtime",
    name: "Runtime Info Tool",
    description: "Retrieves Prometheus runtime information",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Runtime"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.RuntimeInfoTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-build",
    name: "Build Info Tool",
    description: "Retrieves Prometheus build information",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Build"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.BuildInfoTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-tsdb",
    name: "TSDB Status Tool",
    description: "Retrieves Prometheus TSDB status",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "TSDB"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.TSDBStatusTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-snapshot",
    name: "Create Snapshot Tool",
    description: "Creates Prometheus snapshots",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Snapshot"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.CreateSnapshotTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-delete-series",
    name: "Delete Series Tool",
    description: "Deletes Prometheus series data",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Series"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.DeleteSeriesTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-clean-tombstones",
    name: "Clean Tombstones Tool",
    description: "Removes tombstones files created during delete operations",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "Maintenance"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.CleanTombstonesTool",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "prom-wal-replay",
    name: "WAL Replay Tool",
    description: "Retrieves Prometheus Write-Ahead Log (WAL) replay status",
    icon: <PrometheusIcon className="w-6 h-6" />,
    tags: ["Prometheus", "WAL"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.prometheus.WALReplayTool",
    stats: {
      version: "1.0.0",
    },
  },
  // Kubernetes Tools
  {
    id: "k8s-pods",
    name: "Get Pods",
    description: "List pods in a namespace",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Pods"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetPods",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-services",
    name: "Get Services",
    description: "List services in a namespace",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Services"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetServices",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-logs",
    name: "Get Pod Logs",
    description: "Get logs from a pod",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Pods", "Logs"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetPodLogs",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-apply",
    name: "Apply Manifest",
    description: "Apply a Kubernetes manifest",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Manifests"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.ApplyManifest",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-resources",
    name: "Get Resources",
    description: "Get information about resources in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Resources"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetResources",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-annotate",
    name: "Annotate Resource",
    description: "Annotate a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Annotations"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.AnnotateResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-connectivity",
    name: "Check Service Connectivity",
    description: "Check connectivity to a service in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Services", "Networking"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.CheckServiceConnectivity",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-create",
    name: "Create Resource",
    description: "Create a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Resources"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.CreateResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-delete",
    name: "Delete Resource",
    description: "Deletes a resource from Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Resources"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.DeleteResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-describe",
    name: "Describe Resource",
    description: "Describes a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Resources"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.DescribeResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-api-resources",
    name: "Get Available API Resources",
    description: "Gets the supported API resources in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "API"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetAvailableAPIResources",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-cluster-config",
    name: "Get Cluster Configuration",
    description: "Gets the Kubernetes cluster configuration",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Configuration"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetClusterConfiguration",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-events",
    name: "Get Events",
    description: "Gets the Kubernetes cluster events",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Events"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetEvents",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-label",
    name: "Label Resource",
    description: "Adds a label to a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Labels"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.LabelResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-remove-label",
    name: "Remove Label",
    description: "Removes a label from a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Labels"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.RemoteLabel",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-patch",
    name: "Patch Resource",
    description: "Applies a patch to a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Resources"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.PatchResource",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-remove-annotation",
    name: "Remove Annotation",
    description: "Removes an annotation from a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Annotations"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.RemoveAnnotation",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-rollout",
    name: "Rollout",
    description: "Performs a rollout on a resource in Kubernetes",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "Deployments"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.Rollout",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "k8s-yaml",
    name: "Get Resource YAML",
    description: "Gets the YAML representation of a Kubernetes resource",
    icon: <KubernetesIcon />,
    tags: ["Kubernetes", "YAML"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.k8s.GetResourceYAML",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "ztunnel-config",
    name: "ZTunnel Config",
    description: "Get ztunnel configuration",
    icon: <IstioIcon />,
    tags: ["Istio", "Configuration", "ZTunnel"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.ZTunnelConfig",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "waypoint-status",
    name: "Waypoint Status",
    description: "Get status of a waypoint",
    icon: <IstioIcon />,
    tags: ["Istio", "Waypoint", "Status"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.WaypointStatus",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "list-waypoints",
    name: "List Waypoints",
    description: "List managed waypoint configurations in the cluster",
    icon: <IstioIcon />,
    tags: ["Istio", "Waypoint", "List"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.ListWaypoints",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "generate-waypoint",
    name: "Generate Waypoint",
    description: "Generate a waypoint configuration as YAML",
    icon: <IstioIcon />,
    tags: ["Istio", "Waypoint", "Generate"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.GenerateWaypoint",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "delete-waypoint",
    name: "Delete Waypoint",
    description: "Delete a waypoint configuration from a cluster",
    icon: <IstioIcon />,
    tags: ["Istio", "Waypoint", "Delete"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.DeleteWaypoint",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "apply-waypoint",
    name: "Apply Waypoint",
    description: "Apply a waypoint configuration to a cluster",
    icon: <IstioIcon />,
    tags: ["Istio", "Waypoint", "Apply"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.ApplyWaypoint",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "remote-clusters",
    name: "Remote Clusters",
    description: "Lists the remote clusters each istiod instance is connected to",
    icon: <IstioIcon />,
    tags: ["Istio", "Clusters"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.RemoteClusters",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "proxy-status",
    name: "Proxy Status",
    description: "Get Envoy proxy status for a pod, retrieves last sent and last acknowledged xDS sync from Istiod to each Envoy in the mesh",
    icon: <IstioIcon />,
    tags: ["Istio", "Proxy", "Status"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.ProxyStatus",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "generate-manifest",
    name: "Generate Manifest",
    description: "Generates an Istio install manifest and outputs to the console by default",
    icon: <IstioIcon />,
    tags: ["Istio", "Manifest", "Generate"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.GenerateManifest",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "install-istio",
    name: "Install Istio",
    description: "Install Istio",
    icon: <IstioIcon />,
    tags: ["Istio", "Installation"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.Install",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "analyze-cluster",
    name: "Analyze Cluster Configuration",
    description: "Analyzes live cluster configuration",
    icon: <IstioIcon />,
    tags: ["Istio", "Analysis", "Configuration"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.AnalyzeClusterConfig",
    stats: {
      version: "1.0.0",
    },
  },
  {
    id: "proxy-config",
    name: "Proxy Configuration",
    description: "Get specific proxy configuration for a single pod",
    icon: <IstioIcon />,
    tags: ["Istio", "Proxy", "Configuration"],
    builtin: true,
    mcp: true,
    provider: "kagent.tools.istio.ProxyConfig",
    stats: {
      version: "1.0.0",
    },
  },
];

export const categories: Category[] = [
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
    icon: <PrometheusIcon className="w-6 h-6" />,
    tools: tools.filter((tool) => tool.tags.includes("Prometheus")),
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Tools for managing and interacting with Kubernetes clusters",
    icon: <KubernetesIcon />,
    tools: tools.filter((tool) => tool.tags.includes("Kubernetes")),
  },
  {
    id: "istio",
    name: "Istio",
    description: "Tools for managing and interacting with Istio service mesh",
    icon: <IstioIcon />,
    tools: tools.filter((tool) => tool.tags.includes("Istio")),
  },
];

export const getAllTools = () => tools;
export const getToolsByCategory = (categoryId: string) => categories.find((cat) => cat.id === categoryId)?.tools || [];
export const getCategory = (categoryId: string) => categories.find((cat) => cat.id === categoryId);
