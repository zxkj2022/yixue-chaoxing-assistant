const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const source = readFileSync(process.env.YIXUE_SCRIPT_PATH || path.join(root, readdirSync(root).find(name => name.endsWith('.txt.js'))), 'utf8');
const version = source.match(/^\/\/ @version\s+(\S+)/m)[1];
const origin = 'https://mooc1.chaoxing.com';
// Deliberately no UID cookie, uid query parameter, userId input, or ServerHost.
const dashboardUrl = `${origin}/mooc-ans/course/yixue-console.html?ut=s&classid=202&courseid=101&cpi=303&coursename=Engine`;
let browser;

before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

async function fixture(t, options = {}) {
    if (typeof options === 'string') options = { failure: options };
    const { failure = '', format = 'wrapped', scenario = '' } = options;
    const context = await browser.newContext();
    context.setDefaultTimeout(5000);
    const page = await context.newPage();
    const errors = [];
    const unexpectedNetwork = [];
    page.on('pageerror', error => errors.push(error.message));
    t.after(async () => {
        const state = await page.evaluate(() => globalThis.engineFixture).catch(() => null);
        await context.close();
        assert.deepEqual(unexpectedNetwork, [], 'no unmocked browser requests are allowed');
        assert.deepEqual(state?.unexpected || [], [], 'no unmocked GM or XHR requests are allowed');
        assert.deepEqual([...errors, ...(state?.rejections || [])], [], 'engine failures must not become uncaught exceptions');
    });

    // Real network access is impossible: only the initial empty dashboard is served.
    await page.route('**/*', route => {
        const request = route.request();
        if (request.url() === 'https://yixue-cmg.pages.dev/assets/yixue-logo.png') {
            return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64') });
        }
        if (request.isNavigationRequest() && request.url() === dashboardUrl) {
            return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><title>Engine</title></head><body></body></html>' });
        }
        unexpectedNetwork.push(request.method() + ' ' + request.url());
        return route.abort('blockedbyclient');
    });
    await context.addInitScript(({ version, origin, failure, format, scenario }) => {
        const originalTimeout = globalThis.setTimeout.bind(globalThis);
        // Shorten simulated video heartbeats/document waits only; no real study time is reported.
        const fastPages = ['empty-cards', 'non-job-pages'].includes(scenario);
        globalThis.setTimeout = (callback, delay, ...args) => originalTimeout(callback, ([5000, 10000, 60000].includes(Number(delay)) || (fastPages && delay >= 1 && delay <= 4000)) ? 1 : delay, ...args);
        const state = globalThis.engineFixture = { requests: [], unexpected: [], rejections: [], alerts: [], catalogs: 0, reports: 0, liveReports: 0, executed: false };
        const initialValues = [
            ['yixueQuestionBankBase', 'https://tk.sanzwk.com'],
            ['yixueLocalToken', 'ab'.repeat(16)], ['shenchanranToken', ''],
            ['doRenwu', false], ['doNoMission', scenario === 'non-job-pages'], ['doVideo', !scenario.startsWith('class-')], ['doDocument', true],
        ];
        const values = new Map(JSON.parse(sessionStorage.getItem('__engineGM') || 'null') || initialValues);
        globalThis.GM_getValue = (key, fallback) => structuredClone(values.has(key) ? values.get(key) : fallback);
        globalThis.GM_setValue = (key, value) => {
            values.set(key, structuredClone(value));
            sessionStorage.setItem('__engineGM', JSON.stringify([...values]));
        };
        globalThis.GM_info = { script: { version }, scriptHandler: 'ScriptCat', version: '1.0.0' };
        globalThis.GM_registerMenuCommand = () => {};
        globalThis.GM_notification = () => {};
        globalThis.GM_addStyle = text => { const element = document.createElement('style'); element.textContent = text; document.documentElement.append(element); };
        globalThis.unsafeWindow = window;
        globalThis.alert = text => state.alerts.push(String(text));
        globalThis.confirm = () => false;
        globalThis.addEventListener('unhandledrejection', event => state.rejections.push(String(event.reason?.message || event.reason)));
        if (scenario === 'lifecycle') {
            const sets = { storage: new Set(), visibilitychange: new Set() };
            state.activeListeners = { storage: 0, visibilitychange: 0 };
            const proto = EventTarget.prototype;
            const add = proto.addEventListener, remove = proto.removeEventListener;
            proto.addEventListener = function (type, callback, options) {
                if ((this === window && type === 'storage') || (this === document && type === 'visibilitychange')) {
                    sets[type].add(callback); state.activeListeners[type] = sets[type].size;
                }
                return add.call(this, type, callback, options);
            };
            proto.removeEventListener = function (type, callback, options) {
                if ((this === window && type === 'storage') || (this === document && type === 'visibilitychange')) {
                    sets[type].delete(callback); state.activeListeners[type] = sets[type].size;
                }
                return remove.call(this, type, callback, options);
            };
            state.audioPlays = 0; state.titleTimers = 0;
            globalThis.Audio = class { play() { state.audioPlays++; return Promise.resolve(); } pause() {} };
            const active = new Set(), startInterval = window.setInterval.bind(window), stopInterval = window.clearInterval.bind(window);
            globalThis.setInterval = (callback, delay, ...args) => {
                const timer = startInterval(callback, delay, ...args);
                if (Number(delay) === 1300) active.add(timer);
                state.titleTimers = active.size;
                return timer;
            };
            globalThis.clearInterval = timer => { active.delete(timer); state.titleTimers = active.size; stopInterval(timer); };
        }
        const login = '<!doctype html><html><head><title>用户登录</title></head><body>会话失效</body></html>';
        function response(status, body, finalUrl) {
            const text = typeof body === 'string' ? body : JSON.stringify(body);
            return { status, responseText: text, response: text, finalUrl };
        }
        function dispatch(details, transport = 'GM') {
            const url = new URL(details.url, location.href);
            state.requests.push({ transport, url: url.href, method: details.method || 'GET', headers: details.headers || {} });
            if (scenario === 'live-viewer-failure' && url.origin === 'https://zhibo.chaoxing.com') {
                if (url.pathname === '/1234567890123456') return response(200, `<script>var lineVideo = {"videoLongtime":11}; var videoPlayStartTime = 0; var viewerUrl = "https://zhibo.chaoxing.com/viewer?token=a%3Db&courseId=101"; var uInfo = "${'a'.repeat(32)}";</script>`, url.href);
                if (url.pathname === '/viewer') return response(503, 'Viewer unavailable', url.href);
            }
            if (scenario.startsWith('live-invalid-') || scenario === 'live-negative-viewtime') {
                if (url.origin === 'https://zhibo.chaoxing.com' && url.pathname === '/1234567890123456') return response(200, '<p>Legacy replay</p>', url.href);
            }
            if (scenario === 'non-job-pages' && url.origin === 'https://stat2-ans.chaoxing.com' && url.pathname === '/stat2/chapter-exam/s/tests/data') {
                if (Number(url.searchParams.get('page')) > 150) { state.unexpected.push('non-job pagination exceeded fixture safety limit'); return { error: true }; }
                return response(200, { data: { results: [{ isNonJob: false }] } }, url.href);
            }
            if (scenario.startsWith('class-') && url.origin === 'https://k.chaoxing.com') {
                if (url.pathname === '/apis/chapter/getMeetReview4Job') return response(200, { data: [{ duration: 11, userTime: scenario === 'class-negative-time' ? -20 : 0, dataKey: 'class-data-key' }] }, url.href);
                if (url.pathname === '/apis/chapter/addReviewDot4Job') {
                    state.liveReports++;
                    return response(200, scenario === 'class-failure' ? { result: false, msg: 'failed' } : { result: true, msg: 'success' }, url.href);
                }
            }
            if (url.origin !== origin) {
                state.unexpected.push(transport + ' ' + url.href);
                return { error: true };
            }
            if (url.pathname === '/ananas/ueditor/ueditor.parse.js') return response(200, 'modules/video/index.html?v=2025-0725-1842', url.href);
            if (url.pathname === '/mycourse/studentstudycourselist') {
                if (transport === 'XHR' && failure === 'login') return response(200, login, `${origin}/login`);
                state.catalogs++;
                if (state.catalogs === 1) {
                    if (failure === 'http') return response(503, 'Temporarily unavailable', url.href);
                    if (failure === 'network') return { error: true };
                    if (failure === 'login') return response(200, login, 'https://passport2.chaoxing.com/login');
                }
                if (['challenge-empty', 'lifecycle', 'non-job-pages'].includes(scenario)) return response(200, '<p>无章节</p>', url.href);
                return response(200, '<h4 id="cur505"><span class="jobUnfinishCount">2</span>测试章节</h4>', url.href);
            }
            if (url.pathname === '/knowledge/cards') {
                if (scenario === 'empty-cards') {
                    if (Number(url.searchParams.get('num')) > 20) { state.unexpected.push('empty card pagination exceeded fixture safety limit'); return { error: true }; }
                    return response(200, '<script>var mArg = {"defaults":{},"attachments":[]};</script>', url.href);
                }
                if (url.searchParams.get('num') === '1') return response(200, 'mArg = $mArg;', url.href);
                if (url.searchParams.get('num') !== '0') {
                    state.unexpected.push('unexpected card page: ' + url.href);
                    return { error: true };
                }
                if (format === 'empty') return response(200, '<script>mArg\n = \n $mArg ;</script>', url.href);
                if (format === 'invalid-json') return response(200, '<script>mArg = (globalThis.engineFixture.executed = true, {"defaults":{},"attachments":[]});</script>', url.href);
                if (format === 'invalid-shape') return response(200, '<script>mArg = {"defaults":null,"attachments":[]};</script>', url.href);
                const data = {
                    defaults: { userid: scenario === 'missing-uid' ? undefined : '404', fid: '1', reportUrl: `${origin}/multimedia/log/a`, note: 'JSON string containing }; catch(error) { mArg = {}' },
                    attachments: [
                        { job: true, type: 'video', jobid: 'video-606', otherInfo: 'courseId_101', property: { objectid: 'object-606', name: 'UID回退视频', module: 'video', rt: '0.9' } },
                        { job: true, type: 'document', jobid: 'document-707', jtoken: 'document-token', property: { name: '后续文档' } },
                    ],
                };
                if (scenario === 'live-disabled') data.attachments.splice(0, 1,
                    { job: true, type: 'live', jobid: 'live-808', property: { title: '关闭的直播', liveid: 'live-808', module: 'live' } },
                    { job: true, type: 'chaoxingClass', jobid: 'class-909', property: { title: '关闭的课堂直播', uuid: 'class-909' } },
                );
                if (scenario.startsWith('class-')) data.attachments.splice(0, 1,
                    { job: true, type: 'chaoxingClass', jobid: 'class-909', property: { title: '课堂直播回归', uuid: 'class-909' } },
                );
                if (scenario === 'live-viewer-failure') data.attachments.splice(0, 1,
                    { job: true, type: 'live', jobid: 'live-808', property: { title: '直播入口失败', liveId: '1234567890123456', streamName: 'stream-808', vdoid: 'video-808', rt: '0.9' } },
                );
                if (scenario.startsWith('live-invalid-') || scenario === 'live-negative-viewtime') data.attachments.splice(0, 1,
                    { job: true, type: 'live', jobid: 'live-808', property: { title: '非法直播参数', liveId: '1234567890123456', rt: scenario === 'live-invalid-rt' ? 'Infinity' : '0.9', streamName: 'stream-808', vdoid: 'video-808' } },
                );
                if (scenario === 'invalid-attachments') data.attachments.splice(0, 1, null, { job: true, type: 'video', jobid: 'invalid-606' });
                if (format === 'multiline-error') return response(200, `<script>try { const mArg = ${JSON.stringify(data, null, 2)}; } catch(error) {}</script>`, url.href);
                if (format === 'plain') return response(200, `<script>var mArg = ${JSON.stringify(data)};</script>`, url.href);
                return response(200, `<script>try { var mArg = ${JSON.stringify(data)}; } catch(e) {}</script>`, url.href);
            }
            if (url.pathname === '/ananas/status/object-606') return response(200, { status: 'success', duration: 1, objectid: 'object-606', dtoken: 'video-token' }, url.href);
            if (scenario === 'live-viewer-failure' && url.pathname === '/ananas/live/liveinfo') return response(200, { temp: { data: { liveStatus: 4, ifReview: 0, duration: 11, timeLongValue: 0 } } }, url.href);
            if ((scenario.startsWith('live-invalid-') || scenario === 'live-negative-viewtime') && url.pathname === '/ananas/live/liveinfo') return response(200, { temp: { data: { liveStatus: 4, ifReview: 0, duration: scenario === 'live-invalid-duration' ? 'Infinity' : 11, timeLongValue: scenario === 'live-negative-viewtime' ? -3 : 0 } } }, url.href);
            if (url.pathname === '/multimedia/log/a/video-token') {
                state.reports++;
                if (scenario === 'report-retry' && state.reports === 1) return response(503, 'Retry this same heartbeat', url.href);
                const isPassed = scenario !== 'video-unconfirmed' && url.searchParams.get('playingTime') === '1';
                return response(200, { isPassed }, url.href);
            }
            if (url.pathname === '/ananas/job/document') return response(200, { status: true }, url.href);
            state.unexpected.push(transport + ' ' + url.href);
            return { error: true };
        }
        globalThis.GM_xmlhttpRequest = details => {
            const result = dispatch(details);
            originalTimeout(() => {
                if (result.error) details.onerror?.({ error: 'offline-fixture' });
                else details.onload?.(result);
            }, 0);
            return { abort() {} };
        };
        // Explicitly model the same-origin fallback; a login page must never silently pass as a catalog.
        globalThis.XMLHttpRequest = class {
            static DONE = 4;
            open(method, url) { this.details = { method, url, headers: {} }; }
            setRequestHeader(key, value) { this.details.headers[key] = value; }
            send(body) {
                this.details.data = body;
                const result = dispatch(this.details, 'XHR');
                originalTimeout(() => {
                    if (result.error) return this.onerror?.(new Error('offline-fixture'));
                    this.readyState = 4; this.status = result.status; this.responseText = result.responseText;
                    this.responseURL = result.finalUrl; this.onreadystatechange?.(); this.onload?.();
                }, 0);
            }
        };
    }, { version, origin, failure, format, scenario });
    await page.goto(dashboardUrl);
    await page.addScriptTag({ content: source });
    await page.locator('#yixue-run-course').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('脚本初始化成功'));
    return {
        page,
        state: () => page.evaluate(() => globalThis.engineFixture),
        reload: async () => {
            await page.reload();
            await page.addScriptTag({ content: source });
            await page.locator('#yixue-run-course').waitFor({ state: 'visible' });
            await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('脚本初始化成功'));
        },
    };
}

