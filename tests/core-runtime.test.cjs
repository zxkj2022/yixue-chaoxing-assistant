'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const digest = require('../src/core/md5');
const { createSettings } = require('../src/core/settings');
const { classifyPage, readCourseContext, consoleUrl } = require('../src/core/routes');
const { createTransport } = require('../src/core/transport');
const { toText } = require('../src/core/primitives');

test('plain text conversion remains a valid Array.map callback', () => {
    assert.deepEqual(['<b>甲</b>', '<i>乙</i>'].map(toText), ['甲', '乙']);
});

for (const value of ['', 'a', 'abc', 'message digest', 'abcdefghijklmnopqrstuvwxyz', '易学课堂', 'x'.repeat(1025)]) {
    test('platform digest matches the standard for ' + JSON.stringify(value.slice(0, 30)), () => {
        assert.equal(digest(value), createHash('md5').update(value).digest('hex'));
    });
}
test('settings retain existing user choices while rejecting invalid configuration', () => {
    const values = new Map([['doLive', false], ['beisu', '1.25'], ['vgqtlv', 'bad']]);
    const settings = createSettings({ read: (key, fallback) => values.has(key) ? values.get(key) : fallback, write: (key, value) => values.set(key, value) });
    assert.equal(settings.get('doLive'), false);
    assert.equal(settings.get('beisu'), 1.25);
    assert.equal(settings.get('vgqtlv'), 85);
    settings.set('beisu', 0.75);
    assert.equal(values.get('beisu'), 0.75);
    assert.throws(() => settings.set('beisu', 0), /倍速/);
    assert.throws(() => settings.set('vgqtlv', 101), /正确率/);
    assert.throws(() => settings.set('unknown-setting', true), /配置/);
    assert.equal(settings.snapshot().doVideo, true);
    assert.equal(settings.snapshot().doLive, false);
});
test('course routing reads aliases and constructs a readable console URL', () => {
    const url = 'https://mooc1.chaoxing.com/mycourse/studentcourse?courseId=1&clazzid=2&cpi=3';
    const context = readCourseContext(url, { title: '课程-首页', cookie: 'UID=4' });
    assert.equal(classifyPage(url), 'entry');
    assert.deepEqual([context.courseId, context.classId, context.cpi, context.uid], ['1', '2', '3', '4']);
    const next = new URL(consoleUrl(context));
    assert.equal(next.pathname, '/mooc-ans/course/yixue-console.html');
    assert.equal(next.searchParams.get('classid'), '2');
    assert.equal(classifyPage(next.href), 'dashboard');
    assert.equal(classifyPage('https://example.com/news'), 'other');
});
test('course requests settle once and never mutate caller headers', async () => {
    let details;
    const transport = createTransport({ base: 'https://mooc1.chaoxing.com', send: value => { details = value; queueMicrotask(() => { value.onload({ status: 200, responseText: 'ok' }); value.onerror({}); }); return { abort() {} }; } });
    const headers = { 'X-Example': 'a' };
    const result = await transport.request({ url: '/course', headers });
    assert.equal(result.responseText, 'ok');
    assert.deepEqual(headers, { 'X-Example': 'a' });
    assert.equal(details.url, 'https://mooc1.chaoxing.com/course');
});
for (const failure of ['http', 'network', 'timeout', 'abort', 'login']) {
    test('course request ' + failure + ' rejects explicitly', async () => {
        const transport = createTransport({ base: 'https://mooc1.chaoxing.com', send: value => {
            queueMicrotask(() => {
                if (failure === 'http') value.onload({ status: 503, responseText: 'busy' });
                if (failure === 'network') value.onerror({});
                if (failure === 'timeout') value.ontimeout({});
                if (failure === 'abort') value.onabort({});
                if (failure === 'login') value.onload({ status: 200, finalUrl: 'https://passport2.chaoxing.com/login', responseText: '<title>用户登录</title>' });
            });
            return { abort() {} };
        } });
        await assert.rejects(transport.request({ url: '/course' }), /HTTP|网络|超时|中止|登录/);
    });
}
test('an already cancelled task never starts a request', async () => {
    const controller = new AbortController(); controller.abort();
    const transport = createTransport({ base: 'https://mooc1.chaoxing.com', send: () => { throw new Error('unexpected network'); } });
    await assert.rejects(transport.request({ url: '/course' }, { signal: controller.signal }), error => error.name === 'AbortError');
});
