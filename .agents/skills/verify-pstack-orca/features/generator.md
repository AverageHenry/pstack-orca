# Generator

`scripts/build-tree.mjs` builds `tree/` from a `cursor/plugins` checkout, a `mattpocock/skills` checkout and `adapter/orca.md`.

## Sub-features

- Copies the pstack skills, agents and guide, and the chosen Matt Pocock skills, unchanged apart from one adapter line under the title of each pstack skill that uses Cursor names.
- Fails when a pstack skill uses a Cursor name that `adapter/orca.md` has no row for.
- Fails when a skill name exists in both sources.
- Points links to files the tree leaves out at GitHub.
- `--check` writes nothing and fails when `tree/` differs from what it would build.

## How to get to it (user POV)

A maintainer updating from the sources: `node scripts/build-tree.mjs <cursor/plugins checkout> <mattpocock/skills checkout>`.

## Driving it with the CLI

```text
node scripts/build-tree.mjs <plugins> <skills> --check     # expect "tree/ is up to date."
```

To prove the adapter check, remove one row from a copy of the repository's `adapter/orca.md` in a scratch clone and build there: expect `FAIL Orca adapter has no row for ...` and exit 1. Never edit the real `adapter/orca.md` for a proof.

## Gotchas

- Both source checkouts must be cloned with `core.autocrlf=false`. With line-ending conversion on, `--check` reports every text file as changed.
- `tree/VERSION` records the commit of each source and, on its last line, the `version` in `orca-plugin.json`. A source checkout at another commit, or a version bump without a rebuild, makes `--check` fail on that file alone.
- The build needs the source checkouts on disk. Without them, only the installer features can be driven.
