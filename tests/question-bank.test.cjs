const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const sourcePath = path.join(__dirname, '..', readdirSync(path.join(__dirname, '..')).find(name => name.endsWith('.txt.js')));
const source = readFileSync(sourcePath, 'utf8');
const clientBlock = source.split('// BEGIN QUESTION BANK CLIENT')[1]?.split('// END QUESTION BANK CLIENT')[0];
assert.ok(clientBlock, 'userscript must include the versioned question-bank client');
const artifactDirectory = path.join(__dirname, '..', 'artifacts');
mkdirSync(artifactDirectory, { recursive: true });
const clientPath = path.join(artifactDirectory, 'question-bank-client.cjs');
writeFileSync(clientPath, clientBlock + '\nmodule.exports = createQuestionBankClient;\n');
const factory = require(clientPath);
function setup(responses = [], overrides = {}) {
    const storage = new Map();
    const requests = [];
    const options = {
        getValue: (key, fallback) => storage.has(key) ? storage.get(key) : fallback,
        setValue: (key, value) => storage.set(key, value),
        request: details => {
            requests.push(details);
            const reply = responses.shift();
            if (reply === 'timeout') details.ontimeout();
            else if (reply === 'network') details.onerror();
            else details.onload({ status: reply?.status ?? 200, responseText: reply?.text ?? JSON.stringify(reply?.body ?? reply ?? {}), finalUrl: reply?.finalUrl ?? details.url });
        },
        ...overrides,
    };
    const client = factory(options);
    client.setToken('tk_' + 'A'.repeat(43));
    return { client, requests, storage, recreate: () => factory(options) };
}
const question = { title: '水的化学式是什么？', options: ['H₂O', 'CO₂', 'O₂'], type: '0', use_ai: false };
const hit = { code: 'OK', data: [{ question: question.title, answer: 'H₂O', analysis: '参考解析' }], cost: 1, bucket: 'points', source: 'local', is_ai: false };

test('sends the documented JSON protocol without putting credentials in URLs', async () => {
    const { client, requests } = setup([hit]);
    const result = await client.search(question);
    assert.equal(result.code, 1);
    assert.equal(result.data, 'H₂O');
    assert.equal(requests[0].url, 'https://tk.sanzwk.com/api/v1/search');
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].headers.Authorization, 'Bearer tk_' + 'A'.repeat(43));
    assert.match(requests[0].headers['Idempotency-Key'], /^[\w-]{16,100}$/);
    assert.deepEqual(JSON.parse(requests[0].data), { ...question, type: 'single' });
    assert.equal(requests[0].anonymous, true);
    assert.equal(requests[0].redirect, 'error');
    assert.match(client.usageLabel(), /1.*积分/);
});

test('new tokens are accepted; old tokens and malformed values are rejected', () => {
    const { client } = setup();
    assert.equal(client.isValidToken('tk_' + 'x'.repeat(43)), true);
    for (const token of ['a'.repeat(32), '', 'tk_short', 'tk_' + 'x'.repeat(43) + '\n', 'tk_' + 'x'.repeat(43) + '\nInjected: true']) {
        assert.equal(client.isValidToken(token), false);
        assert.throws(() => client.setToken(token));
    }
});

test('health uses the public endpoint without credentials or a paid search', async () => {
    const { client, requests } = setup([{ body: { status: 'ok' } }]);
    assert.equal(await client.health(), true);
    assert.equal(requests[0].url, 'https://tk.sanzwk.com/api/health');
    assert.equal(requests[0].headers.Authorization, undefined);
});

