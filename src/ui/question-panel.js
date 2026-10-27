'use strict';

const { element, button, brand, appendLog } = require('./dom');
const createMembershipView = require('./membership');
const createProductInfo = require('./product-info');

function maskToken(token) {
    if (!token) return '尚未连接题库';
    return token.length > 12 ? `${token.slice(0, 6)}••••${token.slice(-4)}` : '••••••••';
}

function createQuestionPanel(context, { title = '题目助手', onConnect, onRefresh, onAiToggle, onPause }) {
    const { document, window, root, bank, settings, logoUrl, connect } = context;
    const panel = element(document, 'aside', { id: 'yixue-question-panel', className: 'yixue-question-panel', 'aria-label': title, 'data-yixue-course-ui': 'true' });
    const titleText = element(document, 'strong', { text: title });
    const header = element(document, 'div', { className: 'yixue-question-header' }, [brand(document, logoUrl, 'yixue-question-mark'), titleText]);
    const body = element(document, 'div', { className: 'yixue-question-body' });
    let minimized = false;
    const minimize = button(document, '−', () => {
        minimized = !minimized;
        body.hidden = minimized;
        minimize.textContent = minimized ? '+' : '−';
        minimize.setAttribute('aria-label', minimized ? '展开面板' : '最小化面板');
        minimize.setAttribute('aria-expanded', String(!minimized));
        resize();
    }, { className: 'yixue-panel-icon', 'aria-label': '最小化面板', 'aria-expanded': 'true' });
    header.append(minimize);
    const token = element(document, 'span', { className: 'yixue-masked-token', 'data-masked-token': '', text: maskToken(bank.getToken()) });
    const balance = element(document, 'div', { className: 'yixue-question-balance', 'aria-label': '题库账户额度', 'aria-live': 'polite' });
    const membership = createMembershipView(document);
    const logs = element(document, 'div', { className: 'yixue-question-log', role: 'log', 'aria-label': '题目日志', 'aria-live': 'polite' });
    const summary = element(document, 'div', { className: 'yixue-question-summary', role: 'status', text: '等待处理题目' });
    const connectButton = button(document, '连接题库', () => Promise.resolve().then(() => (onConnect || connect)()).catch(error => appendLog(document, logs, error?.message || error, 'error')), { className: 'yixue-panel-button' });
    const refresh = button(document, '刷新额度（免费）', async () => {
        refresh.disabled = true;
        try { await (onRefresh ? onRefresh() : bank.refreshBalance({ force: true })); }
        catch (_) { appendLog(document, logs, '额度暂时无法刷新，请稍后重试。', 'error'); }
        finally { renderBalance(); }
    }, { className: 'yixue-panel-button' });
    const aiToggle = button(document, 'AI 参考答案', async () => {
        const enabled = aiToggle.getAttribute('aria-checked') !== 'true';
        settings.set('doAI', enabled);
        aiToggle.setAttribute('aria-checked', String(enabled));
        try { await onAiToggle?.(enabled); }
        catch (error) { appendLog(document, logs, error?.message || error, 'error'); }
    }, { className: 'yixue-panel-button yixue-ai-toggle', role: 'switch', 'aria-checked': String(settings.get('doAI', false) === true) });
    let paused = false;
    let destroyed = false;
    const pauseWaiters = new Set();
    async function setPaused(value, { notify = true } = {}) {
        paused = Boolean(value);
        pause.textContent = paused ? '继续' : '暂停';
        pause.setAttribute('aria-pressed', String(paused));
        if (!paused) for (const resume of [...pauseWaiters]) resume();
        try { if (notify) await onPause?.(paused); }
        catch (error) { appendLog(document, logs, error?.message || error, 'error'); }
    }
    const pause = button(document, '暂停', () => setPaused(!paused), { className: 'yixue-panel-button', 'aria-pressed': 'false' });
    const productInfo = createProductInfo(context, { compact: true });
    body.append(token, membership.element, balance, element(document, 'div', { className: 'yixue-question-actions' }, [connectButton, refresh]),
        element(document, 'div', { className: 'yixue-question-actions' }, [aiToggle, pause]), summary, logs, productInfo.element);
    panel.append(header, body);
    root.append(panel);
    function renderBalance() {
        token.textContent = maskToken(bank.getToken());
        membership.render(bank.balanceState(), Boolean(bank.getToken()), bank.routeState?.());
        balance.textContent = bank.getToken() ? bank.balanceLabel() : '未连接题库；可先设置搜题 API Token。';
        refresh.disabled = !bank.getToken() || bank.balanceState().loading;
    }
    renderBalance();
    const unsubscribe = bank.onBalanceChange(renderBalance);
    if (bank.getToken()) Promise.resolve(bank.refreshBalance()).catch(() => {});
    let drag = null;
    const move = event => {
        if (!drag || (drag.pointerId !== undefined && drag.pointerId !== event.pointerId)) return;
        const box = panel.getBoundingClientRect();
        panel.style.left = `${Math.max(8, Math.min(window.innerWidth - box.width - 8, drag.left + event.clientX - drag.x))}px`;
        panel.style.top = `${Math.max(8, Math.min(window.innerHeight - box.height - 8, drag.top + event.clientY - drag.y))}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    };
    const end = () => { drag = null; panel.classList.remove('is-dragging'); };
    const resize = () => {
        if (!panel.style.left) return;
        const box = panel.getBoundingClientRect();
        panel.style.left = `${Math.max(8, Math.min(window.innerWidth - box.width - 8, box.left))}px`;
        panel.style.top = `${Math.max(8, Math.min(window.innerHeight - box.height - 8, box.top))}px`;
    };
    header.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('button, input, a')) return;
        const box = panel.getBoundingClientRect();
        drag = { x: event.clientX, y: event.clientY, left: box.left, top: box.top, pointerId: event.pointerId };
        panel.classList.add('is-dragging');
        header.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    });
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('resize', resize);
    return {
        element: panel,
        log: (message, tone) => appendLog(document, logs, message, tone),
        setSummary(stats = {}) {
            const labels = { total: '共', completed: '完成', answered: '已填', matched: '命中', skipped: '跳过', failed: '失败', pending: '待核实', unconfirmed: '待核实' };
            summary.textContent = Object.entries(labels).filter(([key]) => stats[key] !== undefined).map(([key, label]) => `${label} ${stats[key]}`).join(' · ') || '等待处理题目';
        },
        isPaused: () => paused,
        setPaused,
        waitIfPaused(signal) {
            if (signal?.aborted) return Promise.reject(signal.reason || new window.DOMException('操作已取消', 'AbortError'));
            if (!paused || destroyed) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const cleanup = () => { pauseWaiters.delete(resume); signal?.removeEventListener('abort', abort); };
                const resume = () => { cleanup(); resolve(); };
                const abort = () => { cleanup(); reject(signal.reason || new window.DOMException('操作已取消', 'AbortError')); };
                pauseWaiters.add(resume);
                signal?.addEventListener('abort', abort, { once: true });
            });
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            paused = false;
            for (const resume of [...pauseWaiters]) resume();
            unsubscribe();
            productInfo.destroy();
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
            window.removeEventListener('resize', resize);
            panel.remove();
        },
    };
}

module.exports = { createQuestionPanel, maskToken };