async function assertCompletedSequence(page, state, expectedTimes = ['0', '1']) {
    await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('文档任务完成：后续文档'), null, { timeout: 15000 });
    const result = await state();
    const requests = result.requests.map(item => ({ ...item, parsed: new URL(item.url) }));
    const reports = requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token');
    assert.equal(reports.length, expectedTimes.length, 'video retries failed heartbeats and waits for confirmation before the document runs');
    for (const item of reports) {
        assert.equal(item.parsed.searchParams.get('userid'), '404', 'UID comes from mArg.defaults.userid when cookies, URL, and page inputs contain none');
        const playTime = item.parsed.searchParams.get('playingTime');
        const expected = createHash('md5').update(`[202][404][video-606][object-606][${Number(playTime) * 1000}][d_yHJ!$pdA~5][1000][0_1]`).digest('hex');
        assert.equal(item.parsed.searchParams.get('enc'), expected, 'the progress signature also uses the recovered UID');
    }
    assert.deepEqual(reports.map(item => item.parsed.searchParams.get('playingTime')), expectedTimes);
    const documentIndex = requests.findIndex(item => item.parsed.pathname === '/ananas/job/document');
    assert.ok(documentIndex > requests.indexOf(reports.at(-1)), 'document runs after the server confirms the video');
    assert.equal(requests[documentIndex].parsed.searchParams.get('jobid'), 'document-707');
    assert.equal(requests[documentIndex].parsed.searchParams.get('jtoken'), 'document-token');
    const catalog = requests.find(item => item.parsed.pathname === '/mycourse/studentstudycourselist').parsed;
    assert.equal(catalog.searchParams.get('courseId'), '101');
    assert.equal(catalog.searchParams.get('clazzid'), '202');
    const cards = requests.filter(item => item.parsed.pathname === '/knowledge/cards');
    assert.ok(cards.length >= 1);
    for (const card of cards) {
        assert.equal(card.parsed.searchParams.get('courseid'), '101');
        assert.equal(card.parsed.searchParams.get('clazzid'), '202');
        assert.equal(card.parsed.searchParams.get('knowledgeid'), '505');
        assert.equal(card.parsed.searchParams.get('cpi'), '303');
        const referer = new URL(card.headers.Referer);
        assert.equal(referer.searchParams.get('chapterId'), '505');
    }
    assert.match(await page.locator('#yixue-course-log').innerText(), /视频任务完成：UID回退视频/);
}

