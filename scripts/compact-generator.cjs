'use strict';
module.exports = () => ({
    manipulateOptions(options) {
        options.comments = false;
        options.compact = true;
        options.minified = true;
        options.sourceMaps = false;
        options.generatorOpts = { ...options.generatorOpts, comments: false, compact: true, minified: true };
    },
});
