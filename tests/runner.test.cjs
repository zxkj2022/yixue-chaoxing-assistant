'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHash } = require('node:crypto');
const { parseCardData, parseCatalog } = require('../src/platform/card-parser');
const { createCourseRunner } = require('../src/platform/course-engine');

const origin = 'https://mooc1.chaoxing.com';
const chapter = '<h4 id="cur505"><span class="jobUnfinishCount">2</span>测试章节</h4>';
const video = { job: true, type: 'video', jobid: 'v606', otherInfo: 'courseId_101', property: { objectid: 'object606', name: '测试视频', rt: '0.9' } };
const documentTask = { job: true, type: 'document', jobid: 'd707', jtoken: 'document-token', property: { name: '后续文档' } };
function setup({ attachments = [video, documentTask], defaults = {}, values = {}, respond, catalog = chapter, token = '', questions: questionApi, context: contextOverrides = {} } = {}) {
    const requests = [], events = [], saved = new Map(Object.entries(values));
    const page = { defaults: { userid: '404', reportUrl: origin + '/multimedia/log/a', ...defaults }, attachments };
    const response = body => ({ status: 200, responseText: typeof body === 'string' ? body : JSON.stringify(body) });
    const transport = { async request(details) {
        const url = new URL(details.url); requests.push({ ...details, parsed: url });
        const special = respond && await respond(url, requests, details);
        if (special?.$response) return special.$response;
        if (special !== undefined) return response(special);
        if (url.pathname === '/mycourse/studentstudycourselist') return response(catalog);
        if (url.pathname === '/mooc-ans/mycourse/studentstudyAjax') return response('ok');
        if (url.pathname === '/knowledge/cards') return response(url.searchParams.get('num') === '0' ? 'var mArg = ' + JSON.stringify(page) + ';' : 'mArg = $mArg;');
        if (url.pathname === '/ananas/status/object606') return response({ status: 'success', duration: 1, objectid: 'object606', dtoken: 'video-token' });
        if (url.pathname === '/multimedia/log/a/video-token') return response({ isPassed: url.searchParams.get('playingTime') === '1' });
        if (url.pathname === '/ananas/job/document') return response({ status: true });
        throw new Error('Unexpected request ' + url.href);
    } };
    const runner = createCourseRunner({ context: { origin, courseId: '101', classId: '202', cpi: '303', uid: '', courseName: '测试', ...contextOverrides }, transport,
        settings: { get: (key, fallback) => saved.has(key) ? saved.get(key) : fallback, set: (key, value) => saved.set(key, value), snapshot: () => Object.fromEntries(saved) },
        bank: { getToken: () => token }, questions: questionApi || { run() { throw new Error('questions should not execute'); } }, emit: event => events.push(event), wait: async () => {} });
    return { runner, requests, events, saved };
}

test('card JSON parser accepts wrapping and braces in strings without evaluating code', () => {
    const data = { defaults: { note: '}; catch(error) { mArg={}' }, attachments: [] };
    for (const text of ['var mArg = ' + JSON.stringify(data) + ';', 'try { const mArg =\n' + JSON.stringify(data, null, 2) + '; } catch(error) {}']) {
        assert.deepEqual(parseCardData(text), { kind: 'page', ...data });
    }
    assert.deepEqual(parseCardData('mArg\n = $mArg ;'), { kind: 'end' });
    assert.throws(() => parseCardData('mArg = (globalThis.pwned=true, {"defaults":{},"attachments":[]});'), /解析/);
    assert.throws(() => parseCardData('mArg = {"defaults":null,"attachments":[]};'), /解析/);
    assert.throws(() => parseCardData('mArg = {"defaults":{},"attachments":null};'), /解析/);
});

test('catalog parser returns deduplicated chapters and strips markup from their names', () => {
    assert.deepEqual(parseCatalog(chapter + chapter), [{ id: '505', name: '测试章节', remaining: 2 }]);
    assert.deepEqual(parseCatalog('<p>没有章节</p>'), []);
    assert.deepEqual(parseCatalog('<h4 id="cur1"><span class="jobUnfinishCount">?</span>&#x6D4B;&#35797;&amp;&nbsp;&unknown;</h4>'), [{ id: '1', name: '测试& &unknown;', remaining: 0 }]);
    assert.deepEqual(parseCatalog('<h4 id="cur2">章节</h4>'), [{ id: '2', name: '章节', remaining: 0 }]);
    assert.deepEqual(parseCatalog('<div class="posCatalog_select" id="cur8"><span class="jobUnfinishCount">1</span>自建站章节</div>'), [{ id: '8', name: '自建站章节', remaining: 1 }]);
    assert.deepEqual(parseCatalog('<div id="cur9"><div class="icon"></div><span class="jobUnfinishCount">3</span>嵌套章节</div>'), [{ id: '9', name: '嵌套章节', remaining: 3 }]);
});

