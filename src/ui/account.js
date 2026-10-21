'use strict';

const { element, button } = require('./dom');

function createAccountView({ document, bank, prefix, onConnect, onSave, getDisplayToken, dashboard = false }) {
    const section = element(document, 'div', { className: dashboard ? 'yixue-account' : 'yx-account-grid' });
    const tokenLabel = element(document, 'label', { className: 'yx-account-label', htmlFor: `${prefix}-token`, text: 'Token' });
    const tokenInput = element(document, 'input', {
        id: `${prefix}-token`, type: 'password', value: getDisplayToken(), autocomplete: 'off', spellcheck: false,
        'aria-label': '当前 Token', className: dashboard ? 'form-control' : '',
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
        try { await bank.refreshBalance({ force: true }); } catch (_) { error.textContent = '额度暂时无法刷新，请稍后重试。'; }
        finally { render(); }
    }, { id: `${prefix}-refresh`, className: 'yx-refresh', 'aria-label': '刷新额度（免费）' });
    const connect = button(document, '连接题库', () => onConnect?.(), { id: `${prefix}-connect`, className: 'yx-button' });
    const balanceField = element(document, 'div', { className: 'yx-account-field' }, [
        element(document, 'div', { className: 'yx-account-label' }, [element(document, 'span', { text: '题库账户' }), state]),
        element(document, 'div', { className: 'yx-balance-line' }, [balanceInput, refresh]),
        balanceDetails,
        element(document, 'div', { className: 'yx-account-connect' }, [connect]),
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
        state.dataset.connected = String(Boolean(token));
        state.textContent = token ? '已连接题库' : '本地模式';
        balanceInput.value = token ? (current.data ? `积分：${current.data.points}` : current.loading ? '正在获取额度…' : '等待刷新额度') : '未连接题库';
        balanceDetails.textContent = token ? bank.balanceLabel() : '本地 Token 已保存在此浏览器；连接题库后可查看账户额度。';
        refresh.disabled = !token || current.loading;
    }
    render();
    const unsubscribe = bank.onBalanceChange(render);
    if (bank.getToken()) Promise.resolve(bank.refreshBalance()).catch(() => {});
    return { element: section, render, tokenInput, destroy: unsubscribe };
}

module.exports = createAccountView;
