'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const createQuestionBankClient = require('../src/core/question-bank');
const { runVideo } = require('../src/tasks/video');

const legacy = 'https://tk.sanzwk.com', api = 'https://api.sanzwk.com';
const key = 'shenchanranToken';
function bankFixture(initial = {}, response) {
    const values = new Map(Object.entries(initial)), requests = [];
    const bank = createQuestionBankClient({ getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback, setValue: (key, value) => values.set(key, value), request: details => {
        requests.push(details);
        queueMicrotask(() => details.onload({ status: 200, responseText: JSON.stringify(response), finalUrl: details.url }));
        return { abort() {} };
    } });
    return { bank, values, requests };
}
test('API host changes preserve only the trusted legacy token and accept ys_ tokens', () => {
    const token = 'tk_' + 'a'.repeat(40);
    const { bank } = bankFixture({ [key]: token, yixueQuestionBankBase: legacy, yixueApiTokenOrigin: legacy });
    assert.equal(bank.base(), api);
    assert.equal(bank.getToken(), token);
    bank.setToken('ys_' + 'b'.repeat(43));
    assert.match(bank.getToken(), /^ys_/);
    for (const value of ['ys_short', ' ys_' + 'a'.repeat(40), 'ys_' + '<'.repeat(40), 'sub_' + 'a'.repeat(40)]) assert.equal(bank.isValidToken(value), false);
});
test('custom API origins keep credential boundaries during the migration', () => {
    const token = 'tk_' + 'a'.repeat(40);
    const { bank } = bankFixture({ [key]: token, yixueQuestionBankBase: 'https://custom.example', yixueApiTokenOrigin: legacy });
    assert.equal(bank.base(), 'https://custom.example');
    assert.equal(bank.getToken(), '');
    bank.setToken('ys_' + 'b'.repeat(40));
    bank.setBase(api);
    assert.equal(bank.getToken(), '');
});
test('membership fields survive normalization without inventing a VIP tier', async () => {
    const { bank, requests } = bankFixture({ [key]: 'ys_' + 'a'.repeat(40) }, { code: 'OK', cost: 0, data: { points: 82, member: true, member_until: 1900000000, daily_limit: 200, daily_remaining: 120, vip_level: 3, plan_name: 'VVIP' } });
    const state = await bank.refreshBalance();
    assert.equal(requests[0].url, api + '/api/v1/balance');
    assert.equal(state.data.vip_level, 3);
    assert.equal(state.data.plan_name, 'VVIP');
    assert.equal(requests[0].anonymous, true);
    assert.match(requests[0].headers.Authorization, /^Bearer ys_/);
});
test('stopping a query aborts the request while keeping its idempotency key for safe retry', async () => {
    const { bank, values } = bankFixture({ [key]: 'tk_' + 'a'.repeat(40) });
    const controller = new AbortController();
    const pending = bank.search({ title: '停止测试', options: [], type: 'answer' }, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    assert.equal(Object.keys(values.get('yixuePendingSearches')).length, 1);
});

function videoFixture({ rate = 1, duration = 300, property = {}, report } = {}) {
    const state = { rate, reports: [], logs: [], estimates: [], waits: [], controller: new AbortController() };
    const origin = 'https://mooc1.chaoxing.com';
    state.task = { jobid: 'job-1', property: { objectid: 'obj-1', doublespeed: 1, ...property } };
    state.env = {
        context: { origin, classId: '202', uid: '404' }, defaults: { reportUrl: origin + '/multimedia/log/a', userid: '404' },
        signal: state.controller.signal, name: '测试视频', settings: { get: () => state.rate }, requestText: async () => '',
        requestJSON: async url => {
            if (String(url).startsWith('/ananas/status')) return { status: 'success', duration, dtoken: 'private-report', objectid: 'obj-1' };
            const parsed = new URL(url, origin); state.reports.push(parsed);
            return report ? report(parsed, state) : { isPassed: parsed.searchParams.get('isdrag') === '4' };
        },
        progress() {}, remaining: value => state.estimates.push(value), log: (message, tone) => state.logs.push({ message, tone }), retry: operation => operation(),
        wait: async (ms, signal) => { state.waits.push(ms); if (signal.aborted) throw signal.reason; if (state.onWait) await state.onWait(); },
    };
    return state;
}
test('saved speed changes apply to the current video at the next heartbeat', async () => {
    const s = videoFixture();
    s.onWait = () => { s.rate = 4; };
    assert.equal(await runVideo(s.task, s.env), 'confirmed');
    assert.deepEqual(s.reports.map(url => Number(url.searchParams.get('playingTime'))), [0, 240, 300]);
    assert.ok(s.waits.every(ms => ms === 60000));
});
test('restricted speed reports the actual rate and retains the platform restriction', async () => {
    const s = videoFixture({ rate: 8, duration: 61, property: { doublespeed: 0, fastforward: true } });
    assert.equal(await runVideo(s.task, s.env), 'confirmed');
    assert.deepEqual(s.reports.map(url => Number(url.searchParams.get('playingTime'))), [0, 60, 61]);
    assert.ok(s.logs.some(item => /平台.*1 倍/.test(item.message)));
});
test('abort during the heartbeat stops reporting and clears the remaining time', async () => {
    const s = videoFixture();
    s.onWait = () => s.controller.abort(new DOMException('stopped', 'AbortError'));
    await assert.rejects(runVideo(s.task, s.env), { name: 'AbortError' });
    assert.equal(s.reports.length, 1);
    assert.equal(s.estimates.at(-1), null);
});
module.exports = { bankFixture, videoFixture };
