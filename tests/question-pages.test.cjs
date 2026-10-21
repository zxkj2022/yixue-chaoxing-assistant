const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const token = 'tk_' + 'A'.repeat(43);
const malicious = '<img src=x onerror="globalThis.answerExecuted=true">';
const sources = Object.fromEntries(['index', 'reader', 'matcher', 'writer', 'navigation'].map(name => ['./' + name + '.js', readFileSync(path.join(root, 'src', 'questions', name + '.js'), 'utf8')]));
const moduleBundle = '(function(){const sources=' + JSON.stringify(sources) + ';const cache={};function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;new Function("require","module","exports",sources[name]+"\\n//# sourceURL=question-module/"+name.slice(2))(load,module,module.exports);return module.exports;}window.questionModule=load("./index.js");window.questionNavigation=load("./navigation.js");})();';
const scriptPath = process.env.YIXUE_SCRIPT_PATH || path.join(root, 'dist/易学超星学习通助手.user.js');
let browser;
const coverage = new Map();

before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => {
    await browser?.close();
    if (!process.env.QUESTION_COVERAGE) return;
    for (const [name, entry] of coverage) {
        let total = 0;
        let hit = 0;
        for (const [index, line] of entry.text.split('\n').entries()) {
            if (line.trim() && !line.trim().startsWith('//#')) {
                total++;
                if (entry.coveredLines.has(index)) hit++;
            }
        }
        console.log(name + ' browser line coverage: ' + (hit / total * 100).toFixed(1) + '% (' + hit + '/' + total + ')');
        assert.ok(hit / total >= 0.8, name + ' needs at least 80% browser line coverage');
    }
});

function choices(id, type, title, options) {
    return `<div class="TiMu"><input type="hidden" name="answertype${id}" value="${type}"><div class="Zy_TItle">${title}</div><ul>${options.map((text, index) => `<li><label><input id="${id}-${index}" type="${type === 1 ? 'checkbox' : 'radio'}" name="${id}">${text}</label></li>`).join('')}</ul></div>`;
}
function fill(id, title, count) {
    return `<div class="TiMu" data="${id}"><input type="hidden" name="answertype${id}" value="2"><div class="Zy_TItle">${title}</div>${Array.from({ length: count }, (_, index) => `<iframe id="ueditor-${id}-${index}"></iframe><div id="answerEditor${id}${index + 1}"></div>`).join('')}</div>`;
}
function homework() {
    return '<html><body><input id="workLibraryId" value="fixture">' +
        choices('single', 0, '水的化学式是什么？', ['H₂O', 'CO₂', 'O₂']) +
        choices('multi', 1, '多选适配测试', ['甲', '乙', '丙']) + fill('fill', '填空适配测试', 2) +
        choices('judge', 3, '判断适配测试', ['对', '错']) + fill('safe', '安全显示测试', 1) + '</body></html>';
}

