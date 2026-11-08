'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCourseRunner } = require('../src/platform/course-engine');

const origin = 'https://mooc1.chaoxing.com';
const quiz = (id = '1', patch = {}) => ({ type: 'workid', job: true, jobid: 'work-' + id, property: { workid: id, name: '测验 ' + id }, ...patch });
const video = { type: 'video', job: true, jobid: 'video-2', property: { objectid: 'object', name: '后续视频', doublespeed: 1 } };
function fixture(options = {}) {
    const chapters = options.chapters || [{ id: '1', tasks: [quiz()] }];
    const state = { now: 1000, requests: [], events: [], waits: [], submitted: 0, saved: 0, answered: 0, catalogReads: 0, freshReads: 0, statisticsReads: 0, controller: new AbortController() };
    const settings = { get: (key, fallback) => ({ doRenwu: false, doNoMission: false, autoSubmit: true, vgqtlv: 80, beisu: 1, ...options.settings })[key] ?? fallback };
    const runner = createCourseRunner({ context: { origin, courseId: '101', classId: '202', uid: '404' }, settings,
        bank: { getToken: () => 'test' }, emit: event => state.events.push(event), now: () => state.now,
        wait: async milliseconds => { state.now += milliseconds; state.waits.push(milliseconds); await options.onWait?.(milliseconds, state); },
        questions: {
            openPage: async () => {
                const host = { location: { href: origin + '/work/phone/work' }, fetch: async path => {
                    const { status = 200, body = 'ok', url } = path === '/work/submit' ? options.submission || {} : {};
                    return { status, url, clone: () => ({ text: async () => body }) };
                } };
                host.toadd = () => host.fetch('/work/save');
                host.submitAction = () => { state.submitted++; return host.fetch('/work/submit'); };
                host.noSubmit = () => { state.saved++; return host.fetch('/work/save'); };
                return { document: { URL: options.workPageUrl }, window: host, retain() {}, release() {} };
            },
            run: async () => { state.answered++; return options.questionResult || { total: 1, answered: 1, accuracy: 100 }; },
        },
        transport: { request: async details => {
            const url = new URL(details.url); state.requests.push({ url, headers: details.headers });
            let responseText;
            if (url.pathname === '/mycourse/studentstudycourselist') {
                state.catalogReads++;
                if (options.catalogError && state.catalogReads > 1) throw options.catalogError;
                responseText = chapters.map(chapter => '<div id="cur' + chapter.id + '"><span class="posCatalog_name">章节 ' + chapter.id + '</span><span class="jobUnfinishCount">' + (options.remaining?.(chapter, state) ?? 1) + '</span></div>').join('');
            } else if (url.pathname === '/knowledge/cards') {
                const chapter = chapters.find(chapter => chapter.id === url.searchParams.get('knowledgeid'));
                const page = Number(url.searchParams.get('num'));
                const fresh = url.searchParams.has('_dc'); if (fresh) state.freshReads++;
                if (fresh && options.freshError) throw options.freshError;
                const tasks = fresh ? options.freshTasks?.(chapter, page, state) : chapter.pages ? chapter.pages[page] : page === 0 ? chapter.tasks : null;
                responseText = tasks ? '<script>mArg=' + JSON.stringify({ defaults: { reportUrl: origin + '/multimedia/log/a' }, attachments: tasks }) + ';</script>' : '<script>mArg=$mArg;</script>';
            } else if (url.pathname.startsWith('/ananas/status/')) responseText = JSON.stringify({ status: 'success', duration: 121, objectid: 'object', dtoken: 'test' });
            else if (url.pathname.startsWith('/multimedia/log/')) {
                await options.onVideoReport?.(url, state);
                responseText = JSON.stringify({ isPassed: url.searchParams.get('isdrag') === '4' });
            } else if (url.pathname.includes('/tests/data')) {
                state.statisticsReads++;
                if (options.statisticsError) throw options.statisticsError;
                responseText = JSON.stringify({ data: { results: options.statistics?.(state, url) || [] } });
            }
            else responseText = '';
            return { status: 200, responseText };
        } },
    });
    return { state, runner, run: () => runner.run({ signal: state.controller.signal }) };
}
const last = (state, type) => state.events.filter(event => event.type === type).at(-1);

