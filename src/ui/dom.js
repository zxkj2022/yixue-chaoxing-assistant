'use strict';

function element(document, tag, properties = {}, children = []) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(properties)) {
        if (value === undefined || value === null) continue;
        if (name === 'text') node.textContent = String(value);
        else if (name === 'className') node.className = value;
        else if (name === 'onClick') node.addEventListener('click', value);
        else if (name in node && !name.startsWith('aria')) node[name] = value;
        else node.setAttribute(name, String(value));
    }
    for (const child of children.flat()) {
        if (child !== undefined && child !== null) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
}

function button(document, text, onClick, properties = {}) {
    return element(document, 'button', { type: 'button', text, onClick, ...properties });
}

function brand(document, logoUrl, className) {
    return element(document, 'span', { className }, [element(document, 'img', {
        src: logoUrl, alt: '易学助手', referrerPolicy: 'no-referrer', width: 42, height: 42,
    })]);
}

function appendLog(document, target, message, tone = 'info') {
    const line = element(document, 'div', { className: 'yixue-log-line', text: message, 'data-tone': tone });
    target.append(line);
    while (target.childElementCount > 500) target.firstElementChild.remove();
    target.scrollTop = target.scrollHeight;
}

module.exports = { element, button, brand, appendLog };
