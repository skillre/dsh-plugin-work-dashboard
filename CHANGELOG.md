# Changelog

## 0.5.0

### Minor Changes

- Ship the three POC skills inside the plugin package and rewrite them for v3.
  
  The `poc-ledger`, `poc-export` and `poc-submit` skills were built before the
  dashboard and installed separately into the user's skill directory. The ledger
  then moved from v1 to v3, and the skills kept teaching the model fields that no
  longer exist: `why_customer_test`, `result`, `timeline`, `gates.G0..G4`,
  `success_criteria`. They also pointed at `~/dsh-test/poc_form.py`, a v1 generator
  whose output the current ledger cannot read. This release fixes all of that and
  removes the drift permanently by shipping them in the same package.
  
  **Bundled, not separately installed**
  
  - `skills/poc-ledger`, `skills/poc-export`, `skills/poc-submit` ship in the
    tarball (`package.json#files`), so installing the plugin publishes them and
    uninstalling removes them. They can no longer be a different version from the
    data model they describe.
  - `src/skill.ts` registers all three through DSH's `skills` service
    (`ctx.skills.register`, `source: 'bundled'`), binding each disposer to the
    plugin's own Fiber. `skills` is an optional service resolved with `ctx.inject`,
    never a static dependency: a profile without a skill registry still mounts the
    dashboard, and each skill is registered inside its own try/catch so one bad
    file cannot take the others down.
  
  **What was wrong, and what it says now**
  
  - `poc-ledger`: rewritten for the v3 shape (identity / gate0 / plan / progress[] /
    outcome), the twelve gap rules instead of eight, the four dimensions read from
    `outcome` with derived-vs-manual tagging, and the three rule caveats that keep
    the rules from over-firing (R4–R6 skip empty lists, R8–R10 read only the newest
    entry, R12 does not fire without `stage_since`).
  - `poc-export`: now runs the bundled `scripts/export-form.mjs` instead of the
    dead external Python generator. The new script is a real v3 form: identity /
    G0 / plan / one appended progress entry / outcome, with autosave keyed by
    project id (the old generator keyed on generation time, so drafts were
    unreachable), live gap counting, focus preservation while typing, and JSON
    output that `poc-submit` can consume.
  - `poc-submit`: rewritten to merge into v3 YAML — append to `progress[]` with the
    next `seq` and keep every untouched field — instead of copying a whole v1
    `result` block.
  
  **Verification**
  
  - 17 new unit tests over the parser and the registration path, including content
    assertions: the ledger skill must not present removed v1 fields as schema, must
    list all twelve rules, and the export skill must point at the bundled script.
  - The isolated-profile integration run now asserts that all three skills are
    present in the installed package AND that each one actually reached the skill
    catalog at boot (`bundled-skills-registered`, 31 checks total).
  - The generated form was driven in a real browser: gap counters update live,
    focus survives typing, and the draft persists across reloads.

## 0.4.0

### Minor Changes

- Adopt the fleet display contract and document the real update mechanism.
  
  **Display contract (the plugin card and detail page)**
  
  - `locale/{zh,en}.json` now carry `meta.detail`, and both descriptions were
    rewritten to the card-subtitle budget (≤120 characters). The English one was
    over budget at 249 and would have been truncated in the plugin list.
  - `docs/DETAIL.zh.md` / `docs/DETAIL.md` hold exactly one preview image each, as
    the contract requires; the long-form content stays in the README.
  - `docs/preview.zh.svg` / `docs/preview.svg` are new 640×300 artwork showing the
    real interface: the DSH window with the sidebar entry selected, the six-figure
    portfolio band, three project cards and the rule-grouped pending rail. They are
    hand-authored to the parser's allowed element set (no `<pattern>`, `<clipPath>`,
    `<mask>`, `<image>`; text as `<text>`; orthogonal polylines).
  - `docs/PREVIEW.md` records the whiteboard round-trip and what the artwork shows.
  - `package.json#files` ships `docs` (the detail page reads the image from the
    package directory, so without it the page would render blank with no error) but
    excludes `docs/evidence`, which is 3.3 MB of verification screenshots that
    belong in the repository, not in every install.
  - `scripts/preview.mjs` plus `preview:check` are wired into `npm run check`, so a
    broken preview now fails the build instead of shipping blank.
  
  **Update mechanism**
  
  - Fixed a real bug: `cordis.patch.yml` still declared `staleDays: 30`, a key the
    schema no longer has. Schemastery accepts unknown keys, so the row mounted and
    silently produced `stallDays` at its default instead of the configured value.
    It now declares `stallDays: 45`.
  - README (both languages) and `RELEASING.md` now state the actual update rules
    instead of implying updates work everywhere: the plugin manager's Versions
    block only covers third-party bundles installed from the npm registry under
    their own package name. A market (Git) install has no Versions block and can
    only be upgraded by uninstall + reinstall. The npm channel is therefore the
    update mechanism, not just distribution, and the docs say how to switch.
  - Documented the two invariants that keep updatability: no `PROTECTED_PLUGINS`
    management row in the bundle patch, and an honest `engines.dsh`.

## 0.3.0