test('a fresh task confirmation counts a quiz when the submit request does not report success', async () => {
    const f = fixture({ submission: { status: 502 }, freshTasks: () => [quiz('1', { isPassed: true })] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
    assert.equal(f.state.submitted, 1); assert.equal(f.state.answered, 1);
    assert.equal(f.state.events.some(event => event.type === 'log' && event.tone === 'warning'), false);
    const verification = f.state.requests.find(request => request.url.searchParams.has('_dc') && request.url.pathname === '/knowledge/cards');
    assert.equal(verification.url.searchParams.get('num'), '0');
    assert.match(verification.headers.Referer, /chapterId=1/);
});

test('chapter catalog confirmation reconciles a required task left for manual submission', async () => {
    const f = fixture({ settings: { autoSubmit: false }, remaining: (chapter, state) => state.saved ? 0 : 1 });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.skipped, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
    assert.equal(f.state.submitted, 0);
});

for (const evidence of ['catalog', 'card']) test('delayed ' + evidence + ' evidence updates earlier chapters during a later video without replacing its progress', async () => {
    let during;
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz()] }, { id: '2', tasks: [video] }], submission: { status: 502 },
        remaining: (chapter, state) => evidence === 'catalog' && chapter.id === '1' && state.videoWaited ? 0 : 1,
        freshTasks: (chapter, page, state) => chapter.id === '1' && evidence === 'card' && state.videoWaited ? [quiz('1', { isPassed: true })] : [],
        onWait: (milliseconds, state) => { if (milliseconds === 60000) state.videoWaited = true; },
        onVideoReport: (url, state) => { if (url.searchParams.get('playingTime') === '60') during = { counts: last(state, 'counts'), summary: last(state, 'summary'), task: last(state, 'task'), progress: last(state, 'progress') }; },
    });
    const summary = await f.run();
    assert.equal(during?.counts.unconfirmed, 1);
    assert.equal(during.summary.failed, 0); assert.equal(during.summary.confirmed, 1);
    assert.equal(during.task.name, '后续视频'); assert.equal(during.task.status, 'running');
    assert.equal(during.progress.percent, 0);
    assert.equal(summary.confirmed, 2); assert.equal(summary.failed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0); assert.equal(f.state.submitted, 1);
});

test('an accepted quiz submission counts immediately while the directory and cards stay stale', async () => {
    const f = fixture(); const summary = await f.run();
    assert.deepEqual(summary, { confirmed: 1, skipped: 0, failed: 0, chapterIssues: 0 });
    assert.equal(last(f.state, 'counts').unconfirmed, 0); assert.equal(f.state.submitted, 1);
    assert.equal(last(f.state, 'task').status, 'confirmed');
    assert.ok(f.state.events.some(event => event.tone === 'success' && /测验提交成功/.test(event.message)));
    assert.equal(f.state.catalogReads, 1); assert.equal(f.state.freshReads, 0);
    assert.equal((await f.runner.refresh()).confirmed, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('repeated quiz attachments in a chapter are only submitted and counted once', async () => {
    const f = fixture({ chapters: [{ id: '1', pages: [[quiz()], [quiz()]] }] });
    assert.equal((await f.run()).confirmed, 1);
    assert.equal(f.state.submitted, 1); assert.equal(f.state.answered, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

for (const submission of [{ status: 502 }, { body: '{"status":false}' }, { url: origin + '/login' }]) {
    test('a rejected or redirected submit request remains an exception: ' + JSON.stringify(submission), async () => {
        const f = fixture({ submission });
        const summary = await f.run();
        assert.equal(summary.confirmed, 0); assert.equal(summary.failed, 1);
        assert.equal(last(f.state, 'counts').unconfirmed, 1); assert.equal(f.state.submitted, 1);
        assert.ok(f.state.events.some(event => event.tone === 'danger' && /提交未成功/.test(event.message)));
    });
}

test('confirmation for a different quiz cannot finish the submitted task', async () => {
    const f = fixture({ submission: { status: 502 }, freshTasks: () => [quiz('2', { isPassed: true })] });
    const summary = await f.run();
    assert.equal(summary.failed, 1); assert.equal(summary.confirmed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 1);
});

test('verification reloads the original card page instead of assuming every quiz is on page zero', async () => {
    const f = fixture({ chapters: [{ id: '1', pages: [[{ type: 'text', property: { name: '说明' } }], [quiz()]] }], submission: { status: 502 },
        freshTasks: (chapter, page) => page === 1 ? [quiz('1', { isPassed: true })] : [],
    });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0); assert.equal(summary.skipped, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('a completed task cannot finish a chapter with another required task still disabled', async () => {
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz(), video] }], settings: { doVideo: false } });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.skipped, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 1);
});

test('a zero task-point count does not confirm a non-task-point quiz', async () => {
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz('1', { job: false })] }], settings: { doNoMission: true, autoSubmit: false }, remaining: (chapter, state) => state.saved ? 0 : 1 });
    const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 1);
});

