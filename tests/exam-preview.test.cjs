'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
let browser, script;
before(async () => { script = bundle({ testing: true, compact: true }); browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => browser?.close());
const question = id => '<section class="noSplitBx"><input type="hidden" name="answertype' + id + '" value="0"><h3 class="mark_name">' + id + '. 独立考试题干</h3><label><input type="radio" name="q' + id + '">甲</label><label><input type="radio" name="q' + id + '">乙</label></section>';
async function fixture(t, html = '') {
    const page = await browser.newPage(); t.after(() => page.close()); page.setDefaultTimeout(4000);
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>' }));
    await page.goto('https://mooc1.chaoxing.com/exam-ans/exam/test/reVersionTestStartNew?courseId=101&classId=202');
    await page.addScriptTag({ content: script });
    return page;
}

test('exam preparation chooses the labelled preview action and waits for the complete paper', async t => {
    const page = await fixture(t, question(1) + '<div class="sub-button"><a onclick="window.submits++">交卷</a><button id="preview">整卷预览</button></div><div id="paper"></div>');
    const result = await page.evaluate(async html => {
        window.submits = 0; window.previewClicks = 0;
        document.querySelector('#preview').onclick = () => { previewClicks++; setTimeout(() => { document.querySelector('#paper').innerHTML = html; history.replaceState(null, '', '/exam-ans/mooc2/exam/preview?courseId=101'); }, 20); };
        const state = await testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 300 });
        return { state, clicks: previewClicks, submits, questions: testLoad('questions/reader').readQuestions(document).length };
    }, question(2) + question(3));
    assert.equal(result.state.mode, 'preview'); assert.equal(result.clicks, 1); assert.equal(result.submits, 0); assert.equal(result.questions, 3);
});

test('late preview controls are observed without querying the single-question page', async t => {
    const page = await fixture(t, question(1));
    const result = await page.evaluate(async html => {
        window.clicks = 0;
        setTimeout(() => {
            const button = document.createElement('button'); button.textContent = '整卷预览';
            button.onclick = () => { clicks++; document.body.innerHTML = html; history.replaceState(null, '', '/exam/preview'); };
            document.body.append(button);
        }, 20);
        return { state: await testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 300 }), clicks };
    }, question(1) + question(2));
    assert.equal(result.state.mode, 'preview'); assert.equal(result.clicks, 1);
});

test('preview restrictions keep single-question mode and never invoke a disabled or hidden action', async t => {
    const page = await fixture(t, '<div class="mark_info">本考试不允许整卷预览</div><button onclick="window.clicks++">整卷预览</button>' + question(1));
    const result = await page.evaluate(async () => { window.clicks = 0; return { state: await testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 50 }), clicks }; });
    assert.equal(result.state.mode, 'single'); assert.equal(result.clicks, 0);
});

test('a preview action that changes nothing does not continue on the old question', async t => {
    const page = await fixture(t, question(1) + '<button onclick="window.clicks++">整卷预览</button>');
    const result = await page.evaluate(async () => { window.clicks = 0; return { state: await testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 50 }), clicks }; });
    assert.equal(result.state.mode, 'unavailable'); assert.equal(result.clicks, 1);
});

test('stopping while waiting for preview ends promptly without clicking an action', async t => {
    const page = await fixture(t, question(1));
    const result = await page.evaluate(async () => {
        const controller = new AbortController(); setTimeout(() => controller.abort(), 10);
        try { await testLoad('platform/exam-preview').prepareExamPreview(document, { signal: controller.signal, timeoutMs: 500 }); }
        catch (error) { return error.name; }
    });
    assert.equal(result, 'AbortError');
});

test('an already open preview is recognized without another click', async t => {
    const page = await fixture(t, question(1));
    const result = await page.evaluate(async () => {
        history.replaceState(null, '', '/exam-ans/mooc2/exam/preview');
        return testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 100 });
    });
    assert.equal(result.mode, 'preview'); assert.equal(result.switched, false);
});

test('a question option named preview is never treated as an exam navigation control', async t => {
    const page = await fixture(t, question(1) + '<div class="TiMu"><ul><li class="answerBg"><a onclick="window.optionClicks++">整卷预览</a></li></ul></div>');
    const result = await page.evaluate(async () => { window.optionClicks = 0; return { state: await testLoad('platform/exam-preview').prepareExamPreview(document, { timeoutMs: 30 }), optionClicks }; });
    assert.equal(result.state.mode, 'single'); assert.equal(result.optionClicks, 0);
});

test('the app enters preview before sending authenticated API queries using a new prefix-free token', async t => {
    const page = await fixture(t, question(1) + '<button id="preview">整卷预览</button>');
    await page.clock.install();
    await page.evaluate(({ html, version }) => {
        const values = new Map([['shenchanranToken', 'Aa0_-'.repeat(8) + 'Zx9']]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_info = { script: { version } }; window.unsafeWindow = window; window.GM_registerMenuCommand = () => {};
        window.searches = []; window.previewClicks = 0; window.submits = 0;
        window.submitAction = () => submits++;
        document.querySelector('#preview').onclick = () => { previewClicks++; document.body.innerHTML = html; history.replaceState(null, '', '/exam-ans/mooc2/exam/preview'); };
        window.GM_xmlhttpRequest = details => {
            const path = new URL(details.url).pathname;
            if (path.endsWith('.meta.js')) { queueMicrotask(() => details.onerror()); return { abort() {} }; }
            let body = {};
            if (path === '/api/v1/search') { searches.push({ body: JSON.parse(details.data), headers: details.headers, page: location.pathname }); body = { code: 'OK', cost: 0, data: [{ answer: '乙' }] }; }
            if (path === '/api/v1/balance') body = { code: 'OK', cost: 0, data: { points: 10, member: false, member_until: 0, daily_limit: 0, daily_remaining: 0 } };
            queueMicrotask(() => details.onload({ status: 200, responseText: JSON.stringify(body) })); return { abort() { details.onabort?.(); } };
        };
        void testLoad('app').bootstrap();
    }, { html: question(1) + question(2) + question(3), version: require('../src/metadata.json').version });
    for (let i = 0; i < 6; i++) await page.clock.runFor(1000);
    const result = await page.evaluate(() => ({ searches, previewClicks, submits, chosen: document.querySelectorAll('input[type=radio]:checked').length }));
    assert.equal(result.previewClicks, 1); assert.equal(result.searches.length, 3); assert.equal(result.chosen, 3); assert.equal(result.submits, 0);
    assert.ok(result.searches.every(row => row.page.endsWith('/exam/preview') && row.headers['X-Yisou-Client'] === 'yisou-script' && row.body.options.length === 2));
});
