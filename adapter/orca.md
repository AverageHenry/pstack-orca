# pstack in Orca

pstack skills use Cursor names. In an agent running inside Orca (Claude Code, Codex, Antigravity, Cursor, Grok, or any other), read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`, which is the folder two levels above this file. If a Cursor field has no row, drop it and say so. Never pass a flag or value that the tool or the `orca` CLI rejects.

## The one rule

Work that another agent hands back goes to an Orca worker. Searching and reading stays with you.

- A subagent that writes code, judges, reviews, or produces any artifact is an Orca worker, whichever agent you are. Load the bundled **orchestration** skill (`orca skills get orchestration`) once and follow it.
- A subagent that only searches or reads (`readonly: true` explorers, lookups, "find where X is defined") is yours. Use your own subagent tool if you have one. Otherwise do the search yourself in this turn.
- Use the bundled **orca-cli** skill for worktrees, terminals, and a handoff where nothing comes back.

## Tools

| Cursor | Orca |
| --- | --- |
| `Task` that produces an artifact | `orca orchestration worker-start --spec-file <file> --agent <agent> [--model <id> --effort <level>] --worktree <current or new-child>`. Write the brief to a file first, so quotes need no escaping. |
| `Task` that only searches or reads | Your own subagent tool, or do it yourself. See the one rule. |
| `AskQuestion` | Your agent's own question tool. With none, ask in plain text. |
| Open a todolist, or copy steps into the todolist tool | Your agent's own todo tool. With none, keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | Read `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write the name in the form their agent uses, such as `/name`. |
| The **create-skill** skill, Cursor's built-in for authoring a `SKILL.md` | Read `<pstack>/skills/writing-for-agents/SKILL.md` and follow it. It ships with this install. |
| `/deslop` from the `cursor-team-kit` plugin | Read `<pstack>/skills/deslop/SKILL.md` and follow it. It ships with this install. |
| `control-ui` from `cursor-team-kit`, "the control skill" for a web, IDE or Electron surface | The project's own verification skill first: a skill named `verify-<app>` in the repository's skills folders. With none, Orca's built-in browser through the bundled **orca-cli** skill for a web page, and the bundled **orca-computer-use** skill for a native window. Say which one you used. |
| `control-cli` from `cursor-team-kit`, "the control skill" for a CLI or TUI | The project's own verification skill first. With none, an Orca terminal through the bundled **orca-cli** skill: create it with the command under test, send one input at a time, wait for it to go idle, and read the screen. Do not use `tmux`. |
| Cursor's `/loop` command | Your agent's own loop command if it has one, such as `/loop` in Claude Code. Otherwise say so, do as much as one turn allows, and tell the user what to send to continue. |

## Workers end your turn

A Cursor `Task` returns in the same turn. An Orca worker does not. Each phase that fans out becomes two turns:

1. When a phase starts more than one worker, create the Run first with `orca orchestration run-create --objective "<goal>"` and pass `--run <run_id>` to each start, so they share one Run. Start every worker of the phase from one shell command, at most four at once, then end your turn. Say which phase is waiting and on which workers.
2. Orca wakes you with each `worker_done`. When every worker of the phase has settled, go on to the next phase. Start the rest of a larger group as earlier workers return.

A `worker_done` message is a summary. When a step needs the exact command a worker ran and what it printed, read `orca orchestration worker-read --dispatch <dispatch_id> --source transcript`.

Never poll, sleep, or watch a worker's terminal. If a worker stops without `worker_done`, follow the orchestration skill's recovery reference. Proceed with N-1 only where the skill allows a dropout, and say so.

## Subagent fields

