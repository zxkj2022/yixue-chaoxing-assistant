'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createScreenAwake = require('../src/core/screen-awake');
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(request) {
    const document = new EventTarget(); document.hidden = false;
    const locks = [], states = [];
    let requests = 0;
    const window = { isSecureContext: true, navigator: { wakeLock: { request(type) {
        assert.equal(type, 'screen'); requests++;
        if (request) return request();
        const lock = new EventTarget(); lock.released = false; lock.releases = 0;
        lock.release = async () => { lock.releases++; lock.released = true; lock.dispatchEvent(new Event('release')); };
        locks.push(lock); return Promise.resolve(lock);
    } } } };
    const awake = createScreenAwake({ document, window, onChange: state => states.push(state) });
    const visibility = hidden => { document.hidden = hidden; document.dispatchEvent(new Event('visibilitychange')); };
    return { awake, window, document, locks, states, visibility, requests: () => requests };
}

test('screen lock runs only during an enabled task and is released on stop and destroy', async () => {
    const f = fixture();
    f.awake.update({ enabled: true, running: false });
    assert.equal(f.requests(), 0);
    f.awake.update({ running: true }); await flush();
    assert.equal(f.requests(), 1); assert.equal(f.states.at(-1), 'active');
    f.awake.update({ running: false }); await flush();
    assert.equal(f.locks[0].releases, 1); assert.equal(f.states.at(-1), 'idle');
    f.awake.update({ running: true }); await flush();
    f.awake.destroy(); await flush();
    assert.equal(f.locks[1].releases, 1);
    f.visibility(true); f.visibility(false); await flush();
    assert.equal(f.requests(), 2);
});

test('disabling the preference releases the current lock and enabling it resumes the active task', async () => {
    const f = fixture();
    f.awake.update({ enabled: true, running: true }); await flush();
    f.awake.update({ enabled: false }); await flush();
    assert.equal(f.locks[0].releases, 1);
    f.awake.update({ enabled: true }); await flush();
    assert.equal(f.requests(), 2);
    f.awake.destroy();
});

test('hidden pages wait and reacquire the lock when the running page becomes visible', async () => {
    const f = fixture(); f.visibility(true);
    f.awake.update({ enabled: true, running: true }); await flush();
    assert.equal(f.requests(), 0); assert.equal(f.states.at(-1), 'background');
    f.visibility(false); await flush();
    assert.equal(f.requests(), 1);
    f.visibility(true); await flush();
    assert.equal(f.locks[0].releases, 1); assert.equal(f.states.at(-1), 'background');
    f.visibility(false); await flush(); assert.equal(f.requests(), 2);
    f.awake.destroy();
});

test('a late grant after stop is released and cannot revive the stopped task', async () => {
    let grant;
    const lock = { released: false, releases: 0, async release() { this.released = true; this.releases++; } };
    const f = fixture(() => new Promise(resolve => { grant = resolve; }));
    f.awake.update({ enabled: true, running: true });
    f.awake.update({ running: false }); grant(lock); await flush();
    assert.equal(lock.releases, 1); assert.equal(f.states.includes('active'), false);
    assert.equal(f.states.at(-1), 'idle'); f.awake.destroy();
});

test('returning to the page during an old pending request acquires a fresh lock without duplicates', async () => {
    const grants = [];
    const f = fixture(() => new Promise(resolve => grants.push(resolve)));
    f.awake.update({ enabled: true, running: true });
    f.visibility(true); f.visibility(false);
    const stale = { async release() { this.released = true; } };
    grants[0](stale); await flush();
    assert.equal(stale.released, true); assert.equal(f.requests(), 2);
    const fresh = new EventTarget(); fresh.release = async () => {};
    grants[1](fresh); await flush();
    assert.equal(f.states.at(-1), 'active'); assert.equal(f.requests(), 2);
    f.awake.destroy();
});

test('permission denial is reported once, and visibility can retry without an unhandled rejection', async () => {
    const f = fixture(() => Promise.reject(new Error('NotAllowedError')));
    f.awake.update({ enabled: true, running: true }); await flush();
    assert.equal(f.states.at(-1), 'blocked'); assert.equal(f.requests(), 1);
    f.visibility(true); f.visibility(false); await flush();
    assert.equal(f.requests(), 2); f.awake.destroy();
});

test('a system release is displayed honestly and does not create an automatic retry loop', async () => {
    const f = fixture(); f.awake.update({ enabled: true, running: true }); await flush();
    f.locks[0].released = true; f.locks[0].dispatchEvent(new Event('release')); await flush();
    assert.equal(f.states.at(-1), 'released'); assert.equal(f.requests(), 1);
    f.visibility(true); f.visibility(false); await flush();
    assert.equal(f.requests(), 2); f.awake.destroy();
});

for (const insecure of [true, false]) test(`unsupported or insecure browser stays usable (${insecure})`, () => {
    const document = new EventTarget(); document.hidden = false;
    let requests = 0;
    const window = { isSecureContext: !insecure, navigator: insecure ? { wakeLock: { request() { requests++; } } } : {} };
    const states = [];
    const awake = createScreenAwake({ document, window, onChange: value => states.push(value) });
    awake.update({ enabled: true, running: true });
    assert.equal(states.at(-1), 'unavailable'); assert.equal(requests, 0);
    awake.destroy();
});
