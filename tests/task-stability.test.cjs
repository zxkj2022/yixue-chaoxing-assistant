'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runWork } = require('../src/tasks/work');
const { getEventListeners } = require('node:events');
function fixture(stage) {
    const controller = new AbortController(); let started, calls = 0, retained = 0;
    const ready = new Promise(resolve => { started = resolve; });
    const host = { location: { href: 'https://mooc1.chaoxing.com/work/phone/work' } };
    for (const name of ['toadd', 'submitAction', 'noSubmit']) host[name] = () => { calls++; if (name === stage) { started(); return new Promise(() => {}); } };
    const env = { signal: controller.signal, context: { origin: 'https://mooc1.chaoxing.com', courseId: '101', classId: '202' }, chapter: { id: '303' }, name: '章节测试',
        bank: { getToken: () => 'test' }, settings: { get: key => key === 'autoSubmit' ? stage !== 'noSubmit' : 80 }, log() {},
        questions: { openPage: async () => ({ document: {}, window: host, retain() { retained++; } }), run: async () => ({ total: 1, answered: 1, accuracy: 100 }) } };
    return { controller, ready, host, env, run: () => runWork({ jobid: 'work-1', property: {} }, env), calls: () => calls, retained: () => retained };
}
for (const stage of ['toadd', 'submitAction', 'noSubmit']) test('stop settles a quiz even when its platform action never returns: ' + stage, async () => {
    const f = fixture(stage), pending = f.run(); await f.ready;
    f.controller.abort();
    let outcome = false;
    await Promise.race([pending.then(() => { outcome = true; }, error => { outcome = error.name === 'AbortError'; }), new Promise(resolve => setTimeout(resolve, 100))]);
    assert.equal(outcome, true);
    assert.equal(f.calls(), stage === 'submitAction' ? 2 : 1);
});
test('an unresponsive quiz action reaches a deadline without attempting submission again', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const f = fixture('toadd'), pending = f.run(); await f.ready;
    let failure; pending.catch(error => { failure = error; });
    t.mock.timers.tick(11000);
    for (let i = 0; i < 12; i++) await Promise.resolve();
    assert.match(failure?.message || '', /超时|未返回/);
    assert.equal(failure.stopCourse, true);
    assert.equal(f.calls(), 1); assert.equal(f.retained(), 1);
});

test('five hundred quiz cycles release every deadline and abort listener', async t => {
    const timers = new Set(), schedule = globalThis.setTimeout, cancel = globalThis.clearTimeout;
    t.mock.method(globalThis, 'setTimeout', (fn, milliseconds) => {
        const timer = schedule(() => { timers.delete(timer); fn(); }, milliseconds); timers.add(timer); return timer;
    });
    t.mock.method(globalThis, 'clearTimeout', timer => { timers.delete(timer); cancel(timer); });
    const f = fixture('normal');
    for (let i = 0; i < 500; i++) {
        assert.equal(await f.run(), 'pending');
        assert.equal(getEventListeners(f.controller.signal, 'abort').length, 0);
    }
    assert.equal(f.calls(), 1000);
    assert.equal(timers.size, 0);
});

test('filled answers remain available when the page has no supported save API', async () => {
    const f = fixture('normal');
    for (const key of ['toadd', 'submitAction', 'noSubmit']) delete f.host[key];
    assert.equal(await f.run(), 'pending');
    assert.equal(f.retained(), 1); assert.equal(f.calls(), 0);
});

for (const abort of [false, true]) test('partial answers survive an interrupted query: abort=' + abort, async () => {
    const f = fixture('normal');
    f.env.questions.run = async () => { if (abort) f.controller.abort(); return { total: 2, answered: 1, stopped: true }; };
    if (abort) await assert.rejects(f.run(), { name: 'AbortError' });
    else assert.equal(await f.run(), 'pending');
    assert.equal(f.retained(), 1); assert.equal(f.calls(), 0);
});

test('a failed preparation promise cannot be treated as a successful submit prerequisite', async () => {
    const f = fixture('normal'); let submitted = 0;
    f.host.toadd = () => Promise.reject(null);
    f.host.submitAction = () => submitted++;
    await assert.rejects(f.run());
    assert.equal(submitted, 0);
});

test('missing credentials or invalid tasks never open a quiz page', async () => {
    const f = fixture('normal');
    f.env.questions.openPage = () => { throw Error('must not load'); };
    f.env.bank.getToken = () => '';
    assert.equal(await f.run(), 'skipped');
    f.env.bank.getToken = () => 'test';
    await assert.rejects(runWork({ property: {} }, f.env), /试卷 ID/);
    delete f.env.questions.openPage;
    await assert.rejects(f.run(), /加载器/);
});

for (const matched of [0, 1]) test('unfilled matches never trigger submission and remain reviewable: matched=' + matched, async () => {
    const f = fixture('normal');
    f.env.questions.run = async () => ({ total: 1, answered: 0, matched });
    assert.equal(await f.run(), 'skipped'); assert.equal(f.calls(), 0); assert.equal(f.retained(), matched ? 1 : 0);
});

test('a stopped empty query never invokes platform actions', async () => {
    const f = fixture('normal');
    f.env.questions.run = async () => ({ total: 1, answered: 0, stopped: true });
    assert.equal(await f.run(), 'skipped'); assert.equal(f.calls(), 0);
});

test('a completed observed submission releases the retained document and restores fetch', async () => {
    const f = fixture('normal'); let released = 0, submits = 0;
    const original = () => Promise.resolve({ status: 200, clone: () => ({ text: async () => 'ok' }) });
    f.host.fetch = original;
    f.host.toadd = () => f.host.fetch('/work/save');
    f.host.submitAction = () => { submits++; return f.host.fetch('/work/submit'); };
    f.env.questions.openPage = async () => ({ document: {}, window: f.host, retain() {}, release() { released++; } });
    assert.equal(await f.run(), 'pending');
    assert.equal(submits, 1); assert.equal(released, 1); assert.equal(f.host.fetch, original);
});
