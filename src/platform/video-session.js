'use strict';
const { parseCookie } = require('../core/primitives');

// Initialize the player session marker only on the active course host.
function prepareVideoSession(document, context, random = Math.random) {
    const fail = message => { throw Object.assign(new Error(message), { retryable: false }); };
    if (new URL(document.URL).origin !== new URL(context.origin).origin) fail('课程播放器会话域名不一致，请从课程首页重新进入控制台。');
    const id = String(1000 + Math.floor(random() * 9000));
    document.cookie = 'videojs_id=' + id + ';path=/';
    if (parseCookie('videojs_id', document.cookie) !== id) fail('播放器会话 Cookie 初始化失败，请允许学习通 Cookie 后重试。');
    return id;
}

module.exports = { prepareVideoSession };
