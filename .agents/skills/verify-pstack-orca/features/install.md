# Install

Copies `tree/` to `<home>/.pstack-orca` and writes one stub folder per skill into each agent's skills folder.

## Sub-features

- Only agents whose home folder exists get stubs. The summary line for the others says `agent not found, nothing placed`.
- Each stub folder holds `SKILL.md` and `.pstack-orca.json`. For Codex, a skill marked `disable-model-invocation: true` also gets `agents/openai.yaml`.
- Each stub names the pstack home by absolute path, with forward slashes.
- Reinstalling replaces the copy and the stubs, and leaves `<home>/.pstack-orca/pstack-models.md` byte for byte as it was.
- `--dry-run` reports the same counts and writes nothing.

## How to get to it (user POV)

In Orca, the command "pstack: Install or update skills for my agents". Outside Orca, `node scripts/place.mjs install`.

## Driving it with the CLI

```text
node HOME_SH new claude codex
node scripts/place.mjs install --home <home>
node HOME_SH snapshot <home>
```

Proof of a working install: the summary says `claude: 64 skills` and `codex: 64 skills`; the snapshot has 64 `dir` lines directly under `.claude/skills` and under `.agents/skills`, none under `.gemini`, `.cursor` or `.grok`; `<home>/.pstack-orca/VERSION` exists; and the path inside any stub's `SKILL.md` resolves to an existing file.

For the reinstall claim, write any text to `<home>/.pstack-orca/pstack-models.md`, install again, and compare that file's line in the two snapshots.

## Gotchas

- The count follows `tree/skills`. When a source adds or drops a skill, 64 changes: read the expected number from `ls tree/skills`.
- A relative `--home` is resolved against the current directory, so run from the repository root.
- Codex stubs go in `.agents/skills`, not `.codex/skills`, although the agent's home folder is `.codex`.
