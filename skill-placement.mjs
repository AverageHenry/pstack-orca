// Places pstack on this machine: one full copy in the pstack home, and one stub per skill in each agent's skills folder.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TREE = join(dirname(fileURLToPath(import.meta.url)), 'tree')
const MARKER = '.pstack-orca.json'
const MODELS_FILE = 'pstack-models.md'
const CODEX_POLICY = join('agents', 'openai.yaml')

// Same global skill folders Orca's own skill installer uses for these agents.
export function agentRoots(home = homedir()) {
  return [
    { agent: 'claude', agentHome: join(home, '.claude'), skills: join(home, '.claude', 'skills') },
    { agent: 'codex', agentHome: join(home, '.codex'), skills: join(home, '.agents', 'skills'), codexPolicy: true },
    { agent: 'antigravity', agentHome: join(home, '.gemini'), skills: join(home, '.gemini', 'config', 'skills') },
    { agent: 'cursor', agentHome: join(home, '.cursor'), skills: join(home, '.cursor', 'skills') },
    { agent: 'grok', agentHome: join(home, '.grok'), skills: join(home, '.grok', 'skills') }
  ]
}

export function pstackHome(home = homedir()) {
  return join(resolve(home), '.pstack-orca')
}

const forward = (path) => path.split('\\').join('/')

// Why lstat: a link, even a dangling one, is the user's own entry and must not be followed or replaced.
function entryKind(path) {
  try {
    const stat = lstatSync(path)
    return stat.isSymbolicLink() ? 'link' : stat.isDirectory() ? 'dir' : 'file'
  } catch {
    return 'none'
  }
}

function isFolder(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function isOurs(dir) {
  return entryKind(dir) === 'dir' && entryKind(join(dir, MARKER)) === 'file'
}

function removeIfEmpty(dir) {
  try {
    if (entryKind(dir) === 'dir' && readdirSync(dir).length === 0) rmdirSync(dir)
  } catch {
    // Someone else is using the folder; leaving it is harmless.
  }
}

function stub(skill, source, target) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0]
  if (!frontmatter) throw new Error(`skills/${skill}/SKILL.md has no frontmatter`)
  const root = forward(target)
  return `${frontmatter.replace(/\r\n/g, '\n')}

# ${skill}

This is a stub. pstack is installed at \`${root}\`.

1. Read \`${root}/docs/harness/orca.md\` once per session.
2. Read \`${root}/skills/${skill}/SKILL.md\` in full and follow it. Relative links in that file resolve from its own folder.
`
}

export function install({ home = homedir(), tree = TREE, dryRun = false } = {}) {
  home = resolve(home)
  const target = pstackHome(home)
  const version = readFileSync(join(tree, 'VERSION'), 'utf8').trim()
  const skills = readdirSync(join(tree, 'skills'))
  if (!dryRun) {
    mkdirSync(target, { recursive: true })
    // Why entry by entry: the user's model choices live beside these and must survive a copy that fails halfway.
    for (const name of readdirSync(tree)) {
      rmSync(join(target, name), { recursive: true, force: true })
      cpSync(join(tree, name), join(target, name), { recursive: true })
    }
  }
  const agents = []
  for (const { agent, agentHome, skills: root, codexPolicy } of agentRoots(home)) {
    if (!isFolder(agentHome)) {
      agents.push({ agent, root, status: 'not-installed', placed: 0, skipped: [] })
      continue
    }
    if (entryKind(root) !== 'none' && !isFolder(root)) {
      agents.push({ agent, root, status: 'blocked', placed: 0, skipped: [] })
      continue
    }
    const skipped = []
    let placed = 0
    for (const skill of skills) {
      const dir = join(root, skill)
      // Why: anything already there without our marker is the user's own; never overwrite it.
      if (entryKind(dir) !== 'none' && !isOurs(dir)) {
        skipped.push(skill)
        continue
      }
      placed += 1
      if (dryRun) continue
      mkdirSync(dir, { recursive: true })
      const source = readFileSync(join(tree, 'skills', skill, 'SKILL.md'), 'utf8')
      writeFileSync(join(dir, 'SKILL.md'), stub(skill, source, target))
      writeFileSync(join(dir, MARKER), `${JSON.stringify({ version })}\n`)
      // Why: Codex ignores `disable-model-invocation`; its own policy file keeps a manual skill manual.
      if (codexPolicy && /^disable-model-invocation:\s*true\s*$/m.test(source)) {
        mkdirSync(join(dir, 'agents'), { recursive: true })
        writeFileSync(join(dir, CODEX_POLICY), 'policy:\n  allow_implicit_invocation: false\n')
      } else {
        rmSync(join(dir, CODEX_POLICY), { force: true })
        removeIfEmpty(join(dir, 'agents'))
      }
    }
    agents.push({ agent, root, status: 'ok', placed, skipped })
  }
  return { home: target, version, dryRun, agents }
}

