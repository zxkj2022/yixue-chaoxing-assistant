'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });
const sources = require('./helpers/question-sources.cjs')(['reader', 'matcher', 'collection-answer']);
const bundle = '(function(){const sources=' + JSON.stringify(sources) + ';const cache={};function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;new Function("require","module","exports",sources[name])(load,module,module.exports);return module.exports;}window.collectionReader=load("./reader.js");})();';
function question(answer, { type = '1', extra = '', options = ['甲', '乙', '丙'] } = {}) {
    return '<div class="TiMu"><input name="answertype1" type="hidden" value="' + type + '"><div class="Zy_TItle">1. 测试题</div><ul>' + options.map((text, index) => '<li class="question-option">' + String.fromCharCode(65 + index) + '. ' + text + '</li>').join('') + '</ul>' + answer + extra + '</div>';
}
async function collect(html, callback) {
    const context = await browser.newContext();
    try {
        await context.route('**/*', route => route.fulfill({ contentType: 'text/plain', body: '' }));
        const page = await context.newPage();
        await page.setContent(html); await page.addScriptTag({ content: bundle });
        return callback ? await callback(page) : await page.evaluate(() => collectionReader.collectQuestions(document));
    } finally { await context.close(); }
}

test('published answer labels and analysis are collected without student answers or hidden credentials', async () => {
    const items = await collect(question('<div class="Py_answer"><span class="colorGreen">正确答案：AC</span><span class="colorDeep">我的答案：B</span><input type="hidden" value="private-cookie"></div><div class="analysis">答案解析：甲与丙符合题意<script>privateSecret()</script></div>'));
    assert.equal(items[0].answer, '甲#!#丙');
    assert.equal(items[0].answer_format, 'text');
    assert.equal(items[0].answer_source, 'published');
    assert.equal(items[0].analysis, '甲与丙符合题意');
    assert.equal(/private|我的答案/.test(JSON.stringify(items)), false);
});

test('only an explicit correct grading result can promote the displayed student answer', async () => {
    for (const marker of ['<i class="dui"></i>', '<span class="grading-result">本题回答正确</span>']) {
        const items = await collect(question('<div class="Py_answer">' + marker + '<span>我的答案：AC</span></div>'));
        assert.equal(items[0].answer_source, 'graded_correct');
        assert.equal(items[0].answer, '甲#!#丙');
    }
    for (const marker of ['', '<i class="cuo"></i>', '<span class="grading-result">回答不正确</span>', '<span class="grading-result">部分正确</span>']) {
        const items = await collect(question('<div class="Py_answer">' + marker + '<span>我的答案：A</span></div>'));
        assert.equal(items[0].answer, undefined);
    }
});

test('hidden answers, conflicting official labels and invalid letters are never collected as correct', async () => {
    for (const answer of ['<div class="Py_answer" style="display:none">正确答案：AC</div>', '<div class="Py_answer" hidden>正确答案：AC</div>', '<div class="Py_answer">正确答案：AZ</div>', '<div class="Py_answer"><span>正确答案：A</span><span>参考答案：C</span></div>']) {
        assert.equal((await collect(question(answer)))[0].answer, undefined);
    }
});

test('an answer label inside a review row excludes adjacent scores and hidden answer fragments', async () => {
    const items = await collect(question('<style>.private-answer{display:none}</style><div class="Py_answer"><span>正确答案：A<span class="private-answer">B</span></span><em>2分</em></div>', { type: '0' }));
    assert.equal(items[0].answer, '甲');
});

test('reviewed fill questions without editable blanks retain all numbered standard answers', async () => {
    const items = await collect(question('<div class="mark_answer"><span>正确答案：</span><div>第1空：第一空内容</div><div>第2空：第二空内容</div></div>', { type: '2', options: [] }));
    assert.equal(items.length, 1);
    assert.equal(items[0].answer, '第一空内容#!#第二空内容');
});

test('rendered answers becoming available later change the collected snapshot without collecting a draft', async () => {
    await collect(question('<div class="Py_answer"><span>我的答案：A</span></div>'), async page => {
        const before = await page.evaluate(() => collectionReader.collectQuestions(document));
        assert.equal(before[0].answer, undefined);
        await page.evaluate(() => { document.querySelector('.Py_answer').innerHTML = '<span>正确答案：B</span>'; });
        const after = await page.evaluate(() => collectionReader.collectQuestions(document));
        assert.equal(after[0].answer, '乙');
    });
});

test('judgement grading does not confuse a correct false answer with a wrong grading result', async () => {
    const items = await collect(question('<div class="Py_answer"><i class="dui"></i><span>我的答案：错误</span></div>', { type: '0', options: ['正确', '错误'] }));
    assert.equal(items[0].type, 'judge');
    assert.equal(items[0].answer, '错误');
});

test('Zhihuishu and modern exam review containers expose reusable answer text', async () => {
    const zhihuishu = '<div class="questionBox"><div class="questionTit">单选题</div><div class="questionContent">智慧树已批阅</div><ul class="optionUl"><li><label>A. 甲</label></li><li><label>B. 乙</label></li></ul><div class="correctAnswer">B</div><div class="analysis-content">解析：乙符合条件</div></div>';
    const items = await collect(zhihuishu);
    assert.equal(items[0].answer, '乙');
    assert.equal(items[0].analysis, '乙符合条件');
    const modern = '<div class="noSplitBx"><div class="type_tit">简答题</div><h3 class="mark_name">1. 说明原理</h3><div class="mark_answer">参考答案：标准论述正文</div></div>';
    const essay = await collect(modern);
    assert.equal(essay[0].type, 'answer');
    assert.equal(essay[0].answer, '标准论述正文');
});

test('encrypted standard answers are withheld until the page restores the font text', async () => {
    const html = question('<div class="mark_answer">正确答案：<span class="font-cxsecret">未还原正文</span></div>', { type: '4', options: [] });
    await collect(html, async page => {
        assert.equal((await page.evaluate(() => collectionReader.collectQuestions(document)))[0].answer, undefined);
        await page.evaluate(() => { const node = document.querySelector('.font-cxsecret'); node.textContent = 'CPU'; node.classList.remove('font-cxsecret'); });
        assert.equal((await page.evaluate(() => collectionReader.collectQuestions(document)))[0].answer, 'CPU');
    });
});
