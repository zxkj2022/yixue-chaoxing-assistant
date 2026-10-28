'use strict';
const { element, button } = require('./dom');
const { brand, support, scriptRule } = require('../core/product');
function showScriptConflict({ document, window }) {
    if (document.getElementById('yixue-script-conflict')) return;
    const title = element(document, 'h2', { id: 'yixue-conflict-title', text: '网课脚本冲突，已阻止运行' });
    const box = element(document, 'section', { id: 'yixue-script-conflict', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': title.id, 'aria-describedby': 'yixue-conflict-help' }, [
        element(document, 'p', { text: brand }), title,
        element(document, 'p', { text: scriptRule }),
        element(document, 'p', { id: 'yixue-conflict-help', text: '检测到同类脚本或易学助手重复安装。请检查脚本猫、油猴、暴力猴等管理器，停用其他网课脚本及多余的易学助手，再刷新页面。' }),
        element(document, 'p', { text: support }),
        button(document, '停用其他脚本后刷新页面', () => window.location.reload()),
    ]);
    box.style.cssText = 'position:fixed;z-index:2147483647;inset:0;box-sizing:border-box;padding:clamp(18px,6vw,60px);background:#f5f7fb;color:#1d2a40;font:16px/1.8 system-ui,sans-serif;overflow:auto;white-space:normal;word-break:break-word;';
    const style = element(document, 'style', { text: '#yixue-script-conflict>:not(style){display:block;box-sizing:border-box;max-width:680px;margin:16px auto;white-space:normal}#yixue-script-conflict h2{font-size:24px;line-height:1.5}#yixue-script-conflict button{padding:12px 20px;border:0;border-radius:12px;background:#3478f6;color:#fff;font:inherit;cursor:pointer;min-height:48px}' });
    box.append(style);
    (document.body || document.documentElement).append(box);
    box.querySelector('button').focus();
}
module.exports = showScriptConflict;
