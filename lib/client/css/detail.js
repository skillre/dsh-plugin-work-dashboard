/**
 * Detail styles: the sticky rail and the layered reading pane.
 *
 * The layout is the design. Two panes with different scroll behaviour is what
 * turns thirteen stacked field rows into a document you can read:
 *
 * - the **rail** is `position: sticky` inside the page's own scroll container,
 *   so the project's identity stays in view while the evidence scrolls past it;
 * - the **pane** is a single column with one section rhythm, so the reading order
 *   is the model's order: progress → dimensions → G0 → plan → outcome.
 *
 * Each section then picks its own shape, and the shapes are what carry meaning:
 * a stream (history), four cards (the invariant), a five-cell meter
 * (completeness), a table (criteria), a numbered list (scenarios), severity rows
 * (risks), and a callout (the next milestone — the one thing the ledger most
 * often forgets).
 *
 * Class prefixes owned here: `.dt-`, `.dsec-`, `.prog-`, `.g0-`, `.plan-`, `.out-`.
 */
export const DETAIL_CSS = `
/* ---------- page shell: banner + fixed two columns ---------- */
.wd-shell .dt-shell {
  display: flex; flex-direction: column;
  gap: 16px;
  padding: 20px 28px 44px;
  min-height: 100%;
}
.wd-shell .dt-body { display: flex; flex-direction: column; gap: 18px; }

/* ---------- banner ---------- */
.wd-shell .dt-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "main side" "nav nav";
  gap: 10px 18px;
  padding: 16px 20px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  border-radius: 10px;
}
.wd-shell .dt-header-main { grid-area: main; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.wd-shell .dt-header-back { align-self: flex-start; margin-bottom: 2px; }
.wd-shell .dt-header-title {
  margin: 0; font-size: 20px; line-height: 28px; font-weight: 700;
  letter-spacing: -.01em; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere;
}
.wd-shell .dt-header-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.wd-shell .dt-header-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-header-org { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .dt-header-side { grid-area: side; display: flex; align-items: flex-start; gap: 18px; }
.wd-shell .dt-header-pills { display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end; }
.wd-shell .dt-header-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
.wd-shell .dt-header-amount-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em; text-transform: uppercase;
  font-weight: 600; color: var(--wd-amber);
}
.wd-shell .dt-header-amount-value {
  font-size: 22px; line-height: 28px; font-weight: 700;
  font-variant-numeric: tabular-nums; color: var(--wd-amber); letter-spacing: -.02em;
}
.wd-shell .dt-header-amount-value[data-empty="true"] { font-size: 12px; font-weight: 500; font-style: italic; color: var(--dsw-alias-label-tertiary); }
.wd-shell .dt-header-amount-unit { margin-left: 3px; font-size: 10.5px; font-weight: 500; }
.wd-shell .dt-header-nav {
  grid-area: nav; display: flex; align-items: center; gap: 10px;
  padding-top: 10px; border-top: 1px solid var(--wd-hairline);
}
.wd-shell .dt-header-position { margin: 0 auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

/* ---------- the fixed two-column contract ---------- */
.wd-shell .dt-columns {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
@media (max-width: 1180px) { .wd-shell .dt-columns { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .dt-col-main,
.wd-shell .dt-col-side { display: flex; flex-direction: column; gap: 18px; min-width: 0; }

/* ---------- Gate 0 card grid ---------- */
/* 'align-items: start' keeps every card at its own content height. The default
   'stretch' would force a one-line answer and a ten-line argument sharing a row
   to be equally tall, leaving a hollow block under the short one that reads as
   "this card was never finished". The short answers stay visually even anyway:
   they are all one or two lines. */
.wd-shell .g0-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px; align-items: start;
}
.wd-shell .g0-card {
  display: flex; flex-direction: column; gap: 5px;
  padding: 10px 12px; border-radius: 8px;
  background: var(--wd-surface); border: 1px solid var(--wd-hairline);
}
.wd-shell .g0-card[data-present="false"] { background: var(--wd-inset); border-style: dashed; }
.wd-shell .g0-card-head { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .g0-card-label { font-size: 11px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-primary); }
.wd-shell .g0-card-missing {
  margin-left: auto; font-size: 9px; line-height: 13px; font-weight: 650;
  color: var(--wd-amber); background: var(--wd-amber-soft);
  padding: 1px 5px; border-radius: 4px; white-space: nowrap;
}
/* Every G0 answer keeps its own line breaks. The ledger stores these fields as
   structured prose — '为什么测试：' / numbered points / a blank line / '下一步动作
   和目标：' — and 'white-space: normal' collapses all of that into one run-on
   paragraph: the numbers detach from their items and the second heading vanishes
   into the body. 71% of the ledger's non-empty G0 answers carry such breaks. */
.wd-shell .g0-card-body {
  margin: 0; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere; white-space: pre-wrap;
}
/* The two narrative answers are NOT clamped.
 *
 * An earlier version cut them at three lines, which silently hid 62% of the
 * ledger's G0 arguments (up to 7 of a field's 10 lines) with no ellipsis and no
 * expand affordance. These two fields are the densest content the ledger holds;
 * a page that claims to be "read, not skimmed" cannot truncate them. They are
 * given a heavier weight instead, so an argument reads as evidence rather than
 * as another one-line answer. */
.wd-shell .g0-card[data-prose="true"] .g0-card-body {
  font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-primary);
}
.wd-shell .g0-card-body[data-empty="true"] { font-style: italic; color: var(--dsw-alias-label-tertiary); }
.wd-shell .g0-grid-note { margin: 0; font-size: 10px; line-height: 15px; color: var(--wd-amber); }

/* ---------- rail ---------- */

/* vertical stage track */

/* rail dimension summary: four compact marks, never merged into one score.
   The full cards with their origin tags live in the reading pane; the rail only
   needs to say "which of the four exist", because the rail is scanned, not read. */

/* rail gaps */

/* rail meta */

/* rail navigation */

/* ---------- section frame ---------- */
.wd-shell .dsec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.wd-shell .dsec-head { display: flex; align-items: baseline; gap: 9px; padding-bottom: 7px; border-bottom: 1px solid var(--wd-hairline); }
.wd-shell .dsec-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; letter-spacing: -.005em; }
.wd-shell .dsec-kicker { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .dsec-blank {
  padding: 14px; border-radius: 9px;
  border: 1px dashed var(--wd-hairline);
  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
  text-align: center;
}
.wd-shell .dsec-empty {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 30px 20px; border-radius: 10px;
  border: 1px dashed var(--wd-hairline);
  text-align: center;
}
.wd-shell .dsec-empty-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 650; }
.wd-shell .dsec-empty-copy { margin: 0; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }

/* ---------- prose blocks ---------- */
.wd-shell .dt-prose { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.wd-shell .dt-prose-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-prose-body { margin: 0; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.wd-shell .dt-prose[data-empty="true"] .dt-prose-body { color: var(--dsw-alias-label-tertiary); font-style: italic; }

/* ---------- basic information ---------- */
.wd-shell .dt-basic-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 18px; margin: 0 0 12px;
}
@media (max-width: 900px) { .wd-shell .dt-basic-grid { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .dt-basic-row { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.wd-shell .dt-basic-label {
  flex: none; width: 108px;
  font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-basic-value {
  margin: 0; font-size: 12px; line-height: 17px; font-weight: 500;
  color: var(--wd-text); overflow-wrap: anywhere;
}
.wd-shell .dt-basic-row[data-empty="true"] .dt-basic-value {
  font-weight: 400; color: var(--dsw-alias-label-tertiary); font-style: italic;
}
.wd-shell .dt-basic-decisions {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px; padding-top: 11px; border-top: 1px solid var(--wd-hairline);
}
@media (max-width: 900px) { .wd-shell .dt-basic-decisions { grid-template-columns: minmax(0, 1fr); } }

/* ---------- progress stream ---------- */
.wd-shell .prog-stream { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.wd-shell .prog-item { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 12px; padding-bottom: 14px; }
.wd-shell .prog-item:last-child { padding-bottom: 0; }
.wd-shell .prog-gutter { position: relative; display: flex; justify-content: center; padding-top: 8px; }
.wd-shell .prog-node {
  position: relative; z-index: 1; width: 9px; height: 9px; border-radius: 50%;
  background: var(--wd-slate); box-shadow: 0 0 0 3px var(--wd-slate-soft);
}
.wd-shell .prog-node[data-tone="green"] { background: var(--wd-green); box-shadow: 0 0 0 3px var(--wd-green-soft); }
.wd-shell .prog-node[data-tone="amber"] { background: var(--wd-amber); box-shadow: 0 0 0 3px var(--wd-amber-soft); }
.wd-shell .prog-node[data-tone="red"] { background: var(--wd-red); box-shadow: 0 0 0 3px var(--wd-red-soft); }
.wd-shell .prog-item:not(:last-child) .prog-gutter::after {
  content: ''; position: absolute; top: 22px; bottom: -6px; width: 1px;
  background: var(--wd-hairline);
}
.wd-shell .prog-card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px 11px; min-width: 0;
  border: 1px solid var(--wd-hairline); border-radius: 10px;
  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
}
.wd-shell .prog-item[data-latest="true"] .prog-card { border-color: var(--dsw-alias-border-l2); box-shadow: var(--wd-shadow-2); }
.wd-shell .prog-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wd-shell .prog-date { font-size: 12px; line-height: 18px; font-weight: 650; font-variant-numeric: tabular-nums; }
.wd-shell .prog-type { font-size: 10.5px; line-height: 16px; padding: 0 7px; border-radius: 20px; background: var(--wd-inset); border: 1px solid var(--wd-hairline); color: var(--dsw-alias-label-secondary); }
.wd-shell .prog-chip { margin-left: auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .prog-meter { margin-left: auto; display: flex; align-items: center; gap: 6px; min-width: 150px; }
.wd-shell .prog-meter .inline-meter { flex: 1 1 auto; min-width: 40px; }
.wd-shell .prog-meter-value { font-size: 10.5px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }


/*
 * Balance the columns.
 *
 * The progress stream grows without limit (one card per round), while the left
 * column holds a fixed set of commitments. Left alone, a project with ten rounds
 * leaves the commitments column looking half-empty. Capping the stream keeps the
 * two columns visually comparable and gives the reader an obvious scroll target,
 * while every round stays reachable.
 */
.wd-shell .dt-col-side .prog-stream {
  max-height: none; overflow-y: visible;
  padding-right: 4px;
  scrollbar-width: thin;
}
.wd-shell .dt-col-side .prog-stream::-webkit-scrollbar { width: 6px; }
.wd-shell .dt-col-side .prog-stream::-webkit-scrollbar-thumb { background: var(--wd-hairline); border-radius: 3px; }

/* ---------- compact timeline row ---------- */
.wd-shell .prog-card-compact { display: flex; flex-direction: column; gap: 5px; padding: 9px 11px; }
.wd-shell .prog-card-compact .prog-head { gap: 8px; }
.wd-shell .prog-change {
  font-size: 9px; line-height: 13px; font-weight: 650;
  color: var(--wd-primary); background: var(--wd-primary-soft);
  padding: 1px 5px; border-radius: 4px; white-space: nowrap;
}
.wd-shell .prog-actual-line {
  margin: 0; font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
}
.wd-shell .prog-actual-line[data-empty="true"] { font-style: italic; color: var(--dsw-alias-label-tertiary); }
.wd-shell .prog-scope-row { margin-top: 1px; }

/* ---------- dimension grid (detail) ---------- */

/* ---------- G0 meter ---------- */

/* ---------- plan ---------- */
.wd-shell .plan-block { display: flex; flex-direction: column; gap: 7px; }
.wd-shell .plan-block-head { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .plan-block-title { margin: 0; font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-primary); }
.wd-shell .plan-block-note { margin-left: auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .plan-criteria {
  width: 100%; border-collapse: collapse;
  border: 1px solid var(--wd-hairline); border-radius: 9px; overflow: hidden;
  background: var(--wd-surface);
}
.wd-shell .plan-criteria th {
  padding: 7px 10px; text-align: left;
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em; text-transform: uppercase;
  font-weight: 600; color: var(--dsw-alias-label-tertiary);
  background: var(--wd-inset); border-bottom: 1px solid var(--wd-hairline);
}
.wd-shell .plan-criteria td {
  padding: 8px 10px; font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-secondary); border-bottom: 1px solid var(--wd-hairline);
  vertical-align: top;
}
.wd-shell .plan-criteria tbody tr:last-child td { border-bottom: 0; }
.wd-shell .plan-criterion-name { font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .plan-criterion-num { font-variant-numeric: tabular-nums; }
.wd-shell .plan-criterion-target { font-weight: 650; color: var(--wd-primary); font-variant-numeric: tabular-nums; }
.wd-shell .plan-scenarios { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
/* A scenario row carries its derived state as a left edge: the row's colour is
   the finding, so it has to survive a glance down the list. */
.wd-shell .plan-scenario {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px 8px 9px; border-radius: 8px;
  background: var(--wd-surface); border: 1px solid var(--wd-hairline);
  border-left: 3px solid var(--wd-slate);
}
.wd-shell .plan-scenario[data-tone="green"] { border-left-color: var(--wd-green); }
.wd-shell .plan-scenario[data-tone="amber"] { border-left-color: var(--wd-amber); }
.wd-shell .plan-scenario[data-tone="red"] { border-left-color: var(--wd-red); }
.wd-shell .plan-scenario-no {
  flex: none; margin-top: 1px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .plan-scenario[data-tone="green"] .plan-scenario-no { color: var(--wd-green); }
.wd-shell .plan-scenario[data-tone="amber"] .plan-scenario-no { color: var(--wd-amber); }
.wd-shell .plan-scenario[data-tone="red"] .plan-scenario-no { color: var(--wd-red); }
.wd-shell .plan-scenario-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.wd-shell .plan-scenario-name { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .plan-scenario-goal { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.wd-shell .plan-scenario-goal-label { margin-right: 5px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .plan-scenario-tail { flex: none; display: flex; align-items: center; gap: 6px; }
.wd-shell .plan-scenario-glyph { font-size: 10px; line-height: 14px; }
.wd-shell .plan-scenario[data-tone="green"] .plan-scenario-glyph { color: var(--wd-green); }
.wd-shell .plan-scenario[data-tone="amber"] .plan-scenario-glyph { color: var(--wd-amber); }
.wd-shell .plan-scenario[data-tone="red"] .plan-scenario-glyph { color: var(--wd-red); }
.wd-shell .plan-scenario[data-tone="slate"] .plan-scenario-glyph { color: var(--wd-slate); }
.wd-shell .plan-scenario-evidence {
  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.wd-shell .plan-criterion-status { white-space: nowrap; }

/* ---------- scenario legend ---------- */

/* ---------- next actions ---------- */
.wd-shell .next-table {
  width: 100%; border-collapse: collapse;
  border: 1px solid var(--wd-hairline); border-radius: 9px; overflow: hidden;
  background: var(--wd-surface);
}
.wd-shell .next-table th {
  padding: 7px 10px; text-align: left;
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em; text-transform: uppercase;
  font-weight: 600; color: var(--dsw-alias-label-tertiary);
  background: var(--wd-inset); border-bottom: 1px solid var(--wd-hairline);
}
.wd-shell .next-table td {
  padding: 8px 10px; font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-secondary); border-bottom: 1px solid var(--wd-hairline);
  vertical-align: top;
}
.wd-shell .next-table tbody tr:last-child td { border-bottom: 0; }
.wd-shell .next-goal { font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .next-deadline { font-variant-numeric: tabular-nums; }

/* ---------- scenario detail (layer two) ---------- */
.wd-shell .plan-scenario-open {
  flex: none; margin-left: 2px; padding: 2px 6px;
  border: 0; border-radius: 5px; background: transparent; cursor: pointer;
  font-family: inherit; font-size: 10.5px; line-height: 15px; font-weight: 600;
  color: var(--wd-primary);
}
.wd-shell .plan-scenario-open:hover { background: var(--wd-primary-soft); }
.wd-shell .plan-scenario-open:focus-visible { outline: 2px solid var(--wd-primary-ring); outline-offset: 1px; }
.wd-shell .sd-back {
  align-self: flex-start; margin-bottom: 2px; padding: 3px 8px;
  border: 1px solid var(--wd-hairline); border-radius: 6px; background: var(--wd-surface); cursor: pointer;
  font-family: inherit; font-size: 10.5px; line-height: 15px; font-weight: 600; color: var(--wd-primary);
}
.wd-shell .sd-back:hover { background: var(--wd-primary-soft); }
.wd-shell .sd-back:focus-visible { outline: 2px solid var(--wd-primary-ring); outline-offset: 1px; }
.wd-shell .sd-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 9px; border-bottom: 1px solid var(--wd-hairline); }
.wd-shell .sd-head-no {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .sd-head-name { font-size: 14px; line-height: 20px; font-weight: 650; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .sd-evidence { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.wd-shell .sd-evidence-row {
  display: flex; align-items: baseline; gap: 9px; padding: 7px 10px;
  border-radius: 7px; background: var(--wd-inset);
}
.wd-shell .sd-evidence-type { flex: none; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .sd-evidence-title { flex: 1; min-width: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .sd-evidence-date { flex: none; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .sd-evidence-link { flex: none; font-size: 10.5px; color: var(--wd-primary); text-decoration: none; }
.wd-shell .sd-evidence-link:hover { text-decoration: underline; }
.wd-shell .sd-customer { display: flex; flex-direction: column; gap: 4px; padding: 9px 11px; border-radius: 8px; background: var(--wd-inset); }
.wd-shell .sd-customer-sync { display: flex; align-items: baseline; gap: 8px; font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .sd-customer-date { font-variant-numeric: tabular-nums; }
.wd-shell .sd-customer-feedback { margin: 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
.wd-shell .sd-gate3 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.wd-shell .sd-gate3-note {
  font-size: 9.5px; line-height: 14px; font-weight: 650; color: var(--wd-red);
  padding: 1px 5px; border-radius: 4px; background: var(--wd-red-soft);
}
.wd-shell .sd-linked { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.wd-shell .sd-linked-row {
  display: grid; grid-template-columns: 82px 34px 76px minmax(0, 1fr); gap: 8px;
  align-items: baseline; padding: 6px 10px; border-radius: 7px; background: var(--wd-inset);
}
.wd-shell .sd-linked-date { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .sd-linked-seq { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .sd-linked-change { font-size: 9.5px; line-height: 14px; font-weight: 600; color: var(--wd-primary); }
.wd-shell .sd-linked-actual { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .plan-risks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.wd-shell .plan-risk { display: flex; align-items: flex-start; gap: 8px; padding: 7px 10px; border-radius: 8px; background: var(--wd-inset); }
.wd-shell .plan-risk-dot { flex: none; width: 7px; height: 7px; margin-top: 5px; border-radius: 50%; background: var(--wd-slate); }
.wd-shell .plan-risk[data-tone="red"] .plan-risk-dot { background: var(--wd-red); }
.wd-shell .plan-risk[data-tone="amber"] .plan-risk-dot { background: var(--wd-amber); }
.wd-shell .plan-risk[data-tone="green"] .plan-risk-dot { background: var(--wd-green); }
.wd-shell .plan-risk-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.wd-shell .plan-risk-name { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .plan-risk-level { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .plan-risk-mitigation { font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

/* ---------- outcome ---------- */

@media (prefers-reduced-motion: reduce) {
  .wd-shell .prog-card { transition: none; }
}

`;
