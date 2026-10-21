'use strict';

const TYPE_NAMES = ['single', 'multiple', 'fill', 'judge'];

function normalizeType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (/^[0-3]$/.test(text)) return TYPE_NAMES[Number(text)];
    if (TYPE_NAMES.includes(text)) return text;
    if (/多选/.test(text)) return 'multiple';
    if (/单选/.test(text)) return 'single';
    if (/判断/.test(text)) return 'judge';
    if (/填空/.test(text)) return 'fill';
    return 'unknown';
}

function stripOptionLabel(value) {
    return String(value ?? '').normalize('NFKC').replace(/^\s*[A-Z]\s*[.、:)]\s*/i, '').trim();
}

function normalizeText(value) {
    return stripOptionLabel(value).toLowerCase().replace(/[\s\u200b-\u200d\ufeff.,，。?？!！:：;；]/g, '');
}

function splitAnswer(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value ?? '').split(/#!#|#{1,3}/).map(item => item.trim()).filter(Boolean);
}

function booleanValue(value) {
    const key = normalizeText(value);
    if (['对', '正确', '是', '真', 'true', 'yes', 'right', 'correct', '√', '✓', '1'].includes(key)) return true;
    if (['错', '错误', '否', '假', 'false', 'no', 'wrong', 'incorrect', '×', '✗', '0'].includes(key)) return false;
    return null;
}

function matchAnswer(question, answer) {
    const type = normalizeType(question.type);
    let parts = splitAnswer(answer);
    const noMatch = reason => ({ matched: false, indices: [], values: [], reason });
    if (!parts.length) return noMatch('empty-answer');
    if (type === 'fill') {
        const count = question.fields?.length || 0;
        return count && count === parts.length
            ? { matched: true, indices: [], values: parts }
            : noMatch('blank-count');
    }
    if (!['single', 'multiple', 'judge'].includes(type)) return noMatch('unsupported-type');
    const options = question.choices?.length ? question.choices.map(item => item.text) : question.options || [];
    if (type === 'multiple' && parts.length === 1 && /^[A-Z]{2,}$/i.test(parts[0])) parts = parts[0].split('');
    if (type !== 'multiple' && parts.length !== 1) return noMatch('answer-count');
    const indices = [];
    for (const part of parts) {
        const key = normalizeText(part);
        const truth = type === 'judge' ? booleanValue(part) : null;
        const matches = options.flatMap((option, index) => {
            const equal = truth === null ? normalizeText(option) === key : booleanValue(option) === truth;
            return equal ? [index] : [];
        });
        let index;
        if (matches.length === 1) index = matches[0];
        else if (matches.length > 1) return noMatch('ambiguous-option');
        else if (/^[A-Z][.、:)]?$/i.test(part.trim())) index = part.trim().toUpperCase().charCodeAt(0) - 65;
        if (index === undefined || index < 0 || index >= options.length) return noMatch('unmatched-option');
        if (!indices.includes(index)) indices.push(index);
    }
    return { matched: true, indices, values: [] };
}

module.exports = { matchAnswer, normalizeText, normalizeType, splitAnswer, stripOptionLabel, booleanValue };
