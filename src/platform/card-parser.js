'use strict';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Only the JSON value on the right side is consumed. Page JavaScript is never run.
function parseCardData(html) {
    const source = String(html || '');
    const assignment = /\bmArg\s*=\s*/g.exec(source);
    if (!assignment) throw new Error('章节内容解析失败：未找到 mArg');
    const start = assignment.index + assignment[0].length;
    const tail = source.slice(start);
    if (/^\$mArg\s*;/.test(tail)) return { kind: 'end' };
    if (source[start] !== '{') throw new Error('章节内容解析失败：mArg 必须为 JSON 对象');
    let depth = 0, quoted = false, escaped = false, end = -1;
    for (let index = start; index < source.length; index++) {
        const character = source[index];
        if (quoted) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === '"') quoted = false;
        } else if (character === '"') quoted = true;
        else if (character === '{' || character === '[') depth++;
        else if (character === '}' || character === ']') {
            depth--;
            if (depth === 0) { end = index + 1; break; }
        }
    }
    let data;
    try { data = JSON.parse(source.slice(start, end < 0 ? source.length : end)); }
    catch (_) { throw new Error('章节内容解析失败：mArg 不是有效 JSON'); }
    if (!isRecord(data) || !isRecord(data.defaults) || !Array.isArray(data.attachments)) {
        throw new Error('章节内容解析失败：defaults 或 attachments 格式不正确');
    }
    return { kind: 'page', defaults: data.defaults, attachments: data.attachments };
}

function plainText(html) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return String(html).replace(/<[^>]*>/g, '').replace(/&(#\d+|#x[a-f\d]+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
        if (entity[0] !== '#') return entities[entity.toLowerCase()] || whole;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }).replace(/\s+/g, ' ').trim();
}

function parseCatalog(html) {
    const chapters = new Map();
    const source = String(html || '');
    const headings = /<([a-z][\w:-]*)\b[^>]*\bid\s*=\s*["']cur(\d+)["'][^>]*>/gi;
    for (const match of source.matchAll(headings)) {
        const tags = new RegExp('<\\/?' + match[1] + '\\b[^>]*>', 'gi');
        const start = match.index + match[0].length;
        tags.lastIndex = start;
        let depth = 1, content = null, tag;
        while ((tag = tags.exec(source))) {
            if (tag[0].startsWith('</')) depth--;
            else if (!tag[0].endsWith('/>')) depth++;
            if (depth === 0) { content = source.slice(start, tag.index); break; }
        }
        if (content === null) continue;
        const count = /<span\b[^>]*\bclass\s*=\s*["'][^"']*\bjobUnfinishCount\b[^"']*["'][^>]*>([\s\S]*?)<\/span\s*>/i.exec(content);
        const remaining = count ? Number(plainText(count[1])) : 0;
        const name = plainText(count ? content.replace(count[0], '') : content);
        chapters.set(match[2], { id: match[2], name, remaining: Number.isFinite(remaining) ? remaining : 0 });
    }
    return [...chapters.values()];
}

module.exports = { parseCardData, parseCatalog, plainText };
