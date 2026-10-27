'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function bundle({ testing = false, compact = false } = {}) {
    const metadata = JSON.parse(fs.readFileSync(path.join(root, 'src/metadata.json'), 'utf8'));
    const files = [];
    function visit(folder) {
        for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
            const target = path.join(folder, item.name);
            if (item.isDirectory()) visit(target);
            else if (/\.(js|css|html|json)$/.test(item.name)) files.push(target);
        }
    }
    visit(path.join(root, 'src'));
    const notices = ['questions/font-path.js', 'questions/font-glyphs.js'].map(id => {
        const source = fs.readFileSync(path.join(root, 'src', id), 'utf8');
        return source.match(/\/\*[\s\S]*?\*\//)[0].split(/\r?\n/).filter(line => !/^(Source:|Adaptation:|Glyph fingerprints from)/.test(line)).join('\n');
    });
    const entries = files.sort().map(file => {
        const id = path.relative(path.join(root, 'src'), file).split(path.sep).join('/');
        const source = fs.readFileSync(file, 'utf8');
        const body = file.endsWith('.js') ? source : 'module.exports=' + JSON.stringify(file.endsWith('.json') ? JSON.parse(source) : source) + ';';
        new Function('module', 'exports', 'require', body);
        return JSON.stringify(id) + ':function(module,exports,require){\n' + body + '\n}';
    });
    const header = ['// ==UserScript=='];
    for (const [key, values] of Object.entries(metadata)) for (const value of [].concat(values)) header.push('// @' + key.padEnd(Math.max(14, key.length + 1)) + value);
    header.push('// ==/UserScript==');
    let runtime = `(function(){'use strict';const modules={${entries.join(',\n')}};const cache=Object.create(null);
function load(id,from=''){const parts=id.startsWith('.')?from.split('/').slice(0,-1).concat(id.split('/')):id.split('/');const normalized=[];for(const part of parts){if(part==='..')normalized.pop();else if(part&&part!=='.')normalized.push(part);}let key=normalized.join('/');if(!modules[key])key+='.js';if(!modules[key])throw new Error('Missing module: '+key);if(!cache[key]){const m={exports:{}};cache[key]=m;modules[key](m,m.exports,n=>load(n,key));}return cache[key].exports;}
${testing ? 'window.testLoad=load;' : "load('app.js').bootstrap().catch(error=>console.error('[易学助手]',error));"}})();`;
    if (compact) {
        const runtimeRoot = path.dirname(require.resolve((process.env.PLAYWRIGHT_MODULE || 'playwright') + '/package.json'));
        const { babelTransform } = require(path.join(runtimeRoot, 'lib/transform/babelBundle.js'));
        runtime = babelTransform(runtime, 'yixue.user.js', false, [], [[path.join(__dirname, 'compact-generator.cjs'), {}]]).code;
    }
    const output = header.join('\n') + '\n' + (compact ? notices.join('\n') + '\n' : '') + runtime;
    new Function(output);
    return output;
}
if (require.main === module) {
    const output = bundle({ compact: !process.argv.includes('--readable') });
    fs.writeFileSync(path.join(root, '易学·超星学习通助手.user.js'), output);
    const distribution = path.join(root, 'dist');
    fs.mkdirSync(distribution, { recursive: true });
    fs.writeFileSync(path.join(distribution, '易学超星学习通助手.user.js'), output);
    fs.writeFileSync(path.join(distribution, '易学超星学习通助手.meta.js'), output.slice(0, output.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length) + '\n');
    console.log(`Built ${require('../package.json').version}: ${Buffer.byteLength(output)} bytes`);
}
module.exports = { bundle };
