'use strict';
const createQuestionBankClient = require('./core/question-bank');
const createCourseAccess = require('./core/access');
const { createSettings } = require('./core/settings');
const { createTransport } = require('./core/transport');
const { classifyPage, readCourseContext, consoleUrl } = require('./core/routes');
const { claimCourseSurface } = require('./core/ownership');
const { createCollection } = require('./core/collection');
const { toText, delay, abortError, disposableScope } = require('./core/primitives');
const { createUi } = require('./ui/index');
const { createCourseRunner } = require('./platform/course-engine');
const { createQuestionWorkflow, collectQuestions } = require('./questions/index');

async function bootstrap() {
    if (document.documentElement.dataset.yixueBooted) return;
    document.documentElement.dataset.yixueBooted = '1';
    const route = classifyPage(location.href);
    if (route === 'entry' && !await claimCourseSurface(window, document)) return;
    const store = { read: (key, fallback) => GM_getValue(key, fallback), write: (key, value) => GM_setValue(key, value) };
    const settings = createSettings(store);
    const bank = createQuestionBankClient({ request: details => GM_xmlhttpRequest(details), getValue: store.read, setValue: store.write, toText });
    const access = createCourseAccess({ questionBank: bank, getValue: store.read, setValue: store.write });
    const context = readCourseContext(location.href, { title: document.title, cookie: document.cookie, document });
    const transport = createTransport({ base: location.origin, pageUrl: location.href, send: details => GM_xmlhttpRequest(details), createXhr: () => new XMLHttpRequest() });
    if (route === 'dashboard') { document.body.replaceChildren(); document.title = context.courseName + ' · 易学助手'; }
    const ui = createUi({ document, window, bank, access, settings });
    const lifetime = disposableScope();
    let activeController, questionFrame;
    lifetime.listen(window, 'pagehide', () => { activeController?.abort(); ui.destroy(); lifetime.dispose(); });
    function menu(name, handler) { if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand(name, handler); }
    menu('设置新版搜题 Token', () => ui.requestApiToken());
    menu('免费刷新题库额度', () => bank.getToken() ? bank.refreshBalance({ force: true }) : ui.requestApiToken());
    menu('恢复暂停的搜题请求', () => { bank.resume(); alert('已恢复题库查询，请在需要的页面重新启动。'); });
    menu('设置题库地址', () => {
        const value = prompt('请输入题库 HTTPS 根地址；更换地址后需重新填写 Token。', bank.base());
        if (value !== null) { try { bank.setBase(value); } catch (error) { alert(error.message); } }
    });
    const collection = createCollection({ bank, store, collect: collectQuestions, document, hostname: location.hostname, confirm: message => confirm(message), notify: message => alert(message) });
    menu('启用自动题目采集（首次需授权）', collection.enable);
    menu('关闭自动题目采集并清除 Token', () => collection.disable());
    menu('采集当前页面题目', collection.send);
    if (collection.enabled()) void collection.send().catch(() => {});

    function openChapterQuestions(href, { signal } = {}) {
        questionFrame?.remove();
        const section = document.createElement('section');
        section.className = 'yixue-chapter-question-view';
        section.style.cssText = 'max-width:1300px;margin:16px auto;padding:16px;background:white;border:1px solid #e9eaf0;border-radius:20px';
        const frame = document.createElement('iframe');
        frame.title = '章节测验核对区'; frame.style.cssText = 'width:100%;min-height:640px;border:0';
        section.append(frame); document.getElementById('yixue-ui-root').append(section); questionFrame = section;
        return new Promise((resolve, reject) => {
            if (signal?.aborted) { section.remove(); reject(abortError()); return; }
            let finished = false;
            const timer = setTimeout(() => finish(new Error('章节测验页面加载超时，请在学习通页面打开后核对。')), 15000);
            const cancel = () => { section.remove(); finish(abortError()); };
            const finish = (error, result) => {
                if (finished) return;
                finished = true; clearTimeout(timer); signal?.removeEventListener('abort', cancel);
                error ? reject(error) : resolve(result);
            };
            signal?.addEventListener('abort', cancel, { once: true });
            frame.onload = () => {
                try {
                    if (!frame.contentDocument) throw new Error('无法读取章节测验，请在原页面处理。');
                    finish(null, { document: frame.contentDocument, window: frame.contentWindow, close: () => section.remove() });
                } catch (error) { finish(error); }
            };
            frame.onerror = () => finish(new Error('章节测验页面加载失败。'));
            const target = new URL(href, context.origin);
            if (context.prefix && !target.pathname.startsWith(context.prefix)) target.pathname = context.prefix + target.pathname;
            frame.src = target.href;
        });
    }

    if (route === 'entry') {
        if (!await ui.requestCourseAccess()) return;
        const activate = selectors => {
            const target = document.querySelector(selectors);
            if (target) target.click(); else alert('未找到课程入口，请从学习通页面打开对应功能。');
        };
        ui.showEntry({
            onCourse: () => { window.top.location.href = consoleUrl(context); },
            onHomework: () => activate('.zy, a[href*="getAllWork"], a[href*="work/list"]'),
            onExam: () => activate('.ks, a[href*="exam-list"], a[href*="examnotes"]'),
            onVisits: () => {
                store.write('doxxcs', true);
                const tab = document.querySelector('[dataname="zj"], a[href*="studentstudy"]');
                if (tab) tab.click(); else alert('请打开课程的章节页面，学习次数辅助会在那里继续。');
            },
        });
        return;
    }

    if (route === 'dashboard') {
        if (!access.hasAccess() && !await ui.requestCourseAccess()) return;
        let surface, running = false;
        const run = async ({ challenge }) => {
            if (running) return;
            running = true;
            const scope = disposableScope();
            const controller = new AbortController(); activeController = controller;
            try {
                if (!context.courseId || !context.classId) throw new Error('课程参数不全，请从课程首页重新进入控制台。');
                if (challenge) { for (const key of ['doVideo', 'doDocument', 'doLive', 'doWork']) settings.set(key, true); surface.refreshSettings(); }
                scope.listen(document, 'visibilitychange', () => { if (document.hidden) surface.log('页面已转入后台，实际运行速度受浏览器限制，请留意任务日志。', 'warning'); });
                scope.listen(window, 'storage', event => { if (event.key === 'yixue-active-course' && event.newValue && event.newValue !== context.courseId) surface.log('检测到其他课程正在运行，请避免同账号并行执行。', 'warning'); });
                surface.log('开始查询任务');
                const emit = event => {
                    if (controller.signal.aborted) return;
                    if (event.type === 'log') surface.log(event.message, event.tone);
                    if (event.type === 'progress') surface.setProgress(event.percent);
                    if (event.type === 'counts') surface.setCounts(event);
                };
                const questions = {
                    openPage: openChapterQuestions,
                    run: (page, options) => createQuestionWorkflow({ bank, settings, transport, unsafeWindow: page.defaultView || unsafeWindow, onLog: (message, tone) => surface.log(message, tone) }).run(page, options),
                };
                await createCourseRunner({ context, transport, settings, bank, questions, emit }).run({ challenge, signal: controller.signal });
            } catch (error) {
                surface.log((error.name === 'AbortError' ? '任务已中止' : '任务运行失败：' + error.message) + '。处理后可点击启动重试。', 'danger');
            } finally { scope.dispose(); running = false; if (activeController === controller) activeController = null; }
        };
        surface = ui.showDashboard({ courseName: context.courseName, onRun: run, onConnect: () => ui.requestApiToken() });
        surface.log('脚本初始化成功，点击启动按钮开始刷课', 'success');
        if (!bank.getToken()) surface.log('本地随机 Token 未连接题库，视频、文档可先使用；章节答题将跳过，请填写题库 Token 后再启用。', 'warning');
        return;
    }

    if (['work-list', 'exam-list', 'work', 'exam'].includes(route)) {
        const panel = ui.showQuestionPanel({ title: route.startsWith('exam') ? '考试参考答案' : '作业参考答案', onConnect: () => ui.requestApiToken(), onRefresh: () => bank.refreshBalance({ force: true }), onAiToggle: enabled => settings.set('doAI', enabled) });
        if (route.endsWith('-list')) { panel.log(route === 'work-list' ? '脚本准备就绪，请进入作业' : '脚本准备就绪，请进入考试'); return; }
        if (!bank.getToken()) { panel.log('题库未连接，请保存题库 Token 后刷新页面。', 'warning'); return; }
        const controller = new AbortController(); activeController = controller;
        const workflow = createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog: panel.log, waitIfPaused: panel.waitIfPaused });
        const state = document.createElement('p'); state.dataset.yixueQuestionState = ''; state.style.cssText = 'margin:8px;font:13px sans-serif'; panel.element.append(state);
        try {
            const result = route === 'exam'
                ? await require('./questions/navigation').runQuestionPages(workflow, document, { signal: controller.signal, waitIfPaused: panel.waitIfPaused, onPage: pageResult => panel.setSummary(pageResult) })
                : await workflow.run(document, { signal: controller.signal });
            panel.setSummary(result);
            state.textContent = result.stopped ? '查询已停止，请检查题库账户或额度。' : '参考答案已填写，请人工核对。';
            panel.log(route === 'work' ? '作业作答完成，请检查后自行提交（如果不交别忘了点保存）' : '本页作答完成，请核对后继续，最终交卷由你确认。');
        } catch (error) { panel.log('答题流程已停止：' + error.message, 'danger'); }
        finally { if (activeController === controller) activeController = null; }
        return;
    }

    if (route === 'study' && store.read('doxxcs', false)) {
        const panel = ui.showQuestionPanel({ title: '章节访问辅助' });
        const available = [...document.querySelectorAll('a[href*="studentstudy"]')].filter(link => link.origin === location.origin);
        const visitKey = 'yixueChapterVisits:' + context.classId;
        const seen = new Set(store.read(visitKey, []));
        seen.add(location.href); store.write(visitKey, [...seen].slice(-300));
        const next = available.find(link => !seen.has(link.href));
        panel.log('已访问 ' + seen.size + ' 个章节页面；学习通的实际统计结果请在平台查看。');
        if (next) { await delay(1500); if (store.read('doxxcs', false)) next.click(); }
        else { store.write('doxxcs', false); panel.log('本次可访问的章节已遍历结束。'); }
    }
}
module.exports = { bootstrap };