test('challenge prepares each actionable chapter and statistics retain host query field names', async () => {
    const { runner, requests } = setup({ values: { doNoMission: true }, respond(url) {
        if (url.pathname === '/mooc-ans/mycourse/studentstudyAjax') return 'ok';
        if (url.pathname === '/stat2/chapter-exam/s/tests/data') return { data: { results: [] } };
    } });
    assert.equal((await runner.run({ challenge: true })).confirmed, 2);
    const statistics = requests.find(item => item.parsed.pathname === '/stat2/chapter-exam/s/tests/data').parsed;
    assert.equal(statistics.searchParams.get('clazzid'), '202');
    assert.equal(statistics.searchParams.get('courseid'), '101');
    assert.equal(statistics.searchParams.get('ut'), 's');
    assert.equal(statistics.searchParams.get('pageSize'), '200');
    const preparation = requests.findIndex(item => item.parsed.pathname === '/mooc-ans/mycourse/studentstudyAjax');
    assert.ok(preparation >= 0 && preparation < requests.findIndex(item => item.parsed.pathname === '/knowledge/cards'));
});

test('video recovers UID, signs each heartbeat and confirms before running a document', async () => {
    const { runner, requests, events } = setup();
    assert.deepEqual(await runner.run(), { confirmed: 2, skipped: 0, failed: 0, pending: 0, chapterIssues: 0 });
    const reports = requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token');
    assert.deepEqual(reports.map(item => item.parsed.searchParams.get('playingTime')), ['0', '1']);
    for (const { parsed } of reports) {
        assert.equal(parsed.searchParams.get('userid'), '404');
        const signature = `[202][404][v606][object606][${Number(parsed.searchParams.get('playingTime')) * 1000}][d_yHJ!$pdA~5][1000][0_1]`;
        assert.equal(parsed.searchParams.get('enc'), createHash('md5').update(signature).digest('hex'));
    }
    assert.ok(requests.findIndex(item => item.parsed.pathname === '/ananas/job/document') > requests.indexOf(reports.at(-1)));
    assert.equal(requests[0].parsed.searchParams.get('courseId'), '101');
    assert.equal(requests[0].parsed.searchParams.get('clazzid'), '202');
    const cards = requests.find(item => item.parsed.pathname === '/knowledge/cards');
    assert.equal(new URL(cards.headers.Referer).searchParams.get('chapterId'), '505');
    assert.deepEqual(events.filter(event => event.type === 'counts').at(-1), { type: 'counts', total: 1, unconfirmed: 0 });
});

test('video wire fields retain the host signing and attachment metadata contract', async () => {
    const task = { ...video, attDuration: '12', attDurationEnc: 'duration-proof', videoFaceCaptureEnc: 'face-proof' };
    const { runner, requests } = setup({ attachments: [task], defaults: { fid: '17' } });
    assert.equal((await runner.run()).confirmed, 1);
    const status = requests.find(item => item.parsed.pathname === '/ananas/status/object606').parsed;
    assert.equal(status.searchParams.get('k'), '17');
    for (const { parsed } of requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token')) {
        assert.equal(parsed.searchParams.get('view'), 'pc');
        assert.equal(parsed.searchParams.get('attDuration'), '12');
        assert.equal(parsed.searchParams.get('attDurationEnc'), 'duration-proof');
        assert.equal(parsed.searchParams.get('videoFaceCaptureEnc'), 'face-proof');
        assert.equal(parsed.searchParams.get('isdrag'), parsed.searchParams.get('playingTime') === '1' ? '4' : '3');
    }
});

test('heartbeat retry holds its position and a permanently unconfirmed video stays failed', async () => {
    let calls = 0;
    const retried = setup({ respond(url) { if (url.pathname === '/multimedia/log/a/video-token' && calls++ === 0) throw new Error('HTTP 503'); } });
    assert.equal((await retried.runner.run()).confirmed, 2);
    assert.deepEqual(retried.requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token').map(item => item.parsed.searchParams.get('playingTime')), ['0', '0', '1']);
    const failed = setup({ respond: url => url.pathname === '/multimedia/log/a/video-token' ? { isPassed: false } : undefined });
    assert.deepEqual(await failed.runner.run(), { confirmed: 1, skipped: 0, failed: 1, pending: 0, chapterIssues: 0 });
    assert.equal(failed.events.filter(event => event.type === 'counts').at(-1).unconfirmed, 1);
});

test('missing UID and malformed attachments fail individually while documents continue', async () => {
    const missing = setup({ defaults: { userid: undefined } });
    assert.equal((await missing.runner.run()).failed, 1);
    assert.equal(missing.requests.some(item => item.parsed.pathname.startsWith('/ananas/status/')), false);
    const malformed = setup({ attachments: [null, { job: true, type: 'video' }, documentTask] });
    assert.deepEqual(await malformed.runner.run(), { confirmed: 1, skipped: 0, failed: 2, pending: 0, chapterIssues: 0 });
});

test('live switch is independent and skipped tasks keep the chapter unconfirmed', async () => {
    const { runner, requests, events } = setup({ attachments: [{ job: true, type: 'live', property: { title: '直播' } }, { job: true, type: 'chaoxingClass', property: { title: '课堂直播' } }, documentTask], values: { doLive: false } });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 2, failed: 0, pending: 0, chapterIssues: 0 });
    assert.equal(requests.some(item => item.parsed.hostname !== 'mooc1.chaoxing.com'), false);
    assert.equal(events.filter(event => event.type === 'counts').at(-1).unconfirmed, 1);
});

