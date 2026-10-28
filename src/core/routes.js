'use strict';
const { parseCookie } = require('./primitives');
const metadata = require('../metadata.json');
const siteHosts = [].concat(metadata.match).map(pattern => /^\*:\/\/([^/]+)\/\*$/.exec(pattern)?.[1]).filter(Boolean);
const siteIncludes = [].concat(metadata.include || []).map(pattern => {
    const match = /^\/(.+)\/([a-z]*)$/.exec(pattern);
    return new RegExp(match[1], match[2] || 'i');
});
function isSupportedSite(href) {
    try {
        const url = new URL(href);
        if (!/^https?:$/.test(url.protocol) || url.username || url.password) return false;
        return siteHosts.some(host => host === url.hostname || (host.startsWith('*.') && (url.hostname === host.slice(2) || url.hostname.endsWith(host.slice(1)))))
            || siteIncludes.some(pattern => pattern.test(url.href));
    } catch { return false; }
}

function vpnPrefix(pathname) {
    return pathname.match(/^(.*\/https?\/(?:\d{1,5}\/)?[a-z0-9]+)(?:\/|$)/i)?.[1] || '';
}
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
    const prefix = vpnPrefix(url.pathname);
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
module.exports = { classifyPage, readCourseContext, consoleUrl, isSupportedSite, vpnPrefix };

