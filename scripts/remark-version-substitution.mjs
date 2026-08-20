import { visit } from "unist-util-visit";

const VERSIONS = {
  kagent: "0.9.9",
  kmcp: "0.3.0",
  agentSubstrate: "0.0.6",
  loki: "6.24.0",
  tempo: "1.16.0",
  jaeger: "4.4.7",
  kubernetesAppsApi: "apps/v1",
  kubernetesApi: "v1",
  kagentApi: "kagent.dev/v1alpha2",
};

const VERSION_PATTERN = /\{VERSIONS\.(\w+)\}/g;

function substituteVersions(value) {
  return value.replace(VERSION_PATTERN, (match, key) => {
    if (Object.hasOwn(VERSIONS, key)) {
      return VERSIONS[key];
    }

    return match;
  });
}

/**
 * Replace {VERSIONS.key} placeholders inside fenced and inline code blocks.
 * MDX evaluates the same syntax in prose, but treats code fences as literal text.
 */
export function remarkVersionSubstitution() {
  return (tree) => {
    visit(tree, "code", (node) => {
      node.value = substituteVersions(node.value);
    });
  };
}

// Default export so @next/mdx can load this plugin from a path string (Turbopack)
export default remarkVersionSubstitution;
