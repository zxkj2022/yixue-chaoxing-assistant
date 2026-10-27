'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createScriptGuard, hasForeignScript } = require('../src/core/script-guard');
function fixture({ secure = true } = {}) {
    const document = new EventTarget(), attributes = new Map(), timers = new Map();
    let observe, disconnected = 0, conflicts = 0;
    document.documentElement = { dataset: {}, hasAttribute: key => attributes.has(key), setAttribute: (key, value) => attributes.set(key, value), getAttribute: key => attributes.get(key) ?? null, removeAttribute: key => attributes.delete(key) };
    document.foreign = []; document.helpers = []; document.frames = []; document.own = [];
    document.querySelectorAll = selector => selector === 'iframe,frame' ? document.frames : selector === '#yixue-ui-root' ? document.own : selector === '[id$="-helper-root"]' ? document.helpers : document.foreign;
    const window = { Event, crypto: secure ? { randomUUID } : {},
        MutationObserver: class { constructor(callback) { observe = callback; } observe() {} disconnect() { disconnected++; } },
        setInterval: callback => { timers.set(1, callback); return 1; }, clearInterval: key => timers.delete(key),
    };
    return { document, window, timers, attributes, guard: () => createScriptGuard({ document, window, onConflict: () => { conflicts++; } }),
        mutate: () => observe(), conflicts: () => conflicts, disconnected: () => disconnected };
}

test('a standalone script can run on secure and HTTP pages and releases its observers', () => {
    for (const secure of [true, false]) {
        const f = fixture({ secure }), guard = f.guard();
        assert.equal(guard.check(), true); guard.assertAllowed();
        assert.equal(f.timers.size, 1);
        f.document.foreign.push({ closest: () => ({ id: 'yixue-ui-root' }) }); f.mutate();
        f.document.helpers.push({ closest: () => null, textContent: '网页翻译工具' }); f.mutate();
        assert.equal(guard.check(), true);
        guard.destroy(); guard.destroy();
        assert.equal(f.timers.size, 0); assert.equal(f.attributes.size, 0);
        assert.equal(guard.check(), false);
    }
});

for (const kind of ['dom', 'helper', 'global', 'owner', 'own-ui', 'event']) test('a detected conflict is sticky and calls its stop handler once: ' + kind, () => {
    const f = fixture(), guard = f.guard();
    if (kind === 'dom') f.document.foreign.push({ closest: () => null });
    if (kind === 'helper') f.document.helpers.push({ closest: () => null, textContent: '超星学习通网课助手' });
    if (kind === 'global') f.window.checkConcurrency = [6];
    if (kind === 'owner') f.attributes.set('data-yixue-script-instance', 'another-instance');
    if (kind === 'own-ui') f.document.own.push({}, {});
    if (kind === 'event') f.document.dispatchEvent(new Event('yixue-script-concurrent'));
    f.mutate(); f.mutate();
    assert.equal(guard.signal.aborted, true); assert.equal(f.conflicts(), 1);
    assert.equal(f.timers.size, 0); assert.ok(f.disconnected() >= 1);
    assert.throws(() => guard.assertAllowed(), { name: 'AbortError' });
    guard.destroy();
});

test('two installations stop each other and an older installation blocks a new one', () => {
    const f = fixture(), first = f.guard(), second = f.guard();
    assert.equal(first.signal.aborted, true); assert.equal(second.signal.aborted, true);
    assert.equal(f.conflicts(), 2); first.destroy(); second.destroy();
    const old = fixture(); old.document.documentElement.dataset.yixueBooted = '1';
    const blocked = old.guard(); assert.equal(blocked.signal.aborted, true); blocked.destroy();
});

test('frame scanning tolerates inaccessible windows, cycles and missing documents', () => {
    const f = fixture(), child = fixture();
    assert.equal(hasForeignScript(null, null), false);
    f.document.frames.push({ get contentDocument() { throw Error('cross origin'); } }, { contentDocument: f.document }, { contentDocument: child.document, contentWindow: child.window });
    Object.defineProperty(f.window, 'checkConcurrency', { get() { throw Error('sandbox'); } });
    assert.equal(hasForeignScript(f.document, f.window), false);
    child.window.checkConcurrency = [6];
    assert.equal(hasForeignScript(f.document, f.window), true);
});
