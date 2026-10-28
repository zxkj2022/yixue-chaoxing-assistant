'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getEventListeners } = require('node:events');
const { claimCourseSurface, isManagedQuestionFrame } = require('../src/core/ownership');
function fixture(top = true) {
    const window = new EventTarget(), attributes = new Map(), controller = new AbortController(), sent = [];
    const document = { documentElement: { hasAttribute: key => attributes.has(key), setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) } };
    window.crypto = {}; window.frames = [{ postMessage: data => sent.push(data) }];
    window.top = top ? window : { postMessage: data => sent.push(data) }; window.parent = window.top;
    const message = data => window.dispatchEvent(Object.assign(new Event('message'), data));
    return { window, document, attributes, controller, sent, message, claim: () => claimCourseSurface(window, document, { signal: controller.signal }) };
}
test('a top-level owner answers child probes and releases its marker and listener', async () => {
    const f = fixture(); assert.equal(await f.claim(), true);
    assert.equal(await f.claim(), false); assert.equal(f.sent[0].type, 'ready');
    f.message({ data: { channel: 'other' } });
    f.message({ data: { channel: 'yixue-course-ui-owner-v1', type: 'probe', id: 'a'.repeat(101) } });
    const replies = [];
    f.message({ data: { channel: 'yixue-course-ui-owner-v1', type: 'probe', id: 'frame' }, source: { postMessage: (data, origin) => replies.push({ data, origin }) }, origin: 'null' });
    assert.equal(replies[0].data.id, 'frame'); assert.equal(replies[0].origin, '*');
    f.controller.abort(); assert.equal(f.attributes.size, 0); assert.equal(getEventListeners(f.window, 'message').length, 0);
});
test('a frame falls back after the probe deadline, handles late ownership and cleans up', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const f = fixture(false); let suppressed = 0; f.window.addEventListener('yixue-course-ui-suppressed', () => suppressed++);
    const pending = f.claim(); t.mock.timers.tick(451); assert.equal(await pending, true);
    assert.equal(f.attributes.get('data-yixue-course-owner'), 'frame');
    f.message({ source: {}, data: { channel: 'yixue-course-ui-owner-v1', type: 'ready' } });
    assert.equal(suppressed, 0);
    f.message({ source: f.window.top, data: { channel: 'yixue-course-ui-owner-v1', type: 'owner', id: f.sent[0].id } });
    assert.equal(suppressed, 1); assert.equal(f.attributes.get('data-yixue-course-owner'), 'delegated');
    f.controller.abort(); assert.equal(getEventListeners(f.window, 'message').length, 0);
});
test('aborting a pending or future frame claim releases all listeners', async () => {
    const f = fixture(false), pending = f.claim(); f.controller.abort();
    assert.equal(await pending, false); assert.equal(await f.claim(), false);
    assert.equal(f.attributes.size, 0); assert.equal(getEventListeners(f.window, 'message').length, 0);
    assert.equal(getEventListeners(f.controller.signal, 'abort').length, 0);
});
test('managed question frames are recognized through ancestors and cross-origin checks stay safe', () => {
    const owner = { name: 'yixue-managed-chapter' }; owner.parent = owner;
    assert.equal(isManagedQuestionFrame({ name: '', parent: owner }), true);
    const ordinary = { name: '' }; ordinary.parent = ordinary;
    assert.equal(isManagedQuestionFrame(ordinary), false);
    assert.equal(isManagedQuestionFrame({ get name() { throw Error('cross origin'); } }), false);
});
