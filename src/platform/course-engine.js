'use strict';
const { delay } = require('../core/primitives');
const { createHttpError } = require('../core/transport');
const { parseCardData, parseCatalog } = require('./card-parser');
const { runVideo } = require('../tasks/video');
const { runDocument, documentTypes } = require('../tasks/documents');
const { runClassReplay, runLive } = require('../tasks/live');
const { runWork } = require('../tasks/work');
const { discoverEngineChapters, discoverNonJobChapters } = require('../tasks/discovery');

const CARD_PAGE_LIMIT = 200, EMPTY_PAGE_LIMIT = 10;
const RECONCILE_INTERVAL = 30000, FINAL_RECONCILE_ATTEMPTS = 2;
const outcomes = ['confirmed', 'skipped', 'failed', 'pending'];
const registrations = new Map([
    ['video', { setting: 'doVideo', execute: runVideo }],
    ['live', { setting: 'doLive', execute: runLive }],
    ['chaoxingClass', { setting: 'doLive', execute: runClassReplay }],
    ['workid', { setting: 'doWork', execute: runWork }],
    ...documentTypes.map(type => [type, { setting: 'doDocument', execute: runDocument }]),
]);

function taskIdentity(task) {
    const id = task?.jobid || task?.property?._jobid || (task?.type === 'workid' ? task?.property?.workid : '');
    return id ? task.type + ':' + (task.type === 'workid' ? String(id).replace(/^work-/, '') : String(id)) : '';
}

