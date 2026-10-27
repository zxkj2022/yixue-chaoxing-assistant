'use strict';
const { abortError } = require('./primitives');
// Standalone transport: the page code below consumes a normalized answer string.
function createQuestionBankClient({ request, getValue, setValue, toText = value => String(value ?? ''), now = () => Date.now() }) {
    const defaultBase = 'https://api.sanzwk.com';
    const legacyBase = 'https://tk.sanzwk.com';
    const canonicalBase = value => value === legacyBase ? defaultBase : value;
    const tokenKey = 'shenchanranToken';
    const pendingKey = 'yixuePendingSearches';
    let blocked = null;
    let usage = '尚未查询题目';
    let balance = null, balanceError = '', balanceIdentity = '', balanceEpoch = 0;
    let balanceFlight = null, balanceAttempt = null, balanceRetryAt = 0, balanceUpdatedAt = 0;
    const balanceListeners = new Set();
    let compatibilityUntil = 0, compatibilityProbeAfter = 0, compatibilityFlight = null, routeEpoch = 0;
    const resetRoute = () => { routeEpoch++; compatibilityUntil = 0; compatibilityProbeAfter = 0; compatibilityFlight = null; };
    let capability = null, capabilityError = '', capabilityIdentity = '', capabilityFlight = null, capabilityAttempt = null, capabilityRetryAt = 0, capabilityUpdatedAt = 0, capabilityEpoch = 0;
    const aiReasons = { account_disabled: '账户未开启 AI，请到题库账户设置开启', plan_disallowed: '当前套餐不允许 AI', service_unavailable: 'AI 服务未就绪', unsupported_model: '当前 AI 模型暂不支持', insufficient_points: 'AI 所需积分不足', not_requested: '本次未请求 AI', answer_found: '普通题源已命中，无需 AI', cache_hit: '使用 AI 缓存结果', interrupted: 'AI 查询已中断', query_error: '查询异常，未完成 AI 查询', none: 'AI 可用' };
    const notifyBalance = () => { for (const listener of balanceListeners) { try { listener(); } catch (_) {} } };
    const resetBalance = () => {
        capabilityEpoch++;
        capability = null; capabilityError = ''; capabilityIdentity = ''; capabilityFlight = null; capabilityAttempt = null; capabilityRetryAt = 0; capabilityUpdatedAt = 0;
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
        try { return canonicalBase(validBase(getValue('yixueQuestionBankBase', defaultBase))); }
        catch (_) { return defaultBase; }
    };
    const isValidToken = value => typeof value === 'string' && value === value.trim() && /^(?:ys|tk)_[A-Za-z0-9_-]{32,128}$/.test(value);
    const getToken = () => {
        const token = getValue(tokenKey, '');
        const origin = getValue('yixueApiTokenOrigin', defaultBase);
        return canonicalBase(origin) === base() && isValidToken(token) ? token : '';
    };
    const clearCollection = () => {
        setValue('yixueSubmissionToken', '');
        setValue('yixueSubmissionConsent', false);
        setValue('yixueSubmissionSeen', '');
        for (const key of ['yixueSubmissionOwner', 'yixueSubmissionHistory', 'yixueSubmissionRetry', 'yixueSubmissionProvision', 'yixueSubmissionNext']) setValue(key, null);
    };
    const setToken = value => {
        if (!isValidToken(value)) throw new Error('请填写题库「接口接入」生成的 ys_ 开头 API Token，也兼容已有 tk_ Token。');
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
        const next = canonicalBase(validBase(value));
        if (next !== base()) {
            resetRoute();
            setValue(tokenKey, '');
            setValue(pendingKey, {});
            clearCollection();
            blocked = null;
            usage = '尚未查询题目';
            resetBalance();
        }
        setValue('yixueQuestionBankBase', next);
    };
    const routeState = () => {
        const primary = base(), compatibility = primary === defaultBase && now() < compatibilityUntil;
        return { primary, activeOrigin: compatibility ? legacyBase : primary, compatibility };
    };
    const classifyRequestError = error => {
        const message = (typeof error === 'string' ? error : [error?.error, error?.message].filter(value => typeof value === 'string').join(' ')).slice(0, 2000);
        if (/permission|refused to connect|not (?:permitted|allowed)|whitelist|blacklist/i.test(message)) return 'permission';
        if (/certificate|err_cert_|\bssl\b|\btls\b/i.test(message)) return 'tls';
        return 'network';
    };
    const requestErrorLabel = (response, formatMessage = '接口响应格式不匹配') => {
        if (response.status === 526) return '题库证书校验失败（HTTP 526），请联系题库管理员检查接口证书。';
        if (response.status === 525) return '题库 HTTPS 握手失败（HTTP 525），请联系题库管理员检查接口证书。';
        if (response.reason === 'permission') return '脚本管理器未授予题库连接权限，请允许连接 ' + new URL(base()).hostname + '。';
        if (response.reason === 'tls') return '题库 HTTPS 证书连接失败，请检查接口证书后重试。';
        if (response.reason === 'timeout') return '题库请求超时，请检查网络后刷新重试。';
        if (response.reason === 'redirect') return '题库接口跳转到其他域名，已停止请求，请检查 API 地址。';
        if (response.status === 200) return formatMessage;
        if (Number.isInteger(response.status) && response.status >= 400) return '题库服务返回 HTTP ' + response.status + '，请稍后重试。';
        return '网络连接失败，请检查网络和题库连接权限后重试。';
    };
    const rawJsonRequest = (path, { method = 'GET', body, token = '', idempotencyKey = '', timeout = 120000, signal, origin = base() } = {}) => new Promise(resolve => {
        let handle, settled = false;
        const requestId = idempotencyKey || uuid();
        const finish = result => { if (!settled) { settled = true; clearTimeout(timer); signal?.removeEventListener('abort', cancel); resolve({ request_id: requestId, ...result }); } };
        const cancel = () => { finish({ status: 0, aborted: true }); try { handle?.abort(); } catch (_) {} };
        // anonymous/redirect may use fetch mode, where the extension's timeout is ignored.
        const timer = setTimeout(() => { finish({ status: 0, reason: 'timeout' }); try { handle?.abort(); } catch (_) {} }, timeout);
        if (signal?.aborted) { cancel(); return; }
        signal?.addEventListener('abort', cancel, { once: true });
        const headers = { Accept: 'application/json', 'X-Request-ID': requestId };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = 'Bearer ' + token;
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
        try {
            handle = request({
                method, url: origin + path, headers, anonymous: true, redirect: 'error', timeout,
                ...(body === undefined ? {} : { data: JSON.stringify(body) }),
                onload: response => {
                    let responseId = requestId;
                    try {
                        if (response.finalUrl && new URL(response.finalUrl).origin !== origin) return finish({ status: 0, reason: 'redirect' });
                        const ids = typeof response.responseHeaders === 'string' ? response.responseHeaders.split(/\r?\n/).filter(line => /^x-request-id:/i.test(line)).map(line => line.slice(line.indexOf(':') + 1).trim()) : [];
                        if (ids.length === 1 && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(ids[0]) && !/^(?:ys_|tk_|sub_)/.test(ids[0])) responseId = ids[0];
                        const payload = JSON.parse(response.responseText);
                        finish({ status: response.status, body: payload && typeof payload === 'object' ? payload : {}, request_id: responseId });
                    } catch (_) { finish({ status: response.status || 0, reason: 'format', request_id: responseId }); }
                },
                onerror: error => finish({ status: 0, reason: classifyRequestError(error) }), ontimeout: () => finish({ status: 0, reason: 'timeout' }), onabort: () => finish({ status: 0, reason: 'aborted' }),
            });
        } catch (error) { finish({ status: 0, reason: classifyRequestError(error) }); }
    });
    const ensureCompatibility = () => {
        if (base() !== defaultBase) return Promise.resolve(false);
        if (routeState().compatibility) return Promise.resolve(true);
        if (compatibilityFlight) return compatibilityFlight.promise;
        if (now() < compatibilityProbeAfter) return Promise.resolve(false);
        compatibilityProbeAfter = now() + 10000;
        const flight = { epoch: routeEpoch, promise: null };
        compatibilityFlight = flight;
        flight.promise = rawJsonRequest('/api/health', { origin: legacyBase, timeout: 5000 }).then(response => {
            if (flight.epoch !== routeEpoch || base() !== defaultBase || response.status !== 200 || response.body?.status !== 'ok') return false;
            compatibilityUntil = now() + 60000;
            notifyBalance();
            return true;
        }).finally(() => { if (compatibilityFlight === flight) compatibilityFlight = null; });
        return flight.promise;
    };
    const waitForCompatibility = signal => {
        const pending = ensureCompatibility();
        if (!signal) return pending;
        return new Promise(resolve => {
            const finish = result => { signal.removeEventListener('abort', cancel); resolve(result); };
            const cancel = () => finish(false);
            signal.addEventListener('abort', cancel, { once: true });
            pending.then(finish, () => finish(false));
            if (signal.aborted) cancel();
        });
    };
    const jsonRequest = async (path, options = {}) => {
        const configured = base(), owner = getToken(), epoch = routeEpoch, origin = routeState().activeOrigin;
        const response = await rawJsonRequest(path, { ...options, origin });
        const certificateFailure = [525, 526].includes(response.status) || response.reason === 'tls';
        if (options.signal?.aborted) return { ...response, aborted: true };
        if (origin !== defaultBase || !certificateFailure || configured !== base()) return response;
        const available = await waitForCompatibility(options.signal);
        if (options.signal?.aborted) return { ...response, aborted: true };
        if (!available || epoch !== routeEpoch || configured !== base() || owner !== getToken()) return response;
        return rawJsonRequest(path, { ...options, origin: legacyBase });
    };
    const failure = (msg, fatal = false) => ({ code: 0, data: '', msg, fatal });
    const searchMetadata = response => {
        const body = response.body || {};
        const metadata = { http_status: response.status, request_id: response.request_id };
        if (['OK', 'NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED'].includes(body.code)) metadata.business_code = body.code;
        if (Number.isSafeInteger(body.record_id) && body.record_id > 0) metadata.record_id = body.record_id;
        if (body.protocol_version === '1') metadata.protocol_version = '1';
        if (['local', 'upstream'].includes(body.source)) metadata.source = body.source;
        if (typeof body.is_ai === 'boolean') metadata.is_ai = body.is_ai;
        if (Number.isSafeInteger(body.cost) && body.cost >= 0) metadata.cost = body.cost;
        if (['points', 'member'].includes(body.bucket)) metadata.bucket = body.bucket;
        if (typeof body.saved === 'boolean') metadata.saved = body.saved;
        for (const key of ['ai_requested', 'ai_attempted']) if (typeof body[key] === 'boolean') metadata[key] = body[key];
        if (Object.hasOwn(aiReasons, body.ai_skip_reason)) metadata.ai_skip_reason = body.ai_skip_reason;
        if (['none', 'source_unavailable', 'no_answer', 'no_authorized_source', 'sources_unconfigured', 'interrupted'].includes(body.failure_reason)) metadata.failure_reason = body.failure_reason;
        if (typeof body.idempotency_key === 'string' && /^[A-Za-z0-9_-]{16,100}$/.test(body.idempotency_key) && !/^(?:ys_|tk_|sub_)/.test(body.idempotency_key)) metadata.idempotency_key = body.idempotency_key;
        return metadata;
    };
    const supportLabel = metadata => '（' + [metadata.record_id ? '查询记录：' + metadata.record_id : '', metadata.request_id ? '请求编号：' + metadata.request_id : ''].filter(Boolean).join('；') + '）';
    const currentBalanceIdentity = () => base() + '\n' + getToken();
    const capabilitiesState = () => capabilityIdentity === currentBalanceIdentity()
        ? { data: capability ? { ...capability } : null, error: capabilityError, updatedAt: capabilityUpdatedAt, loading: Boolean(capabilityFlight) }
        : { data: null, error: '', updatedAt: 0, loading: false };
    const capabilitiesLabel = () => {
        const state = capabilitiesState();
        if (!getToken()) return '连接题库后可查看 AI 可用状态';
        if (!state.data) return state.error || (state.loading ? '正在获取 AI 可用状态…' : 'AI 可用状态尚未刷新');
        const ai = state.data;
        return aiReasons[ai.disabled_reason] + (ai.effective_model ? '；默认模型：' + ai.effective_model : '')
            + (ai.price_points !== null ? '；AI 参考答案每次 ' + ai.price_points + ' 积分' : '') + (state.error ? '（刷新失败，请重试）' : '');
    };
    const refreshCapabilities = async ({ force = false } = {}) => {
        const token = getToken(), identity = currentBalanceIdentity();
        if (capabilityIdentity !== identity) {
            capabilityEpoch++; capability = null; capabilityError = ''; capabilityFlight = null; capabilityAttempt = null; capabilityRetryAt = 0; capabilityUpdatedAt = 0; capabilityIdentity = identity;
        }
        if (!token) return capabilitiesState();
        if (capabilityFlight) return capabilityFlight.promise;
        const time = now();
        if (time < capabilityRetryAt || (capabilityAttempt !== null && time - capabilityAttempt < (force ? 1000 : 60000))) return capabilitiesState();
        capabilityAttempt = time; capabilityError = '';
        const flight = { epoch: capabilityEpoch, promise: null };
        capabilityFlight = flight;
        notifyBalance();
        flight.promise = jsonRequest('/api/v1/capabilities', { token, timeout: 10000 }).then(response => {
            if (flight.epoch !== capabilityEpoch || identity !== currentBalanceIdentity()) return;
            const body = response.body || {}, ai = body.data?.ai;
            const valid = response.status === 200 && body.code === 'OK' && body.cost === 0 && body.protocol_version === '1' && ai
                && ['enabled', 'allowed', 'ready'].every(key => typeof ai[key] === 'boolean')
                && [null, 'glm-5.2', 'deepseek-v4-flash'].includes(ai.effective_model)
                && (ai.price_points === null || (Number.isSafeInteger(ai.price_points) && ai.price_points >= 0))
                && ['account_disabled', 'plan_disallowed', 'service_unavailable', 'unsupported_model', 'none'].includes(ai.disabled_reason)
                && (ai.disabled_reason !== 'none' || (ai.enabled && ai.allowed && ai.ready && ai.effective_model !== null && ai.price_points !== null));
            if (valid) {
                capability = Object.fromEntries(['enabled', 'allowed', 'ready', 'effective_model', 'price_points', 'disabled_reason'].map(key => [key, ai[key]]));
                capabilityUpdatedAt = now();
            } else {
                capabilityError = ({ 401: 'AI 状态查询失败：Token 无效', 403: 'AI 状态查询未获授权', 404: '题库暂未提供 AI 能力查询，仍可正常搜题', 429: 'AI 状态查询过于频繁，请稍后刷新' })[response.status] || requestErrorLabel(response, 'AI 状态响应格式不匹配，请稍后刷新');
                if ([401, 403].includes(response.status)) capability = null;
                if ([404, 429].includes(response.status)) capabilityRetryAt = now() + 60000;
            }
        }).finally(() => { if (capabilityFlight === flight) { capabilityFlight = null; notifyBalance(); } }).then(capabilitiesState);
        return flight.promise;
    };
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
                if (data.member && Number.isInteger(data.vip_level) && data.vip_level >= 1 && data.vip_level <= 3) balance.vip_level = data.vip_level;
                if (typeof data.plan_name === 'string') balance.plan_name = data.plan_name.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
                balanceUpdatedAt = now(); balanceError = '';
            } else {
                const errors = { 401: 'Token 无效或已撤销', 403: '账户停用或未获授权', 404: '题库尚未部署余额接口', 429: '查询过于频繁，请稍后刷新' };
                balanceError = errors[response.status] || requestErrorLabel(response, '余额响应格式不匹配');
                if ([401, 403].includes(response.status)) balance = null;
                if ([404, 429].includes(response.status)) balanceRetryAt = now() + 60000;
            }
        }).finally(() => { if (balanceFlight === flight) { balanceFlight = null; notifyBalance(); } }).then(balanceState);
        return flight.promise;
    };
    const search = async (input, { signal } = {}) => {
        if (signal?.aborted) throw abortError();
        if (blocked) return blocked;
        const token = getToken();
        if (!token) return failure('请先设置新版搜题 Token。', true);
        const aliases = { '0': 'single', '1': 'multiple', '2': 'fill', '3': 'judge', '4': 'answer', '单选题': 'single', '多选题': 'multiple', '填空题': 'fill', '判断题': 'judge', true_false: 'judge', judgement: 'judge', judgment: 'judge', completion: 'fill', 'fill-in-the-blank': 'fill' };
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
        const origin = base();
        const identity = JSON.stringify([origin, revision, query]);
        const pending = getValue(pendingKey, {});
        const legacyIdentity = origin === defaultBase ? JSON.stringify([legacyBase, revision, query]) : '';
        if (legacyIdentity && pending[legacyIdentity] && !pending[identity]) {
            pending[identity] = pending[legacyIdentity];
            delete pending[legacyIdentity];
        }
        if (!pending[identity] && Object.keys(pending).length >= 100) return failure('尚有较多未确认请求，请稍后重试原题，避免重复扣费。', true);
        const idempotencyKey = pending[identity] || uuid();
        pending[identity] = idempotencyKey;
        setValue(pendingKey, pending);
        const response = await jsonRequest('/api/v1/search', { method: 'POST', body: query, token, idempotencyKey, signal });
        if (response.aborted || signal?.aborted) throw abortError();
        if (base() !== origin || getToken() !== token || getValue('yixueTokenRevision', '') !== revision) {
            return failure('题库账户已更换，已忽略旧账户的查询结果；请重新启动查询。', true);
        }
        const body = response.body || {};
        const metadata = searchMetadata(response);
        const fail = (message, fatal = false, reason = 'search-failed') => ({ ...failure(message + supportLabel(metadata), fatal), reason, metadata });
        const forget = () => {
            const latest = getValue(pendingKey, {});
            delete latest[identity];
            setValue(pendingKey, latest);
        };
        const messages = { 401: '搜题 Token 无效或已撤销，请重新设置。', 402: '题库额度不足，请到题库网站充值后刷新页面。', 403: '账户停用或当前查询未获授权，请到题库网站查看。', 429: '题库查询过于频繁，请稍后刷新页面重试。' };
        if (messages[response.status]) {
            if (response.status !== 429) forget();
            blocked = fail(messages[response.status], true);
            return blocked;
        }
        if (response.status === 422) { forget(); return fail('题目字段或请求标识未通过题库校验。'); }
        if (response.status === 409) return fail('原查询仍在处理，请稍后重试；请求标识已保留。');
        if (response.status !== 200 || !response.body) return fail(requestErrorLabel(response) + '查询结果尚未确认；请重试原题，脚本会复用请求标识，避免重复扣费。');
        if (Object.hasOwn(body, 'protocol_version') && body.protocol_version !== '1') {
            blocked = fail('题库协议版本不匹配，请更新脚本或联系题库管理员；请求标识已保留。', true, 'protocol-mismatch');
            return blocked;
        }
        if (body.code !== 'OK') {
            if (['NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED'].includes(body.code)) forget();
            const fee = metadata.cost === 0 ? '本次未扣额度' : '本次扣费状态未确认，请到题库网站核对';
            const ai = metadata.ai_attempted === true ? '已尝试 AI，仍未获得参考答案。'
                : metadata.ai_skip_reason && metadata.ai_skip_reason !== 'none' ? aiReasons[metadata.ai_skip_reason] + '。'
                : query.use_ai ? '已请求 AI 兜底，其可用性取决于题库账户偏好、套餐权限和服务配置，请到题库网站核对。' : '脚本未开启 AI。';
            const source = ({ no_authorized_source: '当前套餐没有获授权的普通题源。', sources_unconfigured: '普通题源尚未配置。' })[metadata.failure_reason] || '';
            const errors = { NOT_FOUND: '未找到参考答案，' + fee + '。' + source + '请核对题干、题型和选项；' + ai, UPSTREAM_ERROR: '题源查询暂不可用，' + fee + '；请稍后重试或联系题库管理员。' + ai, ALREADY_DELIVERED: '此请求的答案已交付且未保存，请核对之前的结果；重新查询可能再次扣费。', INTERRUPTED: '查询中断，预扣额度已退回，可重新查询。' };
            if (['NOT_FOUND', 'UPSTREAM_ERROR'].includes(body.code)) usage = fee;
            const reasons = { NOT_FOUND: 'not-found', UPSTREAM_ERROR: 'upstream-error', ALREADY_DELIVERED: 'already-delivered', INTERRUPTED: 'interrupted' };
            return fail(errors[body.code] || '题库返回了无法识别的结果；请稍后重试原题。', false, reasons[body.code] || 'unknown-response');
        }
        const answer = Array.isArray(body.data) ? body.data.find(item => typeof item?.answer === 'string' && item.answer.trim()) : null;
        if (!answer) return fail('题库响应缺少答案；请重试原题以核对结果。', false, 'missing-answer');
        const answerFormat = answer.answer_format ?? 'text';
        if (!['text', 'letters'].includes(answerFormat)) return fail('题库返回了暂不支持的答案格式，请更新脚本；请求标识已保留。', false, 'unsupported-answer-format');
        forget();
        usage = metadata.cost !== undefined ? `本次消耗：${metadata.cost} ${metadata.bucket === 'member' ? '次会员额度' : '积分'}` : '额度请到题库网站查看';
        return { code: 1, data: answerFormat === 'letters' ? answer.answer : answer.answer.replaceAll('###', '#!#'), answer_format: answerFormat, msg: metadata.is_ai === true ? 'ai' : '', cost: metadata.cost, bucket: metadata.bucket, analysis: typeof answer.analysis === 'string' ? answer.analysis : '', metadata };
    };
    return {
        base, routeState, website: () => base() === defaultBase ? legacyBase : base(), setBase, getToken, setToken, isValidToken, search, usageLabel: () => usage, resume: () => { blocked = null; },
        refreshBalance, balanceState, balanceLabel, refreshCapabilities, capabilitiesState, capabilitiesLabel,
        onBalanceChange: listener => { balanceListeners.add(listener); return () => balanceListeners.delete(listener); },
        health: async () => { const result = await jsonRequest('/api/health', { timeout: 10000 }); return result.status === 200 && result.body?.status === 'ok'; },
        provisionSubmission: () => jsonRequest('/api/submission-tokens/provision', { method: 'POST', token: getToken(), body: {}, timeout: 15000 }),
        submitQuestions: (token, body, idempotencyKey) => jsonRequest('/api/question-submissions', { method: 'POST', token, body, idempotencyKey, timeout: 15000 }),
    };
}

module.exports = createQuestionBankClient;