test('video recovers UID from cards defaults and continues to the next document', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t);
    await page.locator('#yixue-run-course').click();
    await assertCompletedSequence(page, state);
    await completedLog(page);
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '0', 'a chapter with every task confirmed no longer remains unconfirmed');
});

for (const failure of ['http', 'network', 'login']) {
    test(`catalog ${failure} failure is visible and retryable without uncaught exceptions`, { timeout: 25000 }, async t => {
        const { page, state } = await fixture(t, failure);
        await page.locator('#yixue-course-log').evaluate(element => { element.textContent = ''; });
        await page.locator('#yixue-run-course').click();
        await page.waitForFunction(() => {
            const log = document.querySelector('#yixue-course-log')?.textContent || '';
            return /目录|章节/.test(log) && /失败|登录|重试/.test(log);
        });
        assert.equal(page.url(), dashboardUrl, 'failed catalog requests leave the user on the dashboard');
        assert.doesNotMatch(await page.locator('#yixue-course-log').innerText(), /所有任务已完成/, 'a failure is never reported as successful completion');
        const retry = page.locator('#yixue-run-course');
        await retry.waitFor({ state: 'visible' });
        assert.equal(await retry.isEnabled(), true, 'the normal start button can retry after failure');
        await retry.click();
        await page.waitForFunction(() => globalThis.engineFixture.catalogs >= 2);
        await assertCompletedSequence(page, state);
    });
}

