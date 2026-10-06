#!/usr/bin/env python3
"""
Generate the Hugo environment variable reference from kagent's docs/env.md.

Upstream already generates that file from the registry in go/core/pkg/env
(`make env-docs`), and upstream CI fails when it drifts from the registry
(`make env-docs-check`). So this script does not re-derive anything from Go
source: it reads the generated file out of a kagent checkout and reshapes it
into a published page.

Usage:
  generate-env-docs.py --source kagent/docs/env.md \
      --out docs-site/content/kagent/1.x/reference/env-vars.md

What the reshaping does, and why:

  * Replaces the upstream intro. The generated one tells a *contributor* to
    "edit the registrations there, run make env-docs, and commit the result",
    which is wrong for a reader of the published site.

  * Drops sections that are not reader-facing. `testing` documents the E2E
    and build harness (KAGENT_E2E_*, KAGENT_TEST_*, mock server ports), which
    belongs to people working in the kagent repo, not to people running
    kagent. Override with --include-section if that judgment changes.

  * Renames section slugs to titles the site's style allows (`agent-runtime`
    -> `Agent runtime`, `cli` -> `CLI`).

  * Gives every table the one-sentence introduction the site requires, since
    a bare table under a heading is a style violation here.

The script fails rather than guessing when upstream's structure changes: an
unknown section heading, a section that lost its table, or a missing expected
section all abort with a message naming the section. That turns an upstream
restructure into a failed docs run instead of a silently malformed page.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml

# Upstream section slug -> (heading on the published page, introduction).
#
# The introduction is written here rather than taken from upstream because
# upstream emits none: every section there is a bare `## slug` followed
# straight by a table.
SECTIONS: dict[str, tuple[str, str]] = {
    "controller": (
        "Controller",
        "The kagent controller reads these variables at startup. Helm writes "
        "most of them into the controller ConfigMap, so prefer the matching "
        "chart value where one exists. Set the variable directly only for a "
        "setting the chart does not expose. For the chart values, see the "
        '[Helm reference]({{< link path="reference/helm#values" >}}).',
    ),
    "agent-runtime": (
        "Agent runtime",
        "The kagent controller supplies these variables to each agent runtime "
        "that it schedules. Setting one of them in a Harness `spec.env` does not "
        "override the controller on a managed runtime, because the controller "
        "writes its own value into every revision it compiles. The `byo` runtime "
        "is the exception because the controller sends it no configuration, so "
        "it reads whatever `spec.env` holds. For more information, see "
        '[Agent harness]({{< link path="agents/agent-harness#configure-a-harness" >}}).',
    ),
    "cli": (
        "CLI",
        "The `kagent` command line tool reads these variables from the "
        "environment that it runs in. Each one has an equivalent flag where the "
        "command takes a flag, and the flag wins when both are set.",
    ),
    "database": (
        "Database",
        "Both the kagent controller and `kagent db` read these variables. The "
        "controller takes its connection settings from Helm, so set these "
        "directly only when you run a database command outside of the cluster.",
    ),
    "ui": (
        "UI",
        "The UI container and the Vite development server read these variables. "
        "Values prefixed `KAGENT_UI_` that reach the browser are public, so none "
        "of them can carry a secret.",
    ),
    # Deliberately excluded by default; see the module docstring.
    "testing": (
        "Testing",
        "kagent's own end-to-end and integration suites read these. They apply "
        "to work in the kagent repository rather than to a running installation.",
    ),
}

DEFAULT_EXCLUDED = ("testing",)

# Order on the published page. Upstream emits alphabetical section order,
# which puts `agent-runtime` first and buries `controller` in the middle.
# A reader configuring an installation wants the controller first.
PAGE_ORDER = ("controller", "agent-runtime", "database", "cli", "ui", "testing")

INTRO = """\
Review the environment variables that a {product} installation reads, grouped \
by the component that reads them.

Most of the following variables have a {helm} that writes them for you, and \
the chart setting is the supported way to set them. Use a variable directly \
only whenever you run a component outside the cluster, such as `kagent db` \
against a database from your own machine, or when a variable has no chart \
setting.

Default values describe the component on its own. Helm, or an agent's \
{harness} `spec.env`, might supply a different value, so the default listed \
here is not the guaranteed value that a running installation might use. \
`(none)` means the variable has no fixed default, so read the description for \
what happens when it is unset. A variable that more than one component reads \
appears under each of them.

Credentials, controller-generated runtime payloads, and internal process \
wiring are not configurable settings and are not listed.\
"""

# Warn the next person off editing the page itself. The page reads like
# ordinary prose, unlike the API and CLI references, so nothing about it
# signals that an edit here is reverted by the next reference docs run.
# Precedent: the conref note at the foot of reference/versions.md.
MARKER = """\
<!--
Generated by scripts/generate-env-docs.py. Do not edit this page: the next
Update Reference Documentation run overwrites it.

