'use strict';
function connectionStatus(bank) {
    const token = bank.getToken(), current = bank.balanceState();
    const route = bank.routeState?.();
    if (!token) return { connected: false, mode: 'local', label: '本地模式', detail: '' };
    if (current.error) return { connected: false, mode: 'error', label: '连接异常', detail: current.error };
    if (current.data) return { connected: true, mode: route?.compatibility ? 'compatibility' : 'ready', label: route?.compatibility ? '已连接 · 兼容线路' : '已连接题库', detail: route?.activeOrigin || '' };
    if (current.loading) return { connected: false, mode: 'loading', label: '正在连接', detail: '' };
    return { connected: false, mode: 'pending', label: 'Token 已保存', detail: '刷新额度后验证题库连接。' };
}
module.exports = connectionStatus;
