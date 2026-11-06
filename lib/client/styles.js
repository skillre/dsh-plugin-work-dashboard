/**
 * The style assembly point.
 *
 * Each surface ships its CSS beside its component (`css/charts.ts`,
 * `css/overview.ts`, `css/detail.ts`, `css/insights.ts`), and the shell owns the
 * frame (`css/base.ts`). This module concatenates them into the single sheet the
 * page mounts in one `<style>` element, in a fixed cascade order: variables and
 * frame first, then the chart primitives, then the surfaces that build on them.
 *
 * Keeping the fragments in separate files is what let four modules be written in
 * parallel without touching each other's stylesheets. The order below is the
 * contract: a surface may rely on the frame's atoms, and no surface may rely on
 * another surface's rules.
 */
import { BASE_CSS } from './css/base.js';
import { CHARTS_CSS } from './css/charts.js';
import { DETAIL_CSS } from './css/detail.js';
import { INSIGHTS_CSS } from './css/insights.js';
import { OVERVIEW_CSS } from './css/overview.js';
export const CONSOLE_CSS = [BASE_CSS, CHARTS_CSS, OVERVIEW_CSS, DETAIL_CSS, INSIGHTS_CSS].join('\n');
/** The scoped root class, re-exported for tests that assert the scope. */
export const ROOT_CLASS = 'wd-shell';
