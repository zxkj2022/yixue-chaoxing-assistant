// ==UserScript==
// @name          易学·超星学习通助手[AI答题][一键启动][最小化运行]
// @namespace     易学团队
// @version       4.0.0
// @description   易学学习助手：管理课程任务、查看进度，查询并核对参考答案。
// @author        易学团队
// @homepageURL   https://github.com/zxkj2022/yixue-chaoxing-assistant
// @updateURL     https://raw.githubusercontent.com/zxkj2022/yixue-chaoxing-assistant/main/dist/%E6%98%93%E5%AD%A6%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E5%8A%A9%E6%89%8B.user.js
// @downloadURL   https://raw.githubusercontent.com/zxkj2022/yixue-chaoxing-assistant/main/dist/%E6%98%93%E5%AD%A6%E8%B6%85%E6%98%9F%E5%AD%A6%E4%B9%A0%E9%80%9A%E5%8A%A9%E6%89%8B.user.js
// @icon          https://yixue-cmg.pages.dev/assets/yixue-logo.png
// @run-at        document-end
// @storageName   易学团队
// @match         *://*/*
// @grant         unsafeWindow
// @grant         GM_xmlhttpRequest
// @grant         GM_info
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_addStyle
// @grant         GM_registerMenuCommand
// @grant         GM_notification
// @connect       mooc1.wljx.hfut.edu.cn
// @connect       mooc1.chaoxing.com
// @connect       mooc1-1.chaoxing.com
// @connect       mooc1-api.chaoxing.com
// @connect       zhibo.chaoxing.com
// @connect       pstore-rk.chaoxing.com
// @connect       kshlsplay-rk.chaoxing.com
// @connect       ksrtmpplay-rk.chaoxing.com
// @connect       mooc1.hnust.edu.cn
// @connect       stat2-ans.hnust.edu.cn
// @connect       stat2-ans.istudy.szpu.edu.cn
// @connect       stat2-ans.chaoxing.com
// @connect       stat2-ans.wht.zjelib.cn
// @connect       mooc1.wht.zjelib.cn
// @connect       passport2.wht.zjelib.cn
// @connect       mooc1.hnsyu.net
// @connect       passport2.xust.edu.cn
// @connect       stat2-ans.hnsyu.net
// @connect       passport2.hnsyu.net
// @connect       mooc1.gdhkmooc.com
// @connect       stat2-ans.gdhkmooc.com
// @connect       mooc1.zut.edu.cn
// @connect       passport2.hncj.edu.cn
// @connect       stat2-ans.zut.edu.cn
// @connect       passport2.jxjyzx.xust.edu.cn
// @connect       passport2.zut.edu.cn
// @connect       stat2-ans.wljx.hfut.edu.cn
// @connect       live-rk.chaoxing.com
// @connect       task.chaoxing.com
// @connect       passport2.wljx.hfut.edu.cn
// @connect       mooc1.hncj.edu.cn
// @connect       stat2-ans.hncj.edu.cn
// @connect       mooc1.qutjxjy.cn
// @connect       stat2-ans.qutjxjy.cn
// @connect       passport2.hnust.edu.cn
// @connect       passport2.cqrspx.cn
// @connect       passport2.gdhkmooc.com
// @connect       passport2.qutjxjy.cn
// @connect       mooc1.jxjyzx.xust.edu.cn
// @connect       mooc2-ans.chaoxing.com
// @connect       passport2.hnvist.cn
// @connect       passport2.cugbonline.cn
// @connect       passport2.chaoxing.com
// @connect       stat2-ans.jxjyzx.xust.edu.cn
// @connect       mooc1.xueyinonline.com
// @connect       passport2.ynny.cn
// @connect       passport2.ecnusole.com
// @connect       stat2-ans.xueyinonline.com
// @connect       static-rk.chaoxing.com
// @connect       passport2.xueyinonline.com
// @connect       lbapi-rk.chaoxing.com
// @connect       mooc1.cqrspx.cn
// @connect       stat2-ans.cqrspx.cn
// @connect       f1-rk.chaoxing.com
// @connect       mooc1-2.chaoxing.com
// @connect       mooc1.ynny.cn
// @connect       mqtt7-rk.chaoxing.com
// @connect       stat2-ans.ynny.cn
// @connect       mooc1.cugbonline.cn
// @connect       stat2-ans.cugbonline.cn
// @connect       mooc1.xust.edu.cn
// @connect       stat2-ans.xust.edu.cn
// @connect       mooc1.xynu.edu.cn
// @connect       mooc1.ntu.edu.cn
// @connect       stat2-ans.xynu.edu.cn
// @connect       mobilelearn.chaoxing.com
// @connect       k.chaoxing.com
// @connect       stat2-ans.ntu.edu.cn
// @connect       mooc1.hnvist.cn
// @connect       stat2-ans.hnvist.cn
// @connect       passport2.xynu.edu.cn
// @connect       passport2.ntu.edu.cn
// @connect       mooc1.ecnusole.com
// @connect       stat2-ans.ecnusole.com
// @connect       mooc.s.ecust.edu.cn
// @connect       webvpn.ahmu.edu.cn
// @connect       127.0.0.1
// @connect       tk.sanzwk.com
// @license       MIT
// ==/UserScript==
// Generated from src modules. Edit src/, then run the build.
(function () {
'use strict';
const modules = {
"app.js": function(module, exports, require) {
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

},
"core/access.js": function(module, exports, require) {
'use strict';
function createCourseAccess({ questionBank, getValue, setValue, randomValues = bytes => crypto.getRandomValues(bytes) }) {
    const getLocalToken = () => {
        const value = getValue('yixueLocalToken', '');
        return typeof value === 'string' && value.length === 32 && /^[a-f0-9]{32}$/.test(value) ? value : '';
    };
    const getRealToken = () => { const value = questionBank.getToken(); return questionBank.isValidToken(value) ? value : ''; };
    const getDisplayToken = () => getRealToken() || getLocalToken();
    const createLocalToken = () => {
        const token = Array.from(randomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
        setValue('yixueLocalToken', token);
        return token;
    };
    const saveToken = value => {
        const token = String(value ?? '').trim();
        if (questionBank.isValidToken(token)) { questionBank.setToken(token); return token; }
        if (token && token === getLocalToken() && !getRealToken()) return token;
        throw new Error('请填写题库提供的 Token；本地随机 Token 不能用于查题。');
    };
    return { getLocalToken, getDisplayToken, createLocalToken, saveToken, hasAccess: () => Boolean(getDisplayToken()) };
}

module.exports = createCourseAccess;

},
"core/collection.js": function(module, exports, require) {
'use strict';
const digest = require('./md5');
function createCollection({ bank, store, collect, document, hostname, confirm, notify }) {
    const keys = { token: 'yixueSubmissionToken', consent: 'yixueSubmissionConsent', seen: 'yixueSubmissionSeen' };
    let generation = 0, flight;
    const enabled = () => store.read(keys.consent, false) === true && /^sub_[\w-]+$/.test(store.read(keys.token, ''));
    async function send() {
        if (!enabled()) return;
        if (flight) return flight;
        const epoch = generation, origin = bank.base(), token = store.read(keys.token, '');
        const questions = collect(document).slice(0, 100);
        if (!questions.length) return;
        const fingerprint = hostname + ':' + digest(JSON.stringify(questions));
        if (store.read(keys.seen, '') === fingerprint) return;
        const task = (async () => {
            const response = await bank.submitQuestions(token, { consent: true, source_host: hostname, questions }, 'page-' + digest(fingerprint));
            if (epoch !== generation || !enabled() || bank.base() !== origin || store.read(keys.token, '') !== token) return;
            if (response.status === 201) store.write(keys.seen, fingerprint);
            else if (response.status === 401) disable(false);
        })();
        flight = task;
        try { await task; } finally { if (flight === task) flight = null; }
    }
    async function enable() {
        if (!confirm('启用后会上传题干、选项和题目资源，不上传答案、整页 HTML、Cookie 或隐藏表单。是否授权自动采集？')) return;
        const epoch = ++generation, origin = bank.base(), identity = bank.getToken();
        if (!identity) { notify('请先填写题库 Token，再启用题目采集。'); return; }
        let token = store.read(keys.token, '');
        if (!/^sub_[\w-]+$/.test(token)) {
            const response = await bank.provisionSubmission();
            if (epoch !== generation || bank.base() !== origin || bank.getToken() !== identity) return;
            if (response.status !== 200 || !/^sub_[\w-]+$/.test(response.body?.token || '')) { notify('采集授权申请失败，请检查题库账户后重试。'); return; }
            token = response.body.token;
        }
        store.write(keys.token, token); store.write(keys.consent, true);
        await send();
    }
    function disable(announce = true) {
        generation++;
        store.write(keys.consent, false); store.write(keys.token, ''); store.write(keys.seen, '');
        if (announce) notify('自动采集已关闭，采集 Token 已清除。');
    }
    return { enabled, enable, disable, send };
}
module.exports = { createCollection };

},
"core/md5.js": function(module, exports, require) {
'use strict';
// Independent implementation of the RFC 1321 algorithm, for host protocol compatibility.
// Specification: https://www.rfc-editor.org/rfc/rfc1321 (not its reference C implementation).
const rotations = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]];
const constants = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0);

function md5(value) {
    const input = new TextEncoder().encode(String(value));
    const size = Math.ceil((input.length + 9) / 64) * 64;
    const bytes = new Uint8Array(size);
    bytes.set(input);
    bytes[input.length] = 128;
    const view = new DataView(bytes.buffer);
    const bits = BigInt(input.length) * 8n;
    view.setUint32(size - 8, Number(bits & 0xffffffffn), true);
    view.setUint32(size - 4, Number(bits >> 32n), true);
    const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let offset = 0; offset < size; offset += 64) {
        let [a, b, c, d] = state;
        for (let step = 0; step < 64; step++) {
            const round = Math.floor(step / 16);
            let mixed, word;
            if (round === 0) { mixed = (b & c) | (~b & d); word = step; }
            else if (round === 1) { mixed = (d & b) | (~d & c); word = (5 * step + 1) % 16; }
            else if (round === 2) { mixed = b ^ c ^ d; word = (3 * step + 5) % 16; }
            else { mixed = c ^ (b | ~d); word = (7 * step) % 16; }
            const sum = (a + mixed + constants[step] + view.getUint32(offset + 4 * word, true)) >>> 0;
            const shift = rotations[round][step % 4];
            const next = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
            [a, b, c, d] = [d, next, b, c];
        }
        [a, b, c, d].forEach((word, index) => { state[index] = (state[index] + word) >>> 0; });
    }
    return state.map(word => Array.from({ length: 4 }, (_, index) => ((word >>> (index * 8)) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
module.exports = md5;

},
"core/ownership.js": function(module, exports, require) {
'use strict';
async function claimCourseSurface(windowObject, documentObject) {
    const tag = 'data-yixue-course-owner';
    if (documentObject.documentElement.hasAttribute(tag)) return false;
    const bus = 'yixue-course-ui-owner-v1';
    documentObject.documentElement.setAttribute(tag, 'pending');
    if (windowObject.top === windowObject) {
        documentObject.documentElement.setAttribute(tag, 'top');
        windowObject.addEventListener('message', event => {
            const data = event.data;
            if (data?.channel !== bus || data.type !== 'probe' || typeof data.id !== 'string' || data.id.length > 100) return;
            try { event.source?.postMessage({ channel: bus, type: 'owner', id: data.id }, event.origin === 'null' ? '*' : event.origin); } catch {}
        });
        for (let index = 0; index < windowObject.frames.length; index++) {
            try { windowObject.frames[index].postMessage({ channel: bus, type: 'ready' }, '*'); } catch {}
        }
        return true;
    }
    const nonce = crypto.randomUUID();
    let delegated = false;
    await new Promise(resolve => {
        const timer = setTimeout(resolve, 450);
        windowObject.addEventListener('message', event => {
            if (event.source !== windowObject.top || event.data?.channel !== bus) return;
            if (event.data.type !== 'ready' && !(event.data.type === 'owner' && event.data.id === nonce)) return;
            delegated = true;
            documentObject.documentElement.setAttribute(tag, 'delegated');
            windowObject.dispatchEvent(new Event('yixue-course-ui-suppressed'));
            clearTimeout(timer); resolve();
        });
        try { windowObject.top.postMessage({ channel: bus, type: 'probe', id: nonce }, '*'); } catch { clearTimeout(timer); resolve(); }
    });
    if (!delegated) documentObject.documentElement.setAttribute(tag, 'frame');
    return !delegated;
}
module.exports = { claimCourseSurface };

},
"core/primitives.js": function(module, exports, require) {
'use strict';
const abortError = () => Object.assign(new Error('任务已中止'), { name: 'AbortError' });
function delay(milliseconds, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(abortError());
        let timer;
        const cancel = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel); reject(abortError()); };
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve(); }, Math.max(0, milliseconds));
    });
}
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, symbol => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[symbol]);
function toText(value, documentObject = globalThis.document) {
    if (typeof documentObject?.createElement !== 'function') documentObject = globalThis.document;
    if (!documentObject) return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const fragment = documentObject.createElement('template');
    fragment.innerHTML = String(value ?? '').replace(/<(?:br|\/p|\/div|\/li)\b[^>]*>/gi, ' ');
    fragment.content.querySelectorAll('script,style').forEach(element => element.remove());
    return (fragment.content.textContent || '').replace(/\s+/g, ' ').trim();
}
function parseCookie(name, cookie = globalThis.document?.cookie || '') {
    const entry = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='));
    if (!entry) return '';
    try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return entry.slice(name.length + 1); }
}
function disposableScope() {
    const cleanups = [];
    return {
        add(cleanup) { cleanups.push(cleanup); return cleanup; },
        listen(target, event, callback, options) { target.addEventListener(event, callback, options); cleanups.push(() => target.removeEventListener(event, callback, options)); },
        dispose() { for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch {} } },
    };
}
module.exports = { delay, escapeText, toText, parseCookie, abortError, disposableScope };

},
"core/question-bank.js": function(module, exports, require) {
'use strict';
// Standalone transport: the page code below consumes a normalized answer string.
function createQuestionBankClient({ request, getValue, setValue, toText = value => String(value ?? ''), now = () => Date.now() }) {
    const defaultBase = 'https://tk.sanzwk.com';
    const tokenKey = 'shenchanranToken';
    const pendingKey = 'yixuePendingSearches';
    let blocked = null;
    let usage = '尚未查询题目';
    let balance = null, balanceError = '', balanceIdentity = '', balanceEpoch = 0;
    let balanceFlight = null, balanceAttempt = null, balanceRetryAt = 0, balanceUpdatedAt = 0;
    const balanceListeners = new Set();
    const notifyBalance = () => { for (const listener of balanceListeners) { try { listener(); } catch (_) {} } };
    const resetBalance = () => {
        balanceEpoch++;
        balance = null; balanceError = ''; balanceIdentity = ''; balanceFlight = null;
        balanceAttempt = null; balanceRetryAt = 0; balanceUpdatedAt = 0;
        notifyBalance();
    };
    const uuid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join('');
    const validBase = value => {
        const url = new URL(String(value).trim());
        const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
        if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
            throw new Error('请填写 HTTPS 网站根地址；本地测试可使用 HTTP。');
        }
        return url.origin;
    };
    const base = () => {
        try { return validBase(getValue('yixueQuestionBankBase', defaultBase)); }
        catch (_) { return defaultBase; }
    };
    const isValidToken = value => typeof value === 'string' && value === value.trim() && /^tk_[A-Za-z0-9_-]{32,128}$/.test(value);
    const getToken = () => {
        const token = getValue(tokenKey, '');
        const origin = getValue('yixueApiTokenOrigin', defaultBase);
        return origin === base() && isValidToken(token) ? token : '';
    };
    const clearCollection = () => {
        setValue('yixueSubmissionToken', '');
        setValue('yixueSubmissionConsent', false);
        setValue('yixueSubmissionSeen', '');
    };
    const setToken = value => {
        if (!isValidToken(value)) throw new Error('请填写题库「接口接入」生成的 tk_ 开头 API Token。');
        if (value !== getToken()) {
            setValue(pendingKey, {});
            setValue('yixueTokenRevision', uuid());
            clearCollection();
            usage = '尚未查询题目';
            resetBalance();
        }
        setValue(tokenKey, value);
        setValue('yixueApiTokenOrigin', base());
        blocked = null;
    };
    const setBase = value => {
        const next = validBase(value);
        if (next !== base()) {
            setValue(tokenKey, '');
            setValue(pendingKey, {});
            clearCollection();
            blocked = null;
            usage = '尚未查询题目';
            resetBalance();
        }
        setValue('yixueQuestionBankBase', next);
    };
    const jsonRequest = (path, { method = 'GET', body, token = '', idempotencyKey = '', timeout = 120000 } = {}) => new Promise(resolve => {
        let handle, settled = false;
        const finish = result => { if (!settled) { settled = true; clearTimeout(timer); resolve(result); } };
        // anonymous/redirect may use fetch mode, where the extension's timeout is ignored.
        const timer = setTimeout(() => { finish({ status: 0 }); try { handle?.abort(); } catch (_) {} }, timeout);
        const headers = { Accept: 'application/json' };
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = 'Bearer ' + token;
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
        const origin = base();
        try {
            handle = request({
                method, url: origin + path, headers, anonymous: true, redirect: 'error', timeout,
                ...(body === undefined ? {} : { data: JSON.stringify(body) }),
                onload: response => {
                    try {
                        if (response.finalUrl && new URL(response.finalUrl).origin !== origin) return finish({ status: 0 });
                        const payload = JSON.parse(response.responseText);
                        finish({ status: response.status, body: payload && typeof payload === 'object' ? payload : {} });
                    } catch (_) { finish({ status: response.status || 0 }); }
                },
                onerror: () => finish({ status: 0 }), ontimeout: () => finish({ status: 0 }), onabort: () => finish({ status: 0 }),
            });
        } catch (_) { finish({ status: 0 }); }
    });
    const failure = (msg, fatal = false) => ({ code: 0, data: '', msg, fatal });
    const currentBalanceIdentity = () => base() + '\n' + getToken();
    const balanceState = () => balanceIdentity === currentBalanceIdentity()
        ? { data: balance ? { ...balance } : null, error: balanceError, updatedAt: balanceUpdatedAt, loading: !!balanceFlight }
        : { data: null, error: '', updatedAt: 0, loading: false };
    const balanceLabel = () => {
        const state = balanceState();
        if (!state.data) return state.error ? '额度查询失败：' + state.error : state.loading ? '正在获取账户额度…' : '账户额度尚未刷新';
        const data = state.data;
        const expires = data.member_until > 0 ? new Date(data.member_until * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) + '（北京时间）' : '';
        const member = data.member ? `会员今日剩余：${data.daily_remaining}/${data.daily_limit}；到期：${expires}` : expires ? '会员已到期：' + expires : '非会员';
        return `积分：${data.points}；${member}` + (state.error ? `（刷新失败：${state.error}）` : '');
    };
    const refreshBalance = async ({ force = false } = {}) => {
        const identity = currentBalanceIdentity();
        if (balanceIdentity !== identity) { resetBalance(); balanceIdentity = identity; }
        const token = getToken();
        if (!token) { balance = null; balanceError = '请先设置新版搜题 Token。'; notifyBalance(); return balanceState(); }
        if (balanceFlight) return balanceFlight.promise;
        const time = now();
        if (time < balanceRetryAt || (balanceAttempt !== null && time - balanceAttempt < (force ? 1000 : 10000))) return balanceState();
        balanceAttempt = time;
        balanceError = '';
        const flight = { epoch: balanceEpoch, promise: null };
        balanceFlight = flight;
        notifyBalance();
        flight.promise = jsonRequest('/api/v1/balance', { token, timeout: 10000 }).then(response => {
            if (flight.epoch !== balanceEpoch || identity !== currentBalanceIdentity()) return;
            const data = response.body?.data;
            const valid = response.status === 200 && response.body?.code === 'OK' && response.body.cost === 0 && data &&
                Number.isSafeInteger(data.points) && data.points >= 0 && typeof data.member === 'boolean' &&
                Number.isFinite(data.member_until) && data.member_until >= 0 && data.member_until <= 8640000000000 &&
                Number.isSafeInteger(data.daily_limit) && data.daily_limit >= 0 &&
                Number.isSafeInteger(data.daily_remaining) && data.daily_remaining >= 0 && data.daily_remaining <= data.daily_limit;
            if (valid) {
                balance = { points: data.points, member: data.member, member_until: data.member_until, daily_limit: data.daily_limit, daily_remaining: data.daily_remaining };
                balanceUpdatedAt = now(); balanceError = '';
            } else {
                const errors = { 401: 'Token 无效或已撤销', 403: '账户停用或未获授权', 404: '题库尚未部署余额接口', 429: '查询过于频繁，请稍后刷新' };
                balanceError = errors[response.status] || (response.status === 200 ? '余额响应格式不匹配' : '网络或题库服务暂不可用');
                if ([401, 403].includes(response.status)) balance = null;
                if ([404, 429].includes(response.status)) balanceRetryAt = now() + 60000;
            }
        }).finally(() => { if (balanceFlight === flight) { balanceFlight = null; notifyBalance(); } }).then(balanceState);
        return flight.promise;
    };
    const search = async input => {
        if (blocked) return blocked;
        const token = getToken();
        if (!token) return failure('请先设置新版搜题 Token。', true);
        const aliases = { '0': 'single', '1': 'multiple', '2': 'fill', '3': 'judge', '4': 'answer', '单选题': 'single', '多选题': 'multiple', '填空题': 'fill', '判断题': 'judge', true_false: 'judge' };
        const type = aliases[input.type] || input.type;
        const options = Array.isArray(input.options) ? input.options : typeof input.options === 'string' ? input.options.split(/\r?\n/) : [];
        const query = {
            title: toText(input.title).trim(), options: options.map(toText).map(value => value.trim()).filter(Boolean),
            type: ['single', 'multiple', 'fill', 'judge', 'answer', 'unknown'].includes(type) ? type : 'unknown',
            use_ai: input.use_ai === true,
        };
        if (!query.title || query.title.length > 5000 || query.options.length > 30 || query.options.some(value => value.length > 2000)) return failure('题干或选项超出题库接口限制。');
        let revision = getValue('yixueTokenRevision', '');
        if (!revision) { revision = uuid(); setValue('yixueTokenRevision', revision); }
        const identity = JSON.stringify([base(), revision, query]);
        const pending = getValue(pendingKey, {});
        if (!pending[identity] && Object.keys(pending).length >= 100) return failure('尚有较多未确认请求，请稍后重试原题，避免重复扣费。', true);
        const idempotencyKey = pending[identity] || uuid();
        pending[identity] = idempotencyKey;
        setValue(pendingKey, pending);
        const response = await jsonRequest('/api/v1/search', { method: 'POST', body: query, token, idempotencyKey });
        const body = response.body || {};
        const forget = () => {
            const latest = getValue(pendingKey, {});
            delete latest[identity];
            setValue(pendingKey, latest);
        };
        const messages = { 401: '搜题 Token 无效或已撤销，请重新设置。', 402: '题库额度不足，请到题库网站充值后刷新页面。', 403: '账户停用或当前查询未获授权，请到题库网站查看。', 429: '题库查询过于频繁，请稍后刷新页面重试。' };
        if (messages[response.status]) {
            if (response.status !== 429) forget();
            blocked = failure(messages[response.status], true);
            return blocked;
        }
        if (response.status === 422) { forget(); return failure('题目字段或请求标识未通过题库校验。'); }
        if (response.status === 409) return failure('原查询仍在处理，请稍后重试；请求标识已保留。');
        if (response.status !== 200 || !response.body) return failure('查询结果尚未确认；请重试原题，脚本会复用请求标识，避免重复扣费。');
        if (body.code !== 'OK') {
            if (['NOT_FOUND', 'UPSTREAM_ERROR', 'ALREADY_DELIVERED', 'INTERRUPTED'].includes(body.code)) forget();
            const errors = { NOT_FOUND: '未找到答案。', UPSTREAM_ERROR: '题库服务暂不可用。', ALREADY_DELIVERED: '此请求的答案已交付且未保存，请核对之前的结果。', INTERRUPTED: '查询中断，预扣额度已退回，可重新查询。' };
            return failure(errors[body.code] || '题库返回了无法识别的结果；请稍后重试原题。');
        }
        const answer = Array.isArray(body.data) ? body.data.find(item => typeof item?.answer === 'string' && item.answer.trim()) : null;
        if (!answer) return failure('题库响应缺少答案；请重试原题以核对结果。');
        forget();
        usage = Number.isFinite(body.cost) ? `本次消耗：${body.cost} ${body.bucket === 'member' ? '次会员额度' : '积分'}` : '额度请到题库网站查看';
        return { code: 1, data: answer.answer.replaceAll('###', '#!#'), msg: body.is_ai ? 'ai' : '', cost: body.cost, bucket: body.bucket, analysis: typeof answer.analysis === 'string' ? answer.analysis : '' };
    };
    return {
        base, setBase, getToken, setToken, isValidToken, search, usageLabel: () => usage, resume: () => { blocked = null; },
        refreshBalance, balanceState, balanceLabel,
        onBalanceChange: listener => { balanceListeners.add(listener); return () => balanceListeners.delete(listener); },
        health: async () => { const result = await jsonRequest('/api/health', { timeout: 10000 }); return result.status === 200 && result.body?.status === 'ok'; },
        provisionSubmission: () => jsonRequest('/api/submission-tokens/provision', { method: 'POST', token: getToken(), body: {}, timeout: 15000 }),
        submitQuestions: (token, body, idempotencyKey) => jsonRequest('/api/question-submissions', { method: 'POST', token, body, idempotencyKey, timeout: 15000 }),
    };
}

