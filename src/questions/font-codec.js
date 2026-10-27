'use strict';
const md5 = require('../core/md5.js');
let paths, fingerprints;

const documents = new WeakMap();
const MAX_FONT_BYTES = 2 * 1024 * 1024;

// Only bounded TrueType outlines are needed. Do not invoke optional SVG, bitmap,
// CFF or remote shaping facilities in the vendored parser.
function validFont(bytes) {
    if (bytes.length < 64 || bytes.length > MAX_FONT_BYTES) return false;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0) !== 0x00010000) return false;
    const count = view.getUint16(4), tables = {};
    if (!count || count > 64 || 12 + count * 16 > bytes.length) return false;
    for (let index = 0; index < count; index++) {
        const at = 12 + index * 16;
        const tag = String.fromCharCode(...bytes.subarray(at, at + 4));
        const offset = view.getUint32(at + 8), length = view.getUint32(at + 12);
        if (offset + length > bytes.length || tables[tag]) return false;
        tables[tag] = { offset, length };
    }
    if (!['head', 'maxp', 'loca', 'glyf', 'cmap'].every(tag => tables[tag])) return false;
    if (['CFF ', 'CFF2', 'SVG ', 'CBLC', 'sbix', 'COLR'].some(tag => tables[tag])) return false;
    if (tables.head.length < 54 || tables.maxp.length < 6 || tables.cmap.length < 4) return false;
    const glyphCount = view.getUint16(tables.maxp.offset + 4);
    const format = view.getInt16(tables.head.offset + 50);
    if (!glyphCount || glyphCount > 8192 || ![0, 1].includes(format)) return false;
    const width = format ? 4 : 2;
    if (tables.loca.length < (glyphCount + 1) * width) return false;
    const offsets = Array.from({ length: glyphCount + 1 }, (_, index) => format ? view.getUint32(tables.loca.offset + index * 4) : view.getUint16(tables.loca.offset + index * 2) * 2);
    if (offsets.some((offset, index) => offset > tables.glyf.length || (index && offset < offsets[index - 1]))) return false;
    const seen = new Set(), active = new Set(), complexity = new Map();
    function glyphSafe(id, depth = 0) {
        if (id >= glyphCount || depth > 24 || active.has(id)) return false;
        if (seen.has(id)) return true;
        if (offsets[id] === offsets[id + 1]) { complexity.set(id, 0); return true; }
        active.add(id);
        const start = tables.glyf.offset + offsets[id], end = tables.glyf.offset + offsets[id + 1];
        if (start + 10 > end) return false;
        const contours = view.getInt16(start);
        if (contours > 4096) return false;
        let points = 0;
        if (contours > 0) {
            if (start + 10 + contours * 2 > end) return false;
            points = view.getUint16(start + 10 + (contours - 1) * 2) + 1;
            if (points > 32768) return false;
        }
        if (contours < 0) {
            let at = start + 10, flags;
            do {
                if (at + 4 > end) return false;
                flags = view.getUint16(at);
                const child = view.getUint16(at + 2);
                if (!glyphSafe(child, depth + 1)) return false;
                points += complexity.get(child);
                if (points > 32768) return false;
                at += 4 + (flags & 1 ? 4 : 2) + (flags & 128 ? 8 : flags & 64 ? 4 : flags & 8 ? 2 : 0);
                if (at > end) return false;
            } while (flags & 32);
        }
        active.delete(id); seen.add(id); complexity.set(id, points); return true;
    }
    if (!Array.from({ length: glyphCount }, (_, id) => id).every(id => glyphSafe(id))) return false;
    const cmap = tables.cmap.offset, cmapEnd = cmap + tables.cmap.length;
    const maps = view.getUint16(cmap + 2);
    if (!maps || maps > 32 || cmap + 4 + maps * 8 > cmapEnd) return false;
    for (let index = 0; index < maps; index++) {
        const at = cmap + view.getUint32(cmap + 8 + index * 8);
        if (at + 4 > cmapEnd) return false;
        const type = view.getUint16(at);
        if (type === 4 && (at + 8 > cmapEnd || view.getUint16(at + 6) > 16384)) return false;
        if (type === 12 && (at + 16 > cmapEnd || view.getUint32(at + 12) > 16384)) return false;
    }
    return true;
}

function fontSource(document) {
    const rules = Array.from(document.querySelectorAll('style')).map(node => node.textContent).filter(text => text.includes('font-cxsecret')).join('\n');
    const faces = [...rules.matchAll(/@font-face\s*\{[^}]*\}/gi)].map(match => match[0]).filter(rule => /font-family\s*:\s*(['"]?)font-cxsecret\1\s*[;}]/i.test(rule));
    return faces.at(-1) || '';
}

function fontState(document) {
    const source = fontSource(document);
    const cached = documents.get(document);
    if (cached?.source === source) return cached.font ? cached : null;
    const state = { source, font: null, characters: new Map() };
    documents.set(document, state);
    try {
        const encoded = source.match(/url\(\s*(['"]?)data:(?:application|font)\/[^,;\s]+(?:;[^,]*)?;base64,([A-Za-z\d+/=\s]+)\1\s*\)/i)?.[2];
        if (!encoded || encoded.length > MAX_FONT_BYTES * 1.4) return null;
        const binary = atob(encoded.replace(/\s/g, ''));
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        if (!validFont(bytes)) return null;
        paths ||= require('./font-path.js');
        fingerprints ||= require('./font-glyphs.js');
        state.font = paths.parse(bytes.buffer)[0];
        return state.font ? state : null;
    } catch { return null; }
}

function characterText(character, state) {
    const code = character.codePointAt(0);
    if (code < 0x3400 || code > 0xfaff || (code > 0x9fff && code < 0xe000)) return { text: character, resolved: true };
    if (state.characters.has(character)) return state.characters.get(character);
    let result = { text: character, resolved: false };
    try {
        const glyph = paths.codeToGlyph(state.font, code);
        if (!glyph) result = { text: character, resolved: true }; // Browser fallback font renders this code point unchanged.
        else {
            const outline = paths.glyphToPath(state.font, glyph);
            const value = fingerprints[md5(JSON.stringify(outline)).slice(24)];
            if (value) result = { text: String.fromCodePoint(value).normalize('NFKC'), resolved: true };
        }
    } catch { /* Unknown outlines remain unresolved; never guess an answer. */ }
    state.characters.set(character, result);
    return result;
}

// Decode the detached copy only. Original text, font classes and native click
// handlers must stay intact. Traverse paired nodes before either tree is pruned.
function decodeFontCopy(original, copy, { ignoreSelector, ignoreNode } = {}) {
    let state, checked = false, unresolved = false;
    function visit(source, target, inherited) {
        if (source.nodeType === 1) {
            if (source !== original && ((ignoreSelector && source.matches(ignoreSelector)) || ignoreNode?.(source))) return;
            const encrypted = inherited || source.classList.contains('font-cxsecret');
            for (let index = 0; index < source.childNodes.length; index++) visit(source.childNodes[index], target.childNodes[index], encrypted);
        } else if (source.nodeType === 3 && inherited && source.textContent.trim()) {
            if (!checked) { state = fontState(original.ownerDocument); checked = true; }
            if (!state) { unresolved = true; return; }
            target.textContent = Array.from(source.textContent, character => {
                const result = characterText(character, state);
                if (!result.resolved) unresolved = true;
                return result.text;
            }).join('');
        }
    }
    visit(original, copy, Boolean(original.parentElement?.closest('.font-cxsecret')));
    return unresolved;
}

module.exports = { decodeFontCopy };