function createCourseRunner({ context, transport, settings, bank, questions, emit = () => {}, wait = delay, now = Date.now, prepareVideoSession }) {
    let running = false;
    const log = (message, tone = 'info') => emit({ type: 'log', message, tone });
    const progress = percent => emit({ type: 'progress', percent });
    const remaining = seconds => emit({ type: 'remaining', seconds });
    const parseJSON = text => { try { return JSON.parse(text); } catch (_) { throw new Error('平台响应不是有效 JSON'); } };

    async function run({ challenge = false, signal } = {}) {
        if (running) throw new Error('课程任务正在执行');
        running = true;
        const summary = { confirmed: 0, skipped: 0, failed: 0, pending: 0, chapterIssues: 0 };
        const chaptersWithErrors = new Set();
        let requested = false, platformBlock = null, failures = 0;
        const checkSignal = () => { if (signal?.aborted) throw signal.reason || new Error('任务已取消'); if (platformBlock) throw platformBlock; };
        const inspectError = error => {
            if (platformBlock === error) return error;
            if (error.sessionExpired || [401, 429].includes(error.status) || error.code === 'VERIFICATION_REQUIRED') {
                platformBlock = error;
                if (error.status === 429) error.message = '学习通请求过于频繁，已停止任务，请稍后在课程页重试。' + error.message;
            }
            return error;
        };
        const cooldown = async (queue, failed = false) => {
            if (failed) failures++; else failures = 0;
            if (!queue.length) return;
            const milliseconds = failed ? Math.min(60000, 10000 * 2 ** Math.min(failures - 1, 3)) : 5000;
            log((failed ? '任务异常' : '任务已跳过') + '，等待 ' + milliseconds / 1000 + ' 秒后继续。', failed ? 'warning' : 'skipped');
            await wait(milliseconds, signal);
            checkSignal();
        };
        const requestResponse = async (path, parameters = {}, method = 'GET', headers = {}) => {
            checkSignal();
            if (requested) await wait(1500, signal);
            checkSignal();
            requested = true;
            const url = new URL(path, context.origin);
            for (const [key, value] of Object.entries(parameters)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
            let response;
            try { response = await transport.request({ method, url: url.href, headers }, { signal }); }
            catch (error) { throw inspectError(error); }
            if (response.status < 200 || response.status >= 300) throw inspectError(createHttpError(response, url.href));
            if (/^\s*</.test(response.responseText || '') && /验证码|人机验证|访问验证|captcha/i.test(response.responseText)) {
                const endpoint = createHttpError(response, url.href).endpoint;
                throw inspectError(Object.assign(new Error('学习通返回验证页面，已停止任务，请在课程页完成验证后重试。（HTTP ' + response.status + '；接口：' + endpoint + '）'), { status: response.status, endpoint, retryable: false, code: 'VERIFICATION_REQUIRED' }));
            }
            return response;
        };
        const requestText = async (path, parameters, headers) => (await requestResponse(path, parameters, 'GET', headers)).responseText;
        const requestJSON = async (path, parameters, headers) => {
            const response = await requestResponse(path, parameters, 'GET', headers);
            try { return JSON.parse(response.responseText); }
            catch {
                const text = String(response.responseText || '');
                const verification = /验证码|人机验证|访问验证|captcha/i.test(text);
                const html = /^\s*</.test(text);
                const endpoint = createHttpError(response, new URL(path, context.origin).href).endpoint;
                const message = verification ? '学习通返回验证页面，请在课程页完成验证后重试'
                    : html ? '学习通返回网页内容，接口没有返回 JSON，请在课程页核对登录及任务状态'
                    : '平台响应不是有效 JSON';
                throw Object.assign(new Error(message + '（HTTP ' + response.status + '；接口：' + endpoint + '）'), {
                    status: response.status, endpoint, retryable: !verification && !html,
                    code: verification ? 'VERIFICATION_REQUIRED' : html ? 'UNEXPECTED_HTML' : 'INVALID_JSON',
                });
            }
        };
        const retry = async (operation, label, resource) => {
            const detail = resource ? '；视频：' + String(resource.name || '').replace(/[\r\n]/g, ' ').slice(0, 160)
                + '；位置：' + resource.position + '/' + resource.duration + ' 秒' : '';
            for (let attempt = 1; attempt <= 3; attempt++) {
                try { checkSignal(); return await operation(); }
                catch (error) {
                    inspectError(error);
                    checkSignal();
                    if (error.retryable === false) throw error;
                    if (attempt === 3) throw Object.assign(new Error(label + '连续失败三次：' + error.message + detail, { cause: error }), { status: error.status, endpoint: error.endpoint, retryable: error.retryable, code: error.code });
                    log(label + '失败，正在重试（' + attempt + '/3）：' + error.message + detail, 'warning');
                    await wait(5000 * 2 ** (attempt - 1), signal);
                }
            }
        };
        try {
            checkSignal();
            if (challenge) for (const key of ['doVideo', 'doDocument', 'doWork', 'doLive']) settings.set(key, true);
            let catalog;
            try { catalog = parseCatalog(await requestText('/mycourse/studentstudycourselist', { courseId: context.courseId, clazzid: context.classId, cpi: context.cpi, mooc2: 1 })); }
            catch (error) {
                if (signal?.aborted) checkSignal();
                throw Object.assign(new Error('课程目录读取失败' + (error.retryable === false ? '：' : '，可重试：') + error.message, { cause: error }), { status: error.status, endpoint: error.endpoint, retryable: error.retryable, sessionExpired: error.sessionExpired });
            }
            const discovery = { context, requestResponse, requestJSON, checkSignal, log };
            const sources = [...catalog];
            if (settings.get('doRenwu', false)) sources.push(...await discoverEngineChapters(discovery));
            if (settings.get('doNoMission', false)) sources.push(...await discoverNonJobChapters(discovery));
            const discovered = [...new Map(sources.map(chapter => [String(chapter.id), chapter])).values()];
            const chapters = discovered.filter(chapter => challenge || chapter.remaining !== 0).map(chapter => ({ ...chapter, unresolved: false, done: false, requiredSeen: 0, outcomes: [] }));
            const counts = () => {
                summary.chapterIssues = chaptersWithErrors.size;
                emit({ type: 'counts', total: discovered.length, unconfirmed: chapters.filter(chapter => !chapter.done || chapter.unresolved).length });
                emit({ type: 'summary', ...summary });
            };
            let reconciliationWarned = false, lastReconciliation = now(), displayedOutcome = null;
            const warnReconciliation = () => {
                if (!reconciliationWarned) { reconciliationWarned = true; log('章节完成状态暂未刷新，保留待处理统计，运行期间会继续核验。', 'warning'); }
            };
            const readCard = async (chapter, page, fresh = false) => {
                const referer = new URL('/mycourse/studentstudy', context.origin);
                for (const [key, value] of Object.entries({ chapterId: chapter.id, courseId: context.courseId, clazzid: context.classId, cpi: context.cpi, mooc2: 1 })) if (value !== undefined) referer.searchParams.set(key, value);
                return parseCardData(await requestText('/knowledge/cards', { courseid: context.courseId, clazzid: context.classId, knowledgeid: chapter.id, cpi: context.cpi, num: page, ut: 's', v: '20160407-1', ...(fresh ? { _dc: now() } : {}) }, { Referer: referer.href }));
            };
            const passedInCard = (task, card) => {
                const id = taskIdentity(task);
                const matches = id && card.kind === 'page' ? card.attachments.filter(candidate => taskIdentity(candidate) === id) : [];
                return matches.length > 0 && matches.every(candidate => candidate.isPassed === true);
            };
            const verifyCompletion = async item => {
                if (!taskIdentity(item.task)) return false;
                try { return passedInCard(item.task, await readCard(item.chapter, item.page, true)); }
                catch (error) { checkSignal(); warnReconciliation(); return false; }
            };
            const updateChapter = chapter => {
                chapter.unresolved = chaptersWithErrors.has(chapter.id) || chapter.outcomes.some(outcome => outcome.result !== 'confirmed' && (outcome.required || outcome.result === 'failed'));
            };
            const confirmOutcome = (chapter, outcome) => {
                if (outcome.result === 'confirmed') return;
                summary[outcome.result]--; summary.confirmed++; outcome.result = 'confirmed';
                log('已确认任务完成：' + outcome.name, 'success');
                // Rechecking an earlier chapter must not replace a running video's UI.
                if (displayedOutcome === outcome) {
                    progress(100);
                    emit({ type: 'task', name: outcome.name, chapter: chapter.name, status: 'confirmed', kind: outcome.task.type });
                }
            };
            const reconcile = async (chapter, force = false) => {
                if (!chapter && !force && now() - lastReconciliation < RECONCILE_INTERVAL) return;
                const candidates = (chapter ? [chapter] : chapters).filter(item => item.unresolved && (item.outcomes.some(outcome => outcome.result === 'pending' || outcome.job && outcome.result !== 'confirmed') || chaptersWithErrors.has(item.id)));
                if (!candidates.length) return;
                if (!chapter) lastReconciliation = now();
                try {
                    const fresh = parseCatalog(await requestText('/mycourse/studentstudycourselist', { courseId: context.courseId, clazzid: context.classId, cpi: context.cpi, mooc2: 1, _dc: now() }));
                    for (const target of candidates) {
                        if (fresh.some(item => item.id === target.id && item.remaining === 0)) {
                            chaptersWithErrors.delete(target.id);
                            for (const outcome of target.outcomes) if (outcome.job) confirmOutcome(target, outcome);
                        }
                        const pages = new Map();
                        for (const outcome of target.outcomes) if (outcome.result === 'pending' && taskIdentity(outcome.task)) {
                            if (!pages.has(outcome.page)) pages.set(outcome.page, await readCard(target, outcome.page, true));
                            if (passedInCard(outcome.task, pages.get(outcome.page))) confirmOutcome(target, outcome);
                        }
                        updateChapter(target);
                        if (target.done && !target.unresolved) log('章节已确认完成：' + target.name, 'success');
                    }
                } catch (error) {
                    checkSignal();
                    warnReconciliation();
                }
                for (const target of candidates) updateChapter(target);
                counts();
            };
            const waitForTask = async (milliseconds, taskSignal) => {
                await wait(milliseconds, taskSignal);
                checkSignal();
                await reconcile();
            };
            const issue = (chapter, message) => { chapter.unresolved = true; chaptersWithErrors.add(chapter.id); log('章节读取异常：' + chapter.name + '；' + message, 'danger'); };
            counts(); progress(0); remaining(null);
            if (!chapters.length) {
                log(discovered.length
                    ? `已识别 ${discovered.length} 个章节，目录未发现待处理章节；请以学习通实际任务状态为准。`
                    : '未识别到课程章节，本次未执行任务。请返回课程章节页确认目录已加载，再刷新控制台重试；若仍有任务，可能是目录格式尚未兼容。',
                discovered.length ? 'info' : 'warning');
                return summary;
            }
            const unknown = chapters.filter(chapter => chapter.remaining === null).length;
            log(`已识别 ${discovered.length} 个章节，本次检查 ${chapters.length} 个章节。`);
            if (unknown) log(`${unknown} 个章节的任务计数未知，将读取章节内容逐项确认。`, 'warning');
            // The finite queue contains discovery and execution jobs. Handlers own protocol work.
            const queue = chapters.map(chapter => ({ kind: 'cards', chapter, page: 0, empty: 0 }));
            while (queue.length) {
                checkSignal();
                await reconcile();
                const item = queue.shift();
                const chapter = item.chapter;
                if (item.kind === 'cards') {
                    if (item.page >= CARD_PAGE_LIMIT) { issue(chapter, '分页达到 ' + CARD_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    let page;
                    try {
                        if (challenge && item.page === 0) await requestText('/mooc-ans/mycourse/studentstudyAjax', { courseId: context.courseId, clazzid: context.classId, chapterId: chapter.id });
                        page = await readCard(chapter, item.page);
                    } catch (error) { checkSignal(); issue(chapter, error.message); chapter.done = true; counts(); await cooldown(queue, true); continue; }
                    if (page.kind === 'end') {
                        if (chapter.remaining > 0 && !chapter.requiredSeen) issue(chapter, '目录显示仍有任务，但章节内容未返回任务附件，请在学习通核对');
                        chapter.done = true; await reconcile(chapter); counts(); continue;
                    }
                    const empty = page.attachments.length ? 0 : item.empty + 1;
                    if (empty >= EMPTY_PAGE_LIMIT) { issue(chapter, '连续空任务页达到 ' + EMPTY_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    const tasks = page.attachments.map(task => ({ kind: 'task', chapter, task, defaults: page.defaults, page: item.page }));
                    queue.unshift(...tasks, { kind: 'cards', chapter, page: item.page + 1, empty });
                    continue;
                }
                const task = item.task?.property?.module === 'insertbook' ? { ...item.task, type: 'book' } : item.task;
                const name = (task?.property?.module === 'insertbook' && task.property.bookname) || task?.property?.name || task?.property?.title || task?.type || '未知任务';
                const required = Boolean(task?.job || (task?.type === 'workid' && settings.get('doNoMission', false)));
                if (required) chapter.requiredSeen++;
                let result;
                displayedOutcome = null;
                remaining(null);
                progress(0);
                emit({ type: 'task', name, chapter: chapter.name, status: 'running', kind: task?.type || 'unknown' });
                try {
                    if (!task || typeof task !== 'object' || !task.property || typeof task.property !== 'object' || Array.isArray(task.property)) throw new Error('任务附件格式不正确');
                    const registration = registrations.get(task.type);
                    const nonJobWork = !task.job && task.type === 'workid' && settings.get('doNoMission', false);
                    if (task.isPassed === true) { log('已确认任务完成：' + name, 'success'); result = 'confirmed'; }
                    else if ((!task.job && !nonJobWork) || !registration || !settings.get(registration.setting, true)) { log('已跳过任务：' + name, 'skipped'); result = 'skipped'; }
                    else {
                        if (task.type !== 'video') remaining(null);
                        result = await registration.execute(task, { context, chapter, defaults: item.defaults, settings, bank, questions, signal, wait: waitForTask, requestText, requestJSON, parseJSON, retry, log, progress, remaining, name, nonJob: nonJobWork, verifyCompletion: () => verifyCompletion(item), prepareVideoSession });
                        if (!outcomes.includes(result)) throw new Error('任务处理结果无效');
                    }
                } catch (error) { checkSignal(); if (error.stopCourse === true) throw error; result = 'failed'; log(name + '：' + error.message, 'danger'); }
                if (result === 'confirmed') progress(100);
                summary[result]++;
                displayedOutcome = { required, job: Boolean(task?.job), result, task, name, page: item.page };
                chapter.outcomes.push(displayedOutcome);
                emit({ type: 'task', name, chapter: chapter.name, status: result, kind: task?.type || 'unknown' });
                updateChapter(chapter);
                counts();
                if (result === 'failed' || result === 'skipped') await cooldown(queue, result === 'failed');
                else failures = 0;
            }
            for (let attempt = 0; attempt < FINAL_RECONCILE_ATTEMPTS && chapters.some(chapter => chapter.outcomes.some(outcome => outcome.result === 'pending')); attempt++) {
                if (!attempt) log('仍有任务等待平台更新完成状态，正在进行最后核验。', 'pending');
                await wait(3000, signal);
                checkSignal();
                await reconcile(null, true);
            }
            summary.chapterIssues = chaptersWithErrors.size;
            counts();
            log(`任务遍历结束：已确认完成 ${summary.confirmed} 项，跳过 ${summary.skipped} 项，失败 ${summary.failed} 项，待核实 ${summary.pending} 项${summary.chapterIssues ? `，章节读取异常 ${summary.chapterIssues} 项` : ''}`, 'info');
            return summary;
        } finally { running = false; }
    }
    return { run };
}

module.exports = { createCourseRunner, parseCardData };

