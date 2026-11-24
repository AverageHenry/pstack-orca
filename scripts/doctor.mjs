#!/usr/bin/env node
// Checks an install without writing: the pstack home and each stub must carry this release's version, and each stub must point at a pstack home that has its skill.
import { lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { agentRoots, pstackHome } from '../skill-placement.mjs'

const USAGE = 'Usage: node scripts/doctor.mjs --home <dir>'
const MARKER = '.pstack-orca.json'
const SHOWN = 5
const RELEASE_VERSION = join(dirname(fileURLToPath(import.meta.url)), '..', 'tree', 'VERSION')

// Why 2: exit code 1 means a broken stub or a stale install.
function fail(message) {
  console.error(`${message}\n${USAGE}`)
  process.exit(2)
}

function attempt(read) {
  try {
    return read()
  } catch {
    return undefined
  }
}

const isFolder = (path) => attempt(() => statSync(path).isDirectory()) === true
// Why: a VERSION saved with CRLF is still the same version.
const clean = (version) => (typeof version === 'string' ? version.replace(/\r\n/g, '\n').trim() : '')

// Why lstat: same test as the installer, so a link the user made is never counted as a stub.
function stubs(root) {
  if (!isFolder(root)) return []
  return readdirSync(root).filter(
    (name) => attempt(() => lstatSync(join(root, name)).isDirectory() && lstatSync(join(root, name, MARKER)).isFile()) === true
  )
}

function broken(dir, skill) {
  const text = attempt(() => readFileSync(join(dir, 'SKILL.md'), 'utf8'))
  const pointed = text?.match(/^This is a stub\. pstack is installed at `([^`\r\n]+)`\./m)?.[1]
  if (!pointed) return 'names no pstack home'
  if (!isFolder(pointed)) return `points at ${pointed}, which does not exist`
  if (attempt(() => statSync(join(pointed, 'skills', skill, 'SKILL.md')).isFile()) !== true) return `${pointed} does not have this skill`
  return null
}

// Why the first differing line: VERSION has several lines, and the first one often still matches.
function stale(recorded, expected) {
  if (recorded === expected && expected) return null
  if (!recorded) return 'records no version'
  if (!expected) return 'this release has no VERSION'
  const [have, want] = [recorded.split('\n'), expected.split('\n')]
  let line = 0
  while (have[line] === want[line]) line += 1
  return `records "${have[line] ?? ''}", this release has "${want[line] ?? ''}"`
}

// Why no default: a check must never land on the real home folder by accident.
const [flag, value, ...extra] = process.argv.slice(2)
if (flag !== '--home' || !value || value.startsWith('-') || extra.length) fail('--home needs a folder, and is the only option')
const home = resolve(value)
if (!isFolder(home)) fail(`Not a folder: ${home}`)

const target = pstackHome(home)
const installed = clean(attempt(() => readFileSync(join(target, 'VERSION'), 'utf8')))
console.log(`pstack home: ${target} (${installed.split('\n')[0] || 'no VERSION'})`)
const releaseVersion = clean(attempt(() => readFileSync(RELEASE_VERSION, 'utf8')))
const homeStale = stale(installed, releaseVersion)
if (homeStale) console.log(`pstack home is stale, ${homeStale}`)

let bad = homeStale ? 1 : 0
for (const { agent, skills: root } of agentRoots(home)) {
  const counts = { broken: 0, stale: 0 }
  const found = new Map()
  const note = (kind, reason, skill) => {
    if (!reason) return
    counts[kind] += 1
    found.set(`${kind}, ${reason}`, [...(found.get(`${kind}, ${reason}`) ?? []), skill])
  }
  const names = stubs(root)
  for (const skill of names) {
    const dir = join(root, skill)
    note('broken', broken(dir, skill), skill)
    note('stale', stale(clean(attempt(() => JSON.parse(readFileSync(join(dir, MARKER), 'utf8')).version)), releaseVersion), skill)
  }
  bad += counts.broken + counts.stale
  console.log(`${agent}: ${names.length} stubs, ${counts.broken} broken, ${counts.stale} stale`)
  // Why capped: one changed VERSION makes every stub stale, and sixty names say nothing the count does not.
  for (const [problem, skills] of found) {
    const all = skills.length === names.length && names.length > 1
    const more = skills.length > SHOWN ? `, +${skills.length - SHOWN} more` : ''
    console.log(`  ${problem}: ${all ? `all ${names.length}` : skills.slice(0, SHOWN).join(', ') + more}`)
  }
}
if (bad) {
  console.log('Run the installer again to fix a stale pstack home or broken or stale stubs.')
  process.exitCode = 1
}