test('timeouts and in-progress requests preserve the key even when the client is recreated', async () => {
    const { client, requests, storage, recreate } = setup(['timeout', { status: 409 }, hit, hit]);
    assert.equal((await client.search(question)).code, 0);
    assert.equal((await client.search(question)).code, 0);
    assert.equal((await recreate().search(question)).code, 1);
    assert.equal(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
    assert.equal(requests[1].headers['Idempotency-Key'], requests[2].headers['Idempotency-Key']);
    await client.search(question);
    assert.notEqual(requests[2].headers['Idempotency-Key'], requests[3].headers['Idempotency-Key']);
    assert.ok(!JSON.stringify([...storage]).includes('Bearer'));
});

for (const [input, normalized] of [['1', 'multiple'], ['2', 'fill'], ['3', 'judge'], ['判断题', 'judge'], ['单选题', 'single'], ['unknown-value', 'unknown']]) {
    test(`normalizes type ${input} and the server answer separator`, async () => {
        const { client, requests } = setup([{ ...hit, data: [{ answer: '甲###乙' }], is_ai: true }]);
        const result = await client.search({ ...question, type: input, use_ai: true });
        assert.equal(JSON.parse(requests[0].data).type, normalized);
        assert.equal(JSON.parse(requests[0].data).use_ai, true);
        assert.equal(result.data, '甲#!#乙');
        assert.equal(result.msg, 'ai');
    });
}

for (const status of [401, 402, 403, 429]) {
    test(`HTTP ${status} stops further paid calls until explicitly resumed`, async () => {
        const { client, requests } = setup([{ status, body: { detail: '<img src=x onerror=alert(1)>' } }, hit]);
        const result = await client.search(question);
        assert.equal(result.code, 0);
        assert.equal(result.fatal, true);
        assert.ok(!result.msg.includes('<'));
        await client.search({ ...question, title: '另一道题' });
        assert.equal(requests.length, 1);
        client.resume();
        assert.equal((await client.search(question)).code, 1);
    });
}

test('never treats an HTTP error, HTML page, missing answer or business failure as a hit', async () => {
    for (const response of [{ status: 503, body: hit }, { text: '<html>failure</html>' }, { code: 'NOT_FOUND', data: [] }, { code: 'UPSTREAM_ERROR' }, { ...hit, data: [{ answer: '' }] }]) {
        const { client } = setup([response]);
        const result = await client.search(question);
        assert.equal(result.code, 0);
        assert.equal(result.data, '');
    }
});

test('validates question boundaries before making requests', async () => {
    for (const input of [{ ...question, title: '' }, { ...question, title: 'x'.repeat(5001) }, { ...question, options: Array(31).fill('x') }, { ...question, options: ['x'.repeat(2001)] }]) {
        const { client, requests } = setup();
        assert.equal((await client.search(input)).code, 0);
        assert.equal(requests.length, 0);
    }
});

test('changing origins clears tokens, collection consent and pending requests', () => {
    const { client, storage } = setup();
    storage.set('yixueSubmissionToken', 'sub_old');
    storage.set('yixueSubmissionConsent', true);
    client.setBase('https://new-bank.example/');
    assert.equal(client.base(), 'https://new-bank.example');
    assert.equal(client.getToken(), '');
    assert.equal(storage.get('yixueSubmissionToken'), '');
    assert.equal(storage.get('yixueSubmissionConsent'), false);
    for (const url of ['http://example.com', 'https://u:p@example.com', 'https://example.com?token=x', 'javascript:alert(1)']) assert.throws(() => client.setBase(url));
});

test('the userscript no longer uses retired login, quota or search endpoints', () => {
    assert.equal(/api\/(?:query|checkLeft|register|status)(?:[?'"/]|\b)/.test(source), false);
    assert.equal(/\?token=|ajax\/wx_login\.php/.test(source), false);
});

test('missing or origin-mismatched tokens never reach the network', async () => {
    const { client, requests, storage } = setup();
    storage.set('yixueApiTokenOrigin', 'https://other.example');
    assert.equal((await client.search(question)).fatal, true);
    assert.equal(requests.length, 0);
});

test('invalid saved origins fall back safely; saving the same origin preserves the token', () => {
    const { client, storage } = setup();
    client.setBase('https://tk.sanzwk.com/');
    assert.ok(client.getToken().startsWith('tk_'));
    storage.set('yixueQuestionBankBase', 'https://u:p@bad.example');
    assert.equal(client.base(), 'https://tk.sanzwk.com');
});

test('network failures and redirects do not silently start a fresh paid query', async () => {
    const { client, requests } = setup(['network', { ...hit, finalUrl: 'https://other.example/api/v1/search' }, hit]);
    assert.equal((await client.search(question)).code, 0);
    assert.equal((await client.search(question)).code, 0);
    assert.equal((await client.search(question)).code, 1);
    assert.equal(requests[0].headers['Idempotency-Key'], requests[2].headers['Idempotency-Key']);
});

for (const code of ['NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED']) {
    test(`${code} is terminal and an explicit new query gets a new key`, async () => {
        const { client, requests } = setup([{ code }, hit]);
        assert.equal((await client.search(question)).code, 0);
        assert.equal((await client.search(question)).code, 1);
        assert.notEqual(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
    });
}

test('unknown business replies and empty OK replies preserve the original request key', async () => {
    const { client, requests } = setup([{ code: 'MYSTERY' }, { ...hit, data: [] }, hit]);
    await client.search(question); await client.search(question); await client.search(question);
    assert.equal(new Set(requests.map(r => r.headers['Idempotency-Key'])).size, 1);
});

test('normalizes newline options, defaults unknown kinds, and accurately displays free/member queries', async () => {
    const { client, requests } = setup([{ ...hit, cost: 0 }, { ...hit, cost: 2, bucket: 'member' }, { ...hit, cost: undefined }]);
    await client.search({ title: '  question  ', options: '  one\n\ntwo  ', use_ai: '1' });
    assert.deepEqual(JSON.parse(requests[0].data), { title: 'question', options: ['one', 'two'], type: 'unknown', use_ai: false });
    assert.match(client.usageLabel(), /0.*积分/);
    await client.search(question);
    assert.match(client.usageLabel(), /2.*会员/);
    await client.search(question);
    assert.match(client.usageLabel(), /题库网站/);
});

test('field validation failures never become successful answers and can be corrected', async () => {
    const { client, requests } = setup([{ status: 422 }, hit]);
    assert.equal((await client.search(question)).code, 0);
    assert.equal((await client.search(question)).code, 1);
    assert.notEqual(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
});

test('unconfirmed results survive a fresh client; confirmed answers do not fabricate remaining credit', async () => {
    const { client, recreate } = setup(['timeout', hit]);
    await client.search(question);
    const result = await recreate().search(question);
    assert.equal(result.left, undefined);
    assert.equal(result.code, 1);
});

test('collection uses separate credentials and the currently configured origin', async () => {
    const { client, requests } = setup([{ body: { token: 'sub_example' } }, { status: 201, body: { imported_count: 1 } }]);
    client.setBase('https://new-bank.example');
    client.setToken('tk_' + 'B'.repeat(43));
    const issued = await client.provisionSubmission();
    assert.equal(issued.body.token, 'sub_example');
    assert.equal(requests[0].url, 'https://new-bank.example/api/submission-tokens/provision');
    assert.equal(requests[0].headers.Authorization, 'Bearer tk_' + 'B'.repeat(43));
    const body = { consent: true, source_host: 'mooc1.chaoxing.com', questions: [{ title: '题目', options: [], type: 'unknown' }] };
    const submitted = await client.submitQuestions(issued.body.token, body, 'page-fixture');
    assert.equal(submitted.status, 201);
    assert.equal(requests[1].url, 'https://new-bank.example/api/question-submissions');
    assert.equal(requests[1].headers.Authorization, 'Bearer sub_example');
    assert.equal(requests[1].headers['Idempotency-Key'], 'page-fixture');
    assert.deepEqual(JSON.parse(requests[1].data), body);
});

const quota = { code: 'OK', cost: 0, data: { points: 120, member: true, member_until: 1893456000, daily_limit: 100, daily_remaining: 82 } };
test('balance is a free Bearer GET without cookies, a body or idempotency key', async () => {
    const { client, requests } = setup([quota]);
    const state = await client.refreshBalance();
    assert.deepEqual(state.data, quota.data);
    const request = requests[0];
    assert.equal(request.url, 'https://tk.sanzwk.com/api/v1/balance');
    assert.equal(request.method, 'GET');
    assert.equal(request.headers.Authorization, 'Bearer tk_' + 'A'.repeat(43));
    assert.equal(request.data, undefined);
    assert.equal(request.headers['Idempotency-Key'], undefined);
    assert.equal(request.anonymous, true);
    assert.match(client.balanceLabel(), /120.*82\/100/);
    assert.match(client.balanceLabel(), /2030.*北京时间/);
});

test('zero points and an exhausted membership are valid balances', async () => {
    const { client } = setup([{ ...quota, data: { ...quota.data, points: 0, daily_remaining: 0 } }]);
    const state = await client.refreshBalance();
    assert.equal(state.error, '');
    assert.equal(state.data.points, 0);
    assert.match(client.balanceLabel(), /积分：0.*0\/100/);
});

test('nonmembers and expired members are displayed distinctly', async () => {
    for (const until of [0, 1609459200]) {
        const { client } = setup([{ ...quota, data: { points: 10, member: false, member_until: until, daily_remaining: 0, daily_limit: 0 } }]);
        await client.refreshBalance();
        assert.match(client.balanceLabel(), until ? /已到期.*2021/ : /非会员/);
    }
});

test('balance refreshes are cached, manual refresh is throttled, and forced refresh gets new values', async () => {
    let now = 100000;
    const { client, requests } = setup([quota, { ...quota, data: { ...quota.data, points: 119 } }], { now: () => now });
    await client.refreshBalance();
    await client.refreshBalance();
    await client.refreshBalance({ force: true });
    assert.equal(requests.length, 1);
    now += 1500;
    await client.refreshBalance({ force: true });
    assert.equal(requests.length, 2);
    assert.equal(client.balanceState().data.points, 119);
});

test('coalesces balance calls and ignores a reply belonging to a replaced token', async () => {
    let pending;
    let calls = 0;
    const { client } = setup([], { request: details => { pending = details; calls++; } });
    const first = client.refreshBalance();
    const second = client.refreshBalance();
    assert.equal(calls, 1);
    client.setToken('tk_' + 'B'.repeat(43));
    pending.onload({ status: 200, responseText: JSON.stringify(quota) });
    await Promise.all([first, second]);
    assert.equal(client.balanceState().data, null);
});

test('a missing Token makes no balance request', async () => {
    const { client, storage, requests } = setup();
    storage.set('shenchanranToken', '');
    const result = await client.refreshBalance();
    assert.equal(result.data, null);
    assert.match(result.error, /Token/);
    assert.equal(requests.length, 0);
});

for (const status of [401, 403, 404, 429, 503]) {
    test(`balance HTTP ${status} is not mistaken for zero credit and does not block search`, async () => {
        const { client } = setup([{ status }, hit]);
        const state = await client.refreshBalance();
        assert.equal(state.data, null);
        assert.ok(state.error);
        assert.equal((await client.search(question)).code, 1);
    });
}

test('rate-limited balances back off instead of flooding the endpoint', async () => {
    let now = 100000;
    const { client, requests } = setup([{ status: 429 }, quota], { now: () => now });
    await client.refreshBalance();
    now += 2000;
    await client.refreshBalance({ force: true });
    assert.equal(requests.length, 1);
    now += 60000;
    await client.refreshBalance();
    assert.equal(requests.length, 2);
});

test('a failed refresh preserves previous data with an explicit stale marker', async () => {
    let now = 100000;
    const { client } = setup([quota, 'timeout'], { now: () => now });
    await client.refreshBalance();
    now += 2000;
    const state = await client.refreshBalance({ force: true });
    assert.equal(state.data.points, 120);
    assert.ok(state.error);
    assert.match(client.balanceLabel(), /刷新失败/);
});

test('rejects malformed or billed balance responses', async () => {
    for (const body of [{ ...quota, cost: 1 }, { ...quota, code: 'NOT_FOUND' }, { ...quota, data: {} }, { ...quota, data: { ...quota.data, points: -1 } }, { ...quota, data: { ...quota.data, daily_remaining: 101 } }, { ...quota, data: { ...quota.data, member_until: '2030' } }]) {
        const { client } = setup([body]);
        const state = await client.refreshBalance();
        assert.equal(state.data, null);
        assert.ok(state.error);
    }
});

test('balance subscribers receive updates and can unsubscribe', async () => {
    const { client } = setup([quota]);
    let updates = 0;
    const unsubscribe = client.onBalanceChange(() => { updates++; });
    await client.refreshBalance();
    assert.ok(updates > 0);
    const previous = updates;
    unsubscribe();
    client.setBase('https://other.example');
    assert.equal(updates, previous);
    assert.equal(client.balanceState().data, null);
});
