const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchAnswer, normalizeText, splitAnswer } = require('../src/questions/matcher.js');

function choice(type, texts) {
    return { type, options: texts, choices: texts.map((text, index) => ({ text, index })) };
}

test('matches an entire option or explicit label without substring guessing', () => {
    const question = choice('single', ['A. 水', 'B. 水蒸气', 'C. 氧气']);
    assert.deepEqual(matchAnswer(question, '水蒸气').indices, [1]);
    assert.deepEqual(matchAnswer(question, 'B').indices, [1]);
    assert.equal(matchAnswer(question, '水蒸').matched, false);
});

test('ambiguous duplicate option text never chooses an arbitrary answer', () => {
    const question = choice('single', ['A. 相同', 'B. 相同']);
    assert.equal(matchAnswer(question, '相同').matched, false);
    assert.deepEqual(matchAnswer(question, 'B').indices, [1]);
});

test('multiple answers must all match uniquely and are deduplicated', () => {
    const question = choice('multiple', ['甲', '乙', '丙']);
    assert.deepEqual(matchAnswer(question, '甲#!#乙').indices, [0, 1]);
    assert.deepEqual(matchAnswer(question, '甲#乙#甲').indices, [0, 1]);
    assert.equal(matchAnswer(question, '甲#!#不存在').matched, false);
    assert.deepEqual(matchAnswer(question, 'AC').indices, [0, 2]);
});

test('judge answers accept Chinese and English boolean synonyms', () => {
    for (const answer of ['正确', '对', 'true', 'TRUE', '√', '1']) {
        assert.deepEqual(matchAnswer(choice('judge', ['对', '错']), answer).indices, [0]);
    }
    for (const answer of ['错误', '错', 'false', '×', '0']) {
        assert.deepEqual(matchAnswer(choice('judge', ['正确', '错误']), answer).indices, [1]);
    }
    assert.equal(matchAnswer(choice('judge', ['对', '错']), '也许').matched, false);
});

test('fill answers retain literal HTML and require every blank', () => {
    const question = { type: 'fill', fields: [{}, {}], options: [] };
    const payload = '<img src=x onerror=globalThis.answerExecuted=true>';
    assert.deepEqual(matchAnswer(question, payload + '#第二空').values, [payload, '第二空']);
    assert.equal(matchAnswer(question, '只有一空').matched, false);
    assert.equal(matchAnswer(question, '甲#乙#丙').matched, false);
});

test('normalization keeps mathematical operators and splits documented separators', () => {
    assert.equal(normalizeText(' A.  H₂O。 '), 'h2o');
    assert.notEqual(normalizeText('x+y'), normalizeText('xy'));
    assert.deepEqual(splitAnswer('甲###乙'), ['甲', '乙']);
    assert.deepEqual(splitAnswer('甲#!#乙'), ['甲', '乙']);
    assert.deepEqual(splitAnswer(['甲', '乙']), ['甲', '乙']);
    assert.equal(matchAnswer(choice('unknown', ['甲']), '甲').matched, false);
});
