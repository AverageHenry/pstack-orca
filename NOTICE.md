# Notice

This is a community port. It is not made, reviewed, or endorsed by Lauren Tan, Cursor, or the Orca team.

`tree/` is generated from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan, MIT license. `tree/VERSION` names the pstack version and the `cursor/plugins` commit it came from. The only changes are the ones `scripts/build-tree.mjs` makes: one line added under the title of each skill that uses Cursor names, links to files the tree leaves out pointed at GitHub, `docs/harness/orca.md` added, and the guide images and the `statechart` test corpus left out to keep the plugin small.

`scripts/build-tree.mjs` is adapted from `scripts/generate-pstack-harness-trees.mjs` in the same repository, MIT license.

Five skills in `tree/skills/` (`grilling`, `diagnosing-bugs`, `writing-for-agents`, `research`, `wizard`) are copied unchanged from [mattpocock/skills](https://github.com/mattpocock/skills) by Matt Pocock, MIT license, at the commit `tree/VERSION` names. His license text is `tree/LICENSE.mattpocock-skills`. This is not made, reviewed, or endorsed by Matt Pocock.

`tree/skills/deslop` is copied unchanged from [cursor-team-kit](https://github.com/cursor/plugins/tree/main/cursor-team-kit) by Cursor, MIT license, at the same commit as pstack. Its license text is `tree/LICENSE.cursor-team-kit`.

The hybrid routing in `adapter/orca.md` (a subagent runs on the agent's own subagent tool unless it needs another model, its own worktree that the tool cannot make, or a longer-lived session; a panel decides seat by seat; a model that cannot be launched makes the seat unavailable instead of falling back to the parent model; a first token `opus`, `sonnet`, `haiku` or `fable` is a Claude alias) follows the split in [micaelsgarcez/pstack-orca](https://github.com/micaelsgarcez/pstack-orca) (`skills/poteto-mode/SKILL.md`) and [monarchjuno/orca-pstack](https://github.com/monarchjuno/orca-pstack) (`skills/orca-pstack/SKILL.md`), both MIT license. The wording here is this port's own.

Report a problem with the port here, not to pstack or to mattpocock/skills.