test('class replay clamps negatives, stops after three failures and remains pending on progress acceptance', async () => {
    for (const success of [true, false]) {
        const { runner, requests } = setup({ attachments: [{ job: true, type: 'chaoxingClass', jobid: 'class909', property: { uuid: 'class909', title: '课堂' } }, documentTask], values: { doVideo: false }, respond(url) {
            if (url.pathname === '/apis/chapter/getMeetReview4Job') return { data: [{ duration: 11, userTime: -20, dataKey: 'key' }] };
            if (url.pathname === '/apis/chapter/addReviewDot4Job') return { result: success, msg: success ? 'success' : 'failed' };
        } });
        assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: success ? 0 : 1, pending: success ? 1 : 0, chapterIssues: 0 });
        const uploads = requests.filter(item => item.parsed.pathname === '/apis/chapter/addReviewDot4Job');
        assert.deepEqual(uploads.map(item => item.parsed.searchParams.get('lastWatchTime')), success ? ['10', '11'] : ['10', '10', '10']);
    }
});

test('work without an API token is skipped before loading quiz content', async () => {
    const { runner, requests } = setup({ attachments: [{ job: true, type: 'workid', property: { workid: '606', title: '章节测验' } }, documentTask] });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 1, failed: 0, pending: 0, chapterIssues: 0 });
    assert.equal(requests.some(item => item.parsed.pathname.includes('/work/')), false);
});

test('empty card pages, invalid data and endless statistics each have a finite boundary', async () => {
    const empty = setup({ respond: url => url.pathname === '/knowledge/cards' ? 'mArg = {"defaults":{},"attachments":[]};' : undefined });
    assert.equal((await empty.runner.run()).chapterIssues, 1);
    assert.equal(empty.requests.filter(item => item.parsed.pathname === '/knowledge/cards').length, 10);
    const invalid = setup({ respond: url => url.pathname === '/knowledge/cards' ? 'mArg = (1, {});' : undefined });
    assert.equal((await invalid.runner.run()).chapterIssues, 1);
    const statistics = setup({ catalog: '<p>无章节</p>', values: { doNoMission: true }, respond: url => url.pathname === '/stat2/chapter-exam/s/tests/data' ? { data: { results: [{ isNonJob: false }] } } : undefined });
    await statistics.runner.run();
    assert.equal(statistics.requests.filter(item => item.parsed.pathname === '/stat2/chapter-exam/s/tests/data').length, 100);
    assert.match(statistics.events.filter(event => event.type === 'log').map(event => event.message).join('\n'), /上限/);
});

test('catalog transport errors stay retryable and challenge saves all task switches', async () => {
    let failed = false;
    const { runner, saved } = setup({ catalog: '<p>无章节</p>', respond(url) { if (url.pathname.endsWith('/studentstudycourselist') && !failed) { failed = true; throw new Error('目录请求失败'); } } });
    await assert.rejects(runner.run(), /目录/);
    await runner.run({ challenge: true });
    for (const key of ['doVideo', 'doDocument', 'doWork', 'doLive']) assert.equal(saved.get(key), true);
});

test('live viewer initialization preserves encoded arguments and blocks progress after failure', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', rt: '0.9', streamName: 'stream', vdoid: 'video', title: '直播入口' } };
    const { runner, requests } = setup({ attachments: [live, documentTask], respond(url) {
        if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0 } } };
        if (url.hostname === 'zhibo.chaoxing.com' && url.pathname === '/1234567890123456') return '<script>var lineVideo={"videoLongtime":11};var videoPlayStartTime=0;var uInfo="viewer-user";var viewerUrl="https://zhibo.chaoxing.com/viewer?token=a%3Db&courseId=101";</script>';
        if (url.pathname === '/viewer') throw new Error('HTTP 503');
    } });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: 1, pending: 0, chapterIssues: 0 });
    const viewer = requests.find(item => item.parsed.pathname === '/viewer').parsed;
    assert.equal(viewer.searchParams.get('watchMoment'), '0');
    assert.equal(viewer.searchParams.get('token'), 'a=b');
    assert.equal(viewer.searchParams.get('courseId'), '101');
    assert.equal(requests.some(item => /saveTimePc|put\/watchMoment|userLog\/recordAction/.test(item.parsed.pathname)), false);
});

