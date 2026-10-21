'use strict';
async function claimCourseSurface(windowObject, documentObject) {
    const tag = 'data-yixue-course-owner';
    if (documentObject.documentElement.hasAttribute(tag)) return false;
    const bus = 'yixue-course-ui-owner-v1';
    documentObject.documentElement.setAttribute(tag, 'pending');
    if (windowObject.top === windowObject) {
        documentObject.documentElement.setAttribute(tag, 'top');
        windowObject.addEventListener('message', event => {
            const data = event.data;
            if (data?.channel !== bus || data.type !== 'probe' || typeof data.id !== 'string' || data.id.length > 100) return;
            try { event.source?.postMessage({ channel: bus, type: 'owner', id: data.id }, event.origin === 'null' ? '*' : event.origin); } catch {}
        });
        for (let index = 0; index < windowObject.frames.length; index++) {
            try { windowObject.frames[index].postMessage({ channel: bus, type: 'ready' }, '*'); } catch {}
        }
        return true;
    }
    const nonce = crypto.randomUUID();
    let delegated = false;
    await new Promise(resolve => {
        const timer = setTimeout(resolve, 450);
        windowObject.addEventListener('message', event => {
            if (event.source !== windowObject.top || event.data?.channel !== bus) return;
            if (event.data.type !== 'ready' && !(event.data.type === 'owner' && event.data.id === nonce)) return;
            delegated = true;
            documentObject.documentElement.setAttribute(tag, 'delegated');
            windowObject.dispatchEvent(new Event('yixue-course-ui-suppressed'));
            clearTimeout(timer); resolve();
        });
        try { windowObject.top.postMessage({ channel: bus, type: 'probe', id: nonce }, '*'); } catch { clearTimeout(timer); resolve(); }
    });
    if (!delegated) documentObject.documentElement.setAttribute(tag, 'frame');
    return !delegated;
}
module.exports = { claimCourseSurface };