module.exports = createQuestionBankClient;

},
"core/routes.js": function(module, exports, require) {
'use strict';
const { parseCookie } = require('./primitives');
function classifyPage(href) {
    const path = new URL(href).pathname;
    if (/\/mycourse\/(?:stu|studentcourse)\/?$/.test(path)) return 'entry';
    if (/\/mooc-ans\/course\/(?:yixue-console|999999999[\d.]+)\.html$/.test(path)) return 'dashboard';
    if (/\/mycourse\/studentstudy\/?$/.test(path)) return 'study';
    if (/\/work\/(?:getAllWork|list)|\/mooc2\/work\/list/.test(path)) return 'work-list';
    if (/\/work\/(?:doHomeWorkNew|dowork)|\/mooc2\/work\/dowork/.test(path)) return 'work';
    if (/reVersionTestStartNew|\/exam\/preview|\/exam\/test\/reVersion|\/exam\/test\/start/.test(path)) return 'exam';
    if (/exam-list|examnotes|\/exam\/test\/?$/.test(path)) return 'exam-list';
    return 'other';
}
function readCourseContext(href, { title = '', cookie = '', document: page } = {}) {
    const url = new URL(href);
    const param = (...keys) => keys.map(key => url.searchParams.get(key)).find(Boolean) || '';
    const prefix = url.pathname.match(/^(.*\/https\/[a-z0-9]+)(?:\/|$)/i)?.[1] || '';
    return {
        origin: url.origin,
        prefix,
        courseId: param('courseid', 'courseId'), classId: param('classid', 'clazzid', 'classId'), cpi: param('cpi'),
        uid: param('uid', 'userId') || parseCookie('UID', cookie) || parseCookie('_uid', cookie) || page?.querySelector('input[name="userId"],#uploadUid')?.value || '',
        fid: parseCookie('fid', cookie),
        courseName: param('coursename') || title.replace(/-首页$/, '') || '章节学习控制台',
    };
}
function consoleUrl(context) {
    const url = new URL((context.prefix || '') + '/mooc-ans/course/yixue-console.html', context.origin);
    for (const [key, value] of Object.entries({ ut: 's', classid: context.classId, courseid: context.courseId, cpi: context.cpi, coursename: context.courseName, uid: context.uid })) url.searchParams.set(key, value || '');
    return url.href;
}
module.exports = { classifyPage, readCourseContext, consoleUrl };

},
"core/settings.js": function(module, exports, require) {
'use strict';
const defaults = Object.freeze({ doVideo: true, doDocument: true, doLive: true, doWork: true, doRenwu: false, doNoMission: false, doAI: false, autoSubmit: true, beisu: 1, vgqtlv: 85 });
function createSettings({ read, write }) {
    function normalize(key, value) {
        if (!(key in defaults)) return undefined;
        if (typeof defaults[key] === 'boolean') return [true, false, 0, 1].includes(value) ? Boolean(value) : defaults[key];
        const numeric = Number(value);
        const valid = Number.isFinite(numeric) && (key === 'beisu' ? numeric >= 0.5 && numeric <= 16 : numeric >= 0 && numeric <= 100);
        return valid ? numeric : defaults[key];
    }
    const get = (key, fallback) => key in defaults ? normalize(key, read(key, defaults[key])) : read(key, fallback);
    return {
        get,
        set(key, value) {
            if (!(key in defaults)) throw new Error('未知配置项');
            const normalized = normalize(key, value);
            if (typeof defaults[key] === 'number' && normalized !== Number(value)) throw new RangeError(key === 'beisu' ? '倍速必须在0.5-16之间' : '正确率必须在0-100之间');
            write(key, normalized);
            return normalized;
        },
        snapshot: () => Object.fromEntries(Object.keys(defaults).map(key => [key, get(key)])),
    };
}
module.exports = { createSettings, defaults };

},
"core/transport.js": function(module, exports, require) {
'use strict';
const { abortError } = require('./primitives');
function createTransport({ base, send, createXhr = () => new XMLHttpRequest(), pageUrl = base }) {
    const page = new URL(pageUrl);
    const vpnPrefix = page.pathname.match(/^(.*\/https\/[a-z0-9]+)(?:\/|$)/i)?.[1];
    const login = result => /<title[^>]*>\s*用户登录\s*<\/title>/i.test(result.responseText || '') || /\/login(?:[/?#]|$)/i.test(result.finalUrl || result.responseURL || '');
    return { request(details, { signal = details.signal } = {}) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) return reject(abortError());
            let handle, timer, settled = false, fallback = false;
            const finish = (error, result) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener('abort', cancel);
                error ? reject(error) : resolve(result);
            };
            const fail = message => finish(new Error(message));
            const cancel = () => { finish(abortError()); try { handle?.abort(); } catch {} };
            try {
                let target = new URL(details.url, base);
                if (!['https:', 'http:'].includes(target.protocol)) return fail('学习通请求地址无效');
                if (vpnPrefix && !target.pathname.startsWith(vpnPrefix)) target = new URL(vpnPrefix + target.pathname + target.search, page.origin);
                const method = String(details.method || 'GET').toUpperCase();
                const timeout = Number(details.timeout) > 0 ? Number(details.timeout) : 10000;
                const headers = { 'Accept-Language': 'zh-CN,zh;q=0.9', ...details.headers };
                const inspect = result => {
                    if (settled) return;
                    if (!result || result.status < 200 || result.status >= 300) return fail('学习通请求失败（HTTP ' + (result?.status || 0) + '），请稍后重试。');
                    if (login(result)) {
                        if (!fallback && target.origin === page.origin) return nativeRequest();
                        return fail('学习通登录状态失效，请重新登录后重试。');
                    }
                    finish(null, { ...result, responseText: String(result.responseText ?? result.response ?? ''), finalUrl: result.finalUrl || result.responseURL || target.href });
                };
                const nativeRequest = () => {
                    fallback = true;
                    try {
                        const xhr = createXhr(); handle = xhr;
                        xhr.open(method, target.href, true);
                        xhr.timeout = timeout; xhr.withCredentials = true;
                        for (const [key, value] of Object.entries(headers)) if (!/^(referer|origin|host|cookie|user-agent|sec-)/i.test(key)) xhr.setRequestHeader(key, value);
                        const load = () => inspect({ status: xhr.status, responseText: xhr.responseText, finalUrl: xhr.responseURL });
                        xhr.onload = load;
                        xhr.onreadystatechange = () => { if (xhr.readyState === 4) load(); };
                        xhr.onerror = () => fail('学习通请求失败，请检查网络后重试。');
                        xhr.ontimeout = () => fail('学习通请求超时，请稍后重试。');
                        xhr.onabort = () => finish(abortError());
                        xhr.send(['GET', 'HEAD'].includes(method) ? null : details.data ?? null);
                    } catch { fail('无法恢复学习通登录状态，请重新登录后重试。'); }
                };
                signal?.addEventListener('abort', cancel, { once: true });
                timer = setTimeout(() => { fail('学习通请求超时，请检查网络后重试。'); try { handle?.abort(); } catch {} }, timeout + 1000);
                handle = send({
                    ...details, url: target.href, method, headers, timeout,
                    onload: inspect,
                    onerror: error => fail(/permission|Refused to connect/i.test(String(error?.error || error || '')) ? '学习通请求被脚本管理器阻止，请添加 @connect 权限：' + target.hostname : '学习通请求失败，请检查网络后重试。'),
                    ontimeout: () => fail('学习通请求超时，请稍后重试。'),
                    onabort: () => finish(abortError()),
                });
            } catch { fail('学习通请求无法发出，请检查网络和脚本管理器权限。'); }
        });
    } };
}
module.exports = { createTransport };

},
"platform/card-parser.js": function(module, exports, require) {
'use strict';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Only the JSON value on the right side is consumed. Page JavaScript is never run.
function parseCardData(html) {
    const source = String(html || '');
    const assignment = /\bmArg\s*=\s*/g.exec(source);
    if (!assignment) throw new Error('章节内容解析失败：未找到 mArg');
    const start = assignment.index + assignment[0].length;
    const tail = source.slice(start);
    if (/^\$mArg\s*;/.test(tail)) return { kind: 'end' };
    if (source[start] !== '{') throw new Error('章节内容解析失败：mArg 必须为 JSON 对象');
    let depth = 0, quoted = false, escaped = false, end = -1;
    for (let index = start; index < source.length; index++) {
        const character = source[index];
        if (quoted) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === '"') quoted = false;
        } else if (character === '"') quoted = true;
        else if (character === '{' || character === '[') depth++;
        else if (character === '}' || character === ']') {
            depth--;
            if (depth === 0) { end = index + 1; break; }
        }
    }
    let data;
    try { data = JSON.parse(source.slice(start, end < 0 ? source.length : end)); }
    catch (_) { throw new Error('章节内容解析失败：mArg 不是有效 JSON'); }
    if (!isRecord(data) || !isRecord(data.defaults) || !Array.isArray(data.attachments)) {
        throw new Error('章节内容解析失败：defaults 或 attachments 格式不正确');
    }
    return { kind: 'page', defaults: data.defaults, attachments: data.attachments };
}

