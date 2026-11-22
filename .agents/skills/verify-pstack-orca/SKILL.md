---
name: verify-pstack-orca
description: Drive the pstack-orca installer, doctor, generator and plugin commands the way a user does, in a scratch home folder, and capture proof. Use to reproduce a bug in this repo or to prove a change to skill-placement.mjs, main.mjs or scripts/ works before you report it.
---

# Verify pstack-orca

pstack-orca has no server. Its surface is three Node scripts and three Orca plugin commands, and everything they do lands in a home folder. So every drive runs against a scratch home, never the real one.

All commands run from the repository root. `HOME_SH` below is `.agents/skills/verify-pstack-orca/scripts/home.mjs`.

## Hard rule

Never run `scripts/place.mjs` without `--home <scratch home>`. Without it, it installs into the real home of whoever runs it. The same goes for the plugin commands in Orca: call them only with `{"dryRun": true}`.

## Launch

Needs Node 20 or later and nothing else: no install step, no build.

```text
node HOME_SH new                 # a scratch home with all five agent folders; prints its path
node HOME_SH new claude codex    # only those agents
```

Ready means the command printed a path. Keep it; every later command takes it. Two scratch homes never interfere, so runs can go side by side.

## Doctor

```text
node scripts/doctor.mjs --home <scratch home>
```

It writes nothing. Exit 0 with `0 broken, 0 stale` on every line means the install in that home is consistent. Exit 1 names what is wrong. Exit 2 means the arguments were wrong. Before driving anything, also confirm the tree matches its sources when both source checkouts are at hand:

```text
node scripts/build-tree.mjs <cursor/plugins checkout> <mattpocock/skills checkout> --check
```

## Drive

| Action | Command |
| --- | --- |
| Install | `node scripts/place.mjs install --home <home>` |
| Install, writing nothing | `node scripts/place.mjs install --home <home> --dry-run` |
| Status | `node scripts/place.mjs status --home <home>` |
| Uninstall | `node scripts/place.mjs uninstall --home <home>` |
| Machine-readable result | add `--json` to any of the three |
| Put a skill of the user's own in the way | `node HOME_SH link <home> <agent> <skill>` (a junction), or create `<home>/<agent skills folder>/<skill>/SKILL.md` by hand |
| Plugin command in a running Orca | `orca plugin dev request local.pstack-orca <install or status or uninstall> --data "{\"dryRun\":true}" --json` |

Agent skills folders under a home: `.claude/skills`, `.agents/skills` (Codex), `.gemini/config/skills` (Antigravity), `.cursor/skills`, `.grok/skills`. The full copy lives in `<home>/.pstack-orca`.

The feature map in [features/README.md](features/README.md) says, per feature, how to reach it and what end state proves it.

## Evidence

Put proof in `.notes/verify/<short-run-name>/`. `.notes/` is git-ignored and Cleanup never touches it.

For each claim, save the exact command, its full output and its exit code. For anything that changes the disk, save a snapshot before and after and diff them:

```text
node HOME_SH snapshot <home> > .notes/verify/<run>/before.txt
<the command>
node HOME_SH snapshot <home> > .notes/verify/<run>/after.txt
diff .notes/verify/<run>/before.txt .notes/verify/<run>/after.txt
```

A snapshot lists every folder, file with a content hash, and link under the home. Proof standards:

- The printed summary is a claim, not proof. "63 skills" is proven by the snapshot showing 63 stub folders.
- "Writes nothing" (dry run, doctor, status) is proven by identical snapshots before and after.
- "Left the user's skill alone" is proven by that entry's line being identical in both snapshots.
- An error path is proven by the non-zero exit code and by an unchanged snapshot.

## Cleanup

```text
node HOME_SH remove <scratch home>
```

It refuses any folder it did not create. Remove every scratch home you made, after every run including failed ones. Do not remove `.notes/verify/`.

## Helpers

`scripts/home.mjs` is the only helper. `new`, `snapshot`, `link` and `remove` are shown above; run it with no arguments for its usage line.

## Not covered

- The plugin's commands doing a real install inside Orca: that writes to the real home, so this skill only drives them as a dry run.
- macOS and Linux. `link` creates a junction, which is a Windows concept; on other systems Node makes a directory symlink instead.
- An agent actually loading a stub and following it to the real skill. That needs an agent session, not this harness.
