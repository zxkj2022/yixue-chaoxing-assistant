'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src');
const reviewModules = ['core/question-bank.js', 'core/collection.js', 'core/transport.js'];
const fontModules = ['questions/font-path.js', 'questions/font-glyphs.js'];
const assetModules = [...fontModules, 'ui/logo-fallback.js'];

function formatJavaScript(source, filename, compact) {
    const runtimeRoot = path.dirname(require.resolve((process.env.PLAYWRIGHT_MODULE || 'playwright') + '/package.json'));
    const { babelTransform, babelParse, traverse } = require(path.join(runtimeRoot, 'lib/transform/babelBundle.js'));
    const output = babelTransform(source, filename, false, [], [[path.join(__dirname, 'compact-generator.cjs'), { compact }]]).code;
    if (compact) return output;

    // Babel keeps large arrays and comma expressions on one line. Break those
    // at parsed expression boundaries so the bundled font parser stays readable.
    const lines = output.split('\n');
    const breaks = new Map();
    traverse(babelParse(output, filename, false), {
        'ArrayExpression|SequenceExpression'({ node }) {
            if (node.loc.start.line !== node.loc.end.line || node.end - node.start <= 200) return;
            const indent = lines[node.loc.start.line - 1].match(/^\s*/)[0] + '  ';
            let last = node.start;
            for (const item of (node.elements || node.expressions).slice(1)) {
                if (item && item.start - last >= 120) {
                    breaks.set(item.start, indent);
                    last = item.start;
                }
            }
        },
    });
    let wrapped = output;
    for (const offset of [...breaks.keys()].sort((left, right) => right - left)) {
        const start = output[offset - 1] === ' ' ? offset - 1 : offset;
        wrapped = wrapped.slice(0, start) + '\n' + breaks.get(offset) + wrapped.slice(offset);
    }
    return wrapped;
}

function exportStringLines(lines, separator) {
    return 'module.exports = [\n' + lines.map(line => '    ' + JSON.stringify(line)).join(',\n') +
        '\n].join(' + JSON.stringify(separator) + ');';
}

function moduleBody(id, source, compact) {
    if (id.endsWith('.json')) return 'module.exports = ' + JSON.stringify(JSON.parse(source), null, compact ? 0 : 4) + ';';
    if (!id.endsWith('.js')) return compact ? 'module.exports = ' + JSON.stringify(source) + ';' : exportStringLines(source.split('\n'), '\n');
    if (compact) return source;
    if (id === 'questions/font-path.js') return formatJavaScript(source, id, false);
    if (id === 'questions/font-glyphs.js') {
        const match = source.match(/^module\.exports = ([\s\S]+);\s*$/m);
        if (!match) throw new Error('Invalid font glyph table module');
        const pairs = Object.entries(JSON.parse(match[1])).map(([key, value]) => JSON.stringify(key) + ': ' + JSON.stringify(value));
        const rows = [];
        for (let index = 0; index < pairs.length; index += 8) rows.push('    ' + pairs.slice(index, index + 8).join(', '));
        return source.slice(0, match.index) + 'module.exports = {\n' + rows.join(',\n') + '\n};';
    }
    if (id === 'ui/logo-fallback.js') {
        const match = source.match(/^module\.exports = '(data:image\/png;base64,[A-Za-z0-9+/=]+)';\s*$/m);
        if (!match) throw new Error('Invalid embedded logo module');
        return source.slice(0, match.index) + exportStringLines(match[1].match(/.{1,96}/g), '');
    }
    return source;
}

function bundle({ testing = false, compact = false } = {}) {
    const metadata = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'metadata.json'), 'utf8'));
    const ids = [];
    function visit(folder) {
        for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
            const target = path.join(folder, item.name);
            if (item.isDirectory()) visit(target);
            else if (/\.(js|css|html|json)$/.test(item.name)) ids.push(path.relative(sourceRoot, target).split(path.sep).join('/'));
        }
    }
    visit(sourceRoot);
    ids.sort();
    // Keep request code at the start of the readable body and bundled data at the end.
    const ordered = compact ? ids : [...reviewModules, ...ids.filter(id => !reviewModules.includes(id) && !assetModules.includes(id)), ...assetModules];
    const notices = compact ? fontModules.map(id => {
        const source = fs.readFileSync(path.join(sourceRoot, id), 'utf8');
        return source.match(/\/\*[\s\S]*?\*\//)[0].split(/\r?\n/).filter(line => !/^(Source:|Adaptation:|Glyph fingerprints from)/.test(line)).join('\n');
    }) : [];
    const entries = ordered.map(id => {
        const source = fs.readFileSync(path.join(sourceRoot, id), 'utf8');
        const body = moduleBody(id, source, compact);
        new Function('module', 'exports', 'require', body);
        return JSON.stringify(id) + ': function (module, exports, require) {\n' + body.trimEnd() + '\n}';
    });
    const header = ['// ==UserScript=='];
    for (const [key, values] of Object.entries(metadata)) for (const value of [].concat(values)) header.push('// @' + key.padEnd(Math.max(14, key.length + 1)) + value);
    header.push('// ==/UserScript==');
    const runtime = `(function () {
'use strict';

const modules = {
${entries.join(',\n\n')}
};
const cache = Object.create(null);

function load(id, from = '') {
    const parts = id.startsWith('.') ? from.split('/').slice(0, -1).concat(id.split('/')) : id.split('/');
    const normalized = [];
    for (const part of parts) {
        if (part === '..') normalized.pop();
        else if (part && part !== '.') normalized.push(part);
    }
    let key = normalized.join('/');
    if (!modules[key]) key += '.js';
    if (!modules[key]) throw new Error('Missing module: ' + key);
    if (!cache[key]) {
        const module = { exports: {} };
        cache[key] = module;
        modules[key](module, module.exports, name => load(name, key));
    }
    return cache[key].exports;
}

${testing ? 'window.testLoad = load;' : "load('app.js').bootstrap().catch(error => console.error('[易学助手]', error));"}
})();`;
    const output = [...header, ...notices, compact ? formatJavaScript(runtime, 'yixue.user.js', true) : runtime].join('\n');
    new Function(output);
    return output;
}
if (require.main === module) {
    const output = bundle();
    fs.writeFileSync(path.join(root, '易学·超星学习通助手.user.js'), output);
    const distribution = path.join(root, 'dist');
    fs.mkdirSync(distribution, { recursive: true });
    fs.writeFileSync(path.join(distribution, '易学超星学习通助手.user.js'), output);
    fs.writeFileSync(path.join(distribution, '易学超星学习通助手.meta.js'), output.slice(0, output.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length) + '\n');
    console.log(`Built ${require('../src/metadata.json').version}: ${Buffer.byteLength(output)} bytes`);
}
module.exports = { bundle };