### Minor Changes

- 42b7c9f: Migrate the POC Operations module to the v3 ledger model.
  
  The ledger moved from v1 (flat fields + `result` + `timeline`) to v3
  (identity + gate0 + plan + `progress[]` + outcome), so every v1 read path
  was replaced:
  
  - **Parser** reads the v3 blocks. `progress[]` is the history now; there is
    no `timeline` array and no `result` block any more.
  - **Four dimensions** come from `outcome` (`achievement`, `our_proof`,
    `customer_recognition`, `business.milestone`). Each card is tagged
    自动推导 or 人工填 so it is clear which side supplied the value.
  - **Progress stream** is new and is the core of this release: every entry
    renders as a timeline node with goal, scope, actual result, completion,
    evidence chips, customer sync/feedback/recognition, G3-1/G3-2 and the
    next step. Projects with no progress show an explicit empty state —
    which is every project in the ledger today.
  - **Gap rules** grew from 8 to 12 (R1–R12), each pinned by its own test.
  - **Stat strip** is now POC总数 / G0通过 / 进行中 / 金额合计.
  - **Table** is 项目 | 体系/公司 | 阶段 | 金额 | 最新进展 | 缺口 | 操作.
  
  Verified against the real v3 data before any UI work: 23 projects, 6050万
  total, 1 G0 passed, 0 G0 complete, R1 firing on all 23, R2 on 7.
  
  The export form is hidden in this release: it still models v1 fields, and
  shipping it would hand colleagues YAML the v3 ledger cannot read. It is
  preserved at `src/form.v1-deferred.ts` for the v3 rewrite.
  
  Two defects found and fixed during verification: gap titles rendered through
  `t()` instead of `format()`, leaking literal `{amountWan}`; and the detail
  identity line still carrying the removed v1 `{tier}` key.
- Redesign the console: a portfolio band, three readings of the project list, and a layered detail page.
  
  The previous release made the plugin *correct* for the v3 ledger but left it
  looking like a table with a header. This release is about the reading
  experience — the same data, shown in more shapes, and laid out so the page
  answers a question instead of listing rows.
  
  **Overview**
  
  - **A portfolio band** replaces the four flat counters. Six figures, each a
    hand-built SVG/flex chart: the stage funnel (columns, tinted red where a stage
    carries a high gap), the system/company amount breakdown, the `poc_type`
    composition (donut), the amount-concentration list, the four-dimension
    coverage (four radial meters), and which gap rules fire most. Every figure is
    also a filter — clicking a segment narrows the list below it, so a chart and a
    filter cannot disagree. The band collapses to its header in one click.
  - **Three readings of one dataset**: cards (default), board (one column per
    stage), and table (the spec's seven columns, with sortable headers, sticky
    head, and an amount bar behind each figure). The shell filters and sorts once,
    so switching modes can never change which projects are visible.
  - **A toolbar**: search across name / id / owner / company, composable filter
    chips for system, stage, status and type, a sort selector and direction
    toggle, and a live result count.
  - **Keyboard path**: `↑/↓` moves a visible cursor, `Enter` opens the focused
    project, `Esc` returns, `/` focuses search.
  - **The pending rail groups gaps by rule**, so twelve rules over twenty-three
    projects reads as a systemic pattern instead of a repeated to-do item.
  
  **Detail page**
  
  - Two panes: a sticky identity rail (name, amount, vertical stage track, the
    four dimensions, the gaps, people, and prev/next) and a scrolling reading pane.
  - The **progress stream** is the centrepiece: each entry is a card on a vertical
    timeline with a recognition-toned node, a goal→actual pair, scope chips,
    evidence as real anchors, customer sync/recognition, G3-1/G3-2, a completion
    meter parsed from the percentage, and a next-step block that says so when the
    next step is missing.
  - **Purpose-built shapes per section** instead of a field dump: a five-cell G0
    completeness meter with the narrative fields rendered as prose, a criteria
    table, a numbered scenario list, severity-marked risks, and a milestone
    callout that turns gap R11 into a finding rather than an empty field.
  
  **Risk board and timeline**
  
  - Risks are grouped into severity swimlanes with a distribution figure above
    them; the timeline is grouped by month with a monthly sparkline, and rounds
    with no evidence or no customer feedback are marked explicitly.
  
  **Engineering**
  
  - Charts are hand-built (no new dependency): the client bundle may only
    externalise `react`, so every figure is SVG or flex geometry, with
    `role="img"`/`aria-label` and a text summary for screen readers.
  - Styles are split per surface (`css/base`, `charts`, `overview`, `detail`,
    `insights`) and assembled in a fixed cascade order, so four modules could be
    built in parallel without touching each other's sheets.
  - The Host now computes and ships `snapshot.analysis` (stage/org/type/amount/
    dimension/rule aggregations) and `detail.gate0.checklist` (the five G0
    prerequisites, including `tech_owner` from the identity block), so the Client
    never re-derives a figure the list contradicts.
  - Tests: 172 unit (up from 151), including a new dictionary-parity suite that
    fails when a key or a placeholder exists in only one locale.

This file is maintained by Changesets. The generated project shell has not been released.
