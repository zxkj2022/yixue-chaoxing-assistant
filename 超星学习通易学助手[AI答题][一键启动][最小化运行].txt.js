// ==UserScript==
// @name         易学·超星学习通助手[AI答题][一键启动][最小化运行]
// @name:zh-TW   易學·超星學習通助手[AI答題][一鍵啟動][最小化運行]
// @name:en      Yixue Chaoxing Learning Assistant[AI Answer][One-click start] [Minimize run]
// @description  易学·超星学习通助手：提供超星学习通页面辅助、进度管理和题库查询结果展示；答案仅供学习核对，请人工确认后提交。
// @description:zh-TW  易學·超星學習通助手：提供超星學習通頁面輔助、進度管理與題庫查詢結果展示；答案僅供學習核對，請人工確認後提交。
// @description:en     Yixue Chaoxing Learning Assistant: page assistance, progress management, and question-bank result display; verify answers manually before submission.
// @namespace    易学团队
// @version      3.3.3
// @homepageURL  https://github.com/zxkj2022/yixue-chaoxing-assistant
// @updateURL    https://raw.githubusercontent.com/zxkj2022/yixue-chaoxing-assistant/main/dist/%E6%98%93%E5%AD%A6%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E5%8A%A9%E6%89%8B.user.js
// @downloadURL  https://raw.githubusercontent.com/zxkj2022/yixue-chaoxing-assistant/main/dist/%E6%98%93%E5%AD%A6%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E5%8A%A9%E6%89%8B.user.js
// @author       易学团队
// @run-at       document-end
// @storageName  易学团队
// @match        *://*/*
// @icon         https://yixue-cmg.pages.dev/assets/yixue-logo.png
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_notification
//👇👇👇👇👇👇👇👇Please fill in the code prompted by the script into the blanks below, one per line, and press Ctrl+S to save.👇👇👇👇👇👇👇👇
//👇👇👇👇👇👇👇👇請將腳本提示的程式碼填入下面空白中，一行一個，按Ctrl+S儲存👇👇👇👇👇👇👇
//👇👇👇👇👇👇👇👇请将脚本提示的代码填入下面空白中，一行一个，按Ctrl+S保存👇👇👇👇👇👇👇👇




