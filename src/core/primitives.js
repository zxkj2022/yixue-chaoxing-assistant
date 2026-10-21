'use strict';
const abortError = () => Object.assign(new Error('任务已中止'), { name: 'AbortError' });
function delay(milliseconds, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(abortError());
        let timer;
        const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(abortError()); };
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, Math.max(0, milliseconds));
    });
}
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, symbol => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[symbol]);
function toText(value, documentObject = globalThis.document) {
    if (typeof documentObject?.createElement !== 'function') documentObject = globalThis.document;
    if (!documentObject) return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const fragment = documentObject.createElement('template');
    fragment.innerHTML = String(value ?? '').replace(/<(?:br|\/p|\/div|\/li)\b[^>]*>/gi, ' ');
    fragment.content.querySelectorAll('script,style').forEach(element => element.remove());
    return (fragment.content.textContent || '').replace(/\s+/g, ' ').trim();
}
function parseCookie(name, cookie = globalThis.document?.cookie || '') {
    const entry = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
    if (!entry) return '';
    try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return entry.slice(name.length + 1); }
}
function disposableScope() {
    const cleanups = [];
    return {
        add(cleanup) { cleanups.push(cleanup); return cleanup; },
        listen(target, event, callback, options) { target.addEventListener(event, callback, options); cleanups.push(() => target.removeEventListener(event, callback, options)); },
        dispose() { for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch {} } },
    };
}
module.exports = { delay, escapeText, toText, parseCookie, abortError, disposableScope };