test('invalid live parameters never upload progress and do not block documents', async () => {
    for (const invalid of ['rate', 'duration', 'position']) {
        const live = { job: true, type: 'live', property: { liveId: '1234567890123456', rt: invalid === 'rate' ? 'Infinity' : '0.9', title: '直播' } };
        const { runner, requests } = setup({ attachments: [live, documentTask], respond(url) {
            if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: invalid === 'duration' ? 'Infinity' : 11, timeLongValue: invalid === 'position' ? -3 : 0 } } };
        } });
        const outcome = await runner.run();
        assert.equal(outcome.confirmed, 1);
        assert.equal(outcome.failed, 1);
        assert.equal(requests.some(item => /saveTimePc|put\/watchMoment/.test(item.parsed.pathname)), false);
    }
});

test('video permanent transport failure retries one position three times and continues', async () => {
    const { runner, requests } = setup({ respond(url) { if (url.pathname === '/multimedia/log/a/video-token') throw new Error('offline'); } });
    assert.equal((await runner.run()).failed, 1);
    assert.deepEqual(requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token').map(item => item.parsed.searchParams.get('playingTime')), ['0', '0', '0']);
    assert.equal(requests.at(-2).parsed.pathname, '/ananas/job/document');
});

test('malformed video report responses retry the same position before failing', async () => {
    const { runner, requests } = setup({ respond: url => url.pathname === '/multimedia/log/a/video-token' ? {} : undefined });
    assert.equal((await runner.run()).failed, 1);
    assert.deepEqual(requests.filter(item => item.parsed.pathname === '/multimedia/log/a/video-token').map(item => item.parsed.searchParams.get('playingTime')), ['0', '0', '0']);
});

test('nonempty card pagination also stops at its total page boundary', async () => {
    const { runner, requests } = setup({ attachments: [documentTask], respond(url) {
        if (url.pathname === '/knowledge/cards') return 'mArg=' + JSON.stringify({ defaults: {}, attachments: [documentTask] }) + ';';
    } });
    const result = await runner.run();
    assert.equal(result.chapterIssues, 1);
    assert.equal(result.confirmed, 200);
    assert.equal(requests.filter(item => item.parsed.pathname === '/knowledge/cards').length, 200);
});

test('unknown tasks are accounted for and document rejections are never confirmation', async () => {
    const { runner } = setup({ attachments: [{ job: true, type: 'futureType', property: { name: '待支持类型' } }, documentTask], respond: url => url.pathname === '/ananas/job/document' ? { status: false } : undefined });
    assert.deepEqual(await runner.run(), { confirmed: 0, skipped: 1, failed: 1, pending: 0, chapterIssues: 0 });
});

test('already aborted runs make no requests', async () => {
    const controller = new AbortController(); controller.abort(new Error('用户停止'));
    const { runner, requests } = setup();
    await assert.rejects(runner.run({ signal: controller.signal }), /用户停止/);
    assert.deepEqual(requests, []);
});

test('book and hyperlink share document confirmation while microCourse requires its explicit phrase', async () => {
    for (const [type, pathname] of [['book', '/ananas/job'], ['hyperlink', '/ananas/job/hyperlink'], ['microCourse', '/ananas/job/microCourse']]) {
        const { runner, requests } = setup({ attachments: [{ ...documentTask, type }], respond(url) {
            if (url.pathname === pathname) return type === 'microCourse' ? 'callback({"msg":"添加考核点成功"})' : { status: true };
        } });
        assert.equal((await runner.run()).confirmed, 1);
        const url = requests.find(item => item.parsed.pathname === pathname).parsed;
        assert.equal(url.searchParams.get('jtoken'), 'document-token');
        assert.equal(url.searchParams.get('knowledgeid'), '505');
        if (type === 'microCourse') {
            assert.equal(url.searchParams.get('checkMicroTopic'), 'true');
            assert.equal(url.searchParams.get('microTopicId'), 'undefined');
        }
    }
    const refused = setup({ attachments: [{ ...documentTask, type: 'microCourse' }], respond: url => url.pathname === '/ananas/job/microCourse' ? 'callback({"success":true})' : undefined });
    assert.equal((await refused.runner.run()).failed, 1);
});

test('invalid video metadata and settings fail without progress reports', async () => {
    for (const options of [
        { respond: url => url.pathname.startsWith('/ananas/status/') ? { status: 'error' } : undefined },
        { values: { beisu: 'Infinity' } },
        { attachments: [{ ...video, property: { ...video.property, rt: 'Infinity' } }, documentTask] },
    ]) {
        const { runner, requests } = setup(options);
        assert.equal((await runner.run()).failed, 1);
        assert.equal(requests.some(item => item.parsed.pathname.startsWith('/multimedia/log/')), false);
    }
});

test('ordinary non-job attachments are skipped while enabled non-job work uses a blank jobId', async () => {
    const basic = setup({ attachments: [{ ...documentTask, job: false }] });
    assert.equal((await basic.runner.run()).skipped, 1);
    assert.equal(basic.requests.some(item => item.parsed.pathname === '/ananas/job/document'), false);
    let opened;
    const { runner } = setup({ token: 'valid', attachments: [{ job: false, type: 'workid', property: { workid: '606' } }], values: { doNoMission: true }, questions: {
        async openPage(url) { opened = new URL(url); return { document: {}, window: {} }; },
        async run() { return { total: 1, answered: 1, accuracy: 100 }; },
    }, respond: url => url.hostname === 'stat2-ans.chaoxing.com' ? { data: { results: [] } } : undefined });
    assert.equal((await runner.run()).pending, 1);
    assert.equal(opened.pathname, '/mooc-ans/work/phone/work');
    assert.equal(opened.searchParams.get('jobId'), '');
    assert.equal(opened.searchParams.get('workId'), '606');
});

test('task-engine sources resolve final URLs, filter finished plans and deduplicate chapters', async () => {
    const { runner, requests } = setup({ catalog: '<p>无章节</p>', attachments: [documentTask], values: { doRenwu: true }, respond(url, requests, details) {
        if (url.pathname === '/v2/apis/active/getData') return { data: [{ id: 't1' }] };
        if (url.pathname === '/api/v1/middlePageApi/jumpStudyPlanList') { assert.equal(details.method, 'HEAD'); return { $response: { status: 200, finalUrl: 'https://task.chaoxing.com/list?encryTaskUserId=u1' } }; }
        if (url.pathname === '/userStudyPlan/getUserStandard') return { data: { userTaskQualifyDTO: { planUserBOList: [
            { finish: 0, plan: { planType: 1, externalDataId: 'a' } }, { finish: 0, plan: { planType: 1, externalDataId: 'a' } }, { finish: 1, plan: { planType: 1, externalDataId: 'b' } },
        ] } } };
        if (url.pathname === '/mooc2-ans/coursetopic/topicdetailsmiddle') return { $response: { status: 200, finalUrl: origin + '/mycourse/studentstudy?chapterId=505' } };
    } });
    assert.equal((await runner.run()).confirmed, 1);
    assert.equal(requests.filter(item => item.parsed.pathname === '/knowledge/cards' && item.parsed.searchParams.get('num') === '0').length, 1);
    assert.equal(requests.find(item => item.parsed.pathname === '/v2/apis/active/getData').parsed.searchParams.get('DB_STRATEGY'), 'DEFAULT');
});

test('task-engine source failures never block the ordinary catalog', async () => {
    for (const stage of ['active', 'head', 'standard', 'topic']) {
        const { runner, events } = setup({ attachments: [documentTask], values: { doRenwu: true }, respond(url) {
            if (url.pathname === '/v2/apis/active/getData') return stage === 'active' ? {} : { data: [{ id: 't1' }] };
            if (url.pathname === '/api/v1/middlePageApi/jumpStudyPlanList') return { $response: { status: 200, finalUrl: 'https://task.chaoxing.com/list' + (stage === 'head' ? '' : '?encryTaskUserId=u1') } };
            if (url.pathname === '/userStudyPlan/getUserStandard') return stage === 'standard' ? {} : { data: { userTaskQualifyDTO: { planUserBOList: [{ finish: 0, plan: { planType: 1, externalDataId: 'a' } }] } } };
            if (url.pathname === '/mooc2-ans/coursetopic/topicdetailsmiddle') return { $response: { status: 200, finalUrl: origin + '/missing-chapter' } };
        } });
        assert.equal((await runner.run()).confirmed, 1);
        assert.match(events.filter(event => event.type === 'log').map(event => event.message).join('\n'), /任务引擎.*失败/);
    }
});

test('statistics adds only actionable non-job chapters to the normal queue', async () => {
    const { runner, requests } = setup({ catalog: '<p>无章节</p>', attachments: [documentTask], values: { doNoMission: true }, respond(url) {
        if (url.pathname === '/stat2/chapter-exam/s/tests/data') return { data: { results: url.searchParams.get('page') === '1' ? [
            { isNonJob: true, statusStr: '待完成', chapterId: '505' }, { isNonJob: true, statusStr: '待完成', chapterId: '505' },
            { isNonJob: true, statusStr: '已完成', chapterId: '506' }, { isNonJob: true, statusStr: '待批阅', chapterId: '507' }, { isNonJob: false, chapterId: '508' },
        ] : [] } };
    } });
    assert.equal((await runner.run()).confirmed, 1);
    assert.equal(requests.filter(item => item.parsed.pathname === '/knowledge/cards' && item.parsed.searchParams.get('num') === '0').length, 1);
});

test('authenticated chapter work fills and saves or submits but stays pending until platform confirmation', async () => {
    for (const mode of ['submit', 'save', 'empty', 'below-threshold', 'missing-step']) {
        const actions = [], doc = {};
        let opened;
        const work = { job: true, type: 'workid', jobid: 'work-606', enc: 'proof', property: { title: '章节测验' } };
        const { runner } = setup({ token: 'valid', attachments: [work], values: { autoSubmit: !['save', 'empty'].includes(mode), vgqtlv: 80, doAI: true }, questions: {
            async openPage(url) { opened = new URL(url); return { document: doc, window: { toadd() { actions.push('prepare'); }, submitAction: mode === 'missing-step' ? undefined : () => actions.push('submit'), noSubmit() { actions.push('save'); } } }; },
            async run(document, options) { assert.equal(document, doc); assert.equal(options.useAi, true); assert.equal(options.apply, true); return { total: mode === 'empty' ? 0 : 2, answered: mode === 'empty' ? 0 : 2, accuracy: mode === 'below-threshold' ? 50 : 100 }; },
        } });
        const result = await runner.run();
        assert.equal(result.pending, mode === 'empty' ? 0 : 1);
        assert.equal(result.skipped, mode === 'empty' ? 1 : 0);
        assert.equal(result.confirmed, 0);
        assert.deepEqual(actions, mode === 'empty' ? [] : mode === 'submit' ? ['prepare', 'submit'] : ['save']);
        assert.equal(opened.pathname, '/work/phone/work');
        assert.equal(opened.searchParams.get('workId'), '606');
        assert.equal(opened.searchParams.get('jobId'), 'work-606');
        assert.equal(opened.searchParams.get('enc'), 'proof');
    }
});

test('cancelling a chapter query cannot trigger later host saves or submissions', async () => {
    const controller = new AbortController(), actions = [];
    const current = setup({ token: 'tk_real', attachments: [{ job: true, type: 'workid', jobid: 'work-6', property: { title: '取消中的测验' } }], values: { autoSubmit: true, vgqtlv: 85 }, questions: {
        openPage: async () => ({ document: {}, window: { toadd: () => actions.push('prepare'), submitAction: () => actions.push('submit'), noSubmit: () => actions.push('save') } }),
        run: async () => { controller.abort(); return { total: 2, answered: 2, accuracy: 100, stopped: true }; },
    } });
    await assert.rejects(current.runner.run({ signal: controller.signal }));
    assert.deepEqual(actions, []);
});

test('cancelling during chapter submission preparation prevents the final host action', async () => {
    const controller = new AbortController(), actions = [];
    const current = setup({ token: 'tk_real', attachments: [{ job: true, type: 'workid', jobid: 'work-6', property: { title: '准备中的测验' } }], values: { autoSubmit: true, vgqtlv: 85 }, questions: {
        openPage: async () => ({ document: {}, window: { async toadd() { actions.push('prepare'); controller.abort(); }, submitAction: () => actions.push('submit'), noSubmit: () => actions.push('save') } }),
        run: async () => ({ total: 2, answered: 2, accuracy: 100 }),
    } });
    await assert.rejects(current.runner.run({ signal: controller.signal }));
    assert.deepEqual(actions, ['prepare']);
});

test('a stopped partial chapter query never invokes host saves or submissions', async () => {
    for (const answered of [0, 1]) {
        const actions = [];
        const current = setup({ token: 'tk_real', attachments: [{ job: true, type: 'workid', jobid: 'work-6', property: { title: '停止的测验' } }], values: { autoSubmit: true, vgqtlv: 85 }, questions: {
            openPage: async () => ({ document: {}, window: { toadd: () => actions.push('prepare'), submitAction: () => actions.push('submit'), noSubmit: () => actions.push('save') } }),
            run: async () => ({ total: 2, answered, accuracy: 100, stopped: true }),
        } });
        const result = await current.runner.run();
        assert.equal(result.pending, answered ? 1 : 0);
        assert.equal(result.skipped, answered ? 0 : 1);
        assert.deepEqual(actions, []);
    }
});

test('legacy live uploads bounded positions and remains pending', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', streamName: 'stream808', vdoid: 'video808', rt: '0.9', title: '旧回放' } };
    const { runner, requests } = setup({ attachments: [live, documentTask], respond(url) {
        if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
        if (url.pathname === '/1234567890123456') return '<p>legacy</p>';
        if (url.pathname === '/saveTimePc') return 'success';
    } });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: 0, pending: 1, chapterIssues: 0 });
    const reports = requests.filter(item => item.parsed.pathname === '/saveTimePc');
    assert.deepEqual(reports.map(item => item.parsed.searchParams.get('isStart')), ['0', '1']);
    assert.ok(reports.every(item => item.parsed.searchParams.get('userId') === '404'));
    assert.equal(requests.find(item => item.parsed.pathname === '/ananas/live/liveinfo').parsed.searchParams.get('userid'), '404');
});

