'use strict';
const { abortError } = require('../core/primitives');
const { readQuestions } = require('../questions/reader');

const pending = new WeakMap();
const isPreview = document => /\/exam\/preview\/?$/.test(new URL(document.URL).pathname);
const restricted = document => Array.from(document.querySelectorAll('.mark_info,[data-exam-preview-policy]')).some(node => /不允许整卷预览|禁止整卷预览|不支持整卷预览/.test(node.textContent.replace(/\s/g, '')));
function previewButton(document) {
    return Array.from(document.querySelectorAll('button,a,input[type="button"],[role="button"]')).find(node => {
        if (node.closest('#yixue-ui-root,[hidden],[aria-hidden="true"],.TiMu,.noSplitBx,.questionLi,[data-question-id],.answerBg,.optionCon,.answerList,.Zy_ulTop,.stem_answer') || node.disabled || node.getAttribute('aria-disabled') === 'true') return false;
        const label = (node.textContent || node.value || node.getAttribute('aria-label') || '').replace(/\s/g, '');
        if (!/^(?:整卷预览|预览整卷)$/.test(label) || !node.getClientRects().length) return false;
        const style = document.defaultView.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function waitFor(document, check, { signal, timeoutMs }) {
    return new Promise((resolve, reject) => {
        let timer, observer, finished = false;
        const finish = (error, result) => {
            if (finished) return;
            finished = true; clearTimeout(timer); observer?.disconnect(); signal?.removeEventListener('abort', cancel);
            error ? reject(error) : resolve(result);
        };
        const cancel = () => finish(signal?.reason || abortError());
        const inspect = () => { try { const value = check(); if (value) finish(null, value); } catch (error) { finish(error); } };
        if (signal?.aborted) { cancel(); return; }
        signal?.addEventListener('abort', cancel, { once: true });
        observer = new document.defaultView.MutationObserver(inspect);
        observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
        timer = setTimeout(() => finish(null, null), timeoutMs);
        inspect();
    });
}

function prepareExamPreview(document, { signal, timeoutMs = 5000, log = () => {} } = {}) {
    if (pending.has(document)) return pending.get(document);
    const operation = (async () => {
        if (signal?.aborted) throw signal.reason || abortError();
        if (isPreview(document)) return { mode: 'preview', switched: false };
        const state = await waitFor(document, () => {
            if (isPreview(document)) return { mode: 'preview', switched: false };
            if (restricted(document)) return { mode: 'single', switched: false };
            const button = previewButton(document);
            return button ? { button } : null;
        }, { signal, timeoutMs });
        if (!state?.button) {
            if (state?.mode === 'preview') return state;
            log(state ? '平台不允许整卷预览，按单题模式继续。' : '未找到可用的整卷预览入口，按当前题目模式继续。', 'info');
            return { mode: 'single', switched: false };
        }
        const before = readQuestions(document).length;
        log('正在切换到整卷预览，等待试卷加载。', 'info');
        state.button.click();
        const loaded = await waitFor(document, () => {
            if (isPreview(document) || readQuestions(document).length > Math.max(1, before)) return { mode: 'preview', switched: true };
            return null;
        }, { signal, timeoutMs });
        if (!loaded) {
            log('整卷预览切换尚未确认，请在考试页面核对后重新查询。', 'warning');
            return { mode: 'unavailable', switched: false };
        }
        log('已进入整卷预览，开始读取试卷。', 'info');
        return loaded;
    })().finally(() => { pending.delete(document); });
    pending.set(document, operation);
    return operation;
}

module.exports = { prepareExamPreview };
