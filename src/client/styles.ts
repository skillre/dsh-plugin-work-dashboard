/**
 * Dashboard styles.
 *
 * Design goals, in the order that drove the decisions:
 *
 * 1. **Depth through layering, not decoration.** Three surface levels
 *    (canvas → card → inset) with a single soft shadow ramp. A flat page reads
 *    "unstyled"; three tones read "designed" without adding visual noise.
 * 2. **One accent, used sparingly.** The brand blue marks only the current
 *    selection and the primary action. Status colour (green/amber/red) is
 *    reserved for judgement — never for chrome.
 * 3. **Density with air.** The ledger is data-heavy, so rows stay compact, but
 *    every section gets a real gap and a real heading hierarchy. Cramped and
 *    airy are both failures; the target is "scannable at 1440".
 * 4. **Theme-native.** The frame uses `--dsw-alias-*` tokens so light and dark
 *    both work. The ledger's own palette (blue/green/amber/red from DESIGN.md)
 *    is literal, with dark-theme variants that stay legible.
 *
 * Everything is scoped under `.wd-shell`, and the sheet lives in a `<style>`
 * element React removes on unmount, so nothing leaks into product DOM.
 */

import type { CSSProperties } from 'react'

export const CONSOLE_CSS = `
.wd-shell {
  /* Brand + status palette (DESIGN.md), with soft tints derived from each. */
  --wd-primary: #2864E8;
  --wd-primary-deep: #1B4FC2;
  --wd-primary-soft: rgba(40, 100, 232, .09);
  --wd-primary-ring: rgba(40, 100, 232, .26);
  --wd-text: #192638;
  --wd-bg: #F5F7FB;
  --wd-border: #E6EBF2;
  --wd-green: #218568;
  --wd-amber: #B77919;
  --wd-red: #C0392B;
  --wd-slate: #5A6A80;
  --wd-green-soft: rgba(33, 133, 104, .10);
  --wd-amber-soft: rgba(183, 121, 25, .11);
  --wd-red-soft: rgba(192, 57, 43, .10);
  --wd-slate-soft: rgba(90, 106, 128, .10);

  /* Surface ramp: canvas → card → inset. */
  --wd-canvas: #F5F7FB;
  --wd-surface: #FFFFFF;
  --wd-inset: #F7F9FC;
  --wd-hairline: #E6EBF2;

  /* One shadow ramp; three steps is enough for any depth in this UI. */
  --wd-shadow-1: 0 1px 2px rgba(20, 32, 52, .05);
  --wd-shadow-2: 0 2px 6px rgba(20, 32, 52, .07), 0 1px 2px rgba(20, 32, 52, .04);
  --wd-shadow-3: 0 10px 30px rgba(20, 32, 52, .12), 0 2px 8px rgba(20, 32, 52, .06);

  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--wd-canvas);
  color: var(--wd-text);
  font-family: 'Avenir Next', 'PingFang SC', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
body[data-ds-dark-theme] .wd-shell {
  --wd-text: #E8EDF5;
  --wd-bg: #14181F;
  --wd-border: #2A3341;
  --wd-green: #4FC59B;
  --wd-amber: #E0A94A;
  --wd-red: #F07A6B;
  --wd-slate: #97A6BA;
  --wd-primary: #6E9BFF;
  --wd-primary-deep: #8DB0FF;
  --wd-primary-soft: rgba(110, 155, 255, .14);
  --wd-primary-ring: rgba(110, 155, 255, .32);
  --wd-green-soft: rgba(79, 197, 155, .14);
  --wd-amber-soft: rgba(224, 169, 74, .16);
  --wd-red-soft: rgba(240, 122, 107, .14);
  --wd-slate-soft: rgba(151, 166, 186, .14);
  --wd-canvas: #14181F;
  --wd-surface: #1B2029;
  --wd-inset: #222834;
  --wd-hairline: #2A3341;
  --wd-shadow-1: 0 1px 2px rgba(0, 0, 0, .28);
  --wd-shadow-2: 0 2px 8px rgba(0, 0, 0, .34), 0 1px 2px rgba(0, 0, 0, .24);
  --wd-shadow-3: 0 12px 34px rgba(0, 0, 0, .48), 0 2px 8px rgba(0, 0, 0, .3);
}
.wd-shell *, .wd-shell *::before, .wd-shell *::after { box-sizing: border-box; }
.wd-shell button, .wd-shell input, .wd-shell select { font: inherit; color: inherit; }

/* ---------- shell: rail + canvas ---------- */
.wd-shell .page { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }

.wd-shell .module-rail {
  flex: 0 0 auto;
  display: flex; align-items: center; gap: 6px;
  padding: 10px 32px 0;
}
.wd-shell .module-tab {
  display: inline-flex; align-items: center; gap: 7px;
  height: 30px; padding: 0 12px;
  border: 1px solid transparent; border-radius: 8px 8px 0 0;
  background: transparent; color: var(--dsw-alias-label-secondary);
  cursor: pointer; font-size: 12.5px; font-weight: 500;
  border-bottom: 0; position: relative; top: 1px;
}
.wd-shell .module-tab[data-active="true"] {
  background: var(--wd-surface); color: var(--wd-text);
  border-color: var(--wd-hairline); font-weight: 600;
}
.wd-shell .module-tab:not([data-active="true"]):hover { background: var(--wd-primary-soft); color: var(--wd-text); }
.wd-shell .module-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--wd-primary); flex: none; }
.wd-shell .module-tab[data-active="false"] .module-tab-dot { background: var(--wd-slate); opacity: .55; }
.wd-shell .module-rail-hint { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }

/* ---------- page header ---------- */
.wd-shell .page-header {
  flex: 0 0 auto;
  display: flex; align-items: flex-start; gap: 16px;
  padding: 20px 32px 18px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  border-radius: 0 0 0 0;
  box-shadow: var(--wd-shadow-1);
  position: relative; z-index: 2;
}
.wd-shell .page-header-text { flex: 1 1 auto; min-width: 0; }
.wd-shell .page-eyebrow {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; line-height: 16px; letter-spacing: .06em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
  margin-bottom: 3px;
}
.wd-shell .page-title {
  margin: 0; font-size: 21px; line-height: 28px; font-weight: 650;
  letter-spacing: -.01em; display: flex; align-items: center; gap: 10px;
}
.wd-shell .page-subtitle { margin: 3px 0 0; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.wd-shell .page-source {
  margin: 7px 0 0; font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
  display: flex; gap: 7px; flex-wrap: wrap; align-items: center;
}
.wd-shell .page-source code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
  padding: 2px 7px; border-radius: 5px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .header-actions { flex: none; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.wd-shell .page-body {
  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
  padding: 24px 32px 40px;
}
.wd-shell .page-footer {
  flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
  padding: 8px 32px; min-height: 32px;
  border-top: 1px solid var(--wd-hairline);
  background: var(--wd-surface);
  font-size: 11.5px; color: var(--dsw-alias-label-tertiary);
}

/* ---------- buttons ---------- */
.wd-shell .btn {
  height: 30px; padding: 0 12px;
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: 8px; border: 1px solid var(--wd-hairline);
  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
  cursor: pointer; white-space: nowrap; font-size: 12.5px;
  transition: background .13s ease, border-color .13s ease, box-shadow .13s ease, transform .06s ease;
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .btn:hover:not([disabled]) {
  background: var(--wd-inset); color: var(--wd-text);
  border-color: var(--dsw-alias-border-l2); box-shadow: var(--wd-shadow-2);
}
.wd-shell .btn:active:not([disabled]) { transform: translateY(1px); box-shadow: var(--wd-shadow-1); }
.wd-shell .btn:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 2px; }
.wd-shell .btn[disabled] { opacity: .5; cursor: default; box-shadow: none; }
.wd-shell .btn-primary {
  background: linear-gradient(180deg, var(--wd-primary) 0%, var(--wd-primary-deep) 100%);
  border-color: transparent; color: #fff; font-weight: 550;
  box-shadow: 0 1px 2px rgba(40, 100, 232, .3), 0 4px 12px rgba(40, 100, 232, .18);
}
.wd-shell .btn-primary:hover:not([disabled]) {
  background: linear-gradient(180deg, var(--wd-primary) 0%, var(--wd-primary-deep) 100%);
  color: #fff; filter: brightness(1.07);
  box-shadow: 0 2px 4px rgba(40, 100, 232, .32), 0 8px 20px rgba(40, 100, 232, .22);
}
.wd-shell .btn-ghost { border-color: transparent; background: transparent; box-shadow: none; }
.wd-shell .btn-ghost:hover:not([disabled]) { background: var(--wd-inset); box-shadow: none; }
.wd-shell .btn-small { height: 25px; padding: 0 9px; font-size: 11.5px; border-radius: 7px; }
.wd-shell .btn-icon { width: 30px; padding: 0; justify-content: center; }

/* ---------- stat grid ---------- */
.wd-shell .stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: 12px; margin-bottom: 22px;
}
.wd-shell .stat-card {
  position: relative; overflow: hidden;
  padding: 15px 17px 13px;
  border-radius: 11px; border: 1px solid var(--wd-hairline);
  background: var(--wd-surface);
  box-shadow: var(--wd-shadow-1);
  transition: box-shadow .16s ease, transform .16s ease;
}
.wd-shell .stat-card:hover { box-shadow: var(--wd-shadow-2); transform: translateY(-1px); }
.wd-shell .stat-card::before {
  content: ''; position: absolute; inset: 0 auto 0 0; width: 3px;
  background: var(--wd-slate); opacity: .5;
}
.wd-shell .stat-card[data-tone="blue"]::before { background: var(--wd-primary); opacity: .9; }
.wd-shell .stat-card[data-tone="amber"]::before { background: var(--wd-amber); opacity: .9; }
.wd-shell .stat-card[data-tone="red"]::before { background: var(--wd-red); opacity: .9; }
.wd-shell .stat-card[data-tone="green"]::before { background: var(--wd-green); opacity: .9; }
.wd-shell .stat-card::after {
  content: ''; position: absolute; right: -26px; top: -26px;
  width: 74px; height: 74px; border-radius: 50%;
  background: var(--wd-slate-soft); opacity: .5;
}
.wd-shell .stat-card[data-tone="blue"]::after { background: var(--wd-primary-soft); }
.wd-shell .stat-card[data-tone="amber"]::after { background: var(--wd-amber-soft); }
.wd-shell .stat-card[data-tone="red"]::after { background: var(--wd-red-soft); }
.wd-shell .stat-card[data-tone="green"]::after { background: var(--wd-green-soft); }
.wd-shell .stat-label { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-weight: 500; }
.wd-shell .stat-value {
  margin-top: 3px; font-size: 27px; line-height: 33px; font-weight: 650;
  font-variant-numeric: tabular-nums; letter-spacing: -.02em;
  position: relative; z-index: 1;
}
.wd-shell .stat-value[data-tone="amber"] { color: var(--wd-amber); }
.wd-shell .stat-value[data-tone="red"] { color: var(--wd-red); }
.wd-shell .stat-value[data-tone="green"] { color: var(--wd-green); }
.wd-shell .stat-note { margin-top: 2px; font-size: 10.5px; line-height: 15px; color: var(--dsw-alias-label-tertiary); }

/* ---------- panels ---------- */
.wd-shell .workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 336px; gap: 22px; align-items: start; }
@media (max-width: 1120px) { .wd-shell .workspace-grid { grid-template-columns: minmax(0, 1fr); } }
.wd-shell .primary-column, .wd-shell .secondary-column { min-width: 0; display: flex; flex-direction: column; gap: 18px; }
.wd-shell .panel {
  border: 1px solid var(--wd-hairline); border-radius: 11px;
  background: var(--wd-surface); overflow: hidden;
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .panel-header {
  display: flex; align-items: baseline; gap: 9px;
  padding: 13px 18px 11px;
  border-bottom: 1px solid var(--wd-hairline);
  background: linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-inset) 140%);
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
.wd-shell .panel-footer { border-top: 1px solid var(--wd-hairline); background: var(--wd-inset); }

/* ---------- project table ---------- */
.wd-shell .project-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.wd-shell .table-head th {
  padding: 9px 12px; text-align: left; white-space: nowrap;
  font-size: 10.5px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary);
  border-bottom: 1px solid var(--wd-hairline);
  background: var(--wd-inset);
}
.wd-shell .table-head th:first-child { padding-left: 18px; }
.wd-shell .table-head th:last-child { padding-right: 18px; text-align: right; }
.wd-shell .project-row {
  border-bottom: 1px solid var(--wd-hairline);
  cursor: pointer; transition: background .1s ease;
}
.wd-shell .project-row:last-child { border-bottom: 0; }
.wd-shell .project-row:hover { background: var(--wd-inset); }
.wd-shell .project-row:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: -2px; }
.wd-shell .project-row td { padding: 11px 12px; vertical-align: middle; }
.wd-shell .project-row td:first-child { padding-left: 18px; }
.wd-shell .project-row td:last-child { padding-right: 18px; text-align: right; }
.wd-shell .project-name {
  font-size: 13px; line-height: 19px; font-weight: 600;
  display: block; overflow-wrap: anywhere; letter-spacing: -.005em;
}
.wd-shell .project-id {
  font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.wd-shell .project-meta { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
.wd-shell .project-meta.is-muted { color: var(--dsw-alias-label-tertiary); font-style: italic; }
.wd-shell .amount-cell {
  display: block; text-align: right;
  font-variant-numeric: tabular-nums; font-weight: 650; font-size: 12.5px;
}
.wd-shell .project-org {
  display: block; font-size: 12px; line-height: 18px; font-weight: 550;
  overflow-wrap: anywhere;
}
.wd-shell .progress-summary {
  font-size: 11.5px; line-height: 17px;
  color: var(--dsw-alias-label-secondary);
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.wd-shell .stage-cell { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
.wd-shell .row-actions { display: flex; gap: 5px; justify-content: flex-end; }

/* ---------- four-dimension cells ---------- */
.wd-shell .dim-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
.wd-shell .dim-cell {
  display: flex; flex-direction: column; gap: 1px;
  padding: 5px 7px; border-radius: 7px;
  border: 1px solid var(--wd-hairline); background: var(--wd-inset);
  min-width: 0; transition: border-color .12s ease;
}
.wd-shell .dim-cell[data-present="true"] { border-color: transparent; background: var(--wd-green-soft); }
.wd-shell .dim-cell[data-present="false"] { border-color: transparent; background: var(--wd-red-soft); }
.wd-shell .dim-label {
  font-size: 9.5px; line-height: 13px; letter-spacing: .02em;
  color: var(--dsw-alias-label-tertiary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.wd-shell .dim-mark { font-size: 11px; line-height: 16px; font-weight: 650; white-space: nowrap; }
.wd-shell .dim-cell[data-present="true"] .dim-mark { color: var(--wd-green); }
.wd-shell .dim-cell[data-present="false"] .dim-mark { color: var(--wd-red); }

/* ---------- pills and dots ---------- */
.wd-shell .status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  height: 21px; padding: 0 9px; border-radius: 20px;
  font-size: 11px; font-weight: 550; white-space: nowrap;
  background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
}
.wd-shell .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--wd-slate); flex: none; }
.wd-shell .tone-blue { background: var(--wd-primary-soft); color: var(--wd-primary); }
.wd-shell .tone-blue .status-dot { background: var(--wd-primary); }
.wd-shell .tone-green { background: var(--wd-green-soft); color: var(--wd-green); }
.wd-shell .tone-green .status-dot { background: var(--wd-green); }
.wd-shell .tone-amber { background: var(--wd-amber-soft); color: var(--wd-amber); }
.wd-shell .tone-amber .status-dot { background: var(--wd-amber); }
.wd-shell .tone-red { background: var(--wd-red-soft); color: var(--wd-red); }
.wd-shell .tone-red .status-dot { background: var(--wd-red); }
.wd-shell .tone-slate { background: var(--wd-slate-soft); color: var(--wd-slate); }
.wd-shell .gap-cell { display: flex; align-items: baseline; gap: 3px; white-space: nowrap; }
.wd-shell .gap-count { font-variant-numeric: tabular-nums; font-weight: 650; font-size: 13px; }
.wd-shell .gap-count[data-level="high"] { color: var(--wd-red); }
.wd-shell .gap-count[data-level="medium"] { color: var(--wd-amber); }
.wd-shell .gap-count[data-level="none"] { color: var(--wd-green); }

/* ---------- compact stage dots ---------- */
.wd-shell .stage-dots { display: flex; align-items: center; gap: 3px; }
.wd-shell .stage-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--wd-hairline); border: 1px solid var(--wd-hairline);
}
.wd-shell .stage-dot[data-done="true"] { background: var(--wd-green); border-color: var(--wd-green); }
.wd-shell .stage-dot[data-current="true"] {
  background: var(--wd-primary); border-color: var(--wd-primary);
  box-shadow: 0 0 0 2px var(--wd-primary-ring);
}

/* ---------- full stage rail ---------- */
.wd-shell .stage-track { display: flex; align-items: flex-end; padding: 10px 0 4px; }
.wd-shell .stage-step {
  position: relative; flex: 1 1 0;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  min-width: 0;
}
.wd-shell .stage-step + .stage-step::before {
  content: ''; position: absolute; top: 10px; right: 50%; left: -50%;
  height: 2px; background: var(--wd-hairline); z-index: 0;
}
.wd-shell .stage-step[data-reached="true"] + .stage-step::before { background: var(--wd-green); opacity: .55; }
.wd-shell .stage-marker {
  position: relative; z-index: 1;
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid var(--wd-hairline); background: var(--wd-surface);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 650; color: var(--dsw-alias-label-tertiary);
  transition: transform .14s ease;
}
.wd-shell .stage-step[data-done="true"] .stage-marker {
  border-color: var(--wd-green); background: var(--wd-green); color: #fff;
  box-shadow: 0 1px 3px rgba(33, 133, 104, .3);
}
.wd-shell .stage-step[data-current="true"] .stage-marker {
  border-color: var(--wd-primary); background: var(--wd-primary); color: #fff;
  box-shadow: 0 0 0 4px var(--wd-primary-soft), 0 1px 4px rgba(40, 100, 232, .35);
  transform: scale(1.06);
}
.wd-shell .stage-label { font-size: 11.5px; line-height: 16px; font-weight: 650; color: var(--dsw-alias-label-secondary); }
.wd-shell .stage-step[data-current="true"] .stage-label { color: var(--wd-primary); }
.wd-shell .stage-caption { font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); text-align: center; overflow-wrap: anywhere; }
.wd-shell .stage-step[data-current="true"] .stage-caption { color: var(--wd-primary); }

/* ---------- four-dimension summary (detail) ---------- */
.wd-shell .status-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 900px) { .wd-shell .status-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.wd-shell .summary-item {
  padding: 13px 15px; border-radius: 10px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  display: flex; flex-direction: column; gap: 4px; min-width: 0;
  box-shadow: var(--wd-shadow-1);
  transition: box-shadow .15s ease;
}
.wd-shell .summary-item:hover { box-shadow: var(--wd-shadow-2); }
.wd-shell .summary-item[data-present="true"] { border-left: 3px solid var(--wd-green); }
.wd-shell .summary-item[data-present="false"] { border-left: 3px solid var(--wd-red); }
.wd-shell .summary-label { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); font-weight: 500; }
.wd-shell .summary-origin {
  margin-left: 6px; padding: 0 5px; border-radius: 4px;
  font-size: 9.5px; font-weight: 500;
  color: var(--dsw-alias-label-tertiary);
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
}
.wd-shell .summary-value { font-size: 14px; line-height: 20px; font-weight: 650; overflow-wrap: anywhere; }
.wd-shell .summary-item[data-present="true"] .summary-value { color: var(--wd-green); }
.wd-shell .summary-item[data-present="false"] .summary-value { color: var(--wd-red); }
.wd-shell .summary-note { font-size: 11px; line-height: 17px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }

/* ---------- gaps / pending ---------- */
.wd-shell .gap-list { display: flex; flex-direction: column; }
.wd-shell .gap-item {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 10px 15px; border-bottom: 1px solid var(--wd-hairline);
  transition: background .1s ease;
}
.wd-shell .gap-item:last-child { border-bottom: 0; }
.wd-shell .gap-item:hover { background: var(--wd-inset); }
.wd-shell .gap-flag { flex: none; width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; background: var(--wd-slate); }
.wd-shell .gap-level-high .gap-flag { background: var(--wd-red); box-shadow: 0 0 0 3px var(--wd-red-soft); }
.wd-shell .gap-level-medium .gap-flag { background: var(--wd-amber); box-shadow: 0 0 0 3px var(--wd-amber-soft); }
.wd-shell .gap-text { min-width: 0; flex: 1 1 auto; }
.wd-shell .gap-title { font-size: 12.5px; line-height: 18px; font-weight: 600; overflow-wrap: anywhere; }
.wd-shell .gap-copy { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .gap-project { margin-top: 3px; font-size: 10.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.wd-shell .gap-link { border: 0; background: transparent; padding: 0; color: var(--wd-primary); cursor: pointer; font-size: 11px; }
.wd-shell .gap-link:hover { text-decoration: underline; }

/* ---------- empty / failure ---------- */
.wd-shell .empty-state {
  margin: 0 auto; max-width: 440px; padding: 56px 24px;
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 7px;
}
.wd-shell .empty-icon {
  width: 76px; height: 76px; border-radius: 18px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--dsw-alias-label-tertiary); margin-bottom: 10px;
  box-shadow: var(--wd-shadow-2);
}
.wd-shell .empty-title { margin: 0; font-size: 17px; line-height: 24px; font-weight: 650; }
.wd-shell .empty-copy { margin: 0 0 12px; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .empty-meta { margin-top: 16px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
.wd-shell .failure {
  border: 1px solid var(--wd-red-soft); border-radius: 10px;
  background: var(--wd-red-soft); padding: 13px 15px;
  display: flex; align-items: flex-start; gap: 11px;
  border-left: 3px solid var(--wd-red);
}
.wd-shell .failure-text { min-width: 0; flex: 1 1 auto; }
.wd-shell .failure-title { font-size: 13px; line-height: 19px; font-weight: 650; color: var(--wd-red); }
.wd-shell .failure-reason { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .spinner {
  display: inline-block; width: 12px; height: 12px;
  border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%;
  animation: wd-spin .9s linear infinite; opacity: .8;
}
@keyframes wd-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .wd-shell .spinner { animation-duration: 2.4s; }
  .wd-shell .stat-card, .wd-shell .summary-item, .wd-shell .btn, .wd-shell .stage-marker { transition: none; }
}

/* ---------- detail page ---------- */
.wd-shell .project-hero {
  display: flex; flex-direction: column; gap: 12px;
  padding: 22px 32px 18px;
  background: var(--wd-surface);
  border-bottom: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
  position: relative; z-index: 2;
}
.wd-shell .project-hero-top { display: flex; align-items: flex-start; gap: 16px; }
.wd-shell .project-hero-text { min-width: 0; flex: 1 1 auto; }
.wd-shell .project-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 650; letter-spacing: -.01em; overflow-wrap: anywhere; }
.wd-shell .project-identity { margin: 4px 0 0; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.wd-shell .project-hero-actions { flex: none; display: flex; gap: 8px; align-items: center; }
.wd-shell .detail-body {
  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
  padding: 22px 32px 40px;
  display: flex; flex-direction: column; gap: 24px;
}
.wd-shell .detail-section { display: flex; flex-direction: column; gap: 11px; }
.wd-shell .section-heading {
  margin: 0; font-size: 13.5px; line-height: 20px; font-weight: 650;
  display: flex; align-items: center; gap: 9px;
  padding-bottom: 8px; border-bottom: 1px solid var(--wd-hairline);
}
.wd-shell .section-kicker { font-size: 10.5px; font-weight: 500; color: var(--dsw-alias-label-tertiary); }
.wd-shell .detail-list {
  display: flex; flex-direction: column;
  border: 1px solid var(--wd-hairline); border-radius: 10px;
  background: var(--wd-surface); overflow: hidden;
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .detail-row {
  display: grid; grid-template-columns: 176px minmax(0, 1fr); gap: 14px;
  padding: 10px 15px; border-bottom: 1px solid var(--wd-hairline); align-items: start;
}
.wd-shell .detail-row:last-child { border-bottom: 0; }
.wd-shell .detail-label { font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.wd-shell .detail-value { font-size: 12.5px; line-height: 19px; overflow-wrap: anywhere; }
.wd-shell .detail-value.is-empty { color: var(--dsw-alias-label-tertiary); font-style: italic; }
.wd-shell .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.wd-shell .chip {
  padding: 2px 9px; border-radius: 20px; font-size: 11.5px; line-height: 18px;
  background: var(--wd-inset); color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--wd-hairline);
}
.wd-shell .gate-row {
  display: grid; grid-template-columns: 44px 96px minmax(0, 1fr); gap: 11px;
  align-items: center; padding: 10px 15px;
  border-bottom: 1px solid var(--wd-hairline); font-size: 12px;
}
.wd-shell .gate-row:last-child { border-bottom: 0; }
.wd-shell .gate-stage { font-weight: 650; font-variant-numeric: tabular-nums; }
.wd-shell .gate-copy { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }

/* ---------- timeline ---------- */
.wd-shell .timeline { position: relative; display: flex; flex-direction: column; padding-left: 4px; }
.wd-shell .timeline-item { position: relative; display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 12px; padding: 0 0 18px; }
.wd-shell .timeline-item:last-child { padding-bottom: 0; }
.wd-shell .timeline-marker { position: relative; display: flex; align-items: flex-start; justify-content: center; }
.wd-shell .timeline-marker::before {
  content: ''; width: 10px; height: 10px; margin-top: 5px; border-radius: 50%;
  background: var(--wd-primary);
  box-shadow: 0 0 0 3px var(--wd-primary-soft);
}
.wd-shell .timeline-item:not(:last-child) .timeline-marker::after {
  content: ''; position: absolute; top: 19px; bottom: -18px; width: 1px;
  background: var(--wd-hairline);
}
.wd-shell .timeline-content { min-width: 0; }
.wd-shell .timeline-heading { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.wd-shell .timeline-date { font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.wd-shell .timeline-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .timeline-copy { margin-top: 4px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; display: flex; flex-direction: column; gap: 2px; }
.wd-shell .timeline-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.wd-shell .timeline-missing { color: var(--wd-amber); font-style: italic; opacity: .9; }

/* ---------- settings modal ---------- */
.wd-shell .modal-overlay {
  position: fixed; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center; padding: 24px;
  background: rgba(12, 18, 28, .46);
  backdrop-filter: blur(2px);
}
.wd-shell .modal {
  width: min(452px, 100%); max-height: 86vh;
  display: flex; flex-direction: column;
  border-radius: 14px; border: 1px solid var(--dsw-alias-border-l2);
  background: var(--wd-surface);
  box-shadow: var(--wd-shadow-3);
  overflow: hidden;
}
.wd-shell .modal-header { display: flex; align-items: center; gap: 9px; padding: 15px 19px; border-bottom: 1px solid var(--wd-hairline); }
.wd-shell .modal-title { margin: 0; font-size: 14.5px; line-height: 21px; font-weight: 650; }
.wd-shell .modal-content { padding: 15px 19px; display: flex; flex-direction: column; gap: 5px; overflow: auto; }
.wd-shell .modal-footer { display: flex; align-items: center; gap: 8px; padding: 13px 19px; border-top: 1px solid var(--wd-hairline); background: var(--wd-inset); }
.wd-shell .modal-footer .spacer { flex: 1 1 auto; }
.wd-shell .checkbox-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 11px; border-radius: 8px; cursor: pointer;
  border: 1px solid transparent; transition: background .11s ease, border-color .11s ease;
}
.wd-shell .checkbox-row:hover { background: var(--wd-inset); }
.wd-shell .checkbox-row[data-selected="true"] { border-color: var(--wd-hairline); background: var(--wd-inset); }
.wd-shell .checkbox-row input[type="radio"] { accent-color: var(--wd-primary); flex: none; margin: 0; }
.wd-shell .field { display: flex; flex-direction: column; gap: 5px; }
.wd-shell .field-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.wd-shell .input {
  height: 30px; width: 94px; padding: 0 10px; border-radius: 8px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  color: var(--wd-text); font-variant-numeric: tabular-nums;
}
.wd-shell .input:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
.wd-shell .form-error { margin: 2px 0 0; font-size: 11.5px; color: var(--wd-red); }
.wd-shell .inline-field { display: flex; align-items: center; gap: 9px; padding: 4px 11px 4px 35px; }
.wd-shell .helper-box {
  margin-top: 7px; padding: 9px 11px; border-radius: 8px;
  background: var(--wd-inset); border: 1px solid var(--wd-hairline);
  font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-tertiary);
}

/* ---------- export page ---------- */
.wd-shell .export-toolbar { display: flex; gap: 6px; padding: 11px 18px; border-bottom: 1px solid var(--wd-hairline); background: var(--wd-inset); }
.wd-shell .export-list { display: flex; flex-direction: column; max-height: 430px; overflow: auto; }
.wd-shell .export-row {
  display: flex; align-items: center; gap: 11px;
  padding: 10px 18px; border-bottom: 1px solid var(--wd-hairline);
  cursor: pointer; transition: background .1s ease;
}
.wd-shell .export-row:last-child { border-bottom: 0; }
.wd-shell .export-row:hover { background: var(--wd-inset); }
.wd-shell .export-row[data-selected="true"] { background: var(--wd-primary-soft); }
.wd-shell .export-row input[type="checkbox"] { accent-color: var(--wd-primary); flex: none; margin: 0; }
.wd-shell .export-name { flex: 1 1 auto; min-width: 0; font-size: 13px; font-weight: 550; overflow-wrap: anywhere; }
.wd-shell .export-stage { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

/* ---------- risk board ---------- */
.wd-shell .risk-list { display: flex; flex-direction: column; }
.wd-shell .risk-row {
  padding: 12px 18px; border-bottom: 1px solid var(--wd-hairline);
  transition: background .1s ease;
}
.wd-shell .risk-row:last-child { border-bottom: 0; }
.wd-shell .risk-row:hover { background: var(--wd-inset); }
.wd-shell .risk-row[data-level="high"] { border-left: 3px solid var(--wd-red); }
.wd-shell .risk-row[data-level="medium"] { border-left: 3px solid var(--wd-amber); }
.wd-shell .risk-row[data-level="low"] { border-left: 3px solid var(--wd-green); }
.wd-shell .risk-row[data-level="unset"] { border-left: 3px solid var(--wd-hairline); }
.wd-shell .risk-head { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.wd-shell .risk-name { font-size: 13px; line-height: 20px; font-weight: 600; overflow-wrap: anywhere; }
.wd-shell .risk-mitigation { margin-top: 3px; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.wd-shell .risk-foot { display: flex; align-items: center; gap: 11px; margin-top: 4px; flex-wrap: wrap; }
.wd-shell .risk-gap { font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }

/* ---------- global timeline ---------- */
.wd-shell .month-strip { display: flex; gap: 9px; overflow-x: auto; padding-bottom: 14px; margin-bottom: 4px; }
.wd-shell .month-cell {
  flex: none; display: flex; flex-direction: column; gap: 2px;
  padding: 8px 13px; border-radius: 9px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .month-label { font-size: 10.5px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary); }
.wd-shell .month-count { font-size: 15px; line-height: 20px; font-weight: 650; }
.wd-shell .chip-button { border: 0; cursor: pointer; font-family: inherit; }
.wd-shell .chip-button:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }

/* ---------- sidebar glyph ---------- */
.wd-glyph { display: block; }
`

/** The scoped root class. */
export const ROOT_CLASS = 'wd-shell'

/** Inline style for the page root. */
export const ROOT_STYLE: CSSProperties = { height: '100%' }
