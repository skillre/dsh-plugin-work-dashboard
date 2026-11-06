/**
 * Shell styles: the frame, the page chrome, the toolbar, and shared atoms.
 *
 * Design goals, in the order that drove the decisions:
 *
 * 1. **Depth through layering, not decoration.** Three surface levels
 *    (canvas → card → inset) with a single soft shadow ramp. A flat page reads
 *    "unstyled"; three tones read "designed" without adding visual noise.
 * 2. **One accent, used sparingly.** The brand blue marks only the current
 *    selection, the active view and the primary action. Status colour
 *    (green/amber/red) is reserved for judgement — never for chrome.
 * 3. **Density with air.** The ledger is data-heavy, so rows stay compact, but
 *    every section gets a real gap and a real heading hierarchy. Cramped and
 *    airy are both failures; the target is "scannable at 1440".
 * 4. **Theme-native.** The frame uses `--dsw-alias-*` tokens so light and dark
 *    both work. The ledger's own palette (blue/green/amber/red from DESIGN.md)
 *    is literal, with dark-theme variants that stay legible.
 * 5. **Chrome is one column.** Header, search, toolbar, body and footer share
 *    the same 32px gutter and the same stack, so the page reads as one
 *    instrument rather than a table wedged between two bars.
 *
 * This sheet owns ONLY the frame: `.page-*`, `.module-*`, `.toolbar-*`,
 * `.filter-*`, `.view-*`, `.sort-*`, `.search-*`, `.btn`, `.empty-*`,
 * `.failure`, `.modal-*`, and the shared `.chip` / `.status-pill` atoms.
 * Charts, overview, detail and insights each ship their own sheet beside their
 * component, and `styles.ts` concatenates all of them.
 *
 * Everything is scoped under `.wd-shell`, and the sheet lives in a `<style>`
 * element React removes on unmount, so nothing leaks into product DOM.
 */

