'use strict';
const { abortError } = require('./primitives');
const isLoginResponse = result => /<title[^>]*>\s*用户登录\s*<\/title>/i.test(String(result?.responseText ?? result?.response ?? '')) || /\/login(?:[/?#]|$)/i.test(result?.finalUrl || result?.responseURL || '');
function safeEndpoint(url) {
    const target = new URL(url);
    // Report credentials occur in path segments, not just in the query string.
    const path = target.pathname.replace(/(\/multimedia\/log\/(?:[a-z]\/)?)[^/]+(?:\/[^/]*)*/ig, '$1[redacted]')
        .replace(/(\/(?:dtoken|token|ticket|session|auth|enc)\/)[^/]+/ig, '$1[redacted]');
    return target.origin + path;
}
function createHttpError(result, url) {
    const status = Number(result?.status) || 0;
    const endpoint = safeEndpoint(url);
    const sessionExpired = isLoginResponse(result);
    const retryable = !sessionExpired && (status === 0 || [408, 425, 429].includes(status) || status >= 500);
    const reason = sessionExpired ? '学习通登录状态失效' : status === 401 ? '学习通身份验证未通过' : status === 403 ? '学习通拒绝了此请求' : '学习通请求失败';
    const action = sessionExpired || status === 401 ? '请重新登录后重试。' : status === 403 ? '请在学习通页面确认当前会话和访问权限。' : retryable ? '请稍后重试。' : '请在学习通页面核对任务和请求参数。';
    return Object.assign(new Error(reason + '（HTTP ' + status + '），' + action + ' 接口：' + endpoint), { status, endpoint, retryable, sessionExpired });
}
function createTransport({ base, send, createXhr = () => new XMLHttpRequest(), pageUrl = base }) {
    const page = new URL(pageUrl);
    const vpnPrefix = page.pathname.match(/^(.*\/https\/[a-z0-9]+)(?:\/|$)/i)?.[1];
    const proxyUrl = url => {
        if (!vpnPrefix) return url;
        const prefixed = url.pathname === vpnPrefix || url.pathname.startsWith(vpnPrefix + '/');
        return new URL((prefixed ? url.pathname : vpnPrefix + url.pathname) + url.search + url.hash, page.origin);
    };
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
            const fail = error => finish(error instanceof Error ? error : new Error(error));
            const cancel = () => { finish(abortError()); try { handle?.abort(); } catch {} };
            try {
                let target = new URL(details.url, base);
                if (!['https:', 'http:'].includes(target.protocol)) return fail('学习通请求地址无效');
                target = proxyUrl(target);
                if (vpnPrefix && !target.searchParams.has('enlink-vpn')) {
                    // Append the VPN marker without serializing signed fields.
                    const hash = target.hash;
                    target.hash = '';
                    target = new URL(target.href + (target.search ? '&' : '?') + 'enlink-vpn' + hash);
                }
                const method = String(details.method || 'GET').toUpperCase();
                const timeout = Number(details.timeout) > 0 ? Number(details.timeout) : 10000;
                const headers = { 'Accept-Language': 'zh-CN,zh;q=0.9', ...details.headers };
                if (vpnPrefix) for (const key of Object.keys(headers)) if (key.toLowerCase() === 'referer') {
                    try {
                        const referer = new URL(headers[key]);
                        if (['https:', 'http:'].includes(referer.protocol)) headers[key] = proxyUrl(referer).href;
                    } catch { /* Leave non-URL header values to the browser. */ }
                }
                const inspect = result => {
                    if (settled) return;
                    if (isLoginResponse(result)) {
                        if (!fallback && target.origin === page.origin && ['GET', 'HEAD'].includes(method)) return nativeRequest(result);
                        return fail(createHttpError(result, target.href));
                    }
                    if (!result || result.status < 200 || result.status >= 300) return fail(createHttpError(result, target.href));
                    finish(null, { ...result, responseText: String(result.responseText ?? result.response ?? ''), finalUrl: result.finalUrl || result.responseURL || target.href });
                };
                const nativeRequest = loginResponse => {
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
                    } catch { fail(createHttpError(loginResponse, target.href)); }
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
module.exports = { createTransport, createHttpError };
