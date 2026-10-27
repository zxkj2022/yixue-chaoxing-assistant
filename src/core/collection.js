'use strict';
const digest = require('./md5');
const { delay } = require('./primitives');

function createCollection({ bank, store, collect, document, hostname, now = () => Date.now(), wait = delay, onStatus }) {
    const keys = { token: 'yixueSubmissionToken', owner: 'yixueSubmissionOwner', seen: 'yixueSubmissionSeen', history: 'yixueSubmissionHistory', retry: 'yixueSubmissionRetry', provision: 'yixueSubmissionProvision', next: 'yixueSubmissionNext' };
    const controller = new AbortController(), flights = new Map();
    let tail = Promise.resolve();
    const readTime = (key, owner) => { const value = store.read(key, null); return value?.owner === owner && Number.isFinite(value.until) ? value.until : 0; };
    const recordTime = (key, owner, milliseconds) => store.write(key, { owner, until: now() + milliseconds });
    const history = () => { const value = store.read(keys.history, []); return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(-200) : []; };
    const report = event => { try { onStatus?.(event); } catch { /* A UI callback cannot invalidate an accepted batch. */ } };
    function enqueue(body) {
        const origin = bank.base(), identity = bank.getToken(), owner = digest(origin + '\n' + identity);
        const fingerprint = digest(JSON.stringify(body)), marker = owner + ':' + fingerprint;
        const current = () => !controller.signal.aborted && bank.base() === origin && bank.getToken() === identity;
        if (flights.has(marker)) return flights.get(marker);
        const task = tail.then(async () => {
            if (!current() || history().includes(marker) || now() < readTime(keys.retry, owner)) return;
            if (store.read(keys.owner, '') !== owner) {
                store.write(keys.token, '');
                store.write(keys.owner, owner);
            }
            let token = store.read(keys.token, '');
            if (!/^sub_[\w-]+$/.test(token)) {
                // A short shared lease prevents several course frames provisioning at once.
                if (now() < readTime(keys.provision, owner)) return;
                recordTime(keys.provision, owner, 20000);
                const response = await bank.provisionSubmission();
                if (!current()) return;
                store.write(keys.provision, null);
                if (response.status !== 200 || !/^sub_[\w-]+$/.test(response.body?.token || '')) {
                    recordTime(keys.retry, owner, response.status === 429 ? 3600000 : 60000);
                    return;
                }
                token = response.body.token;
                store.write(keys.token, token);
                store.write('yixueSubmissionConsent', true);
            }
            const launchAt = Math.max(now(), readTime(keys.next, owner));
            store.write(keys.next, { owner, until: launchAt + 3500 });
            const pause = launchAt - now();
            if (pause > 0) await wait(pause, controller.signal);
            if (!current() || history().includes(marker) || store.read(keys.token, '') !== token) return;
            const response = await bank.submitQuestions(token, body, 'page-' + fingerprint);
            if (!current() || store.read(keys.token, '') !== token) return;
            const answerCount = body.questions.filter(item => item.answer).length;
            const confirmed = !answerCount || (response.body?.answer_collection_version === '1' && response.body?.accepted_answer_count === answerCount);
            if (response.status === 201 && confirmed) {
                store.write(keys.seen, marker);
                store.write(keys.history, [...history().filter(item => item !== marker), marker].slice(-200));
                if (answerCount) report({ state: 'answers-accepted', answers: answerCount });
            } else {
                if (response.status === 401) store.write(keys.token, '');
                recordTime(keys.retry, owner, [403, 422].includes(response.status) && !answerCount ? 3600000 : 60000);
                if (answerCount) report({ state: response.status === 422 || (response.status === 201 && !confirmed) ? 'answers-unsupported' : 'upload-failed' });
            }
        }).catch(() => { if (current()) recordTime(keys.retry, owner, 60000); }).finally(() => flights.delete(marker));
        flights.set(marker, task);
        tail = task;
        return task;
    }
    function send(target = document) {
        if (controller.signal.aborted || !bank.getToken()) return Promise.resolve();
        const sourceHost = target.location?.hostname || hostname;
        // Snapshot before queuing: a paginated exam may change its DOM while uploading.
        const questions = collect(target).filter(item => typeof item.title === 'string' && item.title.trim() && item.title.length <= 5000 && Array.isArray(item.options) && item.options.length <= 50).map(item => ({
            title: item.title, options: item.options.map(String), type: String(item.type || 'unknown').slice(0, 40),
            ...(['published', 'graded_correct'].includes(item.answer_source) && item.answer_format === 'text' && typeof item.answer === 'string' && item.answer.trim() && item.answer.length <= 10000
                ? { answer: item.answer.trim(), answer_format: 'text', answer_source: item.answer_source, analysis: typeof item.analysis === 'string' ? item.analysis.trim().slice(0, 20000) : '' } : {}),
            ...(item.assets?.length ? { assets: item.assets.slice(0, 20).flatMap(asset => {
                const alt = String(asset.alt || '').slice(0, 300);
                if (asset.kind === 'formula' && typeof asset.formula === 'string') return [{ kind: 'formula', formula: asset.formula.slice(0, 2000), alt }];
                if (asset.kind !== 'image') return [];
                try {
                    const url = new URL(asset.url);
                    if (url.protocol !== 'https:' || url.username || url.password || !(url.hostname === sourceHost || /\.(?:chaoxing\.com|xueyinonline\.com)$/.test(url.hostname))) return [];
                    url.search = ''; url.hash = '';
                    return url.href.length <= 2000 ? [{ kind: 'image', url: url.href, alt }] : [];
                } catch { return []; }
            }) } : {}),
        }));
        const tasks = [];
        for (let index = 0; index < questions.length; index += 100) {
            const batch = questions.slice(index, index + 100);
            tasks.push(enqueue({ consent: true, source_host: sourceHost, ...(batch.some(item => item.answer) ? { answer_collection_version: '1' } : {}), questions: batch }));
        }
        return Promise.all(tasks);
    }
    return { send, dispose: () => controller.abort() };
}
module.exports = { createCollection };
