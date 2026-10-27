'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const rawBase = 'https://raw.githubusercontent.com/zxkj2022/yixue-chaoxing-assistant/main/dist/';
const filename = '易学超星学习通助手';
function field(source, key) { return source.match(new RegExp('^// @' + key + '\\s+(.+)$', 'm'))?.[1]; }
test('GitHub release includes an aligned lightweight update manifest and full installation file', () => {
    const install = fs.readFileSync(path.join(root, 'dist', filename + '.user.js'), 'utf8');
    const meta = fs.readFileSync(path.join(root, 'dist', filename + '.meta.js'), 'utf8');
    const local = fs.readFileSync(path.join(root, '易学·超星学习通助手.user.js'), 'utf8');
    const expected = JSON.parse(fs.readFileSync(path.join(root, 'src/metadata.json'), 'utf8'));
    assert.equal(field(meta, 'version'), expected.version);
    assert.equal(field(install, 'version'), expected.version);
    assert.equal(field(meta, 'name'), expected.name);
    assert.equal(field(meta, 'author'), '三街网络');
    assert.match(field(meta, 'antifeature'), /^payment\s/);
    assert.equal(field(meta, 'license'), '禁止二开');
    assert.equal(field(meta, 'namespace'), '易学团队');
    assert.equal(field(meta, 'updateURL'), rawBase + encodeURIComponent(filename) + '.meta.js');
    assert.equal(field(meta, 'downloadURL'), rawBase + encodeURIComponent(filename) + '.user.js');
    assert.equal(meta, install.slice(0, install.indexOf('// ==/UserScript==') + '// ==/UserScript=='.length) + '\n');
    assert.ok(Buffer.byteLength(meta) < 10000);
    assert.equal(meta.replace(/^\/\/.*$/gm, '').trim(), '');
    assert.equal(createHash('sha256').update(install).digest('hex'), createHash('sha256').update(local).digest('hex'));
});
