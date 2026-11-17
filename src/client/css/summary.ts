/**
 * KPI strip, budget panel and in-stage progress styles.
 *
 * Three figures with one shared constraint: they are all READ-FIRST surfaces, so
 * they use numbers at display size (17–22px) and labels at 10.5–11.5px. The
 * earlier surfaces rendered every number at 10px, which made a portfolio of
 * thirty projects read like a log file.
 *
 * Colour vocabulary is the same everywhere: green = justified/approved, amber =
 * waiting, red = a gap that costs money, blue = neutral information. Nothing
 * here introduces a fifth judgement colour.
 */

export const SUMMARY_CSS = `
/* ---------- KPI strip ---------- */
.wd-shell .kpi-strip {
  border: 1px solid var(--wd-hairline); border-radius: 12px;
  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
  margin-bottom: 16px; overflow: hidden;
}
.wd-shell .kpi-cells {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
@media (max-width: 1180px) { .wd-shell .kpi-cells { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 720px) { .wd-shell .kpi-cells { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.wd-shell .kpi-cell {
  display: flex; flex-direction: column; gap: 2px;
  padding: 12px 16px;
  border-right: 1px solid var(--wd-hairline);
  min-width: 0;
}
.wd-shell .kpi-cell:last-child { border-right: 0; }
/* A hairline above the value carries the tone, so the number itself stays the
   same ink on every cell: five differently-coloured numbers would read as five
   different kinds of number. */
.wd-shell .kpi-label {
  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wd-shell .kpi-value {
  font-size: 21px; line-height: 28px; font-weight: 650;
  color: var(--wd-text); font-variant-numeric: tabular-nums;
  letter-spacing: -.01em;
}
.wd-shell .kpi-cell[data-tone="red"] .kpi-value { color: var(--wd-red); }
.wd-shell .kpi-cell[data-tone="green"] .kpi-value { color: var(--wd-green); }
.wd-shell .kpi-cell[data-tone="amber"] .kpi-value { color: var(--wd-amber); }
.wd-shell .kpi-note {
  font-size: 10.5px; line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.wd-shell .kpi-stages {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px;
  border-top: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
  flex-wrap: wrap;
}
.wd-shell .kpi-stages-label {
  flex: none; font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
}
.wd-shell .kpi-stage-chips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; }
.wd-shell .kpi-stage-chip {
  display: inline-flex; align-items: center; gap: 5px;
  height: 24px; padding: 0 9px;
  border: 1px solid var(--wd-hairline); border-radius: 20px;
  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
  font-size: 11px; line-height: 16px; cursor: pointer; white-space: nowrap;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.wd-shell .kpi-stage-chip:hover:not([disabled]) { background: var(--wd-canvas); color: var(--wd-text); }
.wd-shell .kpi-stage-chip[data-active="true"] {
  background: var(--wd-primary-soft); border-color: var(--wd-primary);
  color: var(--wd-primary); font-weight: 600;
}
/* A zero bucket stays visible but muted: its existence is information ("nothing
   reached G3"), and hiding it would make the funnel look shorter than it is. */
.wd-shell .kpi-stage-chip[data-zero="true"] { opacity: .5; }
.wd-shell .kpi-stage-count {
  font-size: 10.5px; font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary); font-weight: 500;
}
.wd-shell .kpi-stage-chip[data-active="true"] .kpi-stage-count { color: var(--wd-primary); }
.wd-shell .kpi-stages-summary {
  margin-left: auto; font-size: 10.5px; line-height: 15px;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
@media (max-width: 900px) { .wd-shell .kpi-stages-summary { display: none; } }

/* ---------- budget panel ---------- */
.wd-shell .budget-panel {
  border: 1px solid var(--wd-hairline); border-radius: 12px;
  background: var(--wd-surface); box-shadow: var(--wd-shadow-1);
  padding: 13px 16px 14px;
  display: flex; flex-direction: column; gap: 11px;
}
.wd-shell .budget-head { display: flex; align-items: baseline; gap: 9px; }
.wd-shell .budget-title { margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650; }
.wd-shell .budget-note { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .budget-total { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .budget-total-label {
  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
}
.wd-shell .budget-total-value {
  font-size: 22px; line-height: 30px; font-weight: 650; color: var(--wd-text);
  font-variant-numeric: tabular-nums; letter-spacing: -.01em;
}
.wd-shell .budget-total-unit { margin-left: 4px; font-size: 11px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
.wd-shell .budget-bar {
  display: flex; height: 8px; border-radius: 5px; overflow: hidden;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .budget-bar-segment { height: 100%; }
.wd-shell .budget-bar-segment[data-tone="green"] { background: var(--wd-green); }
.wd-shell .budget-bar-segment[data-tone="amber"] { background: var(--wd-amber); }
.wd-shell .budget-rows { margin: 0; display: flex; flex-direction: column; gap: 5px; }
.wd-shell .budget-row { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .budget-row-label {
  flex: none; width: 82px; font-size: 11.5px; line-height: 17px; font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.wd-shell .budget-row[data-tone="green"] .budget-row-label { color: var(--wd-green); }
.wd-shell .budget-row[data-tone="amber"] .budget-row-label { color: var(--wd-amber); }
.wd-shell .budget-row[data-tone="red"] .budget-row-label { color: var(--wd-red); }
.wd-shell .budget-row-value {
  margin: 0; font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums;
}
.wd-shell .budget-warning {
  margin: 0; padding: 7px 10px;
  border-radius: 8px; background: var(--wd-red-soft); color: var(--wd-red);
  font-size: 11.5px; line-height: 17px;
}
.wd-shell .budget-empty {
  margin: 0; padding: 16px 4px; text-align: center;
  font-size: 12px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .budget-orgs { display: flex; flex-direction: column; gap: 5px; }
.wd-shell .budget-orgs-label {
  font-size: 10.5px; line-height: 15px; letter-spacing: .05em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary); font-weight: 600;
}
.wd-shell .budget-org-row {
  display: grid; grid-template-columns: minmax(0, 1fr) 74px 34px;
  align-items: center; gap: 8px;
}
.wd-shell .budget-org-name {
  font-size: 11.5px; line-height: 17px; color: var(--wd-text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.wd-shell .budget-org-system { margin-left: 5px; font-size: 10px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .budget-org-value {
  font-size: 10.5px; line-height: 15px; text-align: right;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
}
.wd-shell .budget-concentration {
  margin: 0; font-size: 10.5px; line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}

/* ---------- in-stage progress ---------- */
.wd-shell .stage-progress { display: flex; flex-direction: column; gap: 4px; }
.wd-shell .stage-progress-row {
  display: grid; grid-template-columns: 68px minmax(0, 1fr) 82px;
  align-items: center; gap: 8px;
}
.wd-shell .stage-progress-label {
  font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wd-shell .stage-progress-value {
  font-size: 10.5px; line-height: 15px; text-align: right;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
}
.wd-shell .stage-progress-empty {
  grid-column: 2 / -1; font-size: 10.5px; line-height: 15px;
  color: var(--dsw-alias-label-tertiary);
}
.wd-shell .stage-progress-row[data-empty="true"] { opacity: .7; }
`