| Cursor | Orca |
| --- | --- |
| `subagent_type: generalPurpose` | A worker whose spec is the brief alone. When the same call only searches or reads, the one rule wins and the work is yours. |
| `poteto-agent` | A worker whose spec starts with: "Read `<pstack>/docs/harness/orca.md`, then `<pstack>/skills/poteto-mode/SKILL.md` in full, including its Principles index, before any work. You are a delegate. The chat that started you owns the playbook, the todo list, and every worker." Write `<pstack>` as an absolute path. |
| `comment-sicko` | A worker whose spec starts with the body of `<pstack>/agents/comment-sicko.md`. |
| The `model:` line in an agent file | It holds a Cursor slug. Never pass it. Map the role with the Models table. |
| `readonly: true` on a searcher | Yours. See the one rule. |
| `readonly: true` on a judge or reviewer | A worker. Orca has no read-only worker, so the spec says "Do not edit, create, or delete files", and you run `git status` in its worktree when it reports. Report any change it made. |
| `readonly: false` | A worker. |
| `environment: "cloud"`, or "its own worktree" | `--worktree new-child --name <short-name>`. Name the branch or commit the worker starts from with `--base-branch`. |
| `environment: "local"` | `--worktree current`. |
| `cloud_base_branch: <b>` | `--base-branch <b>` with `--worktree new-child`. |
| `run_in_background: true` | Omit. Every worker runs in the background. |
| `resume` | `orca orchestration send --to dispatch:<dispatch_id> --subject "<topic>" --body "<message>"`. It reaches a working worker when its turn ends and reopens a finished one. |
| `file_attachments` | List the absolute paths in the spec. |

## Models

A role names an Orca agent, then optionally a model and an effort: `<agent> [<model> <effort>]`, such as `codex` or `claude claude-opus-5-5 xhigh`.

| Cursor | Orca |
| --- | --- |
| `~/.cursor/rules/pstack-models.mdc`, the `pstack-models.mdc` rule | `<pstack>/pstack-models.md`. No agent loads it for you, so read it the first time a step needs a role. A role with no line uses the default below. |
| A role value `<agent> <model> <effort>` | `--agent <agent> --model <model> --effort <effort>`. |
| A role value `<agent> <model>` with no effort, such as `antigravity gemini-4-neon-xhigh` | `--agent <agent> --model <model>` with no `--effort`. Antigravity model ids carry their effort. |
| A role value `<agent>` alone | `--agent <agent>` with no `--model`. The worker runs on the model that agent is configured with. |
| `auto` or `inherit-parent` | `--agent` is the agent you are running as, with no `--model`. |
| A `claude-<family>-<version>-<effort>[-fast]` slug with no line in the file | `--agent claude --model claude-<family>-<version> --effort <effort>`. Drop `-fast`. |
| A `gemini-*` slug with no line in the file | `--agent antigravity` with no `--model`. |
| A `gpt-*` slug with no line in the file | `--agent codex` with no `--model`. |
| A `grok-*` slug with no line in the file | `--agent grok` with no `--model`. |
| "Never from the parent's vendor", "another model family" | Another Orca agent than the one you are running as. Claude Code is Anthropic, Codex is OpenAI, Antigravity is Google, Grok is xAI. A Cursor worker's vendor is the vendor of its model. |
| A judge or reviewer of several candidates | Prefer an agent that produced none of the candidates, and that is not the agent you are running as. With Claude, Codex and Antigravity available and candidates from two of them, the third judges. When every available agent has a candidate in the race, say that the judge shares a vendor with one, and weigh its pick with that in mind. |
| "If the Task tool rejects a slug" | If `worker-start` fails with `agent_readiness`, that agent's CLI is missing or not signed in. Drop the seat, keep at least two runners where the skill asks for it, and say so. Do not rerun the same command. |

## setup-pstack

`setup-pstack` writes `<pstack>/pstack-models.md` in place of the Cursor rule. Follow its steps with these changes:

