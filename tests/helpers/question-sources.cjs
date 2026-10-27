'use strict';
const fs = require('node:fs');
const path = require('node:path');

module.exports = function questionSources(names) {
    const directory = path.resolve(__dirname, '../../src/questions');
    const sources = Object.fromEntries(names.map(name => ['./' + name + '.js', fs.readFileSync(path.join(directory, name + '.js'), 'utf8')]));
    for (const name of ['font-codec', 'font-path', 'font-glyphs']) {
        const file = path.join(directory, name + '.js');
        if (fs.existsSync(file)) sources['./' + name + '.js'] = fs.readFileSync(file, 'utf8');
    }
    sources['../core/md5.js'] = fs.readFileSync(path.join(directory, '../core/md5.js'), 'utf8');
    sources['../core/primitives.js'] = fs.readFileSync(path.join(directory, '../core/primitives.js'), 'utf8');
    return sources;
};