for (const format of ['multiline-error', 'plain']) {
    test(`mArg ${format} JSON assignment runs video and document without executing page code`, { timeout: 25000 }, async t => {
        const { page, state } = await fixture(t, { format });
        await page.locator('#yixue-run-course').click();
        await assertCompletedSequence(page, state);
        assert.equal((await state()).executed, false);
    });
}

async function completedLog(page) {
    await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('任务遍历结束'), null, { timeout: 15000 });
    return page.locator('#yixue-course-log').innerText();
}

test('mArg whitespace no-task sentinel ends the chapter without a parsing failure', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { format: 'empty' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    assert.match(log, /已确认完成\s+0\s+项/);
    assert.doesNotMatch(log, /章节读取异常|无法获取章节内容|解析.*失败/);
    assert.equal((await state()).reports, 0);
});

for (const format of ['invalid-json', 'invalid-shape']) {
    test(`mArg ${format} is rejected without evaluating data or claiming completion`, { timeout: 25000 }, async t => {
        const { page, state } = await fixture(t, { format });
        await page.locator('#yixue-run-course').click();
        const log = await completedLog(page);
        const result = await state();
        assert.equal(result.executed, false, 'card data is parsed as JSON, never evaluated as JavaScript');
        assert.equal(result.reports, 0);
        assert.match(log, /已确认完成\s+0\s+项/);
        assert.match(log, /章节读取异常|无法获取章节内容|解析.*失败/);
        assert.doesNotMatch(log, /所有任务已完成|视频任务完成|文档任务完成/);
    });
}