async function fixture(html, pathname = '/work/doHomeWorkNew?courseId=1', { savedToken = token, consent = false, answers = {}, status = {} } = {}) {
    const requests = [];
    const resourceRequests = [];
    const errors = [];
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('**/*', async route => {
        resourceRequests.push(route.request().url());
        // Every browser request is fulfilled locally, including the userscript logo.
        if (route.request().isNavigationRequest()) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
        if (route.request().resourceType() === 'image') return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlWQAAAAASUVORK5CYII=', 'base64') });
        return route.fulfill({ contentType: 'text/plain', body: '' });
    });
    await context.exposeBinding('__offlineGmRequest', (_, request) => {
        const url = new URL(request.url);
        assert.equal(url.origin, 'https://tk.sanzwk.com', 'GM requests must use the configured offline bank');
        assert.equal(url.searchParams.has('token'), false);
        const body = request.data ? JSON.parse(request.data) : null;
        requests.push({ ...request, body, path: url.pathname });
        let response;
        let code = 200;
        if (url.pathname === '/api/v1/search') {
            assert.equal(request.method, 'POST');
            assert.equal(request.headers.Authorization, 'Bearer ' + savedToken);
            const answer = answers[body.title];
            code = status[body.title] || 200;
            response = answer === undefined ? { code: 'NOT_FOUND', data: [] } : { code: 'OK', data: [{ answer }], cost: 1, bucket: 'points' };
        } else if (url.pathname === '/api/v1/balance') {
            assert.equal(request.method, 'GET');
            assert.equal(request.data, undefined);
            response = { code: 'OK', cost: 0, data: { points: 99, member: false, member_until: 0, daily_limit: 0, daily_remaining: 0 } };
        } else if (url.pathname === '/api/submission-tokens/provision') {
            response = { token: 'sub_offline_fixture' };
        } else if (url.pathname === '/api/question-submissions') {
            assert.equal(request.headers.Authorization, 'Bearer sub_offline_fixture');
            response = { imported_count: body.questions.length };
            code = 201;
        } else if (url.pathname === '/api/health') response = { status: 'ok' };
        else throw new Error('Unexpected GM endpoint: ' + url.pathname);
        return { status: code, responseText: JSON.stringify(response), finalUrl: request.url };
    });
    await context.addInitScript(({ savedToken, consent }) => {
        const values = new Map([['yixueQuestionBankBase', 'https://tk.sanzwk.com'], ['yixueApiTokenOrigin', 'https://tk.sanzwk.com'], ['shenchanranToken', savedToken], ['yixueSubmissionConsent', consent]]);
        globalThis.GM_getValue = (key, fallback) => structuredClone(values.has(key) ? values.get(key) : fallback);
        globalThis.GM_setValue = (key, value) => values.set(key, structuredClone(value));
        globalThis.GM_deleteValue = key => values.delete(key);
        globalThis.GM_info = { script: { version: 'test' } };
        globalThis.GM_registerMenuCommand = (name, callback) => { (globalThis.fixtureMenus ||= {})[name] = callback; };
        globalThis.GM_addStyle = text => { const style = document.createElement('style'); style.textContent = text; document.documentElement.append(style); };
        globalThis.GM_notification = () => {};
        globalThis.unsafeWindow = window;
        globalThis.alert = text => { (globalThis.fixtureAlerts ||= []).push(text); };
        globalThis.fixtureConfirm = true;
        globalThis.fixtureGmRequests = [];
        globalThis.fixtureGmReplies = [];
        globalThis.confirm = () => globalThis.fixtureConfirm;
        globalThis.GM_xmlhttpRequest = details => {
            let aborted = false;
            const request = { url: details.url, method: details.method, headers: details.headers, data: details.data };
            globalThis.fixtureGmRequests.push(request);
            globalThis.__offlineGmRequest(request).then(reply => { if (!aborted) { details.onload?.(reply); globalThis.fixtureGmReplies.push({ url: request.url, status: reply.status }); } }, () => { if (!aborted) details.onerror?.({}); });
            return { abort() { aborted = true; details.onabort?.(); } };
        };
        globalThis.UE = { getEditor: id => ({ setContent: html => { const element = document.getElementById(id); if (!element) throw Error('missing editor'); element.innerHTML = html; } }) };
        globalThis.syncAnswer = () => {};
    }, { savedToken, consent });
    const page = await context.newPage();
    if (process.env.QUESTION_COVERAGE) await page.coverage.startJSCoverage({ resetOnNavigation: false, reportAnonymousScripts: true });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('[易学助手]')) errors.push(message.text()); });
    await page.goto('https://mooc1.chaoxing.com' + pathname);
    return { page, context, requests, errors, resourceRequests, close: async () => {
        if (process.env.QUESTION_COVERAGE) {
            for (const entry of await page.coverage.stopJSCoverage()) {
                if (!entry.url.startsWith('question-module/')) continue;
                const source = entry.text || entry.source;
                if (!source) continue;
                const saved = coverage.get(entry.url) || { text: source, coveredLines: new Set() };
                const ranges = (entry.functions || []).flatMap(fn => fn.ranges);
                let offset = 0;
                for (const [index, line] of source.split('\n').entries()) {
                    const position = offset + Math.max(0, line.search(/\S/));
                    const containing = ranges.filter(range => range.startOffset <= position && range.endOffset > position).sort((a, b) => (a.endOffset - a.startOffset) - (b.endOffset - b.startOffset));
                    if (containing[0]?.count > 0 || entry.ranges?.some(range => range.start <= position && range.end > position)) saved.coveredLines.add(index);
                    offset += line.length + 1;
                }
                coverage.set(entry.url, saved);
            }
        }
        await context.close();
    } };
}

