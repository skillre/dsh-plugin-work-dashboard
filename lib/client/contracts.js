/**
 * Structural mirrors of the DSH Client contracts this bundle consumes.
 *
 * Queried from the live 0.2.1-rc.5 runtime on 2026-11-05:
 * - `ctx.slots` (provided by `@deepseek-ai/dsh-client-ui-renderer`'s SlotRegistry):
 *   `inject(key, callback)` waits for a slot declaration, `register(options,
 *   component)` registers one entry through the caller's Fiber.
 * - `sidebar.panellist` is a `list` slot whose entries take `{ size, active }`
 *   and whose `id` addresses the matching `main` panel; `main` is a `keyed`
 *   slot selected by `ctx.layout.selectPanel(key)`.
 * - `ctx.locale` (`@deepseek-ai/dsh-client-locale`): `register(ns, { zh, en })`,
 *   `bind(ns)`, `getSnapshot()` / `subscribe()` for reactive translation.
 * - `ctx.connection` (`@deepseek-ai/dsh-client-connection`):
 *   `rpc.call(channel, endpoint, payload, signal)` resolving
 *   `{ ok: true, value } | { ok: false, error }`.
 *
 * Mirrored rather than imported so this package does not pull the whole client
 * package graph into its own build. Re-query the live contracts before widening
 * this surface, and treat a mismatch as a compatibility finding.
 */
export {};
