/**
 * Wire vocabulary shared by the Host and Client halves of the POC console.
 *
 * Everything here is plain, lossless JSON: the Host owns the repository cache
 * and the YAML parse, the Client owns only view state, and only these shapes
 * cross the Connection RPC boundary. Both halves compile from this file, so the
 * Client bundle carries the same literals without importing Host code.
 *
 * Localized copy is deliberately NOT here: the Host sends stable rule ids and
 * field names, and the Client maps them onto dictionary keys. One dictionary
 * therefore covers both halves, and a new rule never needs a Host release note.
 */
/** RPC endpoint path under the shared `/api` channel. */
export const ENDPOINT = 'skillre-work-dashboard/execute';
/** Sidebar panel id, main panel key, and locale namespace. */
export const PANEL_ID = 'skillre-work-dashboard';
export const LOCALE_NAMESPACE = 'skillreWorkDashboard';
/**
 * Browser-local refresh settings. They are a user preference, not plugin
 * configuration, so they live in `localStorage` and never reach the Host.
 */
export const REFRESH_INTERVAL_KEY = 'work-dashboard.refreshInterval';
export const CUSTOM_MINUTES_KEY = 'work-dashboard.customMinutes';
/** The refresh cadences the settings dialog offers. */
export const REFRESH_INTERVALS = Object.freeze(['off', '10m', '1h', 'custom']);
/** Default custom cadence, in minutes, when the user picks `custom` first. */
export const DEFAULT_CUSTOM_MINUTES = 30;
/** Bounds of the custom cadence, in minutes. */
export const CUSTOM_MINUTES_MIN = 1;
export const CUSTOM_MINUTES_MAX = 1440;
/** The four stages of a POC plus the closed state. */
export const STAGES = Object.freeze(['G0', 'G1', 'G2', 'G3', 'G4']);
/** The four dimensions that must be tracked separately, never merged. */
export const DIMENSIONS = Object.freeze(['achievement', 'evidence', 'recognition', 'nextMilestone']);
/** Every gap rule id this plugin knows. */
export const GAP_RULES = Object.freeze([
    'G0-why-customer',
    'G0-why-we',
    'G0-tech-owner',
    'G1-focus-overflow',
    'G2-prereq-invested',
    'G3-result-no-evidence',
    'G3-evidence-no-recognition',
    'action-overdue',
    'G4-no-next-milestone',
    'closed-not-closed-loop',
]);
