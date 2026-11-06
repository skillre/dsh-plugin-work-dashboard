# Changelog

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
