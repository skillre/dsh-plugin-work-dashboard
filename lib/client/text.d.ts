/**
 * Client dictionaries.
 *
 * Two locales ship with the bundle: Simplified Chinese (the authoring language
 * and the language the ledger itself is written in) and English. Keys are flat
 * and dot-namespaced, resolved through the shared `locale` service, so switching
 * the GUI language re-renders the console without a reload.
 *
 * Rule and dimension copy is keyed by the stable ids the Host sends
 * (`gap.G0-why-customer.title`, `dim.evidence`) rather than by prose, so a new
 * rule id only needs a dictionary entry on both halves of the same bundle.
 */
/** The namespace registered with the Client locale service. */
export declare const NAMESPACE = "skillreWorkDashboard";
/** Chinese dictionary; the key set is the source of truth. */
export declare const zh: Record<string, string>;
/** English dictionary; every key mirrors {@link zh}. */
export declare const en: Record<string, string>;
/** Read one key from a dictionary, falling back to the key itself. */
export declare function textOf(dict: Record<string, string>, key: string): string;
/** Pick the dictionary for a locale id, falling back to English. */
export declare function dictFor(locale: string): Record<string, string>;
/** The translate function the locale service binds for one namespace. */
export type Translate = (key: string, params?: Record<string, string | number>) => string;
/**
 * Fill `{name}` placeholders from a parameter bag.
 *
 * The Client-side locale service interpolates the same way, but this helper is
 * also used for dictionary lookups that bypass the service (the initial paint
 * before the service's snapshot is available), and for the tests.
 */
export declare function format(template: string, params?: Record<string, string | number>): string;
