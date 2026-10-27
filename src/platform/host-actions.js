'use strict';

// Observe only the quiz frame's own save/submit requests. A 2xx response means
// that the request finished, not that the platform marked the task complete.
function observeHostActions(host, { signal, timeoutMs = 10000, settleMs = 100 } = {}) {
    let resolveResult, timer, settleTimer, finished = false, observed = 0, pending = 0, failed = false, available = false;
    let armed = false, stageObserved = 0;
    const cleanups = [];
    const result = new Promise(resolve => { resolveResult = resolve; });
    const finish = reason => {
        if (finished) return;
        finished = true; clearTimeout(timer); clearTimeout(settleTimer);
        signal?.removeEventListener('abort', cancel);
        for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch (_) {} }
        resolveResult({ observed: observed > 0, completed: reason === 'settled' && !failed && pending === 0, reason });
    };
    const cancel = () => finish('aborted');
    const settle = () => {
        if (!finished && armed && stageObserved > 0 && !pending) settleTimer = setTimeout(() => finish('settled'), settleMs);
    };
    const relevant = (url, method) => {
        try {
            const base = new URL(host.location.href), target = new URL(String(url), base);
            return target.origin === base.origin && /\/work\//i.test(target.pathname)
                && /(?:save|submit|addStudentWork|addWork|commit)/i.test(target.pathname.split('/').at(-1))
                && /^(?:GET|POST|PUT|PATCH)$/i.test(String(method || 'GET'));
        } catch (_) { return false; }
    };
    const begin = (url, method) => {
        if (finished || !relevant(url, method)) return null;
        observed++; stageObserved++; pending++; clearTimeout(settleTimer);
        let ended = false;
        return successful => {
            if (ended || finished) return;
            ended = true; pending--; failed ||= !successful;
            settle();
        };
    };
    try {
        if (typeof host?.fetch === 'function') {
            const original = host.fetch;
            const wrapped = function (input, options) {
                const end = begin(input?.url || input, options?.method || input?.method);
                let request;
                try { request = original.apply(this, arguments); }
                catch (error) { end?.(false); throw error; }
                // Attach directly to the frame's promise. Promise.resolve across
                // realms can attach after the host has already consumed its body.
                if (end) request.then(response => {
                    const successful = response.status >= 200 && response.status < 300;
                    // Fetch resolves at headers; keep the document alive until its
                    // response body is complete, without consuming the host's body.
                    try { return Promise.resolve(response.clone().text()).then(() => end(successful), () => end(false)); }
                    catch (_) { end(false); }
                }, () => end(false)).catch(() => end(false));
                return request;
            };
            host.fetch = wrapped;
            available = host.fetch === wrapped;
            cleanups.push(() => { if (host.fetch === wrapped) host.fetch = original; });
        }
    } catch (_) { /* The host may expose a read-only fetch; try XHR as well. */ }
    try {
        const prototype = host?.XMLHttpRequest?.prototype;
        if (typeof prototype?.open === 'function' && typeof prototype?.send === 'function') {
            const open = prototype.open, send = prototype.send, details = new WeakMap();
            const wrappedOpen = function (method, url) {
                details.set(this, { method, url });
                return open.apply(this, arguments);
            };
            const wrappedSend = function () {
                const request = details.get(this), end = request && begin(request.url, request.method);
                if (!end) return send.apply(this, arguments);
                const settled = () => end(this.status >= 200 && this.status < 300);
                this.addEventListener('loadend', settled, { once: true });
                cleanups.push(() => this.removeEventListener('loadend', settled));
                try { return send.apply(this, arguments); }
                catch (error) { end(false); throw error; }
            };
            prototype.open = wrappedOpen;
            cleanups.push(() => { if (prototype.open === wrappedOpen) prototype.open = open; });
            prototype.send = wrappedSend;
            cleanups.push(() => { if (prototype.send === wrappedSend) prototype.send = send; });
            available ||= prototype.open === wrappedOpen && prototype.send === wrappedSend;
        }
    } catch (_) { /* Retention still protects the document when observation is unavailable. */ }
    if (!available) finish('unavailable');
    else if (signal?.aborted) finish('aborted');
    else {
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => finish('timeout'), timeoutMs);
    }
    return {
        available, result,
        // A preparation request cannot stand in for the final submit action.
        beginAction() { armed = false; stageObserved = 0; clearTimeout(settleTimer); },
        actionsInvoked() { armed = true; settle(); },
        dispose: () => finish('disposed'),
    };
}

module.exports = { observeHostActions };
