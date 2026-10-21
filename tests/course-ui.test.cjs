const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = readFileSync(process.env.YIXUE_SCRIPT_PATH || path.join(root, readdirSync(root).find(name => name.endsWith('.txt.js'))), 'utf8');
const version = source.match(/^\/\/ @version\s+(\S+)/m)[1];
const artifacts = path.join(root, 'artifacts');
const logoUrl = 'https://yixue-cmg.pages.dev/assets/yixue-logo.png';
const logoPath = path.join(artifacts, 'yixue-logo.png');
const logoImage = existsSync(logoPath) ? readFileSync(logoPath) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZAAAAABJRU5ErkJggg==', 'base64');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const bank = 'https://tk.sanzwk.com';
const courseOrigin = 'https://mooc1.chaoxing.com';
const courseUrl = `${courseOrigin}/mycourse/stu?courseid=101&clazzid=202&cpi=303&uid=404`;
const dashboardUrl = `${courseOrigin}/mooc-ans/course/yixue-console.html?ut=s&classid=202&courseid=101&cpi=303&coursename=${encodeURIComponent('课程界面回归测试')}&uid=404`;
const firstToken = 'tk_' + 'a'.repeat(40);
const secondToken = 'tk_' + 'b'.repeat(40);
const localToken = 'a1'.repeat(16);
let browser;

before(async () => {
    mkdirSync(artifacts, { recursive: true });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); });

