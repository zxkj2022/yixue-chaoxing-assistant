'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { createVideoPlan, createVideoReporter } = require('../src/tasks/video-plan');
const { runVideo } = require('../src/tasks/video');
const { createCourseRunner } = require('../src/platform/course-engine');
function options(patch = {}) {
    return { reportUrl: 'https://mooc1.chaoxing.com/multimedia/log/a', classId: '202', uid: '404', task: { jobid: 'job', otherInfo: 'courseId_101&courseId=101', property: { objectid: 'object', rt: '0.9' } }, status: { duration: 121, dtoken: 'private', objectid: 'object' }, rate: 2, now: () => 123, ...patch };
}
test('video checkpoints retain the platform signature, wire fields and final checkpoint', () => {
    const plan = createVideoPlan(options());
    assert.deepEqual(plan.map(p => p.position), [0, 120, 121]);
    const url = new URL(plan[1].url);
    assert.equal(url.searchParams.get('enc'), createHash('md5').update('[202][404][job][object][120000][d_yHJ!$pdA~5][121000][0_121]').digest('hex'));
    assert.equal(url.searchParams.get('courseId'), '101');
    assert.equal(plan.at(-1).isdrag, '4');
    assert.equal(url.searchParams.get('_t'), '123');
});
for (const patch of [{ rate: 0 }, { rate: NaN }, { status: { duration: 0 } }, { status: { duration: 121, dtoken: '../secret' } }, { status: { duration: 121, dtoken: 'token' }, classId: '1&bad=1' }]) test('video plan rejects unsafe or invalid report input ' + JSON.stringify(patch), () => {
    assert.throws(() => createVideoPlan(options(patch)));
});
test('single report validation rejects impossible positions and unsafe extra fields', () => {
    const report = createVideoReporter(options());
    for (const position of [-1, NaN, 122]) assert.throws(() => report(position));
    const o = options(); o.task.otherInfo = '#invalid'; assert.throws(() => createVideoReporter(o));
    o.task.otherInfo = ''; o.task.property.rt = 'invalid'; assert.throws(() => createVideoReporter(o));
});
function fixture(report, { duration = 1, rate = 1, statusError, sessionError } = {}) {
    const state = { remaining: [], logs: [], reports: [], waits: [] };
    state.task = { jobid: 'job', property: { objectid: 'object', doublespeed: 1 } };
    state.env = { context: { origin: 'https://mooc1.chaoxing.com', classId: '202', uid: '404' }, defaults: { reportUrl: 'https://mooc1.chaoxing.com/multimedia/log/a' }, name: '视频',
        requestText: async () => { throw new Error('optional bootstrap missing'); },
        requestJSON: async url => { if (url.startsWith('/ananas/status')) { if (statusError) throw statusError; return { status: 'success', duration, objectid: 'object', dtoken: 'private' }; } state.reports.push(url); return report; },
        prepareVideoSession: async () => { if (sessionError) throw sessionError; },
        settings: { get: () => rate }, remaining: value => state.remaining.push(value), log: (message, tone) => state.logs.push({ message, tone }), progress() {}, retry: operation => operation(), wait: async ms => state.waits.push(ms),
    };
    return state;
}
for (const [response, message] of [[{ success: false, code: 403, msg: 'private-token' }, /拒绝/], [{ success: false, code: 401 }, /登录/], [{ code: 429, success: false }, /限流/], [{ success: false, msg: 'captcha' }, /验证/], [{ code: 503 }, /暂不可用/], [{}, /缺少确认/], [{ isPassed: false }, /平台未确认/]]) test('unconfirmed or rejected video reports never count as complete ' + JSON.stringify(response), async () => {
    const f = fixture(response);
    await assert.rejects(runVideo(f.task, f.env), message);
    assert.equal(f.remaining.at(-1), null);
});
test('valid completion returns confirmed and stops countdown at zero', async () => {
    const f = fixture({ isPassed: true });
    assert.equal(await runVideo(f.task, f.env), 'confirmed'); assert.equal(f.remaining.at(-1), 0);
});
test('video input, status and session failures clear the countdown', async () => {
    for (const settings of [{ statusError: new Error('status offline') }, { sessionError: new Error('session offline') }, { rate: 100 }, { duration: -1 }]) {
        const f = fixture({ isPassed: false }, settings); await assert.rejects(runVideo(f.task, f.env)); assert.equal(f.remaining.at(-1), null);
    }
    const f = fixture({ isPassed: false }); f.env.context.uid = ''; await assert.rejects(runVideo(f.task, f.env), /用户 ID/);
    f.env.context.uid = '404'; f.task.jobid = ''; await assert.rejects(runVideo(f.task, f.env), /不完整/);
});
test('a one-second segment still waits for a full platform heartbeat and its estimate ticks', async t => {
    const f = fixture({ isPassed: false }); let now = 1000, tick, timers = 0;
    t.mock.method(Date, 'now', () => now);
    t.mock.method(globalThis, 'setInterval', callback => { tick = callback; timers++; return timers; });
    t.mock.method(globalThis, 'clearInterval', () => { timers--; });
    f.env.wait = async ms => { assert.equal(ms, 60000); now += 10000; tick(); assert.equal(f.remaining.at(-1), 50); };
    await assert.rejects(runVideo(f.task, f.env), /平台未确认/); assert.equal(timers, 0);
});
test('course engine emits neutral skip logs for disabled or non-task content', async () => {
    const events = [], origin = 'https://mooc1.chaoxing.com';
    const runner = createCourseRunner({ context: { origin, courseId: '101', classId: '202' }, settings: { get: () => false }, emit: event => events.push(event), wait: async () => {},
        transport: { request: async details => {
            const url = new URL(details.url);
            let responseText = '<div id="cur1"><span class="posCatalog_name">课程一</span><span class="jobUnfinishCount">1</span></div>';
            if (url.pathname === '/knowledge/cards') responseText = url.searchParams.get('num') === '0' ? '<script>mArg=' + JSON.stringify({ defaults: {}, attachments: [{ type: 'video', job: false, property: { name: '普通资源' } }, { type: 'video', job: true, property: { name: '未启用视频' } }] }) + ';</script>' : '<script>mArg=$mArg;</script>';
            return { status: 200, responseText };
        } },
    });
    const summary = await runner.run(); assert.equal(summary.skipped, 2);
    const skips = events.filter(e => e.type === 'log' && /已跳过/.test(e.message));
    assert.ok(skips.length >= 2); assert.ok(skips.every(e => e.tone === 'skipped'));
});
