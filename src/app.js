'use strict';
const createQuestionBankClient = require('./core/question-bank');
const createCourseAccess = require('./core/access');
const { createSettings } = require('./core/settings');
const { createTransport } = require('./core/transport');
const { classifyPage, readCourseContext, consoleUrl, isSupportedSite } = require('./core/routes');
const { claimCourseSurface, isManagedQuestionFrame } = require('./core/ownership');
const { createCollection } = require('./core/collection');
const { toText, abortError, disposableScope } = require('./core/primitives');
const { createUi } = require('./ui/index');
const prepareDashboardPage = require('./ui/dashboard-page');
const { createCourseRunner } = require('./platform/course-engine');
const { createQuestionWorkflow, collectQuestions } = require('./questions/index');
const { isReviewDocument } = require('./questions/reader');
const { isReviewPath } = require('./questions/collection-answer');
const { classifyZhihuishu, createZhihuishuStudy } = require('./platform/zhihuishu');
const { createCourseActivity } = require('./core/course-activity');
const { createChapterVisits } = require('./platform/chapter-visits');
const { prepareVideoSession } = require('./platform/video-session');
const { createScriptGuard } = require('./core/script-guard');
const { createUpdateChecker } = require('./core/updates');
const { support } = require('./core/product');
const showScriptConflict = require('./ui/conflict');
const restoreTargets = new WeakSet();
const menuTargets = new WeakMap();

