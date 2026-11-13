# @skillre/dsh-plugin-work-dashboard

> Status: experimental · targets DSH `0.2.2-rc.2`

Adds a **Work Dashboard** entry to the DSH left sidebar: a **multi-module** operations board that puts everything in flight in one place, so you can see what is moving before deciding what to fix. Only the first module, **POC Operations**, is implemented today.

[中文](README.md)

## Why "multi-module"

The plugin used to be called "POC console" and served one ledger. It became a *container*: the module rail at the top is a seat, POC Operations is the first module sitting in it, and later modules (customer visits, hiring, project retros) join the same Host row without a new plugin.

```
Work Dashboard (plugin)
└── POC Operations (module 1, the only implemented one)
    ├── Portfolio band   stage funnel / system-company / type mix / amount concentration / dimension coverage / gap rules
    ├── Projects         the same list, read three ways: cards · board · table
    ├── Project detail   sticky identity rail + progress stream / four dimensions / G0 meter / plan / outcome
    ├── Risk board       severity swimlanes + a distribution figure
    └── Global timeline  grouped by month + a monthly distribution + the silent projects
```

## Three bundled skills

Installing this plugin also installs three POC skills. They are not separate
install items and they do not version separately:

| Skill | What it does | Triggered by |
|---|---|---|
| `poc-ledger` | Reads and analyses the v3 ledger: progress, stage, the twelve gap rules | "how is POC X doing", "which projects are stuck" |
| `poc-export` | Generates a self-contained HTML form for colleagues without a GitHub account | "export a form", "have someone fill in this project's progress" |
| `poc-submit` | Validates the colleague's `.json`, merges it into the v3 YAML, opens a Draft PR | "submit this file", "open a PR for me" |

**Why bundle them**: these skills describe the same fields the dashboard reads. They
used to be installed separately into the user's skill directory, and when the data
model moved from v1 to v3 the skills kept teaching the model `why_customer_test` /
`result` / `timeline` — fields that no longer exist. Shipping them in one package on
one version makes that drift impossible.

- Skill files live at `skills/<name>/SKILL.md`; the export skill also ships an
  executable `skills/poc-export/scripts/export-form.mjs`.
- Registration goes through DSH's `skills` service (`ctx.skills.register`,
  `source: 'bundled'`) and is bound to the plugin's own Fiber, so uninstalling
  removes it.
- `skills` is an **optional** service: a profile without a skill registry still
  gets the dashboard, just without the skills (a warning is logged).
- All three were rewritten: v3 field model, 8 gap rules → 12, and the export script
  replaced the dead external `poc_form.py` with a bundled `export-form.mjs` (verified
  in a real browser: autosave, live gap counts, focus preservation, draft persistence).

## What the module solves

A POC ledger rots at "it feels like it worked": the project says the goal was met but there is no evidence; the evidence exists but the customer never confirmed it in writing; it genuinely worked and nothing followed. Written into one `result` field, those three collapse into "going well", and nobody notices that *it worked but nothing was banked* is the most valuable gap of all.

The module keeps them as four independent dimensions, renders them separately, and layers a hard-coded rule set on top that orders what needs fixing by severity.

## Features

### Data and refresh

- **Sidebar entry** in `sidebar.panellist`; clicking it swaps the centre column to the dashboard.
- **Empty state**: on a cold cache the page says "no data yet, hit Refresh", and discloses the data source and cache path.
- **Manual refresh**: `git clone` on the first pull, then `git fetch` + `git reset --hard origin/main`; shows progress and "refreshed at HH:MM".
- **Refresh settings**: off (default) / every 10 minutes / every hour / custom minutes, stored in `localStorage`, only active while the page is open.
- **Refresh failure**: a clear reason (not logged in / no access / unreachable / timeout / already running) plus a Retry button, and the board stays on screen.

### Portfolio band

The first screen answers "where is the money and the risk" before it answers "which project is this". Six figures, each also a filter:

