'use strict';

const dialogCss = require('./dialogs.css');
const dashboardCss = require('./dashboard.css');
const questionCss = require('./question-panel.css');
const { element, button } = require('./dom');
const createModalHost = require('./modal');
const createEntry = require('./entry');
const createDashboard = require('./dashboard');
const { createQuestionPanel } = require('./question-panel');

function createUi({ document, window, bank, access, settings, updates, logoUrl = require('./logo'), onTokenSaved }) {
    const root = element(document, 'div', { id: 'yixue-ui-root' });
    const style = element(document, 'style', { 'data-yixue-ui-style': '', text: [dialogCss, dashboardCss, questionCss].join('\n') });
    (document.head || document.documentElement).append(style);
    (document.body || document.documentElement).append(root);
    const modal = createModalHost({ document, window, root, logoUrl });
    const surfaces = new Set();
    let tokenFlight = null;
    let accessFlight = null;
    let disposed = false;
    const connect = () => window.open(bank.website?.() || 'https://tk.sanzwk.com', '_blank', 'noopener,noreferrer');
    async function saved(value, forAccess = false) {
        const token = forAccess ? access.saveToken(value) : bank.setToken(String(value).trim()) || bank.getToken();
        await onTokenSaved?.(token);
        if (bank.getToken()) await Promise.all([bank.refreshBalance({ force: true }), bank.refreshCapabilities?.({ force: true })]);
        return token;
    }
    const context = { document, window, root, bank, access, settings, updates, logoUrl, modal, connect, saveToken: value => saved(value, true) };
    function track(surface) {
        surfaces.add(surface);
        if (surface.onCleanup) surface.onCleanup(() => surfaces.delete(surface));
        else {
            const destroy = surface.destroy;
            surface.destroy = (...args) => { surfaces.delete(surface); return destroy(...args); };
        }
        return surface;
    }

    function requestApiToken() {
        if (disposed) return Promise.resolve('');
        if (tokenFlight) return tokenFlight;
        tokenFlight = new Promise(resolve => {
            const dialog = modal.open({ id: 'yixue-token-dialog', title: '手动填写 Token', subtitle: '填写题库「接口接入」提供的 API Token', compact: true, onClose: value => { tokenFlight = null; resolve(typeof value === 'string' ? value : ''); } });
            const input = element(document, 'input', { id: 'yixue-api-token', className: 'yx-form-input', type: 'password', autocomplete: 'off', spellcheck: false, value: bank.getToken(), 'aria-label': '搜题 API Token', placeholder: 'ys_…' });
            const error = element(document, 'p', { className: 'yx-error', role: 'status' });
            const save = button(document, '保存 Token', async () => {
                error.textContent = '';
                save.disabled = true;
                try { const token = await saved(input.value); if (!dialog.closed) dialog.close(token); }
                catch (failure) { error.textContent = failure?.message || 'Token 保存失败'; }
                finally { save.disabled = false; }
            }, { className: 'yx-button yx-primary' });
            dialog.sheet.append(input, error, element(document, 'div', { className: 'yx-input-row' }, [save, button(document, '取消', () => dialog.close(), { className: 'yx-button yx-quiet' })]));
            input.addEventListener('keydown', event => { if (event.key === 'Enter' && !save.disabled) save.click(); });
            window.queueMicrotask(() => { if (!dialog.closed) input.focus(); });
        });
        return tokenFlight;
    }

    function requestCourseAccess() {
        if (disposed) return Promise.resolve('');
        if (access.hasAccess()) return Promise.resolve(access.getDisplayToken());
        if (accessFlight) return accessFlight;
        accessFlight = new Promise(resolve => {
            const dialog = modal.open({ id: 'yixue-access-dialog', title: '首次使用易学助手', subtitle: '选择本地模式，或连接题库账户开始使用', compact: true, onClose: value => { accessFlight = null; resolve(typeof value === 'string' ? value : ''); } });
            const choices = element(document, 'div', { className: 'yx-choice-grid' });
            const choice = (label, description, action) => element(document, 'div', { className: 'yx-choice' }, [button(document, label, action, { className: 'yx-button' }), element(document, 'small', { text: description })]);
            choices.append(
                choice('随机生成 Token', '保存在本机，先使用视频和文档功能', () => { const token = access.createLocalToken(); dialog.close(token); }),
                choice('手动填写 Token', '已有题库 API Token 时填写', async () => { const token = await requestApiToken(); if (token && !dialog.closed) dialog.close(token); }),
                choice('连接题库', '前往题库网站获取账户 Token', connect),
            );
            dialog.sheet.append(element(document, 'p', { className: 'yx-body-copy', text: '本地模式无需连接题库；需要参考答案时可随时保存题库 Token。' }), choices);
        });
        return accessFlight;
    }

    function closeSurfaces() { modal.closeAll(); for (const surface of surfaces) surface.destroy(); surfaces.clear(); }
    window.addEventListener('yixue-course-ui-suppressed', closeSurfaces);
    return {
        requestApiToken, requestCourseAccess,
        showEntry: callbacks => disposed ? null : track(createEntry(context, callbacks || {})),
        showDashboard: options => disposed ? null : track(createDashboard(context, options || {})),
        showQuestionPanel: options => disposed ? null : track(createQuestionPanel(context, options || {})),
        destroy() {
            if (disposed) return;
            disposed = true;
            closeSurfaces();
            modal.destroy();
            window.removeEventListener('yixue-course-ui-suppressed', closeSurfaces);
            root.remove(); style.remove();
        },
    };
}

module.exports = { createUi };
