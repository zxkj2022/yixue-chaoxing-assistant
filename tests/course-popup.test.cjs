const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const source = readFileSync(path.join(root, readdirSync(root).find(name => name.endsWith('.txt.js'))), 'utf8');
const version = source.match(/^\/\/ @version\s+(\S+)/m)[1];
const artifacts = path.join(root, 'artifacts');
const topCourseUrl = 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu?courseid=101&clazzid=202';
const childCourseUrl = 'https://mooc1.chaoxing.com/mycourse/studentcourse?courseId=101&clazzid=202';
const portalUrl = 'https://mooc2-ans.chaoxing.com/mooc2-ans/space/index';
const bank = 'https://tk.sanzwk.com';
const logoUrl = 'https://yixue-cmg.pages.dev/assets/yixue-logo.png';
const logoPath = path.join(artifacts, 'yixue-logo.png');
const logo = existsSync(logoPath) ? readFileSync(logoPath) : Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aSl8AAAAASUVORK5CYII=', 'base64');
const localToken = 'a1'.repeat(16);
const realToken = 'tk_' + 'a'.repeat(43);
let browser;

before(async () => {
    mkdirSync(artifacts, { recursive: true });
    browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); });

async function fixture(t, { local = localToken, topUrl = topCourseUrl, childUrl = childCourseUrl, width = 1440, height = 1000, child = true } = {}) {
    const context = await browser.newContext({ viewport: { width, height } });
    context.setDefaultTimeout(3500);
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    let balanceResponses = 0;
    page.on('pageerror', error => errors.push(error.message));
    t.after(async () => {
        const name = t.name.replace(/[^a-z0-9-]+/gi, '-');
        if (!page.isClosed()) {
            await page.screenshot({ path: path.join(artifacts, `popup-${name}.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
            const rejections = await Promise.all(page.frames().map(frame => frame.evaluate(() => globalThis.fixtureRejections || []).catch(() => [])));
            errors.push(...rejections.flat());
            writeFileSync(path.join(artifacts, `popup-${name}.json`), JSON.stringify({ version, errors, requests }, null, 2));
        }
        await context.close();
        assert.deepEqual(errors, [], 'browser exceptions: ' + errors.join('\n'));
    });
    await context.addInitScript(({ local, version, bank }) => {
        // Each document sees the same initial GM values, including cross-origin
        // frames. Page storage is deliberately not used as a frame dedupe lock.
        const values = new Map([
            ['yixueQuestionBankBase', bank], ['yixueApiTokenOrigin', bank], ['shenchanranToken', ''],
            ['yixueLocalToken', local], ['nseibvgewb', Math.floor(Date.now() / 1000)],
            ['doRenwu', false], ['doNoMission', false],
        ]);
        globalThis.GM_getValue = (key, fallback) => structuredClone(values.has(key) ? values.get(key) : fallback);
        globalThis.GM_setValue = (key, value) => { values.set(key, structuredClone(value)); };
        globalThis.GM_info = { script: { version } };
        globalThis.GM_registerMenuCommand = (name, fn) => { (globalThis.fixtureMenus ||= {})[name] = fn; };
        globalThis.GM_addStyle = text => {
            const style = document.createElement('style');
            style.textContent = text;
            document.documentElement.append(style);
        };
        globalThis.GM_notification = () => {};
        globalThis.unsafeWindow = window;
        globalThis.ServerHost = { mooc1Domain: 'https://mooc1.chaoxing.com' };
        globalThis.alert = text => { (globalThis.fixtureAlerts ||= []).push(String(text)); };
        globalThis.confirm = () => false;
        globalThis.addEventListener('unhandledrejection', event => {
            (globalThis.fixtureRejections ||= []).push(String(event.reason?.message || event.reason));
        });
        globalThis.GM_xmlhttpRequest = details => {
            const controller = new AbortController();
            fetch(details.url, { method: details.method || 'GET', headers: details.headers, body: details.data, signal: controller.signal, credentials: 'omit' })
                .then(async response => {
                    const text = await response.text();
                    details.onload?.({ status: response.status, responseText: text, response: text, finalUrl: response.url });
                }, error => { if (error.name !== 'AbortError') details.onerror?.({}); });
            return { abort() { controller.abort(); details.onabort?.(); } };
        };
    }, { local, version, bank });
    await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        requests.push({ url: url.href, method: request.method(), authorization: request.headers().authorization || '' });
        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
        const html = body => route.fulfill({ headers, contentType: 'text/html; charset=utf-8', body });
        const json = body => route.fulfill({ headers, contentType: 'application/json', body: JSON.stringify(body) });
        if (url.href === logoUrl) return route.fulfill({ headers, contentType: 'image/png', body: logo });
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (url.origin === bank && url.pathname === '/api/health') return json({ status: 'ok' });
        if (url.origin === bank && url.pathname === '/api/v1/balance') {
            return json({ code: 'OK', cost: 0, data: { points: 42 + balanceResponses++, member: true, daily_remaining: 17, daily_limit: 100, member_until: 2000000000 } });
        }
        if (request.resourceType() === 'stylesheet' || request.resourceType() === 'font') return route.abort();
        if (request.resourceType() !== 'document') return route.abort();
        if (![new URL(topCourseUrl).origin, new URL(childCourseUrl).origin].includes(url.origin)) return route.abort();
        const iframe = url.href === topUrl && child ? `<iframe title="课程内容" src="${childUrl}" style="width:100%;height:700px;border:0"></iframe>` : '';
        return html(`<!doctype html><html><head><meta charset="utf-8"><title>课程弹窗回归测试-首页</title></head><body><div class="headRight">回到旧版</div><input name="userId" value="404"><div class="zy">作业</div><div class="ks">考试</div>${iframe}</body></html>`);
    });
    await page.goto(topUrl);
    const childFrame = child ? page.frames().find(frame => frame.url() === childUrl) : null;
    assert.equal(Boolean(childFrame), child, 'the fixture loads its requested iframe');
    return { page, childFrame, requests, inject: frame => frame.addScriptTag({ content: source }) };
}

async function visibleCount(page, selector) {
    const counts = await Promise.all(page.frames().map(frame => frame.locator(selector).evaluateAll(elements => elements.filter(element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }).length)));
    return counts.reduce((total, count) => total + count, 0);
}

async function assertSingleOwner(page, owner, selector = '#skpannel') {
    await owner.locator(selector).waitFor({ state: 'visible' });
    // Allow the peer's injection and postMessage handshake to settle before
    // checking all documents; a first visible panel alone would miss duplicates.
    await page.waitForTimeout(650);
    assert.equal(await visibleCount(page, selector), 1, 'exactly one visible course UI across the entire frame tree');
    assert.equal(await owner.locator(selector).count(), 1, 'the intended owner contains one course UI');
}

for (const order of ['parent-first', 'child-first']) {
    test(`cross-origin-course-popup-${order}`, { timeout: 15000 }, async t => {
        const { page, childFrame, requests, inject } = await fixture(t);
        if (order === 'parent-first') {
            await inject(page);
            await inject(childFrame);
        } else {
            await inject(childFrame);
            await inject(page);
        }
        await assertSingleOwner(page, page);
        assert.equal(await visibleCount(page, '#skshadow'), 1, 'there is only one course backdrop');
        assert.equal(await childFrame.locator('#skpannel').count(), 0, 'cross-origin child defers to its course parent');
        assert.equal(await page.locator('#token').inputValue(), localToken);
        await page.locator('#canclesk').click();
        assert.equal(await visibleCount(page, '#skpannel'), 0, 'cancel dismisses every visible panel');
        assert.equal(await visibleCount(page, '#skshadow'), 0, 'cancel dismisses every visible backdrop');
        assert.equal(requests.some(request => new URL(request.url).origin === bank), false, 'local tokens do not contact the bank');
    });
}

test('late-parent-removes-already-visible-child-course-popup', { timeout: 15000 }, async t => {
    const { page, childFrame, inject } = await fixture(t);
    await inject(childFrame);
    // Wait for the child's ownership fallback to render real UI before the
    // parent exists. Consecutive addScriptTag calls do not cover this race.
    await childFrame.locator('#skpannel').waitFor({ state: 'visible' });
    assert.equal(await childFrame.locator('#skshadow').isVisible(), true);
    assert.equal(await page.locator('#skpannel').count(), 0);
    await inject(page);
    await assertSingleOwner(page, page);
    assert.equal(await childFrame.locator('#yixue-course-options').count(), 0, 'the late parent removes the previous child root');
    assert.equal(await childFrame.locator('#skshadow').count(), 0, 'the old child backdrop is removed from the DOM');
    assert.equal(await visibleCount(page, '#skshadow'), 1);
    await page.locator('#canclesk').click();
    assert.equal(await visibleCount(page, '#skshadow'), 0);
});

test('late-parent-removes-already-visible-child-first-use-prompt', { timeout: 15000 }, async t => {
    const { page, childFrame, inject } = await fixture(t, { local: '' });
    const selector = '[role="dialog"][aria-label="首次使用易学助手"]';
    await inject(childFrame);
    await childFrame.locator(selector).waitFor({ state: 'visible' });
    assert.equal(await page.locator(selector).count(), 0);
    await inject(page);
    await assertSingleOwner(page, page, selector);
    assert.equal(await childFrame.locator('[data-yixue-course-ui]').count(), 0, 'the previous first-use overlay and backdrop are removed');
    await page.getByRole('button', { name: '随机生成 Token', exact: true }).click();
    await assertSingleOwner(page, page);
    assert.equal(await childFrame.locator('#yixue-course-options').count(), 0, 'the cancelled child access promise cannot reopen a panel');
    assert.equal(await visibleCount(page, '#skshadow'), 1);
});

test('repeated-injection-in-one-document-is-idempotent', { timeout: 15000 }, async t => {
    const { page, inject } = await fixture(t, { child: false });
    await inject(page);
    await page.locator('#dosk').waitFor({ state: 'visible' });
    await inject(page);
    await assertSingleOwner(page, page);
    assert.equal(await page.locator('#yixue-course-options').count(), 1, 'a document cannot retain duplicate entrance roots');
    await page.locator('#canclesk').click();
    assert.equal(await visibleCount(page, '#skshadow'), 0, 'one cancel leaves no duplicate backdrop');
});

test('first-use-prompt-has-one-owner-across-origins', { timeout: 15000 }, async t => {
    const { page, childFrame, inject } = await fixture(t, { local: '' });
    await inject(childFrame);
    await inject(page);
    const selector = '[role="dialog"][aria-label="首次使用易学助手"]';
    await assertSingleOwner(page, page, selector);
    assert.equal(await childFrame.locator(selector).count(), 0, 'the child does not leave a first-use overlay behind');
    await page.getByRole('button', { name: '随机生成 Token', exact: true }).click();
    await assertSingleOwner(page, page);
    assert.match(await page.locator('#token').inputValue(), /^[a-f0-9]{32}$/);
    assert.equal(await visibleCount(page, selector), 0, 'first-use prompt is removed after local generation');
});

for (const origin of ['cross-origin', 'same-origin']) {
    test(`course-iframe-under-non-course-portal-retains-entrance-${origin}`, { timeout: 15000 }, async t => {
        const childUrl = origin === 'cross-origin' ? childCourseUrl : childCourseUrl.replace(new URL(childCourseUrl).origin, new URL(portalUrl).origin);
        const { page, childFrame, inject } = await fixture(t, { topUrl: portalUrl, childUrl });
        await inject(page);
        await inject(childFrame);
        await assertSingleOwner(page, childFrame);
        assert.equal(await page.locator('#skpannel').count(), 0, 'a non-course portal does not own the course panel');
        await childFrame.locator('#canclesk').click();
        assert.equal(await visibleCount(page, '#skshadow'), 0);
    });
}

for (const width of [1440, 390]) {
    test(`course-popup-layout-save-refresh-${width}`, { timeout: 15000 }, async t => {
        const { page, inject, requests } = await fixture(t, { width, height: width === 390 ? 844 : 1000, child: false });
        await inject(page);
        await assertSingleOwner(page, page);
        const brand = page.locator('#skpannel .yx-course-mark img');
        assert.equal(await brand.getAttribute('src'), logoUrl, 'the course entrance uses the requested logo');
        assert.equal(await brand.getAttribute('referrerpolicy'), 'no-referrer', 'logo requests do not disclose course URLs');
        await brand.evaluate(image => image.decode());
        assert.ok(await brand.evaluate(image => image.naturalWidth > 0), 'the fully offline logo fixture actually renders');
        const panel = await page.locator('#skpannel').boundingBox();
        assert.ok(panel.x >= 0 && panel.x + panel.width <= width + 1, 'course panel stays within the viewport');
        for (const id of ['token', 'saveToken', 'tokenLeft', 'tokenTip', 'payToken', 'dosk', 'doHomework', 'doExam', 'doxxcs', 'canclesk']) {
            await page.locator(`#${id}`).scrollIntoViewIfNeeded();
            const box = await page.locator(`#${id}`).boundingBox();
            assert.ok(box && box.width > 0 && box.height > 0, `${id} remains visible`);
            assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `${id} stays within the viewport`);
        }
        await page.locator('#token').fill(realToken);
        await page.locator('#saveToken').click();
        await page.waitForFunction(() => document.querySelector('#tokenLeft')?.value.includes('42'));
        assert.equal(await page.evaluate(() => GM_getValue('shenchanranToken', '')), realToken);
        assert.equal(await page.locator('#token').getAttribute('type'), 'password');
        const balanceBefore = requests.filter(item => item.url.endsWith('/api/v1/balance')).length;
        // The API client intentionally coalesces forced refreshes for one
        // second. Exercise a real user refresh after that documented cooldown.
        await page.waitForTimeout(1100);
        await page.locator('#tokenTip').click();
        await page.waitForFunction(() => document.querySelector('#tokenLeft')?.value.includes('43'));
        assert.equal(requests.filter(item => item.url.endsWith('/api/v1/balance')).length, balanceBefore + 1, 'refresh actually fetches and displays the latest account data');
        const hasScroll = await page.locator('#skpannel').evaluate(element => {
            element.scrollTop = 0;
            return element.scrollHeight > element.clientHeight;
        });
        await page.screenshot({ path: path.join(artifacts, `popup-entrance-${width}.png`), fullPage: true, animations: 'disabled' });
        if (hasScroll) {
            await page.locator('#skpannel').evaluate(element => { element.scrollTop = element.scrollHeight; });
            await page.screenshot({ path: path.join(artifacts, `popup-entrance-${width}-scrolled.png`), fullPage: true, animations: 'disabled' });
        }
        if (width === 1440) await page.keyboard.press('Escape');
        else await page.locator('#canclesk').click();
        assert.equal(await visibleCount(page, '#skshadow'), 0);
        assert.equal(requests.some(item => item.url.includes('/api/v1/search')), false, 'entrance operations never query questions');
    });
}
