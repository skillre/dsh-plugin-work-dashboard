# Uninstall and rollback

The user removes this bundle in their DSH Desktop Client or Web UI **Plugins** manager. To roll back, the user removes the faulty version and chooses a verified known-good package/version in that manager, if supported. Neither an agent nor a developer uninstalls preexisting user bundles or installs the replacement for them.

Temporary development tests use a different rule: stop the test process; remove only the test-created bundle/dependency/selection/config or the confirmed owned isolated non-Desktop profile; verify the test state is absent. If an actual user profile was used with prior approval, preserve its baseline installations and data and report any residue that could not be restored.

If the interface cannot start, arrange user-authorized recovery through the applicable CLI/profile recovery procedure; do not assume Electron's `desktop` profile can be operated with CLI `--profile desktop`. Removing the package removes its Bundle layer. Document separately any user-owned files or external resources that an implemented plugin deliberately leaves behind.
