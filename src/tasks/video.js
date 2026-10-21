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
