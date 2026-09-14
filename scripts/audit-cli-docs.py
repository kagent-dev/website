#!/usr/bin/env python3
"""
Audit generated CLI doc pages for common problems:
  - unbalanced ``` code fences
  - frontmatter that doesn't parse as valid YAML (e.g. an unescaped ':' in
    the description turns it into a nested mapping and breaks Hugo)
  - stray section-header lines (e.g. a bare "Flags:") that leaked into the
    body, which usually means the --help parser missed a header variant on
    that specific page
  - empty pages / missing frontmatter

Usage: python3 audit-cli-docs.py /tmp/kagent-cli-docs-test /tmp/kmcp-cli-docs-test
"""
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML not installed; run: pip3 install --user pyyaml", file=sys.stderr)
    sys.exit(1)

SUSPECT_HEADERS = {
    "usage", "aliases", "examples", "example",
    "available commands", "flags", "global flags",
}


def audit_file(path: Path) -> list[str]:
    problems = []
    text = path.read_text()

    if not text.startswith("---\n"):
        problems.append("missing frontmatter delimiter at top")
        return problems

    parts = text.split("---\n", 2)
    if len(parts) < 3:
        problems.append("frontmatter block never closes with ---")
        return problems

    fm_text, body = parts[1], parts[2]
    try:
        fm = yaml.safe_load(fm_text)
        if not isinstance(fm, dict) or "title" not in fm or "description" not in fm:
            problems.append(f"frontmatter parsed but missing title/description: {fm!r}")
    except yaml.YAMLError as e:
        problems.append(f"frontmatter is not valid YAML: {e}")

    fence_count = body.count("```")
    if fence_count % 2 != 0:
        problems.append(f"unbalanced code fences ({fence_count} occurrences of ```)")

    if not body.strip():
        problems.append("body is empty")

    for i, line in enumerate(body.splitlines(), start=1):
        norm = line.strip().rstrip(":").lower()
        if norm in SUSPECT_HEADERS:
            problems.append(f"line {i}: stray section header leaked into body: {line.strip()!r}")

    return problems


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    total_files = 0
    total_problems = 0
    for dir_arg in sys.argv[1:]:
        out_dir = Path(dir_arg)
        for md_file in sorted(out_dir.glob("*.md")):
            total_files += 1
            problems = audit_file(md_file)
            if problems:
                total_problems += len(problems)
                print(f"\n{md_file}")
                for p in problems:
                    print(f"  - {p}")

    print(f"\nChecked {total_files} files, found {total_problems} issue(s).", file=sys.stderr)
    return 1 if total_problems else 0


if __name__ == "__main__":
    sys.exit(main())
