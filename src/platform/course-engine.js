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
const outcomes = ['confirmed', 'skipped', 'failed', 'pending'];
const registrations = new Map([
    ['video', { setting: 'doVideo', execute: runVideo }],
    ['live', { setting: 'doLive', execute: runLive }],
    ['chaoxingClass', { setting: 'doLive', execute: runClassReplay }],
    ['workid', { setting: 'doWork', execute: runWork }],
    ...documentTypes.map(type => [type, { setting: 'doDocument', execute: runDocument }]),
]);

function createCourseRunner({ context, transport, settings, bank, questions, emit = () => {}, wait = delay, prepareVideoSession }) {
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
                emit({ type: 'counts', total: discovered.length, unconfirmed: chapters.filter(chapter => !chapter.done || chapter.unresolved).length });
                emit({ type: 'summary', ...summary });
            };
            let reconciliationWarned = false;
            const reconcile = async chapter => {
                if (!chapter.unresolved || (!chapter.outcomes.some(outcome => outcome.job && outcome.result !== 'confirmed') && !chaptersWithErrors.has(chapter.id))) return;
                try {
                    const fresh = parseCatalog(await requestText('/mycourse/studentstudycourselist', { courseId: context.courseId, clazzid: context.classId, cpi: context.cpi, mooc2: 1 }));
                    if (!fresh.some(item => item.id === chapter.id && item.remaining === 0)) return;
                    chaptersWithErrors.delete(chapter.id);
                    for (const outcome of chapter.outcomes) if (outcome.job && outcome.result !== 'confirmed') {
                        summary[outcome.result]--; summary.confirmed++; outcome.result = 'confirmed';
                    }
                    chapter.unresolved = chapter.outcomes.some(outcome => outcome.required && outcome.result !== 'confirmed');
                    if (chapter.unresolved) { log('本章任务点已确认完成，非任务点仍待核实：' + chapter.name, 'warning'); return; }
                    log('章节已确认完成：' + chapter.name, 'success');
                    progress(100);
                    emit({ type: 'task', name: chapter.name, chapter: chapter.name, status: 'confirmed', kind: 'chapter' });
                } catch (error) {
                    checkSignal();
                    if (!reconciliationWarned) { reconciliationWarned = true; log('章节完成状态暂未刷新，保留待处理统计，可稍后重新检查。', 'warning'); }
                }
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
                const item = queue.shift();
                const chapter = item.chapter;
                if (item.kind === 'cards') {
                    if (item.page >= CARD_PAGE_LIMIT) { issue(chapter, '分页达到 ' + CARD_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    let page;
                    try {
                        if (challenge && item.page === 0) await requestText('/mooc-ans/mycourse/studentstudyAjax', { courseId: context.courseId, clazzid: context.classId, chapterId: chapter.id });
                        const referer = new URL('/mycourse/studentstudy', context.origin);
                        for (const [key, value] of Object.entries({ chapterId: chapter.id, courseId: context.courseId, clazzid: context.classId, cpi: context.cpi, mooc2: 1 })) referer.searchParams.set(key, value);
                        page = parseCardData(await requestText('/knowledge/cards', { courseid: context.courseId, clazzid: context.classId, knowledgeid: chapter.id, cpi: context.cpi, num: item.page, ut: 's', v: '20160407-1' }, { Referer: referer.href }));
                    } catch (error) { checkSignal(); issue(chapter, error.message); chapter.done = true; counts(); await cooldown(queue, true); continue; }
                    if (page.kind === 'end') {
                        if (chapter.remaining > 0 && !chapter.requiredSeen) issue(chapter, '目录显示仍有任务，但章节内容未返回任务附件，请在学习通核对');
                        chapter.done = true; await reconcile(chapter); counts(); continue;
                    }
                    const empty = page.attachments.length ? 0 : item.empty + 1;
                    if (empty >= EMPTY_PAGE_LIMIT) { issue(chapter, '连续空任务页达到 ' + EMPTY_PAGE_LIMIT + ' 页上限'); chapter.done = true; counts(); continue; }
                    const tasks = page.attachments.map(task => ({ kind: 'task', chapter, task, defaults: page.defaults }));
                    queue.unshift(...tasks, { kind: 'cards', chapter, page: item.page + 1, empty });
                    continue;
                }
                const task = item.task?.property?.module === 'insertbook' ? { ...item.task, type: 'book' } : item.task;
                const name = (task?.property?.module === 'insertbook' && task.property.bookname) || task?.property?.name || task?.property?.title || task?.type || '未知任务';
                const required = Boolean(task?.job || (task?.type === 'workid' && settings.get('doNoMission', false)));
                if (required) chapter.requiredSeen++;
                let result;
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
                        result = await registration.execute(task, { context, chapter, defaults: item.defaults, settings, bank, questions, signal, wait, requestText, requestJSON, parseJSON, retry, log, progress, remaining, name, nonJob: nonJobWork, prepareVideoSession });
                        if (!outcomes.includes(result)) throw new Error('任务处理结果无效');
                    }
                } catch (error) { checkSignal(); result = 'failed'; log(name + '：' + error.message, 'danger'); }
                if (result === 'confirmed') progress(100);
                summary[result]++;
                chapter.outcomes.push({ required, job: Boolean(task?.job), result });
                emit({ type: 'task', name, chapter: chapter.name, status: result, kind: task?.type || 'unknown' });
                if (result !== 'confirmed' && (required || result === 'failed')) chapter.unresolved = true;
                counts();
                if (result === 'failed' || result === 'skipped') await cooldown(queue, result === 'failed');
                else failures = 0;
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