test('failed video heartbeat is retried with the same playingTime before advancing', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'report-retry' });
    await page.locator('#yixue-run-course').click();
    await assertCompletedSequence(page, state, ['0', '0', '1']);
});

test('video lacking server confirmation is failed while the following document completes', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'video-unconfirmed' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    assert.equal((await state()).reports, 2);
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /已确认完成\s+1\s+项/);
    assert.match(log, /失败\s+1\s+项/);
    assert.doesNotMatch(log, /所有任务已完成|视频任务完成：UID回退视频/);
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '1', 'a chapter with an unconfirmed video stays in the unconfirmed count');
});

test('missing UID blocks video requests and counts a failure while documents can continue', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'missing-uid' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    const result = await state();
    assert.equal(result.requests.filter(item => new URL(item.url).pathname.startsWith('/ananas/status/')).length, 0);
    assert.equal(result.reports, 0);
    assert.match(log, /用户\s*ID.*未执行/);
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /已确认完成\s+1\s+项/);
    assert.match(log, /失败\s+1\s+项/);
    assert.doesNotMatch(log, /所有任务已完成|视频任务完成：UID回退视频/);
});

test('doLive disabled skips live and chaoxingClass without network access and continues documents', { timeout: 25000 }, async t => {
    const { page, state, reload } = await fixture(t, { scenario: 'live-disabled' });
    const liveSwitch = page.getByRole('switch', { name: '直播任务', exact: true });
    const videoSwitch = page.getByRole('switch', { name: '视频任务', exact: true });
    assert.equal(await page.evaluate(() => GM_getValue('doLive', null)), null, 'no saved setting exists initially');
    assert.equal(await liveSwitch.getAttribute('aria-checked'), 'true', 'live tasks default to enabled');
    await liveSwitch.click();
    await page.waitForFunction(() => document.querySelector('#doLive').getAttribute('aria-checked') === 'false');
    assert.equal(await page.evaluate(() => GM_getValue('doLive')), false, 'the interaction saves the disabled state');
    assert.equal(await videoSwitch.getAttribute('aria-checked'), 'true', 'turning live off leaves video enabled');
    assert.equal(await page.evaluate(() => GM_getValue('doVideo')), true);
    await reload();
    assert.equal(await liveSwitch.getAttribute('aria-checked'), 'false', 'disabled state is restored after a page reload');
    assert.equal(await videoSwitch.getAttribute('aria-checked'), 'true');
    await liveSwitch.click();
    await page.waitForFunction(() => document.querySelector('#doLive').getAttribute('aria-checked') === 'true');
    assert.equal(await page.evaluate(() => GM_getValue('doLive')), true);
    await liveSwitch.click();
    await page.waitForFunction(() => document.querySelector('#doLive').getAttribute('aria-checked') === 'false');
    assert.equal(await page.evaluate(() => GM_getValue('doLive')), false);
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    const result = await state();
    assert.equal(result.requests.filter(item => !['/mycourse/studentstudycourselist', '/knowledge/cards', '/ananas/ueditor/ueditor.parse.js', '/ananas/job/document'].includes(new URL(item.url).pathname)).length, 0);
    assert.match(log, /关闭的直播/);
    assert.match(log, /关闭的课堂直播/);
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /已确认完成\s+1\s+项/);
    assert.match(log, /跳过\s+2\s+项/);
    assert.match(log, /失败\s+0\s+项/);
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '1', 'skipped live tasks leave the chapter unconfirmed');
});