async function injectModule(page) { await page.addScriptTag({ content: moduleBundle }); }
async function injectCandidate(page) {
    assert.ok(scriptPath, 'Set YIXUE_SCRIPT_PATH to the candidate bundle; the legacy release is never loaded by these tests.');
    await page.addScriptTag({ content: readFileSync(path.resolve(scriptPath), 'utf8') });
}

test('module DOM writer handles all four kinds, literal malicious answers, and repeated multiple choices', async () => {
    const session = await fixture(homework());
    try {
        const { page } = session;
        await injectModule(page);
        const result = await page.evaluate(async malicious => {
            const answers = { '水的化学式是什么？': 'H₂O', '多选适配测试': '甲#!#乙', '填空适配测试': '一#!#二', '判断适配测试': '正确', '安全显示测试': malicious };
            const calls = [];
            let balances = 0;
            const workflow = questionModule.createQuestionWorkflow({ bank: { search: async question => { calls.push(question); return { code: 1, data: answers[question.title] }; }, refreshBalance: async () => { balances++; } }, settings: { get: () => true }, unsafeWindow: window });
            const first = await workflow.run(document);
            await workflow.run(document, { useAi: false });
            return { first, calls, balances };
        }, malicious);
        assert.equal(result.first.answered, 5);
        assert.equal(result.first.accuracy, 100);
        assert.equal(result.balances, 10);
        assert.equal(result.calls[0].use_ai, true);
        assert.equal(result.calls[5].use_ai, false);
        assert.equal(await page.locator('#single-0').isChecked(), true);
        assert.equal(await page.locator('#multi-0').isChecked(), true);
        assert.equal(await page.locator('#multi-1').isChecked(), true);
        assert.equal(await page.locator('#multi-2').isChecked(), false);
        assert.equal(await page.locator('#judge-0').isChecked(), true);
        assert.equal(await page.locator('#answerEditorfill1').innerText(), '一');
        assert.equal(await page.locator('#answerEditorfill2').innerText(), '二');
        assert.equal(await page.locator('#answerEditorsafe1').innerText(), malicious);
        assert.equal(await page.locator('#answerEditorsafe1 img').count(), 0);
        assert.equal(await page.evaluate(() => !!globalThis.answerExecuted), false);
        assert.deepEqual(session.errors, []);
    } finally { await session.close(); }
});

test('module workflow leaves missed, ambiguous, incomplete and stopped questions unchanged', async () => {
    const html = '<html><body>' + choices('missing', 0, '未命中', ['甲', '乙']) + choices('ambiguous', 0, '同名', ['甲', '甲']) + choices('incomplete', 1, '不完整', ['甲', '乙']) + choices('fatal', 0, '停止', ['甲', '乙']) + choices('after', 0, '后续', ['甲', '乙']) + '</body></html>';
    const session = await fixture(html);
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            document.querySelector('#missing-1').checked = true;
            document.querySelector('#incomplete-1').checked = true;
            const calls = [];
            let balances = 0;
            const bank = { search: async q => { calls.push(q.title); return q.title === '停止' ? { code: 0, fatal: true } : q.title === '未命中' ? { code: 0 } : { code: 1, data: q.title === '同名' ? '甲' : '甲#!#不存在' }; }, refreshBalance: async () => { balances++; } };
            const result = await questionModule.createQuestionWorkflow({ bank }).run(document);
            return { result, calls, balances, checked: Array.from(document.querySelectorAll('input:checked')).map(item => item.id) };
        });
        assert.equal(result.result.answered, 0);
        assert.equal(result.result.stopped, true);
        assert.deepEqual(result.calls, ['未命中', '同名', '不完整', '停止']);
        assert.equal(result.balances, 4);
        assert.deepEqual(result.checked, ['missing-1', 'incomplete-1']);
    } finally { await session.close(); }
});