test('lineVideo initializes viewer, reports replay positions and preserves original live ID', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', liveSetEnc: 'set-proof', authEnc: 'auth-proof', property: { liveId: 'old808', streamName: 'stream808', vdoid: 'video808', rt: '1', title: '新回放' } };
    const { runner, requests } = setup({ attachments: [live], respond(url) {
        if (url.pathname === '/ananas/live/getnewliveid') return { newLiveId: '1234567890123456' };
        if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
        if (url.pathname === '/1234567890123456') return '<script>var lineVideo = {"videoLongtime":11,"note":"braces }; inside JSON"};var videoPlayStartTime = 0;var viewerUrl = "https://zhibo.chaoxing.com/viewer?token=a%3Db";var uInfo = "user-info";</script>';
        if (url.pathname === '/viewer') return 'viewer ready';
        if (url.pathname === '/saveTimePc') return 'success';
        if (url.pathname === '/apis/live/put/watchMoment') return '请求成功';
    } });
    assert.deepEqual(await runner.run(), { confirmed: 0, skipped: 0, failed: 0, pending: 1, chapterIssues: 0 });
    const reports = requests.filter(item => item.parsed.pathname === '/apis/live/put/watchMoment');
    assert.deepEqual(reports.map(item => item.parsed.searchParams.get('watchMoment')), ['0', '11']);
    assert.ok(reports.every(item => item.parsed.searchParams.get('liveId') === 'old808'));
    const livePage = requests.find(item => item.parsed.pathname === '/1234567890123456').parsed;
    assert.equal(livePage.searchParams.get('customPara1'), '202_101');
    assert.equal(livePage.searchParams.get('livesetenc'), 'set-proof');
    const viewerIndex = requests.findIndex(item => item.parsed.pathname === '/viewer');
    assert.ok(viewerIndex < requests.findIndex(item => item.parsed.pathname === '/saveTimePc'));
    assert.equal(requests[viewerIndex].parsed.searchParams.get('token'), 'a=b');
    assert.ok(requests.filter(item => item.parsed.pathname === '/saveTimePc').every(item => new URL(item.headers.Referer).pathname === livePage.pathname));
});