async function bootstrap({ restored = false } = {}) {
    if (!isSupportedSite(location.href) || isManagedQuestionFrame(window)) return;
    const zhihuishu = classifyZhihuishu(location.href);
    const route = zhihuishu === 'questions' ? 'exam' : zhihuishu ? 'zhihuishu-' + zhihuishu : classifyPage(location.href);
    const reviewPage = isReviewPath(location.href) || (['work', 'exam', 'other'].includes(route) && isReviewDocument(document));
    const questionPage = reviewPage || ['work', 'exam', 'zhihuishu-study'].includes(route) || /\/(?:work\/phone\/work|modules\/work\/index\.html)/.test(location.pathname);
    if (route === 'other' && !questionPage) return;
    if (!restoreTargets.has(window)) {
        restoreTargets.add(window);
        window.addEventListener('pageshow', event => {
            if (event.persisted && !document.documentElement.dataset.yixueBooted) {
                void bootstrap({ restored: true }).catch(error => { if (error.name !== 'AbortError') console.error('[易学助手]', error); });
            }
        });
    }
    const lifetime = disposableScope();
    let activeController, questionFrame, collection, ui;
    const guard = createScriptGuard({ document, window, pageWindow: unsafeWindow, onConflict: () => {
        activeController?.abort(); collection?.dispose(); ui?.destroy(); lifetime.dispose();
        showScriptConflict({ document, window });
    } });
    lifetime.add(() => guard.destroy());
    if (guard.signal.aborted) { lifetime.dispose(); return; }
    document.documentElement.dataset.yixueBooted = '1';
    lifetime.add(() => { delete document.documentElement.dataset.yixueBooted; });
    lifetime.listen(window, 'pagehide', () => { activeController?.abort(); collection?.dispose(); ui?.destroy(); lifetime.dispose(); });
    if (route === 'entry' && !await claimCourseSurface(window, document, { signal: guard.signal })) { lifetime.dispose(); return; }
    guard.assertAllowed();
    const store = { read: (key, fallback) => GM_getValue(key, fallback), write: (key, value) => GM_setValue(key, value) };
    const settings = createSettings(store);
    const bank = createQuestionBankClient({ request: details => GM_xmlhttpRequest(details), getValue: store.read, setValue: store.write, toText });
    const access = createCourseAccess({ questionBank: bank, getValue: store.read, setValue: store.write });
    const context = readCourseContext(location.href, { title: document.title, cookie: document.cookie, document, serverHost: unsafeWindow.ServerHost?.mooc1Domain });
    if (route === 'dashboard' && context.origin !== location.origin) {
        lifetime.dispose();
        location.replace(consoleUrl(context));
        return;
    }
    const transport = createTransport({ base: location.origin, pageUrl: location.href, send: details => GM_xmlhttpRequest(details), createXhr: () => new XMLHttpRequest() });
    let releaseDashboardPage;
    if (route === 'dashboard') {
        document.body.replaceChildren(); document.title = context.courseName + ' · 易学助手';
        releaseDashboardPage = prepareDashboardPage({ document, window });
    }
    collection = createCollection({ bank, store, collect: collectQuestions, document, hostname: location.hostname });
    const updates = createUpdateChecker({ request: details => GM_xmlhttpRequest(details), store });
    lifetime.add(() => updates.destroy());
    ui = createUi({ document, window, bank, access, settings, updates, onTokenSaved: () => collection.send() });
    if (releaseDashboardPage) lifetime.add(releaseDashboardPage);
    if (window.top === window) void updates.check();
    let menu = menuTargets.get(window);
    if (!menu) { menu = { ui: null, registered: false }; menuTargets.set(window, menu); }
    menu.ui = ui;
    if (!menu.registered && typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('设置搜题 Token', () => menu.ui?.requestApiToken());
        menu.registered = true;
    }
    lifetime.add(() => { if (menu.ui === ui) menu.ui = null; });
    if (questionPage) {
        void collection.send().catch(() => {});
        let timer;
        const observer = new MutationObserver(records => {
            if (!records.some(record => !record.target.parentElement?.closest('#yixue-ui-root') && record.target.id !== 'yixue-ui-root')) return;
            clearTimeout(timer);
            timer = setTimeout(() => { void collection.send().catch(() => {}); }, 500);
        });
        observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-answer-status'] });
        lifetime.add(() => { clearTimeout(timer); observer.disconnect(); });
    }
    if (route === 'dashboard') {
        const favicon = document.createElement('link');
        favicon.rel = 'icon'; favicon.href = require('./ui/logo');
        (document.head || document.documentElement).append(favicon);
        lifetime.add(() => favicon.remove());
    }
    if (reviewPage) return;

    function openChapterQuestions(href, { signal } = {}) {
        if (signal?.aborted) return Promise.reject(abortError());
        if (document.querySelectorAll('.yixue-chapter-question-view[data-retained="true"]').length >= 3) {
            return Promise.reject(Object.assign(new Error('已有 3 个待核对的章节测验页面，已停止本轮任务。请先核对并保存这些答案，再刷新控制台继续。'), { stopCourse: true }));
        }
        if (questionFrame?.dataset.retained === 'true') {
            questionFrame.dataset.previous = 'true';
            questionFrame.querySelector('iframe').style.minHeight = '360px';
        } else questionFrame?.remove();
        const section = document.createElement('section');
        section.className = 'yixue-chapter-question-view';
        section.style.cssText = 'max-width:1300px;margin:16px auto;padding:16px;background:white;border:1px solid #e9eaf0;border-radius:20px';
        const frame = document.createElement('iframe');
        frame.name = 'yixue-managed-chapter';
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
                    if (frame.contentDocument.URL === 'about:blank') return;
                    finish(null, { document: frame.contentDocument, window: frame.contentWindow, close: () => section.remove(),
                        retain: () => { section.dataset.retained = 'true'; },
                        release: () => { delete section.dataset.retained; if (section !== questionFrame) section.remove(); },
                    });
                } catch (error) { finish(error); }
            };
            frame.onerror = () => finish(new Error('章节测验页面加载失败。'));
            const target = new URL(href, context.origin);
            if (context.prefix && !target.pathname.startsWith(context.prefix)) target.pathname = context.prefix + target.pathname;
            frame.src = target.href;
        });
    }

    if (route === 'zhihuishu-study' || route === 'zhihuishu-entry') {
        const controller = new AbortController(); activeController = controller;
        let study;
        const panel = ui.showQuestionPanel({ title: '智慧树学习助手', onPause: paused => study?.pause(paused), onConnect: () => ui.requestApiToken() });
        if (route === 'zhihuishu-entry') { panel.log('请打开具体课程的学习页面，再点击开始播放。'); return; }
        const actions = document.createElement('div'); actions.className = 'yixue-question-actions';
        const workflow = createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog: panel.log, waitIfPaused: panel.waitIfPaused, onCollect: collection.send });
        for (const [text, callback] of [['开始播放', () => { void panel.setPaused(false, { notify: false }); study.start(); }], ['下一资源', () => study.next()], ['停止播放', () => { study.stop(); void panel.setPaused(false, { notify: false }); }], ['查询当前练习', async () => {
            try { panel.setSummary(await workflow.run(document, { signal: controller.signal })); }
            catch (error) { panel.log(error.message, 'warning'); }
        }]]) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'yixue-panel-button'; button.textContent = text;
            button.addEventListener('click', callback); actions.append(button);
        }
        panel.element.querySelector('.yixue-question-body').prepend(actions);
        const statuses = { stopped: '已停止', paused: '已暂停', blocked: '等待处理平台提示', waiting: '等待播放器', playing: '正在播放', ended: '播放结束', finished: '已遍历完成', switching: '正在切换资源' };
        study = createZhihuishuStudy({ document, window, settings, signal: controller.signal, emit: event => {
            if (event.type === 'log') panel.log(event.message, event.tone);
            if (event.type === 'state') panel.element.querySelector('[role="status"]').textContent = statuses[event.status] || '等待开始';
        } });
        lifetime.add(() => study.destroy());
        panel.log('已识别智慧树学习页面，点击“开始播放”运行；播放结束后切换目录资源，进度以平台记录为准。');
        return;
    }

    if (route === 'entry') {
        if (!await ui.requestCourseAccess()) return;
        guard.assertAllowed();
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
        guard.assertAllowed();
        let surface, running = false;
        const run = async ({ challenge, signal }) => {
            guard.assertAllowed();
            if (running) return;
            running = true;
            surface.setRemaining(null);
            surface.setProgress(0);
            surface.setSummary({});
            surface.setTask({ name: '正在读取课程目录', chapter: '', status: 'running' });
            const scope = disposableScope();
            const controller = new AbortController(); activeController = controller;
            const cancel = () => controller.abort(signal?.reason || abortError());
            signal?.addEventListener('abort', cancel, { once: true });
            scope.add(() => signal?.removeEventListener('abort', cancel));
            if (signal?.aborted) cancel();
            try {
                if (!context.courseId || !context.classId) throw new Error('课程参数不全，请从课程首页重新进入控制台。');
                if (challenge) { for (const key of ['doVideo', 'doDocument', 'doLive', 'doWork']) settings.set(key, true); surface.refreshSettings(); }
                let backgroundNotified = false;
                scope.listen(document, 'visibilitychange', () => {
                    if (document.hidden && !backgroundNotified) {
                        backgroundNotified = true;
                        surface.log('页面已转入后台，实际运行速度受浏览器限制，请留意任务日志。', 'warning');
                    }
                });
                const activity = createCourseActivity({ window, context, onConflict: event => {
                    if (event.sameCourse) controller.abort();
                    surface.log(event.sameCourse ? '检测到同一课程重复运行，已停止当前任务，请仅保留一个运行页面。' : '检测到其他课程正在运行，请避免同账号并行执行。', 'warning');
                } });
                const started = activity.start(); scope.add(() => activity.destroy());
                if (!started && activity.duplicate()) throw new Error('同一课程正在其他页面运行，请先停止另一个页面再试。');
                guard.assertAllowed();
                surface.log('开始查询任务');
                const emit = event => {
                    if (controller.signal.aborted) return;
                    if (event.type === 'log') surface.log(event.message, event.tone);
                    if (event.type === 'progress') surface.setProgress(event.percent);
                    if (event.type === 'remaining') surface.setRemaining(event.seconds);
                    if (event.type === 'counts') surface.setCounts(event);
                    if (event.type === 'summary') surface.setSummary(event);
                    if (event.type === 'task') surface.setTask(event);
                };
                const questions = {
                    openPage: openChapterQuestions,
                    run: (page, options) => createQuestionWorkflow({ bank, settings, transport, unsafeWindow: page.defaultView || unsafeWindow, onLog: (message, tone) => surface.log(message, tone), onCollect: collection.send }).run(page, options),
                };
                await activity.runExclusive(() => createCourseRunner({ context, transport, settings, bank, questions, emit, prepareVideoSession: course => prepareVideoSession(document, course) }).run({ challenge, signal: controller.signal }));
            } catch (error) {
                if (controller.signal.aborted || error.name === 'AbortError') surface.log('任务已停止，可重新开始。');
                else surface.log('任务运行失败：' + error.message + '。处理后可点击启动重试。', 'danger');
            } finally {
                scope.dispose();
                if (controller.signal.aborted) surface.setRemaining(null);
                running = false;
                if (activeController === controller) activeController = null;
            }
        };
        surface = ui.showDashboard({ courseName: context.courseName, onRun: run, onConnect: () => ui.requestApiToken() });
        const installedVersion = typeof GM_info === 'object' ? GM_info?.script?.version : '';
        surface.log('脚本初始化成功（版本 ' + (installedVersion || '未知') + '），点击启动按钮开始刷课。' + support, 'info');
        if (!bank.getToken()) surface.log('本地随机 Token 未连接题库，视频、文档可先使用；章节答题将跳过，请填写题库 Token 后再启用。', 'warning');
        return;
    }

    if (['work-list', 'exam-list', 'work', 'exam'].includes(route)) {
        const panel = ui.showQuestionPanel({ title: route.startsWith('exam') ? '考试参考答案' : '作业参考答案', onConnect: () => ui.requestApiToken(), onRefresh: () => bank.refreshBalance({ force: true }), onAiToggle: enabled => settings.set('doAI', enabled) });
        if (route.endsWith('-list')) { panel.log(route === 'work-list' ? '脚本准备就绪，请进入作业' : '脚本准备就绪，请进入考试'); return; }
        if (!bank.getToken()) { panel.log('题库未连接，请保存题库 Token 后刷新页面。', 'warning'); return; }
        const state = document.createElement('p'); state.dataset.yixueQuestionState = ''; state.style.cssText = 'margin:8px;font:13px sans-serif'; panel.element.append(state);
        const answer = async () => {
            if (activeController || !guard.check()) return;
            const controller = new AbortController(); activeController = controller;
            const workflow = createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog: panel.log, waitIfPaused: panel.waitIfPaused, onCollect: collection.send });
            try {
                const result = route === 'exam'
                    ? await require('./questions/navigation').runQuestionPages(workflow, document, { signal: controller.signal, waitIfPaused: panel.waitIfPaused, onPage: pageResult => panel.setSummary(pageResult) })
                    : await workflow.run(document, { signal: controller.signal });
                panel.setSummary(result);
                state.textContent = result.stopped ? '查询已停止，请查看日志核对题目加载、账户或额度。' : result.answered ? '已填写 ' + result.answered + ' 道参考答案，请人工核对。' : '没有确认写入参考答案，请查看题目日志。';
                panel.log(result.answered ? route === 'work' ? '本次参考答案填写结束，请核对后保存或提交。' : '本次参考答案填写结束，请核对后继续，最终交卷由你确认。' : '本次没有确认填写答案，请检查未命中或未写入的具体原因。', result.answered ? 'info' : 'warning');
            } catch (error) { panel.log('答题流程已停止：' + error.message, 'danger'); }
            finally { if (activeController === controller) activeController = null; }
        };
        if (restored) {
            panel.log('页面已从浏览器缓存恢复，未自动重新查题。请先核对已有答案，需要重新查询时再点击“查询当前页面”。', 'warning');
            const resume = document.createElement('button'); resume.type = 'button'; resume.className = 'yixue-panel-button'; resume.textContent = '查询当前页面';
            resume.addEventListener('click', async () => { resume.disabled = true; try { await answer(); } finally { resume.disabled = false; } });
            panel.element.querySelector('.yixue-question-actions').append(resume);
        } else await answer();
        return;
    }

    if (route === 'study' && store.read('doxxcs', false)) {
        let visits;
        const panel = ui.showQuestionPanel({ title: '章节访问辅助', onPause: paused => visits.pause(paused) });
        visits = createChapterVisits({ document, window, store, context, onLog: panel.log });
        lifetime.add(() => visits.stop());
        const stop = document.createElement('button'); stop.type = 'button'; stop.className = 'yixue-panel-button'; stop.textContent = '停止章节访问';
        stop.addEventListener('click', () => { store.write('doxxcs', false); visits.stop(); panel.log('章节访问已停止。'); });
        panel.element.querySelector('.yixue-question-body').prepend(stop);
        visits.start();
    }
}
module.exports = { bootstrap };