test('module writer preserves answers when a required choice or blank cannot be edited', async () => {
    const html = '<html><body>' + choices('disabled', 1, '禁用选项', ['甲', '乙']) + '<div class="TiMu"><input type="hidden" name="answertypereadonly" value="2"><h3 class="Zy_TItle">只读填空</h3><textarea>旧一</textarea><textarea readonly>旧二</textarea></div></body></html>';
    const session = await fixture(html);
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            document.querySelector('#disabled-1').checked = true;
            document.querySelector('#disabled-1').disabled = true;
            const workflow = questionModule.createQuestionWorkflow({ bank: { search: async q => ({ code: 1, data: q.type === 'multiple' ? '甲' : '新一#新二' }) } });
            const result = await workflow.run(document);
            return { result, checked: Array.from(document.querySelectorAll('input:checked')).map(input => input.id), values: Array.from(document.querySelectorAll('textarea')).map(input => input.value) };
        });
        assert.equal(result.result.answered, 0);
        assert.deepEqual(result.checked, ['disabled-1']);
        assert.deepEqual(result.values, ['旧一', '旧二']);
    } finally { await session.close(); }
});

test('module workflow supports pause, cancellation, dry runs, and no-token guard', async () => {
    const session = await fixture(choices('one', 0, '题目', ['甲', '乙']));
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            let calls = 0;
            let pauses = 0;
            const bank = { getToken: () => '', search: async () => { calls++; return { code: 1, data: '甲' }; } };
            const noToken = await questionModule.createQuestionWorkflow({ bank }).run(document);
            bank.getToken = () => 'tk_fixture';
            const workflow = questionModule.createQuestionWorkflow({ bank, waitIfPaused: async () => { pauses++; } });
            const dry = await workflow.run(document, { apply: false });
            const controller = new AbortController(); controller.abort();
            const cancelled = await workflow.run(document, { signal: controller.signal });
            const pausedController = new AbortController();
            const pausedWorkflow = questionModule.createQuestionWorkflow({ bank, waitIfPaused: async () => { pausedController.abort(); throw new DOMException('Aborted', 'AbortError'); } });
            const pausedCancellation = await pausedWorkflow.run(document, { signal: pausedController.signal });
            return { noToken, dry, cancelled, pausedCancellation, calls, pauses, checked: document.querySelector('input[type=radio]').checked };
        });
        assert.equal(result.noToken.stopped, true);
        assert.equal(result.dry.answered, 1);
        assert.equal(result.cancelled.stopped, true);
        assert.equal(result.pausedCancellation.stopped, true);
        assert.equal(result.calls, 1);
        assert.equal(result.pauses, 1);
        assert.equal(result.checked, false);
    } finally { await session.close(); }
});