function plainText(html) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return String(html).replace(/<[^>]*>/g, '').replace(/&(#\d+|#x[a-f\d]+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
        if (entity[0] !== '#') return entities[entity.toLowerCase()] || whole;
        const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }).replace(/\s+/g, ' ').trim();
}

function parseCatalog(html) {
    const chapters = new Map();
    const source = String(html || '');
    const headings = /<([a-z][\w:-]*)\b[^>]*\bid\s*=\s*["']cur(\d+)["'][^>]*>/gi;
    for (const match of source.matchAll(headings)) {
        const tags = new RegExp('<\\/?' + match[1] + '\\b[^>]*>', 'gi');
        const start = match.index + match[0].length;
        tags.lastIndex = start;
        let depth = 1, content = null, tag;
        while ((tag = tags.exec(source))) {
            if (tag[0].startsWith('</')) depth--;
            else if (!tag[0].endsWith('/>')) depth++;
            if (depth === 0) { content = source.slice(start, tag.index); break; }
        }
        if (content === null) continue;
        const count = /<span\b[^>]*\bclass\s*=\s*["'][^"']*\bjobUnfinishCount\b[^"']*["'][^>]*>([\s\S]*?)<\/span\s*>/i.exec(content);
        const remaining = count ? Number(plainText(count[1])) : 0;
        const name = plainText(count ? content.replace(count[0], '') : content);
        chapters.set(match[2], { id: match[2], name, remaining: Number.isFinite(remaining) ? remaining : 0 });
    }
    return [...chapters.values()];
}

module.exports = { parseCardData, parseCatalog, plainText };

},
"platform/course-engine.js": function(module, exports, require) {
'use strict';
const { delay } = require('../core/primitives');
const { parseCardData, parseCatalog } = require('./card-parser');
const { runVideo } = require('../tasks/video');
const { runDocument, documentTypes } = require('../tasks/documents');
const { runClassReplay, runLive } = require('../tasks/live');
const { runWork } = require('../tasks/work');
const { discoverEngineChapters, discoverNonJobChapters } = require('../tasks/discovery');

const CARD_PAGE_LIMIT = 200, EMPTY_PAGE_LIMIT = 10;
const outcomes = ['confirmed', 'skipped', 'failed', 'pending'];
const registrations = new Map([
    ['video', { setting: 'doVideo', execute: runVideo }],
    ['live', { setting: 'doLive', execute: runLive }],
    ['chaoxingClass', { setting: 'doLive', execute: runClassReplay }],
    ['workid', { setting: 'doWork', execute: runWork }],
    ...documentTypes.map(type => [type, { setting: 'doDocument', execute: runDocument }]),
]);

function createCourseRunner({ context, transport, settings, bank, questions, emit = () => {}, wait = delay }) {
    let running = false;
    const log = (message, tone = 'info') => emit({ type: 'log', message, tone });
    const progress = percent => emit({ type: 'progress', percent });
    const parseJSON = text => { try { return JSON.parse(text); } catch (_) { throw new Error('平台响应不是有效 JSON'); } };

    async function run({ challenge = false, signal } = {}) {
        if (running) throw new Error('课程任务正在执行');
        running = true;
        const summary = { confirmed: 0, skipped: 0, failed: 0, pending: 0, chapterIssues: 0 };
        const chaptersWithErrors = new Set();
        const checkSignal = () => { if (signal?.aborted) throw signal.reason || new Error('任务已取消'); };
        const requestResponse = async (path, parameters = {}, method = 'GET', headers = {}) => {
            checkSignal();
            const url = new URL(path, context.origin);
            for (const [key, value] of Object.entries(parameters)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
            const response = await transport.request({ method, url: url.href, headers }, { signal });
            if (response.status < 200 || response.status >= 300) throw new Error('平台请求失败：HTTP ' + response.status);
            return response;
        };
        const requestText = async (path, parameters, headers) => (await requestResponse(path, parameters, 'GET', headers)).responseText;
        const requestJSON = async (path, parameters, headers) => parseJSON(await requestText(path, parameters, headers));
        const retry = async (operation, label) => {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try { checkSignal(); return await operation(); }
                catch (error) {
                    checkSignal();
                    if (attempt === 3) throw new Error(label + '连续失败三次：' + error.message);
                    log(label + '失败，正在重试（' + attempt + '/3）', 'warning');
                    await wait(5000, signal);
                }
            }
        };
        try {
            checkSignal();
            if (challenge) for (const key of ['doVideo', 'doDocument', 'doWork', 'doLive']) settings.set(key, true);
            let catalog;
            try { catalog = parseCatalog(await requestText('/mycourse/studentstudycourselist', { courseId: context.courseId, clazzid: context.classId, cpi: context.cpi })); }
            catch (error) { checkSignal(); throw new Error('课程目录读取失败，可重试：' + error.message); }
            const discovery = { context, requestResponse, requestJSON, checkSignal, log };
            const sources = catalog.filter(chapter => challenge || chapter.remaining > 0);
            if (settings.get('doRenwu', false)) sources.push(...await discoverEngineChapters(discovery));
            if (settings.get('doNoMission', false)) sources.push(...await discoverNonJobChapters(discovery));
            const chapters = [...new Map(sources.map(chapter => [String(chapter.id), chapter])).values()].map(chapter => ({ ...chapter, unresolved: false, done: false }));
            const counts = () => emit({ type: 'counts', total: chapters.length, unconfirmed: chapters.filter(chapter => !chapter.done || chapter.unresolved).length });
            const issue = (chapter, message) => { chapter.unresolved = true; chaptersWithErrors.add(chapter.id); log('章节读取异常：' + chapter.name + '；' + message, 'danger'); };
            counts(); progress(0);
            // The finite queue contains discovery and execution jobs. Handlers own protocol work.
            const queue = chapters.map(chapter => ({ kind: 'cards', chapter, page: 0, empty: 0 }));
            while (queue.length) {
                checkSignal();
                const item = queue.shift();
                const chapter = item.chapter;
                if (item.kind === 'cards') {
                    if (item.page >= CARD_PAGE_LIMIT) { issue(chapter, '分页达到 ' + CARD_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    let page;
                    try {
                        if (challenge && item.page === 0) await requestText('/mooc-ans/mycourse/studentstudyAjax', { courseId: context.courseId, clazzid: context.classId, chapterId: chapter.id });
                        const referer = new URL('/mycourse/studentstudy', context.origin);
                        for (const [key, value] of Object.entries({ chapterId: chapter.id, courseId: context.courseId, clazzid: context.classId, cpi: context.cpi })) referer.searchParams.set(key, value);
                        page = parseCardData(await requestText('/knowledge/cards', { courseid: context.courseId, clazzid: context.classId, knowledgeid: chapter.id, cpi: context.cpi, num: item.page }, { Referer: referer.href }));
                    } catch (error) { checkSignal(); issue(chapter, error.message); chapter.done = true; counts(); continue; }
                    if (page.kind === 'end') { chapter.done = true; counts(); continue; }
                    const empty = page.attachments.length ? 0 : item.empty + 1;
                    if (empty >= EMPTY_PAGE_LIMIT) { issue(chapter, '连续空任务页达到 ' + EMPTY_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    const tasks = page.attachments.map(task => ({ kind: 'task', chapter, task, defaults: page.defaults }));
                    queue.unshift(...tasks, { kind: 'cards', chapter, page: item.page + 1, empty });
                    continue;
                }
                const task = item.task?.property?.module === 'insertbook' ? { ...item.task, type: 'book' } : item.task;
                const name = (task?.property?.module === 'insertbook' && task.property.bookname) || task?.property?.name || task?.property?.title || task?.type || '未知任务';
                let result;
                try {
                    if (!task || typeof task !== 'object' || !task.property || typeof task.property !== 'object' || Array.isArray(task.property)) throw new Error('任务附件格式不正确');
                    const registration = registrations.get(task.type);
                    const nonJobWork = !task.job && task.type === 'workid' && settings.get('doNoMission', false);
                    if ((!task.job && !nonJobWork) || !registration || !settings.get(registration.setting, true)) { log('已跳过任务：' + name, 'warning'); result = 'skipped'; }
                    else {
                        progress(0);
                        result = await registration.execute(task, { context, chapter, defaults: item.defaults, settings, bank, questions, signal, wait, requestText, requestJSON, parseJSON, retry, log, progress, name, nonJob: nonJobWork });
                        if (!outcomes.includes(result)) throw new Error('任务处理结果无效');
                        if (result === 'confirmed') progress(100);
                    }
                } catch (error) { checkSignal(); result = 'failed'; log(name + '：' + error.message, 'danger'); }
                summary[result]++;
                if (result !== 'confirmed') chapter.unresolved = true;
                counts();
            }
            summary.chapterIssues = chaptersWithErrors.size;
            log(`任务遍历结束：已确认完成 ${summary.confirmed} 项，跳过 ${summary.skipped} 项，失败 ${summary.failed} 项，待核实 ${summary.pending} 项${summary.chapterIssues ? `，章节读取异常 ${summary.chapterIssues} 项` : ''}`, 'info');
            return summary;
        } finally { running = false; }
    }
    return { run };
}

module.exports = { createCourseRunner, parseCardData };

},
"questions/index.js": function(module, exports, require) {
'use strict';

const { readQuestions, collectQuestions } = require('./reader.js');
const { matchAnswer } = require('./matcher.js');
const { applyAnswer } = require('./writer.js');

function createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog, waitIfPaused } = {}) {
    void transport;
    const log = (message, level = 'info') => { if (typeof onLog === 'function') onLog(message, level); };
    let running = null;

    async function execute(document, { signal, useAi, apply = true } = {}) {
        const questions = readQuestions(document);
        const results = [];
        const ai = useAi ?? settings?.get?.('doAI', false) ?? false;
        let stopped = false;
        if (typeof bank?.search !== 'function') throw new TypeError('A question-bank search client is required.');
        if (typeof bank.getToken === 'function' && !bank.getToken()) {
            log('请先连接题库并保存有效 Token。', 'warn');
            return { total: questions.length, answered: 0, accuracy: 0, results, stopped: true };
        }
        for (const question of questions) {
            if (signal?.aborted) { stopped = true; break; }
            if (typeof waitIfPaused === 'function') {
                try { await waitIfPaused(signal); }
                catch (error) {
                    if (signal?.aborted || error?.name === 'AbortError') { stopped = true; break; }
                    throw error;
                }
            }
            if (signal?.aborted) { stopped = true; break; }
            let response;
            try {
                response = await bank.search({ title: question.title, options: question.options.slice(), type: question.type, use_ai: ai === true });
                if (signal?.aborted) { stopped = true; break; }
                const successful = Number(response?.code) === 1;
                const answer = successful ? response.data : '';
                const matched = successful ? matchAnswer(question, answer) : { matched: false, reason: 'not-found' };
                const outcome = matched.matched && apply ? applyAnswer(question, answer, { unsafeWindow }) : { ...matched, applied: false };
                results.push({ id: question.id, matched: outcome.matched, answer, applied: outcome.applied, reason: outcome.reason || '', fatal: response?.fatal === true });
                log(outcome.matched ? '题目 ' + question.id + (outcome.applied ? ' 已填写参考答案。' : ' 已找到参考答案。') : '题目 ' + question.id + ' 未匹配到完整答案。', outcome.matched ? 'info' : 'warn');
                if (response?.fatal) { stopped = true; log(response.msg || '题库已停止查询，请检查账户或额度。', 'warn'); break; }
            } catch (_) {
                results.push({ id: question.id, matched: false, answer: '', applied: false, reason: 'search-failed' });
                log('题目 ' + question.id + ' 查询失败。', 'warn');
            } finally {
                try { await bank.refreshBalance?.(); } catch (_) { /* A free balance failure does not invalidate an answer. */ }
            }
        }
        const answered = results.filter(result => result.matched && (!apply || result.applied)).length;
        return { total: questions.length, answered, accuracy: questions.length ? answered / questions.length * 100 : 0, results, stopped };
    }

    return {
        read: readQuestions,
        collect: collectQuestions,
        run(document, options) {
            if (running) return running;
            running = execute(document, options).finally(() => { running = null; });
            return running;
        },
    };
}

module.exports = { createQuestionWorkflow, readQuestions, applyAnswer, collectQuestions };

},
"questions/matcher.js": function(module, exports, require) {
'use strict';

const TYPE_NAMES = ['single', 'multiple', 'fill', 'judge'];

function normalizeType(value) {
    const text = String(value ?? '').trim().toLowerCase();
    if (/^[0-3]$/.test(text)) return TYPE_NAMES[Number(text)];
    if (TYPE_NAMES.includes(text)) return text;
    if (/多选/.test(text)) return 'multiple';
    if (/单选/.test(text)) return 'single';
    if (/判断/.test(text)) return 'judge';
    if (/填空/.test(text)) return 'fill';
    return 'unknown';
}

function stripOptionLabel(value) {
    return String(value ?? '').normalize('NFKC').replace(/^\s*[A-Z]\s*[.、:)]\s*/i, '').trim();
}

function normalizeText(value) {
    return stripOptionLabel(value).toLowerCase().replace(/[\s\u200b-\u200d\ufeff.,，。?？!！:：;；]/g, '');
}

function splitAnswer(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value ?? '').split(/#!#|#{1,3}/).map(item => item.trim()).filter(Boolean);
}

function booleanValue(value) {
    const key = normalizeText(value);
    if (['对', '正确', '是', '真', 'true', 'yes', 'right', 'correct', '√', '✓', '1'].includes(key)) return true;
    if (['错', '错误', '否', '假', 'false', 'no', 'wrong', 'incorrect', '×', '✗', '0'].includes(key)) return false;
    return null;
}

function matchAnswer(question, answer) {
    const type = normalizeType(question.type);
    let parts = splitAnswer(answer);
    const noMatch = reason => ({ matched: false, indices: [], values: [], reason });
    if (!parts.length) return noMatch('empty-answer');
    if (type === 'fill') {
        const count = question.fields?.length || 0;
        return count && count === parts.length
            ? { matched: true, indices: [], values: parts }
            : noMatch('blank-count');
    }
    if (!['single', 'multiple', 'judge'].includes(type)) return noMatch('unsupported-type');
    const options = question.choices?.length ? question.choices.map(item => item.text) : question.options || [];
    if (type === 'multiple' && parts.length === 1 && /^[A-Z]{2,}$/i.test(parts[0])) parts = parts[0].split('');
    if (type !== 'multiple' && parts.length !== 1) return noMatch('answer-count');
    const indices = [];
    for (const part of parts) {
        const key = normalizeText(part);
        const truth = type === 'judge' ? booleanValue(part) : null;
        const matches = options.flatMap((option, index) => {
            const equal = truth === null ? normalizeText(option) === key : booleanValue(option) === truth;
            return equal ? [index] : [];
        });
        let index;
        if (matches.length === 1) index = matches[0];
        else if (matches.length > 1) return noMatch('ambiguous-option');
        else if (/^[A-Z][.、:)]?$/i.test(part.trim())) index = part.trim().toUpperCase().charCodeAt(0) - 65;
        if (index === undefined || index < 0 || index >= options.length) return noMatch('unmatched-option');
        if (!indices.includes(index)) indices.push(index);
    }
    return { matched: true, indices, values: [] };
}

module.exports = { matchAnswer, normalizeText, normalizeType, splitAnswer, stripOptionLabel, booleanValue };

},
"questions/navigation.js": function(module, exports, require) {
'use strict';

function questionFingerprint(questions) {
    return JSON.stringify(questions.map(question => ({
        id: question.id,
        heading: question.element?.querySelector('.mark_name,.Py-m1-title,h3')?.textContent?.replace(/\s+/g, ' ').trim() || '',
        title: question.title,
        type: question.type,
        options: question.options,
        blanks: question.fields?.length || 0,
    })));
}

function nextQuestionButton(document) {
    return Array.from(document.querySelectorAll('button,a,input[type="button"],input[type="submit"],[role="button"],[onclick]')).find(element => {
        const text = (element.textContent || element.value || element.getAttribute('aria-label') || '').replace(/\s+/g, '');
        if (!/^(?:下一题|下一个)[>›»→]?$/.test(text)) return false;
        if (element.disabled || element.getAttribute('aria-disabled') === 'true' || element.closest('[hidden],[aria-hidden="true"]')) return false;
        if (!element.getClientRects().length) return false;
        const style = document.defaultView?.getComputedStyle(element);
        return style?.display !== 'none' && style?.visibility !== 'hidden';
    });
}

function waitForChangedQuestions(workflow, document, previous, { signal, timeoutMs, settleMs }) {
    return new Promise(resolve => {
        const window = document.defaultView;
        let settled = false;
        let candidate = '';
        let settleTimer;
        let timeout;
        let observer;
        function finish(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout); clearTimeout(settleTimer);
            observer?.disconnect();
            signal?.removeEventListener('abort', abort);
            resolve(value);
        }
        function abort() { finish(null); }
        function check() {
            if (signal?.aborted) return abort();
            const questions = workflow.read(document);
            const ready = questions.length && questions.every(question => question.type === 'fill' ? question.fields?.length : question.choices?.length);
            const fingerprint = questionFingerprint(questions);
            if (!ready || fingerprint === previous) {
                candidate = ''; clearTimeout(settleTimer); return;
            }
            if (fingerprint === candidate) return;
            candidate = fingerprint;
            clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                const current = workflow.read(document);
                if (questionFingerprint(current) === candidate) finish(current);
                else check();
            }, settleMs);
        }
        signal?.addEventListener('abort', abort, { once: true });
        if (window?.MutationObserver) {
            observer = new window.MutationObserver(check);
            observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
        }
        timeout = setTimeout(() => finish(null), timeoutMs);
        check();
    });
}

