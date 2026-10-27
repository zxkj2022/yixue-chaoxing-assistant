'use strict';
const defaults = Object.freeze({ doVideo: true, doDocument: true, doLive: true, doWork: true, doRenwu: false, doNoMission: false, doAI: false, autoSubmit: true, keepAwake: true, beisu: 1, vgqtlv: 85 });
function createSettings({ read, write }) {
    function normalize(key, value) {
        if (!(key in defaults)) return undefined;
        if (typeof defaults[key] === 'boolean') return [true, false, 0, 1].includes(value) ? Boolean(value) : defaults[key];
        const numeric = Number(value);
        const valid = Number.isFinite(numeric) && (key === 'beisu' ? numeric >= 0.5 && numeric <= 16 : numeric >= 0 && numeric <= 100);
        return valid ? numeric : defaults[key];
    }
    const get = (key, fallback) => key in defaults ? normalize(key, read(key, defaults[key])) : read(key, fallback);
    return {
        get,
        set(key, value) {
            if (!(key in defaults)) throw new Error('未知配置项');
            const normalized = normalize(key, value);
            if (typeof defaults[key] === 'number' && normalized !== Number(value)) throw new RangeError(key === 'beisu' ? '倍速必须在0.5-16之间' : '正确率必须在0-100之间');
            write(key, normalized);
            return normalized;
        },
        snapshot: () => Object.fromEntries(Object.keys(defaults).map(key => [key, get(key)])),
    };
}
module.exports = { createSettings, defaults };
