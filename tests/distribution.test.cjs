'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
const metadata = require('../src/metadata.json');

// Reproduces the public ScriptCat 4.1.17 download byte for byte: its metadata
// replacement also matched a pair of markers inside the update parser.
function rewriteDistributionMetadata(source) {
    const pattern = /\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/g;
    const header = source.match(pattern)[0].replace(/^\/\/ @(?:updateURL|downloadURL)\s+[^\n]+\n/gm, '');
    return source.replace(pattern, () => header);
}
const runtime = source => source.slice(source.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length);

for (const compact of [false, true]) test('distribution metadata rewrite preserves executable code: compact=' + compact, () => {
    const source = bundle({ compact });
    const distributed = rewriteDistributionMetadata(source);
    assert.doesNotThrow(() => new Function(distributed));
    assert.equal(runtime(distributed), runtime(source));
    assert.equal((distributed.match(/\/\/ ==UserScript==/g) || []).length, 1);
    assert.equal((distributed.match(/\/\/ ==\/UserScript==/g) || []).length, 1);
});

let browser, distributed;
before(async () => {
    distributed = rewriteDistributionMetadata(bundle({ compact: true }));
    browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); });

async function fixture(t, { prefix = 'mooc2-ans', firstUse = false, conflict = false } = {}) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(5000); t.after(() => page.close());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><title>课程入口测试</title></head><body><main>课程目录 · 已完成任务点 80/80</main></body></html>' }));
    await page.goto('https://mooc2-ans.chaoxing.com/' + prefix + '/mycourse/stu?courseid=101&clazzid=202&cpi=303&pageHeader=1&v=2&hideHead=0');
    await page.evaluate(({ metadata, firstUse, conflict }) => {
        const values = new Map(firstUse ? [] : [['yixueLocalToken', 'a'.repeat(32)]]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_registerMenuCommand = () => {};
        window.GM_info = { script: { version: metadata.version } }; window.unsafeWindow = window;
        window.unexpectedRequests = [];
        window.GM_xmlhttpRequest = details => {
            if (details.url === metadata.updateURL) {
                queueMicrotask(() => details.onload({ status: 200, responseText: '// ==UserScript==\n// @name ' + metadata.name + '\n// @namespace ' + metadata.namespace + '\n// @version 4.9.0\n// ==/UserScript==' }));
            } else {
                unexpectedRequests.push(details.url);
                queueMicrotask(() => details.onerror());
            }
            return { abort() { details.onabort?.(); } };
        };
        if (conflict) {
            const other = document.createElement('div'); other.id = 'ocs-app'; document.body.append(other);
        }
    }, { metadata, firstUse, conflict });
    await page.addScriptTag({ content: distributed });
    return { page, errors };
}

for (const prefix of ['mooc2-ans', 'mooc-ans']) test('distributed production script opens the course entry and checks updates: ' + prefix, async t => {
    const { page, errors } = await fixture(t, { prefix });
    await page.locator('#yixue-entry').waitFor({ state: 'visible' });
    await page.getByText('发现新版 4.9.0', { exact: true }).waitFor();
    assert.equal(await page.locator('#yixue-entry .yx-action').count(), 4);
    assert.equal(await page.locator('#yixue-script-conflict').count(), 0);
    assert.deepEqual(await page.evaluate(() => unexpectedRequests), []);
    assert.deepEqual(errors, []);
});

test('first use still opens the course entry after choosing a local token', async t => {
    const { page, errors } = await fixture(t, { firstUse: true });
    await page.locator('#yixue-access-dialog').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '随机生成 Token', exact: true }).click();
    await page.locator('#yixue-entry').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#yixue-access-dialog').count(), 0);
    assert.deepEqual(await page.evaluate(() => unexpectedRequests), []);
    assert.deepEqual(errors, []);
});

for (const conflict of [true, false]) test('distributed production script shows the conflict blocker: ' + (conflict ? 'on startup' : 'after startup'), async t => {
    const { page, errors } = await fixture(t, { conflict });
    if (!conflict) {
        await page.locator('#yixue-entry').waitFor({ state: 'visible' });
        await page.evaluate(() => {
            const other = document.createElement('div'); other.id = 'skpannel'; document.body.append(other);
        });
    }
    const dialog = page.getByRole('alertdialog', { name: '网课脚本冲突，已阻止运行' });
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await page.locator('#yixue-entry').count(), 0);
    assert.match(await dialog.innerText(), /停用其他网课脚本.*再刷新页面/);
    assert.equal(await dialog.locator('style').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => unexpectedRequests), []);
    assert.deepEqual(errors, []);
    if (conflict) await page.screenshot({ path: 'artifacts/conflict-preview.png' });
});