async function runQuestionPages(workflow, document, { signal, useAi, onPage, waitIfPaused, timeoutMs = 5000, settleMs = 100, maxPages = 200 } = {}) {
    const combined = { total: 0, answered: 0, accuracy: 0, results: [], stopped: false, pages: 0 };
    const seen = new Set();
    for (let index = 0; index < maxPages; index++) {
        if (signal?.aborted) { combined.stopped = true; break; }
        const questions = workflow.read(document);
        const fingerprint = questionFingerprint(questions);
        if (!questions.length || seen.has(fingerprint)) break;
        seen.add(fingerprint);
        const result = await workflow.run(document, { signal, useAi, apply: true });
        combined.total += result.total;
        combined.answered += result.answered;
        combined.results.push(...result.results);
        combined.pages++;
        combined.accuracy = combined.total ? combined.answered / combined.total * 100 : 0;
        combined.stopped = Boolean(result.stopped || signal?.aborted);
        onPage?.(combined);
        const complete = result.total > 0 && result.answered === result.total && result.results.length === result.total && result.results.every(item => item.matched && item.applied);
        if (combined.stopped || !complete) break;
        try { await waitIfPaused?.(signal); }
        catch (error) {
            if (signal?.aborted || error?.name === 'AbortError') { combined.stopped = true; break; }
            throw error;
        }
        if (signal?.aborted) { combined.stopped = true; break; }
        const next = nextQuestionButton(document);
        if (!next) break;
        if (index + 1 >= maxPages) { combined.stopped = true; break; }
        next.click();
        const changed = await waitForChangedQuestions(workflow, document, fingerprint, { signal, timeoutMs, settleMs });
        if (!changed || signal?.aborted) { combined.stopped = true; break; }
        if (seen.has(questionFingerprint(changed))) { combined.stopped = true; break; }
    }
    return combined;
}

