'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
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

test('choice text comes from the option body rather than separate letter badges', async () => {
    const html = '<div class="TiMu"><input name="answertype405189740" value="0" type="hidden"><h3 class="Zy_TItle">工作与人工智能</h3><ul>' +
        '<li><input type="radio" name="single"><span class="num_option">A</span><div class="optionCon">事务类公务员的工作可能被人工智能大量取代</div></li>' +
        '<li><input type="radio" name="single"><span class="num_option">B</span><div class="optionCon">所有工作都已被取代</div></li></ul></div>' +
        '<div class="TiMu"><input name="answertype405189742" value="1" type="hidden"><h3 class="Zy_TItle">司法与人工智能</h3><ul>' +
        '<li><label><input type="checkbox"><span class="option-label">A</span>司法辅助性事务</label></li>' +
        '<li><label><input type="checkbox"><span class="option-label">B</span>简单案件的判决</label></li>' +
        '<li><label><input type="checkbox"><span class="option-label">C</span>其他</label></li></ul></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const queries = [];
        const run = await questionModule.createQuestionWorkflow({ bank: { search: async query => { queries.push(query); return { code: 1, data: query.type === 'single' ? '事务类公务员的工作可能被人工智能大量取代' : '司法辅助性事务#简单案件的判决' }; } } }).run(document);
        return { run, queries, selected: [...document.querySelectorAll('input[type=radio],input[type=checkbox]')].map(input => input.checked) };
    }));
    assert.equal(result.run.answered, 2);
    assert.deepEqual(result.selected, [true, false, true, true, false]);
    assert.deepEqual(result.queries[0].options, ['事务类公务员的工作可能被人工智能大量取代', '所有工作都已被取代']);
    assert.deepEqual(result.queries[1].options, ['司法辅助性事务', '简单案件的判决', '其他']);
});

test('question stem appearing before choices waits before a paid query', async () => {
    const result = await fixture('<div class="TiMu"><input name="answertype123" value="0" type="hidden"><h3 class="Zy_TItle">延迟选项</h3><ul></ul></div>', page => page.evaluate(async () => {
        const calls = [];
        setTimeout(() => { document.querySelector('ul').innerHTML = '<li><label><input type="radio" name="answer">甲</label></li><li><label><input type="radio" name="answer">乙</label></li>'; }, 200);
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        const run = await workflow.run(document);
        return { run, calls };
    }));
    assert.deepEqual(result.calls[0].options, ['甲', '乙']);
    assert.equal(result.run.answered, 1);
});

test('legacy questionLi exam roots read type markers and choice content without label spans', async () => {
    const html = '<div class="questionLi" data="123"><input type="hidden" name="type123" value="1"><div class="mark_name">1. (多选题, 2分) 传统考试</div><ul>' +
        '<li><span class="choice123" onclick="this.classList.toggle(\'check_answer\')">A</span><div class="optionCon">甲</div></li>' +
        '<li><span class="choice123" onclick="this.classList.toggle(\'check_answer\')">B</span><div class="optionCon">乙</div></li></ul></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        const questions = workflow.read(document).map(({ id, title, type, options }) => ({ id, title, type, options }));
        if (!questions.length) return { questions };
        return { questions, run: await workflow.run(document), calls, selected: Array.from(document.querySelectorAll('.check_answer')).map(node => node.nextElementSibling.textContent) };
    }));
    assert.deepEqual(result.questions, [{ id: '123', title: '传统考试', type: 'multiple', options: ['甲', '乙'] }]);
    assert.equal(result.run.answered, 1);
    assert.deepEqual(result.selected, ['乙']);
});

test('mobile labels outside the text span and single-choice boolean pairs remain searchable', async () => {
    const html = '<div class="Py-mian1"><input id="answertype123" value="0" type="hidden"><input id="answer123" type="hidden"><h3 class="Py-m1-title">1.[单选题] 兼容判断</h3><ul>' +
        '<li class="clearfix" id-param="123"><em id-param="A">A</em><div class="fl after">错误</div></li>' +
        '<li class="clearfix" id-param="123"><em id-param="B">B</em><div class="fl after">正确</div></li></ul></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: 'true' }; } } });
        return { run: await workflow.run(document), calls, value: document.querySelector('#answer123').value };
    }));
    assert.equal(result.calls[0].type, 'judge');
    assert.equal(result.calls[0].title, '兼容判断');
    assert.equal(result.run.answered, 1);
    assert.equal(result.value, 'B');
});

