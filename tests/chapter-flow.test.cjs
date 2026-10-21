'use strict';
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const script = readFileSync(process.env.YIXUE_SCRIPT_PATH || path.join(root, 'dist/易学超星学习通助手.user.js'), 'utf8');
const origin = 'https://mooc1.chaoxing.com';
const dashboard = origin + '/mooc-ans/course/yixue-console.html?ut=s&classid=2&courseid=1&cpi=3';
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

for (const scenario of ['submit', 'below-threshold', 'manual']) {
    test('chapter frame applies real DOM answers and ' + scenario + ' uses the host action once', { timeout: 20000 }, async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const errors = [], unexpected = [], searches = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error' && message.text().includes('[易学助手]')) errors.push(message.text()); });
        await context.addInitScript(({ scenario }) => {
            const values = new Map([['yixueQuestionBankBase', 'https://tk.sanzwk.com'], ['yixueApiTokenOrigin', 'https://tk.sanzwk.com'], ['shenchanranToken', 'tk_' + 'A'.repeat(43)], ['doRenwu', false], ['doNoMission', false], ['autoSubmit', scenario !== 'manual'], ['vgqtlv', 85]]);
            globalThis.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
            globalThis.GM_setValue = (key, value) => values.set(key, value);
            globalThis.GM_info = { script: { version: '4.0.0' } };
            globalThis.GM_registerMenuCommand = () => {};
            globalThis.GM_notification = () => {};
            globalThis.GM_addStyle = text => { const style = document.createElement('style'); style.textContent = text; document.head.append(style); };
            globalThis.unsafeWindow = window;
            globalThis.alert = () => {};
            globalThis.GM_xmlhttpRequest = details => {
                const controller = new AbortController();
                fetch(details.url, { method: details.method, headers: details.headers, body: details.data, signal: controller.signal, credentials: 'omit' }).then(async result => details.onload?.({ status: result.status, responseText: await result.text(), finalUrl: result.url }), () => details.onerror?.({}));
                return { abort() { controller.abort(); details.onabort?.({}); } };
            };
        }, { scenario });
        const question = (id, title) => `<div class="Py-mian1"><div class="Py-m1-title fs16">${title}</div><input type="hidden" id="answertype${id}" value="0"><input type="hidden" id="answer${id}" value=""><ul><li class="clearfix" id-param="${id}"><em id-param="A">A.</em><span class="fl after">甲</span></li><li class="clearfix" id-param="${id}"><em id-param="B">B.</em><span class="fl after">乙</span></li></ul></div>`;
        const html = '<!doctype html><html><head><title>章节</title></head><body>' + question('11', '章节第一题') + question('12', '章节第二题') + '<script>window.chapterActions=[];window.toadd=()=>chapterActions.push("prepare");window.submitAction=()=>chapterActions.push("submit");window.noSubmit=()=>chapterActions.push("save");</script></body></html>';
        await context.route('**/*', async route => {
            const request = route.request(), url = new URL(request.url());
            const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
            const json = body => route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(body) });
            if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
            if (url.href === dashboard) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body></body></html>' });
            if (url.href === 'https://yixue-cmg.pages.dev/assets/yixue-logo.png') return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZAAAAABJRU5ErkJggg==', 'base64') });
            if (url.origin === origin) {
                if (url.pathname === '/mycourse/studentstudycourselist') return route.fulfill({ headers, contentType: 'text/html', body: '<h4 id="cur5"><span class="jobUnfinishCount">1</span>章节测验</h4>' });
                if (url.pathname === '/knowledge/cards') return route.fulfill({ headers, contentType: 'text/html', body: url.searchParams.get('num') === '0' ? 'var mArg=' + JSON.stringify({ defaults: { userid: '4' }, attachments: [{ job: true, type: 'workid', jobid: 'work-6', enc: 'mock-proof', property: { workid: '6', title: '章节答题核对' } }] }) + ';' : 'mArg=$mArg;' });
                if (url.pathname === '/work/phone/work') return route.fulfill({ headers, contentType: 'text/html; charset=utf-8', body: html });
            }
            if (url.origin === 'https://tk.sanzwk.com') {
                if (url.pathname === '/api/v1/balance') return json({ code: 'OK', cost: 0, data: { points: 42, member: false, member_until: 0, daily_remaining: 0, daily_limit: 0 } });
                if (url.pathname === '/api/v1/search') {
                    const query = request.postDataJSON(); searches.push(query);
                    return json(scenario === 'below-threshold' && query.title === '章节第二题' ? { code: 'NOT_FOUND', cost: 0, data: [] } : { code: 'OK', cost: 1, data: [{ answer: '乙' }] });
                }
            }
            unexpected.push(request.method() + ' ' + url.href); return route.abort();
        });
        try {
            await page.goto(dashboard);
            await page.addScriptTag({ content: script });
            await page.locator('#yixue-run-course').click();
            await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('任务遍历结束'));
            const frame = page.frames().find(value => value.url().includes('/work/phone/work'));
            assert.ok(frame, 'the genuine host question document is mounted in the dashboard');
            assert.deepEqual(await frame.evaluate(() => window.chapterActions), scenario === 'submit' ? ['prepare', 'submit'] : ['save']);
            assert.equal(await frame.locator('#answer11').inputValue(), 'B');
            assert.equal(await frame.locator('#answer12').inputValue(), scenario === 'below-threshold' ? '' : 'B');
            assert.equal(searches.length, 2);
            assert.ok(searches.every(value => value.type === 'single' && !('fields' in value)));
            assert.match(await page.locator('#yixue-course-log').innerText(), /待核实\s+1\s+项/);
            assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '1');
            assert.deepEqual(errors, []);
            assert.deepEqual(unexpected, []);
        } finally { await context.close(); }
    });
}
