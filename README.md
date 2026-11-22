# pstack skills for Orca (community port)

[pstack](https://github.com/cursor/plugins/tree/main/pstack) is Lauren Tan's skill pack for rigorous agent work, written for Cursor. This plugin installs it for the agents you run in [Orca](https://github.com/stablyai/orca): Claude Code, Codex, Antigravity, Cursor and Grok. See [NOTICE.md](./NOTICE.md) for what is and is not changed.

Five skills by [Matt Pocock](https://github.com/mattpocock/skills) come with it, unchanged: `grilling` (interview before building), `diagnosing-bugs`, `writing-for-agents`, `research` and `wizard`. pstack has no equivalent for them. They were picked after checking current vendor guidance and measured studies; his spec, ticket, TDD and review flow is left out because pstack covers that ground differently.

## What it does

- Skills are the same text as pstack. One file, [`adapter/orca.md`](./adapter/orca.md), maps the Cursor names in them to Orca.
- Work that a subagent hands back (code, review, judging) runs as an Orca worker through Orca's bundled `orchestration` skill, so a review panel can seat a different agent in each chair. Searching and reading stays with the agent you are talking to.
- Steps that need a Cursor-only feature, such as Automations or Bugbot, are skipped with one line.

## Install

```text
orca plugin install Tauri-EPO/pstack-orca
```

Orca asks you to approve it, because the plugin runs code. Then run **pstack: Install or update skills for my agents** from the command palette.

That copies pstack to `~/.pstack-orca` and writes one small stub per skill into each agent's skills folder. It only touches agents whose home folder exists and never overwrites a skill folder or link it did not create. **pstack: Remove skills from my agents** removes only the files it wrote and keeps `~/.pstack-orca/pstack-models.md`, your model choices.

Then, in any agent, run `setup-pstack` once and use `poteto-mode` for work that needs rigor.

## Limits

- Orca has no read-only worker. A judge is told not to edit, and the coordinator checks `git status` afterward.
- An Orca worker ends the coordinator's turn, so `arena`, `swarm` and `interrogate` run across several turns.
- Tested on Windows only, with Claude Code coordinating and Codex and Antigravity as workers. Not yet tested on macOS or Linux, with Cursor or Grok, or for `setup-pstack` and `poteto-mode`.
- Skills are manual: type the name. In Codex and Antigravity they do not show in the automatic skill list.

## Updating from the sources

```text
git clone -c core.autocrlf=false https://github.com/cursor/plugins
git clone -c core.autocrlf=false https://github.com/mattpocock/skills
node scripts/build-tree.mjs <cursor/plugins checkout> <mattpocock/skills checkout>
```

The build fails when a skill uses a Cursor name the adapter has no row for.
