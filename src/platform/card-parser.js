'use strict';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const { assignments, literalText } = require('./script-data');

// Only the JSON value on the right side is consumed. Page JavaScript is never run.
function parseCardData(html) {
    let seen = false;
    for (const candidate of assignments(html, 'mArg')) {
        seen = true;
        let text;
        try { text = literalText(candidate); }
        catch (_) { throw new Error('章节内容解析失败：mArg 数据不完整或包含表达式'); }
        if (text === '$mArg') return { kind: 'end' };
        if (['null', 'undefined', '""', "''", '{}', '[]'].includes(text.replace(/\s/g, ''))) continue;
        let data;
        try { data = JSON.parse(text); }
        catch (_) { throw new Error('章节内容解析失败：mArg 不是有效 JSON'); }
        if (!isRecord(data) || !isRecord(data.defaults) || !Array.isArray(data.attachments)) {
            throw new Error('章节内容解析失败：defaults 或 attachments 格式不正确');
        }
        return { kind: 'page', defaults: data.defaults, attachments: data.attachments };
    }
    throw new Error('章节内容解析失败：' + (seen ? '仅找到 mArg 初始化值，未找到任务数据' : '未找到 mArg'));
}

function plainText(html) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return String(html).replace(/<[^>]*>/g, '').replace(/&(#\d+|#x[a-f\d]+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
        if (entity[0] !== '#') return entities[entity.toLowerCase()] || whole;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }).replace(/\s+/g, ' ').trim();
}

function attributes(tag) {
    const result = Object.create(null);
    const source = tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?\s*>$/, '');
    for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
        const key = match[1].toLowerCase();
        if (!(key in result)) result[key] = match[2] ?? match[3] ?? match[4] ?? '';
    }
    return result;
}

function elementText(source, element, excluded = []) {
    if (element.contentEnd === null) return '';
    let cursor = element.contentStart, content = '';
    for (const node of excluded.filter(node => node.end !== null && node.start >= element.contentStart && node.end <= element.contentEnd).sort((a, b) => a.start - b.start || b.end - a.end)) {
        if (node.start < cursor) continue;
        content += source.slice(cursor, node.start);
        cursor = node.end;
    }
    return plainText(content + source.slice(cursor, element.contentEnd));
}

function parseCatalog(html) {
    const chapters = new Map(), elements = [], stack = [];
    // These blocks are inert markup, not chapters present in the course catalog.
    const source = String(html || '').replace(/<!--[\s\S]*?-->|<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    const tags = /<(\/?)([a-z][\w:-]*)(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
    const voidTags = /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
    for (const match of source.matchAll(tags)) {
        const tag = match[2].toLowerCase();
        if (match[1]) {
            let index = stack.length - 1;
            while (index >= 0 && stack[index].tag !== tag) index--;
            if (index < 0) continue;
            const element = stack[index];
            element.contentEnd = match.index;
            element.end = match.index + match[0].length;
            stack.length = index;
        } else {
            const attrs = attributes(match[0]);
            const element = { tag, attrs, start: match.index, contentStart: match.index + match[0].length,
                parent: stack.at(-1), contentEnd: null, end: null, chapterId: /^cur(\d+)$/.exec(attrs.id || '')?.[1] };
            elements.push(element);
            if (!voidTags.test(tag) && !/\/>$/.test(match[0])) stack.push(element);
            else element.end = element.contentEnd = element.contentStart;
        }
    }
    const hasClass = (element, pattern) => pattern.test(element.attrs.class || '');
    for (const element of elements) {
        if (!element.chapterId || element.contentEnd === null || hasClass(element, /(?:^|\s)chapter_unit(?:\s|$)/)) continue;
        const owned = elements.filter(candidate => {
            if (candidate.start < element.contentStart || candidate.start >= element.contentEnd) return false;
            for (let parent = candidate; parent && parent !== element; parent = parent.parent) if (parent.chapterId) return false;
            return true;
        });
        const badges = owned.filter(candidate => hasClass(candidate, /(?:^|\s)(?:jobUnfinishCount|catalog_points_yi)(?:\s|$)/)
            || /^jobUnfinishCount\d*$/.test(candidate.attrs.id || ''));
        // A missing/dynamic badge is unknown, never proof that the chapter is complete.
        // Hidden job markers and hover tips often precede the actual visible number.
        let remaining = null;
        for (const badge of badges) {
            const tips = owned.filter(candidate => hasClass(candidate, /(?:^|\s)(?:prevHoverTips|bntHoverTips)(?:\s|$)/));
            const value = elementText(source, badge, tips);
            const numeric = /^\d+$/.test(value) ? Number(value) : NaN;
            if (Number.isSafeInteger(numeric)) { remaining = numeric; break; }
        }
        const nameNode = owned.find(candidate => hasClass(candidate, /(?:^|\s)(?:posCatalog_name|catalog_name)(?:\s|$)/));
        const title = element.attrs.title || nameNode?.attrs.title;
        const excluded = elements.filter(candidate => candidate.chapterId && candidate.start >= element.contentStart && candidate.end <= element.contentEnd && candidate.end !== null);
        const name = title ? plainText(title) : elementText(source, element, [...excluded, ...badges]);
        const previous = chapters.get(element.chapterId);
        chapters.set(element.chapterId, { id: element.chapterId, name: name || previous?.name || '',
            remaining: previous?.remaining !== null && previous?.remaining !== undefined
                ? remaining === null ? previous.remaining : Math.max(previous.remaining, remaining) : remaining });
    }
    return [...chapters.values()];
}

module.exports = { parseCardData, parseCatalog, plainText };
