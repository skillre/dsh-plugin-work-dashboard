/**
 * Typed Client-side API over the Host's exact Connection route.
 *
 * The browser RPC caller validates the envelope and the correlation id, so this
 * layer only has to unwrap the endpoint's own result: `ok: true` returns the
 * value, `ok: false` throws an {@link ActionError} carrying the Host's stable
 * code and message. No Host object, function or live Session value crosses this
 * boundary — only lossless JSON.
 */
import { ENDPOINT } from '../types.js';
/** Failure raised by the Host; `code` is stable enough to switch on. */
export class ActionError extends Error {
    code;
    details;
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ActionError';
    }
}
/** Unwrap one endpoint result, converting a failure into a thrown error. */
function unwrap(result) {
    if (result === null || typeof result !== 'object' || !('ok' in result)) {
        throw new ActionError('invalid-response', 'The Host returned an invalid work dashboard response.');
    }
    if (!result.ok)
        throw new ActionError(result.error.code, result.error.message, result.error.details);
    return result.value;
}
/** Create the API bound to this plugin's Fiber lifetime. */
export function createApi(connection, lifetime) {
    const call = async (request, signal) => {
        const signalToUse = signal === undefined ? lifetime : AbortSignal.any([lifetime, signal]);
        return unwrap(await connection.rpc.call('/api', ENDPOINT, request, signalToUse));
    };
    return {
        list: (signal) => call({ action: 'list' }, signal),
        refresh: (signal) => call({ action: 'refresh' }, signal),
        detail: (pocId, signal) => call({ action: 'detail', pocId }, signal),
        risks: (signal) => call({ action: 'risks' }, signal),
        timeline: (signal) => call({ action: 'timeline' }, signal),
    };
}
