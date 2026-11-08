'use strict';

const { element, button } = require('./dom');
const createMembershipView = require('./membership');
const connectionStatus = require('./connection');

function createAccountView({ document, bank, settings, prefix, onConnect, onSave, getDisplayToken, dashboard = false }) {
    const section = element(document, 'div', { className: dashboard ? 'yixue-account' : 'yx-account-grid' });
    const tokenLabel = element(document, 'label', { className: 'yx-account-label', htmlFor: `${prefix}-token`, text: '搜题 Token' });
    const tokenInput = element(document, 'input', {
        id: `${prefix}-token`, type: 'password', value: getDisplayToken(), autocomplete: 'off', spellcheck: false,
        'aria-label': '当前 Token', className: dashboard ? 'form-control' : '',
        placeholder: '粘贴完整 Token',
    });
    let renderedToken = getDisplayToken();
    const error = element(document, 'p', { className: 'yx-error', role: 'status' });
    const save = button(document, '保存 Token', async () => {
        const submittedValue = tokenInput.value;
        save.disabled = true;
        error.textContent = '';
        try {
            await onSave(submittedValue);
            if (tokenInput.value === submittedValue) tokenInput.value = getDisplayToken();
            render();
        }
        catch (failure) { error.textContent = failure?.message || 'Token 保存失败'; }
        finally { save.disabled = false; }
    }, { id: `${prefix}-save`, className: 'yx-button' });
    const connect = button(document, dashboard ? '连接题库' : '获取 Token', () => onConnect?.(), { id: `${prefix}-connect`, className: 'yx-refresh yx-account-link' });
    const tokenGuide = dashboard ? null : element(document, 'div', { className: 'yx-token-guide' }, [
        element(document, 'p', { text: '在题库网站的「脚本接入」中复制完整 Token，粘贴后点击保存。' }), connect,
    ]);
    const ai = element(document, 'input', { id: dashboard ? 'yixue-option-doAI' : `${prefix}-ai`, type: 'checkbox' });
    ai.addEventListener('change', () => settings.set('doAI', ai.checked));
    const aiOption = element(document, 'label', { className: 'yx-token-ai yixue-answer-option', htmlFor: ai.id }, [ai,
        element(document, 'span', {}, [
            element(document, 'strong', { text: 'AI 兜底' }),
            element(document, 'small', { text: '题库未命中时尝试生成参考答案，权限和积分消耗以题库账户为准。' }),
        ]),
    ]);
    const tokenField = element(document, 'div', { className: 'yx-account-field' }, [
        tokenLabel, element(document, 'div', { className: 'yx-input-row' }, [tokenInput, save]), error, tokenGuide, aiOption,
    ]);
    const state = dashboard ? null : element(document, 'span', { className: 'yixue-connection-status', 'data-connected': 'false', text: '本地模式' });
    const balanceInput = element(document, 'input', { id: `${prefix}-balance`, type: 'text', readOnly: true, 'aria-label': '账户额度概况' });
    const balanceDetails = dashboard ? null : element(document, 'div', { 'data-yixue-balance': '', 'aria-label': '题库账户额度', 'aria-live': 'polite' });
    const aiDetails = dashboard ? null : element(document, 'p', { className: 'yx-capabilities', 'data-yixue-capabilities': '', 'aria-live': 'polite' });
    const refreshAccount = options => Promise.all([bank.refreshBalance(options), dashboard ? undefined : bank.refreshCapabilities?.(options)]);
    const refresh = button(document, '刷新额度', async () => {
        refresh.disabled = true;
        try { await refreshAccount({ force: true }); } catch (_) { error.textContent = '额度暂时无法刷新，请稍后重试。'; }
        finally { render(); }
    }, { id: `${prefix}-refresh`, className: 'yx-refresh', 'aria-label': '刷新额度（免费）' });
    const membership = createMembershipView(document);
    const balanceField = element(document, 'div', { className: 'yx-account-field' }, [
        element(document, 'div', { className: 'yx-account-label' }, [element(document, 'span', { text: '题库账户' }), dashboard ? connect : state]),
        membership.element,
        element(document, 'div', { className: 'yx-balance-line' }, [balanceInput, refresh]),
        balanceDetails, aiDetails,
    ]);
    section.append(tokenField, balanceField);
    function render() {
        ai.checked = settings.get('doAI', true) === true;
        const displayToken = getDisplayToken();
        if (displayToken !== renderedToken) {
            if (tokenInput.value === renderedToken) tokenInput.value = displayToken;
            renderedToken = displayToken;
        }
        const token = bank.getToken();
        const current = bank.balanceState();
        membership.render(current, Boolean(token), bank.routeState?.());
        balanceInput.value = token ? (current.data ? `积分：${current.data.points}` + (current.error ? '（刷新失败）' : '') : current.loading ? '正在获取额度…' : current.error ? '额度获取失败，请重试' : '等待刷新额度') : '未连接题库';
        if (!dashboard) {
            const connection = connectionStatus(bank);
            state.dataset.connected = String(connection.connected);
            state.dataset.mode = connection.mode;
            state.textContent = connection.label;
            state.title = connection.detail;
            balanceDetails.textContent = token ? bank.balanceLabel() : '本地 Token 已保存在此浏览器。连接题库后可查看账户额度。';
            aiDetails.textContent = token ? bank.capabilitiesLabel?.() || '' : '';
            aiDetails.hidden = !aiDetails.textContent;
        }
        refresh.disabled = !token || current.loading;
    }
    render();
    const unsubscribe = bank.onBalanceChange(render);
    if (bank.getToken()) refreshAccount().catch(() => {});
    return { element: section, render, tokenInput, destroy: unsubscribe };
}

module.exports = createAccountView;

