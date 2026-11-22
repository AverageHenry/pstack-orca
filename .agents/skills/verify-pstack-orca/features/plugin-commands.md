# Plugin commands

`main.mjs` exposes install, status and uninstall as Orca commands and as worker handlers.

## Sub-features

- Three command-palette entries: install or update, show where skills are installed, remove.
- The same three as handlers named `install`, `status` and `uninstall`, which accept `{"dryRun": true}`.
- Each returns the same summary text the CLI prints.

## How to get to it (user POV)

In Orca: Settings, Plugins, enable the plugin, then run a "pstack:" command from the command palette.

## Driving it with the CLI

Needs a running Orca with this folder loaded as a development plugin (`orca plugin dev load <repository path>`, which asks the user for approval once).

```text
orca plugin validate . --json
orca plugin dev request local.pstack-orca status --json
orca plugin dev request local.pstack-orca install --data "{\"dryRun\":true}" --json
```

Proof: `validate` reports `"valid": true`; `status` returns one line per agent; the dry-run install returns a first line `Dry run: nothing was written.` and the home folder is unchanged.

## Gotchas

- These handlers act on the real home of the Orca host. Only `status` and a dry run are safe to call. A real install or uninstall here changes the user's agents, so ask the user first.
- Without Orca running, or without the development plugin loaded, `dev request` fails. That is a missing precondition, not a defect in the plugin.
- A published copy installed from the catalog has the key `tauri-epo.pstack-orca`, not `local.pstack-orca`.
