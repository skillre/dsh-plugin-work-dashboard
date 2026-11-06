/**
 * Chart styles.
 *
 * Kept beside `charts.tsx` rather than in the page sheet so a chart's geometry
 * and its paint rules stay one unit: the primitives read CSS custom properties
 * for colour and set `flex-grow` / `width` inline for magnitude, so there is
 * exactly one place per figure where size is decided.
 *
 * Every tone maps onto the shared `--wd-*` palette. Nothing here introduces a
 * new semantic colour; a chart may only use primary / green / amber / red /
 * slate and their soft variants, which is what keeps charts and badges
 * speaking the same language.
 */

export const CHARTS_CSS = `
/* ---------- shared chart chrome ---------- */
.wd-shell .chart-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.wd-shell .chart-empty {
  display: flex; align-items: center; justify-content: center;
  min-height: 44px; border-radius: 8px;
  border: 1px dashed var(--wd-hairline);
  color: var(--dsw-alias-label-tertiary); font-size: 11.5px;
}
.wd-shell .chart-block { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
.wd-shell .chart-block-head { display: flex; align-items: baseline; gap: 8px; }
.wd-shell .chart-block-title { margin: 0; font-size: 11.5px; line-height: 16px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.wd-shell .chart-block-note { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

/* ---------- stacked segment bar ---------- */
.wd-shell .segbar { display: flex; flex-direction: column; gap: 6px; }
.wd-shell .segbar-track {
  display: flex; width: 100%; height: 26px; overflow: hidden;
  border-radius: 7px; border: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
}
.wd-shell .segbar-seg {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  min-width: 3px; padding: 0 6px; overflow: hidden;
  font-size: 10.5px; font-weight: 600; white-space: nowrap;
  color: var(--dsw-alias-label-primary);
  background: var(--wd-slate-soft);
  border: 0; border-right: 1px solid rgba(255, 255, 255, .35);
  transition: filter .12s ease;
}
.wd-shell .segbar-seg:last-child { border-right: 0; }
.wd-shell .segbar-seg[data-tone="blue"] { background: var(--wd-primary-soft); color: var(--wd-primary-deep); }
.wd-shell .segbar-seg[data-tone="green"] { background: var(--wd-green-soft); color: var(--wd-green); }
.wd-shell .segbar-seg[data-tone="amber"] { background: var(--wd-amber-soft); color: var(--wd-amber); }
.wd-shell .segbar-seg[data-tone="red"] { background: var(--wd-red-soft); color: var(--wd-red); }
.wd-shell .segbar-button { cursor: pointer; font-family: inherit; }
.wd-shell .segbar-button:hover { filter: brightness(.96); }
.wd-shell .segbar-seg[data-active="true"] { box-shadow: inset 0 0 0 2px var(--wd-primary); }
.wd-shell .segbar-label { overflow: hidden; text-overflow: ellipsis; }
.wd-shell .segbar-value { font-variant-numeric: tabular-nums; font-weight: 650; }

/* ---------- vertical columns ---------- */
.wd-shell .columns { display: flex; align-items: flex-end; gap: 7px; }
.wd-shell .columns-cell {
  flex: 1 1 0; min-width: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px;
  padding: 0; border: 0; background: transparent; font-family: inherit;
  cursor: default;
}
.wd-shell .columns-cell[data-empty="true"] { opacity: .42; }
.wd-shell .columns-cell[data-active="true"] .columns-fill { box-shadow: 0 0 0 2px var(--wd-primary-ring); }
.wd-shell .columns-value { font-size: 10px; font-weight: 650; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }
.wd-shell .columns-fill {
  width: 100%; max-width: 40px; border-radius: 5px 5px 2px 2px;
  background: var(--wd-slate-soft); min-height: 3px;
  transition: filter .12s ease;
}
.wd-shell .columns-fill[data-tone="blue"] { background: var(--wd-primary); opacity: .82; }
.wd-shell .columns-fill[data-tone="green"] { background: var(--wd-green); opacity: .82; }
.wd-shell .columns-fill[data-tone="amber"] { background: var(--wd-amber); opacity: .82; }
.wd-shell .columns-fill[data-tone="red"] { background: var(--wd-red); opacity: .82; }
.wd-shell .columns-fill[data-tone="slate"] { background: var(--wd-slate); opacity: .55; }
.wd-shell .columns-label { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

/* ---------- donut ---------- */
.wd-shell .donut { display: flex; align-items: center; gap: 14px; }
.wd-shell .donut-figure { position: relative; flex: none; width: 84px; height: 84px; }
.wd-shell .donut-svg { width: 84px; height: 84px; display: block; }
.wd-shell .donut-ring { fill: none; stroke: var(--wd-hairline); stroke-width: 11; }
.wd-shell .donut-slice { fill: none; stroke-width: 11; stroke-linecap: butt; }
.wd-shell .donut-slice[data-tone="blue"] { stroke: var(--wd-primary); }
.wd-shell .donut-slice[data-tone="green"] { stroke: var(--wd-green); }
.wd-shell .donut-slice[data-tone="amber"] { stroke: var(--wd-amber); }
.wd-shell .donut-slice[data-tone="red"] { stroke: var(--wd-red); }
.wd-shell .donut-slice[data-tone="slate"] { stroke: var(--wd-slate); }
.wd-shell .donut-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px; pointer-events: none;
}
.wd-shell .donut-center-value { font-size: 16px; line-height: 20px; font-weight: 650; font-variant-numeric: tabular-nums; }
.wd-shell .donut-center-label { font-size: 9.5px; line-height: 13px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .donut-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1 1 auto; }
.wd-shell .donut-legend-row {
  display: flex; align-items: center; gap: 7px; width: 100%;
  padding: 2px 5px; border: 0; border-radius: 6px; background: transparent;
  font-family: inherit; font-size: 11px; color: var(--dsw-alias-label-secondary);
  text-align: left; cursor: default;
}
.wd-shell .donut-legend-button { cursor: pointer; }
.wd-shell .donut-legend-button:hover { background: var(--wd-inset); }
.wd-shell .donut-legend-row[data-active="true"] { background: var(--wd-primary-soft); color: var(--wd-primary-deep); }
.wd-shell .donut-dot { flex: none; width: 8px; height: 8px; border-radius: 2px; background: var(--wd-slate); }
.wd-shell .donut-dot[data-tone="blue"] { background: var(--wd-primary); }
.wd-shell .donut-dot[data-tone="green"] { background: var(--wd-green); }
.wd-shell .donut-dot[data-tone="amber"] { background: var(--wd-amber); }
.wd-shell .donut-dot[data-tone="red"] { background: var(--wd-red); }
.wd-shell .donut-legend-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-shell .donut-legend-value { flex: none; font-variant-numeric: tabular-nums; font-weight: 650; }

/* ---------- horizontal bar list ---------- */
.wd-shell .barlist { display: flex; flex-direction: column; gap: 2px; }
.wd-shell .barlist-row {
  display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(40px, 1fr) 46px;
  align-items: center; gap: 9px; width: 100%;
  padding: 4px 6px; border: 0; border-radius: 6px; background: transparent;
  font-family: inherit; text-align: left; cursor: default;
}
.wd-shell .barlist-button { cursor: pointer; }
.wd-shell .barlist-button:hover { background: var(--wd-inset); }
.wd-shell .barlist-row[data-active="true"] { background: var(--wd-primary-soft); }
.wd-shell .barlist-text { display: flex; flex-direction: column; min-width: 0; }
.wd-shell .barlist-label { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-shell .barlist-note { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wd-shell .barlist-track { height: 7px; border-radius: 4px; background: var(--wd-inset); overflow: hidden; }
.wd-shell .barlist-fill { display: block; height: 100%; border-radius: 4px; background: var(--wd-slate); opacity: .7; }
.wd-shell .barlist-fill[data-tone="blue"] { background: var(--wd-primary); opacity: .9; }
.wd-shell .barlist-fill[data-tone="green"] { background: var(--wd-green); opacity: .9; }
.wd-shell .barlist-fill[data-tone="amber"] { background: var(--wd-amber); opacity: .9; }
.wd-shell .barlist-fill[data-tone="red"] { background: var(--wd-red); opacity: .9; }
.wd-shell .barlist-value { font-size: 11.5px; font-weight: 650; font-variant-numeric: tabular-nums; text-align: right; color: var(--dsw-alias-label-secondary); }

/* ---------- radial meter ---------- */
.wd-shell .radial { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; }
.wd-shell .radial-figure { position: relative; width: 58px; height: 58px; }
.wd-shell .radial-figure svg { width: 58px; height: 58px; display: block; }
.wd-shell .radial-track { fill: none; stroke: var(--wd-hairline); stroke-width: 6; }
.wd-shell .radial-fill { fill: none; stroke-width: 6; stroke-linecap: round; }
.wd-shell .radial-fill[data-tone="blue"] { stroke: var(--wd-primary); }
.wd-shell .radial-fill[data-tone="green"] { stroke: var(--wd-green); }
.wd-shell .radial-fill[data-tone="amber"] { stroke: var(--wd-amber); }
.wd-shell .radial-fill[data-tone="red"] { stroke: var(--wd-red); }
.wd-shell .radial-fill[data-tone="slate"] { stroke: var(--wd-slate); }
.wd-shell .radial-value {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums;
}
.wd-shell .radial-label { font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.wd-shell .radial-note { font-size: 9.5px; line-height: 13px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

/* ---------- spark bars ---------- */
.wd-shell .spark { display: flex; align-items: flex-end; gap: 3px; height: 46px; }
.wd-shell .spark-cell { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 2px; height: 100%; }
.wd-shell .spark-bar { width: 100%; max-width: 16px; border-radius: 3px 3px 1px 1px; background: var(--wd-primary); opacity: .78; min-height: 3px; }
.wd-shell .spark-bar[data-empty="true"] { background: var(--wd-hairline); opacity: 1; }
.wd-shell .spark-month { font-size: 9px; line-height: 12px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

/* ---------- mini stage rail ---------- */
.wd-shell .rail-mini { display: flex; align-items: center; gap: 3px; }
.wd-shell .rail-mini-tick { width: 100%; max-width: 18px; height: 4px; border-radius: 2px; background: var(--wd-hairline); }
.wd-shell .rail-mini-tick[data-done="true"] { background: var(--wd-green); }
.wd-shell .rail-mini-tick[data-current="true"] { background: var(--wd-primary); box-shadow: 0 0 0 2px var(--wd-primary-ring); }

/* ---------- inline meter ---------- */
.wd-shell .inline-meter { display: block; width: 100%; height: 4px; border-radius: 2px; background: var(--wd-hairline); overflow: hidden; }
.wd-shell .inline-meter-fill { display: block; height: 100%; border-radius: 2px; background: var(--wd-primary); }
.wd-shell .inline-meter-fill[data-tone="green"] { background: var(--wd-green); }
.wd-shell .inline-meter-fill[data-tone="amber"] { background: var(--wd-amber); }
.wd-shell .inline-meter-fill[data-tone="red"] { background: var(--wd-red); }
.wd-shell .inline-meter-fill[data-tone="slate"] { background: var(--wd-slate); }

/* ---------- legend ---------- */
.wd-shell .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.wd-shell .legend-item { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .legend-dot { width: 7px; height: 7px; border-radius: 2px; background: var(--wd-slate); }
.wd-shell .legend-dot[data-tone="blue"] { background: var(--wd-primary); }
.wd-shell .legend-dot[data-tone="green"] { background: var(--wd-green); }
.wd-shell .legend-dot[data-tone="amber"] { background: var(--wd-amber); }
.wd-shell .legend-dot[data-tone="red"] { background: var(--wd-red); }
.wd-shell .legend-label { color: var(--dsw-alias-label-secondary); }
.wd-shell .legend-value { font-variant-numeric: tabular-nums; font-weight: 600; }

@media (prefers-reduced-motion: reduce) {
  .wd-shell .segbar-seg, .wd-shell .columns-fill { transition: none; }
}
`
