# Feature map

What pstack-orca does for a user, and the end state that proves each part works. One file per feature. Drive every one in a scratch home, as [the skill](../SKILL.md) says.

| Feature | Proves |
| --- | --- |
| [Install](install.md) | A full copy lands in the pstack home and one stub per skill in each agent that exists |
| [Uninstall](uninstall.md) | Only what install wrote is removed, and the user's model choices stay |
| [The user's own skills](user-owned-skills.md) | A folder or link the installer did not create is never replaced or removed |
| [Doctor](doctor.md) | A broken or stale stub is reported, and nothing is written |
| [Generator](generator.md) | `tree/` is exactly what the two sources and the adapter produce |
| [Plugin commands](plugin-commands.md) | The Orca commands reach the same code and honor a dry run |
