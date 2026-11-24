#!/usr/bin/env node
// Scratch home folders for driving the installer. Usage:
//   node home.mjs new [agent...]        create a scratch home with those agent folders (default: all five), print its path
//   node home.mjs snapshot <home>       print every entry under it with a content hash, sorted
//   node home.mjs link <home> <agent> <skill>   put a junction (a directory symlink outside Windows) named <skill> in that agent's skills folder
//   node home.mjs remove <home>         delete a scratch home this script created
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'

const MARK = '.verify-pstack-orca-home'
const AGENT_HOME = { claude: '.claude', codex: '.codex', antigravity: '.gemini', cursor: '.cursor', grok: '.grok' }
const SKILLS = { claude: '.claude/skills', codex: '.agents/skills', antigravity: '.gemini/config/skills', cursor: '.cursor/skills', grok: '.grok/skills' }

function fail(message) {
  console.error(message)
  process.exit(1)
}

function scratch(home) {
  if (!home || !existsSync(join(home, MARK))) fail(`Not a scratch home made by this script: ${home ?? '(none)'}`)
  return home
}

function walk(dir, root = dir) {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name)
    const stat = lstatSync(path)
    const shown = relative(root, path).split(sep).join('/')
    if (stat.isSymbolicLink()) return [`link ${shown}`]
    if (stat.isDirectory()) return [`dir  ${shown}`, ...walk(path, root)]
    return [`file ${shown} ${createHash('sha1').update(readFileSync(path)).digest('hex').slice(0, 12)}`]
  })
}

const [command, ...args] = process.argv.slice(2)
if (command === 'new') {
  const agents = args.length ? args : Object.keys(AGENT_HOME)
  for (const agent of agents) if (!AGENT_HOME[agent]) fail(`Unknown agent: ${agent}. Choose from: ${Object.keys(AGENT_HOME).join(', ')}`)
  const home = mkdtempSync(join(tmpdir(), 'verify-pstack-orca-'))
  writeFileSync(join(home, MARK), '')
  for (const agent of agents) mkdirSync(join(home, AGENT_HOME[agent]), { recursive: true })
  console.log(home)
} else if (command === 'snapshot') {
  console.log(walk(scratch(args[0])).filter((line) => !line.endsWith(MARK) && !line.includes(`${MARK} `)).join('\n'))
} else if (command === 'link') {
  const [home, agent, skill] = args
  if (!SKILLS[agent] || !skill) fail('Usage: node home.mjs link <home> <agent> <skill>')
  const target = join(scratch(home), 'user-skill-target', skill)
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'SKILL.md'), 'a skill the user owns\n')
  mkdirSync(join(home, SKILLS[agent]), { recursive: true })
  symlinkSync(target, join(home, SKILLS[agent], skill), 'junction')
  console.log(join(home, SKILLS[agent], skill))
} else if (command === 'remove') {
  rmSync(scratch(args[0]), { recursive: true, force: true })
  console.log('removed')
} else fail('Usage: node home.mjs <new|snapshot|link|remove> ...')
