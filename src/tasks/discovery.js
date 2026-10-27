'use strict';

async function discoverEngineChapters(env) {
    const chapters = [], topics = new Set();
    try {
        const active = await env.requestJSON('https://mobilelearn.chaoxing.com/v2/apis/active/getData', { DB_STRATEGY: 'DEFAULT', courseId: env.context.courseId, classId: env.context.classId });
        if (!Array.isArray(active.data)) throw new Error('任务引擎活动格式无效');
        for (const activity of active.data) {
            try {
                if (!activity?.id) continue;
                const destination = await env.requestResponse('https://task.chaoxing.com/api/v1/middlePageApi/jumpStudyPlanList', { taskId: activity.id, moocClassId: env.context.classId }, 'HEAD');
                const userId = new URL(destination.finalUrl).searchParams.get('encryTaskUserId');
                if (!userId) throw new Error('任务引擎跳转缺少用户标识');
                const standard = await env.requestJSON('https://task.chaoxing.com/userStudyPlan/getUserStandard', { encryTaskUserId: userId });
                const plans = standard.data?.userTaskQualifyDTO?.planUserBOList;
                if (!Array.isArray(plans)) throw new Error('任务引擎计划格式无效');
                for (const item of plans) {
                    const plan = item?.plan;
                    if (Number(plan?.planType) !== 1 || Number(item.finish) !== 0 || !plan.externalDataId || topics.has(String(plan.externalDataId))) continue;
                    topics.add(String(plan.externalDataId));
                    try {
                        const destination = await env.requestResponse('https://mooc2-ans.chaoxing.com/mooc2-ans/coursetopic/topicdetailsmiddle', { taskEngine: true, courseid: env.context.courseId, clazzid: env.context.classId, cpi: env.context.cpi, topicid: plan.externalDataId, ut: 's' });
                        const chapterId = new URL(destination.finalUrl).searchParams.get('chapterId');
                        if (!chapterId) throw new Error('任务引擎跳转缺少章节 ID');
                        chapters.push({ id: chapterId, name: '任务引擎章节 ' + chapterId, remaining: 1 });
                    } catch (error) { env.checkSignal(); env.log('任务引擎章节读取失败：' + error.message, 'warning'); }
                }
            } catch (error) { env.checkSignal(); env.log('任务引擎计划读取失败：' + error.message, 'warning'); }
        }
    } catch (error) { env.checkSignal(); env.log('任务引擎读取失败，继续常规目录：' + error.message, 'warning'); }
    return chapters;
}

async function discoverNonJobChapters(env) {
    const chapters = [], excluded = new Set(['已完成', '待批阅', '已保存']);
    const statistics = new URL(env.context.origin);
    statistics.hostname = statistics.hostname.replace(/^mooc(?:1(?:-\d+|-api)?|2-ans)?\./, 'stat2-ans.');
    statistics.pathname = '/stat2/chapter-exam/s/tests/data';
    for (let page = 1; page <= 100; page++) {
        try {
            const response = await env.requestJSON(statistics.href, { courseid: env.context.courseId, clazzid: env.context.classId, ut: 's', pageSize: 200, page });
            const results = response.data?.results;
            if (!Array.isArray(results)) throw new Error('非任务章节统计格式无效');
            if (!results.length) break;
            for (const result of results) {
                if (result?.isNonJob === true && result.chapterId && !excluded.has(result.statusStr)) {
                    chapters.push({ id: String(result.chapterId), name: '非任务章节 ' + result.chapterId, remaining: 1 });
                }
            }
            if (page === 100) env.log('非任务章节分页达到 100 页上限，分页已停止', 'warning');
        } catch (error) { env.checkSignal(); env.log('非任务章节统计读取失败：' + error.message, 'warning'); break; }
    }
    return chapters;
}

module.exports = { discoverEngineChapters, discoverNonJobChapters };
