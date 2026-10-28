'use strict';
const { element, button, logText } = require('./dom');

function createTaskLog(document) {
    const log = element(document, 'div', { id: 'yixue-course-log', className: 'yixue-log', role: 'log', 'aria-label': '任务日志', 'aria-live': 'polite' });
    const empty = element(document, 'p', { id: 'yixue-log-empty', className: 'yixue-log-empty', text: '暂无记录，启动后将在这里显示任务动态。' });
    const count = element(document, 'span', { className: 'yixue-log-count', text: '0 条记录' });
    const follow = element(document, 'input', { type: 'checkbox', checked: true, 'aria-label': '跟随最新日志' });
    const filters = element(document, 'div', { className: 'yixue-log-filters', 'aria-label': '筛选日志' });
    let active = 'all', shown = 0;
    const matches = line => active === 'all' || (active === 'issues' ? ['error', 'warning'].includes(line.dataset.tone) : line.dataset.tone === 'success');
    const updateCount = () => {
        const total = log.childElementCount;
        log.classList.toggle('is-empty', shown === 0);
        empty.hidden = shown > 0;
        empty.textContent = total ? '暂无符合筛选条件的记录。' : '暂无记录，启动后将在这里显示任务动态。';
        count.textContent = active === 'all' ? total + ' 条记录' : shown + ' / ' + total + ' 条记录';
    };
    const render = () => {
        shown = 0;
        for (const line of log.children) { line.hidden = !matches(line); if (!line.hidden) shown++; }
        updateCount();
    };
    for (const [value, label, name] of [['all', '全部', '查看全部记录'], ['issues', '异常', '仅看异常记录'], ['success', '完成', '仅看完成记录']]) {
        const filter = button(document, label, () => {
            active = value;
            for (const node of filters.children) node.setAttribute('aria-pressed', String(node === filter));
            render();
        }, { 'aria-label': name, 'aria-pressed': String(value === active) });
        filters.append(filter);
    }
    const toolbar = element(document, 'div', { className: 'yixue-log-toolbar' }, [filters,
        element(document, 'label', { className: 'yixue-log-follow' }, [follow, '跟随最新']),
        button(document, '清空', () => { log.replaceChildren(); render(); }, { className: 'yixue-log-clear', 'aria-label': '清空日志' }),
    ]);
    return {
        log, toolbar, empty, count,
        append(message, tone = 'info') {
            const level = ['error', 'danger'].includes(tone) ? 'error' : ['warning', 'warn'].includes(tone) ? 'warning' : ['success', 'skipped'].includes(tone) ? tone : 'info';
            const labels = { error: '异常', warning: '提示', success: '完成', skipped: '跳过', info: '记录' };
            const now = new Date();
            const line = element(document, 'div', { className: 'yixue-log-line', 'data-tone': level }, [
                element(document, 'time', { dateTime: now.toISOString(), text: now.toLocaleTimeString('zh-CN', { hour12: false }) }),
                element(document, 'span', { className: 'yixue-log-badge', text: labels[level] }),
                element(document, 'span', { className: 'yixue-log-message', text: logText(message) }),
            ]);
            log.append(line);
            line.hidden = !matches(line); if (!line.hidden) shown++;
            while (log.childElementCount > 500) { if (!log.firstElementChild.hidden) shown--; log.firstElementChild.remove(); }
            updateCount();
            if (follow.checked) log.scrollTop = log.scrollHeight;
        },
    };
}
module.exports = createTaskLog;

