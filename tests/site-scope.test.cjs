'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const metadata = require('../src/metadata.json');
const { isSupportedSite } = require('../src/core/routes');
const matches = href => {
    const url = new URL(href);
    return [].concat(metadata.match).some(pattern => {
        const host = /^\*:\/\/([^/]+)\/\*$/.exec(pattern)?.[1];
        return host === '*' || host === url.hostname || (host?.startsWith('*.') && (url.hostname === host.slice(2) || url.hostname.endsWith(host.slice(1))));
    }) || [].concat(metadata.include || []).some(pattern => {
        const match = /^\/(.+)\/([a-z]*)$/.exec(pattern);
        return match && new RegExp(match[1], match[2] || 'i').test(url.href);
    });
};
test('manager matching excludes unrelated websites while preserving platform and campus entry points', () => {
    for (const url of ['https://www.sensenova.cn/models', 'https://github.com/exam/preview', 'https://example.org/mooc-ans/mycourse/stu', 'https://mooc1.chaoxing.com.evil.example/work/phone/work']) assert.equal(matches(url), false, url);
    for (const url of ['https://i.chaoxing.com/base', 'https://mooc2-ans.chaoxing.com/mooc2-ans/mycourse/stu', 'http://mooc1.chaoxing.com/mycourse/studentstudy', 'https://study.zhihuishu.com/', 'https://mooc1.xueyinonline.com/', 'https://mooc1.hnust.edu.cn/', 'https://webvpn.ahmu.edu.cn/https/abcdef/mycourse/stu']) assert.equal(matches(url), true, url);
});
test('school node templates and VPN study paths cover additional campuses without matching school homepages', () => {
    for (const campus of ['campus.edu.cn', 'jxjyzx.campus.edu.cn', 'another-campus.edu.cn']) {
        for (const prefix of ['mooc1', 'mooc1-1', 'mooc1-api', 'mooc2', 'mooc2-ans', 'stat2-ans']) {
            const url = 'https://' + prefix + '.' + campus + ':8443/mooc-ans/mycourse/stu';
            assert.equal(matches(url), true, url); assert.equal(isSupportedSite(url), true, url);
        }
        for (const prefix of ['/https/abcd', '/https/443/abcd', '/http/80/abcd']) {
            const url = 'https://webvpn.' + campus + prefix + '/mooc-ans/mycourse/stu';
            assert.equal(matches(url), true, url); assert.equal(isSupportedSite(url), true, url);
            for (const path of ['/api/work', '/modules/work/index.html']) {
                const embedded = 'https://webvpn.' + campus + prefix + path;
                assert.equal(matches(embedded), true, embedded); assert.equal(isSupportedSite(embedded), true, embedded);
            }
        }
        for (const url of ['https://www.' + campus + '/', 'https://webvpn.' + campus + '/https/abcd/mail/inbox']) {
            assert.equal(matches(url), false, url); assert.equal(isSupportedSite(url), false, url);
        }
    }
    assert.ok(metadata.connect.includes('self'));
});
test('VPN ports remain in generated control and request URLs', async () => {
    const { readCourseContext, consoleUrl } = require('../src/core/routes');
    const { createTransport } = require('../src/core/transport');
    for (const prefix of ['/https/abcd', '/https/443/abcd', '/http/80/abcd']) {
        const base = 'https://webvpn.campus.edu.cn';
        const context = readCourseContext(base + prefix + '/mooc-ans/mycourse/stu?courseid=101&classid=202');
        assert.equal(context.prefix, prefix);
        assert.equal(new URL(consoleUrl(context)).pathname, prefix + '/mooc-ans/course/yixue-console.html');
        let sent;
        const transport = createTransport({ base, pageUrl: base + prefix + '/mycourse/studentstudy', send: details => { sent = details; queueMicrotask(() => details.onload({ status: 200, responseText: 'ok' })); } });
        await transport.request({ url: '/knowledge/cards' });
        assert.equal(new URL(sent.url).pathname, prefix + '/knowledge/cards');
    }
});
test('the runtime independently checks protocols and exact hostname boundaries', () => {
    assert.equal(typeof isSupportedSite, 'function');
    for (const url of ['https://www.sensenova.cn/models', 'https://github.com/exam/preview', 'https://example.org/mooc-ans/mycourse/stu', 'https://mooc1.chaoxing.com.evil.example/work/phone/work', 'javascript:alert(1)', 'file:///mycourse/stu', 'not a url']) assert.equal(isSupportedSite(url), false, url);
    for (const url of ['https://i.chaoxing.com/base', 'https://chaoxing.com/', 'https://study.zhihuishu.com/', 'http://mooc1.chaoxing.com/mycourse/studentstudy', 'https://mooc1.hnust.edu.cn/', 'https://webvpn.ahmu.edu.cn/https/abcdef/mycourse/stu']) assert.equal(isSupportedSite(url), true, url);
});
