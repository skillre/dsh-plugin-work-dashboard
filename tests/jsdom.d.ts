/**
 * Minimal `jsdom` declarations for the tests.
 *
 * `jsdom` ships no bundled types, and adding `@types/jsdom` would pull a second
 * declaration source for a dependency this repo already uses at runtime. The
 * form tests use exactly four members — the constructor, `window`, `window.document`
 * and localStorage — so declaring only those keeps the surface honest: if a test
 * starts using more of jsdom, it has to extend this file deliberately rather
 * than silently relying on `any`.
 */

declare module 'jsdom' {
  export interface JsdomConstructorOptions {
    runScripts?: 'dangerously' | 'outside-only'
    url?: string
    beforeParse?(window: Window): void
  }

  /** The subset of the DOM `new JSDOM(...)` returns that the tests touch. */
  export class JSDOM {
    constructor(html?: string, options?: JsdomConstructorOptions)
    readonly window: Window & typeof globalThis
  }
}
