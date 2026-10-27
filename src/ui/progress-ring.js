'use strict';
const { element } = require('./dom');

function createProgressRing(document, { id, labelId, label, caption, tone = 'blue' }) {
    const ring = element(document, 'div', {
        id, className: 'yixue-progress-ring', role: 'progressbar', 'data-tone': tone,
        'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0',
    });
    function svgNode(tag, attributes) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
        return node;
    }
    const svg = svgNode('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true', focusable: 'false' });
    const track = svgNode('circle', { cx: '60', cy: '60', r: '52', class: 'yixue-ring-track' });
    const arc = svgNode('circle', {
        cx: '60', cy: '60', r: '52', pathLength: '100', class: 'yixue-ring-arc',
        'stroke-dasharray': '100 100', 'stroke-dashoffset': '100',
    });
    svg.append(track, arc);
    const valueLabel = element(document, 'span', { id: labelId, className: 'yixue-ring-value', text: '0%' });
    ring.append(svg, element(document, 'div', { className: 'yixue-ring-center', 'aria-hidden': 'true' }, [
        valueLabel, element(document, 'span', { className: 'yixue-ring-caption', text: caption }),
    ]));
    function setValue(percent) {
        const number = Number(percent);
        const value = Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : 0;
        ring.setAttribute('aria-valuenow', String(value));
        valueLabel.textContent = value + '%';
        arc.setAttribute('stroke-dashoffset', String(100 - value));
        arc.style.opacity = value ? '1' : '0';
    }
    setValue(0);
    return { element: ring, setValue };
}

module.exports = createProgressRing;
