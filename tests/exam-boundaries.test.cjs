'use strict';
const { before, after, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { bundle } = require('../scripts/build.cjs');
const script = bundle({ testing: true, compact: true });
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

function choiceQuestion(index, { root = 'noSplitBx', inputs = true, nested = false, readonly = false } = {}) {
    const number = index + 1;
    const title = '第' + number + '道独立题干';
    const stem = nested ? '<span class="fontLabel">' + title + '</span>' : title;
    const options = ['甲', '乙', '丙', '丁'].map((text, option) => '<li class="answerBg"><label>' +
        (readonly ? '' : '<input type="radio" name="answer' + number + '" value="' + option + '">') +
        '<span class="num_option">' + String.fromCharCode(65 + option) + '</span><span class="optionCon">' + text + number + '</span></label></li>').join('');
    return '<div class="' + root + '" id="question-' + number + '">' +
        (inputs ? '<input type="hidden" name="answertype' + number + '" value="0">' : '') +
        '<h3 class="mark_name">' + number + '.（单选题，1.0分）' + stem + '</h3><ul>' + options + '</ul></div>';
}
function paper({ count = 40, outer = 'question-item', root, globalTypes = false, nested = false, readonly = false } = {}) {
    return '<!doctype html><html><body><header>考试预览</header><form id="fanyaMarking" class="' + outer + '">' +
        (globalTypes ? Array.from({ length: count }, (_, i) => '<input type="hidden" name="answertype' + (i + 1) + '" value="0">').join('') : '') +
        '<h2>一、单选题（共' + count + '题）</h2>' + Array.from({ length: count }, (_, i) => choiceQuestion(i, { root, inputs: !globalTypes, nested, readonly })).join('') +
        '</form><aside><ul><li>题号导航</li><li>交卷</li></ul></aside></body></html>';
}
async function fixture(t, html) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(4000); t.after(() => page.close());
    await page.route('**/*', route => route.fulfill({ contentType: 'text/plain', body: '' }));
    await page.setContent(html);
    await page.addScriptTag({ content: script });
    return page;
}
for (const outer of ['question-item', 'TiMu', 'noSplitBx', 'Py-mian1']) test('forty exam questions remain isolated inside outer ' + outer, async t => {
    const page = await fixture(t, paper({ outer }));
    const questions = await page.evaluate(() => testLoad('questions/reader').readQuestions(document).map(q => ({ id: q.id, title: q.title, options: q.options })));
    assert.equal(questions.length, 40);
    assert.equal(questions[0].title, '第1道独立题干');
    assert.deepEqual(questions[0].options, ['甲1', '乙1', '丙1', '丁1']);
    assert.equal(questions.at(-1).title, '第40道独立题干');
    assert.ok(questions.every(q => q.id !== 'fanyaMarking' && q.options.length === 4));
});
test('unrecognized question wrappers and form-level type fields do not merge a preview into one query', async t => {
    const page = await fixture(t, paper({ outer: '', root: 'exam-preview-block', globalTypes: true }));
    const questions = await page.evaluate(() => testLoad('questions/reader').readQuestions(document).map(q => ({ title: q.title, options: q.options })));
    assert.equal(questions.length, 40);
    assert.deepEqual(questions[18], { title: '第19道独立题干', options: ['甲19', '乙19', '丙19', '丁19'] });
});
test('nested title aliases, option font labels and option item classes do not create duplicate questions', async t => {
    const page = await fixture(t, paper({ count: 3, nested: true }).replaceAll('class="answerBg"', 'class="answerBg question-item"').replaceAll('class="optionCon"', 'class="optionCon fontLabel"'));
    const questions = await page.evaluate(() => testLoad('questions/reader').readQuestions(document).map(q => ({ title: q.title, options: q.options })));
    assert.equal(questions.length, 3);
    assert.equal(questions[2].title, '第3道独立题干');
    assert.deepEqual(questions[2].options, ['甲3', '乙3', '丙3', '丁3']);
});
test('forty-question preview sends forty bounded API requests and confirms each writable answer independently', async t => {
    const page = await fixture(t, paper());
    const result = await page.evaluate(async () => {
        const calls = [], values = new Map([['shenchanranToken', 'ys_' + 'a'.repeat(43)]]);
        const client = testLoad('core/question-bank')({ getValue: (key, fallback) => values.has(key) ? values.get(key) : fallback, setValue: (key, value) => values.set(key, value), request: details => {
            const query = JSON.parse(details.data); calls.push(query);
            queueMicrotask(() => details.onload({ status: 200, finalUrl: details.url, responseText: JSON.stringify({ code: 'OK', cost: 0, bucket: 'member', data: [{ answer: query.options[1] }] }) }));
            return { abort() {} };
        } });
        let submits = 0; window.submitAction = () => submits++;
        const workflow = testLoad('questions/index').createQuestionWorkflow({ bank: { getToken: client.getToken, search: client.search }, wait: async () => {} });
        const run = await workflow.run(document);
        return { total: run.total, matched: run.matched, answered: run.answered, calls, selected: [...document.querySelectorAll('input[type=radio]:checked')].map(n => n.value), submits };
    });
    assert.equal(result.total, 40); assert.equal(result.calls.length, 40);
    assert.equal(result.matched, 40); assert.equal(result.answered, 40);
    assert.deepEqual(result.selected, Array(40).fill('1'));
    assert.ok(result.calls.every(query => query.options.length === 4 && query.title.length < 100));
    assert.ok(result.calls.every(query => Object.keys(query).sort().join(',') === 'options,title,type,use_ai'));
    assert.equal(result.submits, 0);
});
test('read-only preview reports matches without falsely claiming the answers were filled', async t => {
    const page = await fixture(t, paper({ count: 4, readonly: true }));
    const result = await page.evaluate(async () => {
        const queries = [];
        const workflow = testLoad('questions/index').createQuestionWorkflow({ bank: { search: async query => { queries.push(query); return { code: 1, data: query.options[1] }; } }, wait: async () => {} });
        const outcome = await workflow.run(document);
        return { total: outcome.total, matched: outcome.matched, answered: outcome.answered, queries: queries.length };
    });
    assert.deepEqual(result, { total: 4, matched: 4, answered: 0, queries: 4 });
});
test('an ambiguous paper wrapper with multiple type IDs is never sent as one question', async t => {
    const page = await fixture(t, '<form id="fanyaMarking" class="question-item"><h3>整卷说明</h3><input name="answertype1" value="0"><input name="answertype2" value="0"><ul><li><label><input type="radio">甲</label></li></ul></form>');
    assert.equal(await page.evaluate(() => testLoad('questions/reader').readQuestions(document).length), 0);
});
test('non-question UI, hidden templates and published answers do not become extra stems', async t => {
    const html = paper({ count: 2 }) + '<div id="yixue-ui-root"><div class="question-item"><h3 class="question-title">面板标题</h3></div></div><template>' + choiceQuestion(8) + '</template><div hidden>' + choiceQuestion(9) + '</div>';
    const page = await fixture(t, html);
    const questions = await page.evaluate(() => testLoad('questions/reader').readQuestions(document));
    assert.equal(questions.length, 2);
});
test('an unrelated title-only help panel is not queried as an extra exam question', async t => {
    const page = await fixture(t, paper({ count: 2 }) + '<aside><h3 class="question-title">帮助说明</h3><p>请选择题号查看内容</p></aside>');
    assert.equal(await page.evaluate(() => testLoad('questions/reader').readQuestions(document).length), 2);
});
test('mixed exam question types retain independent options and fields under one page wrapper', async t => {
    const html = '<form id="fanyaMarking" class="question-item">' + choiceQuestion(0) +
        '<div class="noSplitBx"><h3 class="mark_name">2.（多选题）多选题干</h3><label><input type="checkbox" name="m">甲</label><label><input type="checkbox" name="m">乙</label></div>' +
        '<div class="noSplitBx"><h3 class="mark_name">3.（判断题）判断题干</h3><label><input type="radio" name="j" value="true">正确</label><label><input type="radio" name="j" value="false">错误</label></div>' +
        '<div class="noSplitBx"><h3 class="mark_name">4.（填空题）填空题干</h3><input type="text" id="fill"></div></form>';
    const page = await fixture(t, html);
    const result = await page.evaluate(async () => {
        const workflow = testLoad('questions/index').createQuestionWorkflow({ bank: { search: async query => ({ code: 1, data: ({ single: '乙1', multiple: '甲#!#乙', judge: '正确', fill: '填空值' })[query.type] }) }, wait: async () => {} });
        const questions = workflow.read(document).map(q => ({ type: q.type, fields: q.fields.length, options: q.options.length }));
        const run = await workflow.run(document);
        return { questions, answered: run.answered, value: document.querySelector('#fill').value };
    });
    assert.deepEqual(result.questions.map(q => q.type), ['single', 'multiple', 'judge', 'fill']);
    assert.deepEqual(result.questions.map(q => q.options), [4, 2, 2, 0]);
    assert.equal(result.answered, 4); assert.equal(result.value, '填空值');
});
test('question blocks without known class names keep the original h3 fallback', async t => {
    const html = '<form><section><input name="answertype1" value="0" type="hidden"><h3>1. 单题旧版结构</h3><label><input type="radio">甲</label></section><section><input name="answertype2" value="0" type="hidden"><h3>2. 另一题旧版结构</h3><label><input type="radio">乙</label></section></form>';
    const page = await fixture(t, html);
    assert.equal(await page.evaluate(() => testLoad('questions/reader').readQuestions(document).length), 2);
});
test('legacy exam IDs and types stay on questionLi when its noSplitBx child contains the content', async t => {
    const html = '<form id="fanyaMarking" data-question-id="fanyaMarking"><div class="questionLi" data="123"><input type="hidden" name="type123" value="1"><div class="noSplitBx"><h3 class="mark_name">1. 旧版多选</h3><ul><li><span class="choice123">A</span><div class="optionCon">甲</div></li><li><span class="choice123">B</span><div class="optionCon">乙</div></li></ul></div></div></form>';
    const page = await fixture(t, html);
    const result = await page.evaluate(() => testLoad('questions/reader').readQuestions(document).map(q => ({ id: q.id, nativeId: q.nativeId, type: q.type, options: q.options })));
    assert.deepEqual(result, [{ id: '123', nativeId: '123', type: 'multiple', options: ['甲', '乙'] }]);
});
for (const wrapper of ['class="TiMu"', 'data-question-id="fanyaMarking"']) test('forty legacy questionLi IDs and types survive paper wrapper ' + wrapper, async t => {
    const rows = Array.from({ length: 40 }, (_, index) => {
        const id = 101 + index, type = index % 2;
        return '<div class="questionLi" data="' + id + '"><input type="hidden" name="type' + id + '" value="' + type + '"><div class="noSplitBx"><h3 class="mark_name">' + (index + 1) + '. 第' + id + '题</h3><ul>' +
            ['甲', '乙', '丙', '丁'].map((value, option) => '<li><span class="choice' + id + '">' + String.fromCharCode(65 + option) + '</span><div class="optionCon">' + value + id + '</div></li>').join('') + '</ul></div></div>';
    }).join('');
    const page = await fixture(t, '<form id="fanyaMarking" ' + wrapper + '>' + rows + '</form>');
    const questions = await page.evaluate(() => testLoad('questions/reader').readQuestions(document).map(q => ({ id: q.id, type: q.type, options: q.options })));
    assert.equal(questions.length, 40);
    assert.deepEqual(questions.map(q => q.id), Array.from({ length: 40 }, (_, i) => String(101 + i)));
    assert.ok(questions.every((q, i) => q.type === (i % 2 ? 'multiple' : 'single') && q.options.length === 4));
});
test('the installed script parses and answers forty preview questions without submitting the paper', async t => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(4000); t.after(() => page.close());
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: paper() }));
    await page.goto('https://mooc1.chaoxing.com/exam-ans/mooc2/exam/preview?courseId=101&classId=202');
    await page.clock.install();
    await page.evaluate(version => {
        const values = new Map([['shenchanranToken', 'ys_' + 'a'.repeat(43)]]);
        window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
        window.GM_setValue = (key, value) => values.set(key, value);
        window.GM_registerMenuCommand = () => {};
        window.GM_info = { script: { version } }; window.unsafeWindow = window;
        window.apiSearches = []; window.submits = 0;
        window.submitAction = () => submits++;
        HTMLFormElement.prototype.submit = () => submits++;
        document.querySelector('form').addEventListener('submit', event => { event.preventDefault(); submits++; });
        window.GM_xmlhttpRequest = details => {
            const url = new URL(details.url); let status = 200, body;
            if (url.pathname === '/api/v1/search') {
                const query = JSON.parse(details.data); apiSearches.push(query);
                body = { code: 'OK', cost: 0, bucket: 'member', data: [{ answer: query.options[1] }] };
            } else if (url.pathname === '/api/v1/balance') body = { code: 'OK', cost: 0, data: { points: 42, member: true, member_until: 1900000000, daily_limit: 200, daily_remaining: 120, vip_level: 2, plan_name: 'SVIP' } };
            else if (url.pathname === '/api/v1/capabilities') body = { code: 'OK', cost: 0, protocol_version: '1', data: { ai: { enabled: false, allowed: false, ready: false, effective_model: null, price_points: null, disabled_reason: 'account_disabled' } } };
            else { status = 403; body = { detail: 'not enabled in fixture' }; }
            queueMicrotask(() => details.onload({ status, finalUrl: details.url, responseText: JSON.stringify(body) }));
            return { abort() { details.onabort?.(); } };
        };
    }, require('../package.json').version);
    await page.addScriptTag({ content: fs.readFileSync('易学·超星学习通助手.user.js', 'utf8') });
    for (let i = 0; i < 45 && await page.evaluate(() => apiSearches.length) < 40; i++) await page.clock.runFor(2000);
    await page.clock.runFor(4000);
    const result = await page.evaluate(() => ({ calls: apiSearches.length, counts: apiSearches.map(query => query.options.length), selected: document.querySelectorAll('#fanyaMarking input[type=radio]:checked').length, submits, summary: document.querySelector('.yixue-question-summary')?.textContent }));
    assert.equal(result.calls, 40); assert.equal(result.selected, 40);
    assert.ok(result.counts.every(count => count === 4));
    assert.match(result.summary, /共 40.*已填 40.*命中 40/); assert.equal(result.submits, 0);
});
