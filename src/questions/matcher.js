'use strict';

const TYPE_NAMES = ['single', 'multiple', 'fill', 'judge', 'answer'];

function normalizeType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (/^[0-4]$/.test(text)) return TYPE_NAMES[Number(text)];
    if (TYPE_NAMES.includes(text)) return text;
    if (/多选|多项/.test(text)) return 'multiple';
    if (/单选|单项/.test(text)) return 'single';
    if (/判断|是非/.test(text)) return 'judge';
    if (/填空/.test(text)) return 'fill';
    if (/简答|问答|论述|计算题|分析题/.test(text)) return 'answer';
    return 'unknown';
}

function stripOptionLabel(value) {
    return String(value ?? '').normalize('NFKC').replace(/^\s*[A-Z]\s*[.、:)]\s*/i, '').trim();
}

function normalizeText(value) {
    return stripOptionLabel(value).toLowerCase().replace(/[\s\u200b-\u200d\ufeff]/g, '').replace(/[。?？!！:：;；，,]+$/g, '');
}

function normalizePresentation(value) {
    let text = String(value ?? '');
    if (text.includes('<')) {
        const paired = new Set([...text.matchAll(/<\/(span|p|div|b|strong|em|i|u|font|small|sub|sup)\s*>/gi)].map(match => match[1].toLowerCase()));
        text = text.replace(/<\/?(span|p|div|b|strong|em|i|u|font|small|sub|sup|br)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, (tag, name) => name.toLowerCase() === 'br' || paired.has(name.toLowerCase()) ? ' ' : tag);
    }
    const entities = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    text = text.replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (entity, name) => {
        if (!name.startsWith('#')) return entities[name.toLowerCase()];
        const point = /^#x/i.test(name) ? parseInt(name.slice(2), 16) : Number(name.slice(1));
        return Number.isInteger(point) && point >= 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    });
    // Only equivalent separators between Chinese prose are relaxed. Keep numeric
    // commas, decimal points, Latin expressions and mathematical operators intact.
    return normalizeText(text).replace(/(\p{Script=Han})[,;:、。]+(?=\p{Script=Han})/gu, '$1,');
}

function splitAnswer(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value ?? '').split(/#!#|#{1,3}/).map(item => item.trim()).filter(Boolean);
}

function booleanValue(value) {
    let key = normalizeText(value);
    const closing = { '(': ')', '[': ']', '【': '】' };
    for (let depth = 0; depth < 2 && key.length > 1 && closing[key[0]] === key.at(-1); depth++) key = normalizeText(key.slice(1, -1));
    if (['对', '正确', '是', '真', 'true', 'yes', 'right', 'correct', '√', '✓', '1', 't', 'ri'].includes(key)) return true;
    if (['错', '错误', '否', '假', 'false', 'no', 'wrong', 'incorrect', '×', '✗', '0', 'f', 'wr'].includes(key)) return false;
    return null;
}

function parseBooleanOption(value) {
    const raw = String(value ?? '').normalize('NFKC').trim();
    const labelled = raw.match(/^([A-Z])([\s\u200b-\u200d\ufeff.、:)]*)(.+)$/iu);
    if (labelled) {
        const text = labelled[3].trim(), truth = booleanValue(text);
        // A whole boolean token can follow a badge without punctuation. Compact
        // numeric or short Latin values (A1, AT) remain ordinary choice bodies.
        const clearBody = labelled[2] || /[\p{Script=Han}√✓×✗]/u.test(text) || /^(?:true|false)$/i.test(text);
        if (clearBody && truth !== null) return { text, truth, letter: labelled[1].toUpperCase() };
    }
    const text = stripOptionLabel(raw), truth = booleanValue(text);
    return truth === null ? null : { text, truth, letter: '' };
}

function normalizeBooleanOptions(question) {
    if (!['single', 'judge'].includes(normalizeType(question.type))) return null;
    const choices = question.choices?.length ? question.choices : (question.options || []).map(text => ({ text }));
    if (choices.length !== 2) return null;
    const parsed = choices.map((choice, index) => {
        const result = parseBooleanOption(choice.text);
        if (!result) return null;
        const label = result.letter || choice.letter || '';
        return { ...result, letter: /^[A-Z]$/i.test(label) ? label.toUpperCase() : String.fromCharCode(65 + index) };
    });
    if (parsed.some(option => !option) || parsed[0].truth === parsed[1].truth || parsed[0].letter === parsed[1].letter) return null;
    return parsed;
}