test('module DOM reader handles integer Chinese numbering, custom exam options, textarea and contenteditable', async () => {
    const html = '<html><body><div class="noSplitBx"><h2 class="type_tit">判断题</h2><h3 class="mark_name colorDeep">一、（判断题，2 分） 判断适配测试</h3><div class="judgeoption" id="modern-right" onclick="this.querySelector(\'span\').classList.add(\'check_answer\')"><span>对</span></div><div class="judgeoption"><span>错</span></div></div><div class="TiMu"><input name="answertypefill" type="hidden" value="2"><h3 class="Zy_TItle">2. （填空题，2分） 纯文本输入</h3><textarea></textarea><div contenteditable="true"></div><input type="hidden" value="隐藏答案"></div></body></html>';
    const session = await fixture(html);
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            const questions = questionModule.readQuestions(document);
            const workflow = questionModule.createQuestionWorkflow({ bank: { search: async q => ({ code: 1, data: q.type === 'judge' ? 'true' : '第一空#第二空' }) } });
            const result = await workflow.run(document);
            await workflow.run(document);
            return { result, titles: questions.map(q => q.title), textarea: document.querySelector('textarea').value, editable: document.querySelector('[contenteditable]').textContent, selected: document.querySelector('#modern-right span').classList.contains('check_answer') };
        });
        assert.deepEqual(result.titles, ['判断适配测试', '纯文本输入']);
        assert.equal(result.result.answered, 2);
        assert.equal(result.textarea, '第一空');
        assert.equal(result.editable, '第二空');
        assert.equal(result.selected, true);
    } finally { await session.close(); }
});

test('module mobile chapter adapter writes host answer letters and true/false without mixing hidden values into questions', async () => {
    const mobileChoice = (id, type, title, options) => `<div class="Py-mian1"><input type="hidden" id="answertype${id}" value="${type}"><input type="hidden" id="answer${id}" value="private-old-answer"><h3 class="Py-m1-title fs16">${title}</h3><ul>${options.map((text, index) => `<li class="clearfix" id-param="${id.replace(/\D/g, '')}"><em id-param="${String.fromCharCode(65 + index)}">${String.fromCharCode(65 + index)}</em><div class="fl after">${text}</div></li>`).join('')}</ul></div>`;
    const html = '<html><body>' + mobileChoice('s123', 0, '一、手机单选', ['甲', '乙']) + mobileChoice('s124', 1, '二、手机多选', ['甲', '乙', '丙']) + mobileChoice('s125', 3, '三、手机判断', ['正确', '错误']) + '<div class="Py-mian1"><input type="hidden" id="answertype126" value="2"><h3 class="Py-m1-title fs16">四、手机填空</h3><textarea class="answerInput"></textarea><div class="answerInput" contenteditable="true"></div></div></body></html>';
    const session = await fixture(html, '/mooc-ans/modules/work/index.html');
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            const calls = [];
            const answers = { '手机单选': '乙', '手机多选': '丙#甲', '手机判断': 'false', '手机填空': '第一空#第二空' };
            const workflow = questionModule.createQuestionWorkflow({ bank: { search: async question => { calls.push(question); return { code: 1, data: answers[question.title] }; } } });
            const first = await workflow.run(document);
            await workflow.run(document);
            return { first, calls, answers: Array.from(document.querySelectorAll('input[id^=answer]:not([id^=answertype])')).map(input => input.value), selected: Array.from(document.querySelectorAll('li.cur em')).map(em => em.getAttribute('id-param')), collected: workflow.collect(document), fill: [document.querySelector('textarea').value, document.querySelector('[contenteditable]').textContent] };
        });
        assert.equal(result.first.answered, 4);
        assert.deepEqual(result.answers, ['B', 'AC', 'false']);
        assert.deepEqual(result.selected, ['B', 'A', 'C', 'B']);
        assert.deepEqual(result.fill, ['第一空', '第二空']);
        assert.equal(/private-old-answer|fields|host|element/.test(JSON.stringify(result.calls)), false);
        assert.equal(/private-old-answer|answerInput|fields|host|element/.test(JSON.stringify(result.collected)), false);
        assert.deepEqual(result.calls[0].options, ['甲', '乙']);
    } finally { await session.close(); }
});