module.exports = { runQuestionPages, questionFingerprint, nextQuestionButton };

},
"questions/reader.js": function(module, exports, require) {
'use strict';

const { normalizeType, stripOptionLabel } = require('./matcher.js');

const ROOT_SELECTOR = '.TiMu, .noSplitBx, .Py-mian1, [data-question-id], .question-item';
const TITLE_SELECTOR = '.Zy_TItle, .mark_name, .Py-m1-title, .question-title, .question-stem, .stem';
const OMIT_SELECTOR = 'script,style,noscript,input,textarea,select,button,[hidden],[aria-hidden="true"],.answer,.analysis,.answer-analysis';

function formulaText(element) {
    return element.getAttribute('data-latex') || element.getAttribute('data-formula') || element.getAttribute('alttext') ||
        element.querySelector?.('annotation[encoding="application/x-tex"]')?.textContent || '';
}

function visibleText(element) {
    if (!element) return '';
    const copy = element.cloneNode(true);
    copy.querySelectorAll(OMIT_SELECTOR).forEach(node => node.remove());
    copy.querySelectorAll('[data-latex],[data-formula],math').forEach(node => {
        const formula = formulaText(node);
        if (formula) node.textContent = ' ' + formula + ' ';
    });
    copy.querySelectorAll('img').forEach(node => {
        const text = formulaText(node) || node.getAttribute('alt') || '[图片]';
        node.replaceWith(copy.ownerDocument.createTextNode(' ' + text + ' '));
    });
    copy.querySelectorAll('br').forEach(node => node.replaceWith(copy.ownerDocument.createTextNode(' ')));
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

function cleanTitle(value) {
    return String(value || '')
        .replace(/^\s*(?:第\s*[\d一二三四五六七八九十百零〇]+\s*题\s*[:：.、]?|[（(【[]?\s*[\d一二三四五六七八九十百零〇]+\s*[）)】\].、．:：])\s*/, '')
        .replace(/^\s*[（(【[]\s*(?:单选题?|多选题?|判断题?|填空题?)\s*[,，、]?\s*(?:\d+(?:\.\d+)?\s*分)?\s*[）)】\]]\s*/, '')
        .trim();
}

function optionContainer(input, root) {
    const label = input.closest('label');
    if (label && root.contains(label)) return label;
    if (input.id) {
        const linked = Array.from(root.querySelectorAll('label')).find(item => item.htmlFor === input.id);
        if (linked) return linked;
    }
    const wrapper = input.closest('li,.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p');
    return wrapper && root.contains(wrapper) ? wrapper : input.parentElement;
}

function readChoices(root) {
    if (root.matches('.Py-mian1')) {
        const marker = root.querySelector('[name^="answertype"],input[id^="answertype"]');
        const expectedId = (marker?.name || marker?.id || '').replace(/^answertype/, '').replace(/\D/g, '');
        return Array.from(root.querySelectorAll('li.clearfix[id-param]'))
            .filter(element => !expectedId || element.getAttribute('id-param').replace(/\D/g, '') === expectedId)
            .map((element, index) => {
            const textNode = element.querySelector('.fl.after,label[for],label,.after');
            const text = stripOptionLabel(visibleText(textNode || element));
            const letter = element.querySelector('em[id-param]')?.getAttribute('id-param')?.toUpperCase() || String.fromCharCode(65 + index);
            return { index, text, letter, element, input: null };
            }).filter(item => item.text);
    }
    const controls = Array.from(root.querySelectorAll('input[type="radio"],input[type="checkbox"]'));
    if (controls.length) return controls.map((input, index) => {
        const element = optionContainer(input, root);
        return { index, text: stripOptionLabel(visibleText(element)), element, input };
    });
    const candidates = Array.from(root.querySelectorAll('.judgeoption,.answerBg,.answer-item,.question-option,.selectBox,.answer_p,.answerList li,.stem_answer li,ul li'));
    return candidates.filter(item => !candidates.some(other => other !== item && other.contains(item)))
        .map((element, index) => ({ index, text: stripOptionLabel(visibleText(element)), element, input: null }))
        .filter(item => item.text);
}

function readFields(root) {
    const editors = Array.from(root.querySelectorAll('[id^="answerEditor"],.edui-editor,[data-editor-id]'));
    const fields = editors.filter(item => !editors.some(other => other !== item && other.contains(item)))
        .map(element => ({ kind: 'editor', element, id: element.dataset.editorId || element.id }));
    const controls = Array.from(root.querySelectorAll('textarea,input[type="text"],[contenteditable="true"],.answerInput'));
    for (const element of controls) {
        if (fields.some(field => field.element === element || field.element.contains(element) || element.contains(field.element))) continue;
        if (element.type === 'hidden' || element.hidden || element.closest('[hidden],[aria-hidden="true"]')) continue;
        fields.push({ kind: element.isContentEditable || element.getAttribute('contenteditable') === 'true' || !['INPUT', 'TEXTAREA'].includes(element.tagName) ? 'contenteditable' : 'input', element, id: element.id });
    }
    if (!fields.length) {
        for (const iframe of root.querySelectorAll('iframe[id^="ueditor"],iframe[id*="Editor"]')) {
            const id = iframe.id.replace(/_iframe$/, '');
            fields.push({ kind: 'editor', element: iframe, id });
        }
    }
    return fields;
}

function readAssets(root) {
    const assets = [];
    const seen = new Set();
    root.querySelectorAll('img,[data-latex],[data-formula],math').forEach(element => {
        if (element.closest(OMIT_SELECTOR)) return;
        let asset;
        const formula = formulaText(element).trim();
        if (formula) asset = { kind: 'formula', formula: formula.slice(0, 4000), alt: element.getAttribute('alt') || '' };
        else if (element.tagName === 'IMG') {
            try {
                const raw = element.getAttribute('data-src') || element.getAttribute('src');
                if (!raw) return;
                const url = new URL(raw, root.ownerDocument.baseURI);
                if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
                // Credentials in resource query strings are unrelated to question content.
                for (const key of [...url.searchParams.keys()]) if (/token|auth|cookie|session|password/i.test(key)) url.searchParams.delete(key);
                asset = { kind: 'image', url: url.href, alt: element.getAttribute('alt') || '' };
            } catch (_) { return; }
        }
        if (!asset) return;
        const key = JSON.stringify(asset);
        if (!seen.has(key)) { assets.push(asset); seen.add(key); }
    });
    return assets;
}

function readQuestions(document) {
    if (!document?.querySelectorAll) return [];
    let roots = Array.from(document.querySelectorAll(ROOT_SELECTOR));
    roots = roots.filter(item => !roots.some(other => other !== item && other.contains(item)));
    if (!roots.length) {
        roots = Array.from(document.querySelectorAll('[name^="answertype"]')).map(input => input.closest('li,section,fieldset') || input.parentElement);
        roots = [...new Set(roots)];
    }
    return roots.map((element, index) => {
        const titleNode = element.querySelector(TITLE_SELECTOR) || element.querySelector('h3');
        const typeInput = element.querySelector('[name^="answertype"],input[id^="answertype"]');
        const titleText = visibleText(titleNode);
        const typeText = typeInput?.value ?? element.dataset.type ?? visibleText(element.querySelector('.type_tit'));
        let type = normalizeType(typeText);
        if (type === 'unknown') type = normalizeType(titleText);
        const choices = readChoices(element);
        const fields = readFields(element);
        if (type === 'unknown' && choices.length) type = element.querySelector('input[type="checkbox"]') ? 'multiple' : 'single';
        if (type === 'unknown' && fields.length) type = 'fill';
        const assets = [];
        const assetKeys = new Set();
        for (const container of [titleNode, ...choices.map(choice => choice.element)].filter(Boolean)) {
            for (const asset of readAssets(container)) {
                const key = JSON.stringify(asset);
                if (!assetKeys.has(key)) { assets.push(asset); assetKeys.add(key); }
            }
        }
        const title = cleanTitle(titleText);
        const suffix = (typeInput?.name || typeInput?.id)?.replace(/^answertype/, '') || element.dataset.questionId || element.getAttribute('data') || element.id || String(index + 1);
        const host = element.matches('.Py-mian1') ? {
            kind: 'mobile-chapter',
            answerInput: Array.from(element.querySelectorAll('input[type="hidden"]')).find(input => {
                const key = input.name || input.id;
                return /^answer(?!type)/.test(key) && key.replace(/^answer/, '').replace(/\D/g, '') === suffix.replace(/\D/g, '');
            }) || null,
        } : null;
        return { id: suffix, title, type, options: choices.map(item => item.text), choices, fields, element, assets, host };
    }).filter(question => question.title);
}

function collectQuestions(document) {
    const seen = new Set();
    return readQuestions(document).flatMap(question => {
        const item = { title: question.title, options: question.options.slice(), type: question.type };
        if (question.assets.length) item.assets = question.assets;
        const key = JSON.stringify(item);
        if (seen.has(key)) return [];
        seen.add(key);
        return [item];
    });
}

module.exports = { readQuestions, collectQuestions, visibleText, cleanTitle };

},
"questions/writer.js": function(module, exports, require) {
'use strict';

const { matchAnswer, normalizeType, booleanValue } = require('./matcher.js');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function emitChanges(element) {
    const EventClass = element.ownerDocument?.defaultView?.Event;
    if (!EventClass) return;
    element.dispatchEvent(new EventClass('input', { bubbles: true }));
    element.dispatchEvent(new EventClass('change', { bubbles: true }));
}

function isSelected(choice) {
    if (choice.input) return choice.input.checked;
    const element = choice.element;
    return element.getAttribute('aria-checked') === 'true' ||
        element.matches('.check_answer,.checked,.selected,.on,.cur') ||
        Boolean(element.querySelector('.check_answer,.checked,.selected,[aria-checked="true"]'));
}

function prepareFill(field, value, unsafeWindow) {
    const element = field.element;
    if (!element || element.disabled || element.readOnly) return null;
    if (field.kind === 'editor') {
        const editor = field.id && unsafeWindow?.UE?.getEditor?.(field.id);
        if (typeof editor?.setContent === 'function') return () => editor.setContent(escapeHtml(value).replace(/\r?\n/g, '<br>'));
        if (element.tagName === 'IFRAME') return null;
        return () => { element.textContent = value; emitChanges(element); };
    }
    if (field.kind === 'contenteditable') return () => { element.textContent = value; emitChanges(element); };
    return () => { element.value = value; emitChanges(element); };
}

function applyAnswer(question, answer, { unsafeWindow } = {}) {
    const match = matchAnswer(question, answer);
    if (!match.matched) return { ...match, applied: false };
    const host = unsafeWindow || question.element?.ownerDocument?.defaultView;
    try {
        if (normalizeType(question.type) === 'fill') {
            const writes = question.fields.map((field, index) => prepareFill(field, match.values[index], host));
            if (writes.some(write => !write)) return { ...match, applied: false, reason: 'unavailable-editor' };
            writes.forEach(write => write());
        } else {
            const choices = question.choices || [];
            const chosen = new Set(match.indices);
            const multiple = normalizeType(question.type) === 'multiple';
            const cannotChange = choice => choice.input?.disabled || choice.element.getAttribute('aria-disabled') === 'true';
            if (match.indices.some(index => !choices[index]?.element) || choices.some((choice, index) => {
                const change = chosen.has(index) ? !isSelected(choice) : multiple && isSelected(choice);
                return change && cannotChange(choice);
            })) {
                return { ...match, applied: false, reason: 'unavailable-option' };
            }
            if (question.host?.kind === 'mobile-chapter') {
                if (!question.host.answerInput) return { ...match, applied: false, reason: 'unavailable-host-answer' };
                let value = match.indices.map(index => choices[index].letter || String.fromCharCode(65 + index)).sort().join('');
                if (normalizeType(question.type) === 'judge') {
                    const truth = booleanValue(choices[match.indices[0]].text);
                    if (truth === null) return { ...match, applied: false, reason: 'unmatched-judgment' };
                    value = String(truth);
                }
                question.host.answerInput.value = value;
                choices.forEach((choice, index) => choice.element.classList.toggle('cur', chosen.has(index)));
                emitChanges(question.host.answerInput);
                return { ...match, applied: true };
            }
            choices.forEach((choice, index) => {
                const selected = isSelected(choice);
                const desired = chosen.has(index);
                if ((desired && !selected) || (multiple && selected && !desired)) (choice.input || choice.element).click();
            });
        }
        return { ...match, applied: true };
    } catch (_) {
        return { ...match, applied: false, reason: 'host-write-failed' };
    }
}

module.exports = { applyAnswer, escapeHtml };

},
"tasks/discovery.js": function(module, exports, require) {
'use strict';

async function discoverEngineChapters(env) {
    const chapters = [], topics = new Set();
    try {
        const active = await env.requestJSON('https://mobilelearn.chaoxing.com/v2/apis/active/getData', { DB_STRATEGY: 'DEFAULT', courseId: env.context.courseId, classId: env.context.classId });
        if (!Array.isArray(active.data)) throw new Error('任务引擎活动格式无效');
        for (const activity of active.data) {
            try {
                if (!activity?.id) continue;
                const destination = await env.requestResponse('https://task.chaoxing.com/api/v1/middlePageApi/jumpStudyPlanList', { taskId: activity.id, moocClassId: env.context.classId }, 'HEAD');
                const userId = new URL(destination.finalUrl).searchParams.get('encryTaskUserId');
                if (!userId) throw new Error('任务引擎跳转缺少用户标识');
                const standard = await env.requestJSON('https://task.chaoxing.com/userStudyPlan/getUserStandard', { encryTaskUserId: userId });
                const plans = standard.data?.userTaskQualifyDTO?.planUserBOList;
                if (!Array.isArray(plans)) throw new Error('任务引擎计划格式无效');
                for (const item of plans) {
                    const plan = item?.plan;
                    if (Number(plan?.planType) !== 1 || Number(item.finish) !== 0 || !plan.externalDataId || topics.has(String(plan.externalDataId))) continue;
                    topics.add(String(plan.externalDataId));
                    try {
                        const destination = await env.requestResponse('https://mooc2-ans.chaoxing.com/mooc2-ans/coursetopic/topicdetailsmiddle', { taskEngine: true, courseid: env.context.courseId, clazzid: env.context.classId, cpi: env.context.cpi, topicid: plan.externalDataId, ut: 's' });
                        const chapterId = new URL(destination.finalUrl).searchParams.get('chapterId');
                        if (!chapterId) throw new Error('任务引擎跳转缺少章节 ID');
                        chapters.push({ id: chapterId, name: '任务引擎章节 ' + chapterId, remaining: 1 });
                    } catch (error) { env.checkSignal(); env.log('任务引擎章节读取失败：' + error.message, 'warning'); }
                }
            } catch (error) { env.checkSignal(); env.log('任务引擎计划读取失败：' + error.message, 'warning'); }
        }
    } catch (error) { env.checkSignal(); env.log('任务引擎读取失败，继续常规目录：' + error.message, 'warning'); }
    return chapters;
}

async function discoverNonJobChapters(env) {
    const chapters = [], excluded = new Set(['已完成', '待批阅', '已保存']);
    const statistics = new URL(env.context.origin);
    statistics.hostname = statistics.hostname.replace(/^mooc(?:1|2-ans)?\./, 'stat2-ans.');
    statistics.pathname = '/stat2/chapter-exam/s/tests/data';
    for (let page = 1; page <= 100; page++) {
        try {
            const response = await env.requestJSON(statistics.href, { courseid: env.context.courseId, clazzid: env.context.classId, ut: 's', pageSize: 200, page });
            const results = response.data?.results;
            if (!Array.isArray(results)) throw new Error('非任务章节统计格式无效');
            if (!results.length) break;
            for (const result of results) {
                if (result?.isNonJob === true && result.chapterId && !excluded.has(result.statusStr)) {
                    chapters.push({ id: String(result.chapterId), name: '非任务章节 ' + result.chapterId, remaining: 1 });
                }
            }
            if (page === 100) env.log('非任务章节分页达到 100 页上限，分页已停止', 'warning');
        } catch (error) { env.checkSignal(); env.log('非任务章节统计读取失败：' + error.message, 'warning'); break; }
    }
    return chapters;
}

module.exports = { discoverEngineChapters, discoverNonJobChapters };

},
"tasks/documents.js": function(module, exports, require) {
'use strict';

const resources = new Map([
    ['document', { path: '/ananas/job/document', label: '文档', wait: 5000 }],
    ['book', { path: '/ananas/job', label: '图书', wait: 5000 }],
    ['hyperlink', { path: '/ananas/job/hyperlink', label: '链接', wait: 2000 }],
    ['microCourse', { path: '/ananas/job/microCourse', label: '微课', wait: 5000 }],
]);

async function runDocument(task, env) {
    const specification = resources.get(task.type);
    if (!task.jobid) throw new Error('缺少任务 ID');
    const parameters = { jobid: task.jobid, knowledgeid: env.chapter.id, courseid: env.context.courseId, clazzid: env.context.classId, jtoken: task.jtoken };
    if (task.type === 'microCourse') Object.assign(parameters, { checkMicroTopic: true, microTopicId: 'undefined' });
    await env.wait(specification.wait, env.signal);
    const text = await env.requestText(specification.path, parameters);
    const confirmed = task.type === 'microCourse' ? text.includes('添加考核点成功') : env.parseJSON(text).status === true;
    if (!confirmed) throw new Error(specification.label + '任务未获得平台确认');
    env.log(specification.label + '任务完成：' + env.name, 'success');
    return 'confirmed';
}

module.exports = { runDocument, documentTypes: [...resources.keys()] };

},
"tasks/live.js": function(module, exports, require) {
'use strict';

function finite(value, label, minimum = 0) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum) throw new Error(label + '无效');
    return number;
}

const validUserId = env => [env.context.uid, env.defaults.userid].map(value => String(value || '').trim()).find(value => /^[1-9]\d*$/.test(value));

async function runClassReplay(task, env) {
    if (!validUserId(env)) throw new Error('课堂直播缺少有效用户 ID');
    const uuid = task.property.uuid;
    if (!uuid) throw new Error('课堂直播缺少 UUID');
    const result = await env.requestJSON('https://k.chaoxing.com/apis/chapter/getMeetReview4Job', { uuid, courseId: env.context.courseId, classId: env.context.classId, cpi: env.context.cpi });
    if (!Array.isArray(result.data) || !result.data.length) throw new Error('课堂直播回放数据为空');
    for (const recording of result.data) {
        const duration = finite(recording.duration, '课堂直播时长', 0.001);
        let position = Math.max(0, finite(recording.userTime ?? 0, '课堂直播进度', -Number.MAX_VALUE));
        position = Math.min(position, duration);
        if (!recording.dataKey) throw new Error('课堂直播缺少回放标识');
        while (position < duration) {
            const next = Math.min(position + 10, duration);
            await env.wait((next - position) * 1000, env.signal);
            await env.retry(async () => {
                const uploaded = await env.requestJSON('https://k.chaoxing.com/apis/chapter/addReviewDot4Job', { uuid, dataKey: recording.dataKey, lastWatchTime: next });
                if (uploaded.result !== true || uploaded.msg !== 'success') throw new Error('平台拒绝回放进度');
                return uploaded;
            }, '课堂直播回放进度');
            position = next;
            env.progress(Math.floor(position / duration * 100));
        }
    }
    env.log('课堂直播回放进度已上传，等待平台核实：' + env.name, 'warning');
    return 'pending';
}

