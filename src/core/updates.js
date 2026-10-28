'use strict';
const { metadata } = require('./product');
const CACHE_KEY = 'yixueScriptUpdateV1';
const INTERVAL = 12 * 3600000;
const ERROR_INTERVAL = 15 * 60000;
// Keep metadata delimiters split: script marketplaces may rewrite every full block.
const MANIFEST_OPEN = '// ==' + 'UserScript==';
const MANIFEST_CLOSE = '// ==/' + 'UserScript==';
const legacyName = '易学·超星学习通助手[AI答题][一键启动][最小化运行]';
function parseVersion(value) {
    if (typeof value !== 'string' || !/^\d{1,9}(?:\.\d{1,9}){0,3}$/.test(value)) throw new Error('更新清单版本号无效');
    return value.split('.').map(Number);
}
function compareVersions(left, right) {
    const a = parseVersion(left), b = parseVersion(right);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const delta = (a[i] || 0) - (b[i] || 0);
        if (delta) return Math.sign(delta);
    }
    return 0;
}
function readManifest(source) {
    if (typeof source !== 'string' || source.length > 12000 || !source.startsWith(MANIFEST_OPEN)) throw new Error('未取得有效的脚本更新清单');
    const end = source.indexOf(MANIFEST_CLOSE);
    if (end < 0) throw new Error('脚本更新清单不完整');
    const header = source.slice(0, end);
    const field = key => {
        const matches = [...header.matchAll(new RegExp('^// @' + key + '\\s+([^\\r\\n]+)$', 'gm'))];
        if (matches.length !== 1) throw new Error('脚本更新清单字段无效');
        return matches[0][1].trim();
    };
    if (![metadata.name, legacyName].includes(field('name')) || field('namespace') !== metadata.namespace) throw new Error('更新清单不属于易学助手');
    const version = field('version'); parseVersion(version);
    return version;
}
function createUpdateChecker({ request, store = { read: (key, fallback) => fallback, write() {} }, currentVersion = metadata.version, now = () => Date.now() }) {
    parseVersion(currentVersion);
    const subscribers = new Set();
    let snapshot = { status: 'idle', currentVersion, downloadURL: metadata.downloadURL };
    let flight = null, handle = null, cancel = null, destroyed = false;
    const publish = patch => {
        snapshot = { ...snapshot, ...patch };
        for (const listener of subscribers) { try { listener(snapshot); } catch {} }
        return snapshot;
    };
    const success = version => ({ status: compareVersions(version, currentVersion) > 0 ? 'available' : compareVersions(version, currentVersion) < 0 ? 'ahead' : 'current', latestVersion: version, error: '' });
    function check({ force = false } = {}) {
        if (destroyed) return Promise.resolve(snapshot);
        if (flight) return flight;
        if (!force) {
            const cache = store.read(CACHE_KEY, null);
            if (cache && cache.checkedAt <= now() && now() - cache.checkedAt < (cache.error ? ERROR_INTERVAL : INTERVAL)) {
                if (typeof cache.error === 'string' && cache.error) return Promise.resolve(publish({ status: 'error', error: cache.error, latestVersion: '' }));
                try { return Promise.resolve(publish(success(cache.version))); } catch {}
            }
        }
        publish({ status: 'checking', error: '' });
        let resolveFlight;
        flight = new Promise(resolve => { resolveFlight = resolve; });
        const pending = flight;
        let settled = false;
        const finish = (error, version) => {
            if (settled) return;
            settled = true;
            const result = error ? { status: 'error', error: error.message, latestVersion: '' } : success(version);
            if (!destroyed) {
                try { store.write(CACHE_KEY, { checkedAt: now(), version: version || '', error: error?.message || '' }); } catch {}
                publish(result);
            }
            flight = null; handle = null; cancel = null;
            resolveFlight(snapshot);
        };
        cancel = () => finish(new Error('脚本更新检查已取消'));
        try {
            handle = request({ method: 'GET', url: metadata.updateURL, anonymous: true, responseType: 'text', timeout: 10000,
                headers: { Accept: 'text/plain', 'Cache-Control': 'no-cache' },
                onload(response) {
                    try {
                        if (response.status !== 200) throw new Error('更新服务暂不可用（HTTP ' + response.status + '）');
                        if (response.finalUrl && response.finalUrl !== metadata.updateURL) throw new Error('更新清单跳转地址不可信');
                        finish(null, readManifest(response.responseText));
                    } catch (error) { finish(error); }
                },
                onerror: () => finish(new Error('无法连接更新服务，请稍后重试')),
                ontimeout: () => finish(new Error('脚本更新检查超时，请稍后重试')),
                onabort: () => finish(new Error('脚本更新检查已取消')),
            });
            if (settled) handle = null;
        } catch (error) { finish(error); }
        return pending;
    }
    return {
        state: () => snapshot, check,
        subscribe(listener) { subscribers.add(listener); listener(snapshot); return () => subscribers.delete(listener); },
        destroy() { if (destroyed) return; destroyed = true; subscribers.clear(); const abort = handle; cancel?.(); abort?.abort?.(); },
    };
}
module.exports = { createUpdateChecker, readManifest, compareVersions };
