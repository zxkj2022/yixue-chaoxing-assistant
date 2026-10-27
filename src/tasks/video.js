'use strict';
const { createVideoReporter } = require('./video-plan');
const { abortError } = require('../core/primitives');
const playerReferers = new WeakMap();
const BASELINE_PLAYER_VERSION = '2025-0725-1842';

function reportRejection(report) {
    if (!report || typeof report !== 'object') return null;
    const code = String(report.code ?? report.status ?? '');
    const explicit = report.success === false || report.result === false || Boolean(report.error)
        || /^(?:[45]\d\d|error|failed?|forbidden|unauthorized|denied)$/i.test(code);
    if (!explicit) return null;
    const description = [report.msg, report.message, report.error, code].filter(value => typeof value === 'string').join(' ');
    const verification = /验证码|人机验证|访问验证|captcha|verification/i.test(description);
    const login = /登录|login|unauthorized|\b401\b/i.test(description);
    const limited = code === '429' || /过于频繁|限流|too many|rate.limit/i.test(description);
    const temporary = limited || /^[5]\d\d$/.test(code);
    const message = verification ? '视频上报需要完成平台验证，请在课程页面处理后重试'
        : login ? '视频上报登录状态失效，请重新登录课程后重试'
        : limited ? '视频上报被平台限流，请稍后重试'
        : temporary ? '视频上报服务暂不可用' : '视频上报被平台拒绝，请在课程页面核对权限和任务状态';
    // Only fixed messages and recognized numeric status codes are exposed.
    return Object.assign(new Error(message + (/^[45]\d\d$/.test(code) ? '（业务状态 ' + code + '）' : '')), {
        retryable: temporary, code: verification ? 'VERIFICATION_REQUIRED' : 'PLATFORM_REJECTED',
    });
}

async function playerReferer(env) {
    // Video requests need the player module Referer and its deployed version.
    if (!playerReferers.has(env.context)) playerReferers.set(env.context, (async () => {
        let version = BASELINE_PLAYER_VERSION;
        try {
            const source = await env.requestText('/ananas/ueditor/ueditor.parse.js', { t: Math.round(Date.now() / 1000) });
            version = source.match(/modules\/video\/index\.html\?v=(\d{4}-\d{4}-\d{4})\b/)?.[1] || version;
        } catch (error) {
            if (env.signal?.aborted) throw error;
        }
        const referer = new URL((env.context.prefix || '') + '/ananas/modules/video/index.html', env.context.origin);
        referer.searchParams.set('v', version);
        return referer.href;
    })().catch(error => { playerReferers.delete(env.context); throw error; }));
    return playerReferers.get(env.context);
}

async function runVideo(task, env) {
    const remaining = typeof env.remaining === 'function' ? seconds => { try { env.remaining(seconds); } catch {} } : null;
    let timer = null, confirmed = false;
    const stopCountdown = () => { if (timer !== null) clearInterval(timer); timer = null; };
    const checkSignal = () => { if (env.signal?.aborted) throw abortError(); };
    try {
        checkSignal();
        const uid = [env.context.uid, env.defaults.userid].map(value => String(value || '').trim()).find(value => /^[1-9]\d*$/.test(value));
        if (!uid) throw new Error('缺少用户 ID，视频未执行');
        const property = task.property;
        if (!task.jobid || !property.objectid || !env.defaults.reportUrl) throw new Error('视频任务参数不完整，未执行');
        const referer = await playerReferer(env);
        let status;
        try { status = await env.requestJSON('/ananas/status/' + encodeURIComponent(property.objectid), { flag: 'normal', _dc: Date.now(), k: env.defaults.fid || env.context.fid || '666' }, { Referer: referer }); }
        catch (error) { if (env.signal?.aborted) throw error; throw new Error('视频状态读取失败：' + error.message); }
        const duration = Number(status.duration);
        if (status.status !== 'success' || !Number.isFinite(duration) || duration <= 0 || !status.dtoken) throw new Error('视频状态或时长无效');
        const rateAllowed = Number(property.doublespeed) === 1 || String(property.fastforward ?? false) === 'false';
        let previousRate = null, previousRequestedRate = null;
        const readRate = () => {
            const requested = Number(env.settings.get('beisu', 1));
            if (!Number.isFinite(requested) || requested < .5 || requested > 16) throw new Error('视频倍速必须在 0.5–16 之间');
            const rate = rateAllowed ? requested : 1;
            if (Math.ceil(duration / Math.round(60 * rate)) > 100000) throw new Error('视频时长或上报间隔无效');
            if (rate !== previousRate || requested !== previousRequestedRate) {
                env.log(!rateAllowed && requested !== 1 ? `当前视频受平台倍速限制，按 1 倍处理（已保存 ${requested} 倍）。` : `当前视频按 ${rate} 倍处理：${env.name}`, !rateAllowed && requested !== 1 ? 'warning' : 'info');
                previousRate = rate; previousRequestedRate = requested;
            }
            return rate;
        };
        const reportAt = createVideoReporter({ reportUrl: env.defaults.reportUrl, classId: env.context.classId, uid, task, status });
        const estimate = (position, rate) => Math.ceil((duration - position) / Math.round(60 * rate)) * 60;
        remaining?.(estimate(0, readRate()));
        await env.prepareVideoSession?.(env.context);
        checkSignal();
        const reportHeaders = { Referer: referer };
        if (new URL(reportAt(0).url, env.context.origin).origin === new URL(referer).origin) reportHeaders['Sec-Fetch-Site'] = 'same-origin';
        env.log('开始视频任务：' + env.name);
        for (let position = 0;;) {
            checkSignal();
            const { url, isdrag } = reportAt(position);
            const result = await env.retry(async () => {
                const report = await env.requestJSON(url, {}, reportHeaders);
                const rejection = reportRejection(report);
                if (rejection) throw rejection;
                if (!report || typeof report.isPassed !== 'boolean') throw new Error('视频上报响应缺少确认状态');
                return report;
            }, '视频进度上报', { name: env.name, position, duration });
            checkSignal();
            env.progress(Math.floor(position / duration * 100));
            if (result.isPassed === true) {
                confirmed = true; remaining?.(0);
                env.log('视频任务完成：' + env.name, 'success'); return 'confirmed';
            }
            if (isdrag === '4') throw new Error('视频进度已上传，平台未确认完成');
            const totalRemaining = estimate(position, readRate());
            const afterWait = Math.max(0, totalRemaining - 60);
            if (remaining) {
                const startedAt = Date.now();
                remaining(afterWait + 60);
                timer = setInterval(() => remaining(Math.max(1, afterWait + 60 - Math.min(60, Math.max(0, Math.floor((Date.now() - startedAt) / 1000))))), 1000);
            }
            try { await env.wait(60000, env.signal); }
            finally { stopCountdown(); }
            checkSignal();
            const rate = readRate();
            position = Math.min(duration, position + Math.round(60 * rate));
            remaining?.(Math.max(1, estimate(position, rate)));
        }
    } finally {
        stopCountdown();
        if (!confirmed) remaining?.(null);
    }
}

module.exports = { runVideo };