function scriptString(html, variable) {
    const match = new RegExp('\\b' + variable + '\\s*=\\s*(["\'])').exec(html);
    if (!match) return '';
    const quote = match[1];
    const escapes = { '"': '"', "'": "'", '\\': '\\', '/': '/', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' };
    let value = '';
    for (let index = match.index + match[0].length; index < html.length; index++) {
        const character = html[index];
        if (character === quote) return value;
        if (character === '\n' || character === '\r') return '';
        if (character !== '\\') { value += character; continue; }
        const escaped = html[++index];
        if (Object.hasOwn(escapes, escaped)) value += escapes[escaped];
        else if (escaped === 'u' || escaped === 'x') {
            const size = escaped === 'u' ? 4 : 2;
            const digits = html.slice(index + 1, index + 1 + size);
            if (digits.length !== size || !/^[\da-f]+$/i.test(digits)) return '';
            value += String.fromCharCode(parseInt(digits, 16)); index += size;
        } else return '';
    }
    return '';
}

function assignedObject(html, variable) {
    const match = new RegExp('\\b' + variable + '\\s*=\\s*').exec(html);
    if (!match) return null;
    const start = match.index + match[0].length;
    if (html[start] !== '{') throw new Error('直播页面数据必须为 JSON 对象');
    let depth = 0, quoted = false, escaped = false;
    for (let index = start; index < html.length; index++) {
        const character = html[index];
        if (quoted) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === '"') quoted = false;
        } else if (character === '"') quoted = true;
        else if (character === '{') depth++;
        else if (character === '}' && --depth === 0) return JSON.parse(html.slice(start, index + 1));
    }
    throw new Error('直播页面数据不完整');
}

async function runLive(task, env) {
    const property = task.property;
    const originalId = String(property.liveId || property.liveid || '');
    const uid = validUserId(env);
    if (!originalId) throw new Error('直播缺少直播 ID');
    if (!uid) throw new Error('直播缺少有效用户 ID');
    const rt = finite(property.rt ?? 0.9, '直播上报参数', 0.001);
    if (rt > 1) throw new Error('直播上报参数无效');
    let liveId = originalId;
    if (liveId.length < 16) {
        const converted = await env.requestJSON('/ananas/live/getnewliveid', { oliveid: originalId });
        if (!converted.newLiveId) throw new Error('直播 ID 转换失败');
        liveId = String(converted.newLiveId);
    }
    const information = await env.requestJSON('/ananas/live/liveinfo', { liveid: liveId, userid: uid, courseid: env.context.courseId, clazzid: env.context.classId, knowledgeid: env.chapter.id, jobid: task.jobid, ut: 's' });
    const data = information.temp?.data;
    if (!data) throw new Error('直播信息无效');
    const duration = finite(data.duration, '直播时长', 0.001);
    const watched = finite(data.timeLongValue ?? 0, '直播观看进度') * 60;
    if (!Number.isFinite(watched)) throw new Error('直播观看进度无效');
    if (Number(data.liveStatus) === 4 && Number(data.ifReview) === 1) { env.log('直播不允许回看，已跳过：' + env.name, 'warning'); return 'skipped'; }
    const pageUrl = new URL('https://zhibo.chaoxing.com/' + encodeURIComponent(liveId));
    const pageFields = { courseId: env.context.courseId, classId: env.context.classId, knowledgeId: env.chapter.id, jobId: task.jobid, userId: uid, rt, livesetenc: task.liveSetEnc, isjob: 1, watchingInCourse: 1, customPara1: env.context.classId + '_' + env.context.courseId, customPara2: task.authEnc, jobfs: 0, isNotDrag: task.isNotDrag, livedragenc: task.liveDragEnc, sw: 1, ds: 0, liveswdsenc: task.liveSwDsEnc };
    for (const [key, value] of Object.entries(pageFields)) if (value !== undefined) pageUrl.searchParams.set(key, String(value));
    const html = await env.requestText(pageUrl.href);
    const line = assignedObject(html, 'lineVideo');
    const threshold = duration * (rt <= 0.9 ? rt + 0.1 : 1);
    let position = 0, target = Math.max(0, threshold - watched), userInfo = '';
    if (line) {
        const length = finite(line.videoLongtime, '直播回放时长', 0.001);
        const start = /\bvideoPlayStartTime\s*=\s*([^;,\r\n<]+)/.exec(html);
        let startValue;
        try { startValue = JSON.parse(start?.[1] || ''); }
        catch (_) { throw new Error('直播回放起点必须为数字'); }
        if (typeof startValue !== 'number') throw new Error('直播回放起点必须为数字');
        position = finite(startValue, '直播回放起点');
        target = Math.min(threshold, length);
        userInfo = scriptString(html, 'uInfo');
        const viewerAddress = scriptString(html, 'viewerUrl');
        if (!viewerAddress.trim()) throw new Error('直播缺少观看地址');
        const viewer = new URL(viewerAddress, pageUrl);
        if (!/^https?:$/.test(viewer.protocol) || !(viewer.hostname === 'chaoxing.com' || viewer.hostname.endsWith('.chaoxing.com'))) throw new Error('直播观看地址无效');
        viewer.searchParams.set('watchMoment', String(position));
        await env.requestText(viewer.href);
        if (Number(data.liveStatus) === 4 && !userInfo) throw new Error('直播回放缺少用户会话标识');
    }
    if (!property.streamName || !property.vdoid) throw new Error('直播上报信息不完整');
    let initial = true;
    while (position <= target) {
        const current = Math.min(position, target);
        await env.retry(async () => {
            const report = await env.requestText('https://zhibo.chaoxing.com/saveTimePc', { streamName: property.streamName, vdoid: property.vdoid, userId: uid, courseId: env.context.courseId, isStart: initial ? 0 : 1, t: Date.now() }, { Referer: pageUrl.href });
            if (!/\bsuccess\b/i.test(report)) throw new Error('直播平台未接受观看进度');
            if (line && Number(data.liveStatus) === 4) {
                const replay = await env.requestText('https://zhibo.chaoxing.com/apis/live/put/watchMoment', { liveId: originalId, streamName: property.streamName, vdoid: property.vdoid, watchMoment: current, t: Date.now(), u: userInfo }, { Referer: pageUrl.href });
                if (!replay.includes('请求成功')) throw new Error('直播平台未接受回放进度');
            }
        }, '直播进度上报');
        initial = false;
        env.progress(target ? Math.round(current / target * 100) : 100);
        if (current >= target) break;
        const next = Math.min(target, current + 30);
        await env.wait((next - current) * 1000, env.signal);
        position = next;
    }
    env.log('直播回放进度已上传，请回到学习通核对完成状态：' + env.name, 'warning');
    return 'pending';
}

