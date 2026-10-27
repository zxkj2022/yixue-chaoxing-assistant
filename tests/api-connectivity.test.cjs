'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createBank = require('../src/core/question-bank');
const primary = 'https://api.sanzwk.com', compatible = 'https://tk.sanzwk.com';
const token = 'ys_' + 'a'.repeat(43);
const data = { points: 100, member: true, member_until: 1900000000, daily_limit: 200, daily_remaining: 90, vip_level: 3, plan_name: 'VVIP' };
function fixture(handler, base = primary) {
    let time = 10000;
    const values = new Map([['shenchanranToken', token], ['yixueQuestionBankBase', base], ['yixueApiTokenOrigin', base]]), requests = [];
    const bank = createBank({ now: () => time, getValue: (k, f) => values.has(k) ? values.get(k) : f, setValue: (k, v) => values.set(k, v), request: details => {
        requests.push(details); const result = handler(details, requests);
        if (result !== null) queueMicrotask(() => {
            if (result.event) details[result.event](result.error || {});
            else details.onload({ status: result.status ?? 200, responseText: result.raw ?? JSON.stringify(result.body ?? {}), finalUrl: result.finalUrl || details.url });
        });
        return { abort() { details.onabort(); } };
    } });
    return { bank, values, requests, advance(ms) { time += ms; } };
}
test('526 is reported as an origin certificate error rather than a missing membership field', async () => {
    const f = fixture(() => ({ status: 526 }));
    const result = await f.bank.refreshBalance();
    assert.match(result.error, /526.*证书|证书.*526/);
    assert.equal(result.data, null);
});
test('certificate failure probes the official compatibility host without credentials before retrying balance', async () => {
    const f = fixture(details => {
        const url = new URL(details.url);
        if (url.origin === primary) return { status: 526 };
        if (url.pathname === '/api/health') { assert.equal(details.headers.Authorization, undefined); return { body: { status: 'ok', mode: 'production' } }; }
        return { body: { code: 'OK', cost: 0, data } };
    });
    const result = await f.bank.refreshBalance();
    assert.equal(result.data.vip_level, 3);
    assert.deepEqual(f.requests.map(r => r.url), [primary + '/api/v1/balance', compatible + '/api/health', compatible + '/api/v1/balance']);
    assert.equal(f.requests.at(-1).headers.Authorization, 'Bearer ' + token);
    assert.equal(f.bank.base(), primary);
    assert.equal(f.bank.routeState().compatibility, true);
});
test('the compatibility route expires and returns to the primary service when it recovers', async () => {
    let healthy = false;
    const f = fixture(details => {
        if (details.url === compatible + '/api/health') return { body: { status: 'ok' } };
        if (details.url.startsWith(primary) && !healthy) return { status: 525 };
        return { body: { code: 'OK', cost: 0, data } };
    });
    await f.bank.refreshBalance(); f.advance(2000);
    await f.bank.refreshBalance({ force: true }); assert.ok(f.requests.at(-1).url.startsWith(compatible));
    healthy = true; f.advance(61000);
    await f.bank.refreshBalance({ force: true }); assert.ok(f.requests.at(-1).url.startsWith(primary));
    assert.equal(f.bank.routeState().compatibility, false);
});
for (const status of [401, 402, 403, 404, 429, 500, 503]) test(`HTTP ${status} cannot trigger a host switch`, async () => {
    const f = fixture(() => ({ status })); await f.bank.refreshBalance();
    assert.equal(f.requests.length, 1); assert.equal(f.bank.routeState().compatibility, false);
});
test('a failed compatibility probe sends no account token to that host', async () => {
    const f = fixture(details => details.url.startsWith(primary) ? { status: 526 } : { body: { status: 'unavailable' } });
    assert.match((await f.bank.refreshBalance()).error, /526/);
    assert.equal(f.requests.length, 2);
    assert.equal(f.requests[1].headers.Authorization, undefined);
});
test('custom origins never fall back to an official host', async () => {
    const f = fixture(() => ({ status: 526 }), 'https://custom.example');
    await f.bank.refreshBalance(); assert.equal(f.requests.length, 1);
});
test('a query retains its billing idempotency key across the authorized compatibility switch', async () => {
    const f = fixture(details => {
        if (details.url.startsWith(primary)) return { status: 526 };
        if (details.url.endsWith('/api/health')) return { body: { status: 'ok' } };
        return { body: { code: 'OK', data: [{ answer: '甲' }], cost: 1, bucket: 'points' } };
    });
    const result = await f.bank.search({ title: '问题', options: ['甲'], type: 'single' });
    assert.equal(result.code, 1);
    const posts = f.requests.filter(r => r.method === 'POST');
    assert.equal(posts.length, 2);
    assert.equal(posts[0].headers['Idempotency-Key'], posts[1].headers['Idempotency-Key']);
});
test('balance and capability certificate failures share a single public health probe', async () => {
    const f = fixture(details => {
        if (details.url.startsWith(primary)) return { status: 526 };
        if (details.url.endsWith('/api/health')) return { body: { status: 'ok' } };
        if (details.url.endsWith('/balance')) return { body: { code: 'OK', cost: 0, data } };
        return { body: { code: 'OK', cost: 0, protocol_version: '1', data: { ai: { enabled: false, allowed: false, ready: false, effective_model: null, price_points: null, disabled_reason: 'account_disabled' } } } };
    });
    await Promise.all([f.bank.refreshBalance(), f.bank.refreshCapabilities()]);
    assert.equal(f.requests.filter(r => r.url.endsWith('/api/health')).length, 1);
});
for (const [event, error, expected] of [
    ['onerror', { error: 'Refused to connect: api.sanzwk.com' }, /权限.*api\.sanzwk\.com/],
    ['ontimeout', {}, /超时/],
    ['onerror', { error: 'network error ' + token }, /网络/],
]) test(`request failures give a safe actionable ${event} error`, async () => {
    const f = fixture(() => ({ event, error })); const result = await f.bank.refreshBalance();
    assert.match(result.error, expected); assert.ok(!result.error.includes(token));
});
test('changing account while the compatibility probe is pending cannot retry old credentials', async () => {
    const f = fixture(details => details.url.startsWith(primary) ? { status: 526 } : null);
    const pending = f.bank.refreshBalance();
    for (let i = 0; i < 10 && f.requests.length < 2; i++) await Promise.resolve();
    assert.equal(f.requests.length, 2);
    f.bank.setToken('ys_' + 'b'.repeat(43));
    f.requests[1].onload({ status: 200, responseText: JSON.stringify({ status: 'ok' }), finalUrl: f.requests[1].url });
    await pending;
    assert.equal(f.requests.length, 2); assert.equal(f.bank.balanceState().data, null);
});
test('a stopped search does not wait for a shared compatibility probe or send a second credentialed request', async () => {
    const f = fixture(details => details.url.startsWith(primary) ? { status: 526 } : null);
    const controller = new AbortController();
    const pending = f.bank.search({ title: '停止测试', options: [], type: 'answer' }, { signal: controller.signal });
    for (let i = 0; i < 10 && f.requests.length < 2; i++) await Promise.resolve();
    assert.equal(f.requests.length, 2);
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    f.requests[1].onload({ status: 200, responseText: JSON.stringify({ status: 'ok' }), finalUrl: f.requests[1].url });
    await Promise.resolve(); assert.equal(f.requests.length, 2);
});
test('changing configured origin during a public probe prevents fallback and clears route state', async () => {
    const f = fixture(details => details.url.startsWith(primary) ? { status: 526 } : null);
    const pending = f.bank.refreshBalance();
    for (let i = 0; i < 10 && f.requests.length < 2; i++) await Promise.resolve();
    f.bank.setBase('https://custom.example');
    f.requests[1].onload({ status: 200, responseText: JSON.stringify({ status: 'ok' }), finalUrl: f.requests[1].url });
    await pending; assert.equal(f.requests.length, 2);
    assert.equal(f.bank.routeState().activeOrigin, 'https://custom.example');
});
test('an unhealthy compatibility probe is throttled and redirects never receive credentials', async () => {
    const f = fixture(details => details.url.startsWith(primary) ? { status: 526 } : { finalUrl: 'https://untrusted.example/', body: { status: 'ok' } });
    await f.bank.refreshBalance(); f.advance(2000); await f.bank.refreshBalance({ force: true });
    assert.equal(f.requests.length, 3); assert.equal(f.bank.routeState().compatibility, false);
    assert.equal(f.requests[1].headers.Authorization, undefined);
});
test('browser TLS failures can use the same verified compatibility route', async () => {
    const f = fixture(details => {
        if (details.url.startsWith(primary)) return { event: 'onerror', error: { error: 'ERR_CERT_AUTHORITY_INVALID' } };
        if (details.url.endsWith('/api/health')) return { body: { status: 'ok' } };
        return { body: { code: 'OK', cost: 0, data } };
    });
    assert.equal((await f.bank.refreshBalance()).data.vip_level, 3);
});
const connectionStatus = require('../src/ui/connection');
for (const [state, expected, tokenPresent, compatibility] of [
    [{}, '本地模式', false, false],
    [{}, 'Token 已保存', true, false],
    [{ loading: true }, '正在连接', true, false],
    [{ data }, '已连接题库', true, false],
    [{ data }, '已连接 · 兼容线路', true, true],
    [{ error: 'HTTP 526' }, '连接异常', true, false],
]) test(`connection badge describes the verified state: ${expected}`, () => {
    const bank = { getToken: () => tokenPresent ? token : '', balanceState: () => state, routeState: () => ({ compatibility, activeOrigin: compatibility ? compatible : primary }) };
    assert.equal(connectionStatus(bank).label, expected);
});