test('already submitted review pages are verified without a new save or submit', async () => {
    const f = fixture({ questionResult: { total: 1, answered: 0, review: true }, freshTasks: () => [quiz('1', { isPassed: true })] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.skipped, 0);
    assert.equal(f.state.submitted, 0); assert.equal(f.state.saved, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('a failed status refresh keeps the chapter incomplete and warns once', async () => {
    const f = fixture({ settings: { autoSubmit: false }, catalogError: new Error('offline') });
    const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 1);
    assert.equal(f.state.events.filter(event => event.type === 'log' && /章节完成状态暂未刷新/.test(event.message)).length, 1);
});

test('a saved draft remains incomplete and tells the user it has not been submitted', async () => {
    const f = fixture({ settings: { autoSubmit: false } }); const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1);
    assert.equal(f.state.submitted, 0); assert.equal(f.state.saved, 1);
    assert.ok(f.state.events.some(event => event.type === 'log' && event.tone === 'warning' && /尚未提交/.test(event.message)));
});

test('an official quiz review URL is completion evidence without another submission', async () => {
    const f = fixture({ questionResult: { total: 1, answered: 0, review: true }, workPageUrl: origin + '/work/lookWork' });
    assert.equal((await f.run()).confirmed, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
    assert.equal(f.state.submitted, 0); assert.equal(f.state.saved, 0);
});

test('review-looking content alone remains incomplete without resubmitting', async () => {
    const f = fixture({ questionResult: { total: 1, answered: 0, review: true } }); const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1);
    assert.equal(f.state.submitted, 0); assert.equal(f.state.saved, 0);
    assert.ok(f.state.events.some(event => event.type === 'log' && event.tone === 'warning' && /批阅页面/.test(event.message)));
});

test('card refresh errors keep drafts incomplete without reporting task execution failure', async () => {
    const f = fixture({ settings: { autoSubmit: false }, freshError: new Error('offline') }); const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1); assert.equal(summary.failed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 1);
    assert.equal(f.state.events.filter(event => event.type === 'log' && /章节完成状态暂未刷新/.test(event.message)).length, 1);
});

test('platform rate limits during status verification stop the run without repeating submission', async () => {
    const f = fixture({ submission: { status: 502 }, freshError: Object.assign(new Error('limited'), { status: 429 }) });
    await assert.rejects(f.run(), /过于频繁/);
    assert.equal(f.state.submitted, 1); assert.equal(f.state.freshReads, 1);
});

test('a non-task-point quiz can finish when its own card confirms completion', async () => {
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz('1', { job: false })] }], settings: { doNoMission: true }, submission: { status: 502 }, freshTasks: () => [quiz('1', { job: false, isPassed: true })] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('platform task confirmation accepts the legacy work ID field without guessing by title', async () => {
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz('1', { jobid: '', property: { _jobid: 'work-1', name: '同名测验' } })] }], submission: { status: 502 },
        freshTasks: () => [quiz('1', { jobid: '', property: { workid: '1', name: '标题已变更' }, isPassed: true })],
    });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0);
});

