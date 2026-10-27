'use strict';

function createCourseActivity({ window, context, onConflict } = {}) {
    const uid = String(context?.uid || '').trim();
    const courseId = String(context?.courseId || '').trim();
    const classId = String(context?.classId || '').trim();
    const key = 'yixue-active-course:' + encodeURIComponent(uid);
    const lockKey = 'yixue-course-run:' + JSON.stringify([uid, courseId, classId]);
    const owner = window?.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    const expiryMs = 35000;
    const now = () => window?.Date?.now?.() ?? Date.now();
    let active = false, timer = null;
    const warned = new Set();

    function decode(raw) {
        try {
            const state = JSON.parse(raw);
            if (state?.version !== 1 || !Array.isArray(state.leases)) return [];
            return state.leases.filter(lease => typeof lease?.owner === 'string' && typeof lease.courseId === 'string' &&
                typeof lease.classId === 'string' && Number.isFinite(lease.at) && lease.at <= now() + 5000 && now() - lease.at < expiryMs).slice(-128);
        } catch (_) { return []; }
    }
    function report(leases) {
        const peers = leases.filter(lease => lease.owner !== owner);
        const present = new Set(peers.map(lease => lease.owner));
        for (const peer of peers) {
            if (warned.has(peer.owner)) continue;
            warned.add(peer.owner);
            try { onConflict?.({ courseId: peer.courseId, classId: peer.classId, updatedAt: peer.at, sameCourse: sameCourse(peer) }); } catch (_) {}
        }
        for (const previous of warned) if (!present.has(previous)) warned.delete(previous);
    }
    function sameCourse(lease) { return lease.owner !== owner && lease.courseId === courseId && lease.classId === classId; }
    function duplicate() {
        if (!window || !uid || !courseId) return false;
        try { return decode(window.localStorage.getItem(key)).some(sameCourse); }
        catch (_) { return false; }
    }
    function duplicateError() {
        return Object.assign(new Error('同一课程已在其他标签页运行，请先停止该标签页的任务。'), { retryable: false });
    }
    function heartbeat() {
        if (!active) return false;
        try {
            const leases = decode(window.localStorage.getItem(key));
            report(leases);
            const others = leases.filter(lease => lease.owner !== owner);
            others.push({ owner, courseId, classId, at: now() });
            window.localStorage.setItem(key, JSON.stringify({ version: 1, leases: others }));
            return true;
        } catch (_) { return false; }
    }
    function changed(event) {
        if (active && event.key === key) report(decode(event.newValue));
    }
    function destroy() {
        if (!active) return;
        active = false;
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        window.removeEventListener('storage', changed);
        window.removeEventListener('pagehide', destroy);
        window.removeEventListener('beforeunload', destroy);
        try {
            const leases = decode(window.localStorage.getItem(key)).filter(lease => lease.owner !== owner);
            if (leases.length) window.localStorage.setItem(key, JSON.stringify({ version: 1, leases }));
            else window.localStorage.removeItem(key);
        } catch (_) {}
        warned.clear();
    }
    function start() {
        if (active) return true;
        if (!window || !uid || !courseId) return false;
        try {
            const leases = decode(window.localStorage.getItem(key));
            report(leases);
            if (leases.some(sameCourse)) return false;
        } catch (_) { return false; }
        active = true;
        if (!heartbeat()) { active = false; return false; }
        window.addEventListener('storage', changed);
        window.addEventListener('pagehide', destroy);
        window.addEventListener('beforeunload', destroy);
        timer = window.setInterval(() => { if (!heartbeat()) destroy(); }, 10000);
        return true;
    }
    async function runExclusive(operation) {
        const execute = async () => {
            if (duplicate()) throw duplicateError();
            // Also support callers that have not registered an activity lease.
            const startedHere = !active && start();
            if (!startedHere && duplicate()) throw duplicateError();
            try { return await operation(); }
            finally { if (startedHere) destroy(); }
        };
        let locks;
        try { locks = window?.navigator?.locks; } catch (_) {}
        if (courseId && typeof locks?.request === 'function') {
            // The browser owns this lock until the entire operation settles,
            // including background timer delays and rejected task promises.
            return locks.request(lockKey, { ifAvailable: true }, lock => {
                if (!lock) throw duplicateError();
                return execute();
            });
        }
        return execute();
    }
    return { start, destroy, duplicate, runExclusive };
}

module.exports = { createCourseActivity };
