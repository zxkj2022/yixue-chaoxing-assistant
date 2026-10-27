'use strict';
const { element } = require('./dom');

function createMembershipView(document) {
    const badge = element(document, 'span', { className: 'yx-member-badge', 'data-yixue-member-badge': '' });
    const quota = element(document, 'span', { className: 'yx-member-quota' });
    const expiry = element(document, 'p', { className: 'yx-member-expiry' });
    const routeNote = element(document, 'p', { className: 'yx-member-route', text: '当前使用官方兼容线路，主接口恢复后会重新尝试连接。', hidden: true });
    const view = element(document, 'div', { className: 'yx-membership', 'aria-label': '题库会员', 'aria-live': 'polite' }, [
        element(document, 'div', { className: 'yx-member-heading' }, [badge, quota]), expiry, routeNote,
    ]);
    return {
        element: view,
        render({ data, loading = false, error = '' } = {}, connected = true, route) {
            const member = data?.member === true && data.member_until * 1000 > Date.now();
            const tier = member && [1, 2, 3].includes(data.vip_level) ? data.vip_level : 0;
            view.hidden = !connected;
            view.dataset.level = member ? String(tier || 'member') : '0';
            view.dataset.status = error ? 'error' : loading ? 'loading' : 'ready';
            routeNote.hidden = !route?.compatibility;
            badge.textContent = !data ? (loading ? '正在读取会员…' : error ? '获取失败' : '会员待刷新') : member ? ['会员', 'VIP', 'SVIP', 'VVIP'][tier] : '普通用户';
            badge.title = member ? data.plan_name || badge.textContent : '';
            quota.textContent = member && Number.isSafeInteger(data.daily_remaining) && Number.isSafeInteger(data.daily_limit) ? `今日额度 ${data.daily_remaining} / ${data.daily_limit} 次` : '';
            expiry.textContent = member ? '有效期至 ' + new Date(data.member_until * 1000).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '（北京时间）' : data ? '按账户积分查询参考答案' : error || '刷新额度后显示会员信息';
            if (data && error) expiry.textContent += '；刷新失败，保留上次数据：' + error;
        },
    };
}
module.exports = createMembershipView;
