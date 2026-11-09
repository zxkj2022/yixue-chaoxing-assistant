'use strict';
module.exports = (_, { compact = true } = {}) => ({
    manipulateOptions(options) {
        const formatting = { comments: !compact, compact, minified: compact };
        options.sourceMaps = false;
        Object.assign(options, formatting);
        options.generatorOpts = { ...options.generatorOpts, ...formatting };
    },
});
