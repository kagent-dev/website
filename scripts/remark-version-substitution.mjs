import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { visit } from "unist-util-visit";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const jiti = require("jiti")(join(__dirname, ".."));
const { VERSIONS } = jiti(join(__dirname, "../src/app/docs/_constants.ts"));

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
