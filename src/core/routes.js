'use strict';
const { parseCookie } = require('./primitives');
function classifyPage(href) {
    const path = new URL(href).pathname;
    if (/\/mycourse\/(?:stu|studentcourse)\/?$/.test(path)) return 'entry';
    if (/\/mooc-ans\/course\/(?:portal\/)?(?:yixue-console|999999999[\d.]+)(?:\.html)?\/?$/.test(path)) return 'dashboard';
    if (/\/mycourse\/studentstudy\/?$/.test(path)) return 'study';
    if (/\/work\/(?:getAllWork|list)|\/mooc2\/work\/list/.test(path)) return 'work-list';
    if (/\/work\/(?:doHomeWorkNew|dowork)|\/mooc2\/work\/dowork/.test(path)) return 'work';
    if (/\/(?:api\/work|work\/phone\/work)\/?$/.test(path)) return 'work';
    if (/reVersionTestStartNew|\/exam\/preview|\/exam\/test\/reVersion|\/exam\/test\/start/.test(path)) return 'exam';
    if (/exam-list|examnotes|\/exam\/test\/?$/.test(path)) return 'exam-list';
    return 'other';
}
function studyOrigin(url, serverHost, prefix) {
    if (prefix) return url.origin;
    if (serverHost) {
        try {
            const candidate = new URL(serverHost, url);
            const family = host => host.replace(/^[^.]+\./, '');
            const studyHost = /^mooc1(?:-\d+|-api)?\./i.test(candidate.hostname);
            if (['https:', 'http:'].includes(candidate.protocol) && !candidate.username && !candidate.password &&
                candidate.pathname === '/' && !candidate.search && !candidate.hash &&
                (candidate.origin === url.origin || (studyHost && family(candidate.hostname) === family(url.hostname)))) {
                return candidate.origin;
            }
        } catch (_) { /* An invalid page setting must not replace the course server. */ }
    }
    // The modern portal serves the course shell; legacy study APIs live on mooc1.
    return url.hostname === 'mooc2-ans.chaoxing.com' ? 'https://mooc1.chaoxing.com' : url.origin;
}
function readCourseContext(href, { title = '', cookie = '', document: page, serverHost = '' } = {}) {
    const url = new URL(href);
    const param = (...keys) => keys.map(key => url.searchParams.get(key)).find(Boolean) || '';
    const prefix = url.pathname.match(/^(.*\/https\/[a-z0-9]+)(?:\/|$)/i)?.[1] || '';
    return {
        origin: studyOrigin(url, serverHost, prefix),
        prefix,
        courseId: param('courseid', 'courseId'), classId: param('classid', 'clazzid', 'classId'), cpi: param('cpi'),
        uid: param('uid', 'userId') || parseCookie('UID', cookie) || parseCookie('_uid', cookie) || page?.querySelector('input[name="userId"],#uploadUid')?.value || '',
        fid: parseCookie('fid', cookie),
        courseName: param('coursename') || title.replace(/-首页$/, '') || '章节学习控制台',
    };
}
function consoleUrl(context) {
    const url = new URL((context.prefix || '') + '/mooc-ans/course/yixue-console.html', context.origin);
    for (const [key, value] of Object.entries({ ut: 's', classid: context.classId, courseid: context.courseId, cpi: context.cpi, coursename: context.courseName, uid: context.uid })) url.searchParams.set(key, value || '');
    return url.href;
}
module.exports = { classifyPage, readCourseContext, consoleUrl };
