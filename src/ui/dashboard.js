'use strict';

const { element, button, brand } = require('./dom');
const createAccountView = require('./account');
const createTaskLog = require('./task-log');
const createProgressRing = require('./progress-ring');
const { abortError } = require('../core/primitives');
const connectionStatus = require('./connection');
const createScreenAwake = require('../core/screen-awake');
const createProductInfo = require('./product-info');
const product = require('../core/product');

function createDashboard(context, { courseName = '课程任务', onRun, onConnect }) {
    const { document, window, root, bank, settings, access, logoUrl, modal, saveToken, connect } = context;
    const main = element(document, 'main', { id: 'yixue-course-dashboard', className: 'yixue-dashboard' });
    const container = element(document, 'div', { className: 'container-fluid' });
    const status = element(document, 'span', { className: 'yixue-connection-status' });
    const heading = element(document, 'div', { className: 'yixue-page-heading' }, [
        element(document, 'span', { className: 'yixue-eyebrow', text: '当前课程' }),
        element(document, 'h1', { id: 'yixue-course-name', text: courseName, title: courseName }),
    ]);
    const topbar = element(document, 'header', { className: 'yixue-topbar' }, [
        element(document, 'div', { className: 'yixue-brand' }, [brand(document, logoUrl, 'yixue-brand-mark'),
            element(document, 'div', {}, [element(document, 'span', { className: 'yixue-brand-name', text: product.brand }), element(document, 'span', { className: 'yixue-brand-subtitle', text: '课程任务控制台' })]),
        ]), heading, status,
    ]);
    const columns = element(document, 'div', { className: 'yixue-dashboard-columns' });
    const controls = element(document, 'aside', { className: 'yixue-dashboard-column yixue-controls', 'aria-label': '任务控制与配置' });
    const reports = element(document, 'div', { className: 'yixue-dashboard-column yixue-reports' });
    function card(title, caption = '') {
        const body = element(document, 'div', { className: 'card-body' }, [element(document, 'div', { className: 'yixue-card-heading' }, [
            element(document, 'h2', { className: 'yixue-card-title', text: title }), element(document, 'span', { className: 'yixue-card-caption', text: caption }),
        ])]);
        return { element: element(document, 'section', { className: 'card' }, [body]), body };
    }
    const tasks = card('任务设置', '开关对后续任务生效');
    tasks.element.classList.add('yixue-task-card');
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
        for (const [key, input] of optionNodes) input.checked = settings.get(key, key === 'autoSubmit' || key === 'keepAwake') === true;
        screenAwake.update({ enabled: settings.get('keepAwake', true) === true });
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
    const activityLog = createTaskLog(document);
    const { log } = activityLog;
    const runState = element(document, 'span', { className: 'yixue-run-state', role: 'status', text: '待开始' });
    const awakeStatus = element(document, 'span', { className: 'yixue-awake-status', role: 'status', 'aria-live': 'polite' });
    const screenAwake = createScreenAwake({ document, window, onChange: state => {
        awakeStatus.dataset.state = state;
        awakeStatus.textContent = ({ idle: '任务开始后自动保持亮屏', disabled: '保持亮屏已关闭', requesting: '正在申请保持亮屏…', active: '已保持亮屏', background: '已切到后台，返回页面后恢复亮屏', unavailable: '浏览器不支持保持亮屏，请手动延长自动锁屏时间', blocked: '保持亮屏未获允许，请保持页面在前台', released: '系统已释放亮屏保护，返回页面后重试' })[state];
    } });
    const keepAwake = element(document, 'input', { id: 'yixue-option-keepAwake', type: 'checkbox', checked: settings.get('keepAwake', true) === true });
    keepAwake.addEventListener('change', () => { settings.set('keepAwake', keepAwake.checked); screenAwake.update({ enabled: keepAwake.checked }); });
    optionNodes.set('keepAwake', keepAwake);
    const awakeOption = element(document, 'div', { className: 'yixue-awake-option' }, [
        element(document, 'label', { className: 'yixue-answer-option', htmlFor: keepAwake.id }, [keepAwake, element(document, 'span', {}, [
            element(document, 'strong', { text: '运行时保持亮屏' }),
            element(document, 'small', { text: '仅前台运行时生效，切后台或锁屏仍可能暂停。' }), awakeStatus,
        ])]),
    ]);
    let running = false, runController = null, runTimer = null;
    async function run(challenge) {
        if (running) { screenAwake.update({ running: false }); runController?.abort(abortError()); return; }
        const controller = new AbortController();
        runController = controller;
        setRunning(true);
        try { await onRun?.({ challenge, signal: controller.signal }); }
        catch (failure) {
            if (controller.signal.aborted || failure?.name === 'AbortError') activityLog.append('任务已停止，可重新开始。');
            else activityLog.append(`任务执行失败：${failure?.message || failure}`, 'error');
        }
        finally { if (runController === controller) { runController = null; setRunning(false); refreshSettings(); } }
    }
    const start = button(document, '开始运行', () => run(false), { id: 'yixue-run-course', className: 'btn btn-success' });
    const challenge = button(document, '挑战模式', () => run(true), { id: 'yixue-run-challenge', className: 'btn btn-outline-primary' });
    function setRunning(value, options = {}) {
        running = Boolean(value);
        screenAwake.update({ running });
        start.disabled = false;
        challenge.disabled = running;
        start.textContent = running ? '停止运行' : '开始运行';
        start.setAttribute('aria-label', start.textContent);
        main.dataset.running = String(running);
        clearInterval(runTimer); runTimer = null;
        if (running) {
            const startedAt = Date.now();
            runTimer = setInterval(() => { runState.textContent = '运行中 · ' + Math.floor((Date.now() - startedAt) / 1000) + '秒'; }, 1000);
        }
        runState.textContent = running ? '运行中' : '本轮已结束';
        if (!running && taskStatus.dataset.status === 'running') {
            taskStatus.dataset.status = 'stopped'; taskStatus.textContent = '已结束';
            progress.element.dataset.status = 'stopped';
            resourceTitle.textContent = '上次任务';
        }
        if (options.challenge) refreshSettings();
    }
    tasks.body.append(taskGrid, awakeOption, element(document, 'div', { className: 'yixue-run-actions' }, [start, challenge]));
    const config = card('账户与配置', '保存在当前浏览器');
    config.element.classList.add('yixue-config-card');
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
    const threshold = numericField('yixue-answer-threshold', '最低答案匹配率', settings.get('vgqtlv', 85), 0, 100, 1, '%');
    const answerOptions = element(document, 'div', { className: 'yixue-answer-options' });
    for (const [key, label, description] of [
        ['autoSubmit', '章节测验达标后提交', '按已填写题目占比判断，不代表实际得分；作业和考试请核对后自行交卷。'],
        ['doAI', '启用 AI 参考答案', '题库查询时可使用 AI；服务权限与消耗以题库账户为准。'],
    ]) {
        const input = element(document, 'input', { id: `yixue-option-${key}`, type: 'checkbox', checked: settings.get(key, key === 'autoSubmit') === true });
        input.addEventListener('change', () => settings.set(key, input.checked));
        optionNodes.set(key, input);
        answerOptions.append(element(document, 'label', { className: 'yixue-answer-option', htmlFor: input.id }, [input,
            element(document, 'span', {}, [element(document, 'strong', { text: label }), element(document, 'small', { text: description })]),
        ]));
    }
    const saveStatus = element(document, 'span', { className: 'yixue-save-hint', role: 'status', text: '保存后应用于后续视频进度上报' });
    const saveConfig = button(document, '保存配置', () => {
        if (!speed.reportValidity() || !threshold.reportValidity()) return;
        settings.set('beisu', Number(speed.value));
        settings.set('vgqtlv', Number(threshold.value));
        saveStatus.textContent = '已保存 · 倍速将在下次视频进度上报时应用';
        const notice = modal.open({ id: 'yixue-settings-saved', title: '配置已保存', compact: true });
        notice.sheet.append(element(document, 'p', { className: 'yx-body-copy', text: '配置已保存。当前视频将在下一次进度上报时应用新倍速；平台限制倍速时会在日志中提示。' }), button(document, '确定', () => notice.close(), { className: 'yx-button yx-primary' }));
    }, { id: 'yixue-save-settings', className: 'btn btn-success' });
    config.body.append(account.element, fields, answerOptions, element(document, 'div', { className: 'yixue-save-row' }, [saveConfig, saveStatus]));
    controls.append(tasks.element, config.element);
    const progressCard = card('任务进度');
    progressCard.element.classList.add('yixue-overview');
    progressCard.body.querySelector('.yixue-card-heading').append(runState);
    const total = element(document, 'span', { id: 'yixue-total-count', className: 'yixue-stat-value', text: '0' });
    const unconfirmed = element(document, 'span', { id: 'yixue-unconfirmed-count', className: 'yixue-stat-value accent', text: '0' });
    const completed = element(document, 'span', { id: 'yixue-completed-count', className: 'yixue-stat-value', text: '0' });
    const confirmedTasks = element(document, 'span', { id: 'yixue-confirmed-task-count', className: 'yixue-stat-value', text: '0' });
    const stats = element(document, 'div', { className: 'yixue-stats' });
    for (const [label, value] of [['章节总数', total], ['已完成章节', completed], ['待处理章节', unconfirmed], ['本轮已确认任务', confirmedTasks]]) stats.append(element(document, 'div', { className: 'yixue-stat' }, [element(document, 'span', { className: 'yixue-stat-label', text: label }), value]));
    const chapterProgress = createProgressRing(document, { id: 'yixue-chapter-progress', labelId: 'yixue-chapter-progress-value', label: '章节完成进度', caption: '章节完成', tone: 'green' });
    const chapterProgressLabel = element(document, 'strong', { className: 'yixue-chapter-count', text: '0 / 0 章' });
    const taskName = element(document, 'strong', { id: 'yixue-current-task', text: '等待启动任务' });
    const taskStatus = element(document, 'span', { className: 'yixue-task-status', text: '待开始' });
    const resourceTitle = element(document, 'span', { className: 'yixue-progress-title', text: '当前任务' });
    const chapterName = element(document, 'span', { className: 'yixue-current-chapter', text: '启动后显示正在处理的章节与资源' });
    const summaryLabel = element(document, 'p', { id: 'yixue-run-summary', className: 'yixue-summary-line', text: '本轮暂无任务记录' });
    const remainingLabel = element(document, 'p', { id: 'yixue-video-remaining', className: 'yixue-progress-note', role: 'status', 'aria-live': 'polite', text: '当前视频预计剩余：—' });
    const progress = createProgressRing(document, { id: 'yixue-course-progress', labelId: 'yixue-course-progress-value', label: '当前任务进度', caption: '当前任务' });
    progressCard.body.append(element(document, 'div', { className: 'yixue-overview-detail' }, [
        element(document, 'div', { className: 'yixue-course-overall' }, [chapterProgress.element,
            element(document, 'div', { className: 'yixue-progress-copy' }, [
                element(document, 'span', { className: 'yixue-progress-title', text: '章节完成进度' }), chapterProgressLabel,
                element(document, 'p', { className: 'yixue-progress-note', text: '整章必做任务全部确认后，计入已完成。' }),
            ])]),
        element(document, 'div', { className: 'yixue-current-resource' }, [
            progress.element, element(document, 'div', { className: 'yixue-progress-copy' }, [
                element(document, 'div', { className: 'yixue-resource-heading' }, [resourceTitle, taskStatus]),
                taskName, chapterName, remainingLabel,
            ])]),
    ]), stats, summaryLabel);
    const logCard = card('运行日志', '实时更新');
    const productInfo = createProductInfo(context);
    logCard.element.classList.add('yixue-activity-card');
    logCard.body.querySelector('.yixue-card-heading').append(activityLog.count);
    logCard.body.append(productInfo.element, activityLog.toolbar, log, activityLog.empty);
    reports.append(progressCard.element, logCard.element);
    columns.append(controls, reports);
    container.append(topbar, columns, element(document, 'footer', { className: 'yixue-footer' }, [element(document, 'a', { text: '易学助手官网', href: 'https://www.yxzs.love/', target: '_blank', rel: 'noopener noreferrer' }), ' · 课程任务控制台']));
    main.append(container);
    root.append(main);
    function updateConnection() {
        const current = connectionStatus(bank);
        status.dataset.connected = String(current.connected);
        status.dataset.mode = current.mode;
        status.textContent = current.label;
        status.title = current.detail;
    }
    const unsubscribe = bank.onBalanceChange(updateConnection);
    updateConnection();
    refreshSettings();
    let destroyed = false;
    return {
        element: main,
        log: activityLog.append,
        setTask({ name, chapter, status }) {
            taskName.textContent = name;
            taskName.title = name;
            chapterName.textContent = chapter ? '当前章节 · ' + chapter : '';
            chapterName.title = chapter || '';
            taskStatus.dataset.status = status;
            progress.element.dataset.status = status;
            resourceTitle.textContent = ({ running: '正在处理', confirmed: '最近完成', skipped: '最近跳过', failed: '任务异常', pending: '待核实任务' })[status] || '当前任务';
            taskStatus.textContent = ({ running: '处理中', confirmed: '已确认', skipped: '已跳过', failed: '失败', pending: '待核实' })[status] || '待开始';
        },
        setSummary({ confirmed = 0, skipped = 0, failed = 0, pending = 0, chapterIssues = 0 }) {
            confirmedTasks.textContent = String(confirmed);
            summaryLabel.textContent = `本轮已确认 ${confirmed} 项 · 跳过 ${skipped} 项 · 失败 ${failed} 项 · 待核实 ${pending} 项` + (chapterIssues ? ` · 章节读取异常 ${chapterIssues} 项` : '');
        },
        setProgress(percent) {
            progress.setValue(percent);
        },
        setRemaining(seconds) {
            if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) {
                remainingLabel.textContent = '当前视频预计剩余：—';
                return;
            }
            const total = Math.max(0, Math.ceil(Number(seconds)));
            const hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60), rest = total % 60;
            const text = (hours ? hours + '小时' : '') + (minutes || hours ? minutes + '分' : '') + rest + '秒';
            remainingLabel.textContent = '当前视频预计剩余：' + text;
        },
        setCounts({ total: totalValue, unconfirmed: remaining }) {
            if (totalValue !== undefined) total.textContent = String(totalValue);
            if (remaining !== undefined) unconfirmed.textContent = String(remaining);
            const done = Math.max(0, Number(total.textContent) - Number(unconfirmed.textContent));
            completed.textContent = String(done);
            chapterProgressLabel.textContent = done + ' / ' + total.textContent + ' 章';
            const value = Number(total.textContent) ? Math.round(done / Number(total.textContent) * 100) : 0;
            chapterProgress.setValue(value);
        },
        setRunning, refreshSettings,
        destroy() { if (!destroyed) { destroyed = true; screenAwake.destroy(); runController?.abort(abortError()); clearInterval(runTimer); unsubscribe(); account.destroy(); productInfo.destroy(); main.remove(); } },
    };
}

module.exports = createDashboard;