for (const scenario of ['class-success', 'class-failure']) {
    test(`chaoxingClass ${scenario} runs independently of video and leaves an accurate outcome`, { timeout: 25000 }, async t => {
        const { page, state } = await fixture(t, { scenario });
        await page.locator('#yixue-run-course').click();
        const log = await completedLog(page);
        const result = await state();
        const requests = result.requests.map(item => new URL(item.url));
        const review = requests.filter(url => url.hostname === 'k.chaoxing.com');
        const uploads = review.filter(url => url.pathname === '/apis/chapter/addReviewDot4Job');
        assert.equal(review.filter(url => url.pathname === '/apis/chapter/getMeetReview4Job').length, 1);
        assert.equal(requests.filter(url => url.pathname.startsWith('/ananas/status/')).length, 0, 'class replay runs with the video switch off');
        for (const upload of uploads) {
            assert.equal(upload.searchParams.get('uuid'), 'class-909');
            assert.equal(upload.searchParams.get('dataKey'), 'class-data-key');
        }
        assert.match(log, /文档任务完成：后续文档/);
        assert.match(log, /已确认完成\s+1\s+项/, 'only the document is confirmed, progress upload is not a passed task');
        assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '1', 'pending or failed replay tasks leave the chapter unconfirmed');
        assert.doesNotMatch(log, /所有任务已完成|课堂直播任务完成/);
        if (scenario === 'class-success') {
            assert.deepEqual(uploads.map(url => url.searchParams.get('lastWatchTime')), ['10', '11']);
            assert.match(log, /回放进度已上传/);
            assert.match(log, /待核实\s+1\s+项/);
            assert.match(log, /失败\s+0\s+项/);
        } else {
            assert.deepEqual(uploads.map(url => url.searchParams.get('lastWatchTime')), ['10', '10', '10']);
            assert.match(log, /连续失败三次/);
            assert.match(log, /失败\s+1\s+项/);
            assert.match(log, /待核实\s+0\s+项/);
        }
        assert.ok(requests.findIndex(url => url.pathname === '/ananas/job/document') > requests.lastIndexOf(uploads.at(-1)), 'the following document still executes after the replay branch ends');
    });
}

