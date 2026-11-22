import { install, status, summarize, uninstall } from './skill-placement.mjs'

const actions = { install, status, uninstall }

export default function activate(orca) {
  for (const [name, run] of Object.entries(actions)) {
    const handler = (input) => summarize(run({ dryRun: input?.dryRun === true }))
    orca.commands.register(`pstack.${name}`, handler)
    // Why: lets `orca plugin dev request` and a future panel run the same action.
    orca.panels.handle(name, handler)
  }
}