export function uninstall({ home = homedir(), tree = TREE, dryRun = false } = {}) {
  home = resolve(home)
  const agents = []
  for (const { agent, agentHome, skills: root } of agentRoots(home)) {
    let removed = 0
    for (const name of isFolder(root) ? readdirSync(root) : []) {
      const dir = join(root, name)
      if (!isOurs(dir)) continue
      removed += 1
      if (dryRun) continue
      // Why file by file: a note the user added inside a stub folder is theirs, so the folder stays if it is not empty.
      for (const file of ['SKILL.md', MARKER, CODEX_POLICY]) rmSync(join(dir, file), { force: true })
      removeIfEmpty(join(dir, 'agents'))
      removeIfEmpty(dir)
    }
    if (!dryRun) {
      removeIfEmpty(root)
      if (dirname(root) !== agentHome) removeIfEmpty(dirname(root))
    }
    agents.push({ agent, root, removed })
  }
  const target = pstackHome(home)
  const keptModels = entryKind(join(target, MODELS_FILE)) !== 'none'
  if (!dryRun && entryKind(target) === 'dir') {
    for (const name of readdirSync(tree)) rmSync(join(target, name), { recursive: true, force: true })
    removeIfEmpty(target)
  }
  return { home: target, dryRun, keptModels, agents }
}

export function status({ home = homedir() } = {}) {
  home = resolve(home)
  const target = pstackHome(home)
  const versionFile = join(target, 'VERSION')
  return {
    home: target,
    version: entryKind(versionFile) === 'file' ? readFileSync(versionFile, 'utf8').trim() : null,
    agents: agentRoots(home).map(({ agent, skills: root }) => ({
      agent,
      root,
      placed: (isFolder(root) ? readdirSync(root) : []).filter((name) => isOurs(join(root, name))).length
    }))
  }
}

export function summarize(result) {
  const lines = [`pstack home: ${result.home}${result.version ? ` (${result.version.split('\n')[0]})` : ''}`]
  if (result.dryRun) lines.unshift('Dry run: nothing was written.')
  for (const entry of result.agents) {
    if (entry.status === 'not-installed') lines.push(`${entry.agent}: agent not found, nothing placed`)
    else if (entry.status === 'blocked') lines.push(`${entry.agent}: ${entry.root} is not a folder, nothing placed`)
    else if ('removed' in entry) lines.push(`${entry.agent}: ${entry.removed} skills ${result.dryRun ? 'would be removed' : 'removed'}`)
    else if (entry.skipped?.length) lines.push(`${entry.agent}: ${entry.placed} skills, kept your own ${entry.skipped.join(', ')}`)
    else lines.push(`${entry.agent}: ${entry.placed} skills`)
  }
  if (result.keptModels) lines.push(`kept your model choices: ${join(result.home, MODELS_FILE)}`)
  return lines.join('\n')
}
