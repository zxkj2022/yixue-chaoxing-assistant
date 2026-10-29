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
async function fixture(t, width = 390) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(4000);
    t.after(() => page.close());
    await page.setContent('<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body></body></html>');
    await page.addScriptTag({ content: testingBundle });
    await page.evaluate(() => {
        const root = document.createElement('div'); document.body.append(root);
        const style = document.createElement('style'); style.textContent = testLoad('ui/dialogs.css') + testLoad('ui/dashboard.css'); document.head.append(style);
        const values = new Map(), listeners = new Set();
        window.settings = { get: (key, fallback) => values.has(key) ? values.get(key) : fallback, set: (key, value) => values.set(key, value) };
        window.accountData = { points: 82, member: true, member_until: 1900000000, daily_limit: 200, daily_remaining: 120, vip_level: 3, plan_name: 'VVIP' };
        window.bank = { getToken: () => 'ys_' + 'a'.repeat(40), balanceState: () => ({ data: accountData }), balanceLabel: () => '积分 82 · 今日会员额度 120 / 200 次', capabilitiesLabel: () => 'AI 可用', onBalanceChange: fn => { listeners.add(fn); return () => listeners.delete(fn); }, refreshBalance: async () => {}, refreshCapabilities: async () => {} };
        window.notifyAccount = () => { for (const fn of listeners) fn(); };
        window.runTask = async () => {};
        window.dashboard = testLoad('ui/dashboard')({ document, window, root, bank, settings, access: { getDisplayToken: bank.getToken }, logoUrl: testLoad('ui/logo'), connect() {}, saveToken() {}, modal: testLoad('ui/modal')({ document, window, root, logoUrl: testLoad('ui/logo') }) }, { courseName: '移动端课程任务控制台', onRun: options => runTask(options) });
    });
    return page;
}
test('running action can stop and restart even while the course is waiting', async t => {
    const page = await fixture(t);
    await page.evaluate(() => { window.runCount = 0; window.runTask = ({ signal }) => { runCount++; return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); }; });
    await page.locator('#yixue-run-course').click();
    assert.equal(await page.getByRole('button', { name: '停止运行', exact: true }).isEnabled(), true);
    await page.getByRole('button', { name: '停止运行', exact: true }).click();
    await page.getByRole('button', { name: '开始运行', exact: true }).waitFor();
    assert.equal(await page.locator('.yixue-log-line[data-tone=error]').count(), 0);
    await page.getByRole('button', { name: '开始运行', exact: true }).click();
    assert.equal(await page.evaluate(() => runCount), 2);
});
test('normal skips are excluded from exceptions, real failures remain', async t => {
    const page = await fixture(t);
    await page.evaluate(() => { dashboard.log('已跳过任务：未启用的直播', 'skipped'); dashboard.log('任务已跳过，等待 5 秒后继续。', 'skipped'); dashboard.log('网络读取失败', 'error'); dashboard.log('平台需要验证', 'warning'); });
    await page.getByRole('button', { name: '仅看异常记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 2);
    await page.getByRole('button', { name: '查看全部记录' }).click();
    assert.equal(await page.getByText('跳过', { exact: true }).count(), 2);
});

test('submitted quizzes waiting for confirmation have their own filter and stay out of exceptions', async t => {
    const page = await fixture(t);
    await page.evaluate(() => {
        dashboard.log('章节测验已请求提交，等待平台确认：课程一', 'pending');
        dashboard.log('题源暂不可用，请稍后重试', 'warning');
        dashboard.log('提交请求失败，请人工核对', 'error');
        dashboard.log('章节测验已确认完成：课程二', 'success');
    });
    await page.getByRole('button', { name: '仅看异常记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 2);
    assert.equal(await page.getByText('章节测验已请求提交，等待平台确认：课程一').isVisible(), false);
    await page.getByRole('button', { name: '仅看待核实记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 1);
    assert.equal(await page.locator('.yixue-log-line:visible .yixue-log-badge').innerText(), '核验');
    await page.getByRole('button', { name: '仅看完成记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 1);
});

test('course events update chapter rings and summary after submitted quizzes are confirmed', async t => {
    const page = await fixture(t, 1440);
    const summary = await page.evaluate(async () => {
        const submitted = new Set();
        const task = id => ({ type: 'workid', job: true, jobid: 'work-' + id, property: { workid: id, name: '章节测验 ' + id }, isPassed: submitted.has(id) });
        const runner = testLoad('platform/course-engine').createCourseRunner({
            context: { origin: 'https://mooc1.chaoxing.com', courseId: '101', classId: '202' }, bank,
            settings: { get: (key, fallback) => ({ autoSubmit: true, doNoMission: false, doRenwu: false })[key] ?? fallback }, wait: async () => {},
            emit: event => {
                if (event.type === 'log') dashboard.log(event.message, event.tone);
                if (event.type === 'counts') dashboard.setCounts(event);
                if (event.type === 'summary') dashboard.setSummary(event);
                if (event.type === 'task') dashboard.setTask(event);
                if (event.type === 'progress') dashboard.setProgress(event.percent);
            },
            questions: {
                openPage: async href => {
                    const id = new URL(href).searchParams.get('workId');
                    return { document: {}, window: { toadd() {}, submitAction() { submitted.add(id); } }, retain() {}, release() {} };
                },
                run: async () => ({ total: 1, answered: 1, accuracy: 100 }),
            },
            transport: { request: async details => {
                const url = new URL(details.url);
                const responseText = url.pathname === '/mycourse/studentstudycourselist'
                    ? ['1', '2', '3'].map(id => '<div id="cur' + id + '"><span class="posCatalog_name">课程 ' + id + '</span><span class="jobUnfinishCount">' + (id === '1' ? 0 : 1) + '</span></div>').join('')
                    : url.searchParams.get('num') === '0' ? '<script>mArg=' + JSON.stringify({ defaults: {}, attachments: [task(url.searchParams.get('knowledgeid'))] }) + ';</script>' : '<script>mArg=$mArg;</script>';
                return { status: 200, responseText };
            } },
        });
        return runner.run();
    });
    assert.equal(summary.confirmed, 2); assert.equal(summary.pending, 0);
    assert.equal(await page.locator('#yixue-chapter-progress-value').innerText(), '100%');
    assert.equal(await page.locator('#yixue-unconfirmed-count').innerText(), '0');
    assert.match(await page.locator('.yixue-chapter-count').innerText(), /3 \/ 3 章/);
    await page.getByRole('button', { name: '仅看异常记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 0);
    await page.getByRole('button', { name: '仅看完成记录' }).click();
    assert.equal(await page.locator('.yixue-log-line:visible').count(), 2);
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: 'artifacts/course-progress-confirmed-1440.png', fullPage: true });
});
test('member badges use the returned tier and remain honest with older APIs', async t => {
    const page = await fixture(t);
    for (const [level, expected] of [[1, 'VIP'], [2, 'SVIP'], [3, 'VVIP'], [undefined, '会员']]) {
        await page.evaluate(level => { accountData.vip_level = level; notifyAccount(); }, level);
        assert.equal(await page.locator('[data-yixue-member-badge]').innerText(), expected);
    }
    await page.evaluate(() => { accountData.member = false; notifyAccount(); });
    assert.equal(await page.locator('[data-yixue-member-badge]').innerText(), '普通用户');
});
test('failed membership refresh displays the real error instead of waiting or claiming a connection', async t => {
    const page = await fixture(t);
    await page.evaluate(() => { bank.balanceState = () => ({ data: null, loading: false, error: '题库证书校验失败（HTTP 526）' }); notifyAccount(); });
    assert.equal(await page.locator('[data-yixue-member-badge]').innerText(), '获取失败');
    assert.equal(await page.locator('#yixue-dashboard-balance').inputValue(), '额度获取失败，请重试');
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').innerText(), '连接异常');
    assert.match(await page.locator('.yx-member-expiry').innerText(), /526/);
});
test('successful official fallback shows VVIP and discloses the compatibility route', async t => {
    const page = await fixture(t);
    await page.evaluate(() => { bank.routeState = () => ({ compatibility: true, activeOrigin: 'https://tk.sanzwk.com' }); notifyAccount(); });
    assert.equal(await page.locator('[data-yixue-member-badge]').innerText(), 'VVIP');
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').innerText(), '已连接 · 兼容线路');
    assert.equal(await page.locator('.yx-member-route').isVisible(), true);
    await page.screenshot({ path: 'artifacts/membership-compatibility-390.png', fullPage: true });
});
test('saving a speed validates the input and explains when it takes effect', async t => {
    const page = await fixture(t);
    await page.locator('#yixue-video-speed').fill('4');
    await page.locator('#yixue-save-settings').click();
    assert.equal(await page.evaluate(() => settings.get('beisu')), 4);
    assert.match(await page.locator('#yixue-settings-saved').innerText(), /下一次进度上报/);
    await page.getByRole('button', { name: '确定', exact: true }).click();
    await page.locator('#yixue-video-speed').fill('99');
    await page.locator('#yixue-save-settings').click();
    assert.equal(await page.evaluate(() => settings.get('beisu')), 4);
});
test('the actual app aborts an in-flight catalog request and restores its start action', async t => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(5000); t.after(() => page.close());
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><title>测试课程-首页</title></head><body></body></html>' }));
    await page.goto('https://mooc1.chaoxing.com/mooc-ans/course/yixue-console.html?courseid=101&classid=202&uid=404');
    await page.evaluate(() => {
        const values = new Map([['yixueLocalToken', 'a'.repeat(32)]]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_info = { script: { version: '4.1.12' } }; window.unsafeWindow = window;
        window.aborts = 0; window.catalogRequests = [];
        window.GM_xmlhttpRequest = details => {
            if (details.url.endsWith('.meta.js')) { queueMicrotask(() => details.onerror()); return { abort() {} }; }
            catalogRequests.push(details); return { abort() { aborts++; details.onabort(); } };
        };
        window.menus = []; window.GM_registerMenuCommand = name => menus.push(name);
    });
    await page.addScriptTag({ content: fs.readFileSync('易学·超星学习通助手.user.js', 'utf8') });
    await page.getByRole('button', { name: '开始运行', exact: true }).click();
    await page.waitForFunction(() => catalogRequests.length === 1);
    await page.getByRole('button', { name: '停止运行', exact: true }).click();
    await page.getByRole('button', { name: '开始运行', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => aborts), 1);
    assert.equal(await page.locator('.yixue-log-line[data-tone=error]').count(), 0);
    assert.deepEqual(await page.evaluate(() => menus), ['设置搜题 Token']);
    assert.match(await page.locator('meta[name=viewport]').getAttribute('content'), /width=device-width/);
    await page.evaluate(() => { window.GM_xmlhttpRequest = details => { queueMicrotask(() => details.onload({ status: 200, responseText: '<div>课程暂无待处理章节</div>', finalUrl: details.url })); return { abort() {} }; }; });
    await page.getByRole('button', { name: '开始运行', exact: true }).click();
    await page.getByRole('button', { name: '开始运行', exact: true }).waitFor();
    assert.equal(await page.locator('.yixue-run-state').innerText(), '本轮已结束');
});
test('question helper shows the same member badge and safely renders account text', async t => {
    const page = await fixture(t);
    await page.evaluate(() => {
        dashboard.destroy();
        const style = document.createElement('style'); style.textContent = testLoad('ui/question-panel.css'); document.head.append(style);
        const root = document.createElement('div'); document.body.append(root);
        accountData.plan_name = '<img src=x onerror=alert(1)>';
        window.panel = testLoad('ui/question-panel').createQuestionPanel({ document, window, root, bank, settings, logoUrl: testLoad('ui/logo'), connect() {} }, {});
    });
    assert.equal(await page.locator('[data-yixue-member-badge]').innerText(), 'VVIP');
    assert.equal(await page.locator('.yx-membership img').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
});
test('aborted question searches finish without failure logs or extra balance requests', async t => {
    const page = await fixture(t);
    const result = await page.evaluate(async () => {
        const sheet = document.createElement('div');
        sheet.innerHTML = '<div class="TiMu"><div class="Zy_TItle">1. 测试题（单选题）</div><ul><li><input type="radio" name="answer"><a class="fl after">A.</a><div class="fl answer">甲</div></li><li><input type="radio" name="answer"><a class="fl after">B.</a><div class="fl answer">乙</div></li></ul></div>';
        document.body.append(sheet);
        const controller = new AbortController(), logs = []; let refreshes = 0;
        const searchBank = { getToken: () => 'ys_' + 'a'.repeat(40), search: async () => { controller.abort(); throw controller.signal.reason; }, refreshBalance: async () => { refreshes++; } };
        const workflow = testLoad('questions/index').createQuestionWorkflow({ bank: searchBank, settings, onLog: (message, tone) => logs.push({ message, tone }) });
        const outcome = await workflow.run(document, { signal: controller.signal, apply: false });
        return { outcome, logs, refreshes };
    });
    assert.equal(result.outcome.total, 1);
    assert.equal(result.outcome.stopped, true);
    assert.equal(result.refreshes, 0);
    assert.equal(result.logs.some(row => /查询失败/.test(row.message)), false);
});
for (const stage of ['balance', 'collection']) test(`stop remains responsive while waiting for ${stage}`, async t => {
    const page = await fixture(t);
    const result = await page.evaluate(async stage => {
        const sheet = document.createElement('div');
        sheet.innerHTML = '<div class="TiMu"><div class="Zy_TItle">1. 测试题（单选题）</div><ul><li><input type="radio" name="answer"><a class="fl after">A.</a><div class="fl answer">甲</div></li><li><input type="radio" name="answer"><a class="fl after">B.</a><div class="fl answer">乙</div></li></ul></div>';
        document.body.append(sheet);
        const controller = new AbortController();
        const searchBank = { getToken: () => 'ys_' + 'a'.repeat(40), search: async () => ({ code: 0, reason: 'not-found' }), refreshBalance: () => stage === 'balance' ? new Promise(() => {}) : Promise.resolve() };
        const workflow = testLoad('questions/index').createQuestionWorkflow({ bank: searchBank, settings, onCollect: () => stage === 'collection' ? new Promise(() => {}) : Promise.resolve() });
        const pending = workflow.run(document, { signal: controller.signal, apply: false });
        setTimeout(() => controller.abort(), 20);
        return Promise.race([pending, new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), 1000))]);
    }, stage);
    assert.equal(result.timedOut, undefined);
    assert.equal(result.stopped, true);
});
for (const width of [320, 390, 768, 1024, 1440]) test(`phone and desktop controls remain usable at ${width}px`, async t => {
    const page = await fixture(t, width);
    await page.evaluate(() => { dashboard.setTask({ name: '非常长的视频任务名称'.repeat(18), chapter: '章节名称'.repeat(16), status: 'running' }); dashboard.log('连续日志'.repeat(40), 'error'); });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const start = await page.locator('#yixue-run-course').boundingBox();
    assert.ok(start.height >= 44);
    if (width < 561) {
        const input = await page.locator('#yixue-video-speed').evaluate(el => getComputedStyle(el).fontSize);
        assert.ok(parseFloat(input) >= 16);
    }
    fs.mkdirSync('artifacts', { recursive: true });
    await page.screenshot({ path: `artifacts/dashboard-${width}.png`, fullPage: true });
});
