#!/usr/bin/env python3
"""
Generate Hugo markdown CLI reference docs from a Cobra binary's --help output.

This walks the command tree by shelling out to `<binary> <path...> --help`
recursively (the same approach used by the agentgateway/website
generate-agctl-ref.py script, referenced as prior art in
kagent-dev/website#262). It works for any Cobra CLI without needing the
binary's root command to be an importable Go symbol, so it needs zero
changes upstream in kagent or kmcp.

Usage:
  generate-cli-docs.py --binary /path/to/kagent --display-name kagent \
      --out-dir docs-site/content/kagent/resources/cli

Output layout matches the existing kagent-dev/website convention:
  <display-name>-<command-path-with-hyphens>.md
e.g. kagent get agent -> kagent-get-agent.md

Each page gets Hugo YAML frontmatter (title/description/weight) plus a body
with the command's description, usage, flags, global flags and examples
extracted straight from --help text. Root-level commands are also linked
from an updated _index.md so the section stays navigable as commands are
added or removed.
"""
from __future__ import annotations

import argparse
import atexit
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

import yaml

# Cobra/pflag prints a flag's *resolved* runtime default in --help output
# (e.g. --config's default is computed via os.UserHomeDir() at run time).
# That bakes whoever's machine generated the docs into the public page —
# a contributor's home directory locally, a CI runner's later. The actual
# root cause is that kagent's own main() calls config.Init() before
# rootCmd.Execute() (outside Cobra's control entirely, so the "--help
# intercepted before PreRun/RunE" reasoning does not cover it): it creates
# a real ~/.kagent directory and writes a real ~/.kagent/config.yaml on
# whatever machine runs this generator, and it is *that* file's path
# which then gets printed back out as the flag's default.
#
# Rather than only scrubbing the resulting text, point every subprocess's
# HOME at a throwaway directory for the whole run, so the generator has no
# real side effects on the machine that runs it, and clean that directory
# up when done. The scrub below still runs afterward, to turn the (now
# fake, but still absolute and machine-specific-looking) path into the
# portable "$HOME" placeholder for the published docs.
#
# _FAKE_HOME is computed once and reused as both the env value handed to
# every child process AND the scrub target, so the two can never drift
# out of sync with each other.
_FAKE_HOME = tempfile.mkdtemp(prefix="cli-docs-fake-home-")
atexit.register(shutil.rmtree, _FAKE_HOME, ignore_errors=True)

# Run every child process with an allowlisted environment, not an
# inherited one. Some kagent flags (e.g. --kagent-url) read their printed
# default from an environment variable, so inheriting the generating
# machine's full environment risks publishing whatever a maintainer
# happens to have exported locally (KAGENT_URL, KAGENT_GRPC_URL, etc.) as
# a documented CLI default. Same class of bug as the $HOME leak, just not
# limited to one variable. PATH and LANG are kept because they affect
# whether the binary runs and how it encodes output, not what it prints
# as a default.
_CHILD_ENV = {
    "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
    "HOME": _FAKE_HOME,
    "NO_COLOR": "1",
    "TERM": "dumb",
    "LANG": "C.UTF-8",
}

# Strip ANSI escape sequences (CSI-style: ESC [ ... letter) before parsing.
# kmcp's custom Cobra template colors its section headers (e.g. "Available
# Commands"), and while a subprocess pipe normally disables color (color
# libraries check isatty() and back off), that is a property of *how* this
# script happens to be invoked today, not a guarantee. Escaped headers
# don't match any of the plain-text header comparisons in parse_help, so
# the failure mode is silent: the whole help text falls into the
# description, --help still exits 0, and a near-empty page gets written
# with no error at all.
_ANSI_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


@dataclass
class CommandNode:
    path: list[str]  # e.g. ["get", "agent"]
    long: str = ""
    usage_lines: list[str] = field(default_factory=list)
    examples: str = ""
    flags: list[tuple[str, str]] = field(default_factory=list)
    global_flags: list[tuple[str, str]] = field(default_factory=list)
    children: list[str] = field(default_factory=list)  # child command names (in order)
    child_short: dict[str, str] = field(default_factory=dict)


