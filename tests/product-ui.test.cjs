'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
const metadata = require('../src/metadata.json');
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });
async function fixture(t, { conflict = '', width = 390 } = {}) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(5000); t.after(() => page.close());
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><title>测试课程</title></head><body></body></html>' }));
    await page.goto('https://mooc1.chaoxing.com/mooc-ans/course/yixue-console.html?courseid=101&classid=202&uid=404');
    await page.evaluate(({ conflict, metadata }) => {
        const values = new Map([['yixueLocalToken', 'a'.repeat(32)]]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_info = { script: { version: metadata.version } }; window.unsafeWindow = window;
        window.catalogRequests = []; window.updateRequests = []; window.aborts = 0;
        window.GM_xmlhttpRequest = details => {
            if (details.url === metadata.updateURL) {
                updateRequests.push(details);
                queueMicrotask(() => details.onload({ status: 200, responseText: '// ==UserScript==\n// @name ' + metadata.name + '\n// @namespace ' + metadata.namespace + '\n// @version 4.9.0\n// ==/UserScript==' }));
            } else catalogRequests.push(details);
            return { abort() { aborts++; details.onabort?.(); } };
        };
        window.GM_registerMenuCommand = () => {};
        if (conflict === 'reference') window.checkConcurrency = [6];
        if (conflict === 'dom') { const other = document.createElement('div'); other.id = 'ocs-app'; document.body.append(other); }
        if (conflict === 'old') document.documentElement.dataset.yixueBooted = '1';
    }, { conflict, metadata });
    await page.addScriptTag({ content: bundle({ testing: true, compact: true }) });
    await page.evaluate(() => testLoad('app').bootstrap());
    return page;
}

for (const width of [320, 390, 1440]) test('support, ownership, exclusivity and update actions fit at ' + width + 'px', async t => {
    const page = await fixture(t, { width });
    await page.getByText('发现新版 4.9.0').waitFor();
    assert.equal(await page.locator('.yixue-brand-name').innerText(), '易学·超星学习通助手');
    assert.match(await page.locator('.yixue-activity-card').innerText(), /有任何使用疑问.*952042950/s);
    assert.match(await page.locator('.yx-script-rule').innerText(), /禁止.*其他网课脚本.*同时运行/);
    assert.doesNotMatch(await page.locator('#yixue-course-dashboard').innerText(), /三街网络|二次开发|第三方组件|🏆/);
    assert.equal(await page.getByRole('link', { name: '安装新版' }).getAttribute('href'), metadata.downloadURL);
    assert.equal(await page.getByRole('link', { name: '脚本猫发布页' }).getAttribute('href'), 'https://scriptcat.org/zh-CN/script-show-page/8747');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: '检查脚本更新' }).click();
    await page.waitForFunction(() => updateRequests.length === 2);
    if (width !== 320) await page.screenshot({ path: 'artifacts/product-' + width + '.png', fullPage: true });
});

for (const conflict of ['reference', 'dom', 'old']) test('detected concurrent scripts block startup: ' + conflict, async t => {
    const page = await fixture(t, { conflict });
    await page.getByRole('alertdialog', { name: '网课脚本冲突，已阻止运行' }).waitFor();
    assert.equal(await page.locator('#yixue-run-course').count(), 0);
    assert.equal(await page.evaluate(() => catalogRequests.length), 0);
    assert.match(await page.locator('#yixue-script-conflict').innerText(), /脚本猫.*油猴.*暴力猴/s);
    assert.match(await page.locator('#yixue-script-conflict').innerText(), /952042950/);
});

for (const conflict of ['dom', 'reference', 'duplicate', 'frame']) test('late conflicts stop running work and prevent restart: ' + conflict, async t => {
    const page = await fixture(t);
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => catalogRequests.length === 1);
    await page.evaluate(async conflict => {
        if (conflict === 'reference') window.checkConcurrency = [6];
        if (conflict === 'dom') { const other = document.createElement('div'); other.id = 'skpannel'; document.body.append(other); }
        if (conflict === 'duplicate') await testLoad('app').bootstrap();
        if (conflict === 'frame') {
            const frame = document.createElement('iframe'); document.body.append(frame);
            const other = frame.contentDocument.createElement('div'); other.id = 'ocs-app'; frame.contentDocument.body.append(other);
        }
    }, conflict);
    await page.getByRole('alertdialog', { name: '网课脚本冲突，已阻止运行' }).waitFor();
    assert.equal(await page.evaluate(() => aborts), 1);
    assert.equal(await page.locator('#yixue-run-course').count(), 0);
    assert.equal(await page.evaluate(() => catalogRequests.length), 1);
});

test('unrelated page text and ordinary platform controls do not trigger the guard', async t => {
    const page = await fixture(t);
    await page.evaluate(() => {
        const node = document.createElement('p'); node.textContent = 'OCS、其他网课脚本的介绍'; document.body.append(node);
        const helper = document.createElement('div'); helper.id = 'translation-helper-root'; helper.textContent = '网页翻译工具'; document.body.append(helper);
    });
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => catalogRequests.length === 1);
    assert.equal(await page.locator('#yixue-script-conflict').count(), 0);
});
