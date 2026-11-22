#!/usr/bin/env node
// Builds tree/ from a cursor/plugins checkout plus adapter/orca.md.
// Adapted from scripts/generate-pstack-harness-trees.mjs in cursor/plugins (MIT, Lauren Tan).
// Usage: node scripts/build-tree.mjs <path-to-cursor-plugins-checkout> [--check]

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2] && !process.argv[2].startsWith("--") ? resolvePath(process.argv[2]) : undefined;
if (!SOURCE || !existsSync(join(SOURCE, "pstack", "skills"))) {
  console.log("Usage: node scripts/build-tree.mjs <path-to-cursor-plugins-checkout> [--check]");
  process.exit(1);
}
const PSTACK = join(SOURCE, "pstack");
const SKILLS = join(PSTACK, "skills");
const OUT = join(ROOT, "tree");
const ADAPTER = "docs/harness/orca.md";
const ADAPTER_SOURCE = join(ROOT, "adapter", "orca.md");
const GUIDE = "docs/guide";
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;
// Left out to keep the plugin small: links to these point at GitHub instead.
const LEFT_OUT = ["docs/guide/images/", "skills/statechart/scripts/test/"];

const TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: '`environment: "cloud"`', re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "gemini-", re: /\bgemini-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  { key: "create-skill", re: /create-skill/ },
  { key: "`/loop`", re: /`\/loop`/ },
  { key: "Cursor-only features", re: /Bugbot|Cursor [Aa]utomation|cursor\.(sh|com)\/automations|[Cc]loud [Aa]gent|built-in PR tool/ },
];
const ROUTE_KEY = "Run another pstack skill";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const rel = (path) => relative(PSTACK, path).split("\\").join("/");
const skills = readdirSync(SKILLS).filter((name) => existsSync(join(SKILLS, name, "SKILL.md")));

function classify(skill) {
  const dir = join(SKILLS, skill);
  const others = skills.filter((name) => name !== skill).join("|");
  const route = new RegExp(`the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``, "g");
  const linksToSkill = (line, name) => line.includes(`(../${name}/`);
  const namesBareSkill = (line) =>
    [...line.matchAll(route)].some(({ groups }) => !linksToSkill(line, groups.bold ?? groups.command));
  const usesCursorNames = new Set();
  for (const path of walk(dir).filter((path) => path.endsWith(".md"))) {
    const text = readFileSync(path, "utf8");
    for (const term of TERMS) if (term.re.test(text)) usesCursorNames.add(term.key);
    if (text.split("\n").some(namesBareSkill)) usesCursorNames.add(ROUTE_KEY);
  }
  const text = readFileSync(join(dir, "SKILL.md"), "utf8");
  return { usesCursorNames, wrap: usesCursorNames.size > 0 && /^# /m.test(text) };
}

const classes = new Map(skills.map((skill) => [skill, classify(skill)]));
const problems = [];
const users = new Map();
for (const [skill, { usesCursorNames, wrap }] of classes) {
  if (usesCursorNames.size > 0 && !wrap) problems.push(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
  for (const key of usesCursorNames) users.set(key, [...(users.get(key) ?? []), skill]);
  const frontmatter = readFileSync(join(SKILLS, skill, "SKILL.md"), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const name = frontmatter.match(/^name:(.*)$/m)?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  if (name !== skill) problems.push(`skills/${skill}/SKILL.md has name ${JSON.stringify(name ?? "")}, not its folder name ${skill}`);
  if (!SKILL_NAME.test(skill) || skill.length > 64) problems.push(`skills/${skill} is not a valid skill name`);
}
const adapter = readFileSync(ADAPTER_SOURCE, "utf8");
for (const [key, using] of users) {
  if (!adapter.includes(key)) problems.push(`Orca adapter has no row for ${key}, used by ${using.join(", ")}`);
}
for (const problem of problems) console.log(`FAIL ${problem}`);
if (problems.length > 0) process.exit(1);

function resolve(from, href) {
  const target = href.replace(/[#?].*/, "");
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
  return existsSync(join(PSTACK, path)) ? path : undefined;
}

function has(files, path) {
  return files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
}

function render() {
  const copies = [...walk(SKILLS), ...walk(join(PSTACK, "agents")), ...walk(join(PSTACK, GUIDE)), join(PSTACK, "README.md")];
  const files = new Map(
    copies.map((path) => [rel(path), path]).filter(([name]) => !LEFT_OUT.some((prefix) => name.startsWith(prefix))).map(([name, path]) => [name, readFileSync(path)]),
  );
  files.set(ADAPTER, Buffer.from(adapter));
  files.set("LICENSE", readFileSync(join(PSTACK, "LICENSE")));
  const line =
    `In Orca, read [the Orca adapter](../../${ADAPTER}) once per session before you follow this skill. ` +
    "It maps the Cursor names in pstack skills to Orca.";
  for (const [skill, { wrap }] of classes) {
    const path = `skills/${skill}/SKILL.md`;
    const text = files.get(path).toString("utf8");
    if (wrap) files.set(path, Buffer.from(text.replace(/^(# .*)(?:\r?\n)+/m, `$1\n\n${line}\n\n`)));
  }
  for (const [path, bytes] of files) {
    if (!path.endsWith(".md") || path === ADAPTER) continue;
    const text = bytes.toString("utf8").replace(LINK, (link, href) => {
      const target = resolve(path, href);
      if (!target || target.split("/")[0] === ".." || has(files, target)) return link;
      const kind = statSync(join(PSTACK, target)).isDirectory() ? "tree" : "blob";
      return `](${GITHUB}/${kind}/main/pstack/${target}${href.slice(href.search(/[#?]|$/))})`;
    });
    files.set(path, Buffer.from(text));
  }
  const version = JSON.parse(readFileSync(join(PSTACK, "plugin.json"), "utf8")).version;
  const commit = execFileSync("git", ["-C", SOURCE, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  files.set("VERSION", Buffer.from(`pstack ${version}\ncursor/plugins ${commit}\n`));
  return files;
}

const files = render();
const dangling = [];
for (const [path, bytes] of files) {
  if (!path.endsWith(".md") || path === ADAPTER) continue;
  for (const [, href] of bytes.toString("utf8").matchAll(LINK)) {
    const target = resolve(path, href);
    if (target && !has(files, target)) dangling.push(`tree/${path} links to ${href}, which is not in the tree`);
  }
}
for (const link of dangling) console.log(`FAIL ${link}`);
if (dangling.length > 0) process.exit(1);

if (process.argv.includes("--check")) {
  const onDisk = new Map(existsSync(OUT) ? walk(OUT).map((path) => [relative(OUT, path).split("\\").join("/"), readFileSync(path)]) : []);
  const drifted = [...new Set([...files.keys(), ...onDisk.keys()])].sort().filter((path) => {
    const [want, have] = [files.get(path), onDisk.get(path)];
    return !want || !have || !want.equals(have);
  });
  for (const path of drifted.slice(0, 20)) console.log(`tree/${path}`);
  if (drifted.length > 0) {
    console.log("tree/ is out of date. Run scripts/build-tree.mjs and commit the result.");
    process.exit(1);
  }
  console.log("tree/ is up to date.");
} else {
  rmSync(OUT, { recursive: true, force: true });
  for (const [path, bytes] of files) {
    mkdirSync(dirname(join(OUT, path)), { recursive: true });
    writeFileSync(join(OUT, path), bytes);
  }
  const wrapped = [...classes.values()].filter(({ wrap }) => wrap).length;
  console.log(`${skills.length} skills, ${wrapped} SKILL.md files with the adapter line, ${files.size} files`);
}