async function fixture(t, { token = '', local = '', healthy = true, workTask = false } = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    context.setDefaultTimeout(4500);
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    const screenshotName = t.name.replace(/[^a-z0-9-]+/gi, '-');
    t.after(async () => {
        if (!page.isClosed()) {
            await page.screenshot({ path: path.join(artifacts, `course-${screenshotName}.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
            const state = await page.evaluate(() => ({
                alerts: globalThis.fixtureAlerts || [], rejections: globalThis.fixtureRejections || [],
                switches: [...document.querySelectorAll('[role="switch"]')].map(element => ({ id: element.id, className: element.className, checked: element.getAttribute('aria-checked') })),
                connection: document.querySelector('.yixue-connection-status')?.dataset.connected,
                progress: document.querySelector('#yixue-course-progress')?.getAttribute('aria-valuenow'),
            })).catch(() => ({}));
            errors.push(...(state.rejections || []));
            writeFileSync(path.join(artifacts, `course-${screenshotName}.json`), JSON.stringify({ version, requests, errors, alerts: state.alerts || [], switches: state.switches || [], connection: state.connection, progress: state.progress }, null, 2));
        }
        await context.close();
        assert.deepEqual(errors, [], 'browser exceptions: ' + errors.join('\n'));
    });
    await context.addInitScript(({ base, token, local, version, origin }) => {
        const initialValues = [
            ['yixueQuestionBankBase', base], ['yixueApiTokenOrigin', base], ['shenchanranToken', token],
            ['yixueLocalToken', local],
            ['nseibvgewb', Math.floor(Date.now() / 1000)], ['doRenwu', false], ['doNoMission', false],
        ];
        const values = new Map(JSON.parse(sessionStorage.getItem('__fixtureGM') || 'null') || initialValues);
        globalThis.GM_getValue = (key, fallback) => structuredClone(values.has(key) ? values.get(key) : fallback);
        globalThis.GM_setValue = (key, value) => {
            values.set(key, structuredClone(value));
            sessionStorage.setItem('__fixtureGM', JSON.stringify([...values]));
        };
        globalThis.GM_info = { script: { version } };
        globalThis.GM_registerMenuCommand = (name, fn) => { (globalThis.fixtureMenus ||= {})[name] = fn; };
        globalThis.GM_addStyle = text => {
            const style = document.createElement('style');
            style.textContent = text;
            document.documentElement.append(style);
        };
        globalThis.GM_notification = () => {};
        globalThis.unsafeWindow = window;
        globalThis.ServerHost = { mooc1Domain: origin };
        globalThis.alert = text => { (globalThis.fixtureAlerts ||= []).push(String(text)); };
        globalThis.confirm = () => false;
        globalThis.addEventListener('unhandledrejection', event => {
            (globalThis.fixtureRejections ||= []).push(String(event.reason?.message || event.reason));
        });
        globalThis.GM_xmlhttpRequest = details => {
            const controller = new AbortController();
            const url = new URL(details.url, location.href).href;
            fetch(url, {
                method: details.method || 'GET', headers: details.headers,
                body: details.data, signal: controller.signal, credentials: 'omit',
            }).then(async response => {
                const text = await response.text();
                details.onload?.({ status: response.status, responseText: text, response: text, finalUrl: response.url });
            }, error => { if (error.name !== 'AbortError') details.onerror?.({}); });
            return { abort() { controller.abort(); details.onabort?.(); } };
        };
    }, { base: bank, token, local, version, origin: courseOrigin });

    await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        requests.push({ url: url.href, method: request.method(), authorization: request.headers().authorization || '', resourceType: request.resourceType() });
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
        const json = (body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
        const html = body => route.fulfill({ headers, contentType: 'text/html; charset=utf-8', body });
        if (url.href === logoUrl) return route.fulfill({ contentType: 'image/png', body: logoImage });
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (url.origin === bank && url.pathname === '/api/health') return json({ status: healthy ? 'ok' : 'unavailable' }, healthy ? 200 : 503);
        if (url.origin === bank && url.pathname === '/api/v1/balance') {
            const auth = request.headers().authorization;
            if (![firstToken, secondToken].some(value => auth === `Bearer ${value}`)) return json({ code: 'UNAUTHORIZED' }, 401);
            return json({ code: 'OK', cost: 0, data: { points: auth.endsWith(secondToken) ? 57 : 42, member: true, daily_remaining: 17, daily_limit: 100, member_until: 2000000000 } });
        }
        if (url.origin === bank && url.pathname === '/api/v1/search') return json({ code: 'NOT_FOUND', cost: 0, data: null });
        // All resources are mocked, including course documents. External CSS/fonts
        // deliberately fail, so layout cannot accidentally depend on a live CDN.
        if (request.resourceType() === 'stylesheet' || request.resourceType() === 'font') return route.abort();
        if (url.origin !== courseOrigin) return route.abort();
        if (url.pathname.endsWith('/studentstudycourselist')) return html(workTask ? '<h4 id="cur505"><span class="jobUnfinishCount">1</span>测试章节</h4>' : '<p>没有待处理章节</p>');
        if (url.pathname === '/knowledge/cards') {
            if (url.searchParams.get('num') !== '0') return html('mArg = $mArg;');
            const attachments = [
                { job: true, type: 'workid', jobid: 'work-606', enc: 'mock', property: { workid: '606', title: '测试章节题目' } },
                { job: true, type: 'document', jobid: 'document-707', jtoken: 'mock', property: { name: '无 Token 文档回归' } },
            ];
            return html(`<script>try { var mArg = ${JSON.stringify({ defaults: { reportUrl: `${courseOrigin}/mock-progress`, fid: '1' }, attachments })}; } catch(e) {}</script>`);
        }
        if (url.pathname === '/ananas/job/document') return json({ status: true });
        if (url.pathname.includes('/work/phone/work')) return html('<html><head><title>章节</title></head><body><p>Unexpected access: the missing-token path must skip quiz loading.</p></body></html>');
        if (url.pathname.includes('ueditor.parse.js')) return route.fulfill({ contentType: 'text/javascript', body: '' });
        return html('<!doctype html><html><head><meta charset="utf-8"><title>课程界面回归测试-首页</title></head><body><div class="headRight">回到旧版</div><input name="userId" value="404"><div class="zy">作业</div><div class="ks">考试</div></body></html>');
    });
    async function open(url) { await page.goto(url); await page.addScriptTag({ content: source }); }
    return { page, requests, errors, open };
}

test('guest-course-entrance', { timeout: 20000 }, async t => {
    const { page, requests, open } = await fixture(t, { healthy: false });
    await open(courseUrl);
    await page.getByText('连接题库', { exact: true }).waitFor();
    await page.getByText('手动填写 Token', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(artifacts, 'course-first-use.png'), fullPage: true, animations: 'disabled' });
    await page.getByText('随机生成 Token', { exact: true }).click();
    await page.locator('#yixue-open-course').waitFor({ state: 'visible' });
    const generatedToken = await page.evaluate(() => GM_getValue('yixueLocalToken', ''));
    assert.match(generatedToken, /^[a-f0-9]{32}$/);
    assert.equal(await page.locator('#yixue-entry-token').inputValue(), generatedToken);
    assert.match(await page.locator('#yixue-entry-balance').inputValue(), /未连接|未激活/);
    assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), '');
    await page.screenshot({ path: path.join(artifacts, 'course-task-selection.png'), fullPage: true, animations: 'disabled' });
    for (const id of ['yixue-entry-save', 'yixue-entry-connect', 'yixue-entry-refresh']) {
        const lines = await page.locator(`#${id}`).evaluate(element => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return range.getClientRects().length;
        });
        assert.equal(lines, 1, `${id} label remains on one line in the course panel`);
    }
    assert.ok((await page.locator('[data-yixue-balance]').first().boundingBox()).width >= 200, 'account details use a readable block rather than a narrow flex column');
    await page.reload();
    await page.addScriptTag({ content: source });
    await page.locator('#yixue-open-course').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#yixue-entry-token').inputValue(), generatedToken);
    assert.equal(await page.evaluate(() => GM_getValue('yixueLocalToken', '')), generatedToken);
    assert.equal(await page.getByText('随机生成 Token', { exact: true }).isVisible(), false);
    assert.deepEqual(await page.evaluate(() => globalThis.fixtureAlerts || []), []);
    const navigation = page.waitForURL(url => url.pathname === '/mooc-ans/course/yixue-console.html');
    await page.locator('#yixue-open-course').click();
    await navigation;
    const url = new URL(page.url());
    assert.equal(url.origin, courseOrigin);
    assert.equal(url.searchParams.get('classid'), '202');
    assert.equal(url.searchParams.get('courseid'), '101');
    assert.equal(url.searchParams.get('cpi'), '303');
    assert.equal(url.searchParams.get('uid'), '404');
    assert.equal(requests.filter(item => item.url.includes('/api/v1/search')).length, 0);
    assert.equal(requests.filter(item => item.url.includes('/api/v1/balance')).length, 0);
    assert.equal(requests.filter(item => new URL(item.url).origin === bank && new URL(item.url).pathname.startsWith('/api/')).length, 0, 'local mode never calls question-bank APIs');
    assert.equal(requests.some(item => item.url.includes(generatedToken) || item.authorization.includes(generatedToken)), false, 'local random token never leaves the browser');
});

test('first-run-manual-token-and-cancel', { timeout: 20000 }, async t => {
    const { page, requests, open } = await fixture(t);
    await open(courseUrl);
    const access = page.getByRole('dialog', { name: '首次使用易学助手', exact: true });
    await access.getByRole('button', { name: '手动填写 Token', exact: true }).click();
    const manual = page.getByRole('dialog', { name: '手动填写 Token', exact: true });
    await manual.getByLabel('搜题 API Token').press('Shift+Tab');
    assert.equal(await manual.evaluate(dialog => dialog.contains(document.activeElement)), true, 'backward Tab stays in the upper Token dialog');
    await page.keyboard.press('Tab');
    assert.equal(await manual.evaluate(dialog => dialog.contains(document.activeElement)), true, 'forward Tab stays in the upper Token dialog');
    await manual.getByLabel('搜题 API Token').press('Escape');
    await access.waitFor({ state: 'visible' });
    assert.equal(await access.count(), 1, 'Escape closes only the upper Token dialog, leaving the welcome dialog available');
    assert.equal(await page.getByRole('dialog', { name: '手动填写 Token', exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => GM_getValue('yixueLocalToken', '')), '');
    assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), '');
    assert.equal(requests.filter(item => new URL(item.url).origin === bank).length, 0);
    await access.getByRole('button', { name: '手动填写 Token', exact: true }).click();
    await manual.getByLabel('搜题 API Token').fill(firstToken);
    await manual.getByRole('button', { name: '保存 Token', exact: true }).click();
    await page.locator('#yixue-open-course').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#yixue-entry-balance')?.value.includes('42'));
    assert.equal(await page.locator('#yixue-entry-token').inputValue(), firstToken);
    assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), firstToken);
    assert.equal(await access.count(), 0);
    assert.equal(requests.filter(item => item.url.includes('/api/v1/search')).length, 0);
});

