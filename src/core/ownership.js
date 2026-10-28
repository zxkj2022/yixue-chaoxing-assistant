'use strict';
function isManagedQuestionFrame(windowObject) {
    try {
        for (let current = windowObject, depth = 0; current && depth < 12; depth++) {
            if (current.name === 'yixue-managed-chapter') return true;
            if (current.parent === current) break;
            current = current.parent;
        }
    } catch { /* Cross-origin ancestors cannot be inspected. */ }
    return false;
}
async function claimCourseSurface(windowObject, documentObject, { signal } = {}) {
    const tag = 'data-yixue-course-owner';
    if (signal?.aborted || documentObject.documentElement.hasAttribute(tag)) return false;
    const bus = 'yixue-course-ui-owner-v1';
    documentObject.documentElement.setAttribute(tag, 'pending');
    let listener;
    const cleanup = () => { windowObject.removeEventListener('message', listener); documentObject.documentElement.removeAttribute(tag); };
    signal?.addEventListener('abort', cleanup, { once: true });
    if (windowObject.top === windowObject) {
        documentObject.documentElement.setAttribute(tag, 'top');
        listener = event => {
            const data = event.data;
            if (data?.channel !== bus || data.type !== 'probe' || typeof data.id !== 'string' || data.id.length > 100) return;
            try { event.source?.postMessage({ channel: bus, type: 'owner', id: data.id }, event.origin === 'null' ? '*' : event.origin); } catch {}
        };
        windowObject.addEventListener('message', listener);
        for (let index = 0; index < windowObject.frames.length; index++) {
            try { windowObject.frames[index].postMessage({ channel: bus, type: 'ready' }, '*'); } catch {}
        }
        return true;
    }
    const nonce = windowObject.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    let delegated = false;
    await new Promise(resolve => {
        const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
        const timer = setTimeout(finish, 450);
        signal?.addEventListener('abort', finish, { once: true });
        listener = event => {
            if (event.source !== windowObject.top || event.data?.channel !== bus) return;
            if (event.data.type !== 'ready' && !(event.data.type === 'owner' && event.data.id === nonce)) return;
            delegated = true;
            documentObject.documentElement.setAttribute(tag, 'delegated');
            windowObject.dispatchEvent(new Event('yixue-course-ui-suppressed'));
            finish();
        };
        windowObject.addEventListener('message', listener);
        try { windowObject.top.postMessage({ channel: bus, type: 'probe', id: nonce }, '*'); } catch { finish(); }
    });
    if (signal?.aborted) return false;
    if (!delegated) documentObject.documentElement.setAttribute(tag, 'frame');
    return !delegated;
}
module.exports = { claimCourseSurface, isManagedQuestionFrame };