- Detect. Ask the user which Orca agents they use, and offer the ones named in `orca orchestration worker-start --help`. Orca has no command that lists models, so find each agent's model ids on this machine: for Codex, the `slug` values in `~/.codex/models_cache.json`; for Claude Code, the ids the user's Claude account offers, such as `claude-opus-5-5`; for Antigravity, the ids its own model picker shows, which end in the effort, such as `gemini-4-neon-xhigh`. Confirm an id before you write it: start one worker with it and a one-line spec, and keep the id only when the start receipt says `ready` with that model. Never write a model id you have not confirmed this way. An agent with no confirmed id is written as the agent alone.
- Panels. Follow the judge row of the Models table: order `arena cross-judge pool` so that its first entry is an agent with no entry in `arena runners`.
- Defaults. Map each default slug with the Models table.
- Budget. The effort is the last token of a three-token value. For a two-token Antigravity value it is the ending of the model id, so the budget step swaps that ending for a confirmed id of the same model. A value with the agent alone has no effort, so the budget step leaves it as it is.
- Write. Write `<pstack>/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role. Overwrite the whole file. Reinstalling pstack keeps this file.

## Paths

| Cursor | Orca |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | The skills folder of the agent you are running as. `orca skills installed` lists every folder Orca found. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `<pstack>`. Its `VERSION` file names the pstack version and the upstream commit. |
| `.cursor/rules/*.mdc`, always-applied rules | The instruction file your agent loads, such as `AGENTS.md` or `CLAUDE.md`. The model file is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | For a worker, `orca orchestration worker-read --source transcript`. For your own history, your agent's own transcript folder if you know it. Otherwise skip the step with the line below. |

## Cursor-only features

Orca has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in Orca: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, leave a placeholder and name it in the line.

| Cursor | Orca |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a child worktree, as in Subagent fields. Skip a step that needs the cloud agent itself. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |

## Clean up the worktrees you created

Each `--worktree new-child` or `new-top-level` start leaves a worktree and a branch behind. Removing them is part of finishing, not a favour.

1. Clean up when the Run has settled and its result is safe: merged, cherry-picked, or reported to the user who then said what to keep.
2. Remove only worktrees this Run created. `orca orchestration worker-list --run <run_id>` names them.
3. Remove child worktrees before their parent, each with `orca worktree rm --worktree "path:<path>" --delete-branch`. Orca stops the sessions in it and keeps any branch whose commits it cannot prove are merged.
4. Never use `git worktree remove`, `rm -rf`, or `--force` for this. A removal Orca refuses is a decision for the user: name the worktree and the reason.
5. End your reply with the worktrees removed and every branch Orca kept, with the commit each one holds.

| Cursor | Orca |
| --- | --- |
| The Worktree cleanup playbook: `git worktree list`, `git worktree remove --force <path>` | `orca worktree list --json` and `orca worktree rm`, with the same gates: a pinned or active chat wins, and uncommitted work needs the user's decision first. |

## Skills from Matt Pocock

`grilling`, `diagnosing-bugs`, `writing-for-agents`, `research` and `wizard` come from [mattpocock/skills](https://github.com/mattpocock/skills), unchanged. They use general names, not Cursor names. Map them like this:

| In the skill | Orca |
| --- | --- |
| A "sub-agent" that looks something up, with or without "a fresh context window" | Yours. See the one rule. |
| The "background agent" in `research` | Your own background subagent if you have one. Otherwise an Orca worker whose spec is the question, the primary-sources rule, and the file to write. |
| "Call the Skill tool with `<name>`" | Read `<pstack>/skills/<name>/SKILL.md` and follow it. With no such folder, that skill is not part of this install. Say so and go on. |
| `GLOSSARY.md` and ADRs | Read them when the repository has them. Do not create them. |

Where they meet pstack:

- Run `grilling` before a build when the request leaves decisions open. Hand the settled decisions to `poteto-mode`.
- `diagnosing-bugs` finds the cause of a hard bug. The Bug fix playbook then delegates the fix, verifies it, and orders the commits.
- When `poteto-mode` splits work across workers, cut each slice through every layer it needs, so that it can be verified on its own.