- **Stage distribution**: a column chart of G0→G4, tinted red where a stage carries a high-severity gap; click a column to filter that stage.
- **System / company**: horizontal bars ordered by amount; click a row to filter.
- **Project types**: a donut of `poc_type` composition, with the project count in the hole.
- **Amount concentration**: the five largest projects and their share of the total; a concentration warning when one project exceeds a third.
- **Dimension coverage**: four radial meters showing how much of the portfolio has each dimension.
- **Gap rules fired**: which rules are happening systemically, not one finding at a time.

The band collapses to its header in one click — it is context, and it must not own the screen. The project list is visible without scrolling at 1440×900.

### Projects: one dataset, three readings

| View | Question it answers | Shape |
|---|---|---|
| **Cards** (default) | What does this project lack? | mini stage rail + amount + latest progress + four dimension marks + gap badge |
| **Board** | Where is everything piled up? | one column per stage, header carrying count and amount |
| **Table** | Show me the numbers | the spec's seven columns, sortable sticky head, amount bar behind each figure |

All three share one filtered, sorted list from the shell, so switching never changes which projects are visible. The toolbar provides search (name / id / owner / company), composable filter chips (system / stage / status / type), sort key and direction, and a live result count.

**Keyboard**: `↑/↓` moves the cursor, `Enter` opens, `Esc` returns, `/` focuses search.

### Pending list

Grouped by **rule** rather than flattened: twelve rules across twenty-three projects is a systemic pattern, and grouping shows "everyone is missing the decision chain" at a glance. Each group carries the rule number, how many projects hit it, and a severity band.

### Four dimensions and stages

- **Four dimensions**: goal met, evidence, customer recognition, next step — **always four separate elements**, each with its own present/absent state, each tagged *derived* or *hand-filled* so it is clear which side supplied the value.
- **Stage track**: a five-step G0→G4 rail. Completion comes from the ledger's own gate fields (`gate0.complete`, `plan.gate1.conclusion`, `plan.gate2.ready`, the newest `progress.gate3_2`, `outcome.achievement`), never inferred from the current stage position.
- **Detail page** in two panes: a sticky project file on the left (name, amount, vertical stage track, four dimensions, gaps, people, prev/next), and a scrolling reading pane on the right where each section uses the shape its data deserves:
  - **Progress stream** (the core): each entry is a card on a vertical timeline with a recognition-toned node, a goal→actual pair, scope chips, evidence as real anchors, customer sync and recognition, G3-1/G3-2, a completion meter parsed from the percentage, and a next-step block that says so when there is no next step.
  - **Four dimensions**: four independent cards with their origin tags.
  - **G0 meter**: a five-cell completeness meter (`tech_owner` is read from the identity block), with the two narrative fields rendered as prose.
  - **Plan**: a criteria table, a numbered scenario list, and severity-marked risks.
  - **Outcome**: three prose blocks plus a milestone callout that renders the missing next milestone as gap R11 — a red finding, not an empty field.

### Enhanced views

- **Risk board**: severity swimlanes (high → medium → low → unrated) with a distribution figure above them; both come from one bucketing pass, so the figure and the list cannot disagree.
- **Global timeline**: grouped by month, with a month divider and a monthly distribution per group, newest first inside each group; rounds with no evidence or no customer feedback are marked explicitly.

### Export form (not offered in this release)

The v1 form generator models fields the v3 ledger no longer has, so it is hidden rather than shipped: handing colleagues YAML the ledger cannot read is worse than having no form. The source is preserved at `src/form.v1-deferred.ts` for a later rewrite.

## The twelve gap rules