test('legacy choice labels are removed independently of answer content and mobile judge icons use their truth labels', async () => {
    const html = '<div class="Py-mian1"><input id="answertype123" value="3" type="hidden"><input id="answer123" type="hidden"><h3 class="Py-m1-title">图标判断</h3><ul class="answerList">' +
        '<li class="clearfix" id-param="123"><em id-param="A">A</em><div class="fl after"><i aria-label="正确"></i></div></li>' +
        '<li class="clearfix" id-param="123"><em id-param="B">B</em><div class="fl after"><i aria-label="错误"></i></div></li></ul></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async () => ({ code: 1, data: '错误' }) } });
        return { run: await workflow.run(document), value: document.querySelector('#answer123').value };
    }));
    assert.equal(result.run.answered, 1);
    assert.equal(result.value, 'false');
});

test('query errors and matching failures retain distinct useful diagnostics', async () => {
    const html = ['题库未收录', '服务拒绝', '选项不符'].map((title, i) => `<div class="TiMu"><input name="answertype${i}" value="0" type="hidden"><h3 class="Zy_TItle">${title}</h3><label><input type="radio">甲</label><label><input type="radio">乙</label></div>`).join('');
    const result = await fixture(html, page => page.evaluate(async () => {
        const logs = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => input.title === '题库未收录' ? { code: 0, msg: '未找到答案。' } : input.title === '服务拒绝' ? { code: 0, msg: '请求暂不可用。' } : { code: 1, data: '不存在' } }, onLog: message => logs.push(message) });
        return { run: await workflow.run(document), logs };
    }));
    assert.equal(result.run.answered, 0);
    assert.ok(result.logs.some(message => message.includes('未找到答案')));
    assert.ok(result.logs.some(message => message.includes('请求暂不可用')));
    assert.ok(result.logs.some(message => message.includes('选项')));
});

test('Zhihuishu official-exam DOM reads its type and exact option text and verifies role selection', async () => {
    const html = '<div class="question-area-content"><div class="question-type">单项选择题</div><div class="text-mainText font-medium">智慧树正式考试题</div>' +
        '<label class="user-select group" role="radio" aria-checked="false" onclick="this.setAttribute(\'aria-checked\',\'true\')">A. 甲</label>' +
        '<label class="user-select group" role="radio" aria-checked="false" onclick="this.setAttribute(\'aria-checked\',\'true\')">B. 乙</label></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: '乙' }; } } });
        const questions = workflow.read(document);
        return questions.length ? { run: await workflow.run(document), calls, selected: document.querySelector('[aria-checked=true]').textContent } : { calls };
    }));
    assert.equal(result.run?.answered, 1);
    assert.deepEqual(result.calls[0], { title: '智慧树正式考试题', options: ['甲', '乙'], type: 'single', use_ai: false });
    assert.equal(result.selected, 'B. 乙');
});

test('Zhihuishu homework and mastery DOM preserve all blanks and multiple-choice host state', async () => {
    const html = '<div class="questionBox"><div class="questionTit">填空题</div><div class="questionContent">智慧树填空</div><div class="fillAnswer"><input type="text"><textarea></textarea></div></div>' +
        '<div class="questionContent"><div class="questionName">多项选择题<div class="centent-pre">智慧树掌握度</div></div><div class="checkbox-views">' +
        '<label class="el-checkbox is-checked" onclick="this.classList.toggle(\'is-checked\')">A. 甲</label>' +
        '<label class="el-checkbox" onclick="this.classList.toggle(\'is-checked\')">B. 乙</label>' +
        '<label class="el-checkbox" onclick="this.classList.toggle(\'is-checked\')">C. 丙</label></div></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: input.type === 'fill' ? '第一空#!#第二空' : 'B,C' }; } } });
        const questions = workflow.read(document);
        return questions.length ? { run: await workflow.run(document), calls, fields: Array.from(document.querySelectorAll('input,textarea')).map(input => input.value), selected: Array.from(document.querySelectorAll('.is-checked')).map(element => element.textContent) } : { calls };
    }));
    assert.equal(result.run?.answered, 2);
    assert.deepEqual(result.calls.map(call => [call.title, call.type, call.options]), [['智慧树填空', 'fill', []], ['智慧树掌握度', 'multiple', ['甲', '乙', '丙']]]);
    assert.deepEqual(result.fields, ['第一空', '第二空']);
    assert.deepEqual(result.selected, ['B. 乙', 'C. 丙']);
});