FLAG_LINE_RE = re.compile(r"^\s{2,}(-[^\s].*?)\s{2,}(.*)$")


def run_help(binary: str, path: list[str]) -> str:
    result = subprocess.run(
        [binary, *path, "--help"],
        capture_output=True,
        text=True,
        timeout=30,
        env=_CHILD_ENV,
    )
    if result.returncode != 0:
        cmd_display = " ".join([binary, *path, "--help"])
        raise RuntimeError(
            f"'{cmd_display}' exited {result.returncode}, expected 0.\n"
            f"--- stdout ---\n{result.stdout}\n"
            f"--- stderr ---\n{result.stderr}"
        )
    # Cobra prints help to stdout on success; stderr is not expected to
    # carry anything on a zero exit, so stdout is authoritative here.
    text = result.stdout
    text = _ANSI_RE.sub("", text)
    if _FAKE_HOME and _FAKE_HOME in text:
        text = text.replace(_FAKE_HOME, "$HOME")
    return text


def escape_stray_headings(text: str) -> str:
    """Escape any line that starts with '#' (after leading whitespace).

    kagent's own --help text embeds markdown-style headings inside plain
    prose (e.g. "#### Linux:" / "#### macOS:" in the completion commands'
    Long description, meant to visually separate OS-specific instructions
    in a terminal). Dumped verbatim into a Hugo page body, Goldmark renders
    these as real H4 headings, which then leak into the page's "On this
    page" sidebar panel as if they were real section headings.
    """
    escaped = []
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("#"):
            leading_ws = line[: len(line) - len(stripped)]
            escaped.append(f"{leading_ws}\\{stripped}")
        else:
            escaped.append(line)
    return "\n".join(escaped)


def parse_flag_block(lines: list[str]) -> list[tuple[str, str]]:
    """Parse a cobra flag block into (flag, description) pairs, joining
    wrapped description lines onto the preceding flag."""
    flags: list[tuple[str, str]] = []
    for line in lines:
        if not line.strip():
            continue
        m = FLAG_LINE_RE.match(line)
        if m:
            flags.append((m.group(1).strip(), m.group(2).strip()))
        elif flags:
            # Continuation of the previous flag's description (wrapped line).
            flag, desc = flags[-1]
            flags[-1] = (flag, f"{desc} {line.strip()}")
    return flags


def parse_help(text: str, path: list[str]) -> CommandNode:
    node = CommandNode(path=path)
    lines = text.splitlines()

    section = None
    seen_examples = False
    desc_lines: list[str] = []
    usage_lines: list[str] = []
    example_lines: list[str] = []
    flag_lines: list[str] = []
    global_flag_lines: list[str] = []
    child_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        # Normalize away trailing colons *and* internal whitespace before
        # comparing: real-world Cobra templates aren't consistent here.
        # kmcp emits "Available Commands::" (doubled colon) on one command
        # and "GlobalFlags:" (no space) on another, so match on the header
        # text stripped of all whitespace and trailing colons rather than
        # an exact string.
        header = re.sub(r"\s+", "", stripped.rstrip(":")).lower()
        if header == "usage":
            section = "usage"
            continue
        if header == "aliases":
            section = "skip"
            continue
        if header in ("examples", "example"):
            # Some CLIs (kagent's `init`, at least) emit a second, malformed
            # "Examples:" section after Usage/Flags with a single unindented
            # line duplicating part of the first block. Treat only the
            # first Examples section as authoritative and ignore any repeat
            # rather than concatenating both into one confusing block.
            section = "examples" if not seen_examples else "skip"
            seen_examples = True
            continue
        if header == "availablecommands":
            section = "children"
            continue
        if header == "flags":
            section = "flags"
            continue
        if header == "globalflags":
            section = "global_flags"
            continue
        if stripped.startswith("Use \"") or stripped.startswith("Additional help"):
            section = "skip"
            continue

        if section is None:
            desc_lines.append(line)
        elif section == "usage":
            if stripped:
                usage_lines.append(stripped)
        elif section == "examples":
            example_lines.append(line)
        elif section == "children":
            if stripped:
                child_lines.append(line)
        elif section == "flags":
            flag_lines.append(line)
        elif section == "global_flags":
            global_flag_lines.append(line)
        # "skip" section: ignore (aliases, trailing "Use ... --help" hint)

    node.long = escape_stray_headings("\n".join(desc_lines).strip())
    node.usage_lines = usage_lines
    # textwrap.dedent, not just .strip(): Cobra's Examples block indents
    # every line by 2 spaces uniformly. .strip() alone only removes
    # leading/trailing whitespace from the *joined string as a whole*, so
    # it strips the first line's indent (it's the string's leading
    # whitespace) but leaves every subsequent line's 2-space indent
    # intact, rendering with the first command flush left and the rest
    # visibly indented under it.
    node.examples = textwrap.dedent("\n".join(example_lines)).strip()
    node.flags = parse_flag_block(flag_lines)
    node.global_flags = parse_flag_block(global_flag_lines)

    for line in child_lines:
        m = re.match(r"^\s{2}(\S+)\s+(.*)$", line)
        if m:
            name, short = m.group(1), m.group(2).strip()
            # Skip cobra's built-in "help" meta-command: its help text is
            # generic boilerplate ("help provides help for any command")
            # with no kagent/kmcp-specific content. "completion" is kept —
            # unlike "help" it documents real per-shell subcommands
            # (bash/zsh/fish/powershell) that are genuinely useful reference
            # content, and the existing hand-written docs already covered it.
            if name == "help":
                continue
            node.children.append(name)
            node.child_short[name] = short

    return node


