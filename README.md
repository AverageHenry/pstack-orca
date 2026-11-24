# pstack skills for Orca (community port)

[pstack](https://github.com/cursor/plugins/tree/main/pstack) is Lauren Tan's skill pack for rigorous agent work, written for Cursor. This plugin installs it for the agents you run in [Orca](https://github.com/stablyai/orca): Claude Code, Codex, Antigravity, Cursor and Grok. See [NOTICE.md](./NOTICE.md) for what is and is not changed.

Five skills by [Matt Pocock](https://github.com/mattpocock/skills) come with it, unchanged: `grilling` (interview before building), `diagnosing-bugs`, `writing-for-agents`, `research` and `wizard`. pstack has no equivalent for them. `deslop`, which pstack runs on the diff before each commit, comes from Cursor's `cursor-team-kit`, unchanged.

The five by Matt Pocock were picked after checking current vendor guidance and measured studies; his spec, ticket, TDD and review flow is left out because pstack covers that ground differently.

## What it does

- Skills are the same text as pstack. One file, [`adapter/orca.md`](./adapter/orca.md), maps the Cursor names in them to Orca.
- A subagent runs on the coordinating agent's own subagent tool when that tool can select the model its role asks for: in Claude Code, the `Agent` tool with `opus`, `sonnet`, `haiku` or `fable`, or the parent model. It becomes an Orca worker, through Orca's bundled `orchestration` skill, only when it needs a model from another vendor or one the tool cannot select, its own worktree when the tool cannot make one, or a session that outlives the chat. In Claude Code, a seat that needs its own worktree, such as a `swarm` worker or an `interrogate` adversary, is an `Agent` seat with `isolation: "worktree"`. A review panel decides seat by seat, so it can still seat a different agent in each chair. An agent with no subagent tool sends every such subagent to an Orca worker. Searching and reading stays with the agent you are talking to.
- The model sheet, `~/.pstack-orca/pstack-models.md`, takes a Claude alias with an optional effort, such as `opus xhigh`, or an Orca agent with an optional model and effort, such as `codex` or `claude claude-opus-5-5 xhigh`. It is the only sheet the port reads: any other pstack model sheet in an agent's context, such as `~/.claude/pstack-models.md` from another install, is ignored.
- Steps that need a Cursor-only feature, such as Automations or Bugbot, are skipped with one line.

## Install

```text
orca plugin install Tauri-EPO/pstack-orca
```

Orca asks you to approve it, because the plugin runs code. Then run **pstack: Install or update skills for my agents** from the command palette.

That copies pstack to `~/.pstack-orca` and writes one small stub per skill into each agent's skills folder. It only touches agents whose home folder exists and never overwrites a skill folder or link it did not create. **pstack: Remove skills from my agents** removes only the files it wrote and keeps `~/.pstack-orca/pstack-models.md`, your model choices.

Then, in any agent, run `setup-pstack` once and use `poteto-mode` for work that needs rigor.

`node scripts/doctor.mjs --home <your home folder>` checks an install without writing anything: it counts each agent's stubs and exits non-zero when one is broken, or when the install was made by a different release than the one you run it from.

## Limits

- Neither route has an enforced read-only mode. A judge is told not to edit, and the coordinator checks `git status` afterward.
- An Orca worker ends the coordinator's turn, so a phase with at least one worker runs across two turns. Native subagents run in the background, and their results can also arrive in a later turn. One native subagent whose result the next step needs runs in the foreground and returns in the same turn.
- A Claude Code subagent with its own worktree starts from the remote's default branch, as Claude Code's `worktree.baseRef` setting defaults to, not from the coordinator's branch. The coordinator names the commit in the brief and the subagent resets to it.
- A seat whose model cannot be launched is reported as unavailable, never run on the parent model instead.
- The installer, doctor and build were run on Windows and macOS. Routing was tested on Windows with Claude Code coordinating and Codex and Antigravity as workers, before native seats existed. One `poteto-mode` run on macOS (the Bug fix playbook and one `interrogate` pass, Claude Code coordinating, native seats with and without their own worktree and one Antigravity worker) worked; this release's fixes for what it found have not been run again. Linux, Cursor and Grok, `setup-pstack`, and `swarm` and `arena` in Orca have not been tested end to end.
- Skills are manual: type the name. In Codex and Antigravity they do not show in the automatic skill list.

## Updating from the sources

```text
git clone -c core.autocrlf=false https://github.com/cursor/plugins
git clone -c core.autocrlf=false https://github.com/mattpocock/skills
node scripts/build-tree.mjs <cursor/plugins checkout> <mattpocock/skills checkout>
```

The build fails when a skill uses a Cursor name the adapter has no row for.

## Checking a change

`.agents/skills/verify-pstack-orca/` is a skill for agents working on this repository. It drives the installer in a scratch home folder and says what proves each feature. Start at its `SKILL.md`.
