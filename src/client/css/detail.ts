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
 * Class prefixes owned here: `.dt-`, `.dsec-`, `.prog-`, `.dim-card`, `.g0-`,
 * `.plan-`, `.out-`.
 */

export const DETAIL_CSS = `
/* ---------- two-pane layout ---------- */
.wd-shell .dt-page {
  display: grid;
  grid-template-columns: 316px minmax(0, 1fr);
  align-items: start;
  min-height: 100%;
}
@media (max-width: 1100px) { .wd-shell .dt-page { grid-template-columns: minmax(0, 1fr); } }

.wd-shell .dt-rail {
  position: sticky; top: 0;
  align-self: start;
  display: flex; flex-direction: column; gap: 14px;
  padding: 18px 18px 22px;
  background: var(--wd-surface);
  border-right: 1px solid var(--wd-hairline);
  min-height: 100%;
}
@media (max-width: 1100px) { .wd-shell .dt-rail { position: static; border-right: 0; border-bottom: 1px solid var(--wd-hairline); } }
.wd-shell .dt-pane {
  display: flex; flex-direction: column; gap: 22px;
  padding: 20px 28px 44px;
  min-width: 0;
}

/* ---------- rail ---------- */
.wd-shell .dt-rail-head { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
.wd-shell .dt-rail-back { margin-bottom: 4px; }
.wd-shell .dt-rail-title {
  margin: 0; font-size: 16px; line-height: 23px; font-weight: 650;
  letter-spacing: -.01em; overflow-wrap: anywhere;
}
.wd-shell .dt-rail-id { display: block; }
.wd-shell .dt-rail-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px; }
.wd-shell .dt-rail-amount {
  display: flex; flex-direction: column; gap: 1px;
  padding: 10px 12px; border-radius: 9px;
  background: var(--wd-amber-soft); border: 1px solid transparent;
}
.wd-shell .dt-rail-amount-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 600; color: var(--wd-amber);
}
.wd-shell .dt-rail-amount-value {
  font-size: 22px; line-height: 28px; font-weight: 650;
  font-variant-numeric: tabular-nums; color: var(--wd-amber); letter-spacing: -.02em;
}
.wd-shell .dt-rail-amount-value[data-empty="true"] {
  font-size: 13px; font-weight: 500; font-style: italic; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-rail-amount-unit { margin-left: 3px; font-size: 10.5px; font-weight: 500; }
.wd-shell .dt-rail-block { display: flex; flex-direction: column; gap: 7px; }
.wd-shell .dt-rail-block-title {
  margin: 0; font-size: 10.5px; line-height: 15px; letter-spacing: .06em;
  text-transform: uppercase; font-weight: 650; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-rail-empty { margin: 0; font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); font-style: italic; }

/* vertical stage track */
.wd-shell .dt-stages { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; position: relative; }
.wd-shell .dt-stage { display: flex; align-items: center; gap: 9px; padding: 4px 0; position: relative; }
.wd-shell .dt-stage:not(:last-child)::after {
  content: ''; position: absolute; left: 9px; top: 22px; bottom: -3px;
  width: 1px; background: var(--wd-hairline);
}
.wd-shell .dt-stage[data-done="true"]:not(:last-child)::after { background: var(--wd-green); opacity: .45; }
.wd-shell .dt-stage-marker {
  position: relative; z-index: 1; flex: none;
  width: 19px; height: 19px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 650;
  border: 1.5px solid var(--wd-hairline); background: var(--wd-surface);
  color: var(--dsw-alias-label-tertiary);
}
.wd-shell .dt-stage[data-done="true"] .dt-stage-marker { border-color: var(--wd-green); background: var(--wd-green); color: #fff; }
.wd-shell .dt-stage[data-current="true"] .dt-stage-marker {
  border-color: var(--wd-primary); background: var(--wd-primary); color: #fff;
  box-shadow: 0 0 0 3px var(--wd-primary-soft);
}
.wd-shell .dt-stage-text { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.wd-shell .dt-stage-label { font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.wd-shell .dt-stage[data-current="true"] .dt-stage-label { color: var(--wd-primary); }
.wd-shell .dt-stage-state { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .dt-stage[data-current="true"] .dt-stage-state { color: var(--wd-primary); }

/* rail dimension summary: four compact marks, never merged into one score.
   The full cards with their origin tags live in the reading pane; the rail only
   needs to say "which of the four exist", because the rail is scanned, not read. */
.wd-shell .dt-rail-dims { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
.wd-shell .dim-mini {
  display: flex; align-items: center; gap: 5px; min-width: 0;
  padding: 4px 7px; border-radius: 6px;
  background: var(--wd-red-soft);
}
.wd-shell .dim-mini[data-present="true"] { background: var(--wd-green-soft); }
.wd-shell .dim-mini-mark { flex: none; font-size: 10px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
.wd-shell .dim-mini[data-present="true"] .dim-mini-mark { color: var(--wd-green); }
.wd-shell .dim-mini-label {
  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wd-shell .dim-card {
  display: flex; flex-direction: column; gap: 1px; min-width: 0;
  padding: 7px 8px; border-radius: 8px;
  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
}
.wd-shell .dim-card[data-present="true"] { border-color: transparent; background: var(--wd-green-soft); }
.wd-shell .dim-card[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
.wd-shell .dim-card-label { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary); font-weight: 550; }
.wd-shell .dim-card-mark { font-size: 11px; line-height: 15px; font-weight: 650; }
.wd-shell .dim-card[data-present="true"] .dim-card-mark { color: var(--wd-green); }
.wd-shell .dim-card[data-present="false"] .dim-card-mark { color: var(--wd-red); }
.wd-shell .dim-card-value {
  font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.wd-shell .dim-card-origin {
  margin-top: 1px; font-size: 8.5px; line-height: 12px;
  color: var(--dsw-alias-label-tertiary); letter-spacing: .02em;
}
.wd-shell .dim-card-reason { font-size: 8.5px; line-height: 12px; color: var(--wd-red); opacity: .8; }

/* rail gaps */
.wd-shell .dt-rail-gaps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.wd-shell .dt-rail-gap { display: flex; align-items: baseline; gap: 6px; }
.wd-shell .dt-rail-gap-no {
  flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px; line-height: 14px; font-weight: 650;
  padding: 0 4px; border-radius: 3px;
}
.wd-shell .dt-rail-gap[data-level="high"] .dt-rail-gap-no { background: var(--wd-red-soft); color: var(--wd-red); }
.wd-shell .dt-rail-gap[data-level="medium"] .dt-rail-gap-no { background: var(--wd-amber-soft); color: var(--wd-amber); }
.wd-shell .dt-rail-gap-title { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

/* rail meta */
.wd-shell .dt-rail-meta { display: flex; flex-direction: column; gap: 3px; }
.wd-shell .dt-rail-meta-row { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .dt-rail-meta-label { flex: none; width: 82px; font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .dt-rail-meta-value {
  flex: 1 1 auto; min-width: 0; font-size: 10.5px; line-height: 15px;
  color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere;
}
.wd-shell .dt-rail-meta-value[data-empty="true"] { color: var(--dsw-alias-label-tertiary); font-style: italic; }

/* rail navigation */
.wd-shell .dt-rail-nav { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 10px; }
.wd-shell .dt-rail-position { flex: 1 1 auto; text-align: center; font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

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
.wd-shell .prog-seq { font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .prog-chip { margin-left: auto; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .prog-meter { margin-left: auto; display: flex; align-items: center; gap: 6px; min-width: 150px; }
.wd-shell .prog-meter-label { font-size: 9px; line-height: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); }
.wd-shell .prog-meter .inline-meter { flex: 1 1 auto; min-width: 40px; }
.wd-shell .prog-meter-value { font-size: 10.5px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }

.wd-shell .prog-pair { display: flex; flex-direction: column; gap: 3px; }
.wd-shell .prog-goal { display: flex; flex-direction: column; gap: 0; }
.wd-shell .prog-actual { display: flex; flex-direction: column; gap: 0; }
.wd-shell .prog-pair-label {
  font-size: 9px; line-height: 13px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .prog-goal .prog-pair-value { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.wd-shell .prog-actual .prog-pair-value { font-size: 12.5px; line-height: 19px; font-weight: 600; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .prog-scope, .wd-shell .prog-evidence, .wd-shell .prog-customer, .wd-shell .prog-feedback { display: flex; flex-direction: column; gap: 4px; }
.wd-shell .prog-scope-label, .wd-shell .prog-block-label {
  font-size: 9px; line-height: 13px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .prog-customer { flex-direction: row; align-items: center; gap: 6px; flex-wrap: wrap; }
.wd-shell .prog-customer .prog-block-label { margin-right: 1px; }
.wd-shell .prog-missing { font-size: 10.5px; line-height: 15px; color: var(--wd-amber); font-style: italic; }
.wd-shell .prog-evidence-link { text-decoration: none; color: var(--wd-primary); }
.wd-shell .prog-evidence-link:hover { background: var(--wd-primary-soft); }
.wd-shell .prog-external { margin-left: 2px; font-size: 9px; }
.wd-shell .prog-feedback-copy { font-size: 11.5px; line-height: 18px; }
.wd-shell .prog-next {
  display: flex; flex-direction: column; gap: 3px;
  padding: 7px 10px; border-radius: 8px;
  border-left: 3px solid var(--wd-primary);
  background: var(--wd-primary-soft);
}
.wd-shell .prog-next-empty { border-left-color: var(--wd-hairline); background: var(--wd-inset); }
.wd-shell .prog-next-label {
  font-size: 9px; line-height: 13px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 650; color: var(--wd-primary);
}
.wd-shell .prog-next-empty .prog-next-label { color: var(--dsw-alias-label-tertiary); }
.wd-shell .prog-next-body { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.wd-shell .prog-next-goal { font-size: 11.5px; line-height: 17px; font-weight: 600; color: var(--dsw-alias-label-primary); }

/* ---------- dimension grid (detail) ---------- */
.wd-shell .dim-grid-detail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 900px) { .wd-shell .dim-grid-detail { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.wd-shell .dim-grid-detail .dim-card {
  padding: 11px 12px; border-radius: 10px; gap: 3px;
  border-left: 3px solid var(--wd-red);
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .dim-grid-detail .dim-card[data-present="true"] { border-left-color: var(--wd-green); }
.wd-shell .dim-grid-detail .dim-card-label { font-size: 10.5px; line-height: 15px; }
.wd-shell .dim-grid-detail .dim-card-mark { font-size: 14px; line-height: 20px; }
.wd-shell .dim-grid-detail .dim-card-value { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary); -webkit-line-clamp: 3; }
.wd-shell .dim-grid-detail .dim-card-origin {
  display: inline-flex; align-self: flex-start; margin-top: 2px;
  padding: 0 5px; border-radius: 4px; font-size: 9px; line-height: 15px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- G0 meter ---------- */
.wd-shell .g0-meter { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
@media (max-width: 760px) { .wd-shell .g0-meter { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.wd-shell .g0-cell {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 6px; border-radius: 8px; min-width: 0;
  background: var(--wd-red-soft); border: 1px solid transparent;
}
.wd-shell .g0-cell[data-present="true"] { background: var(--wd-green-soft); }
.wd-shell .g0-cell-mark { font-size: 12px; line-height: 16px; font-weight: 650; color: var(--wd-red); }
.wd-shell .g0-cell[data-present="true"] .g0-cell-mark { color: var(--wd-green); }
.wd-shell .g0-cell-label {
  font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-secondary);
  text-align: center; overflow-wrap: anywhere;
}
.wd-shell .g0-fields { display: flex; flex-direction: column; gap: 8px; }
.wd-shell .g0-field {
  display: flex; flex-direction: column; gap: 2px;
  padding: 9px 11px; border-radius: 9px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
}
.wd-shell .g0-field[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
.wd-shell .g0-field-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 600; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .g0-field-value { margin: 0; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.wd-shell .g0-field[data-prose="true"] .g0-field-value { font-size: 12.5px; line-height: 20px; color: var(--dsw-alias-label-primary); }
.wd-shell .g0-field-missing { margin: 0; font-size: 11px; line-height: 16px; color: var(--wd-red); font-style: italic; }
.wd-shell .g0-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.wd-shell .g0-review { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
.wd-shell .g0-review[data-empty="true"] { color: var(--dsw-alias-label-tertiary); font-style: italic; }

/* ---------- plan ---------- */
.wd-shell .plan-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px) { .wd-shell .plan-meta { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .plan-strip {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 9px 12px; border-radius: 9px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .plan-strip-item { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.wd-shell .plan-strip-label { font-size: 9.5px; line-height: 14px; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600; }
.wd-shell .plan-strip-value { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
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
.wd-shell .plan-scenarios { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.wd-shell .plan-scenario { display: flex; align-items: baseline; gap: 9px; padding: 6px 10px; border-radius: 7px; background: var(--wd-inset); }
.wd-shell .plan-scenario-no {
  flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9.5px; line-height: 15px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .plan-scenario-text { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
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
.wd-shell .out-triple { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px) { .wd-shell .out-triple { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .out-milestone {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 14px; border-radius: 10px;
  border-left: 3px solid var(--wd-red); background: var(--wd-red-soft);
}
.wd-shell .out-milestone[data-present="true"] { border-left-color: var(--wd-green); background: var(--wd-green-soft); }
.wd-shell .out-milestone-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
  text-transform: uppercase; font-weight: 650; color: var(--wd-red);
}
.wd-shell .out-milestone[data-present="true"] .out-milestone-label { color: var(--wd-green); }
.wd-shell .out-milestone-text { font-size: 13px; line-height: 20px; font-weight: 650; color: var(--dsw-alias-label-primary); overflow-wrap: anywhere; }
.wd-shell .out-milestone-missing { font-size: 11.5px; line-height: 18px; color: var(--wd-red); overflow-wrap: anywhere; }
.wd-shell .out-milestone-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
.wd-shell .out-meta {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
  padding-top: 10px; border-top: 1px solid var(--wd-hairline);
}
@media (max-width: 900px) { .wd-shell .out-meta { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

@media (prefers-reduced-motion: reduce) {
  .wd-shell .dim-card, .wd-shell .prog-card { transition: none; }
}
`
