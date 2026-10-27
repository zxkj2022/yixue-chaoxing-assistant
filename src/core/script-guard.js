'use strict';
const { abortError } = require('./primitives');
const OWNER = 'data-yixue-script-instance';
const CONFLICT = 'yixue-script-concurrent';
const FOREIGN = '#skpannel,#skshadow,#ocs-app,#ocs-root,[data-ocs-app],#chaoxing-helper,#xuexitong-helper';

function hasForeignScript(document, pageWindow, seen = new Set()) {
    if (!document || seen.has(document) || seen.size > 30) return false;
    seen.add(document);
    try { if (Array.isArray(pageWindow?.checkConcurrency) && pageWindow.checkConcurrency.length) return true; } catch {}
    if ([...document.querySelectorAll(FOREIGN)].some(node => !node.closest('#yixue-ui-root'))) return true;
    if ([...document.querySelectorAll('[id$="-helper-root"]')].some(node => !node.closest('#yixue-ui-root') && /学习通|超星|网课|智慧树|知到/.test(node.textContent))) return true;
    for (const frame of document.querySelectorAll('iframe,frame')) {
        try { if (hasForeignScript(frame.contentDocument, frame.contentWindow, seen)) return true; } catch {}
    }
    return false;
}
function createScriptGuard({ document, window, pageWindow = window, onConflict = () => {} }) {
    const root = document.documentElement, controller = new AbortController();
    const instance = window.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    let destroyed = false, observer, timer;
    function stop() { observer?.disconnect(); window.clearInterval(timer); document.removeEventListener(CONFLICT, conflict); }
    function conflict() {
        if (controller.signal.aborted || destroyed) return;
        controller.abort(abortError()); stop(); onConflict();
    }
    function check() {
        if (destroyed || controller.signal.aborted) return false;
        if (hasForeignScript(document, pageWindow) || root.getAttribute(OWNER) !== instance || document.querySelectorAll('#yixue-ui-root').length > 1) conflict();
        return !controller.signal.aborted;
    }
    if (root.hasAttribute(OWNER) || root.dataset.yixueBooted) {
        document.dispatchEvent(new window.Event(CONFLICT));
        conflict();
    } else {
        root.setAttribute(OWNER, instance);
        document.addEventListener(CONFLICT, conflict);
        if (check()) {
            observer = new window.MutationObserver(check);
            observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['id', 'data-ocs-app', OWNER] });
            timer = window.setInterval(check, 1000);
        }
    }
    return {
        signal: controller.signal, check,
        assertAllowed() { if (!check()) throw abortError(); },
        destroy() { if (destroyed) return; destroyed = true; stop(); if (root.getAttribute(OWNER) === instance) root.removeAttribute(OWNER); },
    };
}
module.exports = { createScriptGuard, hasForeignScript };