//👆👆👆👆👆👆👆👆请将脚本提示的代码填入上面空白中，一行一个，按Ctrl+S保存👆👆👆👆👆👆👆👆
//👆👆👆👆👆👆👆👆請將腳本提示的程式碼填入上面空白中，一行一個，按Ctrl+S儲存👆👆👆👆👆👆👆
//👆👆👆👆👆👆👆👆Please fill in the code prompted by the script into the blanks above, one per line, and press Ctrl+S to save.👆👆👆👆👆👆👆
// @connect      mooc1.wljx.hfut.edu.cn
// @connect      mooc1.chaoxing.com
// @connect      mooc1-1.chaoxing.com
// @connect      mooc1-api.chaoxing.com
// @connect      zhibo.chaoxing.com
// @connect      pstore-rk.chaoxing.com
// @connect      kshlsplay-rk.chaoxing.com
// @connect      ksrtmpplay-rk.chaoxing.com
// @connect      mooc1.hnust.edu.cn
// @connect      stat2-ans.hnust.edu.cn
// @connect      stat2-ans.istudy.szpu.edu.cn
// @connect      stat2-ans.chaoxing.com
// @connect      stat2-ans.wht.zjelib.cn
// @connect      mooc1.wht.zjelib.cn
// @connect      passport2.wht.zjelib.cn
// @connect      mooc1.hnsyu.net
// @connect      passport2.xust.edu.cn
// @connect      stat2-ans.hnsyu.net
// @connect      passport2.hnsyu.net
// @connect      mooc1.gdhkmooc.com
// @connect      stat2-ans.gdhkmooc.com
// @connect      mooc1.zut.edu.cn
// @connect      passport2.hncj.edu.cn
// @connect      stat2-ans.zut.edu.cn
// @connect      passport2.jxjyzx.xust.edu.cn
// @connect      passport2.zut.edu.cn
// @connect      stat2-ans.wljx.hfut.edu.cn
// @connect      live-rk.chaoxing.com
// @connect      task.chaoxing.com
// @connect      passport2.wljx.hfut.edu.cn
// @connect      mooc1.hncj.edu.cn
// @connect      stat2-ans.hncj.edu.cn
// @connect      mooc1.qutjxjy.cn
// @connect      stat2-ans.qutjxjy.cn
// @connect      passport2.hnust.edu.cn
// @connect      passport2.cqrspx.cn
// @connect      passport2.gdhkmooc.com
// @connect      passport2.qutjxjy.cn
// @connect      mooc1.jxjyzx.xust.edu.cn
// @connect      mooc2-ans.chaoxing.com
// @connect      passport2.hnvist.cn
// @connect      passport2.cugbonline.cn
// @connect      passport2.chaoxing.com
// @connect      stat2-ans.jxjyzx.xust.edu.cn
// @connect      mooc1.xueyinonline.com
// @connect      passport2.ynny.cn
// @connect      passport2.ecnusole.com
// @connect      stat2-ans.xueyinonline.com
// @connect      static-rk.chaoxing.com
// @connect      passport2.xueyinonline.com
// @connect      lbapi-rk.chaoxing.com
// @connect      mooc1.cqrspx.cn
// @connect      stat2-ans.cqrspx.cn
// @connect      f1-rk.chaoxing.com
// @connect      mooc1-2.chaoxing.com
// @connect      mooc1.ynny.cn
// @connect      mqtt7-rk.chaoxing.com
// @connect      stat2-ans.ynny.cn
// @connect      mooc1.cugbonline.cn
// @connect      stat2-ans.cugbonline.cn
// @connect      mooc1.xust.edu.cn
// @connect      stat2-ans.xust.edu.cn
// @connect      mooc1.xynu.edu.cn
// @connect      mooc1.ntu.edu.cn
// @connect      stat2-ans.xynu.edu.cn
// @connect      mobilelearn.chaoxing.com
// @connect      stat2-ans.ntu.edu.cn
// @connect      mooc1.hnvist.cn
// @connect      stat2-ans.hnvist.cn
// @connect      passport2.xynu.edu.cn
// @connect      passport2.ntu.edu.cn
// @connect      mooc1.ecnusole.com
// @connect      stat2-ans.ecnusole.com
// @connect      mooc.s.ecust.edu.cn
// @connect      webvpn.ahmu.edu.cn
// @connect      127.0.0.1
// @connect      tk.sanzwk.com
// @license      MIT
// @compatible firefox
// @compatible chrome
// @compatible edge
// @supportURL https://tk.sanzwk.com/
// ==/UserScript==
!!(async function () {
    // BEGIN QUESTION BANK CLIENT
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
    // END QUESTION BANK CLIENT
    // BEGIN COURSE ACCESS
    function createCourseAccess({ questionBank, getValue, setValue, randomValues = bytes => crypto.getRandomValues(bytes) }) {
        const getLocalToken = () => {
            const value = getValue('yixueLocalToken', '');
            return typeof value === 'string' && value.length === 32 && /^[a-f0-9]{32}$/.test(value) ? value : '';
        };
        const getRealToken = () => { const value = questionBank.getToken(); return questionBank.isValidToken(value) ? value : ''; };
        const getDisplayToken = () => getRealToken() || getLocalToken();
        const createLocalToken = () => {
            const token = Array.from(randomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
            setValue('yixueLocalToken', token);
            return token;
        };
        const saveToken = value => {
            const token = String(value ?? '').trim();
            if (questionBank.isValidToken(token)) { questionBank.setToken(token); return token; }
            if (token && token === getLocalToken() && !getRealToken()) return token;
            throw new Error('请填写题库提供的 Token；本地随机 Token 不能用于查题。');
        };
        return { getLocalToken, getDisplayToken, createLocalToken, saveToken, hasAccess: () => Boolean(getDisplayToken()) };
    }
    // END COURSE ACCESS
    const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const plainText = value => { const template = document.createElement('template'); template.innerHTML = String(value ?? '').replace(/<(?:br|\/p|\/div|\/li)\b[^>]*>/gi, ' '); template.content.querySelectorAll('script,style').forEach(node => node.remove()); return (template.content.textContent || '').replace(/\s+/g, ' '); };
    const questionBank = createQuestionBankClient({ request: details => GM_xmlhttpRequest(details), getValue: GM_getValue, setValue: GM_setValue, toText: plainText });
    const courseAccess = createCourseAccess({ questionBank, getValue: GM_getValue, setValue: GM_setValue });
    const renderAccountBalance = () => {
        const connected = Boolean(questionBank.getToken());
        const label = connected ? questionBank.balanceLabel() : '未连接题库，答题前请填写题库 Token。';
        const state = questionBank.balanceState();
        for (const element of document.querySelectorAll('.yixue-connection-status')) {
            element.dataset.connected = String(connected);
            element.textContent = connected ? '已连接题库' : '本地模式';
        }
        for (const element of document.querySelectorAll('[data-yixue-balance]')) element.textContent = label;
        for (const button of document.querySelectorAll('[data-yixue-balance-refresh]')) button.disabled = state.loading;
        for (const element of document.querySelectorAll('[data-yixue-usage]')) element.textContent = questionBank.usageLabel();
        for (const id of ['ugyvciuu', 'tokenLeft']) {
            const input = document.getElementById(id);
            if (!input) continue;
            input.value = !connected ? '未连接题库' : state.data ? `积分：${state.data.points}` : state.error ? '额度查询失败' : '正在获取额度';
            input.title = label;
            const container = input.closest('.form-group') || input.parentElement.parentElement;
            let detail = container.querySelector('[data-yixue-balance]');
            if (!detail) { detail = document.createElement('small'); detail.dataset.yixueBalance = ''; detail.style.cssText = 'display:block;white-space:normal;line-height:1.6;margin-top:6px'; container.append(detail); }
            detail.textContent = label;
        }
    };
    questionBank.onBalanceChange(renderAccountBalance);
    let tokenDialog;
    const requestApiToken = () => {
        if (tokenDialog) return tokenDialog;
        tokenDialog = new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:#0009;z-index:2147483647;display:flex;align-items:center;justify-content:center';
            const form = document.createElement('form');
            form.style.cssText = 'background:white;color:#222;padding:24px;border-radius:12px;width:min(460px,90vw);font:16px/1.6 sans-serif';
            form.setAttribute('role', 'dialog'); form.setAttribute('aria-label', '手动填写 Token');
            const title = document.createElement('h3'); title.textContent = '手动填写题库 Token';
            const info = document.createElement('p'); info.textContent = '需要答题时，请填写题库网站提供的 Token。没有 Token 也可以先进入章节控制台。';
            const link = document.createElement('a'); link.href = questionBank.base() + '/#integration'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = '连接题库，获取 Token';
            const input = document.createElement('input'); input.type = 'password'; input.autocomplete = 'off'; input.placeholder = 'tk_…'; input.required = true; input.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:16px 0;padding:10px'; input.setAttribute('aria-label', '搜题 API Token');
            const error = document.createElement('p'); error.style.color = '#b42318';
            const save = document.createElement('button'); save.type = 'submit'; save.textContent = '保存 Token';
            const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '取消'; cancel.style.marginLeft = '12px';
            const finish = token => { overlay.remove(); tokenDialog = null; resolve(token); };
            cancel.onclick = () => finish('');
            form.onsubmit = event => {
                event.preventDefault();
                const token = input.value.trim();
                try {
                    questionBank.setToken(token);
                    for (const id of ['token', 'tokenInput']) {
                        const field = document.getElementById(id);
                        if (field) { field.value = token; field.type = 'password'; }
                    }
                    void questionBank.refreshBalance({ force: true });
                    finish(token);
                } catch (err) { error.textContent = err.message; }
            };
            form.append(title, info, link, input, error, save, cancel); overlay.append(form); document.body.append(overlay); input.focus();
        });
        return tokenDialog;
    };
    let courseAccessDialog;
    const requestCourseAccess = () => {
        if (courseAccess.hasAccess()) return Promise.resolve(courseAccess.getDisplayToken());
        if (courseAccessDialog) return courseAccessDialog;
        courseAccessDialog = new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:#0008;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
            const panel = document.createElement('section');
            panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '首次使用易学助手');
            panel.style.cssText = 'background:#fff;color:#111;border-radius:12px;padding:28px;box-sizing:border-box;width:min(560px,100%);text-align:center;font:18px/1.7 sans-serif;box-shadow:0 16px 50px #0003';
            const title = document.createElement('h2'); title.textContent = '易学·超星学习通助手'; title.style.cssText = 'font-size:28px;font-weight:500;margin:0 0 12px';
            const info = document.createElement('p'); info.textContent = '首次使用请选择接入方式。随机 Token 仅保存在本机，不连接题库；可先进入章节控制台，需要答题时再连接题库。';
            const buttons = document.createElement('div'); buttons.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:24px';
            const makeButton = text => { const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.style.cssText = 'border:0;border-radius:5px;padding:12px 20px;background:#4caf50;color:#fff;cursor:pointer;font:inherit'; buttons.append(button); return button; };
            const connect = makeButton('连接题库');
            const random = makeButton('随机生成 Token');
            const manual = makeButton('手动填写 Token');
            const cancel = makeButton('取消'); cancel.style.background = '#b84b4b';
            const finish = token => { overlay.remove(); courseAccessDialog = null; resolve(token); };
            connect.onclick = () => { window.open(questionBank.base() + '/#integration', '_blank', 'noopener,noreferrer'); info.textContent = '登录题库网站并获取 Token 后，点击「手动填写 Token」粘贴保存。也可随机生成本地 Token，先使用视频和文档功能。'; };
            random.onclick = () => finish(courseAccess.createLocalToken());
            manual.onclick = async () => { const token = await requestApiToken(); if (token) finish(token); };
            cancel.onclick = () => finish('');
            panel.append(title, info, buttons); overlay.append(panel); document.body.append(overlay);
            random.focus();
        });
        return courseAccessDialog;
    };
    const queryQuestion = async input => {
        if (!questionBank.getToken()) return { code: 0, msg: '题库未连接，已跳过答题。请先填写题库 Token。' };
        const result = await questionBank.search(input);
        renderAccountBalance();
        void questionBank.refreshBalance({ force: true });
        if (result.fatal) { alert(result.msg); throw new Error(result.msg); }
        return result;
    };
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('设置新版搜题 Token', requestApiToken);
        GM_registerMenuCommand('设置题库地址', () => {
            const value = prompt('请输入题库 HTTPS 根地址。更换地址会清除当前 Token 和采集授权；还需在脚本头部添加新域名的 @connect 权限。', questionBank.base());
            if (value === null) return;
            try { questionBank.setBase(value); alert('题库地址已保存，请刷新页面并设置对应题库的新 Token。'); } catch (err) { alert(err.message); }
        });
        GM_registerMenuCommand('查看题库额度', () => window.open(questionBank.base(), '_blank', 'noopener,noreferrer'));
        GM_registerMenuCommand('刷新账户额度（免费）', async () => { await questionBank.refreshBalance({ force: true }); if (!document.querySelector('[data-yixue-balance]')) alert(questionBank.balanceLabel()); });
    }
    const
        //---------------------------------------------------------------------------
        是否启用后台服务器 = '0',//改为1则启用后台服务器，请先学习使用方法：https://bbs.tampermonkey.net.cn/thread-5249-1-1.html
        //Change 1/0 to enable background program,Please learn how to use it：https://bbs.tampermonkey.net.cn/thread-5249-1-1.html
        服务器地址 = '127.0.0.1',//用于对接后台服务器，不懂不要修改
        //Do not change this if you don't know how it works
        端口 = '6503';         //后台服务器端口，不懂不要修改
    //Do not change this if you don't know how it works
    //---------------------------------------------------------------------------
    // 音频文件的base64，是一段静音音频，在后台播放可以防止页面休眠
    const audiofile = 'data:audio/ogg;base64,T2dnUwACAAAAAAAAAABwRPFFAAAAAGFtEqwBHgF2b3JiaXMAAAAAAUAfAAAAAAAAUHgAAAAAAACZAU9nZ1MAAAAAAAAAAAAAcETxRQEAAAA7J4IBDP8F////////////tQN2b3JiaXMvAAAAWGlwaC5PcmcgbGliVm9yYmlzIEkgMjAxNDAxMjIgKFR1cnBha8OkcsOkamlpbikGAAAAJQAAAEVOQ09ERVI9U291bmQgU3R1ZGlvLCBsaWJWb3JiaXMgMS4zLjEbAAAAQUxCVU0gQVJUSVNUPUFkdmVudHVyZSBMYW5kFAAAAEFMQlVNPUFkdmVudHVyZSBMYW5kIQAAAEVOQ09ESU5HIEFQUExJQ0FUSU9OPVNvdW5kIFN0dWRpbxUAAABBUlRJU1Q9QWR2ZW50dXJlIExhbmQjAAAAVElUTEU9RW1wdHkgTG9vcCBGb3IgSlMgUGVyZm9ybWFuY2UBBXZvcmJpcxJCQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBADIAAAYhiGH3knMkFOQSSYpVcw5CKH1DjnlFGTSUsaYYoxRzpBTDDEFMYbQKYUQ1E45pQwiCENInWTOIEs96OBi5zgQGrIiAIgCAACMQYwhxpBzDEoGIXKOScggRM45KZ2UTEoorbSWSQktldYi55yUTkompbQWUsuklNZCKwUAAAQ4AAAEWAiFhqwIAKIAABCDkFJIKcSUYk4xh5RSjinHkFLMOcWYcowx6CBUzDHIHIRIKcUYc0455iBkDCrmHIQMMgEAAAEOAAABFkKhISsCgDgBAIMkaZqlaaJoaZooeqaoqqIoqqrleabpmaaqeqKpqqaquq6pqq5seZ5peqaoqp4pqqqpqq5rqqrriqpqy6ar2rbpqrbsyrJuu7Ks256qyrapurJuqq5tu7Js664s27rkearqmabreqbpuqrr2rLqurLtmabriqor26bryrLryratyrKua6bpuqKr2q6purLtyq5tu7Ks+6br6rbqyrquyrLu27au+7KtC7vourauyq6uq7Ks67It67Zs20LJ81TVM03X9UzTdVXXtW3VdW1bM03XNV1XlkXVdWXVlXVddWVb90zTdU1XlWXTVWVZlWXddmVXl0XXtW1Vln1ddWVfl23d92VZ133TdXVblWXbV2VZ92Vd94VZt33dU1VbN11X103X1X1b131htm3fF11X11XZ1oVVlnXf1n1lmHWdMLqurqu27OuqLOu+ruvGMOu6MKy6bfyurQvDq+vGseu+rty+j2rbvvDqtjG8um4cu7Abv+37xrGpqm2brqvrpivrumzrvm/runGMrqvrqiz7uurKvm/ruvDrvi8Mo+vquirLurDasq/Lui4Mu64bw2rbwu7aunDMsi4Mt+8rx68LQ9W2heHVdaOr28ZvC8PSN3a+AACAAQcAgAATykChISsCgDgBAAYhCBVjECrGIIQQUgohpFQxBiFjDkrGHJQQSkkhlNIqxiBkjknIHJMQSmiplNBKKKWlUEpLoZTWUmotptRaDKG0FEpprZTSWmopttRSbBVjEDLnpGSOSSiltFZKaSlzTErGoKQOQiqlpNJKSa1lzknJoKPSOUippNJSSam1UEproZTWSkqxpdJKba3FGkppLaTSWkmptdRSba21WiPGIGSMQcmck1JKSamU0lrmnJQOOiqZg5JKKamVklKsmJPSQSglg4xKSaW1kkoroZTWSkqxhVJaa63VmFJLNZSSWkmpxVBKa621GlMrNYVQUgultBZKaa21VmtqLbZQQmuhpBZLKjG1FmNtrcUYSmmtpBJbKanFFluNrbVYU0s1lpJibK3V2EotOdZaa0ot1tJSjK21mFtMucVYaw0ltBZKaa2U0lpKrcXWWq2hlNZKKrGVklpsrdXYWow1lNJiKSm1kEpsrbVYW2w1ppZibLHVWFKLMcZYc0u11ZRai621WEsrNcYYa2415VIAAMCAAwBAgAlloNCQlQBAFAAAYAxjjEFoFHLMOSmNUs45JyVzDkIIKWXOQQghpc45CKW01DkHoZSUQikppRRbKCWl1losAACgwAEAIMAGTYnFAQoNWQkARAEAIMYoxRiExiClGIPQGKMUYxAqpRhzDkKlFGPOQcgYc85BKRljzkEnJYQQQimlhBBCKKWUAgAAChwAAAJs0JRYHKDQkBUBQBQAAGAMYgwxhiB0UjopEYRMSielkRJaCylllkqKJcbMWomtxNhICa2F1jJrJcbSYkatxFhiKgAA7MABAOzAQig0ZCUAkAcAQBijFGPOOWcQYsw5CCE0CDHmHIQQKsaccw5CCBVjzjkHIYTOOecghBBC55xzEEIIoYMQQgillNJBCCGEUkrpIIQQQimldBBCCKGUUgoAACpwAAAIsFFkc4KRoEJDVgIAeQAAgDFKOSclpUYpxiCkFFujFGMQUmqtYgxCSq3FWDEGIaXWYuwgpNRajLV2EFJqLcZaQ0qtxVhrziGl1mKsNdfUWoy15tx7ai3GWnPOuQAA3AUHALADG0U2JxgJKjRkJQCQBwBAIKQUY4w5h5RijDHnnENKMcaYc84pxhhzzjnnFGOMOeecc4wx55xzzjnGmHPOOeecc84556CDkDnnnHPQQeicc845CCF0zjnnHIQQCgAAKnAAAAiwUWRzgpGgQkNWAgDhAACAMZRSSimllFJKqKOUUkoppZRSAiGllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimVUkoppZRSSimllFJKKaUAIN8KBwD/BxtnWEk6KxwNLjRkJQAQDgAAGMMYhIw5JyWlhjEIpXROSkklNYxBKKVzElJKKYPQWmqlpNJSShmElGILIZWUWgqltFZrKam1lFIoKcUaS0qppdYy5ySkklpLrbaYOQelpNZaaq3FEEJKsbXWUmuxdVJSSa211lptLaSUWmstxtZibCWlllprqcXWWkyptRZbSy3G1mJLrcXYYosxxhoLAOBucACASLBxhpWks8LR4EJDVgIAIQEABDJKOeecgxBCCCFSijHnoIMQQgghREox5pyDEEIIIYSMMecghBBCCKGUkDHmHIQQQgghhFI65yCEUEoJpZRSSucchBBCCKWUUkoJIYQQQiillFJKKSGEEEoppZRSSiklhBBCKKWUUkoppYQQQiillFJKKaWUEEIopZRSSimllBJC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'
    const tipsPicBase64 = 'data:image/png;base64,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'
    const mooc1img = 'data:image/png;base64,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'
    // ----------
    // 别看了，屎山
    // ----------
    class PopupTool {

        constructor(config = {}) {

            /* ------------------ 可配置属性（带默认值） ------------------ */
            this.POPUP_WIDTH = config.POPUP_WIDTH || 500;
            this.HEADER_HEIGHT = config.HEADER_HEIGHT || 30;
            this.MIN_HEADER_VISIBLE_RATIO = config.MIN_HEADER_VISIBLE_RATIO || 0.5;
            this.LS_KEY = config.LS_KEY || "99toolset";
            this.POPUP_NAME = config.POPUP_NAME || "易学·超星学习通助手";
            this.tokenR = setTimeout(() => { }, 100)

            /* 日志缓存（内部使用）*/
            this._logs = [];

            /* 初始化界面 */
            this.init();
        }

        /* ------------------ 工具方法 ------------------ */
        clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

        loadState() {
            try { return JSON.parse(GM_getValue(this.LS_KEY, false)) || {}; }
            catch { return {}; }
        }

        saveState(obj) {
            GM_setValue(this.LS_KEY, JSON.stringify(obj));
        }

        /* ===================================================================
           初始化界面 —— 原闭包内容全部重写成对象内部 this.xxx
           =================================================================== */
        init() {

            const winW = window.innerWidth;
            const winH = window.innerHeight;

            /* DOM 元素 */
            this.popup = document.createElement("div");
            this.header = document.createElement("div");
            this.minimizeBtn = document.createElement("button");
            this.content = document.createElement("div");

            this.row1 = document.createElement("div");
            this.tokenInput = document.createElement("input");
            this.saveBtn = document.createElement("button");
            this.AIBtn = document.createElement("button");
            this.restCount = document.createElement("span");

            this.row2 = document.createElement("div");
            this.baseInfo = document.createElement("div");

            this.row3 = document.createElement("div");
            this.splitter = document.createElement("div");
            this.logBox = document.createElement("div");

            /* 默认坐标 */
            const defaultLeft = winW - this.POPUP_WIDTH - 20;
            const defaultTop = (winH * 0.8 - winH * 0.2) / 2;

            const state = this.loadState();
            this.minimized = false;
            let popupLeft = defaultLeft;
            let popupTop = defaultTop;

            if (state.winW === winW && state.winH === winH) {
                if (typeof state.left === "number") popupLeft = state.left;
                if (typeof state.top === "number") popupTop = state.top;
                this.minimized = !!state.minimized;
            }

            /* ------------------ 弹窗布局 ------------------ */
            this.popup.style.cssText = `
            position: fixed;
            left: ${popupLeft}px;
            top: ${popupTop}px;
            width: ${this.POPUP_WIDTH}px;

            height: ${Math.max(winH * 0.35, this.HEADER_HEIGHT + 100)}px;

            background:#fff;
            border-radius:10px;
            border:1px solid #e5e7eb;
            display:flex;
            flex-direction:column;
            overflow:hidden;
            resize: vertical;
            z-index:999999;
            box-shadow:0 6px 18px rgba(0,0,0,.15);
        `;

            /* ------------------ 标题栏 ------------------ */
            this.header.style.cssText = `
            background:#fff;
            padding:0 10px;
            height:${this.HEADER_HEIGHT}px;
            line-height:${this.HEADER_HEIGHT}px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            border-bottom:1px solid #e5e7eb;
            cursor:move;
            user-select:none;
            font-size:14px;
            font-weight:600;
        `;
            this.header.textContent = this.POPUP_NAME;

            this.minimizeBtn.textContent = this.minimized ? "▶" : "⏸";
            this.minimizeBtn.style.cssText = `
            background:transparent;
            border:none;
            font-size:14px;
            width:24px;height:20px;
            cursor:pointer;
            border-radius:4px;
        `;
            this.minimizeBtn.onmouseover = () => this.minimizeBtn.style.background = "#eee";
            this.minimizeBtn.onmouseout = () => this.minimizeBtn.style.background = "transparent";
            this.header.appendChild(this.minimizeBtn);

            /* ------------------ 主体 ------------------ */
            this.content.style.cssText = `
            flex:1;
            display:flex;
            flex-direction:column;
            min-height:0;
            overflow:hidden;
            background:#fafafa;
        `;

            /* row1 */
            this.row1.style.cssText = `padding:8px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:14px;`;
            this.tokenInput.style.cssText = `
            width:100%;
            padding:6px 32px 6px 8px;  /* 右侧留位置给图标 */
            border:1px solid #ccc;
            border-radius:6px;
            box-sizing:border-box;
            font-size:14px;
        `;
            this.tokenInput.type = "password";
            this.tokenWrap = document.createElement("div");
            this.tokenWrap.style.cssText = `
            position: relative;
            flex: 1;
            display: flex;
        `;
            this.tokenWrap.appendChild(this.tokenInput);
            this.saveBtn.textContent = "保存";
            this.saveBtn.style.cssText = `padding:6px 12px;background:#1f76ff;color:#fff;border:none;border-radius:6px;cursor:pointer;`;
            this.AIBtn.textContent = "AI答题";
            this.AIBtn.style.cssText = `padding:6px 12px;background:gray;color:#fff;border:none;border-radius:6px;cursor:pointer;`;
            if (GM_getValue('aiAnswer', false)) {
                this.AIBtn.style.background = '#1f76ff'
            }
            this.restCount.textContent = questionBank.usageLabel();
            this.restCount.dataset.yixueUsage = '';
            this.eyeBtn = document.createElement("div");
            this.eyeBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 20px;
            height: 20px;
            cursor: pointer;
            opacity: 0.6;
        `;
            this.eyeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
        <circle cx="12" cy="12" r="3"/>
        </svg>
        `;

            this.eyeBtn.onmouseover = () => this.eyeBtn.style.opacity = "1";
            this.eyeBtn.onmouseout = () => this.eyeBtn.style.opacity = "0.6";

            this.tokenWrap.appendChild(this.eyeBtn);
            this.eyeBtn.addEventListener("mousedown", () => {
                this.tokenInput.type = "text";
            });
            this.eyeBtn.addEventListener("mouseup", () => {
                this.tokenInput.type = "password";
            });
            this.eyeBtn.addEventListener("mouseleave", () => {
                this.tokenInput.type = "password";
            });
            this.row1.append(this.tokenWrap, this.saveBtn, this.AIBtn, this.restCount);
            this.balanceRow = document.createElement('div');
            this.balanceRow.style.cssText = 'padding:6px 8px;display:flex;align-items:flex-start;gap:8px;border-top:1px solid #eee;font-size:12px;line-height:1.7';
            this.balanceText = document.createElement('span');
            this.balanceText.dataset.yixueBalance = '';
            this.balanceText.setAttribute('aria-label', '题库账户额度');
            this.balanceText.style.cssText = 'flex:1;min-width:0;overflow-wrap:anywhere';
            this.balanceText.textContent = questionBank.balanceLabel();
            const refreshBalanceButton = document.createElement('button');
            refreshBalanceButton.type = 'button'; refreshBalanceButton.textContent = '刷新额度（免费）';
            refreshBalanceButton.dataset.yixueBalanceRefresh = '';
            refreshBalanceButton.style.cssText = 'flex:none;padding:4px 8px;cursor:pointer;border:1px solid #ccd4df;border-radius:4px;background:white;color:#165dbe';
            refreshBalanceButton.onclick = () => questionBank.refreshBalance({ force: true });
            this.balanceRow.append(this.balanceText, refreshBalanceButton);

            /* row2 */
            this.row2.style.cssText = `padding:8px;background:#fff;border-top:1px solid #e5e7eb;font-size:14px;`;
            this.baseInfo.textContent = "内容加载中";
            this.row2.appendChild(this.baseInfo);

            /* row3 + split + logBox */
            this.row3.style.cssText = `
            flex:1;
            display:flex;
            flex-direction:column;
            min-height:0;
            overflow:hidden;
            background:#fff;
            border-top:1px solid #e5e7eb;
        `;
            this.splitter.style.cssText = `height:4px;background:#f3f4f6;cursor:row-resize;`;
            this.logBox.style.cssText = `
            flex:1;
            min-height:0;
            overflow-y:auto;
            padding:8px;
            font-size:14px;        /* ★ 从 12 改为 14 */
            line-height:1.5;
            background:#fff;
            white-space:pre-wrap;
            word-wrap:break-word;
            overflow-wrap:break-word;
        `;
            this.logBox.textContent = "日志输出：\n";

            this.row3.append(this.splitter, this.logBox);
            this.content.append(this.row1, this.balanceRow, this.row2, this.row3);

            this.popup.append(this.header, this.content);
            document.body.appendChild(this.popup);

            /* 拖动、最小化、高度调整逻辑 */
            this.bindEvents();

            /* 恢复最小化状态 */
            this.applyMinimize();
        }

        /* ===================================================================
           行为绑定（拖动、分割条、最小化、位置保持）
           =================================================================== */
        bindEvents() {
            const popup = this.popup;

            /* ------------------ 拖动 ------------------ */
            let isDragging = false, offsetX = 0, offsetY = 0;

            this.header.addEventListener("mousedown", (e) => {
                isDragging = true;
                offsetX = e.clientX - popup.offsetLeft;
                offsetY = e.clientY - popup.offsetTop;
            });
            window.addEventListener("mouseup", () => {
                if (!isDragging) return;
                isDragging = false;
                this.saveState({
                    left: popup.offsetLeft,
                    top: popup.offsetTop,
                    minimized: this.minimized,
                    winW: window.innerWidth,
                    winH: window.innerHeight
                });
            });
            window.addEventListener("mousemove", (e) => {
                if (!isDragging) return;

                let left = e.clientX - offsetX;
                let top = e.clientY - offsetY;

                const vw = window.innerWidth;
                const vh = window.innerHeight;

                const minVisible = this.POPUP_WIDTH * this.MIN_HEADER_VISIBLE_RATIO;
                const minLeft = -(this.POPUP_WIDTH - minVisible);
                const maxLeft = vw - minVisible;

                left = this.clamp(left, minLeft, maxLeft);
                top = this.clamp(top, 0, vh - this.HEADER_HEIGHT);

                popup.style.left = left + "px";
                popup.style.top = top + "px";
            });

            /* ------------------ 分割条拖高度 ------------------ */
            let draggingSplit = false;
            this.splitter.addEventListener("mousedown", () => draggingSplit = true);
            window.addEventListener("mouseup", () => draggingSplit = false);

            window.addEventListener("mousemove", (e) => {
                if (!draggingSplit) return;
                if (this.minimized) return;

                let newHeight = popup.offsetHeight + e.movementY;
                if (newHeight < this.HEADER_HEIGHT) newHeight = this.HEADER_HEIGHT;

                popup.style.height = newHeight + "px";
            });

            /* ------------------ 最小化 ------------------ */
            this.minimizeBtn.onclick = () => {
                this.minimized = !this.minimized;
                this.applyMinimize();
            };

            /* ------------------ 保持标题栏可见 ------------------ */
            setInterval(() => {
                const vw = window.innerWidth, vh = window.innerHeight;

                popup.style.left = this.clamp(
                    popup.offsetLeft,
                    -(this.POPUP_WIDTH - this.POPUP_WIDTH * this.MIN_HEADER_VISIBLE_RATIO),
                    vw - this.POPUP_WIDTH * this.MIN_HEADER_VISIBLE_RATIO
                ) + "px";

                popup.style.top = this.clamp(
                    popup.offsetTop, 0, vh - this.HEADER_HEIGHT
                ) + "px";

            }, 120);

            /* ------------------ 保存按钮（写入日志） ------------------ */
            this.saveBtn.onclick = () => {
                this.addLog("请先设置新版搜题 Token。");
            };

            this.AIBtn.onclick = () => {
                let aiAnswer = GM_getValue('aiAnswer', false)
                if (aiAnswer) {
                    this.AIBtn.style.background = 'gray'
                    this.addLog('已关闭AI答题')
                    GM_setValue('aiAnswer', false)
                } else {
                    this.AIBtn.style.background = '#1f76ff'
                    this.addLog('<span style="color:green;">已开启AI答题</span>')
                    GM_setValue('aiAnswer', true)
                }
            };
        }

        /* ===================================================================
           最小化处理
           =================================================================== */
        applyMinimize() {
            if (this.minimized) {
                this.content.style.display = "none";
                this.popup.style.height = this.HEADER_HEIGHT + "px";
                this.popup.style.resize = "none";
                this.minimizeBtn.textContent = "▶";
                this.minimizeBtn.title = "恢复";
            } else {
                this.content.style.display = "flex";
                this.popup.style.height = Math.max(window.innerHeight * 0.35, this.HEADER_HEIGHT + 100) + "px";
                this.popup.style.resize = "vertical";
                this.minimizeBtn.textContent = "⏸";
                this.minimizeBtn.title = "暂停并最小化";
            }

            this.saveState({
                left: this.popup.offsetLeft,
                top: this.popup.offsetTop,
                minimized: this.minimized,
                winW: window.innerWidth,
                winH: window.innerHeight
            });
        }

        /* ===================================================================
           日志操作方法（你要求的3个）
           =================================================================== */

        /* ✔ 添加一条日志：自动加时间前缀 */
        addLog(str) {
            const now = new Date();
            const t = `[${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}] `;

            const finalLine = t + str;

            // 内部缓存追加
            this._logs.push(finalLine);

            // ★ 使用 innerHTML 支持富文本
            this.logBox.innerHTML += finalLine + "<br>";

            // 滚动到底部
            this.logBox.scrollTop = this.logBox.scrollHeight;
        }

        /* ✔ 批量载入日志（不清空原有日志，直接追加） */
        loadLogs(arr) {
            if (!Array.isArray(arr)) return;

            for (const line of arr) {
                this._logs.push(line);
                this.logBox.innerHTML += line + "<br>";
            }

            this.logBox.scrollTop = this.logBox.scrollHeight;
        }

        /* ✔ 导出当前日志为一维字符串数组 */
        exportLogs() {
            return this._logs.slice();
        }

        /* 自定义信息栏内容 */
        setBaseInfo(htmlString) {
            this.baseInfo.innerHTML = htmlString;
        }

        /* 显示新版接口实际返回的查询消耗 */
        setUsage() {
            this.restCount.textContent = questionBank.usageLabel();
            renderAccountBalance();
        }

        /* ✔ 设置 Token（并记录为旧值） */
        setToken(token) {
            this._lastValidToken = token;   // 保存合法 token
            this.tokenInput.value = token;
            this._tokenIsValid = questionBank.isValidToken(token);
        }

        /* 
        ✔ 设置 Token 验证与保存逻辑
        validator(token) → true/false
        onSave(token) → 用户点击保存且验证通过后执行
        */
        setTokenHandler(validator = (token) => {
            const reg = /^tk_[A-Za-z0-9_-]{32,128}$/
            return reg.test(token)
        }, onSave = function (token) {
            questionBank.setToken(token)
            ctk(token)
            clearInterval(this.tokenR)
            this.tokenR = setInterval(() => {
                this.setUsage()
            }, 500)
        }) {

            this._validator = validator;
            this._onSave = onSave;

            // 输入框监听：实时验证
            this.tokenInput.addEventListener("input", () => {
                const value = this.tokenInput.value.trim();

                const ok = this._validator(value);
                this._tokenIsValid = ok;    // 保存验证状态

                // 你可以在这里扩展输入实时提示
            });

            // 保存按钮点击逻辑（覆盖原有 onclick）
            this.saveBtn.onclick = () => {

                const value = this.tokenInput.value.trim();

                if (this._tokenIsValid) {
                    // 通过验证 —— 正常保存
                    this._lastValidToken = value;

                    // 调用外部保存回调
                    this._onSave(value);

                    // 写入日志
                    this.addLog("Token 保存成功。");

                } else {

                    // 验证失败 —— 恢复旧 token
                    if (this._lastValidToken !== undefined) {
                        this.tokenInput.value = this._lastValidToken;
                    }

                    // 显示红色错误提示
                    this.setBaseInfo(`
                <span style="color:red;font-weight:bold;">
                    token格式不符，已为您还原上一个token
                </span>
            `);

                    // 写入日志
                    this.addLog("<span style='color:red'>Token 保存失败（格式不符）</span>");
                }
            };
        }

    }
    let pass = true,
        $qqgroup = '1051811266',
        $w = unsafeWindow,
        $l = $w.location.href,
        $d = $w.document,
        $version = GM_info.script.version.replaceAll('.', ''),
        // 调用$s[value]可以获取url查询值
        $s = Object.fromEntries(new URLSearchParams($w.location.search)),
        $protocol = $w.location.protocol + "//",
        getCookie = name => `; ${document.cookie}`.split(`; ${name}=`).pop().split(';').shift(),
        $uid = getCookie('UID') || getCookie('_uid') || $s['uid'],
        // 自己封装的仿layer弹窗，因为从外部调用js可能受网络影响
        $layer = (info, title = '提示', callback = false) => {
            GM_addStyle(`.shadow {
        position: absolute;
        top: -20px;
        left: 0;
        width: 100%;
        height: 110%;
        background-color: #000;
        opacity: 0.3;
        z-index:9998
    }

    .alert {
        position: absolute;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%, -50%);
        min-width: 260px;
        max-width: 400px;
        background-color: #fff;
        border-radius: 2px;
        box-shadow: 1px 1px 50px rgba(0, 0, 0, .3);
        padding: 0;
        z-index:9999;
    }

    .alert .alertHead {
        padding: 0 80px 0 20px;
        height: 42px;
        line-height: 42px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
        color: #333;
        overflow: hidden;
        background-color: #F8F8F8;
        border-radius: 2px 2px 0 0;
    }

    .alert .alertBody {
        padding: 20px;
        line-height: 24px;
        word-break: break-all;
        overflow: hidden;
        font-size: 14px;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .alert .buttons {
        text-align: right;
        padding: 0 15px 12px;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
    }

    .alert .buttons .button {
        display: inline-block;
        height: 28px;
        line-height: 28px;
        margin: 5px 5px 0;
        padding: 0 15px;
        border-radius: 2px;
        border-color: #1E9FFF;
        background-color: #1E9FFF;
        color: #fff;
        cursor: pointer;
    }

    .alert .buttons span:hover {
        opacity: .9;
        text-decoration: none;
    }`)
            const body = $d.body;
            const shadow = $d.createElement('div');
            const alert = $d.createElement('div');
            const alertHead = $d.createElement('div');
            const alertBody = $d.createElement('div');
            const closeFunction = () => {
                shadow.remove();
                alert.remove();
            }
            shadow.classList.add('shadow');
            alert.classList.add('alert');
            alertHead.classList.add('alertHead');
            alertBody.classList.add('alertBody');
            alertHead.innerHTML = title
            alertBody.innerHTML = info;
            alert.appendChild(alertHead)
            alert.appendChild(alertBody)
            const buttons = $d.createElement('div');
            const button = $d.createElement('button');
            button.type = 'button';
            buttons.classList.add('buttons');
            button.classList.add('button');
            button.innerHTML = '确定';
            if (callback !== false) {
                button.addEventListener('click', () => {
                    closeFunction()
                    callback()
                });
            } else {
                button.addEventListener('click', closeFunction);
            }
            buttons.appendChild(button);
            alert.appendChild(buttons)
            body.appendChild(shadow);
            body.appendChild(alert);
            return true
        },
        // 根据ascii排序数组元素
        $ascii = (str) => {
            return str.split('').sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join('');
        },
        // 生成随机32位字符串
        randomString = (z = false) => {
            let t = "abcdef1234567890",
                result = ''
            z && (t += "ghijklmnopqrstuvwxyz")
            for (let i = 0; i < 32; i++) {
                const randomIndex = Math.floor(Math.random() * t.length);
                result += t[randomIndex];
            }
            return result
        },
        // 生成随机毫秒数，例如$(1,2)可能返回1500
        $n = function (min, max) {
            if (arguments.length == 1) {
                max = min + 1;
                if (min > 1) {
                    min = min - 1
                }
            } else if (arguments.length == 0) {
                min = 4;
                max = 6;
            }
            return (Math.random() * (max - min) + min).toFixed(3) * 1000;
        },
        // sleep函数，使用await调用
        sleep = (interval) => {
            return new Promise((success, fail) => {
                setTimeout(success, interval);
            });
        },
        hostList = [questionBank.base() + '/'],
        host = '',
        handleImgs = (s) => {
            // 去除字符串中的style与script标签和其中的内容
            s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            let imgEs = s.match(/(<img([^>]*)>)/ig)
            // 提取html中的图片
            if (imgEs) {
                for (let j = 0, k = imgEs.length; j < k; j++) {
                    let div = $d.createElement('div')
                    div.innerHTML = imgEs[j]
                    if (div.children.length < 1) {
                        continue
                    }
                    let src = div.children[0].getAttribute('src')
                    src && (s = s.replace(imgEs[j], src.replace(/http[s]?:\/\//, '')));
                }
            }
            // 提取iframe（音频内容），转化为纯文本链接
            let iframeEs = s.match(/(<iframe([^>]*)>)/ig);
            if (iframeEs) {
                for (let j = 0, k = iframeEs.length; j < k; j++) {
                    let div = $d.createElement('div')
                    div.innerHTML = iframeEs[j]
                    let src = div.children[0].getAttribute('_src') || div.children[0].getAttribute('src')
                    src && (s = s.replace(iframeEs[j], src.replace(/http[s]?:\/\//, '')));
                }
            }
            // 提取audio标签（旧版音频）
            let div = $d.createElement('div')
            div.innerHTML = s
            let audioPlayers = div.querySelectorAll('.audioReader')
            for (let audioPlayer of audioPlayers) {
                let source = audioPlayer.querySelector('source')
                let src = ''
                if (source) {
                    src = source.getAttribute('src')
                    if (src) {
                        src = src.replace(/http[s]?:\/\//, '')
                    }
                }
                audioPlayer.innerHTML = src
            }
            s = div.innerHTML
            return s
        },
        // 格式化字符串
        beforeTrim = (s) => {
            return handleImgs(s)
                .replaceAll(/([\x00-\x1F\x7F]|\s){2,}/g, ' ')
                .replaceAll(/<[^>]*>/g, '')
                .replaceAll('javascript:void(0);', '')
                .replaceAll(" ", '')
                .replace(/^([\x00-\x1F\x7F]|\s)+/ig, '')
                .replace(/([\x00-\x1F\x7F]|\s)+$/ig, '')
                .replaceAll("&nbsp;", '')
        },
        trim = (s) => {
            return handleImgs(s)
                .replaceAll(/([\x00-\x1F\x7F]|\s){2,}/g, ' ')
                .replaceAll(/<[^>]*>/g, '')
                .replaceAll('javascript:void(0);', '')
                .replaceAll("，", ",")
                .replaceAll("。", ".")
                .replaceAll("？", "?")
                .replaceAll("！", "!")
                .replaceAll("：", ":")
                .replaceAll("；", ";")
                .replaceAll("“", '"')
                .replaceAll("”", '"')
                .replaceAll("‘", "'")
                .replaceAll("’", "'")
                .replaceAll("（", "(")
                .replaceAll("）", ")")
                .replaceAll("【", "[")
                .replaceAll("】", "]")
                .replaceAll("、", ",")
                .replaceAll("\"", '*')
                .replaceAll("&nbsp;", '')
                .replaceAll("'", '*')
                .replaceAll("%", '*')
                .replaceAll(" ", '')
                .replace(/^([\x00-\x1F\x7F]|\s)+/ig, '')
                .replace(/([\x00-\x1F\x7F]|\s)+$/ig, '');
        },
        trimAnswer = value => trim(escapeText(value)),
        isSameDomain = (url1, url2) => {
            // 判断请求前后两个url是否为同域
            if (url1.indexOf('http') !== 0) {
                // 直接请求路径，说明与页面同域，替换为页面url
                url1 = $l
            }
            try {
                const currentUrl = new URL(url1);
                const testUrl = new URL(url2);
                // 比较主机名（hostname）是否相同
                return currentUrl.hostname === testUrl.hostname;
            } catch (error) {
                return false;
            }
        },
        request = (data) => {
            let hosts = window.location.href.match(/https:\/\/webvpn\.(.*?)\/https\/[0-9a-z]+\//)
            if (Array.isArray(hosts) && hosts.length > 0) {
                try {
                    if (data.headers && data.headers.Referer) {//修改referer为vpn
                        try {
                            const refererObj = new URL(data.headers.Referer)
                            data.headers.Referer = hosts[0].slice(0, -1) + refererObj.pathname + refererObj.search + refererObj.hash
                        } catch (e) {
                            console.log(e)
                        }
                    }
                    const urlObj = new URL(data.url)
                    data.url = hosts[0].slice(0, -1) + urlObj.pathname + urlObj.search + urlObj.hash
                } catch (e) {//data.url是个路径，不是完整url
                    if (data.url.charAt(0) == '/') {
                        data.url = hosts[0].slice(0, -1) + data.url
                    } else {
                        data.url = hosts[0] + data.url
                    }
                    console.log(e)
                }
                if (!data.url.includes('&enlink-vpn')) {
                    data.url += '&enlink-vpn'
                }
            }//如果检测到校园网，自动重建请求到校园网节点
            return new Promise((success, fail) => {
                if (data.method == undefined) {
                    data.method = 'GET';
                }
                data.method = data.method.toUpperCase()
                if (data.timeout == undefined) {
                    data.timeout = 10000;
                }
                if (!data.headers) {
                    data.headers = {}
                }
                data.headers['Accept-Language'] = 'zh-CN,zh;q=0.9';
                data.onload = function (res) {
                    if (res.responseText.includes('<title>用户登录</title>')) {
                        // 请求后跳转到登录页，说明cookie出现异常（此问题易出现在篡改猴5.2.0版本与同期部分篡改猴beta版）
                        if (isSameDomain(data.url, $l)) {
                            let method = data.method
                            // 是否与页面同域，如果是就改用xhr
                            const xhr = new XMLHttpRequest()
                            xhr.open(method, data.url, true)
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState === XMLHttpRequest.DONE) {
                                    if (xhr.status >= 200 && xhr.status < 300) {
                                        let res = {
                                            responseText: xhr.responseText,
                                            status: xhr.status
                                        }
                                        success(res)
                                    } else {
                                        success(false)
                                    }
                                }
                            }
                            xhr.onerror = function () {
                                alert('登录状态失效，请重新登陆超星\n反馈群：' + $qqgroup);
                                $w.location.href = $protocol + $w.location.host.replace(/mooc(.*?)\./ig, 'passport2.') + '/login?fid=&newversion=true&refer=' + encodeURIComponent($l)
                            }
                            xhr.timeout = data.timeout
                            if (method === 'POST' && data.data) {
                                if (data.headers) {
                                    for (let i in data.headers) {
                                        xhr.setRequestHeader(i, data.headers[i])
                                    }
                                }
                                xhr.send(data.data)
                            } else {
                                xhr.send()
                            }
                        } else if (GM_info.scriptHandler == "Tampermonkey" && ['5.2.6195', '5.2.6196', '5.2.6197', '5.2.6198', '5.2.6199', '5.2.6200', '5.2.0'].includes(GM_info.version)) {
                            if (confirm(`您正在使用的油猴插件版本为测试版：${GM_info.version}\n该版本存在未修复的问题，无法稳定的运行此脚本，请使用脚本猫\n点击确定前往脚本猫官网\n反馈群：` + $qqgroup)) {
                                $w.location.href = 'https://tk.sanzwk.com/'
                            } else {
                                success(false)
                            }
                        }
                    } else {
                        success(res)
                    }
                }
                data.onerror = function (e) {
                    const hosts = data.url.match(/^http(s)?:\/\/(.*?)\//)
                    if (hosts && hosts.length > 0) {
                        let host = hosts[0].replace(/^http(s)?:\/\//, '').replace('\/', '');
                        if (typeof e == 'object' && e.error && e.error.includes('Refused to connect to')) {
                            $w.logs.addLog('<br><font color="red">刚刚有一个跨域请求发送失败</font><br>👇请编辑脚本代码，将下方蓝色代码填入脚本指定空白中👇<br><h4><font color="blue">// @connect      ' + host + '</font></h4>👆请编辑脚本代码，将上面蓝色代码填入脚本指定空白中👆<br>别忘了保存并刷新页面哦');
                            $w.wait = true;
                        } else if (typeof e == 'string' && e.includes('permission')) {
                            $w.logs.addLog('<br><font color="red">刚刚有一个跨域请求发送失败</font><br>👇请编辑脚本代码，将下方蓝色代码填入脚本指定空白中👇<br><h4><font color="blue">// @connect      ' + host + '</font></h4>👆请编辑脚本代码，将上面蓝色代码填入脚本指定空白中👆<br>别忘了保存并刷新页面哦');
                            $w.wait = true;
                        }
                    }
                    try { $w.logs.addLog('请求错误，请检查网络连接', 'red'); } catch (e) { }
                    if (!$l.includes('chaoxing.com')) {
                        let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
                            courseId = $s['courseid'] || $s['courseId'];
                        if (confirm('检测到您使用的是学校定制学习通，可能会出现使用问题\n可以尝试切换到学习通官方页面（需要重新登陆），是否切换？')) {
                            $w.location.href = 'http://passport2.chaoxing.com/login?refer=http%3A%2F%2Fmooc1.chaoxing.com%2Fvisit%2Fstucoursemiddle%3Fcourseid%3D' + courseId + '%26clazzid%3D' + classId + '%26vc%3D1%26ismooc2%3D1%26v%3D2%26r%3D1&newversion=true&_blank=0';
                        }
                    }
                    console.log(e);
                    success(false);
                }
                data.ontimeout = function () {
                    success(false);
                }
                GM_xmlhttpRequest(data);
            })
        },
        brequest = (data) => {
            return new Promise((success, fail) => {
                if (data.url.includes('?')) {
                    data.url += '&'
                } else {
                    data.url += '?'
                }
                data.url += 'ran=' + String(Date.now())
                if (!data.method) {
                    data.method = 'get'
                }
                if (!data.timeout) {
                    data.timeout = 1e4
                }
                data.ontimeout = data.onerror = function () {
                    success(false)
                }
                data.onload = function (res) {
                    try {
                        success(JSON.parse(res.responseText));
                    } catch (e) {
                        console.log(e);
                        success(false);
                    }
                }
                GM_xmlhttpRequest(data);
            })
        },
        refreshQueryUsage = () => {
            renderAccountBalance();
            for (const id of ['payButton', 'bindQQ', 'payToken']) {
                const link = $d.getElementById(id);
                if (link) { link.href = questionBank.base(); link.rel = 'noopener noreferrer'; }
            }
        },
        ctk = () => { refreshQueryUsage(); return questionBank.getToken() ? questionBank.refreshBalance({ force: true }) : Promise.resolve(questionBank.balanceState()); },
        // 检查字符串是否为判断题答案
        panDuan = str => {
            const right = ['正确', '对', '是', 'T', '√', 'ri', 'true', 'A']
            const wrong = ['错误', '错', '否', 'F', '×', 'wr', 'false', 'B']
            let result = false
            right.forEach(e => {
                if (str.includes(e)) {
                    result = 'r'
                }
            })
            wrong.forEach(e => {
                if (str.includes(e)) {
                    result = 'w'
                }
            })
            return result
        },
        // 检查脚本是否多开
        checkDuoKai = () => {
            if ($w.top !== $w) {
                return false;
            }
            try {
                // 在页面添加一个全局数组，如果数组元素数量>2，就是多开了
                $w.checkConcurrency.push(6);
            } catch {
                $w.checkConcurrency = [6];
            }
            const scriptNum = $w.checkConcurrency.length
            if (scriptNum > 1) {
                alert(`【易学·超星学习通助手】\n\n请勿多开此脚本，您开启了${scriptNum}个，请删除多余脚本\n\n请检查您是否同时安装了多个相同的脚本\n是否同时安装了多个脚本管理器：脚本猫、暴力猴、油猴等\n是否有脚本管理器插件被归档至扩展按钮中`);
                return true;
            }
            return false;

        },
        // 使用textarea元素来去除html中奇奇怪怪的符号
        decodeHtmlEntities = text => {
            const textarea = $d.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        },
        md5 = (str) => {
            function hex_md5(s) {
                return binl2hex(core_md5(str2binl(s), s.length * 8));
            }
            function core_md5(x, len) {
                x[len >> 5] |= 0x80 << ((len) % 32);
                x[(((len + 64) >>> 9) << 4) + 14] = len;
                let a = 1732584193;
                let b = -271733879;
                let c = -1732584194;
                let d = 271733878;
                for (let i = 0; i < x.length; i += 16) {
                    let olda = a;
                    let oldb = b;
                    let oldc = c;
                    let oldd = d;
                    a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
                    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
                    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                    b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
                    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
                    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                    d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
                    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
                    a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
                    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
                    a = safe_add(a, olda);
                    b = safe_add(b, oldb);
                    c = safe_add(c, oldc);
                    d = safe_add(d, oldd);
                }
                return Array(a, b, c, d);
            }
            function md5_cmn(q, a, b, x, s, t) {
                return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
            }
            function md5_ff(a, b, c, d, x, s, t) {
                return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
            }
            function md5_gg(a, b, c, d, x, s, t) {
                return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
            }
            function md5_hh(a, b, c, d, x, s, t) {
                return md5_cmn(b ^ c ^ d, a, b, x, s, t);
            }
            function md5_ii(a, b, c, d, x, s, t) {
                return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
            }
            function safe_add(x, y) {
                let lsw = (x & 0xFFFF) + (y & 0xFFFF);
                let msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
            }
            function bit_rol(num, cnt) {
                return (num << cnt) | (num >>> (32 - cnt));
            }
            function str2binl(str) {
                let bin = Array();
                for (let i = 0; i < str.length * 8; i += 8)
                    bin[i >> 5] |= (str.charCodeAt(i / 8) & 255) << (i % 32);
                return bin;
            }
            function binl2hex(binarray) {
                let hex_tab = "0123456789abcdef";
                let str = "";
                for (let i = 0; i < binarray.length * 4; i++) {
                    str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
                        hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
                }
                return str;
            }
            return hex_md5(str)
        },
        getTkToken = () => questionBank.getToken(),
        tokenGetter = requestApiToken,
        hostCheck = async ({ requireToken = true } = {}) => {
            host = questionBank.base() + '/';
            if (!requireToken) {
                if (!courseAccess.hasAccess() && !await requestCourseAccess()) return false;
                return host;
            }
            if (!await questionBank.health()) {
                alert('题库服务暂不可用，请检查题库地址、网络和脚本 @connect 权限后重试。');
                return false;
            }
            if (!getTkToken() && !await tokenGetter()) return false;
            await questionBank.refreshBalance();
            return host;
        }
    if (checkDuoKai()) {
        return;
    }
    // 监听此页面，判断用户是否需要刷学习次数，如果需要，就点进章节
    if ($l.includes('mycourse/studentcourse?')) {
        let i = setInterval(() => {
            if (GM_getValue("doxxcs", false)) {
                clearInterval(i)
                const lis = [...$d.querySelectorAll(".chapter_item"), ...$d.querySelectorAll("h3")]
                for (e of lis) {
                    if (e.innerHTML.includes("chapterId") || (e.getAttribute("onclick") && e.getAttribute("onclick").includes("toOld"))) {
                        e.click()
                        e.querySelector("a").click()
                        return
                    }
                }
            }
        }, 500)
    }
    // 刷章节次数页面
    else if ($l.includes('mycourse/studentstudy?') && GM_getValue('doxxcs', false)) {
        GM_setValue('doxxcs', false)
        const body = $d.querySelector("body")
        const div = $d.createElement('div')
        div.setAttribute("id", "skpannel")
        div.innerHTML = `<div id="skpannel">
        <div id="skshadow" style="
        width: 100%;
        height: 100%;
        position: absolute;
        top: -20px;
        left: 0;
        width: 100%;
        height: 110%;
        background-color: rgba(16,26,41,0.76);
        z-index: 9998;
        ">
        </div>
        <div id="skpannel" style="
    font-size: 20px;
        position: absolute;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%,-50%);
        width: 650px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 1px 1px 50px rgba(0,0,0,.3);
        overflow: hidden;
        padding: 15px 30px;
        z-index: 9999;
            ">
            <div style="
        font-size: 26px;
        width: 100%;
        font-weight: 500;
        ">易学·超星学习通助手</div>
            <div style="display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        ">
                <span>
                    <div style="margin: 20px 0 10px;">正在刷学习次数，如需停止请刷新页面</div>
                </span>
                
            </div>
            <div style="font-size: 16px;text-align: center;">已刷<span id="ciuu">1</span>次</div>
            <div style="font-size: 16px;text-align: center;">学习次数不是实时更新，请不要同时运行其他脚本，否则刷次数会失败</div>
            <span style="font-xize:14px; cursor: pointer; color: #68A4FF;  line-height: 20px; height: 20px;border: 1px solid #68A4FF;display: inline-block ;border-radius: 10px;">点我一下，然后你就不用一直盯着这个页面了</span>
        </div>
    </div>`
        let d
        const a = () => {
            // 随机点击任意章节，学习次数+1
            const s = [...$d.querySelectorAll('.posCatalog_name'), ...$d.querySelectorAll('a')]
            s.sort((a, b) => {
                // 打乱数组顺序
                return Math.random() - 0.5
            })
            for (let z of s) {
                let onclick = z.getAttribute("onclick") || z.getAttribute("href")
                if (onclick && onclick.includes('getTeacherAjax') && onclick != lastOnclick) {
                    lastOnclick = onclick
                    z.click()
                    d.innerHTML = +d.innerHTML + 1
                    break
                }
            }
        }
        let lastOnclick = null
        setTimeout(e => {
            body.appendChild(div)
            d = $d.querySelector('#ciuu')
            setInterval(() => {
                a()
            }, $n(10, 20))
            const audioPlayer = new Audio(audiofile)
            audioPlayer.loop = true
            $d.addEventListener('visibilitychange', function () {
                // 播放静音音频，防止页面休眠
                var c = 0;
                if ($d.hidden) {
                    audioPlayer.play();
                    var timer = setInterval(function () {
                        if (c) {
                            $d.title = '🙈刷次数中';
                            c = 0;
                        } else {
                            $d.title = '🙉刷次数中';
                            c = 1;
                        }
                        if (!$d.hidden) {
                            clearInterval(timer);
                            $d.title = '学生学习页面';
                        }
                    }, 1300);
                } else {
                    audioPlayer.pause();
                }
            })
        }, 1000)
    }
    // 章节主页，在此页面显示导航弹窗
    if ($l.includes('/mycourse/stu?') || $l.includes('mycourse/studentcourse?')) {
        let newVersion = true
        if ($l.includes('mycourse/studentcourse?')) {
            if ($w.top != $w) {
                try {
                    void window.top.location.href;
                    return false;
                } catch (error) {
                    if (error?.name !== 'SecurityError') {
                        return true;
                    }
                }
            }
            if (GM_getValue('directToWork', false)) {
                GM_setValue('directToWork', false)
                const workButton = $d.querySelector('.workTip')
                if (!workButton) {//部分直接发布作业的课程不显示作业切换按钮，所以直接拼接url
                    const buttons = [...$d.querySelectorAll('div.navshow>ul>li>a')];
                    let classId = false
                    let courseId = false
                    let enc = false
                    buttons.forEach(a => {
                        const href = a.href
                        const zclassId = href.match(/classId=([^&]+)/i)?.[1]
                        if (zclassId) {
                            classId = zclassId
                        }
                        const zcourseId = href.match(/courseId=([^&]+)/i)?.[1]
                        if (zcourseId) {
                            courseId = zcourseId
                        }
                        const zenc = href.match(/enc=([^&]+)/i)?.[1]
                        if (zenc) {
                            enc = zenc
                        }
                    });
                    if (classId && courseId && enc) {
                        $w.location.href = `/mooc-ans/work/getAllWork?classId=${classId}&courseId=${courseId}&enc=${enc}`
                    } else {
                        alert('【易学·超星学习通助手】\n无法跳转作业页面，请联系客服')
                    }
                } else {
                    $d.querySelector('.workTip').previousSibling.click()
                }
                return
            }
            newVersion = false
        } else {
            setTimeout(() => {
                let hosts = window.location.href.match(/https:\/\/webvpn\.(.*?)\/https\/[0-9a-z]+\//)
                if (Array.isArray(hosts) && hosts.length > 0) {
                    $w.backToOld()
                }
            }, 1000)//如果检测到校园网，自动切换到旧版页面（新版没法用）
            setTimeout(e => {
                const pagehead = $d.querySelector('.headRight')
                if (pagehead && !pagehead.innerHTML.includes('回到旧版')) {
                    let a = $d.createElement('a')
                    a.setAttribute('href', 'javascript:;')
                    a.setAttribute('class', "backOld fl")
                    a.setAttribute('onclick', "backToOld()")
                    a.innerHTML = "回到旧版"
                    pagehead.prepend(a)
                }
            }, 2000)
        }
        const body = $d.querySelector("body")
        const div = $d.createElement('div')
        const entrance = (host) => {
            let hosts = window.location.href.match(/https:\/\/webvpn\.(.*?)\/https\/[0-9a-z]+\//)
            if (Array.isArray(hosts) && hosts.length > 0) {
                host = hosts[0].slice(0, -1)
            }//如果检测到校园网，自动替换host为校园网节点
            let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
                courseId = $s['courseid'] || $s['courseId'],
                cpi = $s['cpi'] || '',
                courseName = $d.title.replace('-首页', '')
            const params = new URLSearchParams({ ut: 's', classid: classId || '', courseid: courseId || '', cpi, coursename: courseName, uid: $uid || '' });
            return host + `/mooc-ans/course/999999999${$version}.html?` + params
        }
        div.setAttribute('id', 'yixue-course-options');
        GM_addStyle(`
            #yixue-course-options #skshadow { position:fixed !important; inset:0 !important; width:auto !important; height:auto !important; }
            #yixue-course-options #skpannel { position:fixed !important; top:50% !important; left:50% !important; width:min(1040px,calc(100vw - 32px)) !important; max-height:calc(100vh - 32px); overflow:auto !important; box-sizing:border-box; }
            #yixue-course-options .yixue-account-columns { gap:24px; flex-wrap:wrap; }
            #yixue-course-options .yixue-account-columns > span { display:block; flex:1 1 300px; min-width:0; }
            #yixue-course-options .yixue-account-row { gap:10px; flex-wrap:wrap; align-items:center; }
            #yixue-course-options #token { box-sizing:border-box; flex:1 1 180px; min-width:0; }
            #yixue-course-options #tokenLeft { box-sizing:border-box; width:140px !important; }
            #yixue-course-options #saveToken, #yixue-course-options #payToken, #yixue-course-options #tokenTip { white-space:nowrap; flex-shrink:0; margin-left:0 !important; }
            #yixue-course-options .yixue-course-actions { flex-wrap:wrap; gap:10px; }
            #yixue-course-options .yixue-course-actions > * { margin:0 !important; white-space:nowrap; }
        `);
        if (/Android/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent)) {
            let a = confirm('【易学·超星学习通助手】\n\n您可能正在使用手机浏览器\n我们不保证脚本能正常运行\n也不保证学习成绩\n建议使用edge手机端浏览器\n点击确定查看详细教程、点击取消关闭此窗口')
            if (a) {
                $w.location.href = 'https://greasyfork.cn/post/3'
            }
        } else if (/EdgA/i.test(navigator.userAgent)) {
            alert('【易学·超星学习通助手】\n\n您可能正在使用edge手机浏览器\n我们不保证脚本能在后台正常挂机\n不同手机的后台策略不同，可能在您回到桌面后会自动暂停\n如遇问题请刷新页面或更换为电脑浏览器')
        }
        div.innerHTML = `<div id="skshadow" style="
        width: 100%;
        height: 100%;
        position: absolute;
        top: -20px;
        left: 0;
        width: 100%;
        height: 110%;
        background-color: rgba(16,26,41,0.76);
        z-index: 9996;
        ">
        </div>
        <div id="skpannel" style="
    font-size: 20px;
        position: absolute;
        top: 50vh;
        left: 50vw;
        transform: translate(-50%,-50%);
        width: 650px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 1px 1px 50px rgba(0,0,0,.3);
        overflow: hidden;
        padding: 15px 30px;
        z-index: 9997;
            ">
    
            <div style="
        font-size: 26px;
        width: 100%;
        font-weight: 500;
        ">易学·超星学习通助手</div>
            <div style="display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        ">
                <span>
                    <div style="margin: 20px 0 10px;">题库Token</div>
                    <span style="display: flex;">
                        <input id="token" autocomplete="off"
                            style="color: #495057; outline: none; font-size:18px;width:  250px;height: 40px;border-radius: 10px;padding: 0 10px;border: 1px solid #68A4FF;"
                            type="password">
                        <span
                            style="cursor: pointer; color: #68A4FF; padding: 0 10px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 10px;" id="saveToken">保存</span>
                    </span>
    
                </span>
                <span>
                    <div style="margin: 20px 0 10px;">账户额度</div>
                    <span style="display: flex;">
                        <input id="tokenLeft" disabled="disabled" value="正在获取额度"
                            style="color: #495057; outline: none; font-size:18px;width:  180px;height: 40px;border-radius: 10px;padding: 0 10px;border: 1px solid #68A4FF;"
                            type="text">
                        <a target="_blank" style="cursor: pointer; color: #68A4FF; padding: 0 10px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 10px;" id="payToken">充值</a>
                        <span style="
                    font-size: 14px;
                    color: #1E9FFF;
                    cursor: pointer;
                    display: inline-block;
                    line-height: 38px;
                    margin-left: 10px;" id="tokenTip">刷新额度</span>
                    </span>
                </span>
            </div>
            <div id="tokentip" style="display: none; font-size: 14px; border-top: 1px solid black;border-bottom: 1px solid black;">
                
            </div>
            <div id="updateinfo" style="font-size: 16px;text-align: center;color: red;display: none;">脚本有新版本，<a href="https://tk.sanzwk.com/script-show-page/1127" target="_blank">点我前往更新</a></div>
            <div style="font-size: 16px;text-align: center;">该课程支持刷课，请选择您要刷的内容</div>
            <div style="margin-top: 20px;display: flex;justify-content: center;margin-bottom: 10px;">
                <a
                    target="_blank" style="cursor: pointer; background-color: #68A4FF; color: white; padding: 2px 15px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 23px;margin-right: 10px;"
                    id="dosk">刷章节</a>
                <span
                    style="cursor: pointer; background-color: #68A4FF; color: white; padding: 2px 15px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 23px;margin-right: 10px;"
                    id="doHomework">刷作业</span>
                <span
                    style="cursor: pointer; background-color: #68A4FF; color: white; padding: 2px 15px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 23px;margin-right: 10px;"
                    id="doExam">刷考试</span>
                <span
                    style="cursor: pointer; background-color: #68A4FF; color: white; padding: 2px 15px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 23px;"
                    id="doxxcs">刷学习次数</span>
                <span
                    style="cursor: pointer; background-color: #68A4FF; color: white; padding: 2px 15px; line-height: 38px; height: 38px;margin-left: 10px; border: 1px solid #68A4FF;display: inline-block ;border-radius: 23px;"
                    id="canclesk">取消</span>
            </div>
        </div>`
        const tokenRow = div.querySelector('#token').parentElement;
        tokenRow.classList.add('yixue-account-row');
        tokenRow.parentElement.parentElement.classList.add('yixue-account-columns');
        div.querySelector('#tokenLeft').parentElement.classList.add('yixue-account-row');
        div.querySelector('#dosk').parentElement.classList.add('yixue-course-actions');
        hostCheck({ requireToken: false }).then(server => {
            if (!server) return;
                const tempUIdElement = $d.querySelector("input[name='userId']") || $d.querySelector("input[id='uploadUid']")
                if (tempUIdElement && !$uid) $uid = tempUIdElement.value
                body.appendChild(div)
                const warning = $d.querySelector('.warn-txt') || $d.querySelector('.continue-study')
                const warns = ["已開啟結課", "本课程已结课", "已开启结课"]
                let jkdata = GM_getValue('jkdata', {})
                let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId']
                let jk = false
                if (warning) {
                    warns.forEach(e => {
                        if (warning.innerHTML.includes(e)) {
                            jk = true
                            jkdata[classId] = true
                            GM_setValue('jkdata', jkdata)
                        }
                    })
                }
                if (!jk && jkdata[classId]) {
                    jkdata[classId] = false
                    GM_setValue('jkdata', jkdata)
                }
                ctk(getTkToken())
                let tkToken = courseAccess.getDisplayToken()
                $d.querySelector("#token").value = tkToken
                $d.querySelector("#token").type = getTkToken() ? 'password' : 'text';
                const pannel = div;
                const tokentip = $d.querySelector('#tokentip')
                $d.querySelector('#dosk').addEventListener('click', async () => {
                    pannel.style.display = 'none';
                    let jumpUrl
                    if (newVersion) {
                        jumpUrl = entrance($w.ServerHost?.mooc1Domain || $w.location.origin)
                    } else {
                        jumpUrl = entrance("https://" + $w.location.host)
                    }
                    try {
                        const nowtime = Math.round(new Date() / 1000)
                        const pageTime = GM_getValue('nseibvgewb', 0)
                        $w.vhyrumeraibuy = (bool) => {
                            if (bool) {
                                GM_setValue('nseibvgewb', nowtime)
                            } else {
                                GM_setValue('nseibvgewb', 0)
                            }
                        }
                        if (nowtime - pageTime > 5184000) {
                            await new Promise((a, b) => {
                                $layer('因为浏览器安全措施升级，如果刷章节页面提示“该内容已删除”，请按照下图提示打开开关并刷新页面(不要在当前页面操作)<br><img style="border: 3px solid #333; border-radius: 4px;margin-top:10px;width:100%" src="data:' + mooc1img + '"><br><label><input type="checkbox" name="agreement" value="agreed" style="appearance: auto; -webkit-appearance: radio; display: inline-block;" onclick="if(this.checked){vhyrumeraibuy(true)}else{vhyrumeraibuy(false)}">不再提醒</label>', '提示', a)
                            })
                        }
                    } catch (e) {
                        console.log(e)
                    } finally {
                        localStorage.removeItem('nseibvgewb')
                    }

                    GM_xmlhttpRequest({
                        method: "GET",
                        url: jumpUrl,
                        timeout: 5000, // 5秒超时
                        onload: function (response) {
                            // 如果状态码在200-299之间，说明HTTPS正常
                            if (response.status >= 200 && response.status < 300) {
                                window.top.location.href = jumpUrl
                            } else {
                                window.top.location.href = jumpUrl.replace('https://', 'http://')
                            }
                        },
                        onerror: function (err) {
                            window.top.location.href = jumpUrl.replace('https://', 'http://')
                        },
                        ontimeout: function () {
                            window.top.location.href = jumpUrl.replace('https://', 'http://')
                        }
                    });
                })
                $d.querySelector('#doHomework').addEventListener('click', async () => {
                    pannel.style.display = 'none';
                    if (newVersion) $d.querySelector('.zy')?.click()
                    else $d.querySelector('.workTip')?.previousElementSibling?.click()
                })
                $d.querySelector('#doExam').addEventListener('click', async () => {
                    pannel.style.display = 'none';
                    if (newVersion) $d.querySelector('.ks')?.click()
                    else $d.querySelector('.testTip')?.previousElementSibling?.click()
                })
                $d.querySelector('#doxxcs').addEventListener('click', async () => {
                    pannel.style.display = 'none';
                    GM_setValue("doxxcs", true)
                    if (newVersion) {
                        const lis = [...$d.querySelectorAll("li")]
                        lis.forEach(e => {
                            if (e.getAttribute("dataname") === 'zj') {
                                e.click()
                            }
                        })
                    }
                })
                $d.querySelector('#canclesk').addEventListener('click', () => {
                    pannel.style.display = 'none';
                })
                let awfawf = 0
                $d.querySelector('#tokenTip').addEventListener('click', () => {
                    let now = Math.round(new Date() / 1000)
                    if (now - awfawf > 10) {
                        awfawf = now
                        ctk(tkToken)
                    } else {
                        tokentip.textContent = "请在题库网站登录后，进入接口接入创建 API Token；积分、会员每日剩余额度和到期时间可在脚本中刷新查看。"
                        tokentip.style.display = 'block'
                    }
                })
                $d.querySelector('#saveToken').addEventListener('click', () => {
                    const stkToken = $d.querySelector('#token').value.trim();
                    try { courseAccess.saveToken(stkToken); }
                    catch (error) {
                        tokentip.textContent = error.message;
                        tokentip.style.display = 'block'
                        setTimeout(e => {
                            tokentip.style.display = 'none'
                        }, 2000)
                        $d.querySelector("#token").value = tkToken
                        return
                    }
                    tkToken = stkToken
                    $d.querySelector('#token').type = getTkToken() ? 'password' : 'text';
                    $w.localStorage.removeItem('shenchanranToken')
                    tokentip.innerHTML = `<p style="color:green;text-align:center;">保存成功</p>`
                    tokentip.style.display = 'block'
                    setTimeout(e => {
                        tokentip.style.display = 'none'
                    }, 2000)
                    ctk(tkToken)
                })
            });
    }
    // 刷章节页面
    else if ($l.includes('.html?ut=s&classid') && $l.includes('/mooc-ans/course/') && !$l.includes('passport2')) {
        $w.wait = false;
        // 某些脚本在某些脚本插件运行时会导致此脚本版本号异常
        if (!$version || $version == '' || $version == undefined) {
            alert('请关闭其他同类型脚本，否则此脚本无法正常运行');
        }
        $d.getElementsByTagName('body')[0].innerHTML = '加载中。。。<br><br>如遇脚本异常，请尝试<a href="https://tk.sanzwk.com">从脚本官网重新安装脚本</a>或者<a href="https://tk.sanzwk.com/script-show-page/1127">从第三方更新脚本</a>';
        let beisu = 1,
            vgqtlv = 85
        const checkIframe = function (iframe) {
            return new Promise((success, fail) => {
                iframe.onload = function () {
                    success();
                }
            })
        }
        async function main() {
            $d.querySelector('html').innerHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>易学 · 章节学习控制台</title>
    <style id="yixue-dashboard-style">
:root {
    color-scheme: light;
    --canvas: #f5f5f7;
    --surface: #ffffff;
    --ink: #1d1d1f;
    --secondary: #737780;
    --blue: #007aff;
    --line: #e9eaf0;
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body { background: var(--canvas); color: var(--ink); font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
button, input, a { -webkit-tap-highlight-color: transparent; }
button, input { font: inherit; }
button, a { touch-action: manipulation; }
button { cursor: pointer; }
a { color: var(--blue); text-decoration: none; }
svg { display: block; flex-shrink: 0; }
h1, h2, h5, p { margin: 0; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #87baff; outline-offset: 3px; }
.container-fluid { width: 100%; max-width: 1360px; margin: 0 auto; padding: 26px 30px 24px; }
.yixue-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 4px 20px; }
.yixue-brand { display: flex; align-items: center; gap: 11px; }
.yixue-brand-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; color: #fff; background: var(--blue); box-shadow: 0 4px 10px #007aff20; font-size: 20px; font-weight: 650; }
.yixue-brand-name { font-size: 15px; font-weight: 650; letter-spacing: .3px; }
.yixue-brand-subtitle { display: block; color: var(--secondary); font-size: 11px; margin-top: -1px; }
.yixue-connection-status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border: 1px solid #dedfe5; border-radius: 999px; background: #ffffffa6; font-size: 12px; font-weight: 550; color: #686c76; }
.yixue-connection-status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #999da8; }
.yixue-connection-status[data-connected="true"] { background: #eefaf2; border-color: #d8efdf; color: #237440; }
.yixue-connection-status[data-connected="true"]::before { background: #31a555; }
.yixue-page-heading { padding: 0 4px 20px; }
.yixue-eyebrow { font-size: 11px; letter-spacing: 1.5px; font-weight: 650; color: #8b8e99; margin-bottom: 6px; }
#courseName { font-size: clamp(25px, 2.6vw, 34px); letter-spacing: -.8px; font-weight: 680; line-height: 1.35; }
.yixue-page-subtitle { color: var(--secondary); font-size: 13px; margin-top: 8px; }
#tra { height: 0; margin: 0; overflow: hidden; }
.row, .form-row { display: flex; flex-wrap: wrap; margin: 0 -10px; }
.col-12, .col-6, .col-md-6 { position: relative; width: 100%; padding: 0 10px; min-width: 0; }
.col-12 { flex: 0 0 100%; max-width: 100%; }
.col-6, .col-md-6 { flex: 0 0 50%; max-width: 50%; }
.justify-content-center { justify-content: center; }
.card { background: var(--surface); border: 1px solid #e6e7ec; border-radius: 22px; overflow: hidden; box-shadow: 0 3px 14px #1d274005; margin-bottom: 18px; }
.card-body { padding: 22px; }
.yixue-card-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.yixue-section-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; color: var(--blue); background: #edf4ff; }
.yixue-section-icon.violet { color: #7962cc; background: #f3efff; }
.yixue-section-icon.green { color: #329264; background: #edf8f1; }
.yixue-card-title { font-size: 16px; font-weight: 650; letter-spacing: -.2px; }
.yixue-card-caption { margin-left: auto; font-size: 11px; color: #8c8f99; }
.yixue-task-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.btn { border: 1px solid transparent; border-radius: 13px; min-height: 44px; padding: 10px 15px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: var(--ink); text-align: center; text-decoration: none; font: inherit; font-weight: 550; white-space: nowrap; transition: background .15s, border-color .15s, box-shadow .15s, transform .15s; }
.btn:active { transform: scale(.98); }
.btn-light { background: #f3f4f6; color: #696e79; }
.btn-primary { background: #eaf3ff; color: #006cde; }
.yixue-task-grid > .btn { width: 100%; justify-content: flex-start; gap: 9px; padding: 12px; min-height: 56px; background: #f7f8fa; border-color: #f0f1f4; color: #686e7b; font-size: 13px; }
.yixue-task-grid > .btn-primary { background: #f2f7ff; border-color: #e0ebfc; color: #245d9c; }
.yixue-task-grid > .btn > svg { opacity: .8; }
.yixue-toggle-track { margin-left: auto; position: relative; flex-shrink: 0; width: 31px; height: 19px; border-radius: 20px; background: #d9dce3; transition: background .2s; }
.yixue-toggle-track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px #0002; transition: transform .2s; }
.btn-primary .yixue-toggle-track { background: var(--blue); }
.btn-primary .yixue-toggle-track::after { transform: translateX(12px); }
#doRenwu { grid-column: 1 / -1; }
.yixue-quiz-options { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; border-top: 1px solid var(--line); margin-top: 17px; padding-top: 16px; }
.yixue-inline-label { font-size: 12px; color: var(--secondary); margin-right: 3px; }
.yixue-quiz-options .btn { border-radius: 999px; min-height: 36px; padding: 7px 12px; font-size: 12px; }
.yixue-quiz-options .btn::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .65; }
.yixue-run-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 20px; }
.btn-success, #saveConfig { background: var(--blue); color: #fff; border-color: var(--blue); box-shadow: 0 3px 7px #007aff12; }
.btn-success:hover, #saveConfig:hover { background: #0069df; }
#start, #start_new, #abaaba { flex: 1 1 120px; }
.btn-outline-primary { background: #f0f6ff; border-color: #e5edfb; color: #006de0; }
.btn-outline-primary:hover { background: #e5efff; }
.btn-outline-danger { background: #f3f4f7; color: #555d6b; border-color: #e9eaf0; }
#wic { width: 100%; color: #858994; font-size: 11px; text-align: center; background: none; border: 0; padding: 3px; min-height: 26px; }
.form-group { margin-bottom: 20px; }
label { display: inline-block; font-size: 12px; font-weight: 550; color: #656b76; margin-bottom: 7px; }
.form-inline { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; }
.form-inline .form-control { flex: 1 1 100px; min-width: 0; width: 100px; }
.form-control { width: 100%; display: block; height: 44px; padding: 10px 12px; background: #f6f7f9; color: #3c4451; border: 1px solid #edeef2; border-radius: 11px; font: inherit; font-size: 13px; font-variant-numeric: tabular-nums; transition: background .15s, border-color .15s; }
.form-control:focus { background: #fff; border-color: #8ebdff; outline: 3px solid #007aff10; }
.form-control[readonly] { background: #f6f7f9; color: #757c88; }
.form-text { display: block; margin-top: 7px; font-size: 11px; line-height: 1.7; }
.text-muted, [data-yixue-balance] { color: #8b909b; }
[data-yixue-balance] { font-size: 11px; line-height: 1.7 !important; }
.floattipbox { flex: 1 1 130px; min-width: 0; position: relative; }
.floattipbox .form-control { width: 100%; padding-right: 75px; }
.floatTip { position: absolute; top: 0; bottom: auto; right: 10px; height: 44px; display: flex; align-items: center; font-size: 11px; font-weight: 550; color: #0780f6; cursor: pointer; white-space: nowrap; }
#bindQQ, #payButton { min-height: 44px; padding: 10px 11px; font-size: 12px; border-radius: 11px; }
.yixue-number-field { position: relative; }
.yixue-number-field .form-control { padding-right: 35px; }
.yixue-field-suffix { position: absolute; right: 13px; top: 10px; color: #9a9eaa; font-size: 12px; pointer-events: none; }
.yixue-save-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--line); padding-top: 16px; }
#saveConfig { min-width: 96px; border-radius: 12px; font-size: 13px; }
.yixue-save-hint { color: #8b909b; font-size: 11px; }
.yixue-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 22px; }
.yixue-stat { background: #f7f8fa; padding: 17px 18px; border: 1px solid #f0f1f4; border-radius: 15px; }
.yixue-stat-label { display: block; color: #8a909b; font-size: 11px; margin-bottom: 4px; }
.yixue-stat-value { font-size: 29px; line-height: 1.3; font-weight: 650; font-variant-numeric: tabular-nums; letter-spacing: -1px; }
.yixue-stat-value.accent { color: var(--blue); }
.yixue-stat-unit { font-size: 11px; font-weight: 400; margin-left: 5px; color: #9b9fac; }
.yixue-progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; color: #6d7480; margin-bottom: 10px; }
#yixueProgressValue { font-variant-numeric: tabular-nums; color: #0071ed; font-weight: 650; }
.progress { display: flex; overflow: hidden; height: 8px; border-radius: 99px; background: #eff0f4; }
.progress-bar { color: transparent; background: var(--blue); border-radius: 99px; transition: width .25s; min-width: 0 !important; font-size: 0; }
.yixue-progress-note { margin-top: 10px; color: #989da7; font-size: 10px; }
.yixue-live-label { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: #f3f8f5; color: #668270; border-radius: 99px; font-size: 10px; }
.yixue-live-label::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: #74a787; }
#result { overflow-y: auto; height: 373px; scrollbar-width: thin; scrollbar-color: #d8dbe3 transparent; }
#log { overflow-wrap: anywhere; font-size: 12px; line-height: 1.8; }
#log > span { padding: 9px 1px; border-bottom: 1px solid #f0f1f4; }
.yixue-log-body { padding-top: 0; }
.yixue-player-card:has(#iframe_content:empty) { display: none; }
#iframe_content { max-width: 100%; overflow: auto; }
.yixue-footer { padding: 10px 0 0; text-align: center; color: #a3a7af; font-size: 10px; letter-spacing: .3px; }
.yixue-dashboard .shadow { position: fixed; inset: 0; background: #20293755; backdrop-filter: blur(4px); z-index: 9998; }
.yixue-dashboard .alert { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(360px, calc(100vw - 36px)); overflow: hidden; background: #fff; border: 1px solid #ffffffb3; border-radius: 23px; box-shadow: 0 24px 80px #1a26342b; z-index: 9999; }
.yixue-dashboard .alert .alertHead { padding: 21px 22px 0; font-size: 16px; font-weight: 650; }
.yixue-dashboard .alert .alertBody { padding: 12px 22px 22px; color: #717784; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.yixue-dashboard .alert .buttons { border-top: 1px solid var(--line); text-align: center; }
.yixue-dashboard .alert .button { display: block; padding: 13px; color: var(--blue); font-weight: 600; cursor: pointer; }
@media (min-width: 1200px) { .yixue-task-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } #doRenwu { grid-column: span 2; } }
@media (max-width: 900px) { .row > .col-6 { flex: 0 0 100%; max-width: 100%; } .container-fluid { max-width: 720px; padding: 22px 20px; } .yixue-page-heading { padding-bottom: 22px; } #result { height: 300px; } }
@media (max-width: 560px) { .container-fluid { padding: 19px 16px; } .yixue-topbar { padding-bottom: 24px; } .yixue-brand-subtitle { display: none; } .yixue-connection-status { font-size: 10px; padding: 5px 9px; } .card { border-radius: 20px; margin-bottom: 14px; } .card-body { padding: 18px; } .yixue-card-caption { font-size: 10px; } .col-md-6 { flex: 0 0 100%; max-width: 100%; } .yixue-task-grid { gap: 8px; } .yixue-task-grid > .btn { padding: 10px; gap: 7px; font-size: 12px; } .yixue-task-grid > .btn > svg { width: 15px; } .yixue-stat { padding: 14px; } .yixue-page-subtitle { font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; scroll-behavior: auto !important; } }

    </style>
</head>
<body translate="no" class="yixue-dashboard">
    <div class="container-fluid">
        <header class="yixue-topbar">
            <div class="yixue-brand"><span class="yixue-brand-mark" aria-hidden="true">易</span><div><span class="yixue-brand-name">易学助手</span><span class="yixue-brand-subtitle">学习通课程助手</span></div></div>
            <span class="yixue-connection-status" data-connected="false">本地模式</span>
        </header>
        <div class="yixue-page-heading"><div class="yixue-eyebrow">章节学习控制台</div><h1 id="courseName">课程名</h1><p class="yixue-page-subtitle">设置学习任务，查看课程进度。准备好后，点击启动。</p><h5 id="tra">Trying to do the best</h5></div>
        <div class="row justify-content-center">
            <div class="col-6">
                <section class="card">
                    <div class="card-body">
                        <div class="yixue-card-heading"><span class="yixue-section-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01"/></svg></span><h2 class="yixue-card-title">任务设置</h2><span class="yixue-card-caption">按需开启，随时调整</span></div>
                        <div class="yixue-task-grid">
                            <button type="button" id="doVideo" class="btn btn-light" role="switch" aria-checked="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></svg>视频任务<span class="yixue-toggle-track" aria-hidden="true"></span></button>
                            <button type="button" id="doDocument" class="btn btn-light" role="switch" aria-checked="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/></svg>文档任务<span class="yixue-toggle-track" aria-hidden="true"></span></button>
                            <button type="button" id="doWork" class="btn btn-light" role="switch" aria-checked="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="17" rx="3"/><path d="M9 3h6v4H9zM8 13l2 2 6-5"/></svg>章节测试<span class="yixue-toggle-track" aria-hidden="true"></span></button>
                            <button type="button" id="doNoMission" class="btn btn-light" role="switch" aria-checked="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>非任务点<span class="yixue-toggle-track" aria-hidden="true"></span></button>
                            <button type="button" id="doRenwu" class="btn btn-light" role="switch" aria-checked="false"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-8 12h6l-1 8 9-12h-6z"/></svg>任务引擎<span class="yixue-toggle-track" aria-hidden="true"></span></button>
                        </div>
                        <div class="yixue-quiz-options"><span class="yixue-inline-label">章节答题</span><button type="button" id="autoSubmit" class="btn btn-light" aria-pressed="false">自动提交</button><button type="button" id="AI" class="btn btn-light" aria-pressed="false">AI答题</button></div>
                        <div class="yixue-run-actions"><button type="button" id="start" class="btn btn-success"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.8c0-.7.8-1.1 1.4-.7l7.1 4.4a1.8 1.8 0 0 1 0 3L5.4 13.8c-.6.4-1.4 0-1.4-.7z"/></svg>点我启动</button><button type="button" id="start_new" class="btn btn-outline-danger">闯关模式</button><button type="button" id="wic">了解闯关模式</button></div>
                    </div>
                </section>
                <section class="card">
                    <div class="card-body">
                        <div class="yixue-card-heading"><span class="yixue-section-icon violet" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/></svg></span><h2 class="yixue-card-title">脚本配置</h2><span class="yixue-card-caption">保存后实时生效</span></div>
                        <form>
                            <div class="form-row">
                                <div class="form-group col-md-6"><label for="tokenInput">题库 Token</label><div class="form-inline"><input type="password" autocomplete="off" class="form-control" id="tokenInput" value="" /><a class="btn btn-outline-primary" id="bindQQ" target="_blank">连接题库</a></div><small class="form-text text-muted">答题前请填写题库提供的 Token</small></div>
                                <div class="form-group col-md-6"><label for="ugyvciuu">账户额度</label><div class="form-inline"><span class="floattipbox"><input type="text" class="form-control" id="ugyvciuu" readonly="readonly" value="正在获取额度" /><span class="floatTip" id="ciuuq" role="button" tabindex="0">刷新额度</span></span><a class="btn btn-outline-primary" id="payButton" target="_blank">充值</a></div></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group col-md-6"><label for="beisuInput">视频倍速</label><div class="yixue-number-field"><input type="number" min="0.5" max="16" step="0.25" class="form-control" id="beisuInput" /><span class="yixue-field-suffix">倍</span></div><small class="form-text text-muted">建议 1 倍；部分课程会限制倍速</small></div>
                                <div class="form-group col-md-6"><label for="vgqtlv">最低正确率</label><div class="yixue-number-field"><input type="number" min="0" max="100" class="form-control" id="vgqtlv" /><span class="yixue-field-suffix">%</span></div><small class="form-text text-muted">低于此比例时，不自动提交章节测试</small></div>
                            </div>
                            <div class="yixue-save-row"><button type="button" class="btn btn-outline-primary" id="saveConfig">保存配置</button><span class="yixue-save-hint">当前页面立即应用</span></div>
                        </form>
                    </div>
                </section>
            </div>
            <div class="col-6">
                <section class="card">
                    <div class="card-body">
                        <div class="yixue-card-heading"><span class="yixue-section-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 19V9M12 19V4M19 19v-7"/></svg></span><h2 class="yixue-card-title">学习进度</h2><span class="yixue-card-caption">课程概览</span></div>
                        <div class="yixue-stats"><div class="yixue-stat"><span class="yixue-stat-label">全部章节</span><strong id="totalNum" class="yixue-stat-value">-</strong><span class="yixue-stat-unit">章</span></div><div class="yixue-stat"><span class="yixue-stat-label">剩余章节</span><strong id="leftNum" class="yixue-stat-value accent">-</strong><span class="yixue-stat-unit">章</span></div></div>
                        <div class="yixue-progress-heading"><span>当前任务进度</span><span id="yixueProgressValue">0%</span></div><div class="progress"><div class="progress-bar" id="jdbar" role="progressbar" aria-label="当前任务进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="width:0%">0%</div></div><p class="yixue-progress-note">进度仅供参考，任务状态以下方日志为准。</p>
                    </div>
                </section>
                <section class="card">
                    <div class="card-body"><div class="yixue-card-heading"><span class="yixue-section-icon green" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h4"/></svg></span><h2 class="yixue-card-title">任务日志</h2><span class="yixue-card-caption yixue-live-label">实时记录</span></div></div>
                    <div class="card-body yixue-log-body"><div id="result"><div id="log" role="log" aria-label="任务日志" aria-live="polite" aria-relevant="additions"><span style="color:#737780">正在初始化控制台…</span></div></div></div>
                </section>
            </div>
            <div class="col-12"><div class="card yixue-player-card"><div class="card-body" id="iframe_content"></div></div></div>
        </div>
        <footer class="yixue-footer">易学助手 · 参考答案请人工核对</footer>
    </div>
    <div id="detail" style="display:none"></div>
</body>
</html>`;
            await sleep(100);
            let tkToken = courseAccess.getDisplayToken()
            ctk(tkToken)
            $w.logs = {
                "addLog": function (str, color = "black") {
                    const nowTime = new Date(),
                        nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2),
                        nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2),
                        nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2),
                        logElement = $d.querySelector('#log'),
                        resultElement = $d.querySelector('#result'),
                        span = $d.createElement('span')
                    span.style.color = ({ green: '#21804d', red: '#bd3e45', orange: '#946200', black: '#535b68', '#b7791f': '#946200' })[color] || color
                    span.style.display = "block"
                    span.innerHTML = `[${nowHour}:${nowMin}:${nowSec}] ${str}`
                    logElement.appendChild(span)
                    resultElement.scrollTop = resultElement.scrollHeight;
                },
                "clear": function () {
                    $d.querySelector('#log').innerHTML = '';
                }
            };
            $w.chuangguan = false;
            $d.getElementById('courseName').textContent = $s['coursename'] || '章节学习控制台';
            if (/^((?!chrome|android).)*safari/i.test($w.navigator.userAgent)) {
                $layer("<center>此脚本不支持Safari浏览器<br>请mac/ipad用户<a href='https://www.microsoft.com/zh-cn/edge/download'>安装Microsoft Edge浏览器</a></center>")
            }
            const doVideoButton = $d.querySelector('#doVideo'),
                doDocumentButton = $d.querySelector('#doDocument'),
                doWorkButton = $d.querySelector('#doWork'),
                autoSubmitButton = $d.querySelector('#autoSubmit'),
                saveConfigButton = $d.querySelector('#saveConfig'),
                AIbutton = $d.querySelector('#AI'),
                startButton = $d.querySelector('#start'),
                startNewButton = $d.querySelector('#start_new'),
                doNoMissionButton = $d.querySelector('#doNoMission'),
                ciuuqButton = $d.querySelector('#ciuuq'),
                wicButton = $d.querySelector('#wic'),
                renwuyinqingButton = $d.querySelector('#doRenwu');
            renwuyinqingButton.onclick = function () {
                if ($w.chuangguan) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = renwuyinqingButton.getAttribute('class').includes('light');
                if (s) {
                    $layer('此功能仅支持“任务”列表中的“知识点”任务，如果你需要完成“测验”、“作业”任务，请回到上一界面，点击屏幕右上方的“回到旧版”，直接进入“考试”、“作业”页面作答。')
                }
                GM_setValue('doRenwu', (() => { return s && ((() => { renwuyinqingButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('将会处理任务引擎', 'green'); return true; })()) || ((() => { renwuyinqingButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('将不会处理任务引擎', 'red'); return false; })()) })());
            }
            doVideoButton.onclick = function () {
                if ($w.chuangguan) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = doVideoButton.getAttribute('class').includes('light');
                GM_setValue('doVideo', (() => { return s && ((() => { doVideoButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('将会处理视频任务', 'green'); return true; })()) || ((() => { doVideoButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('将不会处理视频任务', 'red'); return false; })()) })());
            }
            doDocumentButton.onclick = function () {
                if ($w.chuangguan) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = doDocumentButton.getAttribute('class').includes('light');
                GM_setValue('doDocument', (() => { return s && ((() => { doDocumentButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('将会处理文档任务', 'green'); return true; })()) || ((() => { doDocumentButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('将不会处理文档任务', 'red'); return false; })()) })());
            }
            doWorkButton.onclick = function () {
                if ($w.chuangguan && GM_getValue('doWork', false)) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = doWorkButton.getAttribute('class').includes('light');
                GM_setValue('doWork', (() => { return s && ((() => { doWorkButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('将会处理章节测试任务', 'green'); return true; })()) || ((() => { doWorkButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('将不会处理章节测试任务', 'red'); return false; })()) })());
            }
            AIbutton.onclick = function () {
                if (!$w['AIwarning']) {
                    $layer('<center><p>AI答题目前为测试功能</p><p>不保证AI作答的成绩</p><p>只适用于补充题库没查到的题</p><p>建议关闭自动提交，作答完成后人工检查</p><p>脚本问题反馈群：<b>' + $qqgroup + '</b></p></center>');
                    $w['AIwarning'] = true;
                }
                let s = AIbutton.getAttribute('class').includes('light');
                GM_setValue('doAI', (() => { return s && ((() => { AIbutton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('AI答题已开启', 'green'); return true; })()) || ((() => { AIbutton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('AI答题已关闭', 'red'); return false; })()) })());
            }
            autoSubmitButton.onclick = function () {
                if ($w.chuangguan) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = autoSubmitButton.getAttribute('class').includes('light');
                GM_setValue('autoSubmit', (() => { return s && ((() => { autoSubmitButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('正确率超过' + vgqtlv + '%的章节测试将会自动提交', 'green'); return true; })()) || ((() => { autoSubmitButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('章节测试将不会自动提交', 'red'); return false; })()) })());
            }
            doNoMissionButton.onclick = function () {
                if ($w.chuangguan) {
                    $w.logs.addLog('闯关模式下禁止操作', 'red');
                    return;
                }
                let s = doNoMissionButton.getAttribute('class').includes('light');
                GM_setValue('doNoMission', (() => { return s && ((() => { doNoMissionButton.setAttribute('class', 'btn btn-primary'); $w.logs.addLog('将会作答非任务点的章节测试（请刷新页面后继续）', 'green'); return true; })()) || ((() => { doNoMissionButton.setAttribute('class', 'btn btn-light'); $w.logs.addLog('将不会作答非任务点', 'red'); return false; })()) })());
            }
            saveConfigButton.onclick = function () {
                const stkToken = $d.getElementById('tokenInput').value.trim(),
                    sbeisu = Number($d.getElementById('beisuInput').value),
                    svgqtlv = Number($d.getElementById('vgqtlv').value);
                if (!Number.isFinite(sbeisu) || sbeisu < 0.5 || sbeisu > 16) {
                    $layer('倍速必须在0.5-16之间');
                } else if (!Number.isFinite(svgqtlv) || svgqtlv < 0 || svgqtlv > 100) {
                    $layer('正确率必须在0-100之间');
                } else {
                    try { if (stkToken) courseAccess.saveToken(stkToken); }
                    catch (error) { $layer(escapeText(error.message)); return; }
                    beisu = sbeisu;
                    vgqtlv = svgqtlv
                    if (tkToken != stkToken) {
                        $w.logs.clear()
                        $w.logs.addLog('token已变更', 'green')

                    }
                    $layer('配置保存成功，已实时生效')
                    tkToken = courseAccess.getDisplayToken();
                    $d.getElementById('tokenInput').value = tkToken;
                    $d.getElementById('tokenInput').type = getTkToken() ? 'password' : 'text';
                    $w.localStorage.removeItem('shenchanranToken')
                    ctk(tkToken)
                }
            }
            startButton.onclick = function () {
                startButton.setAttribute('class', 'btn btn-light');
                startButton.innerHTML = startNewButton.innerHTML = '任务已启动';
                startButton.onclick = startNewButton.onclick = () => {
                    $layer('如需停止任务，请刷新页面');
                }
                startButton.id = startNewButton.id = "abaaba";
                start();
                $w.logs.addLog('开始查询任务');
            }
            startNewButton.onclick = function () {
                $layer('闯关模式将自动开启所有任务类型<br>建议调低答题正确率<br>遇到无法作答的题型与任务点将会自动终止');
                GM_setValue('doVideo', true);
                GM_setValue('doDocument', true);
                GM_setValue('doWork', true);
                $w.logs.addLog('视频、文档、章节测试任务已开启，如需重置，请刷新页面', 'green');
                startNewButton.setAttribute('class', 'btn btn-light');
                startNewButton.innerHTML = startButton.innerHTML = '闯关任务已启动';
                startButton.onclick = startNewButton.onclick = () => {
                    $layer('如需停止任务，请刷新页面');
                }
                startButton.id = startNewButton.id = "abaaba";
                start();
                $w.chuangguan = true;
                $w.logs.addLog('开始查询任务');
            }
            let safeafew = 0
            ciuuqButton.onclick = function () {
                let now = Math.round(new Date() / 1000)
                if (now - safeafew > 10) {
                    safeafew = now
                    ctk(tkToken)
                } else {
                    $layer("请到题库网站的接口接入创建 API Token；积分和会员额度可在脚本中刷新查看；充值记录请到题库网站查看。");
                }
            }
            wicButton.onclick = function () {
                $layer('<p style="text-indent: 2em;">如果您的课程章节学完一节才能解锁下一节，不能跳过，那么这门课就是闯关模式，必须点击闯关模式按钮才能进行刷课</p>')
            }
            doVideoButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doVideo', 1) + 0]);
            doDocumentButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doDocument', 1) + 0]);
            doWorkButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doWork', 1) + 0]);
            autoSubmitButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('autoSubmit', 1) + 0]);
            AIbutton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doAI', false) + 0]);
            doNoMissionButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doNoMission', 0) + 0]);
            renwuyinqingButton.setAttribute('class', ['btn btn-light', 'btn btn-primary'][GM_getValue('doRenwu', 0) + 0]);
            const toggleButtons = [...$d.querySelectorAll('.yixue-task-grid button, .yixue-quiz-options button')];
            const syncToggleState = button => button.setAttribute(button.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(button.classList.contains('btn-primary')));
            const toggleObserver = new MutationObserver(records => records.forEach(record => syncToggleState(record.target)));
            for (const button of toggleButtons) { syncToggleState(button); toggleObserver.observe(button, { attributes: true, attributeFilter: ['class'] }); }
            ciuuqButton.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ciuuqButton.click(); } };
            $d.getElementById('tokenInput').value = tkToken;
            $d.getElementById('tokenInput').type = getTkToken() ? 'password' : 'text';
            $d.getElementById('beisuInput').value = beisu;
            $d.getElementById('vgqtlv').value = vgqtlv;
            $d.querySelector('#log').innerHTML = ''
            $w.logs.addLog('脚本初始化成功，点击启动按钮开始刷课', 'green');
            if (!getTkToken()) $w.logs.addLog('本地随机 Token 未连接题库，视频、文档可先使用；章节答题将跳过，请填写题库 Token 后再启用。', '#b7791f');
        }
        async function start() {
            //如果用户给单个账号同时刷多门课（每个人都想这么做）就会被清空所有课程的进度，为了防止这种情况发生，添加检测，在刷视频时更新localstorage，触发其他页面的addEventListener
            let multipleTold = false
            $w.addEventListener('storage', (event) => {
                if (!multipleTold && event.key == $uid && event.newValue != courseId) {
                    $layer("每个账号同时只能刷一门课，单个账号同时刷多门课会导致所有刷的课被清空进度！")
                    multipleTold = true
                }
            })
            if ($d.querySelector("#tra").innerHTML != "Trying to do the best") {
                $layer("请关闭网页翻译功能，否则将无法查题<br>（将外语题翻译为中文会0分）")
            }
            while (1) {
                if (!$w.wait) {
                    break;
                }
                await sleep(500);
            }
            let videoV = '2025-0725-1842'
            const classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
                courseId = $s['courseid'] || $s['courseId'],
                cpi = $s['cpi'],
                logs = $w.logs,
                $siteHost = $protocol + $w.location.host,
                audioPlayer = new Audio(audiofile),
                updateBar = (now) => {
                    try {
                        let bar = $d.getElementById("jdbar");
                        now = Math.max(0, Math.min(100, Number(now) || 0));
                        bar.setAttribute("style", "width: " + now + "%; min-width: 2em;");
                        bar.innerHTML = now + "%";
                        bar.setAttribute('aria-valuenow', String(now));
                        $d.getElementById('yixueProgressValue').textContent = now + '%';
                    } catch { }
                }
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: $siteHost + '/ananas/ueditor/ueditor.parse.js?t=' + Math.round(new Date() / 1000),
                    data: 'string',
                    timeout: 3000,
                    onload(res) {
                        if (res.responseText) {
                            const regex = /modules\/video\/index\.html\?v=(\d{4}-\d{4}-\d{4})/m
                            const match = res.responseText.match(regex)
                            if (match) {
                                videoV = match[1]
                                // console.log(videoV)
                            } else {
                                console.log(res.responseText)
                            }
                        }
                    }
                })
            } catch (e) {
                console.log(e)
            }
            let $fid = getCookie('fid') || false
            if (!classId || !courseId) {
                alert('参数不全，请重新进入此页面');
                return;
            }
            const jkdata = GM_getValue('jkdata', {})
            const jk = !!jkdata[classId]
            jk && ($d.getElementById('courseName').innerHTML += '（已结课）')
            audioPlayer.loop = true;
            $w.audioPlayer = audioPlayer;
            $d.addEventListener('visibilitychange', function () {
                var c = 0;
                if ($d.hidden) {
                    audioPlayer.play();
                    var timer = setInterval(function () {
                        if (c) {
                            $d.title = '🙈挂机中';
                            c = 0;
                        } else {
                            $d.title = '🙉挂机中';
                            c = 1;
                        }
                        if (!$d.hidden) {
                            clearInterval(timer);
                            $d.title = '超星刷课工具';
                        }
                    }, 1300);
                } else {
                    audioPlayer.pause();
                }
            })
            $w.need = false;
            let pointList = [],
                pointNum = 0,
                detailUrl = $siteHost + '/mycourse/studentstudycourselist?courseId=' + courseId + '&clazzid=' + classId + '&mooc2=1',
                detailResult = await request({ 'url': detailUrl }),
                getEnc = (attDuration, attDurationEnc, videoFaceCaptureEnc, classId, uid, jobid, objectid, duration, beisu, dtoken, otherInfo, rt, dtype) => {
                    let isdrag = '3',
                        encData = [];
                    for (let playTime = 0; isdrag == '3'; playTime += Math.round(60 * beisu)) {
                        if (playTime >= duration) {
                            playTime = duration;
                            isdrag = '4';
                        }
                        let strEc = `[${classId}][${uid}][${jobid}][${objectid}][${playTime * 1000}][d_yHJ!$pdA~5][${duration * 1000}][0_${duration}]`,
                            enc = md5(strEc),
                            url = '/' + dtoken + '?clazzId=' + classId + '&playingTime=' + playTime + '&duration=' + duration + '&clipTime=0_' + duration + '&objectId=' + objectid + '&otherInfo=' + otherInfo + '&jobid=' + jobid + '&userid=' + uid + '&isdrag=' + isdrag + '&view=pc&enc=' + enc + '&rt=' + rt + '&videoFaceCaptureEnc=' + videoFaceCaptureEnc + '&dtype=' + dtype + '&_t=' + Date.now() + '&attDuration=' + attDuration + '&attDurationEnc=' + attDurationEnc;
                        encData.push([url, isdrag]);
                    }
                    return encData;
                };
            $d.getElementById('detail').innerHTML = detailResult.responseText;
            if (GM_getValue('doRenwu', false)) {
                logs.addLog('开始查询任务引擎');
                let renwuyinqing = `https://mobilelearn.chaoxing.com/v2/apis/active/getData?DB_STRATEGY=DEFAULT&courseId=${courseId}&classId=${classId}`,
                    renwu = await brequest({ 'url': renwuyinqing });
                if (renwu) {
                    try {
                        for (let mission of renwu.data) {
                            try {
                                await sleep(200)
                                let encryTaskUserId = await new Promise((a, b) => {
                                    GM_xmlhttpRequest({
                                        method: "HEAD",
                                        url: `https://task.chaoxing.com/api/v1/middlePageApi/jumpStudyPlanList?taskId=${mission.id}&moocClassId=${classId}`,
                                        onload: function (response) {
                                            const url = new URL(response.finalUrl);
                                            const params = url.searchParams;
                                            const encryTaskUserId = params.get('encryTaskUserId')
                                            a(encryTaskUserId)
                                        },
                                        onerror: function (err) {
                                            a(false)
                                        }
                                    });
                                })
                                if (!encryTaskUserId) {
                                    continue
                                }
                                let messionDetial = await brequest({ 'url': `https://task.chaoxing.com/userStudyPlan/getUserStandard?encryTaskUserId=${encryTaskUserId}` })
                                if (!messionDetial) {
                                    continue
                                }
                                for (let missionDetail of messionDetial.data.userTaskQualifyDTO.planUserBOList) {
                                    try {
                                        if (missionDetail?.plan?.planType == 1 && missionDetail?.finish == 0 && missionDetail?.plan?.externalDataId) {
                                            await sleep(200)
                                            let chapterId = await new Promise((a, b) => {
                                                GM_xmlhttpRequest({
                                                    method: "GET",
                                                    url: `https://mooc2-ans.chaoxing.com/mooc2-ans/coursetopic/topicdetailsmiddle?taskEngine=true&courseid=${courseId}&clazzid=${classId}&cpi=${$s['cpi']}&topicid=${missionDetail.plan.externalDataId}&ut=s`,
                                                    onload: function (response) {
                                                        const url = new URL(response.finalUrl);
                                                        const params = url.searchParams;
                                                        const chapterId = params.get('chapterId')
                                                        a(chapterId)
                                                    },
                                                    onerror: function (err) {
                                                        a(false)
                                                    }
                                                });
                                            })
                                            if (!chapterId) {
                                                continue
                                            }
                                            pointList.push(chapterId)
                                        }
                                    } catch (e) {
                                        console.log(e)
                                    }
                                }
                            } catch (e) {
                                console.log(e)
                            }
                        }
                    } catch (e) {
                        logs.addLog('任务引擎解析错误');
                    }
                    if (pointList.length > 0) {
                        logs.addLog(`共有${pointList.length}个任务引擎知识点任务`);
                    }
                } else {
                    logs.addLog('任务引擎没有任务');
                }
            } else {
                await sleep(1000);
            }
            let divs = [...$d.getElementsByClassName('menulist-menu-title'), ...$d.getElementsByClassName('posCatalog_select'), ...$d.querySelectorAll('h5'), ...$d.querySelectorAll('h4'), ...$d.querySelectorAll('h3'), ...$d.querySelectorAll('h2')]//适配部分学校自建服务器
            for (let i = 0, l = divs.length; i < l; i++) {
                if (!divs[i].id || !divs[i].id.includes('cur') || !divs[i].innerHTML) {//适配部分学校自建服务器，非任务点标签跳过
                    continue
                }
                if (($w.chuangguan && !divs[i].innerHTML.includes('已完成')) || divs[i].innerHTML.includes('jobUnfinishCount')) {
                    pointList.push(divs[i].id.replace('cur', ''))
                }
            }
            if (GM_getValue('doNoMission', false)) {
                logs.addLog('您开启了“非任务点”功能，程序的运行时间可能比平时更长，请耐心等待', 'orange');
                let page = 0
                while (++page) {
                    let noMissionUrl = $siteHost.replace('mooc1.', 'stat2-ans.').replace('mooc.', 'stat2-ans.') + '/stat2/chapter-exam/s/tests/data?clazzid=' + classId + '&courseid=' + courseId + '&ut=s&page=' + page + '&pageSize=200'
                    try {
                        let noMissionResult = await request({ 'url': noMissionUrl }),
                            noMissionJson = JSON.parse(noMissionResult.responseText).data.results;
                        for (let i = 0; i < noMissionJson.length; i++) {
                            let s = noMissionJson[i];
                            if (s.isNonJob && !['已完成', '待批阅', '已保存'].includes(s.statusStr)) {
                                pointList.push(s.chapterId + '');
                            }
                        }
                        if (noMissionJson.length != 0) {
                            await sleep(700)
                            continue
                        } else {
                            break
                        }
                    } catch (e) {
                        console.log(e);
                        break
                    }
                }

            }
            pointList = Array.from(new Set(pointList));
            pointNum = pointList.length;
            $d.getElementById('totalNum').innerHTML = $d.getElementById('leftNum').innerHTML = pointNum;
            if (pointNum < 1) {
                logs.addLog('该课程无可用任务点，请检查，或尝试重新登录（请勿在隐私/无痕页面运行）');
                return;
            }
            logs.addLog('共有' + pointNum + '个任务点');
            if ($w.chuangguan) {
                logs.addLog('闯关模式每个章节等待时间可能会稍长，请耐心等待', 'orange');
            }
            pointNum++;
            function* point() {
                for (let i = 0, l = pointList.length; i < l; i++) {
                    pointNum--;
                    $d.getElementById('leftNum').innerHTML = pointNum;
                    yield pointList[i];
                }
            }
            let getPoint = point()
            loopPoint:
            while (1) {
                let g = getPoint.next();
                if (g.done) {
                    logs.addLog('所有任务已完成（如果您的课程并没有完成，请检查是否为闯关任务点，如果是，请刷新页面并点击“闯关模式”按钮进行刷课）');
                    if ($w.need) {
                        logs.addLog('将进行第二次循环');
                        start();
                    }
                    break;
                }
                let chapterId = g.value, page = 0;
                try {
                    let nowHour = new Date().getHours();
                    if (nowHour < 6 && !$w.told) {
                        $w.told = true;
                        $layer('夜间学习会导致学习进度被清空');
                    }
                } catch (e) { console.log(e); }
                if ($w.chuangguan) {
                    await request({ 'url': `/mooc-ans/mycourse/studentstudyAjax?courseId=${courseId}&clazzid=${classId}&chapterId=${chapterId}` });
                }
                while (1) {
                    try {
                        while (1) {
                            if (!$w.wait) {
                                break;
                            }
                            await sleep(500);
                        }
                        await sleep($n(1, 4));
                        let cardUrl = '/knowledge/cards?clazzid=' + classId + '&courseid=' + courseId + '&knowledgeid=' + chapterId + '&num=' + page + '&ut=s&cpi=' + cpi + '&v=20160407-1',
                            Referer = $siteHost + '/mycourse/studentstudy?chapterId=' + chapterId + '&courseId=' + courseId + '&clazzid=' + classId + '&cpi=' + cpi + '&enc=' + randomString() + '&mooc2=1&openc=' + randomString();
                        cardResult = await request({
                            'headers': {
                                'Referer': Referer
                            },
                            'url': cardUrl
                        });
                        page++;
                        if (!cardResult) {
                            continue loopPoint;
                        }
                        if (cardResult.responseText.includes('mArg = $mArg;')) {
                            await sleep(1);
                            continue loopPoint;
                        }
                        let mArgs = cardResult.responseText.match(/mArg([\x00-\x1F\x7F]|\s)*=([\x00-\x1F\x7F]|\s)*(.+);([\x00-\x1F\x7F]|\s)*}([\x00-\x1F\x7F]|\s)*catch\(e\)/);
                        if (!mArgs) {
                            if ($w.chuangguan) {
                                logs.addLog('无法获取章节内容，请检查上一章节是否已完成，是否有未提交的章节测试', 'red');
                            } else {
                                logs.addLog('无法获取章节内容，章节可能未开放', 'red');
                            }
                            continue loopPoint;
                        }
                        let mArg = mArgs[0].replace(/mArg([\x00-\x1F\x7F]|\s)*=([\x00-\x1F\x7F]|\s)*/, '').replace(/;([\x00-\x1F\x7F]|\s)*}([\x00-\x1F\x7F]|\s)*catch\(e\)/, ''),
                            mArgJson = JSON.parse(mArg),
                            reportUrl = mArgJson.defaults.reportUrl;
                        $fid = $fid || mArgJson.defaults['fid'] || '666'
                        for (let i = 0, l = mArgJson.attachments.length; i < l; i++) {
                            try {
                                while (1) {
                                    if (!$w.wait) {
                                        break;
                                    }
                                    await sleep(500);
                                }
                                let jobData = mArgJson.attachments[i];
                                if (!jobData.job) {
                                    if (jobData.type == 'workid' && GM_getValue('doNoMission', false)) {
                                        console.log('有非任务点');
                                    } else {
                                        continue;
                                    }
                                } try {
                                    if (jobData.property.module == 'insertbook') {
                                        jobData.type = 'book';
                                        jobData.property.name = jobData.property.bookname;
                                    }
                                } catch (e) { }
                                let nowBar, barr;
                                loopType:
                                switch (jobData.type) {
                                    case 'video':
                                        if (!GM_getValue('doVideo', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.name, 'red');
                                            break;
                                        }
                                        let videoFaceCaptureEnc = jobData.videoFaceCaptureEnc || '',
                                            attDurationEnc = jobData.attDurationEnc || '',
                                            attDuration = jobData.attDuration || '0',
                                            statusUrl = '/ananas/status/' + jobData.property.objectid + '?k=' +
                                                $fid + '&flag=normal&_dc=' + String(Math.round(new Date())),
                                            videoInfoResult = await request({
                                                'headers': {
                                                    'Referer': $protocol + $w.location.host + '/ananas/modules/video/index.html?v=' + videoV
                                                },
                                                'url': statusUrl
                                            }),
                                            doubleSpeed = jobData.property.doublespeed || 0,
                                            fastforward = jobData.property.fastforward || "false",
                                            allowBs = false
                                        if (!videoInfoResult) {
                                            logs.addLog('获取视频信息失败，跳过此任务：' + jobData.property.name, 'red');
                                            break loopType;
                                        }
                                        if (doubleSpeed == 1 || fastforward === "false") {
                                            allowBs = true
                                        }
                                        let videojs_id = String(parseInt($n(1000, 9999))),
                                            videoInfo = JSON.parse(videoInfoResult.responseText);
                                        if (videoInfo.status != "success") {
                                            logs.addLog('视频还没有准备好，跳过此任务：' + jobData.property.name, 'red');
                                            break loopType;
                                        }
                                        if (!videoInfo.duration) {//老师上传的视频长度小于1秒，就会出现此问题
                                            logs.addLog('异常视频，无法完成：' + jobData.property.name, 'red');
                                            break loopType;
                                        }
                                        logs.addLog('开始刷视频：' + jobData.property.name)
                                        let dtype = 'Video'
                                        if (jobData.property.module.includes('audio') || jobData.property.module.includes('voice')) {
                                            dtype = 'Audio'
                                        }
                                        let videoDatas = getEnc(attDuration, attDurationEnc, videoFaceCaptureEnc, classId, $uid, jobData.jobid, videoInfo.objectid, videoInfo.duration, beisu, videoInfo.dtoken, jobData.otherInfo, jobData.property.rt || '0.9', dtype),
                                            errTimes = 0,
                                            hasErr = false,
                                            min = 0,
                                            totalMin = parseFloat((videoInfo.duration / 60).toFixed(2));
                                        if (是否启用后台服务器 == '1') {
                                            let pushData = {
                                                'uid': $uid,
                                                'name': jobData.property.name,
                                                'jobId': jobData.jobid,
                                                'list': []
                                            };
                                            for (let i = 0, l = videoDatas.length; i < l; i++) {
                                                let url = videoDatas[i][0],
                                                    sendUrl = reportUrl + url;
                                                pushData.list.push(sendUrl);
                                            }
                                            let result = await brequest(
                                                {
                                                    'url': 'http://' + 服务器地址 + ':' + 端口 + '/add',
                                                    'method': 'post',
                                                    'data': JSON.stringify(pushData),
                                                    'headers': {
                                                        "Content-Type": "application/json"
                                                    }
                                                }
                                            );
                                            if (result.status == '1') {
                                                logs.addLog('已提交后台任务：' + jobData.property.name, 'blue');
                                                await sleep(3000);
                                                break loopType;
                                            } else {
                                                logs.addLog('后台服务连接失败，请检查是否启动' + jobData.property.name, 'blue');
                                            }
                                        }
                                        updateBar(0);
                                        nowBar = 0;
                                        barr = setInterval(function () {
                                            nowBar += 10;
                                            updateBar(Math.round(nowBar / totalMin * beisu / 0.6));
                                        }, 10000);
                                        $d.cookie = 'videojs_id=' + videojs_id + ';path=/';
                                        for (let i = 0, l = videoDatas.length; i < l; i++) {
                                            if (!hasErr) {
                                                errTimes = 0
                                            }
                                            while (1) {
                                                if (!$w.wait) {
                                                    break;
                                                }
                                                await sleep(500);
                                            }
                                            let url = videoDatas[i][0],
                                                isdrag = videoDatas[i][1],
                                                sendUrl = reportUrl + url;
                                            watchResult = await request({
                                                headers: {
                                                    'Referer': $protocol + $w.location.host + '/ananas/modules/video/index.html?v=' + videoV,
                                                    'Sec-Fetch-Site': 'same-origin'
                                                },
                                                url: sendUrl
                                            })
                                            localStorage.setItem($uid, courseId)
                                            if (!watchResult) {
                                                if (errTimes > 2) {
                                                    logs.addLog('上传视频进度失败超过三次，跳过此任务：' + jobData.property.name, 'red');
                                                    clearInterval(barr);
                                                    break loopType;
                                                }
                                                errTimes++;
                                                logs.addLog('上传视频进度失败，将再次重试' + String(3 - errTimes) + '次', 'red')
                                                if (!hasErr) {
                                                    i > 0 && i--
                                                }
                                                await sleep(3000)
                                                hasErr = true
                                                continue
                                            } else if (watchResult.status != '200') {
                                                if (jk) {
                                                    logs.addLog('该课程已结课，视频任务无法完成', 'red');
                                                    clearInterval(barr);
                                                    break loopType;
                                                }
                                                if (errTimes > 2) {
                                                    logs.addLog('上传视频进度失败超过三次，跳过此任务：' + jobData.property.name, 'red');
                                                    clearInterval(barr);
                                                    break loopType;
                                                }
                                                errTimes++;
                                                logs.addLog('超星返回错误信息，将再次重试' + String(3 - errTimes) + '次', 'red')
                                                if (!hasErr) {
                                                    i > 0 && i--
                                                }
                                                await sleep(3000)
                                                hasErr = true
                                                continue
                                            }
                                            hasErr = false
                                            let watchResultJson = JSON.parse(watchResult.responseText);
                                            if (watchResultJson.isPassed) {
                                                logs.addLog('视频任务完成：' + jobData.property.name, 'green');
                                                clearInterval(barr);
                                                break loopType;
                                            } else if (isdrag == '4') {
                                                logs.addLog('视频已观看完毕，但视频任务未完成：' + jobData.property.name, 'red');
                                                clearInterval(barr);
                                                break loopType;
                                            } else {
                                                if (beisu > 1) {
                                                    if (allowBs) {
                                                        if (beisu > 2) {
                                                            logs.addLog('此视频允许倍速播放，但倍速大于2，任务可能无法完成，当前倍速为' + String(beisu) + '倍', 'red');
                                                        }
                                                    } else {
                                                        logs.addLog('此视频不允许倍速播放，开启倍速会被清空进度或无法完成，当前倍速为' + String(beisu) + '倍', 'red');
                                                    }
                                                }
                                                let left = Math.ceil(totalMin / beisu - min)
                                                if (left < -1) {
                                                    logs.addLog('视频已观看完毕，但视频任务未完成：' + jobData.property.name, 'red');
                                                    clearInterval(barr);
                                                    break loopType;
                                                }
                                                logs.addLog('视频已观看' + String(Math.floor(min * beisu)) + '分钟，剩余大约' + left + '分钟' + (beisu > 1 ? '，倍速：' + String(beisu) + '倍' : ''));
                                            }
                                            min++;
                                            try {
                                                let today = new Date(),
                                                    todayStr = today.getFullYear() + 'd' + today.getMonth() + 'd' + today.getDate(),
                                                    timelong = GM_getValue('timelong', {});
                                                timelong.$uid = undefined;
                                                if (timelong['u' + $uid] == undefined || timelong['u' + $uid].today != todayStr) {
                                                    timelong['u' + $uid] = {
                                                        'time': 0,
                                                        'today': todayStr,
                                                        'studyDetail': {}
                                                    };
                                                } else {
                                                    timelong['u' + $uid].time++;
                                                }
                                                timelong['u' + $uid].studyDetail['c' + courseId] = Math.round(new Date() / 1000)
                                                GM_setValue('timelong', timelong);
                                                if (timelong['u' + $uid].time / 60 >= 18) {
                                                    if (!$w.timeTold) {
                                                        $layer('您今日学习时间过长，继续学习会清除进度');
                                                    }
                                                    $w.timeTold = true;
                                                }

                                            } catch (e) { console.log(e); }
                                            await sleep(60000);
                                        }
                                    case 'document':
                                        if (!GM_getValue('doDocument', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.name, 'red');
                                            break;
                                        }
                                        logs.addLog('开始文档任务：' + jobData.property.name);
                                        await sleep(5000);
                                        let doDocumentResult = await request({
                                            'url': '/ananas/job/document?jobid=' + jobData.jobid +
                                                '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' + classId + '&jtoken=' + jobData.jtoken
                                        });
                                        if (!doDocumentResult) {
                                            logs.addLog('阅读文档失败：' + jobData.property.name, 'red');
                                            break;
                                        }
                                        try {
                                            let doDocumentJson = JSON.parse(doDocumentResult.responseText);
                                            if (doDocumentJson.status) {
                                                logs.addLog('文档任务完成：' + jobData.property.name, 'green');
                                                break;
                                            } else {
                                                if (jk) {
                                                    logs.addLog('该课程已结课，文档任务无法完成', 'red');
                                                } else {
                                                    logs.addLog('文档任务失败：' + jobData.property.name, 'red');
                                                }
                                                break;
                                            }
                                        } catch (e) {
                                            logs.addLog('解析文档内容失败：' + jobData.property.name, 'red');
                                            break;
                                        }
                                    case 'workid':
                                        if (!getTkToken()) {
                                            logs.addLog('题库未连接，跳过章节答题：' + escapeText(jobData.property.title || '章节测试'), '#b7791f');
                                            break;
                                        }
                                        if (!GM_getValue('doWork', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        let workid, jobid, noMission, workPageUrl;
                                        try {
                                            workid = jobData.jobid.replace('work-', '');
                                        } catch { }
                                        if (!workid) {
                                            if (GM_getValue('doNoMission', false)) {
                                                noMission = true;
                                            }
                                            try {
                                                workid = jobData.property.workid;
                                            } catch { }
                                        }
                                        if (!workid) {
                                            try {
                                                workid = jobData.property._jobid.replace('work-', '');
                                            } catch { }
                                        }
                                        try {
                                            jobid = jobData.jobid;
                                        } catch { }
                                        if (!jobid) {
                                            try {
                                                jobid = jobData.property._jobid;
                                            } catch { }
                                        }
                                        if (!jobid) {
                                            try {
                                                jobid = 'work-' + jobData.property.workid;
                                            } catch { }
                                        }
                                        if (noMission) {
                                            workPageUrl = '/mooc-ans/work/phone/work?workId=' + workid + '&courseId=' + courseId + '&clazzId=' + classId + '&knowledgeId=' + chapterId + '&jobId=&enc=' + jobData.enc;
                                        } else {
                                            workPageUrl = '/work/phone/work?workId=' + workid + '&courseId=' + courseId + '&clazzId=' + classId + '&knowledgeId=' + chapterId + '&jobId=' + jobid + '&enc=' + jobData.enc;
                                        }
                                        let workPageResult = await request({
                                            'url': workPageUrl,
                                            'headers': {
                                                'User-Agent': 'Mozilla/5.0 (Linux; Android 11.0.1; ASUS_I005DA Build/LMY48Z; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.100 Mobile Safari/537.36 com.chaoxing.mobile/ChaoXingStudy_6_3.2_android_phone_205_1 (ASUS_I005DA; Android 11.0.1; zh_CN)_-351523749 Edg/122.0.0.0'
                                            },
                                        })
                                        if (!workPageResult.responseText.includes('submitData()')) {
                                            console.log('跳过已答测试')
                                            break
                                        }
                                        if (!(workPageResult && workPageResult.status == 200 && workPageResult.responseText.includes('<title>章节</title>'))) {
                                            logs.addLog('获取章节测试失败：' + jobData.property.title, 'red');
                                            break
                                        }
                                        const originalSetAttribute = HTMLElement.prototype.setAttribute;
                                        // 部分校园网会劫持setAttribute方法，恢复初始
                                        HTMLElement.prototype.setAttribute = function (name, value) {
                                            return originalSetAttribute.call(this, name, value);
                                        }
                                        let iframe = $d.createElement('iframe');
                                        iframe.setAttribute('translate', 'no')
                                        iframe.setAttribute('frameborder', '0')
                                        iframe.setAttribute('scrolling', 'auto')
                                        iframe.setAttribute('style', 'width: 100%;height: auto;')
                                        let srcdoc = workPageResult.responseText.replaceAll(/alert\(/ig, 'console.log(').replaceAll(/confirm\((.*?)\)/ig, 'true').replaceAll('ua = "pc"', 'ua = "app"').replaceAll(/<br>/ig, '').replaceAll(/<\/br>/ig, '')
                                        iframe.setAttribute('srcdoc', srcdoc)
                                        let iframe_content = $d.querySelector('#iframe_content')
                                        iframe_content.innerHTML = ''
                                        iframe_content.appendChild(iframe)
                                        await checkIframe(iframe)
                                        let $p = iframe.contentDocument,
                                            $pw = iframe.contentWindow,
                                            wIdE = $p.getElementById('oldWorkId') || $p.getElementById('workLibraryId');
                                        if (!wIdE) {
                                            logs.addLog('获取章节测试错误：' + jobData.property.title, 'red');
                                            break;
                                        }

                                        let questionList = [],
                                            questionsElement = $p.getElementsByClassName('Py-mian1'),
                                            questionNum = questionsElement.length,
                                            abledQuestionNum = 0,
                                            checkedQuestionNum = 0,
                                            wid = wIdE.value,
                                            optionElements = $p.getElementsByClassName('clearfix'),
                                            lis = $p.getElementsByTagName('li'),
                                            optionLis = [],
                                            answerInputs = $p.getElementsByClassName('answerInput');
                                        if (!questionsElement.length) {
                                            logs.addLog('无题：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        for (let i = 0, l = optionElements.length; i < l; i++) {
                                            try {
                                                optionElements[i].setAttribute('class', 'clearfix');
                                            } catch (e) { console.log(e); }
                                        }
                                        for (let i = 0, l = lis.length; i < l; i++) {
                                            try {
                                                if (lis[i].getAttribute('id-param')) {
                                                    optionLis.push(lis[i]);
                                                }
                                            } catch (e) { console.log(e); }
                                        }
                                        for (let i = 0, l = answerInputs.length; i < l; i++) {
                                            try {
                                                answerInputs[i].value = '';
                                            } catch (e) { console.log(e); }
                                        }
                                        for (let i = 0; i < questionNum; i++) {
                                            try {
                                                let questionElement = questionsElement[i],
                                                    inputElements = questionElement.querySelectorAll('input'),
                                                    questionId = '0',
                                                    typeN = '666',
                                                    question = questionElement.getElementsByClassName('Py-m1-title fs16')[0].innerHTML,
                                                    tiankongsize = 0,
                                                    tiankongNew = false//是否为新版填空
                                                question = handleImgs(question).replace(/(<([^>]+)>)/ig, '').replace(/[0-9]{1,3}\.\[(.*?)\]/ig, '').replaceAll('\n', '').replace(/^([\x00-\x1F\x7F]|\s)+/ig, '').replace(/([\x00-\x1F\x7F]|\s)+$/ig, '');
                                                for (let z = 0, k = inputElements.length; z < k; z++) {
                                                    try {
                                                        let id = inputElements[z].id
                                                        let name = inputElements[z].getAttribute('name')
                                                        if (name && name.includes('tiankongsize') && inputElements[z].value) {
                                                            tiankongsize = inputElements[z].value
                                                        }
                                                        if (id.includes('answer')) {
                                                            if (id.includes('answertype')) {
                                                                typeN = inputElements[z].value
                                                                if (/^answertype\d+/.test(id)) {
                                                                    questionId = id.replace('answertype', 'answer')
                                                                }
                                                            } else {
                                                                if (/answer(s)?\d+/.test(id)) {
                                                                    questionId = id.replace('answers', 'answer')
                                                                }
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.log(e);
                                                        continue;
                                                    }
                                                }
                                                if (questionId == '0' || question == '') {
                                                    console.log('无法获取题目信息')
                                                    continue;
                                                }
                                                if (!['0', '1', '2', '3'].includes(typeN)) {
                                                    console.log('不是可作答题型')
                                                    continue;
                                                }
                                                let type = {
                                                    '0': '单选题',
                                                    '1': '多选题',
                                                    '2': '填空题',
                                                    '3': '判断题'
                                                }[typeN];
                                                let optionList = {
                                                    length: 0
                                                }
                                                let inputList = []
                                                if (['单选题', '多选题'].includes(type)) {
                                                    let answersElements = questionElement.getElementsByClassName('answerList')[0].getElementsByTagName(
                                                        'li');
                                                    for (let x = 0, j = answersElements.length; x < j; x++) {
                                                        let optionE = answersElements[x],
                                                            optionEm = optionE.querySelector('em'),
                                                            optionTextE = beforeTrim(optionE.innerHTML.replace(/(^([\x00-\x1F\x7F]|\s)*)|(([\x00-\x1F\x7F]|\s)*$)/g, "")),
                                                            optionText = optionTextE.slice(1).replace(/(^([\x00-\x1F\x7F]|\s)*)|(([\x00-\x1F\x7F]|\s)*$)/g, ""),
                                                            optionValue = optionEm ? optionEm.getAttribute('id-param') : optionTextE.slice(0, 1);
                                                        if (optionText == '') {
                                                            break;
                                                        }
                                                        optionList[optionText] = optionValue
                                                        optionList.length++
                                                    }
                                                    if (answersElements.length != optionList.length) {
                                                        continue
                                                    }
                                                } else if (type == '判断题') {
                                                    optionList = { '对': 'A', '错': 'B' }
                                                } else {//填空题
                                                    inputList = questionElement.querySelectorAll('input.answerInput')
                                                    if (!inputList || inputList.length < 1) {//旧版填空答题
                                                        tiankongNew = true
                                                        inputList = []
                                                        if (tiankongsize == 0) {//旧版无法找到，并且新版也无
                                                            logs.addLog('无法找到填空题信息：', 'red');
                                                            continue
                                                        } else {
                                                            let iframes = questionElement.querySelectorAll('iframe[id^="ueditor_"]');
                                                            for (let iframe of iframes) {
                                                                if (iframe) {
                                                                    let d = iframe.contentDocument || iframe.contentWindow.document
                                                                    if (d) {
                                                                        let p = d.querySelector('p')
                                                                        if (p) {
                                                                            inputList.push(p)
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    if (inputList.lengh == 0 || inputList.length != tiankongsize) {
                                                        console.log(inputList)
                                                        console.log(tiankongsize)
                                                        logs.addLog('填空选项不匹配：', 'red');
                                                        continue
                                                    }
                                                }

                                                questionList.push({
                                                    question,
                                                    type,
                                                    'questionid': questionId,
                                                    'options': optionList,
                                                    inputList,
                                                    tiankongsize,
                                                    tiankongNew
                                                });
                                                abledQuestionNum++;
                                            } catch (e) { console.log(e); }
                                        }
                                        if (!abledQuestionNum) {
                                            logs.addLog('该章节测试无可用题目：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        logs.addLog('开始做章节测试：' + jobData.property.title);
                                        let sleeptime = $n(2, 4);
                                        for (let i = 0, l = questionList.length; i < l; i++) {
                                            try {
                                                await sleep(sleeptime);
                                                let questionArray = questionList[i],
                                                    inputs = [...questionArray.inputList],
                                                    tm = questionArray.question,
                                                    type = questionArray.type,
                                                    options = questionArray.options,
                                                    optiont = {},
                                                    optionsList = Object.keys(options).filter(e => {
                                                        return e !== 'length';
                                                    }),
                                                    optionsJsonText = encodeURIComponent(JSON.stringify(optionsList)),
                                                    panduans = ['正确', '对', '错误', '错'],
                                                    xbp = false,
                                                    types;
                                                for (let e in options) {
                                                    optiont[beforeTrim(e).replaceAll(/([\x00-\x1F\x7F]|\s)*/g, '')] = options[e];
                                                }
                                                options = optiont;
                                                if (type != '判断题' && optionsList.length == 2 && panduans.includes(optionsList[0]) && panduans.includes(optionsList[1])) {
                                                    // 某些判断题会以选择题的形式出现，虽然在页面上题型确实是选择题，但经过实测，在题库内的数据通常是判断题
                                                    xbp = true
                                                    types = '3'
                                                } else {
                                                    types = {
                                                        '单选题': '0',
                                                        '多选题': '1',
                                                        '填空题': '2',
                                                        '判断题': '3'
                                                    }[type]
                                                }
                                                let ai = '0'
                                                if (GM_getValue('doAI', false)) {
                                                    ai = '1'
                                                }
                                                let answernum = inputs.length || '',
                                                    questionid = questionArray.questionid,
                                                    tkReady = false,
                                                    starttime = Date.now(),
                                                    tkResultJson = await queryQuestion({ title: decodeHtmlEntities(tm), options: optionsList, type: types, use_ai: ai === '1' });
                                                sleeptime = $n(2, 4) - Date.now() + starttime;
                                                sleeptime <= 0 && (sleeptime = 100)
                                                if (!tkResultJson) {
                                                    logs.addLog('未找到答案：' + tm);
                                                    continue;
                                                }
                                                try {
                                                    refreshQueryUsage();
                                                    if (tkResultJson.code != 1) {
                                                        if (tkResultJson.msg) {
                                                            logs.addLog('查题失败：' + tkResultJson.msg, 'red');
                                                            continue
                                                        }
                                                    } else if (tkResultJson.data) {
                                                        tkReady = tkResultJson.data;
                                                    }

                                                } catch (e) {
                                                    console.log(e);
                                                }
                                                if (!tkReady) {
                                                    logs.addLog('无答案：' + tm);
                                                    continue;
                                                }
                                                let tkRightAnswer = trimAnswer(tkReady).replaceAll(/([\x00-\x1F\x7F]|\s)/g, '')
                                                if (xbp) {
                                                    let panDuanResult = panDuan(tkRightAnswer)
                                                    tkRightAnswer = optionsList[1]
                                                    if (panDuanResult == 'r') {
                                                        tkRightAnswer = optionsList[0]
                                                    }
                                                }
                                                if (type == '判断题') {
                                                    tkRightAnswer = tkRightAnswer.replaceAll(/([\x00-\x1F\x7F]|\s)/g, '');
                                                    pdresult = panDuan(tkRightAnswer);
                                                    if (pdresult === 'r') {
                                                        tkRightAnswer = '对';
                                                    } else if (pdresult === 'w') {
                                                        tkRightAnswer = '错';
                                                    }
                                                }
                                                let answerMsg = tm + '：' + tkRightAnswer
                                                if (tkResultJson.msg == 'ai') {
                                                    answerMsg = '[AI] ' + answerMsg
                                                }
                                                logs.addLog(escapeText(answerMsg));
                                                let hasAnswer = false;
                                                if (type != '填空题') {
                                                    for (let o in options) {
                                                        if (o == 'length') {
                                                            continue;
                                                        }
                                                        let oo = o
                                                        o = trim(o).replaceAll(/([\x00-\x1F\x7F]|\s)+/ig, '');
                                                        function fuckMe() {
                                                            for (let j = 0, a = optionLis.length; j < a; j++) {
                                                                let nowO = optionLis[j];
                                                                if (nowO.getAttribute('id-param') == questionid.replace('answer', '').replace('s', '')) {
                                                                    let nowEm = nowO.querySelector('em');
                                                                    if (nowEm) {
                                                                        if (type == '判断题' && nowEm.innerHTML == options[oo]) {
                                                                            $p.getElementById(questionid).value = { 'A': 'true', 'B': 'false' }[options[o]];
                                                                            nowO.setAttribute('class', 'clearfix cur');
                                                                            hasAnswer = true;
                                                                        } else if (nowEm.getAttribute('id-param') == options[oo]) {
                                                                            if (type == '单选题') {
                                                                                $p.getElementById(questionid).value = options[oo];
                                                                            } else {
                                                                                let ovalue = $p.getElementsByName(questionid)[0].value;
                                                                                ovalue += options[oo];
                                                                                $p.getElementsByName(questionid)[0].value = $ascii(ovalue);
                                                                            }
                                                                            nowO.setAttribute('class', 'clearfix cur');
                                                                            hasAnswer = true;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        if (o == tkRightAnswer) {
                                                            fuckMe()
                                                            if (type == '单选题') {
                                                                break//1年前写的15层if，再加一层function来修复出现的新问题，单选题的选项完全匹配时停止后续判断，防止选项过于判断包含导致答案正确但是选择错误
                                                            }
                                                        } else if (o.includes(tkRightAnswer) || tkRightAnswer.includes(o)) {
                                                            fuckMe()
                                                        }
                                                    }
                                                } else {
                                                    if (!tkRightAnswer.includes('<img')) {
                                                        let answers = tkRightAnswer.split('#!#')
                                                        if (answers.length == inputs.length) {
                                                            answers.forEach((a, b) => {
                                                                if (questionArray.tiankongNew) {//新版
                                                                    inputs[b].innerText = a
                                                                } else {
                                                                    inputs[b].value = a
                                                                }
                                                            })
                                                            hasAnswer = true;
                                                        }
                                                    }
                                                }
                                                hasAnswer && (checkedQuestionNum++);
                                            } catch (e) { console.log(e); }
                                        }
                                        let score = checkedQuestionNum / questionNum * 100;
                                        await sleep($n(2, 4));
                                        if (score >= vgqtlv && !!GM_getValue('autoSubmit', 1)) {
                                            logs.addLog('正确率达标，自动提交');
                                            $pw.toadd();
                                            $pw.submitAction();
                                        } else if (score > 0) {
                                            logs.addLog(['未设置自动提交', '正确率不达标：' + String(Math.floor(score)) + '分'][GM_getValue('autoSubmit', 1) + 0] + '，自动保存');
                                            $pw.noSubmit();
                                        } else {
                                            logs.addLog('一道题都没查出来，跳过');
                                        }
                                        await sleep($n(2, 4));
                                        break;
                                    case 'book':
                                        if (!GM_getValue('doDocument', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.name, 'red');
                                            break;
                                        }
                                        logs.addLog('开始图书任务：' + jobData.property.name);
                                        await sleep(5000);
                                        let bookResult = await request({
                                            'url': '/ananas/job?jobid=' + jobData.jobid +
                                                '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' + classId + '&jtoken=' + jobData.jtoken
                                        });
                                        if (!bookResult) {
                                            logs.addLog('阅读图书失败：' + jobData.property.name, 'red');
                                            break;
                                        }
                                        try {
                                            let doDocumentJson = JSON.parse(bookResult.responseText);
                                            if (doDocumentJson.status) {
                                                logs.addLog('图书任务完成：' + jobData.property.name, 'green');
                                                break;
                                            } else {
                                                logs.addLog('图书任务失败：' + jobData.property.name, 'red');
                                                break;
                                            }
                                        } catch (e) {
                                            logs.addLog('解析图书内容失败：' + jobData.property.name, 'red');
                                            break;
                                        }
                                    case 'hyperlink':
                                        if (!GM_getValue('doDocument', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        logs.addLog('开始链接任务：' + jobData.property.title);
                                        await sleep(2000);
                                        let linkResult = await request({
                                            'url': '/ananas/job/hyperlink?jobid=' + jobData.jobid +
                                                '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' + classId + '&jtoken=' + jobData.jtoken
                                        });
                                        if (!linkResult) {
                                            logs.addLog('阅读链接失败：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        try {
                                            let doLinkJson = JSON.parse(linkResult.responseText);
                                            if (doLinkJson.status) {
                                                logs.addLog('链接任务完成：' + jobData.property.title, 'green');
                                                break;
                                            } else {
                                                logs.addLog('链接任务失败：' + jobData.property.title, 'red');
                                                break;
                                            }
                                        } catch (e) {
                                            logs.addLog('解析链接内容失败：' + jobData.property.title, 'red');
                                            break;
                                        }
                                    case 'live':
                                        if (!GM_getValue('doVideo', true)) {
                                            logs.addLog('跳过直播任务：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        logs.addLog('开始直播任务：' + jobData.property.title)
                                        let oldLiveId = liveId = jobData.property['liveId']
                                        if (liveId.toString().length < 16) {
                                            let newIdResult = await request({
                                                'url': '/ananas/live/getnewliveid?oliveid=' + liveId,
                                            })
                                            if (!newIdResult) {
                                                logs.addLog('获取直播信息失败，请联系作者反馈', 'red');
                                                break;
                                            }
                                            newIdResult = JSON.parse(newIdResult.responseText.replaceAll('\'', '"'));
                                            if (!newIdResult.newLiveId) {
                                                logs.addLog('获取直播信息失败，请联系作者反馈', 'red');
                                                break;
                                            }
                                            liveId = newIdResult.newLiveId
                                        }
                                        let liveUrl = $protocol + $w.location.host + '/ananas/live/liveinfo?liveid=' + liveId + '&userid=' + $uid + '&clazzid=' + classId + '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&jobid=' + jobData.jobid + '&ut=s',
                                            liveInfo = await request({
                                                'url': liveUrl
                                            }),
                                            rt = jobData.property.rt ? parseFloat(jobData.property['rt']) : 0.9;
                                        if (!liveInfo) {
                                            logs.addLog('获取直播信息失败，请联系作者反馈', 'red');
                                            break;
                                        }
                                        liveInfo = JSON.parse(liveInfo.responseText);
                                        let liveStatus = liveInfo['temp']['data']['liveStatus'],
                                            ifReview = liveInfo['temp']['data']['ifReview'];
                                        if (liveStatus == 4 && ifReview == 1) {
                                            logs.addLog('直播不允许回看，无法完成', 'orange');
                                            break;
                                        }
                                        let href = $protocol + "zhibo.chaoxing.com/" + liveId + "?courseId=" + courseId + "&classId=" + classId + "&knowledgeId=" + chapterId
                                            + "&jobId=" + jobData.jobid + "&userId=" + $uid + "&rt=" + rt + "&livesetenc=" + jobData.liveSetEnc + "&isjob=1&watchingInCourse=1&customPara1="
                                            + classId + "_" + courseId + "&customPara2=" + jobData.authEnc + "&jobfs=0&isNotDrag=" + jobData.isNotDrag + "&livedragenc=" + jobData.liveDragEnc + "&sw=1&ds=0&liveswdsenc=" + jobData.liveSwDsEnc
                                        let liveResult = await request({
                                            'url': href
                                        });
                                        if (!liveResult) {
                                            logs.addLog('获取直播详情失败，请联系作者反馈', 'orange');
                                            break;
                                        }
                                        let jiba = 1
                                        if (!liveResult.responseText.includes('lineVideo =')) {//旧版直播
                                            let duration = liveInfo['temp']['data']['duration'],
                                                timeLongValue = liveInfo['temp']['data']['timeLongValue'] * 60,
                                                liveStatus = liveInfo['temp']['data']['liveStatus']
                                            if (rt <= 0.9) {
                                                duration = duration * (rt + 0.1);
                                            }
                                            if (timeLongValue > duration) {
                                                logs.addLog('直播时长已达标，无需继续观看：' + jobData['property']['title'])
                                                break;
                                            }
                                            else {
                                                duration -= timeLongValue;
                                            }
                                            let isStart = '0',
                                                playTime = 0,
                                                lreportUrl, reportR;
                                            updateBar(0);
                                            nowBar = 0;
                                            barr = setInterval(function () {
                                                nowBar += 10;
                                                updateBar(Math.round(nowBar / duration * 100));
                                            }, 10000);
                                            while (playTime <= duration) {
                                                lreportUrl = $protocol + 'zhibo.chaoxing.com/saveTimePc?streamName=' + jobData['property']['streamName'] + '&vdoid=' + jobData['property']['vdoid'] + '&userId=' + $uid + '&isStart=' + isStart + '&t=' + Date.now() + '&courseId=' + courseId;
                                                isStart = '1';
                                                reportR = await request({
                                                    'url': lreportUrl
                                                });
                                                if (reportR.responseText.includes('success')) {
                                                    if (jiba) {
                                                        logs.addLog(`${jobData.property.title}：已观看${(playTime / 60).toFixed(1)}分钟`)
                                                        jiba = 0
                                                    } else {
                                                        jiba = 1
                                                    }
                                                } else {
                                                    logs.addLog('观看进度上报失败：' + jobData.property.title, 'red')
                                                }
                                                if (playTime == duration) {
                                                    clearInterval(barr);
                                                    logs.addLog('直播回放完成：' + jobData.property.title)
                                                    break
                                                }
                                                playTime += 30
                                                if (playTime > duration) {
                                                    playTime = duration;
                                                }
                                                await sleep(30000);
                                            }
                                            break;
                                        } else {
                                            let lineinfoREGX = liveResult.responseText.match(/var\s*lineVideo\s*=\s+(.*?});\s*var/);
                                            let videoPlayStartTimeREGX = liveResult.responseText.match(/var\s*videoPlayStartTime\s*=\s*([0-9]{1,4});/);
                                            let viewerUrlREGX = liveResult.responseText.match(/var\s*viewerUrl\s*=\s*('|")(.*?)('|");/);
                                            let uInfoREGX = liveResult.responseText.match(/var\s*uInfo\s*=\s*('|")([0-9a-z]{32})('|");/);
                                            if (!lineinfoREGX || !lineinfoREGX[1] || !videoPlayStartTimeREGX || !videoPlayStartTimeREGX[1] || !viewerUrlREGX || !viewerUrlREGX[2] || !uInfoREGX || !uInfoREGX[2]) {
                                                logs.addLog('获取直播详情失败2，请联系作者反馈', 'orange');
                                                break;
                                            }
                                            let oldLiveIdREGX = liveResult.responseText.match(/data\s*:\s*{\s*"liveId"\s*:\s*([0-9]{4,50})\s*,/);
                                            if (oldLiveIdREGX && oldLiveIdREGX[1]) {
                                                oldLiveId = oldLiveIdREGX[1]
                                            }
                                            let uInfo = uInfoREGX[2]
                                            let lineinfo = JSON.parse(lineinfoREGX[1].replaceAll('\'', '"'))
                                            let playTime = Number(videoPlayStartTimeREGX[1])
                                            let viewerUrl = viewerUrlREGX[2]
                                            let duration = Number(lineinfo.videoLongtime)
                                            if (duration < 10) {
                                                duration = liveInfo['temp']['data']['duration']
                                            }
                                            function delUrlParam(url, name) {
                                                if (!url) {
                                                    return "";
                                                }
                                                var urlArr = url.split('?');
                                                if (urlArr.length > 1 && urlArr[1].indexOf(name) > -1) {
                                                    try {
                                                        var query = urlArr[1];
                                                        var obj = {}
                                                        var arr = query.split("&");
                                                        for (var i = 0; i < arr.length; i++) {
                                                            arr[i] = arr[i].split("=");
                                                            obj[arr[i][0]] = arr[i][1];
                                                        };
                                                        delete obj[name];
                                                        var urlte = urlArr[0] + '?' + JSON.stringify(obj).replace(/[\"\{\}]/g, "").replace(/\:/g, "=").replace(/\,/g, "&");
                                                        return urlte;
                                                    } catch (e) {
                                                        return url;
                                                    }
                                                }
                                            }
                                            let viewhref = delUrlParam(viewerUrl, "watchMoment") + "&watchMoment=" + playTime;
                                            let viewResult = await request({
                                                'url': viewhref
                                            });
                                            if (rt <= 0.9) {
                                                duration = duration * (rt + 0.1);
                                            }
                                            let isStart = '0',
                                                lreportUrl, reportR, lreportUrl2, reportZ;
                                            updateBar(0);
                                            nowBar = 0;
                                            barr = setInterval(function () {
                                                nowBar += 10;
                                                updateBar(Math.round(nowBar / duration * 100));
                                            }, 10000);
                                            await sleep(800)
                                            await request({
                                                headers: {
                                                    "Referer": href
                                                },
                                                'url': 'https://zhibo.chaoxing.com/userLog/recordAction?operate=%E5%85%89%E6%A0%87%E8%BF%9B%E5%85%A5'
                                            });
                                            await sleep(1123)

                                            let watchMoment
                                            while (playTime <= duration) {
                                                lreportUrl = $protocol + 'zhibo.chaoxing.com/saveTimePc?userId=' + $uid + '&courseId=' + courseId + '&streamName=' + jobData['property']['streamName'] + '&vdoid=' + jobData['property']['vdoid'] + '&isStart=' + isStart;
                                                isStart = '1';
                                                reportR = await request({
                                                    headers: {
                                                        "Referer": href
                                                    },
                                                    'url': lreportUrl
                                                });
                                                if (liveStatus == 4) {
                                                    watchMoment = playTime + +Math.random().toFixed(5)
                                                    lreportUrl2 = $protocol + 'zhibo.chaoxing.com/apis/live/put/watchMoment?liveId=' + oldLiveId + '&streamName=' + jobData['property']['streamName'] + '&vdoid=' + jobData['property']['vdoid'] + '&watchMoment=' + watchMoment + '&t=' + new Date().getTime() + '&u=' + uInfo
                                                    reportZ = await request({
                                                        headers: {
                                                            "Referer": href
                                                        },
                                                        'url': lreportUrl2
                                                    });
                                                } else {
                                                    reportZ = true
                                                }
                                                if (reportR.responseText.includes('success') && (reportZ || reportZ.responseText.includes('请求成功'))) {
                                                    if (jiba) {
                                                        logs.addLog(`${jobData.property.title}：已观看${(playTime / 60).toFixed(1)}分钟`)
                                                        jiba = 0
                                                    } else {
                                                        jiba = 1
                                                    }

                                                } else {
                                                    logs.addLog('观看进度上报失败：' + jobData.property.title, 'red')
                                                }
                                                if (playTime >= duration) {
                                                    clearInterval(barr);
                                                    logs.addLog('直播回放完成：' + jobData.property.title)
                                                    break
                                                }
                                                playTime += 30
                                                if (playTime > duration) {
                                                    playTime = duration;
                                                }
                                                await sleep(30000);
                                            }
                                            break;
                                        }
                                    case 'microCourse':
                                        if (!GM_getValue('doDocument', true)) {
                                            logs.addLog('跳过任务：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        logs.addLog('开始速课任务：' + jobData.property.title);
                                        await sleep(5000);
                                        let domicroCoursResult = await request({
                                            'url': '/ananas/job/microCourse?jobid=' + jobData.jobid + '&knowledgeid=' + chapterId + '&courseid=' + courseId + '&clazzid=' + classId + '&jtoken=' + jobData.jtoken + '&checkMicroTopic=true&microTopicId=undefined&jsoncallback=jQuery3710909116110402' + $n(1, 9) + '_175567939' + $n(1, 9) + '&_=' + new Date() / 1
                                        })
                                        if (!domicroCoursResult) {
                                            logs.addLog('速课任务失败：' + jobData.property.title, 'red');
                                            break;
                                        }
                                        if (domicroCoursResult.response.includes('添加考核点成功')) {
                                            logs.addLog('速课任务完成：' + jobData.property.title, 'green');
                                        } else {
                                            console.log(domicroCoursResult)
                                            logs.addLog('速课任务失败：' + jobData.property.title, 'green');
                                        }
                                        break
                                    default:
                                        logs.addLog('暂不支持的任务类型：' + jobData.type);
                                }
                            } catch (e) {
                                console.log(e);
                                try { logs.addLog('循环任务时出现无法预料的错误，请刷新页面重试，或联系作者反馈', 'red') } catch (e) { }
                            }
                        }
                    } catch (e) {
                        console.log(e);
                        try { logs.addLog('循环章节时出现无法预料的错误，请刷新页面重试，或联系作者反馈', 'red') } catch (e) { }
                    }
                }
            }
        }
        hostCheck({ requireToken: false }).then(server => {
            if (!server) return;
            main()
        })
    }
    // 考试前等待页面
    else if ($l.includes('examcode/examnotes') || $l.includes('exam-ans/exam/test?')) {
        ctk();
    }
    // 考试作答页面,旧版页面自动跳转到新版,新版页面自动跳转到整卷预览页面
    else if ($l.includes('reVersionTestStartNew')) {
        if ($s['newMooc'] != 'true') {
            $w.location.href = $l + '&newMooc=true';
            return;
        }
        if ($w.maxtime < 10) {
            $w.maxtime = 30
        }
    }
    // 整卷预览页面,在此页面作答
    else if ($l.includes('ans/mooc2/exam/preview')) {
        // const removeMask = setInterval(function () {
        //     const masks = [...document.querySelectorAll('.mask_div')]
        //     if (masks.length < 1) {
        //         clearInterval(removeMask)
        //         return
        //     }
        //     masks.forEach(e => {
        //         e.remove()
        //     })
        // }, 1000)
        let host = hostList[0]
        let token
        const popup = new PopupTool()
        popup.setTokenHandler()
        function waitMinimized() {
            return new Promise((resolve, reject) => {
                if (!popup.minimized) {
                    resolve()
                }
                let r = setInterval(function () {
                    if (!popup.minimized) {
                        clearInterval(r)
                        resolve()
                    }
                }, 500)
            })
        }
        const addLog = (info, color = 'black') => {
            info = `<span style="color:${color};">${info}</span>`
            popup.addLog(info)
        }
        async function main() {
            try {
                if ($w.maxtime < 30) {
                    alert("【易学·超星学习通助手】\n考试剩余不到30秒，此试卷之前被打开过，现在时间已经耗尽，脚本不保证作答成绩")
                }
                setInterval(e => {
                    if ($w.maxtime < 60 && $w.maxtime > 20) {
                        $w.maxtime = 60
                    }
                }, 500)
                $w.timeOverSubmitTest = () => {
                    alert("【易学·超星学习通助手】\n考试时间已经耗尽")
                    $d.querySelector("#timeOver").value = false
                    $w.maxtime = 2
                }
            } catch { }
            ctk(token)
            let examNameE = $d.querySelector('.padlr24>h2.h2_subject')
            let examName = '课程考试'
            if (examNameE) {
                let examnameeeee = examNameE.innerText
                if (examnameeeee.length > 1 && examnameeeee.length < 20) {
                    examName = examnameeeee
                }
            }
            popup.setUsage();
            popup.setBaseInfo('<span style="color:green;">正在作答考试</span>')
            await sleep(2000);
            const completeBtn = $d.querySelector('.completeBtn')
            completeBtn.setAttribute('title', '不同题型所占分值不同，实际成绩可能有误差')
            let questionsElements = $d.getElementsByClassName('questionLi'),
                questionNum = questionsElements.length,
                finishdQuestionNum = 0,
                courseId = $s['courseid'] || $s['courseId'];
            addLog('开始考试', 'green')
            for (let questionElement of questionsElements) {
                let questionId = questionElement.getAttribute('data') || questionElement.querySelector('.questionId').value,
                    questionType = $d.getElementsByName('type' + questionId)[0].getAttribute('value'),
                    tm = plainText(questionElement.getElementsByClassName('mark_name')[0].innerHTML).trim().replaceAll('\n', '').replace(/^\d+\.([\x00-\x1F\x7F]|\s)*\(.*题([\x00-\x1F\x7F]|\s)*(,|，)([\x00-\x1F\x7F]|\s)*\d*\.?\d*([\x00-\x1F\x7F]|\s)*(分|points)\)([\x00-\x1F\x7F]|\s)*/ig, ''),
                    question = { 'tm': tm, 'questionId': questionId, 'questionType': questionType };

                let optionsElements = $d.getElementsByClassName('choice' + question['questionId']),
                    optionsList = [];
                for (let optionE of optionsElements) {
                    let option = beforeTrim(optionE.nextElementSibling.innerHTML);
                    optionsList.push(option);
                }
                let optionListJson = encodeURIComponent(JSON.stringify(optionsList)),
                    starttime = Date.now(),
                    costtime = Date.now() - starttime,
                    answernum = 0,
                    inputs = questionElement.querySelectorAll('iframe')
                inputs.forEach(e => {
                    if (e.id.includes('ueditor')) {
                        answernum++
                    }
                })
                await waitMinimized()
                let ai = GM_getValue('aiAnswer', false) ? '1' : '0',
                    ctResult = await queryQuestion({ title: tm, options: optionsList, type: String(questionType), use_ai: ai === '1' })
                await waitMinimized()
                if (ctResult) {
                    try {
                        $d.getElementById('answerSheet' + question['questionId']).click();
                        await sleep($n(0.5, 0.8));
                        await waitMinimized()
                    } catch (e) { }
                    let hasAnswer = false;
                    refreshQueryUsage();
                    popup.setUsage()
                    if (ctResult['code'] != 1) {
                        addLog(question['tm'] + '：' + ctResult['msg'], 'red');
                        continue;
                    }
                    let answer = ctResult['data']
                    if (['0', '1', '3'].includes(question['questionType'])) {
                        answer = trimAnswer(ctResult['data']).replaceAll(/([\x00-\x1F\x7F]|\s)/g, '');
                        for (let optionE of optionsElements) {
                            let option = trim(optionE.nextElementSibling.innerHTML).replaceAll(/([\x00-\x1F\x7F]|\s)+/ig, '');
                            if (question['questionType'] < 2) {
                                if (question['questionType'] == 0 && answer == option) {//适配有正确答案但答案为类似“十五个工作日”、“五个工作日”会导致include错误
                                    if (!optionE.getAttribute('class').includes('check_answer')) {
                                        optionE.click();
                                    }
                                    hasAnswer = true;
                                    break;
                                }
                                if (option.includes(answer) || answer.includes(option)) {
                                    hasAnswer = true;
                                    if (!optionE.getAttribute('class').includes('check_answer')) {
                                        optionE.click();
                                        await sleep($n(0.5, 1));
                                        await waitMinimized()
                                    }
                                } else {
                                    if (optionE.getAttribute('class').includes('check_answer')) {
                                        optionE.click();
                                        await sleep($n(0.5, 1));
                                        await waitMinimized()
                                    }
                                }
                            } else if (question['questionType'] == 3) {
                                answer = answer.replaceAll(/([\x00-\x1F\x7F]|\s)/g, '');
                                pdresult = panDuan(answer);
                                if (pdresult !== false) {
                                    hasAnswer = true;
                                    if ((pdresult === 'r' && option.includes('对')) || (pdresult === 'w' && option.includes('错'))) {
                                        if (!optionE.getAttribute('class').includes('check_answer')) {
                                            optionE.click();
                                        }
                                    }
                                }
                            }
                        }
                    } else if (question['questionType'] == '2') {
                        let answers = ctResult['data'].split("#!#")
                        if (answers.length == answernum) {
                            let i = 0
                            for (let answer of answers) {
                                i++
                                try {
                                    i > 1 && await sleep(1000)
                                    await waitMinimized()
                                    UE.getEditor("answerEditor" + question['questionId'] + i).setContent(escapeText(answer))
                                    $w.saveQuestion(question['questionId'], question['questionId'] + i)
                                } catch (e) { }
                            }
                            hasAnswer = true
                        }
                    } else {
                        addLog(question['tm'] + '：暂不支持的题型', 'red')
                    }
                    if (hasAnswer) {
                        addLog(escapeText(question['tm'] + '：' + answer), 'blue');
                        finishdQuestionNum++;
                    } else {
                        addLog(question['tm'] + '：未找到答案', 'red');
                    }
                    // updateStatus();
                    let sleeptime = $n(3, 5) - costtime;
                    sleeptime < 0 && (sleeptime = 100);
                    await sleep(sleeptime);
                } else {
                    addLog(question['tm'] + '：查题失败', 'red');
                }
            }
            let vgqtlv = Math.floor(finishdQuestionNum / questionNum * 100)
            addLog(`考试作答完成，预估正确率${vgqtlv}%，请检查`, 'green');
            addLog('不同题型所占分值不同，实际成绩可能有误差，请仔细检查', 'green');
        }
        host = await hostCheck()
        if (!host) {
            return
        }
        token = getTkToken()
        if (!token) {
            return
        }
        popup.setToken(token)
        if (!confirm('【易学·超星学习通助手】\n点击确定开始作答考试')) {
            return;
        }
        main()
    }
    else if ($l.includes('mooc2/work/list?') || $l.includes('mooc-ans/mooc2/work/dowork?')) {
        let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
            courseId = $s['courseid'] || $s['courseId'];
        if (confirm('【易学·超星学习通助手】\n使用此脚本刷作业需要将页面切换为旧版学习通，是否切换？')) {
            GM_setValue('directToWork', true);
            $w.top.location.href = $protocol + $w.location.host.replace(/^.*?\./ig, 'mooc1.') + '/visit/stucoursemiddle?courseid=' + courseId + '&clazzid=' + classId;
        }
    }
    // 作业作答页面
    else if ($l.includes('work/doHomeWorkNew?') && $w.top == $w) {
        let host = hostList[0]
        let token
        const popup = new PopupTool();
        function waitMinimized() {
            return new Promise((resolve, reject) => {
                if (!popup.minimized) {
                    resolve()
                }
                let r = setInterval(function () {
                    if (!popup.minimized) {
                        clearInterval(r)
                        resolve()
                    }
                }, 500)
            })
        }
        function addLog(info, color = 'black') {
            info = `<span style="color:${color};">${info}</span>`
            popup.addLog(info)
        }
        $w.logs = {
            addLog: (log, color = 'black') => {
                addLog(log, color);
            }
        }
        async function main() {
            ctk(token)
            popup.setUsage();
            let courseName = '作业'
            let titleE = $d.querySelector('div.headerwrap>h1>span[title="frdgsgdrs"]>a')
            if (titleE) {
                let courseNamez = titleE.innerText
                if (courseNamez !== '' && courseNamez.length > 1 && courseNamez.length < 20) {
                    courseName = courseNamez
                }
            }
            let courseId = $s['courseid'] || $s['courseId']
            await sleep(3000);
            let tmEs = $d.getElementsByClassName('TiMu'),
                wid = $d.getElementById('workLibraryId').value
            popup.setBaseInfo('<span style="color:green;">正在作答作业</span>')

            addLog('开始作答作业');
            for (let i = 0, l = tmEs.length; i < l; i++) {
                let tmE = tmEs[i],
                    tmT = 9,
                    tmTEs = tmE.getElementsByTagName('input');
                for (let j = 0, k = tmTEs.length; j < k; j++) {
                    let tmTE = tmTEs[j]
                    if (tmTE.name && tmTE.name.includes('answertype')) {
                        tmT = tmTE.value;
                        break
                    }
                }
                if (!['0', '1', '2', '3'].includes(tmT)) {
                    addLog('不支持的题型', 'red');
                    continue;
                }
                let questionE = tmE.querySelector('.fontLabel') || tmE.querySelector('.Zy_TItle'),//兼容华东理工大学
                    question = plainText(questionE.innerHTML).trim(),
                    optionsETs = tmE.getElementsByTagName('li'),
                    optionEs = [],
                    optionsList = [],
                    inputEs = tmE.querySelectorAll('iframe'),
                    answernum = 0,
                    questionId = false
                if (tmT == '2') {
                    questionId = tmE.getAttribute('data')
                    if (!questionId) {
                        addLog('无法获取题目信息', 'red');
                        continue;
                    }
                    inputEs.forEach(iframe => {
                        if (iframe.id.includes('ueditor')) {
                            answernum++
                        }
                    })
                } else {
                    for (let j = 0, k = optionsETs.length; j < k; j++) {
                        let optionsET = optionsETs[j],
                            zz = optionsET.getElementsByTagName('input');
                        if (zz.length < 1) {
                            continue;
                        }
                        if (['checkbox', 'radio'].includes(zz[0].getAttribute('type'))) {
                            if (zz[0].checked) {
                                zz[0].checked = '';
                            }
                            optionEs.push(optionsET);
                            optionsList.push(beforeTrim(optionsET.innerHTML).replace(/^[A-Z]([\x00-\x1F\x7F]|\s)+/ig, ''))
                        }
                    }
                }
                optionsList = JSON.stringify(optionsList) === '["",""]' ? ["对", "错"] : optionsList
                await waitMinimized()
                let optionsListJson = encodeURIComponent(JSON.stringify(optionsList)),
                    starttime = Date.now(),
                    ai = GM_getValue('aiAnswer', false) ? '1' : '0',
                    tkResultJson = await queryQuestion({ title: question, options: optionsList, type: tmT, use_ai: ai === '1' }),
                    costtime = Date.now() - starttime,
                    sleeptime = $n(2, 3) - costtime,
                    answer = '',
                    hasAnswer = false;
                sleeptime < 0 && (sleeptime = 100);
                await sleep(sleeptime);
                await waitMinimized()
                if (!tkResultJson) {
                    addLog('未找到答案：' + question, 'red');
                    continue;
                }
                if (tkResultJson.code != 1) {
                    if (tkResultJson.msg) {
                        addLog('题库错误：' + tkResultJson.msg, 'red');
                    } else {
                        addLog('题库错误：未知原因', 'red');
                    }
                    continue;
                } else if (tkResultJson.data) {
                    answer = tkResultJson.data
                    popup.setUsage()
                }

                if (['0', '1'].includes(tmT)) {
                    answer = trimAnswer(answer).replaceAll(/([\x00-\x1F\x7F]|\s)/g, '');
                    for (let j = 0, k = optionEs.length; j < k; j++) {
                        let optionE = optionEs[j],
                            option = trim(optionE.innerHTML).replace(/^[A-Z]([\x00-\x1F\x7F]|\s)+/ig, '').replaceAll(/([\x00-\x1F\x7F]|\s)+/ig, '');
                        if (option == answer || option.includes(answer) || answer.includes(option)) {
                            hasAnswer = true
                            optionE.getElementsByTagName('input')[0].click();
                            if (tmT == '0' && option == answer) {//单选题，并且选项完全匹配，停止后续判断，防止嵌套问题
                                break;
                            }
                        }
                    }
                } else if (tmT == '3') {
                    answer = answer.replaceAll(/([\x00-\x1F\x7F]|\s)/g, '');
                    pdresult = panDuan(answer);
                    if (pdresult === 'r') {
                        optionEs[0].getElementsByTagName('input')[0].click();
                        hasAnswer = true
                    } else if (pdresult === 'w') {
                        optionEs[1].getElementsByTagName('input')[0].click();
                        hasAnswer = true
                    } else {
                        addLog(question + '：未找到答案', 'red');
                    }
                } else {
                    let answers = answer.split("#!#")
                    if (answers.length == answernum) {
                        for (let i = 1; i <= answernum; i++) {
                            try {
                                $w.UE.getEditor("answerEditor" + questionId + i).setContent(escapeText(answers[i - 1]))
                                $w.syncAnswer(questionId, '2')
                            } catch (e) {
                                console.log(e)
                            }
                        }
                        hasAnswer = true
                    }
                }
                if (hasAnswer) {
                    addLog(escapeText(question + '：' + answer), 'blue');
                }
            }
            addLog('作业作答完成，请检查后自行提交（如果不交别忘了点保存）', 'green');
        }
        host = await hostCheck()
        if (!host) {
            return
        }
        token = getTkToken()
        if (!token) {
            return
        }
        popup.setToken(token)
        if (!confirm('【易学·超星学习通助手】\n点击确定开始作答作业')) {
            return;
        }
        main()
    }
    if ($l.includes('exam-ans/mooc2/exam/exam-list?') || $l.includes('exam-ans/exam/test/examcode/examnotes?')) {//考试中转页面
        if (!await hostCheck()) return;
        let token = getTkToken()
        if (!token) {
            return
        }
        ctk(token)
        let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
            courseId = $s['courseid'] || $s['courseId']
        let examId = courseId + '' + classId
        GM_setValue('examData' + examId, false)
        const popup = new PopupTool();
        popup.setToken(token)
        popup.setTokenHandler()
        popup.setBaseInfo('<span style="color:green;">脚本准备就绪，请进入考试</span>')
        popup.setUsage();
    } else if ($l.includes('exam-ans/exam/test/reVersionTestStartNew?')) {
        let mark_info = $d.querySelector('.mark_info')
        if (mark_info && mark_info.innerHTML.includes('已设置不允许整卷预览')) {
            pass
        } else if (typeof $w.topreview == 'function') {
            setInterval(() => { $w.topreview(); }, 1000)
            return
        }
        let classId = $s['clazzid'] || $s['classid'] || $s['classId'] || $s['classId'],
            courseId = $s['courseid'] || $s['courseId']
        let examId = courseId + '' + classId
        let data = GM_getValue('examData' + examId, false)
        let nowTime = Math.round(new Date() / 1000)
        let token = getTkToken()
        let host
        if (!data) {
            data = {
                lasUpdateLogs: 0,
                logs: [],
                right: 0,
                all: 0,
                host: false,
                done: false
            }
        } else {
            host = data.host
            if (data.done === false) {
                data.all++
            }
        }
        host = await hostCheck();
        if (!host) return;
        data.host = host;
        token = getTkToken();
        const popup = new PopupTool();
        function addLog(log, color = 'black') {
            log = `<span style="color:${color}">${log}</span>`
            popup.addLog(log)
        }
        function waitMinimized() {
            return new Promise((resolve, reject) => {
                if (!popup.minimized) {
                    resolve()
                }
                let r = setInterval(function () {
                    if (!popup.minimized) {
                        clearInterval(r)
                        resolve()
                    }
                }, 500)
            })
        }
        popup.setTokenHandler()
        let vgqtlv
        if (data.all == 0) {
            vgqtlv = 0
        } else {
            vgqtlv = Math.floor(data.right / data.all * 100)
        }
        popup.setToken(token)
        popup.setUsage()
        if (data.logs.length < 1) {
            addLog('开始作答考试')
        } else {
            popup.loadLogs(data.logs)
        }
        if (data.done === true) {
            popup.setBaseInfo(`<span style="color:green;">正在阅卷，不会自动作答，有问题加群：${$qqgroup}</span>`)
            $w.gabifujareset = function () {
                data.done = 1
                GM_setValue('examData' + examId, data)
                addLog('已开启单题作答模式，进入任何一题会重新做')
            }
            addLog('现在是阅卷模式，你切换到任何题目都不会自动作答，<a style="cursor:pointer;color:blue;" onclick="gabifujareset()">点我开启单题作答模式</a>', 'green')
            return
        } else if (data.done === 1) {
            popup.setBaseInfo(`<span style="color:green;">正在单题作答，不会自动切换下一题，有问题加群：${$qqgroup}</span>`)
            $w.gabifujareset = function () {
                data.done = true
                GM_setValue('examData' + examId, data)
                addLog('已开启阅卷模式，切换到任何题都不会作答')
            }
            addLog('单题作答中，答完题后不会自动切换，<a style="cursor:pointer;color:blue;" onclick="gabifujareset()">点我开启阅卷模式</a>(不会做任何题)', 'green')
        } else {
            popup.setBaseInfo(`<span style="color:green;">已答${data.all}题，正确率${vgqtlv}%，正在考试中，有问题加群：${$qqgroup}</span>`)
        }
        GM_setValue('examData' + examId, data)
        await waitMinimized()
        const questionBox = $d.querySelector('.noSplitBx')
        if (!questionBox) {
            addLog('获取题目失败，请联系客服', 'red')
            return
        }
        const typeE = questionBox.querySelector('h2.type_tit')
        if (!typeE) {
            addLog('获取题目类型失败，请联系客服', 'red')
            return
        }
        let type = -1
        let hasRightAnswer = false
        if (typeE.innerHTML.includes('单选题')) {
            type = 0
        } else if (typeE.innerHTML.includes('多选题')) {
            type = 1
        } else if (typeE.innerHTML.includes('填空题')) {
            type = 2
        } else if (typeE.innerHTML.includes('判断题')) {
            type = 3
        }
        if (type != -1) {
            let examName = ''
            let examNameE = $d.querySelector('div.marking_left_280>div.padlr24>h2.h2_subject')
            if (examNameE) {
                examName = examNameE.innerText
            }
            // addLog('题型为'+type)
            let tmFuck = questionBox.querySelector('h3.mark_name.colorDeep')
            if (!tmFuck) {
                addLog('获取题目1失败，请联系客服', 'red')
                return
            }
            tmFuck = plainText(tmFuck.innerHTML).trim()
            let tmMatchs = tmFuck.match(/^\s*\d+[.．、]\s*[（(].{2,10}题\s*[,，]\s*\d+(?:\.\d+)?\s*分[）)]\s*(.+)\s*$/)
            if (!tmMatchs || tmMatchs.length != 2) {
                addLog('题目解析失败，请联系客服', 'red')
                return
            }
            const tm = tmMatchs[1]
            if (!tm || tm == '') {
                addLog('题目为空，请联系客服', 'red')
                return
            }
            // addLog('题目为'+tm)
            let smartOptions = {}
            let realOptions = []
            let answerNum = 0
            let answerBox = []
            if (type < 2) {
                let optionsBox = questionBox.querySelector('div.stem_answer')
                if (!optionsBox) {
                    addLog('选择题获取选项失败，请联系客服', 'red')
                    return
                }
                let optionEs = [...optionsBox.children]
                if (optionEs.length < 1 || optionEs.length > 10) {
                    addLog('选择题选项数量异常:' + optionEs.length + '，请联系客服', 'red')
                    return
                }
                for (let optionE of optionEs) {
                    let option = beforeTrim(optionE.innerHTML.replaceAll('\n', '').replaceAll('\r', ''))
                    if (option == '') {
                        addLog('某一个选项获取失败，请注意检查', 'red')
                        continue
                    }
                    let optionMatchs = option.match(/^\s*[A-Z][.、．)）]?\s*(.+)\s*$/)
                    if (!optionMatchs || optionMatchs.length != 2) {
                        addLog('某一个选项获取失败1，请注意检查', 'red')
                        continue
                    }
                    option = optionMatchs[1]
                    let trimOption = trim(option)
                    if (option == '') {
                        addLog('某一个选项获取失败2，请注意检查', 'red')
                        continue
                    }
                    // addLog('选项'+option)
                    realOptions.push(option)
                    smartOptions[trimOption] = optionE
                }
                if (realOptions.length < 1) {
                    addLog('选择题没有选项，请联系客服', 'red')
                    return
                }
                if (realOptions.length == 2 && panDuan(realOptions[0]) && panDuan(realOptions[1])) {
                    type = 3
                }

            }
            if (type == 2) {
                answerBox = [...questionBox.querySelectorAll('.Answer')]
                answerNum = answerBox.length
                if (answerNum < 1 || answerNum > 10) {
                    addLog('填空题填空数量不足，请联系客服', 'red')
                    return
                }
            }
            if (type == 3) {
                let optionEs = questionBox.querySelectorAll('div.judgeoption')
                if (optionEs.length != 2) {
                    addLog('判断题选项异常，请联系客服', 'red')
                    return
                }
                smartOptions['r'] = optionEs[0]
                smartOptions['w'] = optionEs[1]
                realOptions = Array.from(optionEs, (element, index) => plainText(element.innerHTML).trim() || ['对', '错'][index]);
            }
            let optionsJsonText = JSON.stringify(realOptions)
            let ai = GM_getValue('aiAnswer', false) * 1
            let beforeRequestTime = Date.now()
            let sleepTime = $n(2, 4)
            let tkResultJson = await queryQuestion({ title: decodeHtmlEntities(tm), options: realOptions, type: String(type), use_ai: ai === 1 });
            await waitMinimized()
            let leftTime = Math.round(new Date() / 1000) - nowTime
            let randomSleepTime = $n(3)
            if (leftTime < randomSleepTime) {
                await sleep(leftTime)
            }
            let realAnswer = '暂无'
            if (!tkResultJson) {
                addLog('未找到答案：' + tm, 'red');
            } else if (tkResultJson.code != 1) {
                if (tkResultJson.msg) {
                    addLog('题库错误：' + tkResultJson.msg, 'red');
                } else {
                    addLog('题库错误：未知原因', 'red');
                }
            } else if (tkResultJson.data) {
                realAnswer = tkResultJson.data;
                if (Date.now() - sleepTime < beforeRequestTime) {
                    await sleep(sleepTime - Date.now() + beforeRequestTime)
                }
                if (type == 0) {
                    realAnswer = trimAnswer(realAnswer)
                    if (realAnswer == '') {
                        addLog('未找到对应答案：' + tm, 'red');
                    } else if (smartOptions[realAnswer]) {
                        hasRightAnswer = true
                        if (smartOptions[realAnswer].getAttribute('aria-checked') != 'true') {
                            smartOptions[realAnswer].click()
                        }
                    } else {
                        addLog('未找到对应答案1：' + tm, 'red');
                    }
                } else if (type == 1) {
                    let rightOptions = realAnswer.split('#')
                    if (rightOptions.length < 1 || rightOptions.length > smartOptions.length) {
                        addLog('未找到对应答案2：' + tm, 'red');
                    } else {
                        for (let z in smartOptions) {
                            option = smartOptions[z]
                            let span = option.querySelector('span.addMultipleChoice')
                            if (span && span.className.includes('check_answer_dx')) {//已选中的多选题取消选中
                                option.click()
                                await sleep($n(0, 1))
                            }
                        }
                        let fuck_me_please = false
                        for (let rightoption of rightOptions) {
                            rightoption = trim(rightoption)
                            if (rightoption === '') {
                                continue
                            }
                            if (smartOptions[rightoption]) {
                                smartOptions[rightoption].click()
                            } else {
                                addLog('未找到对应答案3：' + tm, 'red');
                                fuck_me_please = true
                                break
                            }
                        }
                        if (!fuck_me_please) {
                            hasRightAnswer = true
                        }
                    }

                } else if (type == 2) {
                    let answers = realAnswer.split("#!#")
                    let ueditorInputEs = [...$d.querySelectorAll('textarea[name^="answerEditor"]')]
                    let ueditorIds = []
                    for (let ueditorInputE of ueditorInputEs) {
                        ueditorIds.push(ueditorInputE.getAttribute('name'))
                    }
                    if (answers.length != answerNum || ueditorInputEs.length != answerNum || ueditorIds.length != answerNum) {
                        addLog('填空题答案数量不一致：' + tm, 'red');
                    } else {
                        for (let i = 0, l = answerNum; i < l; ++i) {
                            try {
                                UE.getEditor(ueditorIds[i]).setContent(escapeText(answers[i]))
                                await sleep($n(1, 2))
                                if (i == l - 1) {
                                    hasRightAnswer = true
                                }
                            } catch {
                                addLog('填空题作答失败：' + tm, 'red');
                                break
                            }
                        }
                    }
                } else if (type == 3) {
                    realAnswer = trimAnswer(realAnswer)
                    let realAnswerZ = panDuan(realAnswer)
                    if (realAnswerZ === false) {
                        addLog('未找到对应答案：' + tm, 'red');
                    } else if (smartOptions[realAnswerZ]) {
                        let checccck = smartOptions[realAnswerZ].querySelector('span')
                        if (checccck) {
                            hasRightAnswer = true
                            if (!checccck.className.includes('check_answer')) {
                                smartOptions[realAnswerZ].click()
                            }
                        } else {
                            addLog('未找到对应答案2：' + tm, 'red');
                        }
                    } else {
                        addLog('未找到对应答案1：' + tm, 'red');
                    }
                }
                if (hasRightAnswer) {
                    if (data.done === false) {
                        data.right++
                    }
                    addLog(escapeText(tm + '：' + realAnswer), 'green');
                }
            }
            popup.setUsage();
        } else {
            addLog('不支持的题型，跳过')
        }
        data.logs = popup.exportLogs()
        GM_setValue('examData' + examId, data)
        if (data.done === 1) {
            return
            //单题作答不跳转
        }
        let NextButtons = [...$d.querySelectorAll('div.nextDiv>a')]
        if (NextButtons.length > 0) {
            let nextE = NextButtons[NextButtons.length - 1]
            if (nextE.innerHTML.includes('下一题')) {
                popup.addLog('即将跳转下一页')
                await sleep(500)
                await waitMinimized()
                nextE.click()
            } else {
                $w.gabifujareset = function () {
                    data.done = 1
                    GM_setValue('examData' + examId, data)
                }
                data.done = true
                GM_setValue('examData' + examId, data)
                addLog('考试做答完成，请检查试卷，已开启阅卷模式，现在你切换到任何题目都不会自动作答，<a style="cursor:pointer;color:blue;" onclick="gabifujareset()">点我开启单题作答模式</a>(用于补充未作答题目)', 'green')
            }
        } else {
            addLog('未找到下一题按钮，请手动切换')
        }
    }
    if ($l.includes('/mooc-ans/work/getAllWork?')) {
        if (!await hostCheck()) return;
        let token = getTkToken()
        if (!token) {
            return
        }
        ctk(token)
        const popup = new PopupTool();
        popup.setToken(token)
        popup.setTokenHandler()
        popup.setBaseInfo('<span style="color:green;">脚本准备就绪，请进入作业</span>')
        popup.setUsage();
    }
    // 题库采集：仅在用户主动执行菜单命令并确认后，提取当前页面的结构化题目。
    // 不上传整页 HTML、Cookie、Token、隐藏表单或用户身份信息；答案也不会被当作标准答案提交。
    const SUBMISSION_TOKEN_KEY = 'yixueSubmissionToken';
    const SUBMISSION_CONSENT_KEY = 'yixueSubmissionConsent';
    const SUBMISSION_SEEN_KEY = 'yixueSubmissionSeen';
    const collectQuestionsForSubmission = () => {
        const roots = [...document.querySelectorAll('.TiMu, .question, .exam-question, [data-question-index], [data-question-id]')];
        const candidates = roots.length ? roots : [...document.querySelectorAll('li, .questionLi')];
        const result = [], seen = new Set();
        for (const root of candidates) {
            const titleNode = root.querySelector('.Zy_TItle, .题目, .question-title, .title, [class*="title"]') || root;
            const title = (titleNode.innerText || '').replace(/\s+/g, ' ').trim();
            if (!title || title.length > 5000 || seen.has(title)) continue;
            const options = [...root.querySelectorAll('label, .answer, .option, li')]
                .map(node => (node.innerText || '').replace(/\s+/g, ' ').trim())
                .filter((value, index, values) => value && values.indexOf(value) === index && value !== title)
                .slice(0, 50);
            const assets = [...root.querySelectorAll('img[src], math, [data-latex], [data-formula]')].map(node => {
                if (node.tagName.toLowerCase() === 'img') {
                    const url = node.src || '';
                    return /^https:\/\//i.test(url) ? { kind: 'image', url, alt: node.alt || '' } : null;
                }
                const formula = (node.getAttribute('data-latex') || node.getAttribute('data-formula') || node.textContent || '')
                    .replace(/<\/?(script|iframe|object|embed)[^>]*>/gi, '').trim().slice(0, 2000);
                return formula ? { kind: 'formula', formula, alt: formula.slice(0, 300) } : null;
            }).filter(Boolean);
            const type = /多选|multiple|checkbox/i.test(root.className + ' ' + root.innerText) ? 'multiple' :
                (/判断|true|false/i.test(root.className + ' ' + root.innerText) ? 'judge' : (options.length ? 'single' : 'unknown'));
            seen.add(title);
            result.push({ title, options, type, assets });
            if (result.length >= 100) break;
        }
        return result;
    };
    const pageHash = questions => {
        const text = JSON.stringify(questions.map(item => [item.title, item.options, item.type]));
        let hash = 2166136261;
        for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
        return (hash >>> 0).toString(16);
    };
    const sendQuestionPage = async (silent = false) => {
        const token = GM_getValue(SUBMISSION_TOKEN_KEY, '');
        if (!token || !GM_getValue(SUBMISSION_CONSENT_KEY, false)) return;
        const origin = questionBank.base();
        const questions = collectQuestionsForSubmission();
        if (!questions.length) return;
        const fingerprint = `${location.hostname}:${pageHash(questions)}`;
        if (GM_getValue(SUBMISSION_SEEN_KEY, '') === fingerprint) return;
        const idempotencyKey = `page-${fingerprint}`;
        const response = await questionBank.submitQuestions(token, { consent: true, source_host: location.hostname, questions }, idempotencyKey);
        if (origin !== questionBank.base() || token !== GM_getValue(SUBMISSION_TOKEN_KEY, '') || !GM_getValue(SUBMISSION_CONSENT_KEY, false)) return;
        if (response.status === 201) {
            GM_setValue(SUBMISSION_SEEN_KEY, fingerprint);
            if (!silent) alert(`采集完成：${response.body?.imported_count || 0} 道新题目已自动入库。`);
        } else if (response.status === 401) {
            GM_setValue(SUBMISSION_TOKEN_KEY, ''); GM_setValue(SUBMISSION_CONSENT_KEY, false);
            if (!silent) alert('采集 Token 无效或已过期，请重新授权。');
        } else if (!silent) alert(`采集失败（${response.status || '网络未确认'}），请稍后重试。`);
    };
    const authorizeSubmission = async () => {
        if (!confirm('启用后，脚本会在页面加载后静默提取题干、选项和题目资源并上传；不上传整页 HTML、Cookie 或答案。脚本将使用当前搜题 Token 自动申请独立采集 Token。是否启用？')) return;
        const existing = (GM_getValue(SUBMISSION_TOKEN_KEY, '') || '').trim();
        if (existing) {
            GM_setValue(SUBMISSION_CONSENT_KEY, true);
            alert('自动采集已启用。可从脚本菜单关闭。');
            return;
        }
        const searchToken = (typeof getTkToken === 'function' ? getTkToken() : '').trim();
        if (!searchToken) {
            alert('未找到搜题 Token，请先在脚本中配置新版搜题 Token。');
            return;
        }
        const origin = questionBank.base();
        const response = await questionBank.provisionSubmission();
        if (origin !== questionBank.base() || searchToken !== getTkToken()) return;
        const token = response.body?.token;
        if (response.status === 200 && typeof token === 'string' && /^sub_[A-Za-z0-9_-]+$/.test(token)) {
            GM_setValue(SUBMISSION_TOKEN_KEY, token);
            GM_setValue(SUBMISSION_CONSENT_KEY, true);
            alert('自动采集已启用，采集 Token 已自动生成。');
        } else alert('采集 Token 自动申请失败（' + (response.status || '网络未确认') + '），请确认搜题 Token 有效后重试。');
    };
    const disableSubmission = () => {
        GM_setValue(SUBMISSION_CONSENT_KEY, false);
        GM_setValue(SUBMISSION_TOKEN_KEY, '');
        GM_setValue(SUBMISSION_SEEN_KEY, '');
        alert('自动采集已关闭，采集 Token 已清除。');
    };
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('启用自动题目采集（首次需授权）', authorizeSubmission);
        GM_registerMenuCommand('关闭自动题目采集并清除 Token', disableSubmission);
    }
    if (GM_getValue(SUBMISSION_CONSENT_KEY, false) && GM_getValue(SUBMISSION_TOKEN_KEY, '')) {
        setTimeout(() => sendQuestionPage(true), 1800);
    }
    if (typeof GM_registerMenuCommand === 'function') {
        
    }
})();



