'use strict';
const { abortError } = require('./primitives');
function createTransport({ base, send, createXhr = () => new XMLHttpRequest(), pageUrl = base }) {
    const page = new URL(pageUrl);
    const vpnPrefix = page.pathname.match(/^(.*\/https\/[a-z0-9]+)(?:\/|$)/i)?.[1];
    const login = result => /<title[^>]*>\s*用户登录\s*<\/title>/i.test(result.responseText || '') || /\/login(?:[/?#]|$)/i.test(result.finalUrl || result.responseURL || '');
    return { request(details, { signal = details.signal } = {}) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            let handle, timer, settled = false, fallback = false;
            const finish = (error, result) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener('abort', cancel);
                error ? reject(error) : resolve(result);
            };
            const fail = message => finish(new Error(message));
            const cancel = () => { finish(abortError()); try { handle?.abort(); } catch {} };
            try {
                let target = new URL(details.url, base);
                if (!['https:', 'http:'].includes(target.protocol)) return fail('学习通请求地址无效');
                if (vpnPrefix && !target.pathname.startsWith(vpnPrefix)) target = new URL(vpnPrefix + target.pathname + target.search, page.origin);
                const method = String(details.method || 'GET').toUpperCase();
                const timeout = Number(details.timeout) > 0 ? Number(details.timeout) : 10000;
                const headers = { 'Accept-Language': 'zh-CN,zh;q=0.9', ...details.headers };
                const inspect = result => {
                    if (settled) return;
                    if (!result || result.status < 200 || result.status >= 300) return fail('学习通请求失败（HTTP ' + (result?.status || 0) + '），请稍后重试。');
                    if (login(result)) {
                        if (!fallback && target.origin === page.origin) return nativeRequest();
                        return fail('学习通登录状态失效，请重新登录后重试。');
                    }
                    finish(null, { ...result, responseText: String(result.responseText ?? result.response ?? ''), finalUrl: result.finalUrl || result.responseURL || target.href });
                };
                const nativeRequest = () => {
                    fallback = true;
                    try {
                        const xhr = createXhr(); handle = xhr;
                        xhr.open(method, target.href, true);
                        xhr.timeout = timeout; xhr.withCredentials = true;
                        for (const [key, value] of Object.entries(headers)) if (!/^(referer|origin|host|cookie|user-agent|sec-)/i.test(key)) xhr.setRequestHeader(key, value);
                        const load = () => inspect({ status: xhr.status, responseText: xhr.responseText, finalUrl: xhr.responseURL });
                        xhr.onload = load;
                        xhr.onreadystatechange = () => { if (xhr.readyState === 4) load(); };
                        xhr.onerror = () => fail('学习通请求失败，请检查网络后重试。');
                        xhr.ontimeout = () => fail('学习通请求超时，请稍后重试。');
                        xhr.onabort = () => finish(abortError());
                        xhr.send(['GET', 'HEAD'].includes(method) ? null : details.data ?? null);
                    } catch { fail('无法恢复学习通登录状态，请重新登录后重试。'); }
                };
                signal?.addEventListener('abort', cancel, { once: true });
                timer = setTimeout(() => { fail('学习通请求超时，请检查网络后重试。'); try { handle?.abort(); } catch {} }, timeout + 1000);
                handle = send({
                    ...details, url: target.href, method, headers, timeout,
                    onload: inspect,
                    onerror: error => fail(/permission|Refused to connect/i.test(String(error?.error || error || '')) ? '学习通请求被脚本管理器阻止，请添加 @connect 权限：' + target.hostname : '学习通请求失败，请检查网络后重试。'),
                    ontimeout: () => fail('学习通请求超时，请稍后重试。'),
                    onabort: () => finish(abortError()),
                });
            } catch { fail('学习通请求无法发出，请检查网络和脚本管理器权限。'); }
        });
    } };
}
module.exports = { createTransport };
