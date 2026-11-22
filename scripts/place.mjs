#!/usr/bin/env node
// Runs the plugin's commands without Orca.
import { install, status, summarize, uninstall } from '../skill-placement.mjs'

const USAGE = 'Usage: node scripts/place.mjs <install|uninstall|status> [--dry-run] [--json] [--home <dir>]'
const commands = new Map([['install', install], ['uninstall', uninstall], ['status', status]])

function fail(message) {
  console.error(`${message}\n${USAGE}`)
  process.exit(1)
}

const [command, ...rest] = process.argv.slice(2)
const run = commands.get(command)
if (!run) fail(`Unknown command: ${command ?? '(none)'}`)

const options = {}
let json = false
for (let index = 0; index < rest.length; index += 1) {
  const flag = rest[index]
  if (flag === '--dry-run') options.dryRun = true
  else if (flag === '--json') json = true
  else if (flag === '--home') {
    const value = rest[(index += 1)]
    // Why: a missing value must never fall back to the real home folder.
    if (!value || value.startsWith('--')) fail('--home needs a folder')
    options.home = value
  } else fail(`Unknown option: ${flag}`)
}

const result = run(options)
console.log(json ? JSON.stringify(result, null, 2) : summarize(result))