for (const statusStr of ['已完成', '待批阅', '已提交', '已批阅']) test('submitted quiz statistics confirm completion when the task card and chapter counter stay stale: ' + statusStr, async () => {
    const f = fixture({ submission: { status: 502 }, statistics: state => state.submitted ? [{ workId: '1', chapterId: '1', statusStr }] : [] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0); assert.equal(f.state.submitted, 1);
});

test('previously submitted quizzes are recognized before opening or querying them again', async () => {
    const f = fixture({ statistics: () => [{ workId: 'work-1', chapterId: '1', statusStr: '待批阅' }] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(f.state.answered, 0); assert.equal(f.state.submitted, 0);
});

for (const record of [
    { workId: '1', chapterId: '1', statusStr: '已保存' },
    { workId: '1', chapterId: '1', statusStr: '未提交' },
    { workId: '1', chapterId: '1', statusStr: '待重做' },
    { workId: '2', chapterId: '1', statusStr: '已完成' },
    { workId: '1', chapterId: '2', statusStr: '已完成' },
    { workId: '1', chapterId: '1', courseId: '999', statusStr: '已完成' },
]) test('drafts, incomplete states and records from another quiz cannot confirm completion: ' + JSON.stringify(record), async () => {
    const f = fixture({ settings: { autoSubmit: false }, statistics: () => [record] }); const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 1);
});

test('task state still confirms completion when statistics are unavailable', async () => {
    const f = fixture({ submission: { status: 502 }, statisticsError: new Error('offline'), freshTasks: () => [quiz('1', { isPassed: 'true' })] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.failed, 0);
});

test('read-only refresh after traversal recognizes a later manual submission and updates its log', async () => {
    const f = fixture({ settings: { autoSubmit: false }, statistics: state => state.completedLater ? [{ workId: '1', chapterId: '1', statusStr: '待批阅' }] : [] });
    assert.equal((await f.run()).skipped, 1);
    const original = f.state.events.find(event => event.type === 'log' && /尚未提交/.test(event.message));
    f.state.completedLater = true;
    const summary = await f.runner.refresh();
    assert.equal(summary.skipped, 0); assert.equal(summary.confirmed, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0); assert.equal(f.state.submitted, 0); assert.equal(f.state.saved, 1);
    const completion = f.state.events.find(event => event.type === 'log' && event.tone === 'success' && event.key === original.key);
    assert.ok(original.key); assert.ok(completion);
});

test('read-only refresh remains cancellable after traversal', async () => {
    const f = fixture({ settings: { autoSubmit: false } }); await f.run();
    f.state.controller.abort();
    const requests = f.state.requests.length;
    await assert.rejects(f.runner.refresh(), { name: 'AbortError' });
    assert.equal(f.state.requests.length, requests);
});

test('a failing catalog refresh cannot block valid completion evidence from quiz statistics', async () => {
    const f = fixture({ settings: { autoSubmit: false }, catalogError: new Error('offline'), statistics: state => state.completedLater ? [{ workId: '1', chapterId: '1', statusStr: '已完成' }] : [] });
    await f.run(); f.state.completedLater = true;
    assert.equal((await f.runner.refresh()).confirmed, 1);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('chapter-only statistics can confirm a uniquely identified quiz after the whole chapter was scanned', async () => {
    const f = fixture({ settings: { autoSubmit: false }, statistics: state => state.saved ? [{ chapterId: '1', statusStr: '待批阅' }] : [] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 1); assert.equal(summary.skipped, 0);
    assert.equal(last(f.state, 'counts').unconfirmed, 0);
});

test('chapter-only statistics never guess between multiple quizzes in one chapter', async () => {
    const f = fixture({ chapters: [{ id: '1', tasks: [quiz('1'), quiz('2')] }], settings: { autoSubmit: false }, statistics: () => [{ chapterId: '1', statusStr: '已完成' }] });
    const summary = await f.run();
    assert.equal(summary.confirmed, 0); assert.equal(summary.skipped, 2);
});

test('conflicting status records for the same quiz do not confirm completion', async () => {
    const f = fixture({ settings: { autoSubmit: false }, statistics: () => [{ workId: '1', chapterId: '1', statusStr: '已完成' }, { workId: '1', chapterId: '1', statusStr: '未提交' }] });
    assert.equal((await f.run()).skipped, 1);
});
