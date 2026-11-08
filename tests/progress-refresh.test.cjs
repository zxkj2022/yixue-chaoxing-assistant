'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const metadata = require('../src/metadata.json');
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => browser?.close());

async function fixture(t, { draft = false, rejectSubmit = false } = {}) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', timezoneId: 'Asia/Shanghai' });
    page.setDefaultTimeout(4000); t.after(() => page.close());
    const quizHtml = '<!doctype html><html><head><meta charset="utf-8"></head><body><section class="noSplitBx"><input name="answertype1" type="hidden" value="0"><h3 class="mark_name">1. 回归测试题</h3><label><input type="radio" name="answer">甲</label><label><input type="radio" name="answer">乙</label></section><script>function toadd(){} function submitAction(){window.parent.submitted++;const xhr=new XMLHttpRequest();xhr.open("POST","/work/submit");xhr.responseType="json";xhr.send();} function noSubmit(){window.parent.saved++;return fetch("/work/save",{method:"POST"});}</script></body></html>';
    await page.route('**/*', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/work/submit' || path === '/work/save') return route.fulfill({ json: { status: path === '/work/save' || !rejectSubmit } });
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: path === '/work/phone/work' ? quizHtml : '<!doctype html><html><head><meta charset="utf-8"><title>状态刷新测试</title></head><body></body></html>' });
    });
    await page.goto('https://mooc1.chaoxing.com/mooc-ans/course/yixue-console.html?courseid=101&classid=202&uid=404');
    await page.clock.install({ time: '2026-11-09T12:00:00+08:00' });
    await page.evaluate(({ draft, version }) => {
        const values = new Map([['yixueLocalToken', 'a'.repeat(32)], ['shenchanranToken', 'Aa0_-'.repeat(8) + 'Zx9']]);
        if (draft) { values.set('autoSubmit', false); values.set('doAI', false); }
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value); window.GM_registerMenuCommand = () => {};
        window.unsafeWindow = window; window.GM_info = { script: { version } };
        window.searchModes = []; window.submitted = 0; window.saved = 0; window.platformComplete = false; window.requestUrls = [];
        window.GM_xmlhttpRequest = details => {
            requestUrls.push(details.url); const url = new URL(details.url); let body;
            if (url.pathname.endsWith('.meta.js')) { queueMicrotask(() => details.onerror()); return { abort() {} }; }
            if (url.pathname === '/mycourse/studentstudycourselist') body = '<div id="cur1"><span class="posCatalog_name">反馈章节</span><span class="jobUnfinishCount">1</span></div>';
            else if (url.pathname === '/knowledge/cards') body = url.searchParams.get('num') === '0' ? '<script>mArg=' + JSON.stringify({ defaults: {}, attachments: [{ type: 'workid', job: true, jobid: 'work-1', property: { workid: '1', name: '反馈测验' }, isPassed: false }] }) + ';</script>' : '<script>mArg=$mArg;</script>';
            else if (url.pathname.endsWith('/tests/data')) body = { data: { total: platformComplete ? 1 : 0, results: platformComplete ? [{ workId: '1', chapterId: '1', statusStr: '待批阅' }] : [] } };
            else if (url.pathname === '/api/v1/search') { searchModes.push(JSON.parse(details.data).use_ai); body = { code: 'OK', cost: 0, data: [{ answer: '乙' }] }; }
            else if (url.pathname === '/api/v1/balance') body = { code: 'OK', cost: 0, data: { points: 20, member: false, member_until: 0, daily_limit: 0, daily_remaining: 0 } };
            else if (url.pathname === '/api/v1/capabilities') body = { code: 'OK', protocol_version: '1', cost: 0, data: { ai: { enabled: false, allowed: false, ready: false, effective_model: null, price_points: null, disabled_reason: 'account_disabled' } } };
            else body = {};
            queueMicrotask(() => details.onload({ status: 200, finalUrl: details.url, responseText: typeof body === 'string' ? body : JSON.stringify(body) }));
            return { abort() { details.onabort?.(); } };
        };
    }, { draft, version: metadata.version });
    await page.addScriptTag({ content: fs.readFileSync('易学·超星学习通助手.user.js', 'utf8') });
    await page.locator('#yixue-run-course').click();
    for (let i = 0; i < 45; i++) {
        await page.clock.runFor(1000);
        if ((await page.locator('.yixue-run-state').innerText()) === '本轮已结束') return page;
    }
    throw new Error('Course did not finish traversal');
}

test('the production app immediately credits a submitted quiz with AI on by default and stale platform counts', async t => {
    const page = await fixture(t);
    assert.equal(await page.locator('#yixue-completed-count').innerText(), '1');
    assert.equal(await page.locator('#yixue-chapter-progress-value').innerText(), '100%');
    assert.equal(await page.getByRole('button', { name: '仅看待核实记录' }).count(), 0);
    await page.getByRole('button', { name: '仅看完成记录' }).click();
    assert.equal(await page.getByText('章节测验提交成功：反馈测验').isVisible(), true);
    assert.deepEqual(await page.evaluate(() => ({ searchModes, submitted, saved })), { searchModes: [true], submitted: 1, saved: 0 });
    assert.equal(await page.evaluate(() => requestUrls.filter(value => new URL(value).pathname === '/mycourse/studentstudycourselist').length), 1);
});

test('a rejected XHR submission keeps the quiz available for review and enters exceptions', async t => {
    const page = await fixture(t, { rejectSubmit: true });
    assert.equal(await page.locator('#yixue-completed-count').innerText(), '0');
    assert.equal(await page.locator('.yixue-chapter-question-view[data-retained=true]').count(), 1);
    await page.getByRole('button', { name: '仅看异常记录' }).click();
    assert.equal(await page.getByText(/提交未成功/).isVisible(), true);
    assert.equal(await page.evaluate(() => submitted), 1);
});

test('manual refresh credits a later submission without repeating queries and keeps a saved AI opt-out', async t => {
    const page = await fixture(t, { draft: true });
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '1');
    assert.match(await page.locator('#yixue-run-summary').innerText(), /跳过 1 项/);
    await page.evaluate(() => { platformComplete = true; });
    await page.getByRole('button', { name: '刷新课程进度（不重新执行任务）' }).click();
    for (let i = 0; i < 10; i++) { await page.clock.runFor(1000); if (await page.locator('#yixue-unconfirmed-count').innerText() === '0') break; }
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '0');
    assert.deepEqual(await page.evaluate(() => ({ searchModes, submitted, saved })), { searchModes: [false], submitted: 0, saved: 1 });
});
