'use strict';
const { element, button } = require('./dom');
const product = require('../core/product');
function createProductInfo({ document, updates }, { compact = false, showPricing = true } = {}) {
    const status = element(document, 'span', { className: 'yx-update-status', role: 'status', 'aria-live': 'polite', title: '通过 GitHub 官方更新清单检查，脚本猫发布版本可能不同；安装由脚本管理器完成。', text: '当前脚本 ' + product.metadata.version });
    const install = element(document, 'a', { text: '安装新版', href: product.metadata.downloadURL, target: '_blank', rel: 'noopener noreferrer', hidden: true });
    const check = button(document, '检查更新', () => { void updates?.check({ force: true }); }, { 'aria-label': '检查脚本更新' });
    const updateRow = element(document, 'div', { className: 'yx-product-links' }, [status, check, install,
        element(document, 'a', { text: '脚本猫发布页', href: product.scriptcatURL, target: '_blank', rel: 'noopener noreferrer' }),
    ]);
    const view = element(document, 'div', { className: 'yx-product-info' + (compact ? ' is-compact' : '') }, [
        showPricing ? element(document, 'p', { className: 'yx-pricing-copy', text: product.pricingNotice }) : null,
        element(document, 'p', { className: 'yx-support-copy', text: product.support }),
        element(document, 'p', { className: 'yx-script-rule', text: product.scriptRule }), updateRow,
    ]);
    check.disabled = !updates;
    const unsubscribe = updates?.subscribe(state => {
        check.disabled = state.status === 'checking';
        install.hidden = state.status !== 'available';
        status.dataset.status = state.status;
        status.textContent = state.status === 'available' ? '发现新版 ' + state.latestVersion
            : state.status === 'checking' ? '正在检查脚本更新…'
            : state.status === 'current' ? '脚本 ' + state.currentVersion + ' · 已是最新'
            : state.status === 'ahead' ? '当前脚本 ' + state.currentVersion + ' · 发布渠道版本 ' + state.latestVersion
            : state.status === 'error' ? '更新检查失败：' + state.error : '当前脚本 ' + state.currentVersion;
    });
    return { element: view, destroy() { unsubscribe?.(); view.remove(); } };
}
module.exports = createProductInfo;