function isBooleanChoice(question) {
    return normalizeType(question.type) === 'single' && normalizeBooleanOptions(question) !== null;
}

function matchAnswer(question, answer, { answerFormat = 'text' } = {}) {
    const type = normalizeType(question.type);
    let parts = splitAnswer(answer);
    const noMatch = reason => ({ matched: false, indices: [], values: [], reason });
    if (!parts.length) return noMatch('empty-answer');
    if (answerFormat === 'letters' && type === 'fill') return noMatch('unsupported-type');
    if (type === 'fill') {
        const count = question.fields?.length || 0;
        return count && count === parts.length
            ? { matched: true, indices: [], values: parts }
            : noMatch('blank-count');
    }
    if (!['single', 'multiple', 'judge'].includes(type)) return noMatch('unsupported-type');
    const booleanOptions = normalizeBooleanOptions(question);
    const options = booleanOptions ? booleanOptions.map(item => item.text) : question.choices?.length ? question.choices.map(item => item.text) : question.options || [];
    const optionLetters = options.map((option, index) => String(booleanOptions?.[index]?.letter || (type === 'judge' && parseBooleanOption(option)?.letter) || question.choices?.[index]?.letter || String.fromCharCode(65 + index)).toUpperCase());
    const letterMatches = letter => optionLetters.flatMap((value, index) => value === letter ? [index] : []);
    if (answerFormat === 'letters') {
        const labels = String(answer ?? '').normalize('NFKC').trim().toUpperCase();
        if (!/^[A-Z](?:[A-Z]|[\s,，、;；]+[A-Z])*$/.test(labels)) return noMatch('unmatched-option');
        const letters = [...new Set(labels.replace(/[\s,，、;；]/g, '').split(''))];
        if (type !== 'multiple' && letters.length !== 1) return noMatch('answer-count');
        const indices = [];
        for (const letter of letters) {
            const matches = letterMatches(letter);
            if (matches.length !== 1) return noMatch(matches.length ? 'ambiguous-option' : 'unmatched-option');
            indices.push(matches[0]);
        }
        return { matched: true, indices, values: [] };
    }
    const keys = options.map(normalizeText);
    const presentationKeys = options.map(normalizePresentation);
    const judge = type === 'judge' || Boolean(booleanOptions);
    const optionMatches = part => {
        const truth = judge ? parseBooleanOption(part)?.truth ?? parseBooleanOption(normalizePresentation(part))?.truth ?? null : null;
        if (truth !== null) return options.flatMap((option, index) => booleanValue(option) === truth ? [index] : []);
        const key = normalizeText(part);
        const exact = keys.flatMap((value, index) => value === key ? [index] : []);
        if (exact.length) return exact;
        const presentation = normalizePresentation(part);
        return presentation ? presentationKeys.flatMap((value, index) => value === presentation ? [index] : []) : [];
    };
    // A complete option can itself contain '#', commas or letter sequences.
    // Resolve the whole body before interpreting it as several answer parts.
    if (typeof answer === 'string') {
        const whole = optionMatches(answer);
        if (whole.length === 1) return { matched: true, indices: whole, values: [] };
        if (whole.length > 1) return noMatch('ambiguous-option');
    }
    if (type === 'multiple' && parts.length === 1) {
        const labels = parts[0].normalize('NFKC').trim();
        if (/^[A-Z]{2,}$/i.test(labels)) parts = labels.split('');
        else if (/^[A-Z](?:[\s,，、;；]+[A-Z])+$/i.test(labels)) parts = labels.split(/[\s,，、;；]+/);
    }
    if (type !== 'multiple' && parts.length !== 1) return noMatch('answer-count');
    const indices = [];
    for (const part of parts) {
        const matches = optionMatches(part);
        let index;
        if (matches.length === 1) index = matches[0];
        else if (matches.length > 1) return noMatch('ambiguous-option');
        else if (/^[A-Z][.、:)]?$/i.test(part.trim())) {
            const labels = letterMatches(part.trim()[0].toUpperCase());
            if (labels.length !== 1) return noMatch(labels.length ? 'ambiguous-option' : 'unmatched-option');
            index = labels[0];
        }
        if (index === undefined || index < 0 || index >= options.length) return noMatch('unmatched-option');
        if (!indices.includes(index)) indices.push(index);
    }
    return { matched: true, indices, values: [] };
}

module.exports = { matchAnswer, normalizeText, normalizeType, splitAnswer, stripOptionLabel, booleanValue, isBooleanChoice, normalizeBooleanOptions };
