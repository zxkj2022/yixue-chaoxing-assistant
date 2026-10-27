'use strict';

const { matchAnswer, normalizeType, booleanValue, normalizeBooleanOptions } = require('./matcher.js');

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
        element.matches('.check_answer,.check_answer_dx,.checked,.selected,.on,.cur,.is-checked') ||
        Boolean(element.querySelector('.check_answer,.check_answer_dx,.checked,.selected,.is-checked,[aria-checked="true"]'));
}

function prepareFill(field, value, unsafeWindow) {
    const element = field.element;
    if (!element || element.disabled || element.readOnly) return null;
    if (field.kind === 'editor') {
        const editor = field.id && unsafeWindow?.UE?.getEditor?.(field.id);
        if (typeof editor?.setContent === 'function') return () => editor.setContent(escapeHtml(value).replace(/\r?\n/g, '<br>'));
        return null;
    }
    if (field.kind === 'contenteditable') return () => { element.textContent = value; emitChanges(element); };
    return () => { element.value = value; emitChanges(element); };
}

function applyAnswer(question, answer, { unsafeWindow, answerFormat = 'text' } = {}) {
    const match = matchAnswer(question, answer, { answerFormat });
    if (!match.matched) return { ...match, applied: false };
    const host = unsafeWindow || question.element?.ownerDocument?.defaultView;
    try {
        if (normalizeType(question.type) === 'fill') {
            const writes = question.fields.map((field, index) => prepareFill(field, match.values[index], host));
            if (writes.some(write => !write)) return { ...match, applied: false, reason: 'unavailable-editor' };
            writes.forEach(write => write());
            if (question.nativeId && typeof host?.syncAnswer === 'function') host.syncAnswer(question.nativeId, '2');
        } else {
            const choices = question.choices || [];
            const booleanOptions = normalizeBooleanOptions(question);
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
                let judgment = null;
                if (normalizeType(question.type) === 'judge') {
                    const truth = booleanValue(booleanOptions?.[match.indices[0]]?.text || choices[match.indices[0]].text);
                    if (truth === null) return { ...match, applied: false, reason: 'unmatched-judgment' };
                    judgment = truth;
                    value = String(truth);
                }
                question.host.answerInput.value = value;
                choices.forEach((choice, index) => choice.element.classList.toggle('cur', chosen.has(index)));
                emitChanges(question.host.answerInput);
                const stored = question.host.answerInput.value;
                if ((judgment === null ? stored !== value : booleanValue(stored) !== judgment) || choices.some((choice, index) => isSelected(choice) !== chosen.has(index))) {
                    return { ...match, applied: false, reason: 'host-selection-unconfirmed' };
                }
                return { ...match, applied: true };
            }
            choices.forEach((choice, index) => {
                const selected = isSelected(choice);
                const desired = chosen.has(index);
                if ((desired && !selected) || (multiple && selected && !desired)) (choice.input || choice.element).click();
            });
            if (choices.some((choice, index) => isSelected(choice) !== chosen.has(index))) {
                return { ...match, applied: false, reason: 'host-selection-unconfirmed' };
            }
            if (question.host?.kind === 'modern-chapter') {
                const expected = match.indices.map(index => choices[index].letter).sort().join('');
                const actual = question.host.answerInput?.value?.replace(/[\s,，、]/g, '').toUpperCase().split('').sort().join('');
                const actualValue = question.host.answerInput?.value;
                const truth = booleanOptions?.[match.indices[0]]?.truth;
                const nativeJudgment = normalizeType(question.type) === 'judge' && truth !== undefined && booleanValue(actualValue) === truth;
                if (!nativeJudgment && (!expected || expected !== actual)) return { ...match, applied: false, reason: 'host-selection-unconfirmed' };
            }
        }
        return { ...match, applied: true };
    } catch (_) {
        return { ...match, applied: false, reason: 'host-write-failed' };
    }
}

module.exports = { applyAnswer, escapeHtml };