test('authenticated-course-token-and-balance', { timeout: 20000 }, async t => {
    const { page, requests, open } = await fixture(t, { token: firstToken });
    await open(courseUrl);
    await page.locator('#yixue-open-course').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#yixue-entry-balance')?.value.includes('42'));
    await page.waitForFunction(token => document.querySelector('#yixue-entry-token')?.value === token, firstToken);
    assert.equal(await page.locator('#yixue-entry-token').inputValue(), firstToken);
    assert.match(await page.locator('[data-yixue-balance]').first().innerText(), /17\/100/);
    await page.locator('#yixue-entry-token').fill(secondToken);
    await page.locator('#yixue-entry-save').click();
    await page.waitForFunction(() => document.querySelector('#yixue-entry-balance')?.value.includes('57'));
    assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), secondToken);
    assert.ok(requests.some(item => item.url.endsWith('/api/v1/balance') && item.authorization === `Bearer ${secondToken}`));
    assert.equal(requests.filter(item => item.url.includes('/api/v1/search')).length, 0);
});

test('guest-dashboard-layout-config-and-quiz-skip', { timeout: 35000 }, async t => {
    const { page, requests, open } = await fixture(t, { local: localToken, healthy: false, workTask: true });
    await open(dashboardUrl);
    await page.locator('#yixue-run-course').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#yixue-course-log')?.textContent.includes('脚本初始化成功'));
    await page.waitForFunction(() => document.querySelector('.yixue-brand-mark img')?.naturalWidth > 0);
    assert.equal(await page.locator('.yixue-brand-mark img').getAttribute('src'), logoUrl);
    assert.equal(await page.locator('.yixue-brand-mark img').getAttribute('referrerpolicy'), 'no-referrer');
    assert.equal(await page.locator('#yixue-dashboard-token').inputValue(), localToken);
    assert.match(await page.locator('#yixue-dashboard-balance').inputValue(), /未连接|未激活/);
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').getAttribute('data-connected'), 'false');
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').innerText(), '本地模式');
    const videoSwitch = page.getByRole('switch', { name: '视频任务', exact: true });
    assert.equal(await videoSwitch.getAttribute('aria-checked'), 'true');
    assert.match(await videoSwitch.getAttribute('class'), /\bbtn-primary\b/);
    for (const id of ['doDocument', 'doWork']) {
        assert.equal(await page.locator(`#${id}`).getAttribute('aria-checked'), 'true');
        assert.match(await page.locator(`#${id}`).getAttribute('class'), /\bbtn-primary\b/);
    }
    assert.equal(await page.getByRole('progressbar', { name: '当前任务进度' }).getAttribute('aria-valuenow'), '0');
    assert.equal(await page.locator('#yixue-course-progress-value').innerText(), '0%');
    await page.screenshot({ path: path.join(artifacts, 'course-dashboard-preview.png'), fullPage: true, animations: 'disabled' });
    const boxes = await page.locator('.yixue-dashboard-columns > .yixue-dashboard-column').evaluateAll(elements => elements.slice(0, 2).map(element => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width };
    }));
    assert.equal(boxes.length, 2);
    assert.ok(boxes[0].width > 400 && boxes[0].width < 800, JSON.stringify(boxes));
    assert.ok(boxes[1].x > boxes[0].x + boxes[0].width - 2, 'desktop dashboard uses two columns');
    assert.ok(Math.abs(boxes[0].y - boxes[1].y) < 2, 'task controls and log start on the same row');
    assert.equal(await page.locator('link[rel="stylesheet"]').count(), 0, 'dashboard CSS is bundled in the userscript');
    const refreshAligned = () => page.locator('#yixue-dashboard-refresh').evaluate(button => {
        const input = document.querySelector('#yixue-dashboard-balance').getBoundingClientRect();
        const refresh = button.getBoundingClientRect();
        return refresh.top >= input.top - 2 && refresh.bottom <= input.bottom + 2;
    });
    assert.ok(await refreshAligned(), 'desktop refresh link stays beside the balance input, above account details');
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.locator('.yixue-dashboard-columns > .yixue-dashboard-column').evaluateAll(elements => elements.slice(0, 2).map(element => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, bottom: box.bottom };
    }));
    assert.ok(Math.abs(mobile[0].x - mobile[1].x) < 2, 'narrow screen columns stack');
    assert.ok(mobile[1].y >= mobile[0].bottom - 2, JSON.stringify(mobile));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'narrow screen has no horizontal page overflow');
    assert.ok(await refreshAligned(), 'mobile refresh link does not overlap account details');
    await page.screenshot({ path: path.join(artifacts, 'course-guest-dashboard-mobile.png'), fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await videoSwitch.click();
    await page.waitForFunction(() => document.querySelector('#doVideo')?.getAttribute('aria-checked') === 'false');
    assert.equal(await page.evaluate(() => GM_getValue('doVideo')), false);
    await videoSwitch.click();
    await page.waitForFunction(() => document.querySelector('#doVideo')?.getAttribute('aria-checked') === 'true');
    assert.equal(await page.evaluate(() => GM_getValue('doVideo')), true);
    const switches = page.getByRole('switch');
    assert.equal(await switches.count(), 6, 'six independent task switches are available');
    assert.equal(await page.getByRole('checkbox', { name: /章节测验达标后提交/ }).isChecked(), true);
    assert.equal(await page.getByRole('checkbox', { name: /启用 AI 参考答案/ }).isChecked(), false);
    await page.getByRole('checkbox', { name: /启用 AI 参考答案/ }).check();
    assert.equal(await page.evaluate(() => GM_getValue('doAI')), true);
    await page.getByRole('checkbox', { name: /启用 AI 参考答案/ }).uncheck();
    assert.equal(await page.evaluate(() => GM_getValue('doAI')), false);
    const beforeIndependentChange = await switches.evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.id, node.getAttribute('aria-checked')])));
    await page.locator('#doRenwu').click();
    assert.equal(await page.evaluate(() => GM_getValue('doRenwu')), true);
    const afterIndependentChange = await switches.evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.id, node.getAttribute('aria-checked')])));
    for (const key of Object.keys(beforeIndependentChange).filter(key => key !== 'doRenwu')) assert.equal(afterIndependentChange[key], beforeIndependentChange[key], `${key} is unaffected by another switch`);
    await page.locator('#doRenwu').click();
    await page.locator('#yixue-video-speed').fill('0.75');
    await page.locator('#yixue-answer-threshold').fill('77');
    await page.locator('#yixue-save-settings').click();
    await page.getByText('配置保存成功，已实时生效', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => GM_getValue('beisu')), .75);
    assert.equal(await page.evaluate(() => GM_getValue('vgqtlv')), 77);
    await page.getByRole('dialog', { name: '配置已保存' }).getByRole('button', { name: '确定', exact: true }).click();
    await page.locator('#yixue-run-course').click();
    await page.getByText('文档任务完成：无 Token 文档回归', { exact: false }).waitFor({ timeout: 20000 });
    assert.equal(requests.filter(item => item.url.includes('/api/v1/search')).length, 0);
    assert.equal(requests.filter(item => item.url.includes('/api/v1/balance')).length, 0);
    assert.equal(requests.filter(item => new URL(item.url).origin === bank && new URL(item.url).pathname.startsWith('/api/')).length, 0);
    assert.equal(requests.filter(item => item.url.includes('/work/phone/work')).length, 0, 'no token: do not load or change quiz documents');
    assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), '');
    assert.deepEqual(await page.evaluate(() => globalThis.fixtureAlerts || []), []);
    assert.doesNotMatch(await page.locator('#yixue-course-log').innerText(), /无法预料的错误/);
});

test('authenticated-dashboard-initialization', { timeout: 20000 }, async t => {
    const { page, requests, open } = await fixture(t, { token: firstToken });
    await open(dashboardUrl);
    await page.locator('#yixue-run-course').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#yixue-dashboard-balance')?.value.includes('42'));
    assert.equal(await page.locator('#yixue-dashboard-token').inputValue(), firstToken);
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').getAttribute('data-connected'), 'true');
    assert.equal(await page.locator('.yixue-topbar .yixue-connection-status').innerText(), '已连接题库');
    assert.equal(await page.locator('#yixue-dashboard-token').getAttribute('type'), 'password');
    assert.match(await page.locator('[data-yixue-balance]').first().innerText(), /17\/100/);
    assert.match(await page.locator('#yixue-course-log').innerText(), /脚本初始化成功/);
    assert.equal(requests.filter(item => item.url.includes('/api/v1/search')).length, 0);
});