test('module collect preserves question image/formula information while excluding scripts, hidden fields and answers', async () => {
    const html = '<html><body><div class="TiMu"><input type="hidden" name="answertypeassets" value="0"><div class="Zy_TItle">1. 公式 <span data-latex="x^2+y^2">冗余公式</span><img src="/figure.png?token=private" alt="直角三角形"><script>globalThis.hiddenSecret="do not upload"</script><input type="hidden" value="用户答案"><span class="answer">答案机密<img src="/answer-private.png"></span><span hidden><img src="/hidden-private.png"></span></div><label><input type="radio">甲<img src="/option.png" alt="选项示意"></label><label><input type="radio">乙</label><input type="hidden" name="answer" value="甲"></div></body></html>';
    const session = await fixture(html);
    try {
        await injectModule(session.page);
        const collected = await session.page.evaluate(() => questionModule.collectQuestions(document));
        assert.equal(collected.length, 1);
        assert.match(collected[0].title, /x\^2\+y\^2/);
        assert.match(collected[0].title, /直角三角形/);
        assert.deepEqual(collected[0].options, ['甲 选项示意', '乙']);
        assert.deepEqual(collected[0].assets, [{ kind: 'formula', formula: 'x^2+y^2', alt: '' }, { kind: 'image', url: 'https://mooc1.chaoxing.com/figure.png', alt: '直角三角形' }, { kind: 'image', url: 'https://mooc1.chaoxing.com/option.png', alt: '选项示意' }]);
        assert.equal(/用户答案|答案机密|do not upload|private|checked|element|fields/.test(JSON.stringify(collected)), false);
    } finally { await session.close(); }
});

test('module navigation stops on an unchanged question, timeout, and cancellation without repeating a paid query', async () => {
    const html = '<html><body>' + choices('one', 0, '当前题目', ['甲', '乙']) + '<div style="display:none"><button id="hidden-next" onclick="globalThis.hiddenNextClicks++">下一题</button></div><button id="exam-next" onclick="globalThis.examNextClicks++">下一个</button><button onclick="globalThis.examSubmitClicks++">提交</button><script>globalThis.examNextClicks=0;globalThis.examSubmitClicks=0;globalThis.hiddenNextClicks=0;</script></body></html>';
    const session = await fixture(html);
    try {
        await injectModule(session.page);
        const result = await session.page.evaluate(async () => {
            let calls = 0;
            const bank = { search: async () => { calls++; return { code: 1, data: '甲' }; } };
            const timeout = await questionNavigation.runQuestionPages(questionModule.createQuestionWorkflow({ bank }), document, { timeoutMs: 40, settleMs: 5 });
            const controller = new AbortController();
            document.querySelector('#exam-next').onclick = () => { examNextClicks++; setTimeout(() => controller.abort(), 5); };
            const cancelled = await questionNavigation.runQuestionPages(questionModule.createQuestionWorkflow({ bank }), document, { signal: controller.signal, timeoutMs: 1000, settleMs: 5 });
            return { timeout, cancelled, calls, clicks: [examNextClicks, hiddenNextClicks, examSubmitClicks] };
        });
        assert.equal(result.timeout.stopped, true);
        assert.equal(result.cancelled.stopped, true);
        assert.equal(result.calls, 2);
        assert.deepEqual(result.clicks, [2, 0, 0]);
    } finally { await session.close(); }
});

