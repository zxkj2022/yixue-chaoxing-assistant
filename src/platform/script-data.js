'use strict';

// Tokenize data assignments without running any JavaScript from a remote page.
// Strings, comments and regex literals are kept whole so embedded names cannot
// become assignments (e.g. a comment containing "mArg = $mArg;").
function tokens(source) {
    const pattern = /\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/(?:\\[^\r\n]|\[(?:\\.|[^\]\\])*\]|[^/\r\n\\])+\/[a-z]*|[\w$]+|===|!==|==|!=|=>|./g;
    return [...source.matchAll(pattern)].filter(match => !/^\s|^\/\/|^\/\*/.test(match[0]))
        .map(match => ({ text: match[0], start: match.index, end: match.index + match[0].length }));
}

function* assignments(html, name) {
    const source = String(html || '');
    const scripts = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
    for (const script of scripts.length ? scripts.map(match => match[1]) : [source]) {
        const list = tokens(script);
        for (let index = 0; index < list.length - 2; index++) {
            if (list[index].text !== name || list[index + 1].text !== '=' || list[index - 1]?.text === '.') continue;
            yield { source: script, list, index: index + 2 };
        }
    }
}

function literalText({ source, list, index }) {
    const first = list[index];
    let end = index;
    if (first.text === '{' || first.text === '[') {
        const stack = [];
        for (; end < list.length; end++) {
            const text = list[end].text;
            if (text === '{' || text === '[') stack.push(text);
            if (text === '}' || text === ']') {
                if (stack.pop() !== (text === '}' ? '{' : '[')) throw new Error('数据括号不匹配');
                if (!stack.length) break;
            }
        }
        if (stack.length || end === list.length) throw new Error('数据对象不完整');
    }
    if (list[end + 1] && ![';', ',', '}'].includes(list[end + 1].text)) throw new Error('数据包含不支持的表达式');
    return source.slice(first.start, list[end].end);
}

function parseLiteral(text) {
    // The legacy live service returns single-quoted JSON. Normalize string tokens
    // only, preserving apostrophes inside double-quoted text and escaped quotes.
    const normalized = tokens(String(text)).map(token => {
        if (!token.text.startsWith("'")) return token.text;
        const body = token.text.slice(1, -1).replace(/\\'|\\.|"/g, value => value === "\\'" ? "'" : value === '"' ? '\\"' : value);
        return JSON.stringify(JSON.parse('"' + body + '"'));
    }).join('');
    return JSON.parse(normalized);
}

function assignedObject(html, name) {
    let seen = false;
    for (const candidate of assignments(html, name)) {
        seen = true;
        const text = literalText(candidate);
        if (['null', 'undefined', '""', "''"].includes(text.trim())) continue;
        const value = parseLiteral(text);
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(name + ' 必须为数据对象');
        return value;
    }
    if (seen) throw new Error(name + ' 没有可读取的数据对象');
    return null;
}

module.exports = { assignments, literalText, parseLiteral, assignedObject, tokens };
