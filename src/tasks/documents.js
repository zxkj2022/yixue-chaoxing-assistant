'use strict';

const resources = new Map([
    ['document', { path: '/ananas/job/document', label: '文档', wait: 5000 }],
    ['book', { path: '/ananas/job', label: '图书', wait: 5000 }],
    ['hyperlink', { path: '/ananas/job/hyperlink', label: '链接', wait: 2000 }],
    ['microCourse', { path: '/ananas/job/microCourse', label: '微课', wait: 5000 }],
]);

async function runDocument(task, env) {
    const specification = resources.get(task.type);
    if (!task.jobid) throw new Error('缺少任务 ID');
    const parameters = { jobid: task.jobid, knowledgeid: env.chapter.id, courseid: env.context.courseId, clazzid: env.context.classId, jtoken: task.jtoken };
    if (task.type === 'microCourse') Object.assign(parameters, { checkMicroTopic: true, microTopicId: 'undefined' });
    await env.wait(specification.wait, env.signal);
    const text = await env.requestText(specification.path, parameters);
    const confirmed = task.type === 'microCourse' ? text.includes('添加考核点成功') : env.parseJSON(text).status === true;
    if (!confirmed) throw new Error(specification.label + '任务未获得平台确认');
    env.log(specification.label + '任务完成：' + env.name, 'success');
    return 'confirmed';
}

module.exports = { runDocument, documentTypes: [...resources.keys()] };
