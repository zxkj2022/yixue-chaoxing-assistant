'use strict';

const { matchAnswer, normalizeType, booleanValue } = require('./matcher.js');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function emitChanges(element) {
    const EventClass = element.ownerDocument?.defaultView?.Event;
    if (!EventClass) return;
    element.dispatchEvent(new EventClass('input', { bubbles: true }));
    element.dispatchEvent(new EventClass('change', { bubbles: true }));
}

function isSelected(choice) {
    if (choice.input) return choice.input.checked;
    const element = choice.element;
    return element.getAttribute('aria-checked') === 'true' ||
        element.matches('.check_answer,.checked,.selected,.on,.cur') ||
        Boolean(element.querySelector('.check_answer,.checked,.selected,[aria-checked="true"]'));
}

function prepareFill(field, value, unsafeWindow) {
    const element = field.element;
    if (!element || element.disabled || element.readOnly) return null;
    if (field.kind === 'editor') {
        const editor = field.id && unsafeWindow?.UE?.getEditor?.(field.id);
        if (typeof editor?.setContent === 'function') return () => editor.setContent(escapeHtml(value).replace(/\r?\n/g, '<br>'));
        if (element.tagName === 'IFRAME') return null;
        return () => { element.textContent = value; emitChanges(element); };
    }
    if (field.kind === 'contenteditable') return () => { element.textContent = value; emitChanges(element); };
    return () => { element.value = value; emitChanges(element); };
}

function applyAnswer(question, answer, { unsafeWindow } = {}) {
    const match = matchAnswer(question, answer);
    if (!match.matched) return { ...match, applied: false };
    const host = unsafeWindow || question.element?.ownerDocument?.defaultView;
    try {
        if (normalizeType(question.type) === 'fill') {
            const writes = question.fields.map((field, index) => prepareFill(field, match.values[index], host));
            if (writes.some(write => !write)) return { ...match, applied: false, reason: 'unavailable-editor' };
            writes.forEach(write => write());
        } else {
            const choices = question.choices || [];
            const chosen = new Set(match.indices);
            const multiple = normalizeType(question.type) === 'multiple';
            const cannotChange = choice => choice.input?.disabled || choice.element.getAttribute('aria-disabled') === 'true';
            if (match.indices.some(index => !choices[index]?.element) || choices.some((choice, index) => {
                const change = chosen.has(index) ? !isSelected(choice) : multiple && isSelected(choice);
                return change && cannotChange(choice);
            })) {
                return { ...match, applied: false, reason: 'unavailable-option' };
            }
            if (question.host?.kind === 'mobile-chapter') {
                if (!question.host.answerInput) return { ...match, applied: false, reason: 'unavailable-host-answer' };
                let value = match.indices.map(index => choices[index].letter || String.fromCharCode(65 + index)).sort().join('');
                if (normalizeType(question.type) === 'judge') {
                    const truth = booleanValue(choices[match.indices[0]].text);
                    if (truth === null) return { ...match, applied: false, reason: 'unmatched-judgment' };
                    value = String(truth);
                }
                question.host.answerInput.value = value;
                choices.forEach((choice, index) => choice.element.classList.toggle('cur', chosen.has(index)));
                emitChanges(question.host.answerInput);
                return { ...match, applied: true };
            }
            choices.forEach((choice, index) => {
                const selected = isSelected(choice);
                const desired = chosen.has(index);
                if ((desired && !selected) || (multiple && selected && !desired)) (choice.input || choice.element).click();
            });
        }
        return { ...match, applied: true };
    } catch (_) {
        return { ...match, applied: false, reason: 'host-write-failed' };
    }
}

module.exports = { applyAnswer, escapeHtml };