test('live session strings support both quote styles and escaped literals without evaluating code', async () => {
    for (const viewerQuote of ['"', "'"]) for (const userQuote of ['"', "'"]) {
        const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', streamName: 'stream808', vdoid: 'video808', title: '回放' } };
        const literal = (value, quote) => quote + value.replaceAll('\\', '\\\\').replaceAll(quote, '\\' + quote) + quote;
        const user = "user'\"\\info";
        const { runner, requests } = setup({ attachments: [live], respond(url) {
            if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
            if (url.pathname === '/1234567890123456') return '<script>var lineVideo={"videoLongtime":11};var videoPlayStartTime=0;var viewerUrl=' + literal('https://zhibo.chaoxing.com/viewer?token=a%3Db', viewerQuote) + ';var uInfo=' + literal(user, userQuote) + ';</script>';
            if (url.pathname === '/viewer') return 'ready';
            if (url.pathname === '/saveTimePc') return 'success';
            if (url.pathname === '/apis/live/put/watchMoment') return '请求成功';
        } });
        assert.equal((await runner.run()).pending, 1, viewerQuote + userQuote);
        assert.equal(requests.find(item => item.parsed.pathname === '/viewer').parsed.searchParams.get('token'), 'a=b');
        const reports = requests.filter(item => item.parsed.pathname === '/apis/live/put/watchMoment');
        assert.deepEqual(reports.map(item => item.parsed.searchParams.get('watchMoment')), ['0', '11']);
        assert.ok(reports.every(item => item.parsed.searchParams.get('u') === user));
    }
});