test('challenge enables all task switches in storage, classes, and accessibility state', { timeout: 20000 }, async t => {
    const { page } = await fixture(t, { scenario: 'challenge-empty' });
    const keys = ['doVideo', 'doDocument', 'doWork', 'doLive'];
    for (const key of keys) {
        assert.equal(await page.locator(`#${key}`).getAttribute('aria-checked'), 'true');
        await page.locator(`#${key}`).click();
        await page.waitForFunction(key => document.getElementById(key).getAttribute('aria-checked') === 'false', key);
        assert.equal(await page.evaluate(key => GM_getValue(key), key), false);
    }
    await page.locator('#yixue-run-challenge').click();
    await page.waitForFunction(() => document.querySelector('#yixue-run-course').disabled === false);
    for (const key of keys) {
        assert.equal(await page.evaluate(key => GM_getValue(key), key), true);
        assert.equal(await page.locator(`#${key}`).getAttribute('aria-checked'), 'true', key + ' reflects challenge auto-enablement');
        assert.match(await page.locator(`#${key}`).getAttribute('class'), /\bbtn-primary\b/);
    }
    const modalButton = page.locator('.alert .button');
    if (await modalButton.isVisible()) await modalButton.click();
    await page.locator('#doLive').click();
    await page.waitForFunction(() => document.querySelector('#doLive').getAttribute('aria-checked') === 'false');
    assert.equal(await page.evaluate(() => GM_getValue('doLive')), false, 'one click after challenge disables the enabled setting');
});

test('live viewer without watchMoment preserves its URL and failed initialization stops progress reports', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'live-viewer-failure' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    const requests = (await state()).requests.map(item => new URL(item.url));
    const viewers = requests.filter(url => url.origin === 'https://zhibo.chaoxing.com' && url.pathname === '/viewer');
    assert.equal(viewers.length, 1, 'the existing viewer URL is retained when watchMoment was absent');
    assert.equal(viewers[0].searchParams.get('watchMoment'), '0');
    assert.equal(viewers[0].searchParams.get('token'), 'a=b');
    assert.equal(viewers[0].searchParams.get('courseId'), '101');
    assert.equal(requests.filter(url => /saveTimePc|put\/watchMoment|userLog\/recordAction/.test(url.pathname)).length, 0, 'a failed viewer cannot start progress reporting');
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /已确认完成\s+1\s+项/);
    assert.match(log, /失败\s+1\s+项/);
});

