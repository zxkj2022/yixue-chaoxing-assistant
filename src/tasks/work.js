'use strict';
const { observeHostActions } = require('../platform/host-actions');
const { abortError } = require('../core/primitives');

function invokeHost(host, method, signal) {
    return new Promise((resolve, reject) => {
        let settled = false, timer;
        const finish = (error, value) => {
            if (settled) return;
            settled = true; clearTimeout(timer); signal?.removeEventListener('abort', cancel);
            error ? reject(error) : resolve(value);
        };
        const cancel = () => finish(signal?.reason || abortError());
        if (signal?.aborted) { cancel(); return; }
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => finish(Object.assign(new Error('平台保存或提交调用超时，已停止本轮任务。请核对保留的测验页面后再启动。'), { stopCourse: true })), 10000);
        Promise.resolve().then(() => {
            if (signal?.aborted) throw signal.reason || abortError();
            return host[method]();
        }).then(value => finish(null, value), error => finish(error instanceof Error ? error : new Error('平台操作失败，请在测验页面核对。')));
    });
}

async function runWork(task, env) {
    if (!env.bank || typeof env.bank.getToken !== 'function' || !env.bank.getToken()) {
        env.log('未连接题库，跳过章节测验：' + env.name, 'warning');
        return 'skipped';
    }
    const property = task.property;
    const workId = task.jobid ? String(task.jobid).replace(/^work-/, '') : property.workid || String(property._jobid || '').replace(/^work-/, '');
    const jobId = task.jobid || property._jobid || (property.workid ? 'work-' + property.workid : '');
    if (!workId) throw new Error('章节测验缺少试卷 ID');
    if (typeof env.questions?.openPage !== 'function') throw new Error('章节测验页面加载器不可用');
    const url = new URL(env.nonJob ? '/mooc-ans/work/phone/work' : '/work/phone/work', env.context.origin);
    const parameters = { workId, courseId: env.context.courseId, clazzId: env.context.classId, knowledgeId: env.chapter.id, jobId: env.nonJob ? '' : jobId, enc: task.enc || '' };
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
    const page = await env.questions.openPage(url.href, { signal: env.signal });
    const result = await env.questions.run(page.document, { signal: env.signal, apply: true });
    if (result.answered) page.retain?.();
    if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
    if (result.stopped) {
        env.log('章节查询已停止，本次不自动保存或提交，请人工核对：' + env.name, 'warning');
        return result.answered ? 'pending' : 'skipped';
    }
    if (!result.total || !result.answered) {
        if (result.total && result.matched > 0) {
            page.retain?.();
            env.log('章节测验已命中但没有确认写入，已保留测验页面，请核对题目日志：' + env.name, 'warning');
        } else env.log('章节测验没有可填写的参考答案，已跳过：' + env.name, 'warning');
        return 'skipped';
    }
    const host = page.window;
    const threshold = Number(env.settings.get('vgqtlv', 80));
    const canSubmit = env.settings.get('autoSubmit', false) && Number.isFinite(threshold) && result.accuracy >= threshold && typeof host?.toadd === 'function' && typeof host?.submitAction === 'function';
    if (canSubmit || typeof host?.noSubmit === 'function') {
        const observation = observeHostActions(host, { signal: env.signal });
        try {
            if (canSubmit) {
                await invokeHost(host, 'toadd', env.signal);
                if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
                observation.beginAction();
                await invokeHost(host, 'submitAction', env.signal);
            } else await invokeHost(host, 'noSubmit', env.signal);
            observation.actionsInvoked();
            const state = await observation.result;
            if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
            if (state.completed) page.release?.();
            else if (typeof page.retain === 'function') env.log('未确认章节保存请求已完成，已保留测验页面，请人工核对：' + env.name, 'warning');
        } finally { observation.dispose(); }
    }
    env.log('章节测验参考答案已填写' + (canSubmit ? '并请求提交' : '，请人工核对') + '；完成状态待核实：' + env.name, 'warning');
    return 'pending';
}

module.exports = { runWork };

