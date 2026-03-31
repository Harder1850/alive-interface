from __future__ import annotations

import fnmatch
import os
from pathlib import Path


BASE_DIR = Path(r"c:/Users/mikeh/dev/ALIVE/alive-repos")
OUT_DIR = BASE_DIR / "alive-interface"
REPOS = [
    "alive-constitution",
    "alive-runtime",
    "alive-mind",
    "alive-body",
    "alive-interface",
]

EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "coverage", ".next", ".turbo"}
EXCLUDE_FILES = {".DS_Store", "package-lock.json", "pnpm-lock.yaml", "yarn.lock"}
EXCLUDE_GLOBS = ["*.log"]

PLACEHOLDER_KEYWORDS = ["todo", "placeholder", "template", "stub", "example", "sample", "draft", "wip"]


def is_excluded(name: str, is_dir: bool) -> bool:
    if is_dir and name in EXCLUDE_DIRS:
        return True
    if (not is_dir) and (name in EXCLUDE_FILES or any(fnmatch.fnmatch(name, g) for g in EXCLUDE_GLOBS)):
        return True
    return False


def visible_entries(path: Path) -> list[Path]:
    try:
        children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
    except (FileNotFoundError, PermissionError):
        return []
    return [p for p in children if not is_excluded(p.name, p.is_dir())]


def build_tree(root: Path, max_depth: int) -> str:
    lines = [f"{root.name}/"]

    def walk(current: Path, prefix: str, depth: int) -> None:
        if depth >= max_depth:
            return
        entries = visible_entries(current)
        for i, p in enumerate(entries):
            last = i == len(entries) - 1
            branch = "└── " if last else "├── "
            lines.append(f"{prefix}{branch}{p.name}{'/' if p.is_dir() else ''}")
            if p.is_dir():
                walk(p, prefix + ("    " if last else "│   "), depth + 1)

    walk(root, "", 0)
    return "\n".join(lines)


def collect_rel_paths(root: Path, max_depth: int = 6) -> list[str]:
    paths: list[str] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dpath = Path(dirpath)
        rel_dir = dpath.relative_to(root)
        depth = 0 if str(rel_dir) == "." else len(rel_dir.parts)

        dirnames[:] = [d for d in dirnames if not is_excluded(d, True)]
        if depth > max_depth:
            dirnames[:] = []
            continue

        if str(rel_dir) != ".":
            paths.append(rel_dir.as_posix() + "/")

        for f in sorted(filenames):
            if is_excluded(f, False):
                continue
            rel_file = (rel_dir / f) if str(rel_dir) != "." else Path(f)
            paths.append(rel_file.as_posix())
    return paths


def repo_notes(root: Path) -> tuple[list[str], list[str], list[str], list[str]]:
    top_level = [f"{p.name}{'/' if p.is_dir() else ''}" for p in visible_entries(root)]

    important_candidates = [
        "README.md",
        "package.json",
        "tsconfig.json",
        "00_START_HERE.md",
        "ALIVE_STUDIO.md",
        "DEPLOYMENT.md",
        "HANDOFF.md",
        "LICENSE",
        "docs",
        "src",
        "tests",
        "packages",
        "studio",
        "memory",
        "contracts",
        "adapters",
    ]
    important = []
    for name in important_candidates:
        p = root / name
        if p.exists() and not is_excluded(p.name, p.is_dir()):
            important.append(f"{name}{'/' if p.is_dir() else ''}")

    placeholders = []
    for rel in collect_rel_paths(root, max_depth=4):
        low = rel.lower()
        if any(k in low for k in PLACEHOLDER_KEYWORDS):
            placeholders.append(rel)

    top_names = {x.rstrip("/").lower() for x in top_level}
    missing_common = [n for n in ["docs", "src", "tests", "contracts", "memory"] if n not in top_names]

    return (
        top_level[:25],
        sorted(set(important))[:20],
        sorted(set(placeholders))[:12],
        missing_common,
    )


def main() -> None:
    data: dict[str, dict] = {}
    for repo in REPOS:
        root = BASE_DIR / repo
        entry: dict = {"exists": root.is_dir()}
        if entry["exists"]:
            entry["tree6"] = build_tree(root, 6)
            entry["tree3"] = build_tree(root, 3)
            entry["paths"] = collect_rel_paths(root, 6)
            top, important, placeholders, missing = repo_notes(root)
            entry["top"] = top
            entry["important"] = important
            entry["placeholders"] = placeholders
            entry["missing"] = missing
        data[repo] = entry

    md: list[str] = ["# ALIVE Repo Trees", ""]

    for repo in REPOS:
        d = data[repo]
        md.extend([f"## {repo}", "```text"])
        if d["exists"]:
            md.append(d["tree6"])
        else:
            md.append(f"{repo}/  [missing - folder not found]")
        md.extend(["```", "", "### Notes", ""])

        if not d["exists"]:
            md.extend(["* Repository folder not found at expected local path.", ""])
            continue

        md.append(f"* **Top-level folders/files:** {', '.join(d['top']) if d['top'] else '(none)'}")
        md.append(
            f"* **Files that look important:** {', '.join(d['important']) if d['important'] else 'none obvious'}"
        )
        if d["placeholders"]:
            md.append(f"* **Placeholder-like signals:** {', '.join(d['placeholders'])}")
        else:
            md.append("* **Placeholder-like signals:** none obvious from names.")
        if d["missing"]:
            md.append(f"* **Potentially missing/common items:** {', '.join(d['missing'])}")
        else:
            md.append("* **Potentially missing/common items:** no obvious gaps among docs/src/tests/contracts/memory.")
        md.append("")

    md.extend(["## Cross-Repo Summary", ""])
    categories = [
        ("contracts", ["contracts", "schema", "spec"]),
        ("docs", ["docs", "readme.md"]),
        ("src", ["src/"]),
        ("tests", ["tests", "__tests__", ".test.", ".spec."]),
        ("adapters", ["adapters"]),
        ("memory", ["memory"]),
        ("runtime/enforcement/routing-related files", ["runtime", "enforcement", "router", "routing", "policy", "guard"]),
        ("interface/dashboard/studio-related files", ["interface", "dashboard", "studio", "ui", "view"]),
    ]

    for label, keys in categories:
        lines = []
        for repo in REPOS:
            d = data[repo]
            if not d["exists"]:
                continue
            hits = [p for p in d["paths"] if any(k in p.lower() for k in keys)]
            if hits:
                sample = ", ".join(hits[:4]) + (", ..." if len(hits) > 4 else "")
                lines.append(f"  * {repo}: {sample}")
        if lines:
            md.append(f"* **{label}:**")
            md.extend(lines)
        else:
            md.append(f"* **{label}:** no obvious matches found.")

    (OUT_DIR / "alive_repo_trees.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    compact: list[str] = ["# ALIVE Repo Trees (Compact)", ""]
    for repo in REPOS:
        d = data[repo]
        compact.extend([f"## {repo}", "```text"])
        if d["exists"]:
            compact.append(d["tree3"])
        else:
            compact.append(f"{repo}/  [missing - folder not found]")
        compact.extend(["```", ""])

    (OUT_DIR / "alive_repo_trees_compact.md").write_text("\n".join(compact) + "\n", encoding="utf-8")
    print("Generated markdown trees successfully.")


if __name__ == "__main__":
    main()
