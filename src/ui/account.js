'use strict';

const { element, button } = require('./dom');
const createMembershipView = require('./membership');
const connectionStatus = require('./connection');

function createAccountView({ document, bank, prefix, onConnect, onSave, getDisplayToken, dashboard = false }) {
    const section = element(document, 'div', { className: dashboard ? 'yixue-account' : 'yx-account-grid' });
    const tokenLabel = element(document, 'label', { className: 'yx-account-label', htmlFor: `${prefix}-token`, text: dashboard ? '搜题 Token' : 'Token' });
    const tokenInput = element(document, 'input', {
        id: `${prefix}-token`, type: 'password', value: getDisplayToken(), autocomplete: 'off', spellcheck: false,
        'aria-label': '当前 Token', className: dashboard ? 'form-control' : '',
        placeholder: 'ys_…',
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
    const tokenField = element(document, 'div', { className: 'yx-account-field' }, [
        tokenLabel, element(document, 'div', { className: 'yx-input-row' }, [tokenInput, save]), error,
    ]);
    const state = element(document, 'span', { className: 'yixue-connection-status', 'data-connected': 'false', text: '本地模式' });
    const balanceInput = element(document, 'input', { id: `${prefix}-balance`, type: 'text', readOnly: true, 'aria-label': '账户额度概况' });
    const balanceDetails = element(document, 'div', { 'data-yixue-balance': '', 'aria-label': '题库账户额度', 'aria-live': 'polite' });
    const refresh = button(document, '刷新额度', async () => {
        refresh.disabled = true;
        try { await Promise.all([bank.refreshBalance({ force: true }), bank.refreshCapabilities?.({ force: true })]); } catch (_) { error.textContent = '额度暂时无法刷新，请稍后重试。'; }
        finally { render(); }
    }, { id: `${prefix}-refresh`, className: 'yx-refresh', 'aria-label': '刷新额度（免费）' });
    const connect = button(document, '连接题库', () => onConnect?.(), { id: `${prefix}-connect`, className: dashboard ? 'yx-refresh yx-account-link' : 'yx-button' });
    const aiDetails = element(document, 'p', { className: 'yx-capabilities', 'data-yixue-capabilities': '', 'aria-live': 'polite' });
    const membership = createMembershipView(document);
    const details = dashboard ? element(document, 'details', { className: 'yixue-account-details' }, [
        element(document, 'summary', { text: '额度与 AI 服务详情' }), balanceDetails, aiDetails,
    ]) : null;
    const balanceField = element(document, 'div', { className: 'yx-account-field' }, [
        element(document, 'div', { className: 'yx-account-label' }, [element(document, 'span', { text: '题库账户' }), dashboard ? connect : state]),
        membership.element,
        element(document, 'div', { className: 'yx-balance-line' }, [balanceInput, refresh]),
        ...(dashboard ? [details] : [balanceDetails, aiDetails, element(document, 'div', { className: 'yx-account-connect' }, [connect])]),
    ]);
    section.append(tokenField, balanceField);
    function render() {
        const displayToken = getDisplayToken();
        if (displayToken !== renderedToken) {
            if (tokenInput.value === renderedToken) tokenInput.value = displayToken;
            renderedToken = displayToken;
        }
        const token = bank.getToken();
        const current = bank.balanceState();
        membership.render(current, Boolean(token), bank.routeState?.());
        const connection = connectionStatus(bank);
        state.dataset.connected = String(connection.connected);
        state.dataset.mode = connection.mode;
        state.textContent = connection.label;
        state.title = connection.detail;
        balanceInput.value = token ? (current.data ? `积分：${current.data.points}` + (current.error ? '（刷新失败）' : '') : current.loading ? '正在获取额度…' : current.error ? '额度获取失败，请重试' : '等待刷新额度') : '未连接题库';
        balanceDetails.textContent = token ? bank.balanceLabel() : '本地 Token 已保存在此浏览器；连接题库后可查看账户额度。';
        aiDetails.textContent = token ? bank.capabilitiesLabel?.() || '' : '';
        aiDetails.hidden = !aiDetails.textContent;
        refresh.disabled = !token || current.loading;
    }
    render();
    const unsubscribe = bank.onBalanceChange(render);
    if (bank.getToken()) Promise.all([bank.refreshBalance(), bank.refreshCapabilities?.()]).catch(() => {});
    return { element: section, render, tokenInput, destroy: unsubscribe };
}

module.exports = createAccountView;