- The tables come from docs/env.md in the kagent repo, which kagent generates
  from the registry in go/core/pkg/env. Fix a variable's type, default or
  description by editing its registration there.
- This introduction, the section headings and their introductions, and the
  section order come from scripts/generate-env-docs.py in this repo.
- The `testing` section is dropped on purpose. Pass --include-section testing
  to publish it.
-->\
"""

SECTION_HEADING = re.compile(r"^##\s+(?P<slug>\S+)\s*$")


def parse_sections(text: str) -> dict[str, list[str]]:
    """Split the upstream file into {slug: body lines}, ignoring the preamble."""
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for line in text.splitlines():
        match = SECTION_HEADING.match(line)
        if match:
            current = match.group("slug")
            if current in sections:
                sys.exit(f"error: duplicate section '{current}' in the source file")
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)
    return sections


def table_of(slug: str, lines: list[str]) -> str:
    """Return the section's markdown table, or abort if it has none."""
    body = "\n".join(lines).strip()
    if not body.startswith("| Variable |"):
        sys.exit(
            f"error: section '{slug}' does not start with the expected variable "
            "table. Upstream's docs/env.md format changed; update "
            "scripts/generate-env-docs.py to match before regenerating."
        )
    return body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        required=True,
        type=Path,
        help="Path to docs/env.md in a kagent checkout.",
    )
    parser.add_argument(
        "--out",
        required=True,
        type=Path,
        help="Path of the page to write.",
    )
    parser.add_argument(
        "--title",
        default="Environment variables",
        help="Frontmatter title.",
    )
    parser.add_argument(
        "--weight",
        type=int,
        default=35,
        help=(
            "Hugo weight. Defaults to 35, which places the page after the CLI "
            "reference (30) and before the tools ecosystem (40), keeping the "
            "generated references together."
        ),
    )
    parser.add_argument(
        "--product-name",
        default='{{< reuse "kagent-docs/snippets/name-product.md" >}}',
        help="Product name, as a literal or a reuse shortcode.",
    )
    parser.add_argument(
        "--include-section",
        action="append",
        default=[],
        metavar="SLUG",
        help=(
            "Publish a section excluded by default (currently: "
            f"{', '.join(DEFAULT_EXCLUDED)}). Repeatable."
        ),
    )
    args = parser.parse_args()

    if not args.source.is_file():
        sys.exit(f"error: source file not found: {args.source}")

    sections = parse_sections(args.source.read_text(encoding="utf-8"))
    if not sections:
        sys.exit(
            f"error: no '## section' headings found in {args.source}. The source "
            "is empty or its format changed."
        )

    unknown = sorted(set(sections) - set(SECTIONS))
    if unknown:
        sys.exit(
            "error: unrecognized section(s) in the source file: "
            f"{', '.join(unknown)}. Upstream added a component. Add it to "
            "SECTIONS and PAGE_ORDER in scripts/generate-env-docs.py, with an "
            "introduction, so the new variables are published rather than "
            "dropped."
        )

    excluded = set(DEFAULT_EXCLUDED) - set(args.include_section)
    publish = [
        slug for slug in PAGE_ORDER if slug in sections and slug not in excluded
    ]
    if not publish:
        sys.exit("error: every section was excluded; nothing to publish")

    parts = [
        "---\n"
        + yaml.safe_dump(
            {
                "title": args.title,
                "description": (
                    "Look up the environment variables that each kagent "
                    "component reads, including their types and defaults."
                ),
                "weight": args.weight,
            },
            sort_keys=False,
            allow_unicode=True,
            # Keep each frontmatter value on one line; the default width wraps
            # a long description onto a continuation line, which is valid YAML
            # but does not match the site's hand-written pages.
            width=float("inf"),
        ).strip()
        + "\n---",
        MARKER,
        INTRO.format(
            product=args.product_name,
            helm='[Helm chart setting]({{< link path="reference/helm#values" >}})',
            harness='{{< gloss "Harness" >}}Harness{{< /gloss >}}',
        ),
    ]

    for slug in publish:
        heading, intro = SECTIONS[slug]
        parts.append(f"## {heading}\n\n{intro}\n\n{table_of(slug, sections[slug])}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n\n".join(parts) + "\n", encoding="utf-8")

    skipped = sorted(set(sections) - set(publish))
    print(f"Wrote {args.out} with {len(publish)} section(s): {', '.join(publish)}")
    if skipped:
        print(f"Skipped section(s): {', '.join(skipped)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
