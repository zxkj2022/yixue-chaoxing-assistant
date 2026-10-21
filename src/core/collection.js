'use strict';
const digest = require('./md5');
function createCollection({ bank, store, collect, document, hostname, confirm, notify }) {
    const keys = { token: 'yixueSubmissionToken', consent: 'yixueSubmissionConsent', seen: 'yixueSubmissionSeen' };
    let generation = 0, flight;
    const enabled = () => store.read(keys.consent, false) === true && /^sub_[\w-]+$/.test(store.read(keys.token, ''));
    async function send() {
        if (!enabled()) return;
        if (flight) return flight;
        const epoch = generation, origin = bank.base(), token = store.read(keys.token, '');
        const questions = collect(document).slice(0, 100);
        if (!questions.length) return;
        const fingerprint = hostname + ':' + digest(JSON.stringify(questions));
        if (store.read(keys.seen, '') === fingerprint) return;
        const task = (async () => {
            const response = await bank.submitQuestions(token, { consent: true, source_host: hostname, questions }, 'page-' + digest(fingerprint));
            if (epoch !== generation || !enabled() || bank.base() !== origin || store.read(keys.token, '') !== token) return;
            if (response.status === 201) store.write(keys.seen, fingerprint);
            else if (response.status === 401) disable(false);
        })();
        flight = task;
        try { await task; } finally { if (flight === task) flight = null; }
    }
    async function enable() {
        if (!confirm('启用后会上传题干、选项和题目资源，不上传答案、整页 HTML、Cookie 或隐藏表单。是否授权自动采集？')) return;
        const epoch = ++generation, origin = bank.base(), identity = bank.getToken();
        if (!identity) { notify('请先填写题库 Token，再启用题目采集。'); return; }
        let token = store.read(keys.token, '');
        if (!/^sub_[\w-]+$/.test(token)) {
            const response = await bank.provisionSubmission();
            if (epoch !== generation || bank.base() !== origin || bank.getToken() !== identity) return;
            if (response.status !== 200 || !/^sub_[\w-]+$/.test(response.body?.token || '')) { notify('采集授权申请失败，请检查题库账户后重试。'); return; }
            token = response.body.token;
        }
        store.write(keys.token, token); store.write(keys.consent, true);
        await send();
    }
    function disable(announce = true) {
        generation++;
        store.write(keys.consent, false); store.write(keys.token, ''); store.write(keys.seen, '');
        if (announce) notify('自动采集已关闭，采集 Token 已清除。');
    }
    return { enabled, enable, disable, send };
}
module.exports = { createCollection };
