'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createBank = require('../src/core/question-bank');
const token = 'ys_' + 'a'.repeat(43), nextToken = 'ys_' + 'b'.repeat(43);
const balance = { points: 100, member: true, member_until: 1900000000, daily_limit: 200, daily_remaining: 90 };
const ai = { enabled: true, allowed: true, ready: true, effective_model: 'glm-5.2', price_points: 5, disabled_reason: 'none' };
const query = { title: '测试问题', options: ['甲', '乙'], type: 'single' };
const answer = { code: 'OK', protocol_version: '1', data: [{ answer: '甲', analysis: '说明', answer_format: 'text' }], cost: 1, bucket: 'points', record_id: 123, source: 'upstream', is_ai: false, saved: true, ai_requested: false, ai_attempted: false, ai_skip_reason: 'not_requested', failure_reason: 'none' };
function fixture(responses = []) {
    let time = 10000;
    const values = new Map([['shenchanranToken', token]]), requests = [];
    const bank = createBank({ getValue: (k, f) => values.has(k) ? values.get(k) : f, setValue: (k, v) => values.set(k, v), now: () => time, request: details => {
        requests.push(details);
        const response = responses.shift();
        if (response?.throw) throw new Error('transport unavailable');
        if (response?.event) queueMicrotask(() => details[response.event]());
        else if (response !== null) queueMicrotask(() => details.onload({ status: response?.status ?? 200, responseText: response?.raw ?? JSON.stringify(response?.body ?? answer), finalUrl: response?.finalUrl ?? details.url, responseHeaders: response?.headers || '' }));
        return { abort() { details.onabort(); } };
    } });
    return { bank, values, requests, responses, advance(ms) { time += ms; } };
}
for (const url of ['http://public.example', 'https://u:p@example.com', 'https://example.com/path', 'https://example.com/?token=secret', 'javascript:alert(1)']) test(`rejects unsafe API root ${url.split('?')[0]}`, () => {
    const f = fixture(); assert.throws(() => f.bank.setBase(url)); assert.equal(f.bank.getToken(), token);
});
test('local development roots are supported and credentials are cleared on origin change', () => {
    const f = fixture();
    f.bank.setBase('http://127.0.0.1:8140'); assert.equal(f.bank.getToken(), '');
    f.bank.setToken(token); assert.equal(f.bank.website(), 'http://127.0.0.1:8140');
    f.values.set('yixueQuestionBankBase', 'bad url'); assert.equal(f.bank.base(), 'https://api.sanzwk.com');
});
test('same-account balance refresh is shared, throttled and free', async () => {
    const f = fixture([{ body: { code: 'OK', cost: 0, data: { ...balance, vip_level: 2, plan_name: 'SVIP' } } }]);
    let updates = 0; const unsubscribe = f.bank.onBalanceChange(() => updates++);
    f.bank.onBalanceChange(() => { throw new Error('observer'); });
    const [one, two] = await Promise.all([f.bank.refreshBalance(), f.bank.refreshBalance()]);
    assert.deepEqual(one, two); assert.equal(one.data.vip_level, 2);
    await f.bank.refreshBalance({ force: true }); assert.equal(f.requests.length, 1);
    assert.match(f.bank.balanceLabel(), /100.*90\/200.*北京时间/);
    assert.ok(updates > 1); unsubscribe();
});
for (const patch of [{}, { vip_level: 0 }, { vip_level: 99 }, { vip_level: '3' }, { member: false, vip_level: 3 }]) test(`optional membership tier is trusted only when valid: ${JSON.stringify(patch)}`, async () => {
    const f = fixture([{ body: { code: 'OK', cost: 0, data: { ...balance, ...patch } } }]);
    assert.equal((await f.bank.refreshBalance()).data.vip_level, undefined);
});
for (const status of [401, 403, 404, 429, 526]) test(`balance failure ${status} leaves a usable retry state`, async () => {
    const f = fixture([{ status }]); const state = await f.bank.refreshBalance();
    assert.ok(state.error); assert.equal(state.loading, false); assert.equal(state.data, null);
    assert.match(f.bank.balanceLabel(), /查询失败/);
    if ([404, 429].includes(status)) { await f.bank.refreshBalance({ force: true }); assert.equal(f.requests.length, 1); }
});
test('malformed balances and stale account replies cannot overwrite the new account', async () => {
    const f = fixture([{ body: { code: 'OK', cost: 0, data: { ...balance, daily_remaining: 900 } } }, null]);
    assert.match((await f.bank.refreshBalance()).error, /格式/);
    f.advance(2000); const pending = f.bank.refreshBalance({ force: true }); const old = f.requests.at(-1);
    f.bank.setToken(nextToken); old.onload({ status: 200, responseText: JSON.stringify({ code: 'OK', cost: 0, data: balance }) });
    await pending; assert.equal(f.bank.balanceState().data, null);
    f.values.set('shenchanranToken', 'invalid'); assert.match((await f.bank.refreshBalance()).error, /Token/);
});
test('AI capability refresh validates its zero-cost protocol and displays the model', async () => {
    const f = fixture([{ body: { code: 'OK', cost: 0, protocol_version: '1', data: { ai } } }]);
    await Promise.all([f.bank.refreshCapabilities(), f.bank.refreshCapabilities()]);
    assert.match(f.bank.capabilitiesLabel(), /glm-5.2.*5 积分/);
    await f.bank.refreshCapabilities({ force: true }); assert.equal(f.requests.length, 1);
});
for (const status of [401, 403, 404, 429, 526]) test(`AI capability failure ${status} is recoverable`, async () => {
    const f = fixture([{ status }]); const state = await f.bank.refreshCapabilities();
    assert.ok(state.error); assert.equal(state.loading, false); assert.match(f.bank.capabilitiesLabel(), /失败|暂未|频繁|无法|未获授权/);
});
test('invalid AI capability combinations do not advertise unavailable service', async () => {
    const f = fixture([{ body: { code: 'OK', cost: 0, protocol_version: '1', data: { ai: { ...ai, ready: false } } } }]);
    assert.equal((await f.bank.refreshCapabilities()).data, null);
    f.values.set('shenchanranToken', ''); await f.bank.refreshCapabilities(); assert.match(f.bank.capabilitiesLabel(), /连接/);
});
test('search success normalizes answer, usage, metadata and safe request IDs', async () => {
    const f = fixture([{ body: answer, headers: 'X-Request-ID: support-123' }]);
    const result = await f.bank.search(query);
    assert.equal(result.code, 1); assert.equal(result.data, '甲'); assert.equal(result.metadata.request_id, 'support-123');
    assert.equal(result.metadata.record_id, 123); assert.equal(result.analysis, '说明'); assert.match(f.bank.usageLabel(), /1\s*积分/);
    assert.equal(Object.keys(f.values.get('yixuePendingSearches')).length, 0);
    assert.equal(f.requests[0].redirect, 'error'); assert.equal(f.requests[0].anonymous, true);
});
test('ys_ credentials echoed as diagnostic IDs are suppressed', async () => {
    const f = fixture([{ body: { ...answer, idempotency_key: token }, headers: 'X-Request-ID: ' + token }]);
    const result = await f.bank.search(query);
    assert.notEqual(result.metadata.request_id, token); assert.equal(result.metadata.idempotency_key, undefined);
});
for (const status of [401, 402, 403, 429]) test(`search ${status} stops repeated requests until resumed`, async () => {
    const f = fixture([{ status }]); const result = await f.bank.search(query);
    assert.equal(result.fatal, true); assert.equal(await f.bank.search(query), result); assert.equal(f.requests.length, 1);
    f.bank.resume(); assert.equal((await f.bank.search(query)).code, 1);
});
for (const code of ['NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED']) test(`search business outcome ${code} preserves billing semantics`, async () => {
    const f = fixture([{ body: { code, cost: 0, ai_attempted: true, failure_reason: 'no_authorized_source' } }]);
    const result = await f.bank.search({ ...query, use_ai: true });
    assert.equal(result.code, 0); assert.equal(result.fatal, false);
    assert.equal(Object.keys(f.values.get('yixuePendingSearches')).length, 0);
});
for (const response of [{ status: 409 }, { status: 526 }, { raw: '{broken' }, { finalUrl: 'https://untrusted.example/' }, { event: 'onerror' }, { event: 'ontimeout' }, { event: 'onabort' }, { throw: true }]) test(`uncertain transport result retains the request key: ${JSON.stringify(response)}`, async () => {
    const f = fixture([response, {}]);
    assert.equal((await f.bank.search(query)).code, 0);
    assert.equal((await f.bank.search(query)).code, 1);
    const searches = f.requests.filter(request => request.method === 'POST');
    assert.equal(searches[0].headers['Idempotency-Key'], searches[1].headers['Idempotency-Key']);
});
test('validation errors, protocol mismatches and account replacement cannot deliver stale answers', async () => {
    const f = fixture([{ status: 422 }, { body: { ...answer, protocol_version: '2' } }, null]);
    assert.match((await f.bank.search(query)).msg, /校验/);
    assert.equal((await f.bank.search(query)).reason, 'protocol-mismatch');
    f.bank.resume(); const pending = f.bank.search(query); const old = f.requests.at(-1);
    f.bank.setToken(nextToken); old.onload({ status: 200, responseText: JSON.stringify(answer) });
    assert.equal((await pending).fatal, true);
});
test('empty questions, malformed answers, oversize queues and disconnected accounts fail clearly', async () => {
    const f = fixture([{ body: { code: 'OK', data: [] } }, { body: { code: 'NEW_STATUS' } }]);
    assert.equal((await f.bank.search({ ...query, title: '' })).code, 0);
    assert.match((await f.bank.search(query)).msg, /缺少答案/);
    assert.equal((await f.bank.search(query)).reason, 'unknown-response');
    f.values.set('yixuePendingSearches', Object.fromEntries(Array.from({ length: 100 }, (_, i) => [i, 'existing'])));
    assert.equal((await f.bank.search({ ...query, title: 'another' })).fatal, true);
    f.values.set('shenchanranToken', ''); assert.equal((await f.bank.search(query)).fatal, true);
});
test('health and answer contribution endpoints use the new API origin', async () => {
    const f = fixture([{ body: { status: 'ok' } }, { body: { token: 'sub_' + 'x'.repeat(40) } }, { body: { ok: true } }]);
    assert.equal(await f.bank.health(), true);
    await f.bank.provisionSubmission(); await f.bank.submitQuestions('sub_' + 'x'.repeat(40), { items: [] }, 'submission-123456789');
    assert.ok(f.requests.every(r => r.url.startsWith('https://api.sanzwk.com/')));
    assert.equal(f.bank.website(), 'https://tk.sanzwk.com');
});
test('the API hostname migration reuses an unresolved request key from the old official host', async () => {
    const f = fixture([{ status: 409 }]);
    const revision = 'existing-revision';
    f.values.set('yixueTokenRevision', revision);
    const oldIdentity = JSON.stringify(['https://tk.sanzwk.com', revision, { ...query, use_ai: false }]);
    f.values.set('yixuePendingSearches', { [oldIdentity]: 'previous-query-123456789' });
    await f.bank.search(query);
    assert.equal(f.requests[0].headers['Idempotency-Key'], 'previous-query-123456789');
    assert.equal(Object.keys(f.values.get('yixuePendingSearches')).length, 1);
});

for (const [options, delivered, expectedIndex] of [[['对', '错'], '对', 0], [['对', '错'], '错', 1], [['错误', '正确'], '正确', 1]]) {
    test('current question-bank judgment delivery matches the current option body: ' + options.join('/') + ' => ' + delivered, async () => {
        const f = fixture([{ body: { ...answer, data: [{ answer: delivered, answer_format: 'text' }] } }]);
        const question = { title: '判断题交付兼容', options, type: 'judge' };
        const result = await f.bank.search(question);
        assert.equal(result.code, 1);
        assert.equal(result.data, delivered);
        const matched = require('../src/questions/matcher').matchAnswer(question, result.data, { answerFormat: result.answerFormat });
        assert.deepEqual(matched.indices, [expectedIndex]);
        assert.equal(f.requests.length, 1);
        assert.deepEqual(JSON.parse(f.requests[0].data).options, options);
    });
}