| # | Rule | Trigger | Level |
|---|---|---|---|
| 1 | G0 prerequisites missing | `gate0.missing` non-empty | high |
| 2 | Large amount without G0 clearance | `amount_wan >= 300` and conclusion is not 通过 | high |
| 3 | G0 passed but no success criteria | conclusion 通过 and `plan.criteria` empty | high |
| 4 | Success criteria not focused | criteria count outside 2–3 | medium |
| 5 | Scenarios not focused | scenarios count outside 3–5 | medium |
| 6 | Too many risks | risks count above 3 | medium |
| 7 | Testing before G2 is ready | any progress and `gate2.ready` is not Ready | high |
| 8 | Progress without evidence | newest entry has `actual` but no `evidence` | high |
| 9 | Evidence without customer recognition | newest entry has evidence and recognition is 未认可/待确认 | high |
| 10 | G3-1 provable, G3-2 unconfirmed | newest entry `gate3_1=可证明` and `gate3_2!=已确认` | high |
| 11 | Achieved with no next milestone | `achievement=达成` and `business.milestone` empty | high |
| 12 | Stage stalled | `stage_since` older than the threshold (default 45 days) | medium |

Rules 4–6 skip empty lists: an unplanned project is already caught by rule 3, and firing all three on day one would bury the real findings. Rules 8–10 read only the newest progress entry. Rule 12 does not fire when `stage_since` is absent — unknown is not the same as stalled.

## Configuration

| Key | Default | Meaning |
|---|---|---|
| `repository` | `skillre/workbranch` | `owner/name` of the ledger repository |
| `defaultBranch` | `main` | branch to track |
| `remoteUrl` | `''` (i.e. `https://github.com/<repository>.git`) | clone URL override: GitHub Enterprise, a mirror, or a local test remote |
| `cacheRoot` | `~/.dsh/cache/work-dashboard` | where the read-only clone lives |
| `cloneTimeoutMs` | `120000` | hard ceiling for one `git clone` |
| `fetchTimeoutMs` | `60000` | hard ceiling for one `git fetch` + `reset --hard` |
| `stallDays` | `45` | days in one stage before rule 12 fires |

The cache is wiped on every Host start and rebuilt by the first Refresh; the marker file means the plugin refuses to clear a directory it did not create.

## Install

**Final installation belongs to the user.** Open **Plugins** in the DSH Desktop Client or Web UI and choose the source yourself.

### From the plugin market

```
https://skillre.github.io/dsh-plugin-market/index.json
```

Add it under **Discover → Index sources**, then install **Work Dashboard** from Discover. The index pins a
specific commit (`git+https://github.com/skillre/dsh-plugin-work-dashboard#<commit>`); the repository is
self-contained (`lib/` is committed, there is no `scripts.prepare`), so installation runs no build step.

### Update mechanism (important)

