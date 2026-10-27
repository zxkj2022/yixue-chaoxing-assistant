'use strict';

const { readQuestions, collectQuestions, isReviewDocument, waitForQuestions, questionsReady } = require('./reader.js');
const { matchAnswer, isBooleanChoice } = require('./matcher.js');
const { applyAnswer } = require('./writer.js');
const { delay, abortError } = require('../core/primitives.js');

function waitForResult(promise, signal) {
    if (!signal) return Promise.resolve(promise);
    return new Promise((resolve, reject) => {
        const cleanup = () => signal.removeEventListener('abort', cancel);
        const cancel = () => { cleanup(); reject(abortError()); };
        signal.addEventListener('abort', cancel, { once: true });
        Promise.resolve(promise).then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
        if (signal.aborted) cancel();
    });
}

function createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog, waitIfPaused, onCollect, wait = delay, now = Date.now } = {}) {
    void transport;
    const log = (message, level = 'info') => { if (typeof onLog === 'function') onLog(message, level); };
    let running = null;
    let lastQueryEndedAt = null, queryDelay = 2000, queryFailures = 0;

    async function execute(document, { signal, useAi, apply = true } = {}) {
        let questions = readQuestions(document);
        const results = [];
        let stopped = false;
        const collectReview = async () => {
            try { await onCollect?.(document); } catch { /* Keep review pages available when collection is offline. */ }
            return { total: questions.length, matched: 0, answered: 0, accuracy: 0, results, stopped: Boolean(signal?.aborted), review: true };
        };
        if (signal?.aborted) return { total: questions.length, matched: 0, answered: 0, accuracy: 0, results, stopped: true };
        if (isReviewDocument(document)) return collectReview();
        if (typeof bank?.search !== 'function') throw new TypeError('A question-bank search client is required.');
        if (typeof bank.getToken === 'function' && !bank.getToken()) {
            log('请先连接题库并保存有效 Token。', 'warn');
            return { total: questions.length, answered: 0, accuracy: 0, results, stopped: true };
        }
        if (!questionsReady(questions) && !signal?.aborted) {
            try { questions = await waitForQuestions(document, { signal }); }
            catch (error) {
                if (error?.name !== 'AbortError') throw error;
                return { total: 0, answered: 0, accuracy: 0, results, stopped: true };
            }
        }
        if (signal?.aborted) return { total: questions.length, answered: 0, accuracy: 0, results, stopped: true };
        if (questions.some(question => question.encryptedFont)) {
            try { questions = await waitForQuestions(document, { signal, timeoutMs: 1500, settleMs: 75, requireDecoded: true }); }
            catch (error) {
                if (error?.name === 'AbortError') return { total: questions.length, answered: 0, accuracy: 0, results, stopped: true };
                questions = readQuestions(document);
            }
        }
        if (isReviewDocument(document)) return collectReview();
        // Start collection alongside answering; retain the page snapshot until it is sent.
        let collection;
        try { collection = Promise.resolve(onCollect?.(document)).catch(() => {}); } catch { collection = Promise.resolve(); }
        for (const question of questions) {
            if (signal?.aborted) { stopped = true; break; }
            if (typeof waitIfPaused === 'function') {
                try { await waitIfPaused(signal); }
                catch (error) {
                    if (signal?.aborted || error?.name === 'AbortError') { stopped = true; break; }
                    throw error;
                }
            }
            if (signal?.aborted) { stopped = true; break; }
            if (question.encryptedFont) {
                results.push({ id: question.id, matched: false, answer: '', applied: false, reason: 'encrypted-font', fatal: false });
                log('题目 ' + question.id + '：加密字体未还原，已跳过查询；页面字体可能尚未加载或当前字形不受支持，请重新加载题目后重试。', 'warn');
                continue;
            }
            const cooldown = lastQueryEndedAt === null ? 0 : Math.max(0, queryDelay - (now() - lastQueryEndedAt));
            if (cooldown) {
                try {
                    await wait(cooldown, signal);
                    await waitIfPaused?.(signal);
                } catch (error) {
                    if (signal?.aborted || error?.name === 'AbortError') { stopped = true; break; }
                    throw error;
                }
            }
            if (signal?.aborted) { stopped = true; break; }
            let response;
            try {
                const ai = useAi ?? settings?.get?.('doAI', false) ?? false;
                response = await bank.search({ title: question.title, options: question.options.slice(), type: isBooleanChoice(question) ? 'judge' : question.type, use_ai: ai === true }, { signal });
                const queryFailed = Number(response?.code) !== 1 && response?.reason !== 'not-found';
                queryFailures = queryFailed ? queryFailures + 1 : 0;
                queryDelay = queryFailed ? Math.min(60000, 5000 * 2 ** (queryFailures - 1)) : 2000;
                if (signal?.aborted) { stopped = true; break; }
                const successful = Number(response?.code) === 1;
                const answer = successful ? response.data : '';
                const answerFormat = response?.answer_format || 'text';
                const matched = successful ? matchAnswer(question, answer, { answerFormat }) : { matched: false, reason: response?.reason || 'not-found' };
                const outcome = matched.matched && apply ? applyAnswer(question, answer, { unsafeWindow, answerFormat }) : { ...matched, applied: false };
                results.push({ id: question.id, hit: successful, matched: outcome.matched, answer, answer_format: answerFormat, applied: outcome.applied, reason: outcome.reason || '', fatal: response?.fatal === true, analysis: typeof response?.analysis === 'string' ? response.analysis : '', metadata: response?.metadata ? { ...response.metadata } : {} });
                const reasons = { 'empty-answer': '参考答案为空', 'blank-count': '参考答案数量与填空数量不符', 'unsupported-type': '暂不支持此题型', 'answer-count': '参考答案数量与题型不符', 'ambiguous-option': '存在同名选项，无法唯一确定答案', 'unmatched-option': '参考答案与当前选项不符' };
                const failureMessage = !successful ? response?.msg || '题库未返回参考答案' : '题库已命中，' + (reasons[outcome.reason] || '尚未确认填写') + '，请人工核对。';
                const answerKind = response?.metadata?.is_ai === true || response?.msg === 'ai' ? 'AI 参考答案' : '参考答案';
                const aiNotice = answerKind === 'AI 参考答案' ? '请核实 AI 参考结果。' : '';
                if (successful && !outcome.applied && apply) log('题目 ' + question.id + ' 的' + (answerFormat === 'letters' ? '上游选项' : answerKind) + '：' + String(answer), 'info');
                if (successful && !outcome.matched && question.choices.length) {
                    log('题目 ' + question.id + ' 的当前选项：' + question.choices.map((choice, index) => (choice.letter || String.fromCharCode(65 + index)) + ' ' + choice.text.slice(0, 1000)).join('；'), 'warn');
                }
                log(outcome.matched ? '题目 ' + question.id + (outcome.applied ? ' 已填写' + answerKind + '。' : apply ? ' 已找到' + answerKind + '，但未确认写入，请人工核对。' : ' 已找到' + answerKind + '。') + aiNotice : '题目 ' + question.id + '：' + failureMessage, outcome.matched && (!apply || outcome.applied) ? 'info' : 'warn');
                if (response?.fatal) { stopped = true; log(response.msg || '题库已停止查询，请检查账户或额度。', 'warn'); break; }
            } catch (error) {
                if (signal?.aborted || error?.name === 'AbortError') { stopped = true; break; }
                queryFailures++;
                queryDelay = Math.min(60000, 5000 * 2 ** (queryFailures - 1));
                results.push({ id: question.id, matched: false, answer: '', applied: false, reason: 'search-failed' });
                log('题目 ' + question.id + ' 查询失败。', 'warn');
            } finally {
                try { if (!signal?.aborted) await waitForResult(bank.refreshBalance?.(), signal); } catch (_) { /* A free balance failure does not invalidate an answer. */ }
                lastQueryEndedAt = now();
            }
        }
        if (!signal?.aborted) {
            try { await waitForResult(collection, signal); }
            catch (error) { if (signal?.aborted || error?.name === 'AbortError') stopped = true; else throw error; }
        }
        if (signal?.aborted) stopped = true;
        const answered = results.filter(result => result.matched && (!apply || result.applied)).length;
        return { total: questions.length, matched: results.filter(result => result.hit).length, answered, accuracy: questions.length ? answered / questions.length * 100 : 0, results, stopped };
    }

    return {
        read: readQuestions,
        collect: collectQuestions,
        run(document, options) {
            if (running) return running;
            running = execute(document, options).finally(() => { running = null; });
            return running;
        },
    };
}

module.exports = { createQuestionWorkflow, readQuestions, applyAnswer, collectQuestions };