test('candidate bundle automatically answers homework and the single-question exam with offline GM requests', async () => {
    const answers = { '水的化学式是什么？': 'H₂O', '多选适配测试': '甲#!#乙', '填空适配测试': '一#!#二', '判断适配测试': '正确', '安全显示测试': malicious };
    const session = await fixture(homework(), '/work/doHomeWorkNew?courseId=1', { answers });
    try {
        await injectCandidate(session.page);
        try {
            await session.page.waitForFunction(() => document.querySelector('#single-0').checked && document.querySelector('#answerEditorsafe1')?.textContent.includes('<img'), null, { timeout: 5000 });
        } catch (error) {
            console.log('Candidate diagnostics: ' + JSON.stringify({ errors: session.errors, requests: session.requests.map(item => ({ path: item.path, body: item.body })), text: await session.page.locator('body').innerText() }));
            throw error;
        }
        assert.equal(session.requests.filter(item => item.path === '/api/v1/search').length, 5);
        assert.equal(await session.page.locator('#multi-0').isChecked(), true);
        assert.equal(await session.page.locator('#multi-1').isChecked(), true);
        assert.equal(await session.page.locator('#judge-0').isChecked(), true);
        assert.equal(await session.page.locator('#answerEditorsafe1 img').count(), 0);
        assert.deepEqual(session.errors, []);
    } finally { await session.close(); }
    const exam = '<html><body><div class="mark_info">已设置不允许整卷预览</div><div class="noSplitBx"><h2 class="type_tit">判断题</h2><h3 class="mark_name colorDeep">1. （判断题，2 分） 判断适配测试</h3><div class="judgeoption" id="modern-right" onclick="this.querySelector(\'span\').classList.add(\'check_answer\')"><span>对</span></div><div class="judgeoption"><span>错</span></div></div></body></html>';
    const examSession = await fixture(exam, '/exam-ans/exam/test/reVersionTestStartNew?newMooc=true&courseid=1&clazzid=2', { answers });
    try {
        await injectCandidate(examSession.page);
        await examSession.page.waitForFunction(() => document.querySelector('#modern-right span').classList.contains('check_answer'));
        assert.equal(examSession.requests.find(item => item.path === '/api/v1/search').body.title, '判断适配测试');
        assert.deepEqual(examSession.errors, []);
    } finally { await examSession.close(); }
});

test('candidate modern exam follows a changed next question once and leaves final submission to the user', async () => {
    const question = (number, title) => `<div class="noSplitBx"><h2 class="type_tit">判断题</h2><h3 class="mark_name">${number}. （判断题，2 分） ${title}</h3><div class="judgeoption" id="exam-right" onclick="this.querySelector('span').classList.add('check_answer')"><span>对</span></div><div class="judgeoption"><span>错</span></div></div>`;
    const first = question(1, '分页第一题');
    const second = question(2, '分页第二题');
    const html = '<html><body><main id="exam-question">' + first + '</main><button id="exam-next">下一题</button><button id="exam-submit">交卷</button><script>globalThis.examNextClicks=0;globalThis.examSubmitClicks=0;document.querySelector("#exam-submit").onclick=()=>{examSubmitClicks++};document.querySelector("#exam-next").onclick=()=>{examNextClicks++;document.querySelector("#exam-question").innerHTML=' + JSON.stringify(second) + ';document.querySelector("#exam-next").remove();};</script></body></html>';
    const session = await fixture(html, '/exam-ans/exam/test/reVersionTestStartNew?newMooc=true&courseid=1&clazzid=2', { answers: { '分页第一题': '正确', '分页第二题': '正确' } });
    try {
        await injectCandidate(session.page);
        await session.page.waitForFunction(() => document.querySelector('.mark_name').textContent.includes('分页第二题') && document.querySelector('#exam-right span').classList.contains('check_answer'));
        assert.deepEqual(session.requests.filter(item => item.path === '/api/v1/search').map(item => item.body.title), ['分页第一题', '分页第二题']);
        assert.deepEqual(await session.page.evaluate(() => [examNextClicks, examSubmitClicks]), [1, 0]);
        await session.page.waitForFunction(() => document.querySelector('[data-yixue-question-state]')?.textContent.includes('已填写'));
        assert.match(await session.page.locator('body').innerText(), /最终交卷由你确认/);
        assert.deepEqual(session.errors, []);
    } finally { await session.close(); }
});

