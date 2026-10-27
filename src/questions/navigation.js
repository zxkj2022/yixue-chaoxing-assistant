'use strict';

function questionFingerprint(questions) {
    return JSON.stringify(questions.map(question => ({
        id: question.id,
        heading: question.element?.querySelector('.mark_name,.Py-m1-title,h3')?.textContent?.replace(/\s+/g, ' ').trim() || '',
        title: question.title,
        type: question.type,
        options: question.options,
        blanks: question.fields?.length || 0,
    })));
}

function nextQuestionButton(document) {
    return Array.from(document.querySelectorAll('button,a,input[type="button"],input[type="submit"],[role="button"],[onclick]')).find(element => {
        const text = (element.textContent || element.value || element.getAttribute('aria-label') || '').replace(/\s+/g, '');
        if (!/^(?:下一题|下一个)[>›»→]?$/.test(text)) return false;
        if (element.disabled || element.getAttribute('aria-disabled') === 'true' || element.closest('[hidden],[aria-hidden="true"]')) return false;
        if (!element.getClientRects().length) return false;
        const style = document.defaultView?.getComputedStyle(element);
        return style?.display !== 'none' && style?.visibility !== 'hidden';
    });
}

function waitForChangedQuestions(workflow, document, previous, { signal, timeoutMs, settleMs }) {
    return new Promise(resolve => {
        const window = document.defaultView;
        let settled = false;
        let candidate = '';
        let settleTimer;
        let timeout;
        let observer;
        function finish(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout); clearTimeout(settleTimer);
            observer?.disconnect();
            signal?.removeEventListener('abort', abort);
            resolve(value);
        }
        function abort() { finish(null); }
        function check() {
            if (signal?.aborted) return abort();
            const questions = workflow.read(document);
            const ready = questions.length && questions.every(question => question.type === 'fill' ? question.fields?.length : question.choices?.length);
            const fingerprint = questionFingerprint(questions);
            if (!ready || fingerprint === previous) {
                candidate = ''; clearTimeout(settleTimer); return;
            }
            if (fingerprint === candidate) return;
            candidate = fingerprint;
            clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                const current = workflow.read(document);
                if (questionFingerprint(current) === candidate) finish(current);
                else check();
            }, settleMs);
        }
        signal?.addEventListener('abort', abort, { once: true });
        if (window?.MutationObserver) {
            observer = new window.MutationObserver(check);
            observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
        }
        timeout = setTimeout(() => finish(null), timeoutMs);
        check();
    });
}

async function runQuestionPages(workflow, document, { signal, useAi, onPage, waitIfPaused, timeoutMs = 5000, settleMs = 100, maxPages = 200 } = {}) {
    const combined = { total: 0, matched: 0, answered: 0, accuracy: 0, results: [], stopped: false, pages: 0 };
    const seen = new Set();
    for (let index = 0; index < maxPages; index++) {
        if (signal?.aborted) { combined.stopped = true; break; }
        let questions = workflow.read(document);
        if (!questions.length && index === 0) {
            questions = await waitForChangedQuestions(workflow, document, questionFingerprint([]), { signal, timeoutMs, settleMs });
            if (!questions || signal?.aborted) { combined.stopped = true; break; }
        }
        const fingerprint = questionFingerprint(questions);
        if (!questions.length || seen.has(fingerprint)) break;
        seen.add(fingerprint);
        const result = await workflow.run(document, { signal, useAi, apply: true });
        combined.total += result.total;
        combined.matched += result.matched || 0;
        combined.answered += result.answered;
        combined.results.push(...result.results);
        combined.pages++;
        combined.accuracy = combined.total ? combined.answered / combined.total * 100 : 0;
        combined.stopped = Boolean(result.stopped || signal?.aborted);
        onPage?.(combined);
        const complete = result.total > 0 && result.answered === result.total && result.results.length === result.total && result.results.every(item => item.matched && item.applied);
        if (combined.stopped || !complete) break;
        try { await waitIfPaused?.(signal); }
        catch (error) {
            if (signal?.aborted || error?.name === 'AbortError') { combined.stopped = true; break; }
            throw error;
        }
        if (signal?.aborted) { combined.stopped = true; break; }
        const next = nextQuestionButton(document);
        if (!next) break;
        if (index + 1 >= maxPages) { combined.stopped = true; break; }
        next.click();
        const changed = await waitForChangedQuestions(workflow, document, fingerprint, { signal, timeoutMs, settleMs });
        if (!changed || signal?.aborted) { combined.stopped = true; break; }
        if (seen.has(questionFingerprint(changed))) { combined.stopped = true; break; }
    }
    return combined;
}

module.exports = { runQuestionPages, questionFingerprint, nextQuestionButton };
