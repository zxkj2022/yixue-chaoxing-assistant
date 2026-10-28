'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
const metadata = require('../src/metadata.json');
let browser, code;
before(async () => { code = bundle({ testing: true, compact: true }); browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });
async function install(frame, { captureFrames = false, apiToken = false } = {}) {
    await frame.evaluate(({ metadata, apiToken }) => {
        const values = new Map([['yixueLocalToken', 'a'.repeat(32)]]);
        if (apiToken) values.set('shenchanranToken', 'ys_' + 'a'.repeat(40));
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.auditMenus = [];
        window.GM_registerMenuCommand = (name, handler) => auditMenus.push({ name, handler });
        window.GM_info = { script: { version: metadata.version } }; window.unsafeWindow = window;
        window.auditRequests = []; window.auditAborts = 0; window.bootErrors = []; window.auditSearches = 0;
        window.GM_xmlhttpRequest = details => {
            if (details.url === metadata.updateURL) queueMicrotask(() => details.onerror());
            else if (apiToken && /\.sanzwk\.com\//.test(details.url)) {
                let body = {};
                if (details.url.endsWith('/search')) { auditSearches++; body = { code: 'OK', protocol_version: '1', data: [{ answer: '甲', answer_format: 'text' }], cost: 1, bucket: 'points' }; }
                if (details.url.endsWith('/balance')) body = { code: 'OK', cost: 0, data: { points: 10, member: false, member_until: 0, daily_limit: 0, daily_remaining: 0 } };
                queueMicrotask(() => details.onload({ status: 200, responseText: JSON.stringify(body) }));
            } else auditRequests.push(details.url);
            return { abort() { auditAborts++; details.onabort?.(); } };
        };
    }, { metadata, apiToken });
    await frame.addScriptTag({ content: code });
    if (captureFrames) await frame.evaluate(() => {
        testLoad('platform/course-engine').createCourseRunner = ({ questions }) => ({ run: async () => { window.auditQuestions = questions; } });
    });
    await frame.evaluate(() => { void testLoad('app').bootstrap().catch(error => bootErrors.push(error.message)); });
}
async function fixture(t, { entry = false, frame = false, http = false } = {}) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.setDefaultTimeout(2000); t.after(() => page.close());
    const route = entry ? '/mooc-ans/mycourse/stu' : '/mooc-ans/course/yixue-console.html';
    const origin = (http ? 'http' : 'https') + '://mooc1.chaoxing.com';
    const path = route + '?courseid=101&classid=202&uid=404';
    await page.route('**/*', request => request.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><title>运行稳定性测试</title></head><body>' + (new URL(request.request().url()).pathname === '/wrapper' ? '<iframe src="' + path + '"></iframe>' : '<main>课程测试</main>') + '</body></html>' }));
    await page.goto(origin + (frame ? '/wrapper' : path));
    return { page, target: frame ? page.frames()[1] : page };
}

test('HTTP course frames can claim an entry surface without crypto.randomUUID', async t => {
    const { target } = await fixture(t, { entry: true, frame: true, http: true });
    assert.equal(await target.evaluate(() => typeof crypto.randomUUID), 'undefined');
    await install(target);
    await target.locator('#yixue-entry').waitFor({ state: 'visible' });
    assert.deepEqual(await target.evaluate(() => bootErrors), []);
});

test('retained quiz pages are bounded without discarding answers awaiting review', async t => {
    const { page } = await fixture(t); await install(page, { captureFrames: true });
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => Boolean(window.auditQuestions));
    const result = await page.evaluate(async () => {
        const signal = new AbortController().signal;
        for (let i = 0; i < 3; i++) {
            const quiz = await auditQuestions.openPage('/work/phone/work?workId=' + i, { signal });
            quiz.document.body.textContent = '待核对答案 ' + i; quiz.retain();
        }
        let error;
        try { await auditQuestions.openPage('/work/phone/work?workId=4', { signal }); }
        catch (failure) { error = { message: failure.message, stopCourse: failure.stopCourse }; }
        return { error, count: document.querySelectorAll('.yixue-chapter-question-view iframe').length, retained: Array.from(document.querySelectorAll('.yixue-chapter-question-view iframe')).map(frame => frame.contentDocument.body.textContent) };
    });
    assert.equal(result.count, 3);
    assert.equal(result.error?.stopCourse, true);
    assert.match(result.error.message, /核对/);
    assert.deepEqual(result.retained, ['待核对答案 0', '待核对答案 1', '待核对答案 2']);
});