test('candidate modern exam keeps its current page on an incomplete match or fatal bank reply', async () => {
    const html = '<html><body><div class="noSplitBx"><h2 class="type_tit">多选题</h2><h3 class="mark_name">1. （多选题，2 分） 分页不完整</h3><label><input id="blocked-a" name="blocked" type="checkbox">甲</label><label><input id="blocked-b" name="blocked" type="checkbox">乙</label></div><button id="exam-next" onclick="globalThis.examNextClicks++">下一个</button><button onclick="globalThis.examSubmitClicks++">提交</button><script>globalThis.examNextClicks=0;globalThis.examSubmitClicks=0;</script></body></html>';
    for (const scenario of [{ answers: { '分页不完整': '甲#!#不存在' } }, { status: { '分页不完整': 402 } }]) {
        const session = await fixture(html, '/exam-ans/exam/test/reVersionTestStartNew?newMooc=true&courseid=1&clazzid=2', scenario);
        try {
            await injectCandidate(session.page);
            await session.page.waitForFunction(() => fixtureGmReplies.some(item => item.url.endsWith('/api/v1/search')));
            await session.page.waitForFunction(() => !!document.querySelector('[data-yixue-question-state]')?.textContent);
            assert.deepEqual(await session.page.evaluate(() => [examNextClicks, examSubmitClicks]), [0, 0]);
            assert.equal(await session.page.locator('input:checked').count(), 0);
            assert.equal(session.requests.filter(item => item.path === '/api/v1/search').length, 1);
            assert.deepEqual(session.errors, []);
        } finally { await session.close(); }
    }
});

test('candidate bundle makes no paid request without a real token and fatal replies stop later questions', async () => {
    const noToken = await fixture(homework(), '/work/doHomeWorkNew?courseId=1', { savedToken: '' });
    try {
        await injectCandidate(noToken.page);
        await noToken.page.waitForTimeout(400);
        assert.equal(noToken.requests.filter(item => item.path === '/api/v1/search').length, 0);
        assert.equal(await noToken.page.locator('input:checked').count(), 0);
    } finally { await noToken.close(); }
    const stopped = await fixture(homework(), '/work/doHomeWorkNew?courseId=1', { status: { '水的化学式是什么？': 402 } });
    try {
        await injectCandidate(stopped.page);
        await stopped.page.waitForFunction(() => fixtureGmReplies.some(item => item.url.endsWith('/api/v1/search') && item.status === 402));
        assert.equal(stopped.requests.filter(item => item.path === '/api/v1/search').length, 1);
        assert.equal(await stopped.page.locator('input:checked').count(), 0);
    } finally { await stopped.close(); }
});

test('candidate collection requires consent, supports cancel, deduplicates, disables, and never uploads answers', async () => {
    const session = await fixture(homework(), '/fixture-collection');
    try {
        await injectCandidate(session.page);
        assert.equal(session.requests.filter(item => item.path === '/api/question-submissions').length, 0);
        await session.page.evaluate(async () => { fixtureConfirm = false; await fixtureMenus['启用自动题目采集（首次需授权）'](); });
        assert.equal(session.requests.filter(item => item.path === '/api/submission-tokens/provision').length, 0);
        await session.page.evaluate(async () => { fixtureConfirm = true; await fixtureMenus['启用自动题目采集（首次需授权）'](); });
        await session.page.waitForFunction(() => !!GM_getValue('yixueSubmissionSeen', ''));
        const uploads = session.requests.filter(item => item.path === '/api/question-submissions');
        assert.equal(uploads.length, 1);
        assert.equal(uploads[0].body.questions.length, 5);
        assert.ok(uploads[0].body.questions.every(item => !('answer' in item) && !('fields' in item)));
        await session.page.evaluate(async () => { await fixtureMenus['启用自动题目采集（首次需授权）'](); });
        await session.page.waitForTimeout(100);
        assert.equal(session.requests.filter(item => item.path === '/api/question-submissions').length, 1);
        await session.page.evaluate(() => fixtureMenus['关闭自动题目采集并清除 Token']());
        assert.equal(await session.page.evaluate(() => GM_getValue('yixueSubmissionConsent')), false);
        assert.equal(await session.page.evaluate(() => GM_getValue('yixueSubmissionToken')), '');
        assert.equal(session.requests.filter(item => item.path === '/api/v1/search').length, 0);
        assert.deepEqual(session.errors, []);
    } finally { await session.close(); }
});
