# The user's own skills

A skill folder or link the installer did not create is never replaced, changed or removed.

## Sub-features

- A folder without the `.pstack-orca.json` marker is skipped. The summary names it: `kept your own <skill>`.
- A link or junction is skipped whether its target exists, is missing, or is itself a pstack stub.
- Uninstall leaves all of these in place.
- An agent whose skills path is a file, not a folder, gets nothing: `<path> is not a folder, nothing placed`.

## How to get to it (user POV)

The user already has a skill with a pstack name, such as `tdd`, in an agent's skills folder, and then installs.

## Driving it with the CLI

```text
node HOME_SH new claude
node HOME_SH link <home> claude tdd
node HOME_SH snapshot <home> > before.txt
node scripts/place.mjs install --home <home>
node scripts/place.mjs uninstall --home <home>
node HOME_SH snapshot <home> > after.txt
```

Proof: install prints `claude: 63 skills, kept your own tdd`; the line `link .claude/skills/tdd` is in both snapshots; and the lines under `user-skill-target/` are identical in both, so nothing was written through the link.

For a plain folder, create `<home>/.claude/skills/tdd/SKILL.md` by hand in place of the `link` step and check that its hash is unchanged.

## Gotchas

- `link` makes a junction on Windows and a directory symlink on macOS and Linux. Run it before install: on a name that already has a stub it fails with `EEXIST`. A dangling link needs its target removed by hand after `link`: delete `<home>/user-skill-target/<skill>`.
- The count is 64 minus the skills kept, so two kept skills give 62.
