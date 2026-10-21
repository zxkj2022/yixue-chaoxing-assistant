'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCollection } = require('../src/core/collection');
function fixture(overrides = {}) {
    const values = new Map(), calls = [], notices = [];
    let origin = 'https://tk.sanzwk.com', identity = 'tk_real';
    const bank = {
        base: () => origin, getToken: () => identity,
        provisionSubmission: async () => { calls.push('provision'); return { status: 200, body: { token: 'sub_example' } }; },
        submitQuestions: async (token, body, id) => { calls.push({ token, body, id }); return { status: 201 }; },
        ...overrides.bank,
    };
    const service = createCollection({ store: { read: (key, fallback) => values.has(key) ? values.get(key) : fallback, write: (key, value) => values.set(key, value) }, document: {}, hostname: 'mooc1.chaoxing.com', collect: () => [{ title: '题目', options: ['甲', '乙'], type: 'single' }], confirm: () => true, notify: value => notices.push(value), ...overrides, bank });
    return { service, values, calls, notices, setOrigin: value => { origin = value; }, setIdentity: value => { identity = value; } };
}
test('collection remains offline without consent and a cancelled authorization makes no call', async () => {
    const first = fixture(); await first.service.send(); assert.deepEqual(first.calls, []);
    const cancelled = fixture({ confirm: () => false }); await cancelled.service.enable(); assert.deepEqual(cancelled.calls, []);
});
test('authorization provisions a dedicated credential, deduplicates and clears it on disable', async () => {
    const { service, values, calls } = fixture();
    await service.enable(); await service.enable(); await service.send();
    assert.equal(calls.filter(item => item === 'provision').length, 1);
    const uploads = calls.filter(item => typeof item === 'object');
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].token, 'sub_example');
    assert.equal(uploads[0].body.consent, true);
    assert.equal(uploads[0].body.questions[0].answer, undefined);
    assert.match(uploads[0].id, /^page-[a-f0-9]{32}$/);
    assert.ok(values.get('yixueSubmissionSeen'));
    service.disable();
    assert.equal(values.get('yixueSubmissionConsent'), false);
    assert.equal(values.get('yixueSubmissionToken'), '');
    assert.equal(values.get('yixueSubmissionSeen'), '');
});
test('missing identities and invalid provisioning never enable collection', async () => {
    const missing = fixture(); missing.setIdentity(''); await missing.service.enable(); assert.equal(missing.calls.length, 0); assert.equal(missing.notices.length, 1);
    const invalid = fixture({ bank: { provisionSubmission: async () => ({ status: 200, body: { token: 'bad' } }) } });
    await invalid.service.enable(); assert.equal(invalid.service.enabled(), false); assert.equal(invalid.notices.length, 1);
});
for (const change of ['disable', 'origin', 'identity']) {
    test('a delayed provisioning response after ' + change + ' cannot restore consent', async () => {
        let release;
        const current = fixture({ bank: { provisionSubmission: () => new Promise(resolve => { release = resolve; }) } });
        const running = current.service.enable();
        if (change === 'disable') current.service.disable(false);
        if (change === 'origin') current.setOrigin('https://changed.example');
        if (change === 'identity') current.setIdentity('tk_changed');
        release({ status: 200, body: { token: 'sub_delayed' } }); await running;
        assert.equal(current.service.enabled(), false);
        assert.equal(current.calls.length, 0);
    });
}
test('a failed or unauthorized upload never writes a successful page marker', async () => {
    for (const status of [401, 503]) {
        const current = fixture({ bank: { submitQuestions: async () => ({ status }) } });
        await current.service.enable();
        assert.equal(current.values.get('yixueSubmissionSeen') || '', '');
        assert.equal(current.service.enabled(), status !== 401);
    }
});
test('in-flight uploads are coalesced and a late reply after disable is ignored', async () => {
    let release, attempts = 0;
    const current = fixture({ bank: { submitQuestions: () => { attempts++; return new Promise(resolve => { release = resolve; }); } } });
    const enabling = current.service.enable(); await Promise.resolve();
    const second = current.service.send();
    assert.equal(attempts, 1);
    current.service.disable(false); release({ status: 201 }); await Promise.all([enabling, second]);
    assert.equal(current.values.get('yixueSubmissionSeen'), '');
});
