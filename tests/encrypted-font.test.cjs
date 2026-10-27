'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sources = require('./helpers/question-sources.cjs')(['index', 'reader', 'matcher', 'writer', 'collection-answer']);
const bundle = '(function(){const sources=' + JSON.stringify(sources) + ';const cache={};function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;new Function("require","module","exports",sources[name])(load,module,module.exports);return module.exports;}window.questionModule=load("./index.js");})();';
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
after(async () => { await browser?.close(); });

async function fixture(html, callback) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    try {
        await context.route('**/*', route => route.fulfill({ body: '', contentType: 'text/plain' }));
        const page = await context.newPage();
        await page.setContent(html);
        await page.addScriptTag({ content: bundle });
        return await callback(page);
    } finally { await context.close(); }
}

function question(title, options = ['甲', '乙'], attributes = '') {
    return `<div class="TiMu" ${attributes}><input type="hidden" name="answertype123" value="0"><h3 class="Zy_TItle">${title}</h3>${options.map(text => `<label><input type="radio" name="answer">${text}</label>`).join('')}</div>`;
}

test('encrypted stems, choices, and inherited font classes never issue an answer search or collection', async () => {
    const pages = [
        question('<span class="font-cxsecret">伪题干</span>'),
        question('正常题干', ['<span class="font-cxsecret">伪选项</span>', '乙']),
        '<main class="font-cxsecret">' + question('继承的伪题干') + '</main>',
        '<div class="questionLi" data="123"><input name="type123" value="0" type="hidden"><h3 class="mark_name">传统题干</h3><ul><li><span class="choice123">A</span><div class="optionCon font-cxsecret">伪选项</div></li><li><span class="choice123">B</span><div class="optionCon">乙</div></li></ul></div>',
    ];
    for (const html of pages) {
        const result = await fixture(html, page => page.evaluate(async () => {
            const calls = [], logs = [];
            const workflow = questionModule.createQuestionWorkflow({
                bank: { search: async input => { calls.push(input); return { code: 0, msg: '未找到答案。' }; } },
                onLog: message => logs.push(message),
            });
            return { run: await workflow.run(document), calls, logs, collected: workflow.collect(document) };
        }));
        assert.deepEqual(result.calls, [], 'unrestored font text must not be sent as a normal paid query');
        assert.equal(result.run.total, 1);
        assert.equal(result.run.answered, 0);
        assert.equal(result.run.results[0].reason, 'encrypted-font');
        assert.ok(result.logs.some(message => message.includes('加密字体未还原')));
        assert.ok(result.logs.every(message => !message.includes('未找到答案')));
        assert.deepEqual(result.collected, []);
    }
});

test('encrypted questions do not prevent ordinary questions on the same page from being answered', async () => {
    const result = await fixture(question('<span class="font-cxsecret">伪题干</span>') + question('可查询题干'), page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        return { run: await workflow.run(document), calls, collected: workflow.collect(document) };
    }));
    assert.deepEqual(result.calls.map(input => input.title), ['可查询题干']);
    assert.equal(result.run.total, 2);
    assert.equal(result.run.answered, 1);
    assert.equal(result.run.results[0].reason, 'encrypted-font');
    assert.deepEqual(result.collected.map(input => input.title), ['可查询题干']);
});

test('a later run queries restored text after the page replaces the font and content', async () => {
    const result = await fixture(question('<span class="font-cxsecret">伪题干</span>'), page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        const blocked = await workflow.run(document);
        const title = document.querySelector('.font-cxsecret');
        title.textContent = '已还原题干';
        title.classList.remove('font-cxsecret');
        return { blocked, restored: await workflow.run(document), calls };
    }));
    assert.equal(result.blocked.answered, 0);
    assert.deepEqual(result.calls.map(input => input.title), ['已还原题干']);
    assert.equal(result.restored.answered, 1);
});

test('font markers confined to omitted answers or hidden content do not block readable questions', async () => {
    const html = question('普通题干<span class="analysis font-cxsecret">隐藏解析</span><span hidden class="font-cxsecret">隐藏文字</span>', ['甲<span class="answer font-cxsecret">隐藏答案</span>', '乙']);
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        return { run: await workflow.run(document), calls };
    }));
    assert.equal(result.run.answered, 1);
    assert.deepEqual(result.calls, [{ title: '普通题干', options: ['甲', '乙'], type: 'single', use_ai: false }]);
});