test('live progress rejection stops after three attempts while later tasks continue', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', streamName: 'stream808', vdoid: 'video808', title: '失败回放' } };
    const { runner, requests } = setup({ attachments: [live, documentTask], respond(url) {
        if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
        if (url.pathname === '/1234567890123456') return '<p>legacy</p>';
        if (url.pathname === '/saveTimePc') return 'rejected';
    } });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: 1, pending: 0, chapterIssues: 0 });
    assert.deepEqual(requests.filter(item => item.parsed.pathname === '/saveTimePc').map(item => item.parsed.searchParams.get('isStart')), ['0', '0', '0']);
});

test('live UID selection falls back from an invalid context value and blocks wholly invalid IDs', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', streamName: 'stream808', vdoid: 'video808', title: '回放' } };
    for (const validDefaults of [true, false]) {
        const { runner, requests } = setup({ context: { uid: 'invalid' }, defaults: { userid: validDefaults ? ' 404 ' : '-1' }, attachments: [live, documentTask], respond(url) {
            if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
            if (url.pathname === '/1234567890123456') return '<p>legacy</p>';
            if (url.pathname === '/saveTimePc') return 'success';
        } });
        const result = await runner.run();
        assert.equal(result.confirmed, 1);
        assert.equal(result.pending, validDefaults ? 1 : 0);
        assert.equal(result.failed, validDefaults ? 0 : 1);
        if (validDefaults) assert.equal(requests.find(item => item.parsed.pathname === '/ananas/live/liveinfo').parsed.searchParams.get('userid'), '404');
        else assert.equal(requests.some(item => item.parsed.pathname === '/ananas/live/liveinfo'), false);
    }
});

