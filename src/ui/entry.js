'use strict';

const { element, button } = require('./dom');
const createAccountView = require('./account');
const createProductInfo = require('./product-info');
const product = require('../core/product');

function createEntry(context, callbacks) {
    const { document, bank, access, modal, connect, saveToken } = context;
    const dialog = modal.open({ id: 'yixue-entry', title: product.brand, subtitle: '选择需要使用的课程功能' });
    const account = createAccountView({ document, bank, prefix: 'yixue-entry', onConnect: connect, onSave: saveToken, getDisplayToken: access.getDisplayToken });
    dialog.onCleanup(account.destroy);
    const productInfo = createProductInfo(context, { compact: true, showPricing: false });
    dialog.onCleanup(productInfo.destroy);
    const grid = element(document, 'div', { className: 'yx-action-grid' });
    const actions = [
        ['course', '刷章节', '视频、文档与章节测验', '▶', callbacks.onCourse],
        ['homework', '刷作业', '查看并辅助填写作业', '✓', callbacks.onHomework],
        ['exam', '刷考试', '进入课程考试页面', '▦', callbacks.onExam],
        ['visits', '刷学习次数', '更新本课程学习记录', '↻', callbacks.onVisits],
    ];
    for (const [name, title, description, icon, callback] of actions) {
        const action = button(document, '', () => {
            dialog.close();
            Promise.resolve().then(() => callback?.()).catch(() => {});
        }, { id: `yixue-open-${name}`, className: `yx-action${name === 'course' ? ' yx-action-main' : ''}`, 'aria-label': title });
        action.append(
            element(document, 'span', { className: 'yx-action-icon', text: icon, 'aria-hidden': 'true' }),
            element(document, 'span', { className: 'yx-action-title', text: title }),
            element(document, 'span', { className: 'yx-action-description', text: description }),
        );
        grid.append(action);
    }
    dialog.sheet.append(account.element,
        element(document, 'h3', { className: 'yx-action-heading', text: '课程任务' }),
        element(document, 'p', { className: 'yx-body-copy', text: '按需选择功能，执行状态会显示在对应面板。' }), grid,
        productInfo.element, element(document, 'div', { className: 'yx-entry-footer' }, [
            element(document, 'small', { text: product.pricingNotice }),
            button(document, '取消', () => dialog.close(), { id: 'yixue-entry-cancel', className: 'yx-button yx-quiet' }),
        ]),
    );
    return dialog;
}

module.exports = createEntry;