test('Zhihuishu AI mastery uses its declared judgement type and never reports a no-op click as answered', async () => {
    const html = '<div class="exam-item"><div class="quest-type">是非题</div><div class="quest-title"><span class="option-name">智慧树判断</span></div>' +
        '<label><input type="radio" name="truth">正确</label><label><input type="radio" name="truth">错误</label></div>' +
        '<div class="exam-item"><div class="quest-type">单选题</div><div class="quest-title"><span class="option-name">尚无状态反馈</span></div><label>A. 甲</label><label>B. 乙</label></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: input.type === 'judge' ? 'false' : '甲' }; } } });
        return workflow.read(document).length ? { run: await workflow.run(document), calls, selected: document.querySelector('input:checked')?.parentElement.textContent } : { calls };
    }));
    assert.equal(result.run?.answered, 1);
    assert.equal(result.run?.total, 2);
    assert.equal(result.calls[0].type, 'judge');
    assert.equal(result.selected, '错误');
    assert.equal(result.run.results[1].applied, false);
});

test('rendered legacy shared-course and playTopic exercises require explicit stems and keep final submit untouched', async () => {
    const html = '<div class="subject_node"><h3>[多选题] 旧共享课练习</h3><div class="node_detail" role="checkbox" aria-checked="false" onclick="this.setAttribute(\'aria-checked\',\'true\')">A. 甲</div><div class="node_detail" role="checkbox" aria-checked="false">B. 乙</div></div>' +
        '<div id="playTopic-dialog"><div class="topic"><h3>[判断题] 当前随堂判断</h3><div class="radio"><ul><li class="topic-item" role="radio" aria-checked="false">正确</li><li class="topic-item" role="radio" aria-checked="false" onclick="this.setAttribute(\'aria-checked\',\'true\')">错误</li></ul></div><div class="el-pager"><span>1</span><span>2</span></div><button onclick="window.exerciseSubmit=true">提交</button></div></div>';
    const result = await fixture(html, page => page.evaluate(async () => {
        const calls = [];
        const workflow = questionModule.createQuestionWorkflow({ bank: { search: async input => { calls.push(input); return { code: 1, data: input.type === 'multiple' ? '甲' : 'false' }; } } });
        return workflow.read(document).length ? { run: await workflow.run(document), calls, submitted: !!window.exerciseSubmit } : { calls };
    }));
    assert.equal(result.run?.answered, 2);
    assert.deepEqual(result.calls.map(input => [input.title, input.type, input.options]), [['旧共享课练习', 'multiple', ['甲', '乙']], ['当前随堂判断', 'judge', ['正确', '错误']]]);
    assert.equal(result.submitted, false);
});

test('exercise roots with only options or an empty type heading are not mistaken for a question', async () => {
    const html = '<div class="subject_node"><h3>[单选题]</h3><div class="node_detail">A. 甲</div><div class="node_detail">B. 乙</div></div><div id="playTopic-dialog"><div class="topic"><div class="radio"><ul><li class="topic-item">正确</li><li class="topic-item">错误</li></ul></div><button>关闭</button></div></div>';
    const result = await fixture(html, page => page.evaluate(() => questionModule.readQuestions(document).map(({ title, type, options }) => ({ title, type, options }))));
    assert.deepEqual(result, []);
});
