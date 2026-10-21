'use strict';
// Standalone transport: the page code below consumes a normalized answer string.
function createQuestionBankClient({ request, getValue, setValue, toText = value => String(value ?? ''), now = () => Date.now() }) {
    const defaultBase = 'https://tk.sanzwk.com';
    const tokenKey = 'shenchanranToken';
    const pendingKey = 'yixuePendingSearches';
    let blocked = null;
    let usage = '尚未查询题目';
    let balance = null, balanceError = '', balanceIdentity = '', balanceEpoch = 0;
    let balanceFlight = null, balanceAttempt = null, balanceRetryAt = 0, balanceUpdatedAt = 0;
    const balanceListeners = new Set();
    const notifyBalance = () => { for (const listener of balanceListeners) { try { listener(); } catch (_) {} } };
    const resetBalance = () => {
        balanceEpoch++;
        balance = null; balanceError = ''; balanceIdentity = ''; balanceFlight = null;
        balanceAttempt = null; balanceRetryAt = 0; balanceUpdatedAt = 0;
        notifyBalance();
    };
    const uuid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
    const validBase = value => {
        const url = new URL(String(value).trim());
        const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
        if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
            throw new Error('请填写 HTTPS 网站根地址；本地测试可使用 HTTP。');
        }
        return url.origin;
    };
    const base = () => {
        try { return validBase(getValue('yixueQuestionBankBase', defaultBase)); }
        catch (_) { return defaultBase; }
    };
    const isValidToken = value => typeof value === 'string' && value === value.trim() && /^tk_[A-Za-z0-9_-]{32,128}$/.test(value);
    const getToken = () => {
        const token = getValue(tokenKey, '');
        const origin = getValue('yixueApiTokenOrigin', defaultBase);
        return origin === base() && isValidToken(token) ? token : '';
    };
    const clearCollection = () => {
        setValue('yixueSubmissionToken', '');
        setValue('yixueSubmissionConsent', false);
        setValue('yixueSubmissionSeen', '');
    };
    const setToken = value => {
        if (!isValidToken(value)) throw new Error('请填写题库「接口接入」生成的 tk_ 开头 API Token。');
        if (value !== getToken()) {
            setValue(pendingKey, {});
            setValue('yixueTokenRevision', uuid());
            clearCollection();
            usage = '尚未查询题目';
            resetBalance();
        }
        setValue(tokenKey, value);
        setValue('yixueApiTokenOrigin', base());
        blocked = null;
    };
    const setBase = value => {
        const next = validBase(value);
        if (next !== base()) {
            setValue(tokenKey, '');
            setValue(pendingKey, {});
            clearCollection();
            blocked = null;
            usage = '尚未查询题目';
            resetBalance();
        }
        setValue('yixueQuestionBankBase', next);
    };
    const jsonRequest = (path, { method = 'GET', body, token = '', idempotencyKey = '', timeout = 120000 } = {}) => new Promise(resolve => {
        let handle, settled = false;
        const finish = result => { if (!settled) { settled = true; clearTimeout(timer); resolve(result); } };
        // anonymous/redirect may use fetch mode, where the extension's timeout is ignored.
        const timer = setTimeout(() => { finish({ status: 0 }); try { handle?.abort(); } catch (_) {} }, timeout);
        const headers = { Accept: 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = 'Bearer ' + token;
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
        const origin = base();
        try {
            handle = request({
                method, url: origin + path, headers, anonymous: true, redirect: 'error', timeout,
                ...(body === undefined ? {} : { data: JSON.stringify(body) }),
                onload: response => {
                    try {
                        if (response.finalUrl && new URL(response.finalUrl).origin !== origin) return finish({ status: 0 });
                        const payload = JSON.parse(response.responseText);
                        finish({ status: response.status, body: payload && typeof payload === 'object' ? payload : {} });
                    } catch (_) { finish({ status: response.status || 0 }); }
                },
                onerror: () => finish({ status: 0 }), ontimeout: () => finish({ status: 0 }), onabort: () => finish({ status: 0 }),
            });
        } catch (_) { finish({ status: 0 }); }
    });
    const failure = (msg, fatal = false) => ({ code: 0, data: '', msg, fatal });
    const currentBalanceIdentity = () => base() + '\n' + getToken();
    const balanceState = () => balanceIdentity === currentBalanceIdentity()
        ? { data: balance ? { ...balance } : null, error: balanceError, updatedAt: balanceUpdatedAt, loading: !!balanceFlight }
        : { data: null, error: '', updatedAt: 0, loading: false };
    const balanceLabel = () => {
        const state = balanceState();
        if (!state.data) return state.error ? '额度查询失败：' + state.error : state.loading ? '正在获取账户额度…' : '账户额度尚未刷新';
        const data = state.data;
        const expires = data.member_until > 0 ? new Date(data.member_until * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) + '（北京时间）' : '';
        const member = data.member ? `会员今日剩余：${data.daily_remaining}/${data.daily_limit}；到期：${expires}` : expires ? '会员已到期：' + expires : '非会员';
        return `积分：${data.points}；${member}` + (state.error ? `（刷新失败：${state.error}）` : '');
    };
    const refreshBalance = async ({ force = false } = {}) => {
        const identity = currentBalanceIdentity();
        if (balanceIdentity !== identity) { resetBalance(); balanceIdentity = identity; }
        const token = getToken();
        if (!token) { balance = null; balanceError = '请先设置新版搜题 Token。'; notifyBalance(); return balanceState(); }
        if (balanceFlight) return balanceFlight.promise;
        const time = now();
        if (time < balanceRetryAt || (balanceAttempt !== null && time - balanceAttempt < (force ? 1000 : 10000))) return balanceState();
        balanceAttempt = time;
        balanceError = '';
        const flight = { epoch: balanceEpoch, promise: null };
        balanceFlight = flight;
        notifyBalance();
        flight.promise = jsonRequest('/api/v1/balance', { token, timeout: 10000 }).then(response => {
            if (flight.epoch !== balanceEpoch || identity !== currentBalanceIdentity()) return;
            const data = response.body?.data;
            const valid = response.status === 200 && response.body?.code === 'OK' && response.body.cost === 0 && data &&
                Number.isSafeInteger(data.points) && data.points >= 0 && typeof data.member === 'boolean' &&
                Number.isFinite(data.member_until) && data.member_until >= 0 && data.member_until <= 8640000000000 &&
                Number.isSafeInteger(data.daily_limit) && data.daily_limit >= 0 &&
                Number.isSafeInteger(data.daily_remaining) && data.daily_remaining >= 0 && data.daily_remaining <= data.daily_limit;
            if (valid) {
                balance = { points: data.points, member: data.member, member_until: data.member_until, daily_limit: data.daily_limit, daily_remaining: data.daily_remaining };
                balanceUpdatedAt = now(); balanceError = '';
            } else {
                const errors = { 401: 'Token 无效或已撤销', 403: '账户停用或未获授权', 404: '题库尚未部署余额接口', 429: '查询过于频繁，请稍后刷新' };
                balanceError = errors[response.status] || (response.status === 200 ? '余额响应格式不匹配' : '网络或题库服务暂不可用');
                if ([401, 403].includes(response.status)) balance = null;
                if ([404, 429].includes(response.status)) balanceRetryAt = now() + 60000;
            }
        }).finally(() => { if (balanceFlight === flight) { balanceFlight = null; notifyBalance(); } }).then(balanceState);
        return flight.promise;
    };
    const search = async input => {
        if (blocked) return blocked;
        const token = getToken();
        if (!token) return failure('请先设置新版搜题 Token。', true);
        const aliases = { '0': 'single', '1': 'multiple', '2': 'fill', '3': 'judge', '4': 'answer', '单选题': 'single', '多选题': 'multiple', '填空题': 'fill', '判断题': 'judge', true_false: 'judge' };
        const type = aliases[input.type] || input.type;
        const options = Array.isArray(input.options) ? input.options : typeof input.options === 'string' ? input.options.split(/\r?\n/) : [];
        const query = {
            title: toText(input.title).trim(), options: options.map(toText).map(value => value.trim()).filter(Boolean),
            type: ['single', 'multiple', 'fill', 'judge', 'answer', 'unknown'].includes(type) ? type : 'unknown',
            use_ai: input.use_ai === true,
        };
        if (!query.title || query.title.length > 5000 || query.options.length > 30 || query.options.some(value => value.length > 2000)) return failure('题干或选项超出题库接口限制。');
        let revision = getValue('yixueTokenRevision', '');
        if (!revision) { revision = uuid(); setValue('yixueTokenRevision', revision); }
        const identity = JSON.stringify([base(), revision, query]);
        const pending = getValue(pendingKey, {});
        if (!pending[identity] && Object.keys(pending).length >= 100) return failure('尚有较多未确认请求，请稍后重试原题，避免重复扣费。', true);
        const idempotencyKey = pending[identity] || uuid();
        pending[identity] = idempotencyKey;
        setValue(pendingKey, pending);
        const response = await jsonRequest('/api/v1/search', { method: 'POST', body: query, token, idempotencyKey });
        const body = response.body || {};
        const forget = () => {
            const latest = getValue(pendingKey, {});
            delete latest[identity];
            setValue(pendingKey, latest);
        };
        const messages = { 401: '搜题 Token 无效或已撤销，请重新设置。', 402: '题库额度不足，请到题库网站充值后刷新页面。', 403: '账户停用或当前查询未获授权，请到题库网站查看。', 429: '题库查询过于频繁，请稍后刷新页面重试。' };
        if (messages[response.status]) {
            if (response.status !== 429) forget();
            blocked = failure(messages[response.status], true);
            return blocked;
        }
        if (response.status === 422) { forget(); return failure('题目字段或请求标识未通过题库校验。'); }
        if (response.status === 409) return failure('原查询仍在处理，请稍后重试；请求标识已保留。');
        if (response.status !== 200 || !response.body) return failure('查询结果尚未确认；请重试原题，脚本会复用请求标识，避免重复扣费。');
        if (body.code !== 'OK') {
            if (['NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED'].includes(body.code)) forget();
            const errors = { NOT_FOUND: '未找到答案。', UPSTREAM_ERROR: '题库服务暂不可用。', ALREADY_DELIVERED: '此请求的答案已交付且未保存，请核对之前的结果。', INTERRUPTED: '查询中断，预扣额度已退回，可重新查询。' };
            return failure(errors[body.code] || '题库返回了无法识别的结果；请稍后重试原题。');
        }
        const answer = Array.isArray(body.data) ? body.data.find(item => typeof item?.answer === 'string' && item.answer.trim()) : null;
        if (!answer) return failure('题库响应缺少答案；请重试原题以核对结果。');
        forget();
        usage = Number.isFinite(body.cost) ? `本次消耗：${body.cost} ${body.bucket === 'member' ? '次会员额度' : '积分'}` : '额度请到题库网站查看';
        return { code: 1, data: answer.answer.replaceAll('###', '#!#'), msg: body.is_ai ? 'ai' : '', cost: body.cost, bucket: body.bucket, analysis: typeof answer.analysis === 'string' ? answer.analysis : '' };
    };
    return {
        base, setBase, getToken, setToken, isValidToken, search, usageLabel: () => usage, resume: () => { blocked = null; },
        refreshBalance, balanceState, balanceLabel,
        onBalanceChange: listener => { balanceListeners.add(listener); return () => balanceListeners.delete(listener); },
        health: async () => { const result = await jsonRequest('/api/health', { timeout: 10000 }); return result.status === 200 && result.body?.status === 'ok'; },
        provisionSubmission: () => jsonRequest('/api/submission-tokens/provision', { method: 'POST', token: getToken(), body: {}, timeout: 15000 }),
        submitQuestions: (token, body, idempotencyKey) => jsonRequest('/api/question-submissions', { method: 'POST', token, body, idempotencyKey, timeout: 15000 }),
    };
}

module.exports = createQuestionBankClient;
