'use strict';
const md5 = require('../core/md5');

function createVideoReporter({ reportUrl, classId, uid, task, status, now = Date.now }) {
    const duration = Number(status.duration);
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('视频时长或上报间隔无效');
    const scalar = value => {
        const text = String(value ?? '');
        if (/[&#\r\n]/.test(text)) throw new Error('视频上报字段包含无效分隔符');
        return text;
    };
    const token = String(status.dtoken || '');
    if (!token || /[\/?#\\\r\n]/.test(token)) throw new Error('视频上报令牌无效');
    const otherInfo = String(task.otherInfo || '');
    if (/[#\r\n]/.test(otherInfo)) throw new Error('视频附加参数无效');
    const objectId = scalar(status.objectid || task.property.objectid);
    const rt = scalar(task.property.rt || '0.9');
    if (!Number.isFinite(Number(rt)) || Number(rt) <= 0) throw new Error('视频上报参数无效');
    const dtype = /audio|voice/i.test(String(task.property.module || '')) ? 'Audio' : 'Video';
    const base = String(reportUrl).replace(/\/$/, '') + '/' + token;
    return position => {
        if (!Number.isFinite(position) || position < 0 || position > duration) throw new Error('视频上报位置无效');
        const isdrag = position === duration ? '4' : '3';
        const signature = `[${classId}][${uid}][${task.jobid}][${objectId}][${position * 1000}][d_yHJ!$pdA~5][${duration * 1000}][0_${duration}]`;
        const url = base + '?clazzId=' + scalar(classId) + '&playingTime=' + position + '&duration=' + duration + '&clipTime=0_' + duration
            + '&objectId=' + objectId + '&otherInfo=' + otherInfo + '&jobid=' + scalar(task.jobid) + '&userid=' + scalar(uid)
            + '&isdrag=' + isdrag + '&view=pc&enc=' + md5(signature) + '&rt=' + rt
            + '&videoFaceCaptureEnc=' + scalar(task.videoFaceCaptureEnc || '') + '&dtype=' + dtype + '&_t=' + now()
            + '&attDuration=' + scalar(task.attDuration || '0') + '&attDurationEnc=' + scalar(task.attDurationEnc || '');
        return { url, position, duration, isdrag };
    };
}

function createVideoPlan(options) {
    const duration = Number(options.status.duration), step = Math.round(60 * options.rate);
    if (!Number.isFinite(step) || step <= 0 || Math.ceil(duration / step) > 100000) throw new Error('视频时长或上报间隔无效');
    const report = createVideoReporter(options), plan = [];
    for (let position = 0;; position = Math.min(duration, position + step)) {
        const entry = report(position);
        plan.push(entry);
        if (entry.isdrag === '4') return plan;
    }
}

module.exports = { createVideoPlan, createVideoReporter };
