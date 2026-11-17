# Releasing @skillre/dsh-plugin-work-dashboard

## Repository release identity

- Package: `@skillre/dsh-plugin-work-dashboard`
- Fleet slug: `work-dashboard`
- Trusted Publisher repository: `skillre/dsh-plugin-work-dashboard`
- Workflow: `.github/workflows/release.yml`
- Protected environment: `npm-publish`

<!-- fleet-managed:start -->
## Authoritative release procedure

Read the full local `AGENTS.md`, run `node scripts/fleet.mjs context --json`, then actually read the returned Fleet `docs/plugin-policy.md` and `docs/release-runbook.md` before version/release/rollback work. In the standard layout the runbook is [here](<../../docs/release-runbook.md>); resolve this link relative to this repository, never a nested cwd. This file is navigation and repository-specific evidence, not a copied second release workflow.

- Parent release tools are not local npm scripts. `node scripts/fleet.mjs release:dispatch --plan` previews a verified, uniquely scoped call without running it. Other whitelist commands and arbitrary-cwd usage are in Fleet `docs/independent-workspaces.md`.
- Actual dispatch needs direct human package@version authorization, approved commit via `DSH_RELEASE_COMMIT`, clean canonical main, matching origin/local/remote main, real compatibility evidence and the protected OIDC approval. No `--allow-dirty`, npm publish, credentials or automatic approval.
- Bootstrap, provisioning, npm trust/login, interactive and market writes are separately reviewed parent maintenance operations; no child forwarder. Old bootstrap dry-run is not a guarantee of no side effects.
- Changesets, final tarball tests, artifact/provenance/tag verification, cleanup and rollback follow the shared runbook. This entry/fixture check is not evidence of a mount, real publish or complete artifact verification.
- Final installation/update/uninstall/rollback belongs to the user's Plugins manager; [UNINSTALL](<UNINSTALL.md>) gives this plugin's user-facing path. CLI/profile recovery, when the manager cannot start, is a separately authorized path that preserves preexisting state.

Keep package-specific release facts and dated history below; examples/history are not current authority or proof of remote state.
<!-- fleet-managed:end -->

## Plugin-specific release notes

**Historical evidence only, as recorded on 2026-11-13. Current remote/Trusted Publisher state was not rechecked in this migration. The old command below records prior handoff, not new authorization.**

### Historical status (2026-11-13): published, Trusted Publisher outstanding

`@skillre/dsh-plugin-work-dashboard@0.6.0` was published to the registry on 2026-11-13
(`dist-tag latest`). That was the first publish and it was done by hand, because npm cannot attach a
Trusted Publisher to a package that does not exist — the one step of this pipeline that a human must
perform. The artifact was verified against the locally packed and mounted tarball before publishing,
and the published tarball was re-downloaded afterwards to confirm it ships the same 62 files and no
`docs/PREVIEW.md`.

Until now the package was not on the registry at all, and that had two visible consequences: the
plugin could not be updated in place, and the fleet market builder — which emits npm-sourced entries
only — silently skipped it, so it disappeared from Discover when the index was rebuilt. Both are
resolved by the publish: `npm run update:readiness -- work-dashboard` reports OK, and the market entry
is now npm-sourced.

**Still outstanding: the Trusted Publisher.** The workflow cannot publish the next version until this
relationship exists. npm gates it behind one interactive 2FA confirmation:

```sh
cd /Users/skillre/dsh-plugins
npm run release:auth -- work-dashboard --action trust
```

`--allow-publish` is required; npm rejects the command without one of the permission flags. As of
2026-11-13 the confirmation was not completed, so `npm trust list` has not been run and no OIDC
publish has happened yet.