def discover_tree(binary: str, path: list[str]) -> dict[tuple[str, ...], CommandNode]:
    """BFS the command tree, returning a map of path-tuple -> CommandNode."""
    nodes: dict[tuple[str, ...], CommandNode] = {}
    queue: list[list[str]] = [path]
    while queue:
        cur = queue.pop(0)
        text = run_help(binary, cur)
        node = parse_help(text, cur)
        nodes[tuple(cur)] = node
        for child in node.children:
            queue.append(cur + [child])
    return nodes


def slugify(display_name: str, path: list[str]) -> str:
    parts = [display_name, *path]
    return "-".join(parts)


def render_flags(flags: list[tuple[str, str]]) -> str:
    if not flags:
        return ""
    lines = [f"- `{flag}` - {desc}" for flag, desc in flags]
    return "\n".join(lines)


def render_page(display_name: str, node: CommandNode, weight: int, description: str, url_prefix: str) -> str:
    full_use = " ".join([display_name, *node.path])
    title = full_use

    body_parts = [node.long or description, ""]

    if node.usage_lines:
        body_parts.append("```bash")
        body_parts.extend(node.usage_lines)
        body_parts.append("```")
        body_parts.append("")

    if node.children:
        body_parts.append("**Subcommands:**")
        for child in node.children:
            child_full = " ".join([display_name, *node.path, child])
            # Root-relative link, not "../"-prefixed. The site publishes
            # both an HTML version of every page (served at a pretty-URL
            # directory, where "../" resolves correctly) and a raw .md
            # version (served at a flat file URL, where "../" resolves one
            # level too far up and 404s). A root-relative link resolves
            # identically in both.
            body_parts.append(f"- [`{child_full}`]({url_prefix}/{slugify(display_name, node.path + [child])}/) - {node.child_short[child]}")
        body_parts.append("")

    if node.flags:
        body_parts.append("**Flags:**")
        body_parts.append(render_flags(node.flags))
        body_parts.append("")

    if node.global_flags:
        body_parts.append("**Global Flags:**")
        body_parts.append(render_flags(node.global_flags))
        body_parts.append("")

    if node.examples:
        body_parts.append("## Example")
        body_parts.append("")
        body_parts.append("```bash")
        body_parts.append(node.examples)
        body_parts.append("```")
        body_parts.append("")

    body = "\n".join(body_parts).strip() + "\n"

    # Emit frontmatter through a real YAML dumper rather than raw string
    # interpolation. title/description are sourced from --help text, which
    # is not under this script's control; the first Cobra Short that
    # contains ": " (or a leading quote, #, etc.) would otherwise produce
    # invalid or silently misparsed YAML in an unattended nightly job.
    frontmatter_data = {"title": title, "description": description, "weight": weight}
    frontmatter = "---\n" + yaml.safe_dump(frontmatter_data, sort_keys=False, allow_unicode=True) + "---\n\n"
    return frontmatter + body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--binary", required=True, help="Path to the built CLI binary")
    parser.add_argument("--display-name", required=True, help="Command name as users type it, e.g. kagent or kmcp")
    parser.add_argument("--out-dir", required=True, help="Hugo content directory to write pages into")
    parser.add_argument(
        "--url-prefix",
        required=True,
        help=(
            "Public URL path this section is served at, e.g. "
            "/docs/kagent/resources/cli (no trailing slash). Used for "
            "root-relative Subcommands/_index.md links, which resolve "
            "correctly whether a page is served as a pretty-URL directory "
            "or as a flat file (the site's parallel .md export of every "
            "page); a same-level or ../-relative link only resolves "
            "correctly for one of those two forms."
        ),
    )
    args = parser.parse_args()
    url_prefix = args.url_prefix.rstrip("/")

    binary = str(Path(args.binary).resolve())
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    nodes = discover_tree(binary, [])

    # A CLI with zero subcommands would be unusual for either kagent or
    # kmcp; this is the general guard against a whole class of silent
    # failure (parse_help finding no recognizable section headers at all,
    # e.g. from an unhandled escape sequence or a --help format this
    # script has never seen), which would otherwise still exit 0 with a
    # near-empty page and no error, in a job that runs unattended nightly.
    if not nodes[tuple()].children:
        raise RuntimeError(
            f"'{binary} --help' produced no recognizable subcommands. "
            "This usually means parse_help failed to match this CLI's "
            "--help format (e.g. an unhandled ANSI escape sequence, or a "
            "genuinely new --help layout) rather than the CLI having no "
            "subcommands at all."
        )

    # Remove previously generated pages so removed commands don't linger.
    for existing in out_dir.glob(f"{args.display_name}-*.md"):
        existing.unlink()

    # Weight root command's direct children 10, 20, 30... in help order;
    # nested subcommands inherit weight+1 under their parent for stable
    # ordering without needing to renumber the whole tree on every change.
    root = nodes[tuple()]
    weight = 10
    index_frontmatter_data = {
        "title": "CLI docs",
        "description": f"Complete reference docs for the {args.display_name} CLI commands",
        "weight": 1,
    }
    index_lines = [
        "---",
        yaml.safe_dump(index_frontmatter_data, sort_keys=False, allow_unicode=True).rstrip("\n"),
        "---",
        "",
        f"Review the {args.display_name} CLI commands and learn how to use them effectively.",
        "",
    ]

    def write_subtree(path: list[str], weight_start: int) -> int:
        w = weight_start
        node = nodes[tuple(path)]
        # Source the page's frontmatter description from its parent's
        # child_short entry (parsed straight from the parent's "Available
        # Commands:" block) rather than node.long's first physical line,
        # which truncates whenever Cobra hard-wraps a multi-line Long
        # description across several lines in --help output.
        parent = nodes[tuple(path[:-1])]
        description = parent.child_short[path[-1]]
        page = render_page(args.display_name, node, w, description, url_prefix)
        filename = f"{slugify(args.display_name, path)}.md"
        (out_dir / filename).write_text(page)
        w += 10
        for child in node.children:
            w = write_subtree(path + [child], w)
        return w

    for child in root.children:
        # Root-relative, same reasoning as the Subcommands links in
        # render_page: resolves correctly for both the HTML (pretty-URL
        # directory) and the parallel .md export (flat file) of this page.
        index_lines.append(f"- [`{args.display_name} {child}`]({url_prefix}/{slugify(args.display_name, [child])}/) - {root.child_short[child]}")
        weight = write_subtree([child], weight)

    (out_dir / "_index.md").write_text("\n".join(index_lines) + "\n")

    total_pages = len(list(out_dir.glob(f"{args.display_name}-*.md")))
    print(f"Generated {total_pages} pages for {args.display_name} in {out_dir}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
