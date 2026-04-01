import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPO_ROOT = path.resolve(ROOT, "..");

const REPOS = [
  {
    name: "alive-constitution",
    dir: path.join(REPO_ROOT, "alive-constitution"),
    forbid: [/alive-(runtime|mind|body|interface)/, /\.\.\/(alive-(runtime|mind|body|interface))/],
    allow: [],
  },
  {
    name: "alive-mind",
    dir: path.join(REPO_ROOT, "alive-mind"),
    forbid: [/alive-(runtime|body|interface)/, /\.\.\/(alive-(runtime|body|interface))/],
    allow: [/alive-constitution/],
  },
  {
    name: "alive-body",
    dir: path.join(REPO_ROOT, "alive-body"),
    forbid: [/alive-(runtime|mind|interface)/, /\.\.\/(alive-(runtime|mind|interface))/],
    allow: [/alive-constitution/],
  },
  {
    name: "alive-runtime",
    dir: path.join(REPO_ROOT, "alive-runtime"),
    forbid: [
      /alive-interface/,
      /\.\.\/(alive-interface)/,
      /alive-mind\/src\/(?!index)/,
      /alive-body\/src\/(?!index)/,
    ],
    allow: [/alive-constitution/, /alive-mind\/src\/index/, /alive-body\/src\/index/],
  },
  {
    name: "alive-interface",
    dir: path.join(REPO_ROOT, "alive-interface"),
    forbid: [/alive-(mind|body)/, /\.\.\/(alive-(mind|body))/],
    allow: [/alive-constitution/, /api\//],
  },
];

const IMPORT_RE = /(import\s+[^\n]*?from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function checkRepo(repo) {
  const violations = [];
  const files = walk(path.join(repo.dir, "src")).concat(walk(path.join(repo.dir, "tests")));

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match;
    while ((match = IMPORT_RE.exec(content))) {
      const spec = match[2] || match[3] || "";
      if (!spec) continue;
      for (const rule of repo.forbid) {
        if (rule.test(spec)) {
          violations.push({ file, spec, rule: String(rule) });
          break;
        }
      }
    }
  }

  return violations;
}

const all = [];
for (const repo of REPOS) {
  all.push(...checkRepo(repo).map((v) => ({ ...v, repo: repo.name })));
}

if (all.length > 0) {
  console.error("ALIVE backbone freeze check failed. Violations:");
  for (const v of all) {
    const rel = path.relative(REPO_ROOT, v.file).replace(/\\/g, "/");
    console.error(`- [${v.repo}] ${rel} -> ${v.spec}`);
  }
  process.exit(1);
}

console.log("ALIVE backbone freeze check passed.");