test('restoring an exam keeps existing answers and requires an explicit new query', async t => {
    const { page } = await fixture(t);
    await page.evaluate(() => {
        history.replaceState(null, '', '/exam/preview');
        document.body.innerHTML = '<div class="TiMu"><input name="answertype1" type="hidden" value="0"><h3 class="Zy_TItle">测试题</h3><label><input type="radio" name="q">甲</label><label><input type="radio" name="q">乙</label></div>';
    });
    await install(page, { apiToken: true });
    await page.waitForFunction(() => document.querySelector('.yixue-question-summary')?.textContent.includes('已填 1'));
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    const resume = page.getByRole('button', { name: '查询当前页面', exact: true }); await resume.waitFor();
    assert.equal(await page.evaluate(() => auditSearches), 1);
    assert.equal(await page.locator('input[name="q"]').first().isChecked(), true);
    await resume.click();
    await page.waitForFunction(() => auditSearches === 2);
    assert.deepEqual(await page.evaluate(() => bootErrors), []);
});

test('a known concurrent script in a same-origin ancestor blocks a course frame', async t => {
    const { page, target } = await fixture(t, { frame: true });
    await page.evaluate(() => { const node = document.createElement('div'); node.id = 'abc-helper-root'; document.body.append(node); node.attachShadow({ mode: 'open' }); });
    await install(target);
    await target.getByRole('alertdialog', { name: '网课脚本冲突，已阻止运行' }).waitFor();
    assert.equal(await target.locator('#yixue-course-dashboard').count(), 0);
});

for (const entry of [true, false]) test('cached navigation restores one usable surface without restarting course work: entry=' + entry, async t => {
    const { page } = await fixture(t, { entry });
    await install(page);
    const selector = entry ? '#yixue-entry' : '#yixue-course-dashboard';
    await page.locator(selector).waitFor();
    if (!entry) {
        await page.locator('#yixue-run-course').click();
        await page.waitForFunction(() => auditRequests.length === 1);
    }
    for (let round = 0; round < 3; round++) {
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await page.locator(selector).waitFor({ state: 'visible' });
        assert.equal(await page.locator('#yixue-ui-root').count(), 1);
        assert.equal(await page.locator('#yixue-script-conflict').count(), 0);
        if (!entry) assert.equal(await page.locator('#yixue-run-course').innerText(), '开始运行');
    }
    assert.equal(await page.evaluate(() => auditRequests.length), entry ? 0 : 1);
    assert.deepEqual(await page.evaluate(() => bootErrors), []);
    assert.equal(await page.evaluate(() => auditMenus.length), 1);
    await page.evaluate(() => { void auditMenus[0].handler(); });
    await page.locator('#yixue-token-dialog').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '取消', exact: true }).last().click();
    if (!entry) assert.equal(await page.locator('link[rel="icon"]').count(), 1);
    if (!entry) {
        await page.locator('#yixue-run-course').click();
        await page.waitForFunction(() => auditRequests.length === 2);
    }
});

test('long log bursts retain only bounded recent messages and keep filtering usable', async t => {
    const { page } = await fixture(t);
    await install(page);
    await page.locator('#yixue-course-dashboard').waitFor();
    const result = await page.evaluate(() => {
        const view = testLoad('ui/task-log')(document); document.body.append(view.log, view.toolbar, view.count);
        for (let i = 0; i < 1200; i++) view.append(i + ':' + '日志'.repeat(5000), i % 2 ? 'error' : 'info');
        view.toolbar.querySelector('[aria-label="仅看异常记录"]').click();
        return { count: view.log.childElementCount, first: view.log.firstElementChild.textContent.slice(0, 30), last: view.log.lastElementChild.textContent.slice(0, 30), longest: Math.max(...Array.from(view.log.children, node => node.textContent.length)), shown: Array.from(view.log.children).filter(node => !node.hidden).length, label: view.count.textContent };
    });
    assert.equal(result.count, 500);
    assert.match(result.first, /700:/); assert.match(result.last, /1199:/);
    assert.ok(result.longest < 4200);
    assert.equal(result.shown, 250); assert.equal(result.label, '250 / 500 条记录');
});

test('unrelated websites stay untouched even when their path and DOM resemble an exam', async t => {
    const { page } = await fixture(t);
    await page.goto('https://www.sensenova.cn/exam/preview');
    await page.evaluate(() => { document.body.innerHTML = '<div class="TiMu"><input name="answertype1" value="0"><h3 class="Zy_TItle">测试题</h3><label><input type="radio" name="q">甲</label></div>'; });
    await install(page, { apiToken: true });
    assert.equal(await page.locator('#yixue-ui-root').count(), 0);
    assert.equal(await page.evaluate(() => auditSearches), 0);
    assert.equal(await page.evaluate(() => auditMenus.length), 0);
    assert.equal(await page.locator('input[name="q"]').isChecked(), false);
});
