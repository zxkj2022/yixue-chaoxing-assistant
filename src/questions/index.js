'use strict';

const { readQuestions, collectQuestions } = require('./reader.js');
const { matchAnswer } = require('./matcher.js');
const { applyAnswer } = require('./writer.js');

function createQuestionWorkflow({ bank, settings, transport, unsafeWindow, onLog, waitIfPaused } = {}) {
    void transport;
    const log = (message, level = 'info') => { if (typeof onLog === 'function') onLog(message, level); };
    let running = null;

    async function execute(document, { signal, useAi, apply = true } = {}) {
        const questions = readQuestions(document);
        const results = [];
        const ai = useAi ?? settings?.get?.('doAI', false) ?? false;
        let stopped = false;
        if (typeof bank?.search !== 'function') throw new TypeError('A question-bank search client is required.');
        if (typeof bank.getToken === 'function' && !bank.getToken()) {
            log('请先连接题库并保存有效 Token。', 'warn');
            return { total: questions.length, answered: 0, accuracy: 0, results, stopped: true };
        }
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
            let response;
            try {
                response = await bank.search({ title: question.title, options: question.options.slice(), type: question.type, use_ai: ai === true });
                if (signal?.aborted) { stopped = true; break; }
                const successful = Number(response?.code) === 1;
                const answer = successful ? response.data : '';
                const matched = successful ? matchAnswer(question, answer) : { matched: false, reason: 'not-found' };
                const outcome = matched.matched && apply ? applyAnswer(question, answer, { unsafeWindow }) : { ...matched, applied: false };
                results.push({ id: question.id, matched: outcome.matched, answer, applied: outcome.applied, reason: outcome.reason || '', fatal: response?.fatal === true });
                log(outcome.matched ? '题目 ' + question.id + (outcome.applied ? ' 已填写参考答案。' : ' 已找到参考答案。') : '题目 ' + question.id + ' 未匹配到完整答案。', outcome.matched ? 'info' : 'warn');
                if (response?.fatal) { stopped = true; log(response.msg || '题库已停止查询，请检查账户或额度。', 'warn'); break; }
            } catch (_) {
                results.push({ id: question.id, matched: false, answer: '', applied: false, reason: 'search-failed' });
                log('题目 ' + question.id + ' 查询失败。', 'warn');
            } finally {
                try { await bank.refreshBalance?.(); } catch (_) { /* A free balance failure does not invalidate an answer. */ }
            }
        }
        const answered = results.filter(result => result.matched && (!apply || result.applied)).length;
        return { total: questions.length, answered, accuracy: questions.length ? answered / questions.length * 100 : 0, results, stopped };
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
