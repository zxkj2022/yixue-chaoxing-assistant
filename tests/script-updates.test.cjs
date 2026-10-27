'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const metadata = require('../src/metadata.json');

function fixture() {
    const { createUpdateChecker } = require('../src/core/updates');
    const values = new Map(), requests = [];
    let time = 100000000;
    const checker = createUpdateChecker({ currentVersion: '4.1.16', now: () => time,
        store: { read: (key, fallback) => values.has(key) ? values.get(key) : fallback, write: (key, value) => values.set(key, value) },
        request: details => { requests.push(details); return { abort: () => details.onabort() }; },
    });
    const deliver = (version, extra = {}) => requests.at(-1).onload({ status: 200, responseText: '// ==UserScript==\n// @name ' + metadata.name + '\n// @namespace ' + metadata.namespace + '\n// @version ' + version + '\n// ==/UserScript==', ...extra });
    return { checker, values, requests, deliver, advance: milliseconds => { time += milliseconds; } };
}

test('release identifies the requested product, company, payment disclosure and reuse restrictions', () => {
    assert.equal(metadata.name, '易学网课助手｜超星学习通·知到智慧树｜全能题库·章节任务辅助');
    assert.equal(metadata.author, '三街网络');
    assert.ok(metadata.antifeature.some(value => /^payment\s/.test(value)));
    assert.match(metadata.license, /禁止.*二次开发/);
    assert.match(metadata.copyright, /三街网络/);
});

test('checking updates uses anonymous metadata requests and fixed official install links', async () => {
    const f = fixture(), changes = [];
    const off = f.checker.subscribe(state => changes.push(state.status));
    const flight = f.checker.check();
    assert.equal(f.checker.check(), flight);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].anonymous, true);
    assert.equal(f.requests[0].url, metadata.updateURL);
    assert.equal(f.requests[0].data, undefined);
    assert.equal(f.requests[0].headers.Authorization, undefined);
    f.deliver('4.1.17');
    const state = await flight;
    assert.equal(state.status, 'available');
    assert.equal(state.latestVersion, '4.1.17');
    assert.equal(state.downloadURL, metadata.downloadURL);
    assert.deepEqual(changes, ['idle', 'checking', 'available']);
    off(); f.checker.destroy();
});

test('numeric version comparison, cached results and forced checks are independent of question-bank versions', async () => {
    const f = fixture();
    let pending = f.checker.check(); f.deliver('4.1.9');
    assert.equal((await pending).status, 'ahead');
    assert.equal((await f.checker.check()).latestVersion, '4.1.9');
    assert.equal(f.requests.length, 1);
    pending = f.checker.check({ force: true }); f.deliver('4.1.16');
    assert.equal((await pending).status, 'current');
    f.advance(12 * 3600000 + 1);
    pending = f.checker.check(); f.deliver('4.2.0');
    assert.equal((await pending).status, 'available');
    assert.equal(f.requests.length, 3);
    f.checker.destroy();
});

for (const scenario of ['http', 'html', 'identity', 'version', 'redirect', 'network', 'timeout', 'abort', 'throw']) {
    test('failed update checks remain explicit and can be retried: ' + scenario, async () => {
        const f = fixture();
        let pending;
        if (scenario === 'throw') {
            const { createUpdateChecker } = require('../src/core/updates');
            f.checker.destroy();
            f.checker = createUpdateChecker({ currentVersion: '4.1.16', request: () => { throw Error('offline'); } });
            pending = f.checker.check();
        } else {
            pending = f.checker.check();
            if (scenario === 'http') f.deliver('4.1.17', { status: 503 });
            if (scenario === 'html') f.deliver('4.1.17', { responseText: '<html>login</html>' });
            if (scenario === 'identity') f.deliver('4.1.17', { responseText: '// ==UserScript==\n// @name Other\n// @namespace Other\n// @version 4.1.17\n// ==/UserScript==' });
            if (scenario === 'version') f.deliver('<script>alert(1)</script>');
            if (scenario === 'redirect') f.deliver('4.1.17', { finalUrl: 'https://untrusted.example/update.meta.js' });
            if (scenario === 'network') f.requests.at(-1).onerror();
            if (scenario === 'timeout') f.requests.at(-1).ontimeout();
            if (scenario === 'abort') f.requests.at(-1).onabort();
        }
        assert.equal((await pending).status, 'error');
        assert.ok(f.checker.state().error);
        if (scenario !== 'throw') {
            assert.equal((await f.checker.check()).status, 'error');
            assert.equal(f.requests.length, 1);
            pending = f.checker.check({ force: true }); f.deliver('4.1.17');
            assert.equal((await pending).status, 'available');
        }
        f.checker.destroy();
    });
}

test('closing a page aborts an active check and settles its promise', async () => {
    const f = fixture(), pending = f.checker.check();
    f.checker.destroy();
    await pending;
    assert.equal(f.requests.length, 1);
    await f.checker.check({ force: true });
    assert.equal(f.requests.length, 1);
});

test('bundled identity and update versions follow the same metadata source', () => {
    const { bundle } = require('../scripts/build.cjs');
    const source = bundle({ testing: true });
    assert.ok(source.includes('metadata.json'));
    assert.ok(!fs.readFileSync('src/app.js', 'utf8').includes('abc-helper-root'));
});
