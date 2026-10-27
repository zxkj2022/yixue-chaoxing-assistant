'use strict';
const { assignedObject, parseLiteral, tokens } = require('../platform/script-data');

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
    const viewer = new URL('https://k.chaoxing.com/res/look/index.html');
    viewer.searchParams.set('uuid', uuid);
    viewer.searchParams.set('_t', '202311241720');
    const headers = { Referer: viewer.href };
    const result = await env.requestJSON('https://k.chaoxing.com/apis/chapter/getMeetReview4Job', { crossOrigin: true, uuid, courseId: env.context.courseId, classId: env.context.classId, cpi: env.context.cpi }, headers);
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
                const uploaded = await env.requestJSON('https://k.chaoxing.com/apis/chapter/addReviewDot4Job', { crossOrigin: true, uuid, dataKey: recording.dataKey, lastWatchTime: next }, headers);
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

function pageReplayId(html) {
    const scripts = [...String(html).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)];
    const ids = new Set();
    const key = token => {
        if (token === undefined) return '';
        try { return /^['"]/.test(token) ? parseLiteral(token) : token; }
        catch (_) { return ''; }
    };
    for (const source of scripts.length ? scripts.map(match => match[1]) : [String(html)]) {
        const list = tokens(source).map(token => token.text);
        for (let index = 0; index < list.length - 3; index++) {
            if (key(list[index]) !== 'data' || list[index + 1] !== ':' || list[index + 2] !== '{') continue;
            let depth = 1;
            for (let cursor = index + 3; cursor < list.length && depth; cursor++) {
                if (list[cursor] === '{' || list[cursor] === '[') depth++;
                if (list[cursor] === '}' || list[cursor] === ']') depth--;
                if (depth !== 1 || key(list[cursor]) !== 'liveId' || list[cursor + 1] !== ':') continue;
                const value = key(list[cursor + 2]);
                if (/^\d{4,50}$/.test(value) && [',', '}'].includes(list[cursor + 3])) ids.add(value);
            }
        }
    }
    if (ids.size > 1) throw new Error('直播回放 ID 不明确');
    return [...ids][0] || '';
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
        const converted = parseLiteral(await env.requestText('/ananas/live/getnewliveid', { oliveid: originalId }));
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
    let position = 0, target = Math.max(0, threshold - watched), userInfo = '', replayId = originalId;
    if (line) {
        const length = finite(line.videoLongtime, '直播回放时长');
        const start = /\bvideoPlayStartTime\s*=\s*([^;,\r\n<]+)/.exec(html);
        let startValue;
        try { startValue = JSON.parse(start?.[1] || ''); }
        catch (_) { throw new Error('直播回放起点必须为数字'); }
        if (typeof startValue !== 'number') throw new Error('直播回放起点必须为数字');
        position = finite(startValue, '直播回放起点');
        // Some live pages expose a tiny placeholder duration; liveinfo is the
        // legacy fallback, while a real lineVideo duration is authoritative.
        target = (length < 10 ? duration : length) * (rt <= 0.9 ? rt + 0.1 : 1);
        replayId = pageReplayId(html) || originalId;
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
                const replay = await env.requestText('https://zhibo.chaoxing.com/apis/live/put/watchMoment', { liveId: replayId, streamName: property.streamName, vdoid: property.vdoid, watchMoment: current, t: Date.now(), u: userInfo }, { Referer: pageUrl.href });
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
