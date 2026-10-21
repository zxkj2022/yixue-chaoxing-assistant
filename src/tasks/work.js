'use strict';

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
    const result = await env.questions.run(page.document, { signal: env.signal, useAi: Boolean(env.settings.get('doAI', false)), apply: true });
    if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
    if (result.stopped) {
        env.log('章节查询已停止，本次不自动保存或提交，请人工核对：' + env.name, 'warning');
        return result.answered ? 'pending' : 'skipped';
    }
    if (!result.total || !result.answered) { env.log('章节测验没有可填写的参考答案，已跳过：' + env.name, 'warning'); return 'skipped'; }
    const host = page.window;
    const threshold = Number(env.settings.get('vgqtlv', 80));
    const canSubmit = env.settings.get('autoSubmit', false) && Number.isFinite(threshold) && result.accuracy >= threshold && typeof host?.toadd === 'function' && typeof host?.submitAction === 'function';
    if (canSubmit) {
        await host.toadd();
        if (env.signal?.aborted) throw env.signal.reason || new Error('章节测验已取消');
        await host.submitAction();
    }
    else if (typeof host?.noSubmit === 'function') await host.noSubmit();
    env.log('章节测验参考答案已填写' + (canSubmit ? '并请求提交' : '，请人工核对') + '；完成状态待核实：' + env.name, 'warning');
    return 'pending';
}

module.exports = { runWork };
