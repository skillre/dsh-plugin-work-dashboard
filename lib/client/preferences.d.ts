/**
 * Browser-local refresh cadence.
 *
 * The cadence is a user preference, not plugin configuration, so it lives in
 * `localStorage` under the keys the specification names and never reaches the
 * Host. This module owns the read/write/parse rules so the settings dialog and
 * the timer effect share one interpretation, and so the whole policy is
 * testable without a DOM.
 *
 * Failure policy: storage is optional. A browser with storage disabled (or a
 * quota error) must still render the console, so every write is best-effort and
 * every read falls back to the documented default: manual refresh only.
 */
import { type RefreshInterval } from '../types.js';
/** One resolved cadence: what the timer effect needs, nothing more. */
export interface RefreshPreference {
    interval: RefreshInterval;
    /** Only meaningful when `interval === 'custom'`. */
    customMinutes: number;
}
/** The documented default: no automatic refresh at all. */
export declare const DEFAULT_PREFERENCE: RefreshPreference;
/** The storage face this module needs; `undefined` when unavailable. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'> | undefined;
/** Resolve the browser storage without throwing when it is blocked. */
export declare function browserStorage(): StorageLike;
/** Clamp a custom cadence into the supported range, rounding to a whole minute. */
export declare function clampMinutes(value: number): number;
/** Accept only a declared interval id; anything else is the default. */
export declare function parseInterval(raw: string | null | undefined): RefreshInterval;
/** Read the stored preference, falling back to manual-only on anything odd. */
export declare function readPreference(storage?: StorageLike): RefreshPreference;
/** Persist the preference; a blocked or full storage degrades silently. */
export declare function writePreference(preference: RefreshPreference, storage?: StorageLike): void;
/**
 * The timer period in milliseconds, or `null` when refresh is manual only.
 *
 * This is the single place the four cadences turn into a number, so the effect
 * and the settings dialog can never disagree about "every 10 minutes".
 */
export declare function intervalMs(preference: RefreshPreference): number | null;
