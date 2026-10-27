'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
const fs = require('node:fs');
const testingBundle = bundle({ testing: true, compact: true });
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

async function fixture(t, { width = 390, height = 844, desktop = false, desktopWidth = 980 } = {}) {
    const page = await browser.newPage({ viewport: { width: desktop ? desktopWidth : width, height }, screen: { width, height }, isMobile: !desktop, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    page.setDefaultTimeout(5000); t.after(() => page.close());
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>逻辑学导论-首页</title><meta name="viewport" content="width=1200"><meta name="Viewport" content="width=1280,initial-scale=.2"><style>html,body{min-width:1200px;width:1200px;min-height:4000px;height:100vh;overflow:hidden;margin:8px;transform:translateX(3px);zoom:.9}body{font-size:12px}</style></head><body style="min-width:1100px"><h1>平台原页面</h1></body></html>' }));
    await page.goto('https://mooc1.chaoxing.com/mooc-ans/course/yixue-console.html?courseid=101&classid=202&uid=404');
    await page.addScriptTag({ content: testingBundle });
    await page.evaluate(async () => {
        const values = new Map([['yixueLocalToken', 'a'.repeat(32)]]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_info = { script: { version: 'test' } }; window.unsafeWindow = window;
        window.GM_registerMenuCommand = () => {};
        window.requests = []; window.GM_xmlhttpRequest = details => { requests.push(details); return { abort() { details.onabort?.(); } }; };
        await testLoad('app').bootstrap();
    });
    await page.locator('#yixue-course-dashboard').waitFor();
    return page;
}

for (const width of [320, 390, 430]) test(`real mobile viewport replaces duplicate desktop metadata and host widths at ${width}px`, async t => {
    const page = await fixture(t, { width });
    const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, viewports: Array.from(document.querySelectorAll('meta')).filter(el => el.name.toLowerCase() === 'viewport').map(el => el.content), zoom: getComputedStyle(document.documentElement).zoom }));
    assert.equal(metrics.viewports.length, 1); assert.match(metrics.viewports[0], /width=device-width/);
    assert.ok(Math.abs(metrics.width - width) <= 1, JSON.stringify(metrics));
    assert.ok(metrics.scroll <= width, JSON.stringify(metrics)); assert.equal(Number(metrics.zoom), 1);
    const progress = await page.locator('.yixue-overview').boundingBox(), tasks = await page.locator('.yixue-task-card').boundingBox();
    assert.ok(progress.y < tasks.y); assert.ok(progress.width >= width - 25);
    const start = await page.locator('#yixue-run-course').boundingBox();
    assert.ok(start.height >= 46); assert.ok(start.y + start.height <= 844);
    assert.ok(parseFloat(await page.locator('.yixue-log').evaluate(el => getComputedStyle(el).fontSize)) >= 13);
    await page.locator('#yixue-save-settings').scrollIntoViewIfNeeded();
    const save = await page.locator('#yixue-save-settings').boundingBox();
    assert.ok(save.y >= 0 && save.y < 844, 'configuration remains reachable below the fold');
    await page.evaluate(() => scrollTo(0, 0));
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/mobile-dashboard-${width}.png`, fullPage: true });
    if (width === 390) await page.screenshot({ path: 'artifacts/mobile-dashboard-390-viewport.png' });
});

test('late platform viewport replacement cannot shrink the mobile page again', async t => {
    const page = await fixture(t);
    await page.evaluate(() => { document.querySelector('meta[name=viewport]').content = 'width=1280'; const duplicate = document.createElement('meta'); duplicate.name = 'viewport'; duplicate.content = 'width=1024'; document.head.append(duplicate); });
    await page.waitForFunction(() => document.querySelectorAll('meta[name=viewport]').length === 1 && /width=device-width/.test(document.querySelector('meta[name=viewport]').content));
    assert.ok(await page.evaluate(() => innerWidth <= 391 && document.documentElement.scrollWidth <= 391));
});

test('phone desktop mode uses a readable phone layout', async t => {
    const page = await fixture(t, { desktop: true });
    await page.waitForFunction(() => Number(getComputedStyle(document.documentElement).zoom) > 2);
    const scales = await page.evaluate(async () => {
        const values = [];
        for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); values.push(Number(getComputedStyle(document.documentElement).zoom)); }
        return values;
    });
    assert.ok(scales.every(value => Math.abs(value - 980 / 390) < .01), JSON.stringify(scales));
    const metrics = await page.evaluate(() => ({ zoom: Number(getComputedStyle(document.documentElement).zoom), bodyWidth: parseFloat(getComputedStyle(document.body).width), columns: getComputedStyle(document.querySelector('.yixue-dashboard-columns')).flexDirection }));
    assert.ok(Math.abs(metrics.bodyWidth - 390) <= 1, JSON.stringify(metrics)); assert.equal(metrics.columns, 'column');
    const progress = await page.locator('.yixue-overview').boundingBox(), tasks = await page.locator('.yixue-task-card').boundingBox();
    assert.ok(progress.y < tasks.y); assert.ok(progress.width / metrics.zoom >= 365);
});

test('normal desktop keeps its two columns and original scale', async t => {
    const page = await fixture(t, { width: 1440, height: 900, desktop: true, desktopWidth: 1440 });
    assert.equal(await page.locator('.yixue-dashboard-columns').evaluate(el => getComputedStyle(el).display), 'grid');
    assert.equal(await page.evaluate(() => Number(getComputedStyle(document.documentElement).zoom)), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const tasks = await page.locator('.yixue-task-card').boundingBox(), progress = await page.locator('.yixue-overview').boundingBox();
    assert.ok(progress.x > tasks.x + tasks.width);
    await page.screenshot({ path: 'artifacts/dashboard-app-1440.png', fullPage: true });
});

test('landscape phone remains one column without portrait zoom or horizontal overflow', async t => {
    const page = await fixture(t, { width: 844, height: 390 });
    assert.equal(await page.locator('.yixue-dashboard-columns').evaluate(el => getComputedStyle(el).flexDirection), 'column');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.evaluate(() => Number(getComputedStyle(document.documentElement).zoom)), 1);
});

test('wake lock follows the actual run button, preference, stop, and page disposal', async t => {
    const page = await fixture(t);
    await page.evaluate(() => {
        window.wakeRequests = 0; window.wakeReleases = 0;
        Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { async request() {
            wakeRequests++; const lock = new EventTarget(); lock.released = false;
            lock.release = async () => { wakeReleases++; lock.released = true; lock.dispatchEvent(new Event('release')); }; return lock;
        } } });
    });
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => wakeRequests === 1);
    await page.getByText('已保持亮屏', { exact: true }).waitFor();
    await page.locator('#yixue-option-keepAwake').uncheck();
    await page.waitForFunction(() => wakeReleases === 1);
    await page.locator('#yixue-option-keepAwake').check();
    await page.waitForFunction(() => wakeRequests === 2);
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => wakeReleases === 2);
    await page.getByRole('button', { name: '开始运行', exact: true }).waitFor();
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => wakeRequests === 3);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await page.waitForFunction(() => wakeReleases === 3);
    assert.equal(await page.locator('#yixue-ui-root').count(), 0);
});
