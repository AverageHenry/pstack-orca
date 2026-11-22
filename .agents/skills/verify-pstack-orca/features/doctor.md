# Doctor

A read-only check of an install: are the stubs there, do they point at a pstack home that exists, and are they as new as the installed copy.

## Sub-features

- One line per agent: `<agent>: N stubs, B broken, S stale`.
- Broken: the stub points at a pstack home or skill file that does not exist, or its marker is unreadable.
- Stale: the version in the stub's marker differs from `<home>/.pstack-orca/VERSION`.
- Exit 0 when nothing is broken or stale, 1 when something is, 2 on wrong arguments.

## How to get to it (user POV)

`node scripts/doctor.mjs --home <home folder>`, when an agent says it cannot find a pstack skill, or after updating the plugin.

## Driving it with the CLI

```text
node HOME_SH new claude codex
node scripts/place.mjs install --home <home>
node HOME_SH snapshot <home> > before.txt
node scripts/doctor.mjs --home <home>          # expect exit 0, 0 broken, 0 stale
```

Then change the first line of `<home>/.pstack-orca/VERSION` by hand and run it again: expect exit 1 and every stub counted as stale. Proof that it writes nothing: a snapshot taken after the first run equals `before.txt`.

## Gotchas

- `--home` is required. There is no default, so it never checks the real home by accident.
- A folder without the marker is the user's own and is not counted at all.
