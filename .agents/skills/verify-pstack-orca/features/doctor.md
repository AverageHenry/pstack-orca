# Doctor

A read-only check of an install: are the stubs there, do they point at a pstack home that exists, and are the pstack home and the stubs as new as the release that runs the check.

## Sub-features

- One line per agent: `<agent>: N stubs, B broken, S stale`.
- Broken: the stub points at a pstack home or skill file that does not exist, or its marker is unreadable.
- Stale: `<home>/.pstack-orca/VERSION`, or the version in a stub's marker, differs from this release's `tree/VERSION`. Its last line names the pstack-orca version, so an install made by an older release is stale even when only the adapter changed. A stale pstack home gets its own line: `pstack home is stale, ...`.
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

Then make an install with an older release in a second scratch home and check it with the current doctor:

```text
git archive <older commit> | tar -x -C <dir>
node <dir>/scripts/place.mjs install --home <home2>
node scripts/doctor.mjs --home <home2>         # expect exit 1, the pstack home stale, every stub stale
```

Proof that it writes nothing: a snapshot taken after the first run equals `before.txt`.

## Gotchas

- `--home` is required. There is no default, so it never checks the real home by accident.
- A folder without the marker is the user's own and is not counted at all.