module.exports = { runClassReplay, runLive };

},
"tasks/video.js": function(module, exports, require) {
'use strict';
const md5 = require('../core/md5');

async function runVideo(task, env) {
    const uid = [env.context.uid, env.defaults.userid].map(value => String(value || '').trim()).find(value => /^[1-9]\d*$/.test(value));
    if (!uid) throw new Error('缺少用户 ID，视频未执行');
    const property = task.property;
    if (!task.jobid || !property.objectid || !env.defaults.reportUrl) throw new Error('视频任务参数不完整，未执行');
    const status = await env.requestJSON('/ananas/status/' + encodeURIComponent(property.objectid), { flag: 'normal', _dc: Date.now(), k: env.defaults.fid || env.context.fid || '666' });
    const duration = Number(status.duration);
    if (status.status !== 'success' || !Number.isFinite(duration) || duration <= 0 || !status.dtoken) throw new Error('视频状态或时长无效');
    const configuredRate = Number(env.settings.get('beisu', 1));
    const rateAllowed = Number(property.doublespeed) === 1 || String(property.fastforward ?? false) === 'false';
    const rate = rateAllowed ? configuredRate : 1;
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('视频倍速无效');
    const rt = Number(property.rt ?? 0.9);
    if (!Number.isFinite(rt) || rt <= 0) throw new Error('视频上报参数无效');
    const reportPath = env.defaults.reportUrl.replace(/\/$/, '') + '/' + encodeURIComponent(status.dtoken);
    const interval = '0_' + duration;
    let position = 0;
    for (;;) {
        const signature = `[${env.context.classId}][${uid}][${task.jobid}][${property.objectid}][${position * 1000}][d_yHJ!$pdA~5][${duration * 1000}][${interval}]`;
        const result = await env.retry(async () => {
            const report = await env.requestJSON(reportPath, { clazzId: env.context.classId, playingTime: position, duration, clipTime: interval,
                objectId: property.objectid, otherInfo: task.otherInfo || '', jobid: task.jobid, userid: uid, isdrag: position === duration ? 4 : 3,
                enc: md5(signature), rt, dtype: 'Video', view: 'pc', _t: Date.now(),
                attDuration: task.attDuration || '0', attDurationEnc: task.attDurationEnc || '', videoFaceCaptureEnc: task.videoFaceCaptureEnc || '' });
            if (!report || typeof report.isPassed !== 'boolean') throw new Error('视频上报响应缺少确认状态');
            return report;
        }, '视频进度上报');
        env.progress(Math.floor(position / duration * 100));
        if (result.isPassed === true) { env.log('视频任务完成：' + env.name, 'success'); return 'confirmed'; }
        if (position === duration) throw new Error('视频进度已上传，平台未确认完成');
        const next = Math.min(duration, position + 60 * rate);
        await env.wait((next - position) / rate * 1000, env.signal);
        position = next;
    }
}

module.exports = { runVideo };

},
"tasks/work.js": function(module, exports, require) {
'use strict';

async function runWork(task, env) {
    if (!env.bank || typeof env.bank.getToken !== 'function' || !env.bank.getToken()) {
        env.log('未连接题库，跳过章节测验：' + env.name, 'warning');
        return 'skipped';
    }
    const property = task.property;
    const workId = task.jobid ? String(task.jobid).replace(/^work-/, '') : property.workid || String(property._jobid || '').replace(/^work-/, '');
    const jobId = task.jobid || property._jobid || (property.workid ? 'work-' + property.workid : '');
    if (!workId) throw new Error('章节测验缺少试卷 ID');
    if (typeof env.questions?.openPage !== 'function') throw new Error('章节测验页面加载器不可用');
    const url = new URL(env.nonJob ? '/mooc-ans/work/phone/work' : '/work/phone/work', env.context.origin);
    const parameters = { workId, courseId: env.context.courseId, clazzId: env.context.classId, knowledgeId: env.chapter.id, jobId: env.nonJob ? '' : jobId, enc: task.enc || '' };
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
    const page = await env.questions.openPage(url.href, { signal: env.signal });
    const result = await env.questions.run(page.document, { signal: env.signal, useAi: Boolean(env.settings.get('doAI', false)), apply: true });
    if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
    if (result.stopped) {
        env.log('章节查询已停止，本次不自动保存或提交，请人工核对：' + env.name, 'warning');
        return result.answered ? 'pending' : 'skipped';
    }
    if (!result.total || !result.answered) { env.log('章节测验没有可填写的参考答案，已跳过：' + env.name, 'warning'); return 'skipped'; }
    const host = page.window;
    const threshold = Number(env.settings.get('vgqtlv', 80));
    const canSubmit = env.settings.get('autoSubmit', false) && Number.isFinite(threshold) && result.accuracy >= threshold && typeof host?.toadd === 'function' && typeof host?.submitAction === 'function';
    if (canSubmit) {
        await host.toadd();
        if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
        await host.submitAction();
    }
    else if (typeof host?.noSubmit === 'function') await host.noSubmit();
    env.log('章节测验参考答案已填写' + (canSubmit ? '并请求提交' : '，请人工核对') + '；完成状态待核实：' + env.name, 'warning');
    return 'pending';
}

module.exports = { runWork };

},
"ui/account.js": function(module, exports, require) {
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

},
"ui/dashboard.css": function(module, exports, require) {
module.exports = ".yixue-dashboard { --canvas:#f5f5f7; --surface:#fff; --ink:#1d1d1f; --secondary:#737780; --blue:#007aff; --line:#e9eaf0; min-height:100vh; color:var(--ink); background:var(--canvas); font:14px/1.6 -apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif; -webkit-font-smoothing:antialiased; }\n.yixue-dashboard *, .yixue-dashboard *::before, .yixue-dashboard *::after { box-sizing:border-box; }\n.yixue-dashboard button, .yixue-dashboard input { font:inherit; }\n.yixue-dashboard button { cursor:pointer; touch-action:manipulation; }\n.yixue-dashboard button:disabled { cursor:wait; opacity:.55; }\n.yixue-dashboard h1, .yixue-dashboard h2, .yixue-dashboard p { margin:0; }\n.yixue-dashboard button:focus-visible, .yixue-dashboard input:focus-visible { outline:3px solid #87baff; outline-offset:3px; }\n.yixue-dashboard .container-fluid { width:100%; max-width:1360px; margin:0 auto; padding:26px 30px 24px; }\n.yixue-topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:0 4px 20px; }\n.yixue-brand { display:flex; align-items:center; gap:11px; }\n.yixue-brand-mark { width:36px; height:36px; display:grid; place-items:center; border-radius:11px; }\n.yixue-brand-mark img { display:block; width:100%; height:100%; object-fit:contain; border-radius:inherit; }\n.yixue-brand-name { font-size:15px; font-weight:650; letter-spacing:.3px; }\n.yixue-brand-subtitle { display:block; color:var(--secondary); font-size:11px; margin-top:-1px; }\n.yixue-dashboard .yixue-connection-status { display:inline-flex; align-items:center; gap:7px; padding:6px 12px; border:1px solid #dedfe5; border-radius:999px; background:#ffffffa6; font-size:12px; font-weight:550; color:#686c76; white-space:nowrap; }\n.yixue-dashboard .yixue-connection-status::before { content:\"\"; width:6px; height:6px; border-radius:50%; background:#999da8; }\n.yixue-dashboard .yixue-connection-status[data-connected=\"true\"] { background:#eefaf2; border-color:#d8efdf; color:#237440; }\n.yixue-dashboard .yixue-connection-status[data-connected=\"true\"]::before { background:#31a555; }\n.yixue-page-heading { padding:0 4px 20px; }\n.yixue-dashboard .yixue-eyebrow { font-size:11px; letter-spacing:1.5px; font-weight:650; color:#8b8e99; margin-bottom:6px; }\n#yixue-course-name { font-size:clamp(25px,2.6vw,34px); letter-spacing:-.8px; font-weight:680; line-height:1.35; overflow-wrap:anywhere; }\n.yixue-dashboard .yixue-page-subtitle { color:var(--secondary); font-size:13px; margin-top:8px; }\n.yixue-dashboard-columns { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; align-items:start; }\n.yixue-dashboard-column { min-width:0; }\n.yixue-dashboard .card { background:var(--surface); border:1px solid #e6e7ec; border-radius:22px; overflow:hidden; box-shadow:0 3px 14px #1d274005; margin-bottom:18px; }\n.yixue-dashboard .card-body { padding:22px; }\n.yixue-card-heading { display:flex; align-items:center; gap:10px; margin-bottom:18px; }\n.yixue-dashboard .yixue-card-title { font-size:16px; font-weight:650; letter-spacing:-.2px; }\n.yixue-card-caption { margin-left:auto; font-size:11px; color:#8c8f99; }\n.yixue-task-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; }\n.yixue-dashboard .btn { border:1px solid transparent; border-radius:13px; min-height:44px; padding:10px 15px; display:inline-flex; align-items:center; justify-content:center; gap:6px; color:var(--ink); font-weight:550; white-space:nowrap; transition:background .15s,transform .15s; }\n.yixue-dashboard .btn:active { transform:scale(.98); }\n.yixue-dashboard .btn-light { background:#f3f4f6; color:#696e79; }\n.yixue-dashboard .btn-primary { background:#eaf3ff; color:#006cde; }\n.yixue-task-grid>.btn { width:100%; justify-content:flex-start; gap:9px; padding:12px; min-height:56px; background:#f7f8fa; border-color:#f0f1f4; color:#686e7b; font-size:13px; }\n.yixue-task-grid>.btn-primary { background:#f2f7ff; border-color:#e0ebfc; color:#245d9c; }\n.yixue-toggle-track { margin-left:auto; position:relative; flex-shrink:0; width:31px; height:19px; border-radius:20px; background:#d9dce3; transition:background .2s; }\n.yixue-toggle-track::after { content:\"\"; position:absolute; top:2px; left:2px; width:15px; height:15px; border-radius:50%; background:#fff; box-shadow:0 1px 3px #0002; transition:transform .2s; }\n.yixue-dashboard .btn-primary .yixue-toggle-track { background:var(--blue); }\n.yixue-dashboard .btn-primary .yixue-toggle-track::after { transform:translateX(12px); }\n.yixue-run-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }\n.yixue-run-actions>.btn { flex:1 1 150px; }\n.yixue-dashboard .btn-success { background:var(--blue); color:#fff; border-color:var(--blue); }\n.yixue-dashboard .btn-success:hover { background:#0069df; }\n.yixue-dashboard .btn-outline-primary { background:#f0f6ff; border-color:#e5edfb; color:#006de0; }\n.yixue-dashboard .yixue-account { display:grid; gap:12px; margin-bottom:20px; }\n.yixue-dashboard .yx-account-field { min-width:0; padding:14px; background:#fafbfc; border:1px solid #edf0f4; border-radius:16px; }\n.yixue-dashboard .yx-account-label { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 0 9px; font-size:12px; color:#656b76; font-weight:550; }\n.yixue-dashboard .yx-input-row { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }\n.yixue-dashboard .yx-input-row>input { flex:1 1 140px; min-width:0; width:100%; }\n.yixue-dashboard input { height:44px; padding:10px 12px; background:#f6f7f9; color:#3c4451; border:1px solid #e6e9ef; border-radius:11px; font-size:13px; font-variant-numeric:tabular-nums; }\n.yixue-dashboard input:focus { background:#fff; border-color:#8ebdff; }\n.yixue-dashboard input[readonly] { color:#757c88; }\n.yixue-dashboard .yx-button { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:10px 13px; flex-shrink:0; border:1px solid #e0ebfc; border-radius:11px; color:#006fe8; background:#edf4ff; white-space:nowrap; font-size:12px; font-weight:550; }\n.yixue-dashboard .yx-refresh { border:0; padding:6px 0; background:none; color:#007aff; font-size:11px; white-space:nowrap; }\n.yixue-dashboard .yx-balance-line { display:flex; align-items:center; position:relative; }\n.yixue-dashboard .yx-balance-line>input { width:100%; min-width:0; padding-right:84px; }\n.yixue-dashboard .yx-balance-line>.yx-refresh { position:absolute; right:12px; }\n.yixue-dashboard [data-yixue-balance] { color:#8b909b; font-size:11px; line-height:1.7; margin-top:9px; overflow-wrap:anywhere; }\n.yixue-dashboard .yx-account-connect { margin-top:10px; }\n.yixue-dashboard .yx-error { color:#b73e47; font-size:12px; margin-top:5px; }\n.yixue-dashboard .yx-error:empty { display:none; }\n.yixue-config-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-bottom:20px; }\n.yixue-config-field { min-width:0; }\n.yixue-config-field label { display:block; font-size:12px; color:#656b76; margin-bottom:7px; }\n.yixue-config-field input { width:100%; }\n.yixue-answer-options { display:grid; gap:12px; margin-bottom:20px; }\n.yixue-answer-option { display:flex; align-items:flex-start; gap:9px; cursor:pointer; }\n.yixue-dashboard .yixue-answer-option input { flex:0 0 17px; width:17px; height:17px; padding:0; margin:2px 0 0; accent-color:#007aff; }\n.yixue-answer-option strong { display:block; color:#5c6675; font-size:12px; font-weight:550; }\n.yixue-answer-option small { display:block; color:#969da8; font-size:10px; line-height:1.8; margin-top:3px; }\n.yixue-number-field { position:relative; }\n.yixue-number-field input { padding-right:35px; }\n.yixue-field-suffix { position:absolute; right:13px; top:10px; color:#9a9eaa; font-size:12px; pointer-events:none; }\n.yixue-save-row { display:flex; align-items:center; flex-wrap:wrap; gap:12px; border-top:1px solid var(--line); padding-top:16px; }\n.yixue-save-hint { color:#8b909b; font-size:11px; }\n.yixue-stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:22px; }\n.yixue-stat { background:#f7f8fa; padding:17px 18px; border:1px solid #f0f1f4; border-radius:15px; }\n.yixue-stat-label { display:block; color:#8a909b; font-size:11px; margin-bottom:4px; }\n.yixue-stat-value { font-size:29px; line-height:1.3; font-weight:650; font-variant-numeric:tabular-nums; letter-spacing:-1px; }\n.yixue-stat-value.accent { color:var(--blue); }\n.yixue-progress-heading { display:flex; justify-content:space-between; gap:12px; font-size:12px; color:#6d7480; margin-bottom:10px; }\n#yixue-course-progress-value { font-variant-numeric:tabular-nums; color:#0071ed; font-weight:650; }\n.yixue-dashboard .progress { overflow:hidden; height:8px; border-radius:99px; background:#eff0f4; }\n.yixue-dashboard .progress-bar { height:100%; background:var(--blue); border-radius:99px; transition:width .25s; }\n.yixue-dashboard .yixue-progress-note { margin-top:10px; color:#989da7; font-size:10px; }\n.yixue-log { overflow:auto; height:380px; scrollbar-width:thin; scrollbar-color:#d8dbe3 transparent; overflow-wrap:anywhere; font-size:12px; line-height:1.8; }\n.yixue-dashboard .yixue-log-line { padding:9px 1px; border-bottom:1px solid #f0f1f4; }\n.yixue-log-line[data-tone=\"error\"] { color:#bd3d4a; }\n.yixue-log-line[data-tone=\"success\"] { color:#247a4d; }\n.yixue-footer { padding:10px 0 0; text-align:center; color:#a3a7af; font-size:10px; letter-spacing:.3px; }\n@media(max-width:1100px) { .yixue-task-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }\n@media(max-width:900px) { .yixue-dashboard-columns { grid-template-columns:minmax(0,1fr); gap:0; } .yixue-dashboard .container-fluid { max-width:720px; padding:22px 20px; } .yixue-log { height:300px; } }\n@media(max-width:560px) { .yixue-dashboard .container-fluid { padding:19px 16px; } .yixue-topbar { padding-bottom:24px; } .yixue-brand-subtitle { display:none; } .yixue-dashboard .yixue-connection-status { font-size:10px; padding:5px 9px; } .yixue-dashboard .card { border-radius:20px; margin-bottom:14px; } .yixue-dashboard .card-body { padding:18px; } .yixue-card-caption { font-size:10px; } .yixue-task-grid { gap:8px; } .yixue-task-grid>.btn { padding:10px; gap:7px; font-size:12px; } .yixue-stat { padding:14px; } .yixue-dashboard .yixue-page-subtitle { font-size:12px; } }\n@media(prefers-reduced-motion:reduce) { .yixue-dashboard *, .yixue-dashboard *::before, .yixue-dashboard *::after { transition:none!important; scroll-behavior:auto!important; } }\n";
},
"ui/dashboard.js": function(module, exports, require) {
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

},
"ui/dialogs.css": function(module, exports, require) {
module.exports = ".yx-modal-layer { position:fixed; inset:0; z-index:2147483600; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box; background:#18213166; backdrop-filter:blur(8px); font:14px/1.6 -apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif; color:#1d1d1f; }\n.yx-modal-layer *, .yx-modal-layer *::before, .yx-modal-layer *::after { box-sizing:border-box; }\n.yx-modal-backdrop { position:absolute; inset:0; }\n.yx-course-sheet { position:relative; width:min(900px,100%); max-height:calc(100dvh - 40px); overflow:auto; background:#fff; padding:28px; border:1px solid #ffffffb3; border-radius:26px; box-shadow:0 28px 90px #111a3038; }\n.yx-course-sheet.yx-compact { width:min(540px,100%); }\n.yx-course-heading { display:flex; align-items:center; gap:12px; margin-bottom:23px; }\n.yx-course-mark { display:grid; place-items:center; flex-shrink:0; width:42px; height:42px; border-radius:13px; background:#007aff; color:#fff; font-size:24px; font-weight:650; }\n.yx-course-mark:has(img) { background:transparent; }\n.yx-course-mark img { display:block; width:100%; height:100%; object-fit:contain; border-radius:inherit; }\n.yx-course-sheet h2 { font-family:inherit; font-weight:650; font-size:21px; line-height:1.35; margin:0; color:#1d1d1f; letter-spacing:-.5px; }\n.yx-course-subtitle { margin:4px 0 0; color:#737b88; font-size:12px; }\n.yx-close { display:grid; place-items:center; width:32px; height:32px; flex-shrink:0; margin-left:auto; border:0; border-radius:50%; background:#f0f1f4; color:#7c8390; font:22px/1 sans-serif; cursor:pointer; }\n.yx-account-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:23px; }\n.yx-account-field { min-width:0; padding:16px; border:1px solid #e9ecf2; border-radius:17px; background:#fafbfc; }\n.yx-account-label { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; color:#606977; font-size:12px; font-weight:550; }\n.yx-input-row { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }\n.yx-course-sheet input { flex:1 1 120px; min-width:0; width:100%; height:44px; padding:10px 12px; border:1px solid #e0e5ed; border-radius:11px; background:#fff; color:#465161; outline:none; font-family:inherit; font-size:13px; line-height:1.5; font-variant-numeric:tabular-nums; }\n.yx-course-sheet input:focus { border-color:#82b7ff; box-shadow:0 0 0 3px #007aff12; }\n.yx-course-sheet input[readonly] { background:#f1f3f6; color:#737c89; }\n.yx-course-sheet .yx-balance-line { display:flex; align-items:center; position:relative; }\n.yx-course-sheet .yx-balance-line input { padding-right:84px; }\n.yx-course-sheet .yx-balance-line .yx-refresh { position:absolute; right:12px; }\n.yx-course-sheet .yx-account-connect { margin-top:10px; }\n.yx-course-sheet .yx-error:empty { display:none; }\n.yx-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:44px; padding:10px 15px; flex-shrink:0; border:1px solid #e0ebfc; border-radius:11px; color:#006fe8; background:#edf4ff; text-decoration:none; white-space:nowrap; font:inherit; font-size:13px; font-weight:550; cursor:pointer; transition:background .15s,transform .15s; }\n.yx-button:hover { background:#e2edff; }\n.yx-button:active, .yx-action:active { transform:scale(.98); }\n.yx-button.yx-primary { border-color:#007aff; background:#007aff; color:#fff; }\n.yx-button.yx-quiet { background:#f1f2f5; color:#626c7b; border-color:#ebedf2; }\n.yx-refresh { border:0; padding:0; background:none; color:#007aff; font:inherit; font-size:11px; cursor:pointer; white-space:nowrap; }\n.yx-refresh:disabled { color:#9aa3b1; cursor:wait; }\n.yx-course-sheet [data-yixue-balance] { font-size:11px; line-height:1.7!important; margin-top:9px!important; color:#757f8d; }\n.yx-course-sheet .yixue-connection-status { display:inline-flex; align-items:center; gap:5px; border-radius:99px; padding:3px 8px; background:#eef0f4; color:#737c8c; font-size:10px; white-space:nowrap; }\n.yx-course-sheet .yixue-connection-status::before { content:\"\"; width:5px; height:5px; background:#99a1ae; border-radius:50%; }\n.yx-course-sheet .yixue-connection-status[data-connected=\"true\"] { color:#287246; background:#eaf7ee; }\n.yx-course-sheet .yixue-connection-status[data-connected=\"true\"]::before { background:#39a160; }\n.yx-action-heading { margin:0 0 4px; font-size:15px; font-weight:650; }\n.yx-body-copy { margin:0 0 17px; font-size:12px; color:#737d8c; line-height:1.8; }\n.yx-action-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }\n.yx-action { display:flex; flex-direction:column; align-items:flex-start; gap:5px; min-width:0; padding:17px 14px; border:1px solid #e9ecf2; border-radius:17px; background:#f6f8fb; text-align:left; color:#425166; font:inherit; cursor:pointer; transition:background .15s,transform .15s; }\n.yx-action:hover { background:#edf3fb; }\n.yx-action-main { color:#fff; border-color:#007aff; background:#007aff; }\n.yx-action-main:hover { background:#006ce6; }\n.yx-action-icon { display:grid; place-items:center; width:28px; height:28px; margin-bottom:5px; border:1px solid #dfe8f6; border-radius:9px; color:#0679f4; background:#fff; font-size:15px; }\n.yx-action-main .yx-action-icon { color:#fff; background:#ffffff26; border-color:#ffffff22; }\n.yx-action-title { font-size:15px; font-weight:600; white-space:nowrap; }\n.yx-action-description { font-size:10px; line-height:1.7; color:#828c9c; }\n.yx-action-main .yx-action-description { color:#ffffffcf; }\n.yx-entry-footer { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top:24px; padding-top:18px; border-top:1px solid #edf0f4; }\n.yx-entry-footer small { color:#818a98; font-size:11px; line-height:1.8; }\n.yx-choice-grid { display:grid; grid-template-columns:1fr; gap:11px; margin-top:20px; }\n.yx-choice { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 14px; border:1px solid #e9ecf3; border-radius:15px; background:#f8fafe; }\n.yx-choice .yx-button { flex:0 0 auto; min-width:145px; }\n.yx-choice small { color:#7c8797; font-size:11px; line-height:1.7; }\n.yx-course-sheet .yx-form-input { display:block; width:100%; margin:18px 0 12px; }\n.yx-error { color:#b73e47; font-size:12px; min-height:20px; margin:0 0 10px; }\n.yx-course-sheet button:focus-visible, .yx-course-sheet a:focus-visible { outline:3px solid #83b7ff; outline-offset:3px; }\n@media(max-width:640px) { .yx-modal-layer { padding:14px; } .yx-course-sheet { padding:21px; border-radius:23px; max-height:calc(100dvh - 28px); } .yx-course-sheet h2 { font-size:18px; } .yx-course-mark { width:36px; height:36px; font-size:21px; border-radius:11px; } .yx-course-heading { gap:10px; margin-bottom:19px; } .yx-account-grid { grid-template-columns:1fr; gap:11px; } .yx-account-field { padding:13px; } .yx-action-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .yx-entry-footer { align-items:flex-start; gap:12px; } .yx-choice { padding:12px; } .yx-choice .yx-button { min-width:130px; font-size:12px; } }\n@media(prefers-reduced-motion:reduce) { .yx-button, .yx-action { transition:none; } }\n        \n";
},
"ui/dom.js": function(module, exports, require) {
'use strict';

function element(document, tag, properties = {}, children = []) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(properties)) {
        if (value === undefined || value === null) continue;
        if (name === 'text') node.textContent = String(value);
        else if (name === 'className') node.className = value;
        else if (name === 'onClick') node.addEventListener('click', value);
        else if (name in node && !name.startsWith('aria')) node[name] = value;
        else node.setAttribute(name, String(value));
    }
    for (const child of children.flat()) {
        if (child !== undefined && child !== null) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
}