test('malformed lineVideo assignments and missing viewer or numeric literals cannot start reports', async () => {
    const live = { job: true, type: 'live', jobid: 'live808', property: { liveId: '1234567890123456', streamName: 'stream808', vdoid: 'video808', title: '回放' } };
    for (const invalid of ['line-expression', 'missing-viewer', 'start-expression']) {
        const html = invalid === 'line-expression' ? '<script>var lineVideo = (globalThis.sideEffect=true, {"videoLongtime":11});</script>'
            : `<script>var lineVideo={"videoLongtime":11};var videoPlayStartTime=${invalid === 'start-expression' ? '0+unexpectedCall()' : '0'};var uInfo="u";${invalid === 'missing-viewer' ? '' : 'var viewerUrl="https://zhibo.chaoxing.com/viewer";'}</script>`;
        const { runner, requests } = setup({ attachments: [live, documentTask], respond(url) {
            if (url.pathname === '/ananas/live/liveinfo') return { temp: { data: { duration: 11, timeLongValue: 0, liveStatus: 4, ifReview: 0 } } };
            if (url.pathname === '/1234567890123456') return html;
            if (url.pathname === '/viewer') return 'ready';
            if (url.pathname === '/saveTimePc') return 'success';
            if (url.pathname === '/apis/live/put/watchMoment') return '请求成功';
        } });
        const result = await runner.run();
        assert.equal(result.failed, 1, invalid);
        assert.equal(result.confirmed, 1, 'following document continues');
        assert.equal(requests.some(item => item.parsed.pathname === '/saveTimePc'), false, invalid);
    }
});

test('class replay requires both result and success message and still continues documents', async () => {
    const replay = { job: true, type: 'chaoxingClass', jobid: 'class909', property: { uuid: 'class909', title: '课堂' } };
    const { runner, requests } = setup({ attachments: [replay, documentTask], respond(url) {
        if (url.pathname === '/apis/chapter/getMeetReview4Job') return { data: [{ duration: 11, userTime: 0, dataKey: 'key' }] };
        if (url.pathname === '/apis/chapter/addReviewDot4Job') return { result: true, msg: 'failed' };
    } });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: 1, pending: 0, chapterIssues: 0 });
    assert.deepEqual(requests.filter(item => item.parsed.pathname === '/apis/chapter/addReviewDot4Job').map(item => item.parsed.searchParams.get('lastWatchTime')), ['10', '10', '10']);
});

test('class replay requires a valid UID before making replay requests', async () => {
    const { runner, requests } = setup({ context: { uid: 'bad' }, defaults: { userid: '0' }, attachments: [{ job: true, type: 'chaoxingClass', property: { uuid: 'class909', title: '课堂' } }, documentTask] });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 0, failed: 1, pending: 0, chapterIssues: 0 });
    assert.equal(requests.some(item => item.parsed.hostname === 'k.chaoxing.com'), false);
});

test('insertbook module alone routes a task to book confirmation with its book title', async () => {
    const { runner, requests, events } = setup({ attachments: [
        { job: true, type: 'other', jobid: 'book808', jtoken: 'book-proof', property: { module: 'insertbook', bookname: '图书名称', name: '备用名称' } },
        { job: true, type: 'insertbook', jobid: 'unmapped', property: { name: '模块未匹配' } },
    ], respond: url => url.pathname === '/ananas/job' ? { status: true } : undefined });
    assert.deepEqual(await runner.run(), { confirmed: 1, skipped: 1, failed: 0, pending: 0, chapterIssues: 0 });
    assert.equal(requests.filter(item => item.parsed.pathname === '/ananas/job').length, 1);
    assert.match(events.filter(event => event.type === 'log').map(event => event.message).join('\n'), /图书任务完成：图书名称/);
});
