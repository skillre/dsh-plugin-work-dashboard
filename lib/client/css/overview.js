/**
 * Overview styles: the portfolio band, the three project readings, the pending rail.
 *
 * Three decisions drive this sheet:
 *
 * 1. **The band is one instrument, not six cards.** It gets one container with
 *    internal dividers, so the eye reads it as a single dashboard rather than
 *    six unrelated widgets. A card grid with gaps between every figure was the
 *    failure mode of the previous stat strip.
 * 2. **Cards carry the reading order.** Name → stage → money → latest progress →
 *    four dimensions → gaps. The gap badge sits top-right because it is the
 *    reason to open the card at all; everything else is context for it.
 * 3. **Selection is visible from the keyboard.** The shell moves a cursor with
 *    the arrow keys, so a selected card and a selected row both have to be
 *    unmistakable — a ring, not a background tint, because the background is
 *    already doing hover duty.
 *
 * Class prefixes owned here: `.pf-` (band), `.pcard-`, `.pboard-`, `.ptable-`,
 * `.pending-`, plus the shared `.panel` / `.workspace-grid` / `.project-row`
 * atoms this surface defines because nothing else uses them.
 */
export const OVERVIEW_CSS = `
/* ---------- layout ---------- */
.wd-shell .workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 16px; align-items: start; }
@media (max-width: 1180px) { .wd-shell .workspace-grid { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .primary-column, .wd-shell .secondary-column { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.wd-shell .panel {
  border: 1px solid var(--wd-hairline); border-radius: 12px;
  background: var(--wd-surface); overflow: hidden;
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .panel-header {
  display: flex; align-items: baseline; gap: 9px;
  padding: 12px 18px 10px;
  border-bottom: 1px solid var(--wd-hairline);
  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 150%);
}
.wd-shell .panel-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; letter-spacing: -.005em; }
.wd-shell .panel-kicker {
  margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary);
  font-variant-numeric: tabular-nums;
  padding: 1px 8px; border-radius: 20px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .panel-body { padding: 0; }
.wd-shell .panel-body.padded { padding: 13px 18px; }

/* ---------- portfolio band ---------- */
.wd-shell .pf-band {
  margin-bottom: 14px;
  border: 1px solid var(--wd-hairline); border-radius: 12px;
  background: var(--wd-surface);
  box-shadow: var(--wd-shadow-1);
  overflow: hidden;
}
.wd-shell .pf-band-head {
  display: flex; align-items: baseline; gap: 10px;
  padding: 9px 16px 8px;
  border-bottom: 1px solid var(--wd-hairline);
  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 150%);
}
.wd-shell .pf-band-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; }
.wd-shell .pf-band-note { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .pf-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 1px;
  background: var(--wd-hairline);
}
@media (max-width: 1280px) { .wd-shell .pf-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 860px) { .wd-shell .pf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .wd-shell .pf-grid { grid-template-columns: minmax(0, 1fr); } }
/* Two strips, four blocks each. The band is context: it answers "where does the
   money sit" in about a third of the screen, then gets out of the way. An eight-column
   grid lets two wide figures and four list figures share exactly two rows. */
.wd-shell .pf-block {
  padding: 8px 12px 9px;
  background: var(--wd-surface);
  min-height: 0;
  justify-content: flex-start;
}
.wd-shell .pf-block[data-span="4"] { grid-column: span 4; }
.wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
@media (max-width: 1280px) {
  .wd-shell .pf-block[data-span="4"] { grid-column: span 4; }
  .wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
}
@media (max-width: 860px) {
  .wd-shell .pf-block[data-span="4"], .wd-shell .pf-block[data-span="2"] { grid-column: span 2; }
}
@media (max-width: 560px) {
  .wd-shell .pf-block[data-span="4"], .wd-shell .pf-block[data-span="2"] { grid-column: span 1; }
}
@media (max-width: 720px) { .wd-shell .pf-block-wide { grid-column: span 1; } }
.wd-shell .pf-radials { display: flex; gap: 8px; justify-content: space-between; padding: 2px 2px 0; }
/* Four rows fit exactly; the cap only protects against a deployment with many
   more orgs than this one, where the strip must not grow the band. */
.wd-shell .pf-block[data-span="2"] .barlist { max-height: 168px; overflow: auto; scrollbar-width: thin; }
.wd-shell .pf-collapse {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 1px 7px; border-radius: 6px;
  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
  cursor: pointer; font-family: inherit; white-space: nowrap;
}
.wd-shell .pf-collapse:hover { color: var(--wd-text); background: var(--wd-surface); }
.wd-shell .pf-band[data-collapsed="true"] .pf-grid { display: none; }
.wd-shell .pf-note {
  margin: 5px 0 0; font-size: 10px; line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.wd-shell .pf-note[data-tone="amber"] { color: var(--wd-amber); }

/* ---------- project cards ---------- */
.wd-shell .pcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(268px, 1fr));
  gap: 12px; padding: 14px;
}
.wd-shell .pcard {
  display: flex; flex-direction: column; gap: 9px;
  padding: 13px 14px 11px;
  border: 1px solid var(--wd-hairline); border-radius: 10px;
  background: var(--wd-surface);
  cursor: pointer; min-width: 0;
  transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease;
}
.wd-shell .pcard:hover { box-shadow: var(--wd-shadow-2); border-color: var(--dsw-alias-border-l2); transform: translateY(-1px); }
.wd-shell .pcard:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
.wd-shell .pcard[data-selected="true"] {
  border-color: var(--wd-primary);
  box-shadow: 0 0 0 3px var(--wd-primary-soft), var(--wd-shadow-2);
}
.wd-shell .pcard[data-closed="true"] { opacity: .82; }
.wd-shell .pcard-head { display: flex; align-items: flex-start; gap: 8px; }
.wd-shell .pcard-title-block { min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; gap: 1px; }
.wd-shell .pcard-name {
  font-size: 13.5px; line-height: 19px; font-weight: 650;
  letter-spacing: -.005em; overflow-wrap: anywhere;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.wd-shell .pcard-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .pcard-badge {
  flex: none; padding: 1px 7px; border-radius: 20px;
  font-size: 10px; line-height: 15px; font-weight: 650; white-space: nowrap;
}
.wd-shell .pcard-badge[data-tone="red"] { background: var(--wd-red-soft); color: var(--wd-red); }
.wd-shell .pcard-badge[data-tone="amber"] { background: var(--wd-amber-soft); color: var(--wd-amber); }
.wd-shell .pcard-stage { display: flex; align-items: center; gap: 8px; min-width: 0; }
.wd-shell .pcard-stage-pill { flex: none; }
.wd-shell .pcard-stage .rail-mini { flex: 1 1 auto; }
.wd-shell .pcard-meta { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .pcard-org {
  flex: 1 1 auto; min-width: 0;
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wd-shell .pcard-amount {
  flex: none; font-size: 12.5px; font-weight: 650;
  font-variant-numeric: tabular-nums; color: var(--wd-amber);
}
.wd-shell .pcard-unit { margin-left: 2px; font-size: 9.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
.wd-shell .pcard-progress {
  display: flex; flex-direction: column; gap: 1px;
  padding: 7px 9px; border-radius: 8px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .pcard-progress-label {
  font-size: 9.5px; line-height: 14px; letter-spacing: .05em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
}
.wd-shell .pcard-progress-copy {
  font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.wd-shell .pcard-progress-meta {
  margin-top: 1px; font-size: 9.5px; line-height: 14px;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
}
.wd-shell .pcard-dims { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.wd-shell .pcard-dim {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 3px 2px; border-radius: 6px; min-width: 0;
  background: var(--wd-red-soft);
}
.wd-shell .pcard-dim[data-present="true"] { background: var(--wd-green-soft); }
.wd-shell .pcard-dim-mark { font-size: 10.5px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
.wd-shell .pcard-dim[data-present="true"] .pcard-dim-mark { color: var(--wd-green); }
.wd-shell .pcard-dim-label {
  font-size: 8.5px; line-height: 12px; color: var(--dsw-alias-label-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}
.wd-shell .pcard-foot { display: flex; align-items: center; gap: 8px; }
.wd-shell .pcard-since { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .pcard-open { margin-left: auto; font-size: 10.5px; color: var(--wd-primary); font-weight: 600; }

/* ---------- board ---------- */
.wd-shell .pboard {
  display: flex; gap: 10px; padding: 14px;
  overflow-x: auto; overscroll-behavior-x: contain;
  align-items: stretch;
}
.wd-shell .pboard-column {
  flex: 1 1 0; min-width: 176px; max-width: 300px;
  display: flex; flex-direction: column; gap: 8px;
  padding: 10px 9px 12px; border-radius: 10px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .pboard-column[data-empty="true"] { background: transparent; border-style: dashed; }
.wd-shell .pboard-column-head { display: flex; flex-direction: column; gap: 3px; }
.wd-shell .pboard-column-label { font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-secondary); }
.wd-shell .pboard-column-count {
  font-size: 9.5px; line-height: 14px;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
}
.wd-shell .pboard-column-body { display: flex; flex-direction: column; gap: 7px; flex: 1 1 auto; }
.wd-shell .pboard-card {
  display: flex; flex-direction: column; gap: 3px;
  padding: 9px 10px; border-radius: 8px; width: 100%; text-align: left;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  cursor: pointer; font-family: inherit;
  box-shadow: var(--wd-shadow-1);
  transition: box-shadow .14s ease, border-color .14s ease;
}
.wd-shell .pboard-card:hover { box-shadow: var(--wd-shadow-2); border-color: var(--dsw-alias-border-l2); }
.wd-shell .pboard-card[data-high="true"] { border-left: 3px solid var(--wd-red); }
.wd-shell .pboard-card-name {
  font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-primary);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.wd-shell .pboard-card-meta { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .pboard-card-owner { font-variant-numeric: normal; }
.wd-shell .pboard-card-progress {
  font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wd-shell .pboard-card-gap { font-size: 9.5px; line-height: 14px; font-weight: 650; color: var(--wd-red); }
.wd-shell .pboard-empty {
  padding: 16px 8px; text-align: center;
  font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
  border: 1px dashed var(--wd-hairline); border-radius: 8px;
}

/* ---------- table ---------- */
.wd-shell .project-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.wd-shell .table-head th {
  position: sticky; top: 0; z-index: 1;
  padding: 8px 12px; text-align: left; white-space: nowrap;
  font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary);
  border-bottom: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
}
.wd-shell .table-head th:first-child { padding-left: 16px; }
.wd-shell .table-head th:last-child { padding-right: 16px; }
.wd-shell .ptable-sort {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 0; border: 0; background: transparent; cursor: pointer;
  font: inherit; font-size: 10.5px; font-weight: 600; letter-spacing: .06em;
  text-transform: uppercase; color: inherit; white-space: nowrap;
}
.wd-shell .ptable-sort:hover { color: var(--wd-text); }
.wd-shell .ptable-sort[data-active="true"] { color: var(--wd-primary); }
.wd-shell .ptable-sort-arrow { font-size: 9.5px; }
.wd-shell .project-row { border-bottom: 1px solid var(--wd-hairline); cursor: pointer; transition: background .1s ease; }
.wd-shell .project-row:last-child { border-bottom: 0; }
.wd-shell .project-row:hover { background: var(--wd-inset); }
.wd-shell .project-row[data-selected="true"] { background: var(--wd-primary-soft); }
.wd-shell .project-row:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: -2px; }
.wd-shell .project-row td { padding: 10px 12px; vertical-align: middle; }
.wd-shell .project-row td:first-child { padding-left: 16px; }
.wd-shell .project-row td:last-child { padding-right: 16px; text-align: right; }
.wd-shell .project-name {
  font-size: 12.5px; line-height: 18px; font-weight: 600;
  display: block; overflow-wrap: anywhere; letter-spacing: -.005em;
}
.wd-shell .project-id {
  font-size: 10px; line-height: 15px; color: var(--dsw-alias-label-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wd-shell .project-org { display: block; font-size: 11.5px; line-height: 17px; font-weight: 550; overflow-wrap: anywhere; }
.wd-shell .project-meta { font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.wd-shell .progress-summary {
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.wd-shell .ptable-stage { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.wd-shell .ptable-amount { display: flex; flex-direction: column; gap: 4px; align-items: stretch; }
.wd-shell .amount-cell { display: block; text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12px; }
.wd-shell .gap-cell { display: flex; align-items: baseline; gap: 3px; white-space: nowrap; }
.wd-shell .gap-count { font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12.5px; }
.wd-shell .gap-count[data-level="high"] { color: var(--wd-red); }
.wd-shell .gap-count[data-level="medium"] { color: var(--wd-amber); }
.wd-shell .gap-count[data-level="none"] { color: var(--wd-green); }
.wd-shell .row-actions { display: flex; gap: 5px; justify-content: flex-end; }
.wd-shell .gap-copy { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

/* ---------- pending rail ---------- */
.wd-shell .pending { display: flex; flex-direction: column; }
.wd-shell .pending-group { border-bottom: 1px solid var(--wd-hairline); }
.wd-shell .pending-group:last-child { border-bottom: 0; }
.wd-shell .pending-group[data-level="high"] { border-left: 3px solid var(--wd-red); }
.wd-shell .pending-group[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
.wd-shell .pending-group-head {
  display: flex; align-items: baseline; gap: 6px;
  padding: 9px 13px 5px; flex-wrap: wrap;
}
.wd-shell .pending-rule-no {
  flex: none; padding: 0 5px; border-radius: 4px;
  font-size: 9.5px; line-height: 15px; font-weight: 650;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
}
.wd-shell .pending-group[data-level="high"] .pending-rule-no { background: var(--wd-red-soft); color: var(--wd-red); }
.wd-shell .pending-group[data-level="medium"] .pending-rule-no { background: var(--wd-amber-soft); color: var(--wd-amber); }
.wd-shell .pending-rule-title { flex: 1 1 auto; min-width: 0; font-size: 11.5px; line-height: 16px; font-weight: 600; overflow-wrap: anywhere; }
.wd-shell .pending-rule-count { flex: none; font-size: 9.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }
.wd-shell .pending-group-body { padding: 0 13px 10px; display: flex; flex-direction: column; gap: 6px; }
.wd-shell .pending-gap { display: flex; flex-direction: column; gap: 2px; }
.wd-shell .pending-gap-copy { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .pending-gap-project { display: flex; }
.wd-shell .pending-link {
  padding: 0; border: 0; background: transparent; cursor: pointer;
  font: inherit; font-size: 10px; color: var(--wd-primary); text-align: left;
}
.wd-shell .pending-link:hover { text-decoration: underline; }
.wd-shell .pending-more { font-size: 9.5px; line-height: 14px; color: var(--dsw-alias-label-tertiary); font-style: italic; }

@media (prefers-reduced-motion: reduce) {
  .wd-shell .pcard, .wd-shell .pboard-card, .wd-shell .project-row { transition: none; }
}
`;
