'use strict';

const { element, button, brand, appendLog } = require('./dom');
const createAccountView = require('./account');

function createDashboard(context, { courseName = '课程任务', onRun, onConnect }) {
    const { document, root, bank, settings, access, logoUrl, modal, saveToken, connect } = context;
    const main = element(document, 'main', { id: 'yixue-course-dashboard', className: 'yixue-dashboard' });
    const container = element(document, 'div', { className: 'container-fluid' });
    const status = element(document, 'span', { className: 'yixue-connection-status' });
    const topbar = element(document, 'header', { className: 'yixue-topbar' }, [
        element(document, 'div', { className: 'yixue-brand' }, [brand(document, logoUrl, 'yixue-brand-mark'),
            element(document, 'div', {}, [element(document, 'span', { className: 'yixue-brand-name', text: '易学助手' }), element(document, 'span', { className: 'yixue-brand-subtitle', text: '课程任务控制台' })]),
        ]), status,
    ]);
    const heading = element(document, 'div', { className: 'yixue-page-heading' }, [
        element(document, 'p', { className: 'yixue-eyebrow', text: 'COURSE WORKSPACE' }),
        element(document, 'h1', { id: 'yixue-course-name', text: courseName }),
        element(document, 'p', { className: 'yixue-page-subtitle', text: '管理学习任务，查看执行进度与每一步结果。' }),
    ]);
    const columns = element(document, 'div', { className: 'yixue-dashboard-columns' });
    const controls = element(document, 'div', { className: 'yixue-dashboard-column' });
    const reports = element(document, 'div', { className: 'yixue-dashboard-column' });
    function card(title, caption = '') {
        const body = element(document, 'div', { className: 'card-body' }, [element(document, 'div', { className: 'yixue-card-heading' }, [
            element(document, 'h2', { className: 'yixue-card-title', text: title }), element(document, 'span', { className: 'yixue-card-caption', text: caption }),
        ])]);
        return { element: element(document, 'section', { className: 'card' }, [body]), body };
    }
    const tasks = card('任务设置', '开关立即生效');
    const taskGrid = element(document, 'div', { className: 'yixue-task-grid' });
    const toggleNodes = new Map();
    const optionNodes = new Map();
    const toggleDefinitions = [
        ['doVideo', '视频任务', true], ['doDocument', '文档任务', true], ['doWork', '章节测验', true],
        ['doLive', '直播任务', true], ['doRenwu', '任务引擎', false], ['doNoMission', '非任务点', false],
    ];
    function refreshSettings() {
        for (const [key, , fallback] of toggleDefinitions) {
            const enabled = settings.get(key, fallback) === true;
            const node = toggleNodes.get(key);
            node.setAttribute('aria-checked', String(enabled));
            node.classList.toggle('btn-primary', enabled);
            node.classList.toggle('btn-light', !enabled);
        }
        for (const [key, input] of optionNodes) input.checked = settings.get(key, key === 'autoSubmit') === true;
    }
    for (const [key, label] of toggleDefinitions) {
        const toggle = button(document, '', () => {
            settings.set(key, toggle.getAttribute('aria-checked') !== 'true');
            refreshSettings();
        }, { id: key, className: 'btn', role: 'switch', 'aria-label': label, 'aria-checked': 'false' });
        toggle.append(element(document, 'span', { text: label }), element(document, 'span', { className: 'yixue-toggle-track', 'aria-hidden': 'true' }));
        toggleNodes.set(key, toggle);
        taskGrid.append(toggle);
    }
    const log = element(document, 'div', { id: 'yixue-course-log', className: 'yixue-log', role: 'log', 'aria-label': '任务日志', 'aria-live': 'polite' });
    let running = false;
    async function run(challenge) {
        if (running) return;
        setRunning(true);
        try { await onRun?.({ challenge }); }
        catch (failure) { appendLog(document, log, `任务执行失败：${failure?.message || failure}`, 'error'); }
        finally { setRunning(false); refreshSettings(); }
    }
    const start = button(document, '开始运行', () => run(false), { id: 'yixue-run-course', className: 'btn btn-success' });
    const challenge = button(document, '挑战模式', () => run(true), { id: 'yixue-run-challenge', className: 'btn btn-outline-primary' });
    function setRunning(value, options = {}) {
        running = Boolean(value);
        start.disabled = running;
        challenge.disabled = running;
        start.textContent = running ? '正在运行…' : '开始运行';
        main.dataset.running = String(running);
        if (options.challenge) refreshSettings();
    }
    tasks.body.append(taskGrid, element(document, 'div', { className: 'yixue-run-actions' }, [start, challenge]));
    const config = card('账户与配置', '保存在当前浏览器');
    const account = createAccountView({ document, bank, prefix: 'yixue-dashboard', onConnect: onConnect || connect, onSave: saveToken, getDisplayToken: access.getDisplayToken, dashboard: true });
    const fields = element(document, 'div', { className: 'yixue-config-fields' });
    function numericField(id, title, value, min, max, step, suffix) {
        const input = element(document, 'input', { id, type: 'number', value, min, max, step, required: true, className: 'form-control' });
        const wrapper = element(document, 'div', { className: 'yixue-config-field' }, [
            element(document, 'label', { htmlFor: id, text: title }),
            element(document, 'div', { className: 'yixue-number-field' }, [input, element(document, 'span', { className: 'yixue-field-suffix', text: suffix })]),
        ]);
        fields.append(wrapper);
        return input;
    }
    const speed = numericField('yixue-video-speed', '视频倍速', settings.get('beisu', 1), .5, 16, .25, '倍');
    const threshold = numericField('yixue-answer-threshold', '最低正确率', settings.get('vgqtlv', 85), 0, 100, 1, '%');
    const answerOptions = element(document, 'div', { className: 'yixue-answer-options' });
    for (const [key, label, description] of [
        ['autoSubmit', '章节测验达标后提交', '仅章节测验达到最低正确率时提交；作业和考试请核对后自行交卷。'],
        ['doAI', '启用 AI 参考答案', '题库查询时可使用 AI；服务权限与消耗以题库账户为准。'],
    ]) {
        const input = element(document, 'input', { id: `yixue-option-${key}`, type: 'checkbox', checked: settings.get(key, key === 'autoSubmit') === true });
        input.addEventListener('change', () => settings.set(key, input.checked));
        optionNodes.set(key, input);
        answerOptions.append(element(document, 'label', { className: 'yixue-answer-option', htmlFor: input.id }, [input,
            element(document, 'span', {}, [element(document, 'strong', { text: label }), element(document, 'small', { text: description })]),
        ]));
    }
    const saveStatus = element(document, 'span', { className: 'yixue-save-hint', role: 'status', text: '配置调整不影响当前面板操作' });
    const saveConfig = button(document, '保存配置', () => {
        if (!speed.reportValidity() || !threshold.reportValidity()) return;
        settings.set('beisu', Number(speed.value));
        settings.set('vgqtlv', Number(threshold.value));
        saveStatus.textContent = '配置已保存';
        const notice = modal.open({ id: 'yixue-settings-saved', title: '配置已保存', compact: true });
        notice.sheet.append(element(document, 'p', { className: 'yx-body-copy', text: '配置保存成功，已实时生效' }), button(document, '确定', () => notice.close(), { className: 'yx-button yx-primary' }));
    }, { id: 'yixue-save-settings', className: 'btn btn-success' });
    config.body.append(account.element, fields, answerOptions, element(document, 'div', { className: 'yixue-save-row' }, [saveConfig, saveStatus]));
    controls.append(tasks.element, config.element);
    const progressCard = card('任务进度', '以服务器确认结果为准');
    const total = element(document, 'span', { id: 'yixue-total-count', className: 'yixue-stat-value', text: '0' });
    const unconfirmed = element(document, 'span', { id: 'yixue-unconfirmed-count', className: 'yixue-stat-value accent', text: '0' });
    const stats = element(document, 'div', { className: 'yixue-stats' });
    for (const [label, value] of [['章节总数', total], ['尚未确认', unconfirmed]]) stats.append(element(document, 'div', { className: 'yixue-stat' }, [element(document, 'span', { className: 'yixue-stat-label', text: label }), value]));
    const progressLabel = element(document, 'span', { id: 'yixue-course-progress-value', text: '0%' });
    const progress = element(document, 'div', { id: 'yixue-course-progress', className: 'progress-bar', role: 'progressbar', 'aria-label': '当前任务进度', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' });
    progress.style.width = '0%';
    progressCard.body.append(stats, element(document, 'div', { className: 'yixue-progress-heading' }, [element(document, 'span', { text: '当前任务进度' }), progressLabel]),
        element(document, 'div', { className: 'progress' }, [progress]), element(document, 'p', { className: 'yixue-progress-note', text: '上传进度后仍需核对平台的最终完成状态。' }));
    const logCard = card('运行日志', '实时更新');
    logCard.body.append(log);
    reports.append(progressCard.element, logCard.element);
    columns.append(controls, reports);
    container.append(topbar, heading, columns, element(document, 'footer', { className: 'yixue-footer', text: '易学助手 · 让每一步都有迹可循' }));
    main.append(container);
    root.append(main);
    function updateConnection() {
        const connected = Boolean(bank.getToken());
        status.dataset.connected = String(connected);
        status.textContent = connected ? '已连接题库' : '本地模式';
    }
    const unsubscribe = bank.onBalanceChange(updateConnection);
    updateConnection();
    refreshSettings();
    let destroyed = false;
    return {
        element: main,
        log: (message, tone) => appendLog(document, log, message, tone),
        setProgress(percent) {
            const value = Number.isFinite(Number(percent)) ? Math.round(Math.max(0, Math.min(100, Number(percent)))) : 0;
            progress.style.width = `${value}%`;
            progress.setAttribute('aria-valuenow', String(value));
            progressLabel.textContent = `${value}%`;
        },
        setCounts({ total: totalValue, unconfirmed: remaining }) {
            if (totalValue !== undefined) total.textContent = String(totalValue);
            if (remaining !== undefined) unconfirmed.textContent = String(remaining);
        },
        setRunning, refreshSettings,
        destroy() { if (!destroyed) { destroyed = true; unsubscribe(); account.destroy(); main.remove(); } },
    };
}

module.exports = createDashboard;