Since the DSH `0.2.2` line, the bundle detail page has a **Versions** block that can check for and install
updates in place. It covers **third-party plugins installed from the npm registry** only — four conditions
must all hold (see the fleet's `docs/update-mechanism.md`):

| Condition | This plugin |
|---|---|
| Third-party bundle (not a shipped official one) | yes |
| The profile dependency is a registry spec saved under the package's own name | see below |
| The installed manifest's `version` parses as SemVer | yes, `0.4.0` |
| The package ships no `PROTECTED_PLUGINS` management row | yes, only `skillre-work-dashboard` |

Consequences:

- **Installed from the market (Git source)**: it appears under Installed but has **no Versions block**.
  Upgrading means **uninstall → reinstall from the market**. That is DSH's verdict, not this plugin's choice.
- **Installed from npm** (`@skillre/dsh-plugin-work-dashboard`): it enters the official update path, so the
  detail page can check versions, show pre-releases, and update in place.

npm publication runs through `.github/workflows/release.yml` with npm Trusted Publishing / OIDC (see
`RELEASING.md`). **No version is published on the registry yet** — the local npm credential returns 401 and the
repository has neither an `npm-publish` environment nor a Trusted Publisher, so only the Git channel works today; once
it is published, switching to the npm channel is what unlocks in-place updates:

1. remove the Git-installed bundle in Plugins;
2. enter `@skillre/dsh-plugin-work-dashboard@0.4.0` (or newer) in the install dialog;
3. only then does the detail page gain its Versions block.

A local tarball is likewise **outside** the official update path.

## Development verification

```sh
npm install
npm run check                     # typecheck + 172 unit tests + lib-drift check + pack check
npm pack                          # produces skillre-dsh-plugin-work-dashboard-0.4.0.tgz
```

Real mount verification **only against an owned, disposable, non-Desktop profile**:

```sh
node scripts/verify-isolated.mjs   # real clone/fetch/detail/auth/restart-wipe + risks/timeline, self-cleaning
node scripts/ui-preview.mjs        # boots a bounded Web instance and writes .preview-url.txt
node scripts/ui-verify.mjs         # browser assertions + docs/evidence/ screenshots
node scripts/verify-market-install.mjs  # LIVE index → real install → routes answer (requires a published entry)
```

`ui-preview.mjs` stops its processes and deletes the isolated root it created; `verify-isolated.mjs` cleans up in a `finally` and verifies the root is gone. Every script points `cacheRoot` inside the isolated profile and **never touches your real `~/.dsh/cache`**.

The UI harness must rebuild and repack before it runs: the preview installs the packed artifact, so verifying without a rebuild would verify the previous build.

## Uninstall and rollback

See [UNINSTALL.md](UNINSTALL.md). All data lives in the GitHub repository, so uninstalling loses nothing; `~/.dsh/cache/work-dashboard` can be deleted by hand and is rebuilt on the next entry.

## Compatibility

| DSH version | Result | Verified | Notes |
|---|---|---|---|
| 0.2.2-rc.2 | passed | 2026-11-13 | packed install + bounded startup + real clone + 31 isolated checks (incl. the three skills really reaching the skill catalog) (see `compatibility.json`) |
| 0.2.2-rc.1 | passed | 2026-11-06 | same behaviour + 69 browser assertions; 0.6.0 does not touch the client bundle, so that record still holds |

Machine-readable evidence is in `compatibility.json`; screenshots and reports are in `docs/evidence/`. **Desktop Client (Electron) was not verified**: its profile is managed by the app and this CLI harness cannot drive it, so a Desktop-specific visual check is still outstanding before Desktop delivery.

## Implementation notes

- **Charts have no dependency.** The client bundle may only externalise `react`, so every figure is hand-built SVG or flex geometry with `role="img"`/`aria-label` plus a text summary. No charting library was added.
- **Styles are split per surface**: `css/base` (frame), `charts`, `overview`, `detail`, `insights`, concatenated in a fixed order in `styles.ts`, so modules can be developed in parallel without touching each other's sheets.
- **Aggregation happens on the Host**: `snapshot.analysis` (stage/system/type/amount/dimension/rule aggregations) and `detail.gate0.checklist` (the five prerequisites, including `tech_owner` from the identity block) are computed and shipped by the Host. The Client never re-derives them, so a chart cannot contradict the list beside it.

## Known limitations

- **The cache is wiped on every DSH restart**, so you have to hit Refresh again (a clone takes about 1.5 s, longer on a slow network). That is intended behaviour.
- **Read-only**: no import, edit, or pull-request submission. Gaps can be seen but not fixed from the board.
- **Rule 12's date source**: v3 uses `stage_since`; a project without it is not reported as stalled rather than assumed to be.
- **Scheduled refresh only runs while the page is open**; closing the page stops it — intended.
- A private repository needs a local `gh` login with read access; without one, refresh reports "gh is not logged in" explicitly.
- **Only one module**: the module rail holds one module today; later modules join the same Host row.

## Security and permissions

- **Network**: HTTPS to `github.com` (or the configured `remoteUrl`) through the local `git` and `gh` binaries.
- **Filesystem**: writes only inside `cacheRoot`; refuses to clear a directory it did not create (marker file).
- **Credentials**: the Host never reads, stores or forwards a token. `gh`'s own credential store is used by `git`/`gh`; the plugin never persists credentials into the cache.
- **No telemetry**, no third-party requests, no external fonts or CDNs. The generated form (when re-enabled) would be fully offline.
- **Read-only**: no writes to the ledger repository in this release.

## License

MIT
