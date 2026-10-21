'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function bundle({ preview = true } = {}) {
    const metadata = JSON.parse(fs.readFileSync(path.join(root, 'src/metadata.json'), 'utf8'));
    const files = [];
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const target = path.join(directory, entry.name);
            if (entry.isDirectory()) visit(target);
            else if (/\.(?:js|css|html)$/.test(entry.name)) files.push(target);
        }
    }
    visit(path.join(root, 'src'));
    const modules = files.sort().map(file => {
        const id = path.relative(path.join(root, 'src'), file).split(path.sep).join('/');
        const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
        if (file.endsWith('.js')) new Function('module', 'exports', 'require', text);
        return JSON.stringify(id) + ': function(module, exports, require) {\n' + (file.endsWith('.js') ? text : 'module.exports = ' + JSON.stringify(text) + ';') + '\n}';
    });
    const header = ['// ==UserScript=='];
    for (const [name, values] of Object.entries(metadata)) for (const value of [].concat(values)) header.push('// @' + name.padEnd(14) + value);
    header.push('// ==/UserScript==');
    const runtime = `(function () {\n'use strict';\nconst modules = {\n${modules.join(',\n')}\n};\nconst cache = Object.create(null);\nfunction load(id, from = '') {\n let parts = id.startsWith('.') ? from.split('/').slice(0, -1).concat(id.split('/')) : id.split('/');\n const normalized = [];\n for (const part of parts) { if (part === '..') normalized.pop(); else if (part && part !== '.') normalized.push(part); }\n let key = normalized.join('/');\n if (!modules[key]) key += '.js';\n if (!modules[key]) throw new Error('Missing module: ' + key);\n if (!cache[key]) { const module = { exports: {} }; cache[key] = module; modules[key](module, module.exports, name => load(name, key)); }\n return cache[key].exports;\n}\nload('app.js').bootstrap().catch(error => console.error('[易学助手]', error));\n})();\n`;
    const output = header.join('\n') + '\n// Generated from src modules. Edit src/, then run the build.\n' + runtime;
    new Function(output);
    const previewPath = path.join(root, 'artifacts/rewrite-preview.user.js');
    fs.mkdirSync(path.dirname(previewPath), { recursive: true });
    fs.writeFileSync(previewPath, output);
    if (!preview) {
        if (metadata.version !== require('../package.json').version) throw new Error('Package and metadata versions differ');
        const source = fs.readdirSync(root).find(name => name.endsWith('.txt.js'));
        if (!source) throw new Error('Install source path missing');
        fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
        fs.writeFileSync(path.join(root, source), output);
        fs.writeFileSync(path.join(root, 'dist/易学超星学习通助手.user.js'), output);
    }
    console.log(`Built ${metadata.version} from ${files.length} modules: ${preview ? previewPath : 'source + dist'}`);
    return previewPath;
}
if (require.main === module) bundle({ preview: !process.argv.includes('--release') });
module.exports = { bundle };