test('boundary lifecycle removes task listeners after a failed run and a retry', { timeout: 20000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'lifecycle', failure: 'network' });
    const initial = (await state()).activeListeners;
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => engineFixture.catalogs === 1 && !document.querySelector('#yixue-run-course').disabled);
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => engineFixture.catalogs === 2 && !document.querySelector('#yixue-run-course').disabled);
    await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
    });
    const result = await state();
    assert.deepEqual(result.activeListeners, initial, 'storage/visibility listeners do not accumulate across completed runs');
    assert.equal(result.audioPlays, 0, 'hiding the page after completion does not restart keepalive audio');
    assert.equal(result.titleTimers, 0, 'hiding the page after completion does not start another title timer');
});

test('boundary repeated empty card pages stop within a finite limit and restore start', { timeout: 15000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'empty-cards' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    const requests = (await state()).requests.filter(item => new URL(item.url).pathname === '/knowledge/cards');
    assert.ok(requests.length > 1 && requests.length <= 20, 'empty card pages stop before the fixture safety guard');
    assert.match(log, /章节读取异常|上限|空任务/);
    assert.match(log, /已确认完成\s+0\s+项/);
    assert.equal(await page.locator('#yixue-run-course').isEnabled(), true);
});

test('boundary non-job pagination has a finite cap and explains truncated results', { timeout: 15000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'non-job-pages' });
    await page.locator('#yixue-run-course').click();
    await page.waitForFunction(() => engineFixture.requests.some(item => item.url.includes('/stat2/chapter-exam/')) && !document.querySelector('#yixue-run-course').disabled, null, { timeout: 10000 });
    const requests = (await state()).requests.filter(item => new URL(item.url).pathname === '/stat2/chapter-exam/s/tests/data');
    assert.ok(requests.length > 0 && requests.length <= 150, 'statistics pagination stops before the fixture safety guard');
    assert.match(await page.locator('#yixue-course-log').innerText(), /上限|分页.*停止/);
});

test('boundary negative class replay position is clamped before reporting progress', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'class-negative-time' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    const uploads = (await state()).requests.map(item => new URL(item.url)).filter(url => url.pathname === '/apis/chapter/addReviewDot4Job');
    assert.deepEqual(uploads.map(url => url.searchParams.get('lastWatchTime')), ['10', '11']);
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /待核实\s+1\s+项/);
});

for (const scenario of ['live-invalid-rt', 'live-invalid-duration', 'live-negative-viewtime']) {
    test(`boundary ${scenario} fails without progress reports and continues documents`, { timeout: 25000 }, async t => {
        const { page, state } = await fixture(t, { scenario });
        await page.locator('#yixue-run-course').click();
        const log = await completedLog(page);
        const requests = (await state()).requests.map(item => new URL(item.url));
        assert.equal(requests.filter(url => /saveTimePc|put\/watchMoment/.test(url.pathname)).length, 0);
        assert.match(log, /文档任务完成：后续文档/);
        assert.match(log, /已确认完成\s+1\s+项/);
        assert.match(log, /失败\s+1\s+项/);
    });
}

test('boundary malformed attachments count failures and preserve the following document', { timeout: 25000 }, async t => {
    const { page, state } = await fixture(t, { scenario: 'invalid-attachments' });
    await page.locator('#yixue-run-course').click();
    const log = await completedLog(page);
    assert.equal((await state()).reports, 0);
    assert.match(log, /文档任务完成：后续文档/);
    assert.match(log, /已确认完成\s+1\s+项/);
    assert.match(log, /失败\s+2\s+项/, 'each malformed attachment is accounted for');
});
