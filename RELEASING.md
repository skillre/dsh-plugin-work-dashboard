# Releasing @skillre/dsh-plugin-work-dashboard

Publishing, tags, releases, Trusted Publisher changes and remote writes require direct human authorization.

## Bootstrap once

1. Enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**.
2. Review branch protection: a PR created with the default `GITHUB_TOKEN` does not trigger a new `pull_request` workflow. Manually dispatch checks, prepare the version PR as a human, or use a reviewed GitHub App when a required status would otherwise be absent. Do not silently add a long-lived PAT.
3. With the pinned Node/npm baseline, run `npm run check && npm run release:prepare`, inspect it, then manually publish that exact `./release-artifact/*.tgz` with login and 2FA; never publish a fresh implicit repack and never store a token in the repository. CI later requires the registry integrity to match its deterministic artifact.
4. Configure npm Trusted Publishing for `skillre/dsh-plugin-work-dashboard`, workflow `release.yml`, environment `npm-publish`.
5. Create the protected `npm-publish` GitHub Environment with a human reviewer and `main` restriction.
6. Set repository variable `NPM_TRUSTED_PUBLISHING_READY=true` only after the publisher configuration matches exactly.

## Why npm is the only update channel

The plugin manager's Versions block (`listVersions` / `updateBundle`, DSH `0.2.2-alpha.2` onward) refuses to
update anything that is not a third-party bundle installed from the registry under its own package name. A
`github:` / `git+` / `file:` / tarball install never appears there, so the only way to update it is uninstall
and reinstall. That is why publishing to npm is not just distribution — it is the update mechanism itself.

Two things this repository must therefore keep true, or it silently loses updatability:

- `cordis.patch.yml` declares no `PROTECTED_PLUGINS` management row (`@deepseek-ai/dsh-plugin-manager`,
  `cordis-plugin-loader`, `dsh-api-gateway`, …). A bundle shipping one becomes unremovable and with it
  un-updatable.
- `engines.dsh` stays honest. An update candidate is first checked against `engines.dsh` (falling back to the
  `@deepseek-ai/dsh*` peers), so a range that is too wide gets rejected as `incompatible-version` and one that
  is too narrow blocks versions that would work. It states the DSH line this package was really mounted and
  tested against, and must be re-verified rather than widened on a guess.

Update semantics, as documented for users: versions only move forward; the target is stored as an exact
version (and a failed update restores the previous exact version, even if the original spec was a range); an
update is two profile operations (remove + install) so the bundle may land at the end of the list under HMR;
a failure rolls back, and if the rollback itself fails the package is left uninstalled. The plugin page has no
entry for version exemptions — only the CLI and agent tools do.

## Every release

1. Include a Changeset with the feature/fix PR.
2. Update README compatibility claims and `compatibility.json` from real tarball mount evidence, then rebuild and remount the exact final tarball that contains that evidence.
3. Merge to `main`; review the Changesets version PR and CHANGELOG.
4. Merge the version PR and approve the protected publication Environment.
5. Verify npm version, tarball files, provenance, GitHub tag/release and a clean-profile install.

The workflow builds and checks the tarball in an unprivileged job and retains the immutable artifact for 14 days to allow protected-environment review. The OIDC job checks out no source, installs no project dependencies, disables package-manager caching, verifies SHA-1 and SHA-512, pins the npm registry, and runs `npm publish --ignore-scripts` on that tarball only. Stable versions use the `latest` dist-tag; SemVer prereleases use `next`. A full rerun skips publication only when npm already holds the exact same integrity. GitHub tag/release creation occurs afterward in a separate job without OIDC permission.

## Rollback

Never overwrite an npm version. Deprecate a bad version, tell users which known-good version to pin, and publish a new fix. See `UNINSTALL.md` for profile commands.