function button(document, text, onClick, properties = {}) {
    return element(document, 'button', { type: 'button', text, onClick, ...properties });
}

function brand(document, logoUrl, className) {
    return element(document, 'span', { className }, [element(document, 'img', {
        src: logoUrl, alt: '易学助手', referrerPolicy: 'no-referrer', width: 42, height: 42,
    })]);
}

function appendLog(document, target, message, tone = 'info') {
    const line = element(document, 'div', { className: 'yixue-log-line', text: message, 'data-tone': tone });
    target.append(line);
    while (target.childElementCount > 500) target.firstElementChild.remove();
    target.scrollTop = target.scrollHeight;
}

module.exports = { element, button, brand, appendLog };

},
"ui/entry.js": function(module, exports, require) {
'use strict';

const { element, button } = require('./dom');
const createAccountView = require('./account');

function createEntry(context, callbacks) {
    const { document, bank, access, modal, connect, saveToken } = context;
    const dialog = modal.open({ id: 'yixue-entry', title: '易学助手', subtitle: '选择需要使用的课程功能' });
    const account = createAccountView({ document, bank, prefix: 'yixue-entry', onConnect: connect, onSave: saveToken, getDisplayToken: access.getDisplayToken });
    dialog.onCleanup(account.destroy);
    const grid = element(document, 'div', { className: 'yx-action-grid' });
    const actions = [
        ['course', '刷章节', '视频、文档与章节测验', '▶', callbacks.onCourse],
        ['homework', '刷作业', '查看并辅助填写作业', '✓', callbacks.onHomework],
        ['exam', '刷考试', '进入课程考试页面', '▦', callbacks.onExam],
        ['visits', '刷学习次数', '更新本课程学习记录', '↻', callbacks.onVisits],
    ];
    for (const [name, title, description, icon, callback] of actions) {
        const action = button(document, '', () => {
            dialog.close();
            Promise.resolve().then(() => callback?.()).catch(() => {});
        }, { id: `yixue-open-${name}`, className: `yx-action${name === 'course' ? ' yx-action-main' : ''}`, 'aria-label': title });
        action.append(
            element(document, 'span', { className: 'yx-action-icon', text: icon, 'aria-hidden': 'true' }),
            element(document, 'span', { className: 'yx-action-title', text: title }),
            element(document, 'span', { className: 'yx-action-description', text: description }),
        );
        grid.append(action);
    }
    dialog.sheet.append(account.element,
        element(document, 'h3', { className: 'yx-action-heading', text: '课程任务' }),
        element(document, 'p', { className: 'yx-body-copy', text: '按需选择功能，执行状态会显示在对应面板。' }), grid,
        element(document, 'div', { className: 'yx-entry-footer' }, [
            element(document, 'small', { text: '脚本免费使用 · 题库服务以账户规则为准' }),
            button(document, '取消', () => dialog.close(), { id: 'yixue-entry-cancel', className: 'yx-button yx-quiet' }),
        ]),
    );
    return dialog;
}

module.exports = createEntry;

},
"ui/index.js": function(module, exports, require) {
'use strict';

const dialogCss = require('./dialogs.css');
const dashboardCss = require('./dashboard.css');
const questionCss = require('./question-panel.css');
const { element, button } = require('./dom');
const createModalHost = require('./modal');
const createEntry = require('./entry');
const createDashboard = require('./dashboard');
const { createQuestionPanel } = require('./question-panel');

function createUi({ document, window, bank, access, settings, logoUrl = 'https://yixue-cmg.pages.dev/assets/yixue-logo.png', onTokenSaved }) {
    const root = element(document, 'div', { id: 'yixue-ui-root' });
    const style = element(document, 'style', { 'data-yixue-ui-style': '', text: [dialogCss, dashboardCss, questionCss].join('\n') });
    (document.head || document.documentElement).append(style);
    (document.body || document.documentElement).append(root);
    const modal = createModalHost({ document, window, root, logoUrl });
    const surfaces = new Set();
    let tokenFlight = null;
    let accessFlight = null;
    let disposed = false;
    const connect = () => window.open(bank.base?.() || 'https://tk.sanzwk.com', '_blank', 'noopener,noreferrer');
    async function saved(value, forAccess = false) {
        const token = forAccess ? access.saveToken(value) : bank.setToken(String(value).trim()) || bank.getToken();
        await onTokenSaved?.(token);
        if (bank.getToken()) await bank.refreshBalance({ force: true });
        return token;
    }
    const context = { document, window, root, bank, access, settings, logoUrl, modal, connect, saveToken: value => saved(value, true) };
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
            const input = element(document, 'input', { id: 'yixue-api-token', className: 'yx-form-input', type: 'password', autocomplete: 'off', spellcheck: false, value: bank.getToken(), 'aria-label': '搜题 API Token', placeholder: 'tk_…' });
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

},
"ui/modal.js": function(module, exports, require) {
'use strict';

const { element, button, brand } = require('./dom');

function createModalHost({ document, window, root, logoUrl }) {
    const stack = [];
    const focusable = sheet => [...sheet.querySelectorAll('button, input, a[href], select, textarea, [tabindex]')]
        .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    const keyboard = event => {
        const modal = stack.at(-1);
        if (!modal) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            modal.close();
        } else if (event.key === 'Tab') {
            const items = focusable(modal.sheet);
            const index = items.indexOf(document.activeElement);
            if (!items.length) {
                event.preventDefault();
                modal.sheet.focus();
            } else if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === items.length - 1)) {
                event.preventDefault();
                items[event.shiftKey ? items.length - 1 : 0].focus();
            }
            event.stopImmediatePropagation();
        }
    };
    window.addEventListener('keydown', keyboard, true);

    function open({ id, title, subtitle = '', compact = false, onClose = () => {} }) {
        const previousFocus = document.activeElement;
        const layer = element(document, 'div', { id: `${id}-layer`, className: 'yx-modal-layer', 'data-yixue-course-ui': 'true' });
        const backdrop = element(document, 'div', { className: 'yx-modal-backdrop', 'aria-hidden': 'true' });
        const sheet = element(document, 'section', {
            id, className: `yx-course-sheet${compact ? ' yx-compact' : ''}`, role: 'dialog',
            'aria-modal': 'true', 'aria-label': title, tabIndex: -1,
        });
        const heading = element(document, 'div', { className: 'yx-course-heading' }, [
            brand(document, logoUrl, 'yx-course-mark'),
            element(document, 'div', {}, [element(document, 'h2', { text: title }), element(document, 'p', { className: 'yx-course-subtitle', text: subtitle })]),
        ]);
        const closeButton = button(document, '×', () => close(), { className: 'yx-close', 'aria-label': '关闭' });
        heading.append(closeButton);
        sheet.append(heading);
        layer.append(backdrop, sheet);
        root.append(layer);
        let closed = false;
        const cleanups = [];
        function close(value) {
            if (closed) return;
            closed = true;
            const wasTop = stack.at(-1) === handle;
            const index = stack.indexOf(handle);
            if (index >= 0) stack.splice(index, 1);
            for (const cleanup of cleanups) cleanup();
            layer.remove();
            onClose(value);
            if (wasTop) {
                const upper = stack.at(-1);
                if (upper) (focusable(upper.sheet)[0] || upper.sheet).focus();
                else if (previousFocus?.isConnected) previousFocus.focus?.();
            }
        }
        const handle = { sheet, layer, close, destroy: close, onCleanup: cleanup => cleanups.push(cleanup), get closed() { return closed; } };
        stack.push(handle);
        backdrop.addEventListener('click', () => { if (stack.at(-1) === handle) close(); });
        window.queueMicrotask(() => {
            if (!closed && stack.at(-1) === handle) (focusable(sheet)[0] || sheet).focus();
        });
        return handle;
    }

    return {
        open,
        closeAll: () => { for (const modal of [...stack].reverse()) modal.close(); },
        destroy: () => { for (const modal of [...stack].reverse()) modal.close(); window.removeEventListener('keydown', keyboard, true); },
    };
}

module.exports = createModalHost;

},
"ui/question-panel.css": function(module, exports, require) {
module.exports = ".yixue-question-panel { position:fixed; top:18px; right:18px; z-index:2147483000; width:360px; max-width:calc(100vw - 20px); color:#202530; background:#fff; border:1px solid #e7ebf1; border-radius:22px; box-shadow:0 16px 60px #17263c24; overflow:hidden; font:13px/1.6 -apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif; }\n.yixue-question-panel *, .yixue-question-panel *::before, .yixue-question-panel *::after { box-sizing:border-box; }\n.yixue-question-header { display:flex; align-items:center; gap:9px; padding:13px 15px; background:#f9fafc; border-bottom:1px solid #edf0f4; cursor:grab; touch-action:none; user-select:none; }\n.yixue-question-panel.is-dragging .yixue-question-header { cursor:grabbing; }\n.yixue-question-header strong { font-size:14px; font-weight:650; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.yixue-question-mark, .yixue-question-mark img { display:block; width:28px; height:28px; object-fit:contain; border-radius:9px; }\n.yixue-panel-icon { display:grid; place-items:center; width:29px; height:29px; border:0; border-radius:50%; background:#edf0f5; color:#647082; font:20px/1 sans-serif; cursor:pointer; }\n.yixue-question-body { padding:15px; max-height:calc(100dvh - 86px); overflow:auto; }\n.yixue-question-body[hidden] { display:none; }\n.yixue-masked-token { display:block; margin-bottom:8px; font-size:11px; color:#8791a1; font-variant-numeric:tabular-nums; }\n.yixue-question-balance { min-height:54px; padding:11px 12px; border-radius:13px; background:#f5f8fc; color:#637083; font-size:11px; overflow-wrap:anywhere; }\n.yixue-question-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; }\n.yixue-panel-button { flex:1 1 120px; min-height:37px; padding:8px 10px; border:1px solid #e6edf8; border-radius:11px; background:#edf4ff; color:#0873df; font:inherit; font-size:11px; font-weight:550; cursor:pointer; white-space:nowrap; }\n.yixue-panel-button:disabled { opacity:.5; cursor:wait; }\n.yixue-ai-toggle { background:#f4f5f7; border-color:#eceef2; color:#77818f; }\n.yixue-ai-toggle[aria-checked=\"true\"] { color:#fff; background:#007aff; border-color:#007aff; }\n.yixue-question-panel button:focus-visible { outline:3px solid #88baff; outline-offset:2px; }\n.yixue-question-summary { color:#7d8795; font-size:11px; padding:13px 1px 9px; border-bottom:1px solid #edf0f4; }\n.yixue-question-log { max-height:min(300px,38vh); min-height:72px; overflow:auto; scrollbar-width:thin; font-size:12px; overflow-wrap:anywhere; }\n.yixue-question-log .yixue-log-line { padding:8px 0; border-bottom:1px solid #f0f2f6; }\n@media(max-width:560px) { .yixue-question-panel { top:10px; right:10px; } }\n";
},
"ui/question-panel.js": function(module, exports, require) {
'use strict';

const { element, button, brand, appendLog } = require('./dom');

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
    const pause = button(document, '暂停', async () => {
        paused = !paused;
        pause.textContent = paused ? '继续' : '暂停';
        pause.setAttribute('aria-pressed', String(paused));
        if (!paused) for (const resume of [...pauseWaiters]) resume();
        try { await onPause?.(paused); }
        catch (error) { appendLog(document, logs, error?.message || error, 'error'); }
    }, { className: 'yixue-panel-button', 'aria-pressed': 'false' });
    body.append(token, balance, element(document, 'div', { className: 'yixue-question-actions' }, [connectButton, refresh]),
        element(document, 'div', { className: 'yixue-question-actions' }, [aiToggle, pause]), summary, logs);
    panel.append(header, body);
    root.append(panel);
    function renderBalance() {
        token.textContent = maskToken(bank.getToken());
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
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
            window.removeEventListener('pointercancel', end);
            window.removeEventListener('resize', resize);
            panel.remove();
        },
    };
}

module.exports = { createQuestionPanel, maskToken };

}
};
const cache = Object.create(null);
function load(id, from = '') {
 let parts = id.startsWith('.') ? from.split('/').slice(0, -1).concat(id.split('/')) : id.split('/');
 const normalized = [];
 for (const part of parts) { if (part === '..') normalized.pop(); else if (part && part !== '.') normalized.push(part); }
 let key = normalized.join('/');
 if (!modules[key]) key += '.js';
 if (!modules[key]) throw new Error('Missing module: ' + key);
 if (!cache[key]) { const module = { exports: {} }; cache[key] = module; modules[key](module, module.exports, name => load(name, key)); }
 return cache[key].exports;
}
load('app.js').bootstrap().catch(error => console.error('[易学助手]', error));
})();
