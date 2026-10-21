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