export const BASE_CSS = `
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
.wd-shell:focus { outline: none; }

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
  padding: 14px 28px 12px;
  background: var(--wd-surface);
  border: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
  position: relative; z-index: 2;
}
.wd-shell .page-header-text { flex: 1 1 auto; min-width: 0; }
.wd-shell .page-eyebrow {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; line-height: 16px; letter-spacing: .06em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary);
  margin: 0 0 3px;
}
.wd-shell .page-title {
  margin: 0; font-size: 19px; line-height: 25px; font-weight: 650;
  letter-spacing: -.01em; display: flex; align-items: center; gap: 10px;
}
.wd-shell .page-subtitle { margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.wd-shell .page-source {
  margin: 4px 0 0; font-size: 10.5px; line-height: 15px;
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
  padding: 16px 28px 36px;
}
.wd-shell .detail-body {
  flex: 1 1 auto; overflow: auto; overscroll-behavior: contain;
  padding: 0;
}
.wd-shell .page-footer {
  flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
  padding: 8px 32px; min-height: 32px;
  border-top: 1px solid var(--wd-hairline);
  background: var(--wd-surface);
  font-size: 11.5px; color: var(--dsw-alias-label-tertiary);
}
.wd-shell .page-footer .spacer { flex: 1 1 auto; }

/* ---------- search (inside the toolbar) ---------- */
.wd-shell .search-box {
  position: relative; display: flex; align-items: center;
  width: min(300px, 100%); flex: 0 1 300px;
  height: 28px; padding: 0 9px 0 27px;
  border: 1px solid var(--wd-hairline); border-radius: 9px;
  background: var(--wd-inset);
  transition: border-color .13s ease, background .13s ease, box-shadow .13s ease;
}
.wd-shell .search-box:focus-within {
  border-color: var(--wd-primary); background: var(--wd-surface);
  box-shadow: 0 0 0 3px var(--wd-primary-soft);
}
.wd-shell .search-glyph {
  position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
  font-size: 14px; line-height: 1; color: var(--dsw-alias-label-tertiary);
  pointer-events: none;
}
.wd-shell .search-input {
  flex: 1 1 auto; min-width: 0; height: 100%;
  border: 0; background: transparent; outline: none;
  font-size: 12.5px;
}
.wd-shell .search-input::placeholder { color: var(--dsw-alias-label-tertiary); }
.wd-shell .search-input::-webkit-search-cancel-button { display: none; }
.wd-shell .search-clear {
  flex: none; width: 18px; height: 18px; border-radius: 50%;
  border: 0; background: var(--wd-slate-soft); color: var(--dsw-alias-label-secondary);
  font-size: 12px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.wd-shell .search-clear:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }
.wd-shell .footer-hint { font-size: 10px; color: var(--dsw-alias-label-tertiary); white-space: nowrap; }

/* ---------- toolbar ---------- */
.wd-shell .toolbar {
  flex: 0 0 auto;
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px 28px 9px;
  background: var(--wd-surface);
  border-bottom: 1px solid var(--wd-hairline);
  box-shadow: var(--wd-shadow-1);
  position: relative; z-index: 1;
}
.wd-shell .toolbar-row { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; min-width: 0; }
/* The filter strip is ONE scrolling line. Wrapping it onto three lines cost the
   project list most of the first screen, which is the opposite of the point. */
.wd-shell .toolbar-row-filters {
  gap: 12px; overflow-x: auto; overscroll-behavior-x: contain;
  padding-bottom: 2px; scrollbar-width: thin;
}
.wd-shell .toolbar-row-filters .toolbar-group { flex: none; }
.wd-shell .toolbar-group { display: flex; align-items: center; gap: 7px; min-width: 0; }
.wd-shell .toolbar-group-label {
  flex: none; font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary); font-weight: 600;
}
.wd-shell .chip-scroll { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; min-width: 0; }
.wd-shell .filter-chip {
  display: inline-flex; align-items: center; gap: 5px;
  height: 24px; padding: 0 9px;
  border: 1px solid var(--wd-hairline); border-radius: 20px;
  background: var(--wd-surface); color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; cursor: pointer; white-space: nowrap;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.wd-shell .filter-chip:hover:not([disabled]) { background: var(--wd-inset); color: var(--wd-text); }
.wd-shell .filter-chip[data-active="true"] {
  background: var(--wd-primary-soft); border-color: var(--wd-primary);
  color: var(--wd-primary); font-weight: 600;
}
.wd-shell .filter-chip[disabled] { opacity: .4; cursor: default; }
.wd-shell .filter-chip-count {
  font-size: 10px; font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary); font-weight: 500;
}
.wd-shell .filter-chip[data-active="true"] .filter-chip-count { color: var(--wd-primary); }
.wd-shell .view-switch {
  display: inline-flex; align-items: center; padding: 2px;
  border: 1px solid var(--wd-hairline); border-radius: 9px;
  background: var(--wd-inset); gap: 2px;
}
.wd-shell .view-switch-btn {
  height: 24px; padding: 0 11px; border: 0; border-radius: 7px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; cursor: pointer; white-space: nowrap;
  transition: background .12s ease, color .12s ease, box-shadow .12s ease;
}
.wd-shell .view-switch-btn:hover:not([data-active="true"]) { color: var(--wd-text); }
.wd-shell .view-switch-btn[data-active="true"] {
  background: var(--wd-surface); color: var(--wd-text); font-weight: 600;
  box-shadow: var(--wd-shadow-1);
}
.wd-shell .sort-switch { display: inline-flex; align-items: center; gap: 4px; }
.wd-shell .sort-select {
  height: 26px; padding: 0 8px; border-radius: 7px;
  border: 1px solid var(--wd-hairline); background: var(--wd-surface);
  color: var(--dsw-alias-label-secondary); font-size: 11.5px; cursor: pointer;
}
.wd-shell .sort-select:focus-visible { outline: 2px solid var(--wd-primary); outline-offset: 1px; }
.wd-shell .toolbar-result { margin-left: auto; font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; }

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
.wd-shell .btn-icon { width: 26px; padding: 0; justify-content: center; font-size: 12px; }

/* ---------- shared atoms ---------- */
.wd-shell .chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 9px; border-radius: 20px; font-size: 11.5px; line-height: 18px;
  background: var(--wd-inset); color: var(--dsw-alias-label-secondary);
  border: 1px solid var(--wd-hairline);
}
.wd-shell .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.wd-shell .chip-button { border: 0; cursor: pointer; font-family: inherit; }
.wd-shell .chip-button:hover { background: var(--wd-primary-soft); color: var(--wd-primary); }
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
.wd-shell .tone-slate .status-dot { background: var(--wd-slate); }
.wd-shell .is-muted { color: var(--dsw-alias-label-tertiary); font-style: italic; }
.wd-shell .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; color: var(--dsw-alias-label-tertiary); }
.wd-shell .prose { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 19px; color: var(--dsw-alias-label-secondary); }

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

/* ---------- sidebar glyph ---------- */
.wd-glyph { display: block; }

@media (prefers-reduced-motion: reduce) {
  .wd-shell .spinner { animation-duration: 2.4s; }
  .wd-shell .btn, .wd-shell .filter-chip, .wd-shell .search-box, .wd-shell .view-switch-btn { transition: none; }
}
`
