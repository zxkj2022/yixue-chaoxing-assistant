const { readdirSync, readFileSync, mkdirSync, copyFileSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.join(root, readdirSync(root).find(name => name.endsWith('.txt.js')));
execFileSync(process.execPath, ['--check', source]);
const version = readFileSync(source, 'utf8').match(/^\/\/ @version\s+(\S+)/m)?.[1];
if (version !== require('../package.json').version) throw new Error('Package and userscript versions differ.');
mkdirSync(path.join(root, 'dist'), { recursive: true });
const output = path.join(root, 'dist', '易学超星学习通助手.user.js');
copyFileSync(source, output);
console.log(`Built userscript ${version}: ${output}`);
