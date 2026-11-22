# Uninstall

Removes the stubs and the copy that install wrote, and nothing else.

## Sub-features

- Removes only folders that hold the `.pstack-orca.json` marker, and inside them only the files install wrote. A file the user added inside a stub folder stays, and so does the folder.
- Removes the skills folders install had to create, when they end up empty.
- Removes the generated entries of `<home>/.pstack-orca` and keeps `pstack-models.md`. The summary says `kept your model choices: <path>`.
- `--dry-run` reports what would be removed and writes nothing.

## How to get to it (user POV)

In Orca, the command "pstack: Remove skills from my agents". Outside Orca, `node scripts/place.mjs uninstall`.

## Driving it with the CLI

```text
node HOME_SH new
node HOME_SH snapshot <home> > before.txt
node scripts/place.mjs install --home <home>
node scripts/place.mjs uninstall --home <home>
node HOME_SH snapshot <home> > after.txt
diff before.txt after.txt
```

Proof of a clean round trip: the diff is empty. The home holds the five agent folders it started with and nothing more.

For the model-choices claim, write `<home>/.pstack-orca/pstack-models.md` between install and uninstall. Then the only extra lines in `after.txt` are the `.pstack-orca` folder and that one file, with the same hash it had.

## Gotchas

- An empty diff needs the `before` snapshot taken before install, on a home made by `new`.
- Uninstall also removes stubs of an agent whose home folder was deleted after install. That is intended: the stubs are still the installer's.
